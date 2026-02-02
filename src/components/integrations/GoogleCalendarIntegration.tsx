import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar, Link2, Unlink, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  listGoogleCalendars,
  updateGoogleCalendarSettings,
  disconnectGoogleCalendar,
  syncAllObligations,
  getGoogleCalendarStatus,
} from '@/services/googleCalendarService';

interface GoogleCalendarIntegrationProps {
  isAdmin: boolean;
}

export function GoogleCalendarIntegration({ isAdmin }: GoogleCalendarIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState('primary');
  const [calendars, setCalendars] = useState<{ id: string; summary: string }[]>([]);

  const loadStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const status = await getGoogleCalendarStatus();
      setIsConnected(status.connected);
      if (status.connected) {
        setSyncEnabled(status.sync_enabled || false);
        setSelectedCalendar(status.selected_calendar_id || 'primary');
        // Load calendars
        const cals = await listGoogleCalendars();
        setCalendars(cals);
      }
    } catch (error) {
      console.error('Error loading status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state === 'google-calendar') {
      const redirectUri = `${window.location.origin}/configuracion`;
      
      setIsConnecting(true);
      exchangeGoogleCode(code, redirectUri)
        .then(() => {
          toast.success('¡Google Calendar conectado exitosamente!');
          // Clean URL
          window.history.replaceState({}, '', '/configuracion');
          loadStatus();
        })
        .catch((err) => {
          console.error('Error exchanging code:', err);
          toast.error('Error al conectar Google Calendar');
        })
        .finally(() => {
          setIsConnecting(false);
        });
    }
  }, [loadStatus]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const redirectUri = `${window.location.origin}/configuracion`;
      const authUrl = await getGoogleAuthUrl(redirectUri);
      // Add state parameter for identification
      window.location.href = `${authUrl}&state=google-calendar`;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      toast.error('Error al iniciar conexión');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGoogleCalendar();
      setIsConnected(false);
      setSyncEnabled(false);
      setCalendars([]);
      toast.success('Google Calendar desconectado');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Error al desconectar');
    }
  };

  const handleCalendarChange = async (calendarId: string) => {
    try {
      setSelectedCalendar(calendarId);
      await updateGoogleCalendarSettings(calendarId, syncEnabled);
      toast.success('Calendario actualizado');
    } catch (error) {
      console.error('Error updating calendar:', error);
      toast.error('Error al actualizar calendario');
    }
  };

  const handleSyncToggle = async (enabled: boolean) => {
    try {
      setSyncEnabled(enabled);
      await updateGoogleCalendarSettings(selectedCalendar, enabled);
      toast.success(enabled ? 'Sincronización activada' : 'Sincronización desactivada');
    } catch (error) {
      console.error('Error toggling sync:', error);
      toast.error('Error al cambiar sincronización');
    }
  };

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      const synced = await syncAllObligations();
      toast.success(`${synced} obligaciones sincronizadas`);
    } catch (error) {
      console.error('Error syncing all:', error);
      toast.error('Error al sincronizar obligaciones');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Google Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Sincroniza tus obligaciones con Google Calendar
          </p>
        </div>
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Conecta tu cuenta de Google para visualizar tus obligaciones en Google Calendar.
            La sincronización es solo de ida: IfsinRem → Google Calendar.
          </p>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="gap-2"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            Conectar Google Calendar
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connection status */}
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            Conectado a Google Calendar
          </div>

          {/* Calendar selector */}
          <div className="space-y-2">
            <Label>Calendario destino</Label>
            <Select value={selectedCalendar} onValueChange={handleCalendarChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un calendario" />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((cal) => (
                  <SelectItem key={cal.id} value={cal.id}>
                    {cal.summary}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Las obligaciones se crearán en este calendario
            </p>
          </div>

          {/* Sync toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-sm">Activar sincronización</p>
                <p className="text-xs text-muted-foreground">
                  Sincroniza automáticamente al crear/editar obligaciones
                </p>
              </div>
            </div>
            <Switch
              checked={syncEnabled}
              onCheckedChange={handleSyncToggle}
            />
          </div>

          {/* Sync all button */}
          {syncEnabled && (
            <Button
              variant="outline"
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="gap-2 w-full"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Sincronizar todas las obligaciones
            </Button>
          )}

          {/* Disconnect */}
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleDisconnect}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Unlink className="w-4 h-4" />
              Desconectar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
