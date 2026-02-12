import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Link2, Unlink, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface CalendarOption {
  id: string;
  summary: string;
}

const GoogleCalendarCard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState('primary');
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const callEdgeFunction = useCallback(async (action: string, params: Record<string, unknown> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, ...params }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');
    return data;
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await callEdgeFunction('get-status');
      setIsConnected(data.connected);
      setSyncEnabled(data.sync_enabled || false);
      setSelectedCalendar(data.selected_calendar_id || 'primary');

      if (data.connected) {
        try {
          const calData = await callEdgeFunction('list-calendars');
          setCalendars(calData.calendars || []);
        } catch {
          // Token might be expired
        }
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [callEdgeFunction]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && window.location.pathname === '/configuracion') {
      const exchangeCode = async () => {
        try {
          const redirectUri = `${window.location.origin}/configuracion`;
          await callEdgeFunction('exchange-code', { code, redirectUri });
          toast.success('Google Calendar conectado exitosamente');
          // Clean URL
          window.history.replaceState({}, '', '/configuracion');
          await fetchStatus();
        } catch (err) {
          console.error('Exchange error:', err);
          toast.error('Error al conectar Google Calendar');
          window.history.replaceState({}, '', '/configuracion');
        }
      };
      exchangeCode();
    }
  }, [callEdgeFunction, fetchStatus]);

  const handleConnect = async () => {
    try {
      const redirectUri = `${window.location.origin}/configuracion`;
      const data = await callEdgeFunction('get-auth-url', { redirectUri });
      window.location.href = data.authUrl;
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error al iniciar conexión');
    }
  };

  const handleDisconnect = async () => {
    try {
      await callEdgeFunction('disconnect');
      setIsConnected(false);
      setSyncEnabled(false);
      setCalendars([]);
      toast.success('Google Calendar desconectado');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error al desconectar');
    }
  };

  const handleUpdateSettings = async (calendarId: string, enabled: boolean) => {
    try {
      await callEdgeFunction('update-settings', { calendarId, syncEnabled: enabled });
      setSelectedCalendar(calendarId);
      setSyncEnabled(enabled);
      toast.success('Configuración actualizada');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error al actualizar configuración');
    }
  };

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      const appUrl = window.location.origin;
      const data = await callEdgeFunction('sync-all', { appUrl });
      toast.success(`${data.synced} obligaciones sincronizadas`);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error al sincronizar');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">Google Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Sincronización unidireccional: IfsinRem → Google Calendar
          </p>
        </div>
        {isConnected ? (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Conectado
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <AlertCircle className="w-4 h-4" />
            Desconectado
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Conectá tu cuenta de Google para ver tus obligaciones en Google Calendar. 
            La sincronización es solo de lectura: no se pueden crear ni editar obligaciones desde Calendar.
          </p>
          <Button onClick={handleConnect} className="gap-2">
            <Link2 className="w-4 h-4" />
            Conectar Google Calendar
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {calendars.length > 0 && (
            <div className="space-y-2">
              <Label>Calendario destino</Label>
              <Select
                value={selectedCalendar}
                onValueChange={(val) => handleUpdateSettings(val, syncEnabled)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar calendario" />
                </SelectTrigger>
                <SelectContent>
                  {calendars.map((cal) => (
                    <SelectItem key={cal.id} value={cal.id}>
                      {cal.summary}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Sincronización automática</Label>
              <p className="text-xs text-muted-foreground">
                Sincronizar obligaciones automáticamente al crear o editar
              </p>
            </div>
            <Switch
              checked={syncEnabled}
              onCheckedChange={(checked) => handleUpdateSettings(selectedCalendar, checked)}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSyncAll}
              disabled={!syncEnabled || isSyncing}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar todo'}
            </Button>
            <Button
              onClick={handleDisconnect}
              variant="destructive"
              className="gap-2"
            >
              <Unlink className="w-4 h-4" />
              Desconectar
            </Button>
          </div>

          <p className="text-xs text-muted-foreground border-t pt-3">
            ⚠️ Solo lectura: las obligaciones se reflejan en Calendar pero no se pueden modificar desde ahí.
          </p>
        </div>
      )}
    </Card>
  );
};

export default GoogleCalendarCard;
