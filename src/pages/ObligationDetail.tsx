import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import NotificationManager from "@/components/NotificationManager";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getObligation,
  getObligationHistory,
  getObligationFiles,
  updateObligationStatus,
  updateObligationNotes,
  updateObligationDueDate,
  renewObligation,
  updateObligationRecurrence,
  uploadObligationFile,
  deleteObligationFile,
  getSignedFileUrl,
  Obligation,
  ObligationHistory,
  ObligationFile,
  categoryLabels,
  statusLabels,
  recurrenceLabels,
  ObligationStatus
} from "@/services/obligationService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Calendar, User, Clock, FileUp, Trash2, Download, File, Loader2, RefreshCw, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ObligationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [obligation, setObligation] = useState<Obligation | null>(null);
  const [history, setHistory] = useState<ObligationHistory[]>([]);
  const [files, setFiles] = useState<ObligationFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<ObligationStatus>('al_dia');
  const [note, setNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [isChangingDate, setIsChangingDate] = useState(false);
  const [newDueDate, setNewDueDate] = useState<Date>();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      loadData();
    }
  }, [user, id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [obligationData, historyData, filesData] = await Promise.all([
        getObligation(id!),
        getObligationHistory(id!),
        getObligationFiles(id!)
      ]);

      if (!obligationData) {
        toast.error("Obligación no encontrada");
        navigate('/dashboard');
        return;
      }

      setObligation(obligationData);
      setStatus(obligationData.status);
      setHistory(historyData);
      setFiles(filesData);
    } catch (error) {
      console.error('Error loading obligation:', error);
      toast.error("Error al cargar la obligación");
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: ObligationStatus) => {
    if (!obligation || !user || newStatus === status) return;

    setIsUpdatingStatus(true);
    try {
      await updateObligationStatus(obligation.id, newStatus, status, user.id);
      setStatus(newStatus);

      // Confirmación emocional cuando se cambia a "Al día"
      if (newStatus === 'al_dia') {
        toast.success("Listo. Esta obligación quedó cubierta.", {
          duration: 5000,
        });
      } else {
        toast.success(`Estado actualizado a "${statusLabels[newStatus]}"`);
      }

      // Reload history
      const historyData = await getObligationHistory(obligation.id);
      setHistory(historyData);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Error al actualizar el estado");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRenewObligation = async () => {
    if (!obligation || !user || obligation.recurrence === 'none') return;

    setIsRenewing(true);
    try {
      const newDate = await renewObligation(
        obligation.id,
        obligation.recurrence as 'monthly' | 'annual',
        obligation.due_date,
        user.id
      );
      
      toast.success(`Obligación renovada. Nueva fecha: ${format(new Date(newDate), "d 'de' MMMM, yyyy", { locale: es })}`);
      await loadData();
    } catch (error) {
      console.error('Error renewing obligation:', error);
      toast.error("Error al renovar la obligación");
    } finally {
      setIsRenewing(false);
    }
  };

  const handleChangeDueDate = async () => {
    if (!obligation || !user || !newDueDate) return;

    setIsChangingDate(true);
    try {
      const formattedDate = format(newDueDate, 'yyyy-MM-dd');
      await updateObligationDueDate(obligation.id, formattedDate, user.id);
      
      toast.success(`Fecha actualizada a ${format(newDueDate, "d 'de' MMMM, yyyy", { locale: es })}`);
      setNewDueDate(undefined);
      await loadData();
    } catch (error) {
      console.error('Error changing due date:', error);
      toast.error("Error al cambiar la fecha");
    } finally {
      setIsChangingDate(false);
    }
  };

  const handleRecurrenceChange = async (value: 'none' | 'monthly' | 'annual') => {
    if (!obligation) return;

    try {
      await updateObligationRecurrence(obligation.id, value);
      setObligation({ ...obligation, recurrence: value });
      toast.success(`Recurrencia actualizada a "${recurrenceLabels[value]}"`);
    } catch (error) {
      console.error('Error updating recurrence:', error);
      toast.error("Error al actualizar recurrencia");
    }
  };

  const getHumanMessage = (days: number, currentStatus: ObligationStatus): string => {
    if (currentStatus === 'al_dia') {
      return "Todavía estás a tiempo";
    }
    if (days < 0) {
      return "Esta obligación está vencida";
    }
    if (days === 0) {
      return "Atención: vence hoy";
    }
    if (days <= 30) {
      return "Atención: vence pronto";
    }
    return "Todavía estás a tiempo";
  };

  const handleAddNote = async () => {
    if (!note.trim() || !obligation) {
      toast.error("Escribe una nota antes de guardar");
      return;
    }

    setIsSavingNote(true);
    try {
      const existingNotes = obligation.notes || '';
      const timestamp = format(new Date(), "d MMM yyyy, HH:mm", { locale: es });
      const newNote = `[${timestamp}] ${profile?.name || 'Usuario'}: ${note}`;
      const updatedNotes = existingNotes ? `${existingNotes}\n\n${newNote}` : newNote;

      await updateObligationNotes(obligation.id, updatedNotes);
      setObligation({ ...obligation, notes: updatedNotes });
      setNote("");
      toast.success("Nota agregada");
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error("Error al agregar la nota");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !obligation || !user) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo es demasiado grande (máximo 10MB)");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedFile = await uploadObligationFile(obligation.id, file, user.id);
      setFiles([uploadedFile, ...files]);
      toast.success("Archivo subido exitosamente");
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error("Error al subir el archivo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadFile = async (file: ObligationFile) => {
    try {
      const url = await getSignedFileUrl(file.file_path);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error getting file URL:', error);
      toast.error("Error al descargar el archivo");
    }
  };

  const handleDeleteFile = async (file: ObligationFile) => {
    try {
      await deleteObligationFile(file.id, file.file_path);
      setFiles(files.filter(f => f.id !== file.id));
      toast.success("Archivo eliminado");
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error("Error al eliminar el archivo");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !obligation) return null;

  const daysUntilDue = Math.ceil(
    (new Date(obligation.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header
        userName={profile?.name || user.email || 'Usuario'}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </button>

        <div className="space-y-6 animate-fade-in">
          {/* Main Card */}
          <div className="card-elevated p-6 sm:p-8">
            {/* Estado prominente en la parte superior */}
            <div className="flex items-center justify-center mb-6 pb-6 border-b border-border">
              <StatusBadge status={status} size="lg" />
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CategoryIcon category={obligation.category} className="w-6 h-6" />
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {categoryLabels[obligation.category]}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{obligation.name}</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Vencimiento</p>
                  <p className="font-medium text-foreground">
                    {format(new Date(obligation.due_date), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  <p className={cn(
                    "text-xs font-medium mt-1",
                    daysUntilDue < 0 && "text-status-danger",
                    daysUntilDue >= 0 && daysUntilDue <= 30 && "text-status-warning",
                    daysUntilDue > 30 && "text-status-success"
                  )}>
                    {daysUntilDue < 0
                      ? `Vencida hace ${Math.abs(daysUntilDue)} días`
                      : daysUntilDue === 0
                        ? "Vence hoy"
                        : `${daysUntilDue} días restantes`
                    }
                  </p>
                  <p className={cn(
                    "text-sm font-semibold mt-2",
                    daysUntilDue < 0 && "text-status-danger",
                    daysUntilDue >= 0 && daysUntilDue <= 30 && "text-status-warning",
                    daysUntilDue > 30 && "text-status-success"
                  )}>
                    {getHumanMessage(daysUntilDue, status)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Responsable</p>
                  <p className="font-medium text-foreground">{obligation.responsible_name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Date Management & Recurrence */}
          <div className="card-elevated p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Fecha y Recurrencia
            </h2>
            
            <div className="space-y-4">
              {/* Recurrence Badge */}
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Tipo de recurrencia</p>
                  <p className="text-xs text-muted-foreground">
                    {obligation.recurrence === 'none' 
                      ? 'Esta obligación no se renueva automáticamente'
                      : `Se puede renovar ${obligation.recurrence === 'monthly' ? 'cada mes' : 'cada año'}`
                    }
                  </p>
                </div>
                <Select
                  value={obligation.recurrence || 'none'}
                  onValueChange={(value: 'none' | 'monthly' | 'annual') => handleRecurrenceChange(value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <span>🔹</span>
                        Sin recurrencia
                      </div>
                    </SelectItem>
                    <SelectItem value="monthly">
                      <div className="flex items-center gap-2">
                        <span>🔄</span>
                        Mensual
                      </div>
                    </SelectItem>
                    <SelectItem value="annual">
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        Anual
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Renew Button (only if recurrent) */}
              {obligation.recurrence && obligation.recurrence !== 'none' && (
                <Button
                  onClick={handleRenewObligation}
                  disabled={isRenewing}
                  className="w-full"
                  variant="default"
                >
                  {isRenewing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Renovando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Renovar obligación ({obligation.recurrence === 'monthly' ? '+1 mes' : '+1 año'})
                    </>
                  )}
                </Button>
              )}

              {/* Manual Date Change */}
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground mb-2">Cambiar fecha manualmente</p>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !newDueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newDueDate ? format(newDueDate, "PPP", { locale: es }) : "Seleccionar nueva fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={newDueDate}
                        onSelect={setNewDueDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    onClick={handleChangeDueDate}
                    disabled={!newDueDate || isChangingDate}
                    variant="secondary"
                  >
                    {isChangingDate ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Aplicar"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Change Status */}
          <div className="card-elevated p-6">
            <h2 className="font-semibold text-foreground mb-4">Cambiar estado</h2>
            <Select
              value={status}
              onValueChange={(value: ObligationStatus) => handleStatusChange(value)}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="al_dia">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-status-success" />
                    Al día
                  </div>
                </SelectItem>
                <SelectItem value="por_vencer">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-status-warning" />
                    Por vencer
                  </div>
                </SelectItem>
                <SelectItem value="vencida">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-status-danger" />
                    Vencida
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {isUpdatingStatus && (
              <p className="text-sm text-muted-foreground mt-2">Actualizando...</p>
            )}
          </div>

          {/* Notes */}
          <div className="card-elevated p-6">
            <h2 className="font-semibold text-foreground mb-4">Notas</h2>

            {obligation.notes && (
              <div className="bg-secondary/50 rounded-lg p-4 mb-4 text-sm whitespace-pre-wrap">
                {obligation.notes}
              </div>
            )}

            <div className="space-y-3">
              <Textarea
                placeholder="Escribe una nota sobre esta obligación..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleAddNote}
                variant="secondary"
                disabled={isSavingNote}
              >
                {isSavingNote ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Agregar nota"
                )}
              </Button>
            </div>
          </div>

          {/* Files */}
          <div className="card-elevated p-6">
            <h2 className="font-semibold text-foreground mb-4">Archivos de evidencia</h2>

            {/* Uploaded files list */}
            {files.length > 0 && (
              <div className="space-y-2 mb-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">{getFileIcon(file.file_type)}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)} • {format(new Date(file.created_at), "d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFile(file)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload area */}
            <label className={cn(
              "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer",
              "hover:border-primary/50 hover:bg-accent/50 transition-colors",
              isUploading && "pointer-events-none opacity-50"
            )}>
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              ) : (
                <>
                  <FileUp className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click para subir archivo</span>
                  <span className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, Word, Excel (max 10MB)</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
              />
            </label>
          </div>

          {/* Email Notifications */}
          <div className="card-elevated p-6">
            <NotificationManager
              obligationId={obligation.id}
              userEmail={user.email || ''}
              obligationName={obligation.name}
              dueDate={obligation.due_date}
              daysUntilDue={daysUntilDue}
            />
          </div>

          {/* History */}
          <div className="card-elevated p-6">
            <h2 className="font-semibold text-foreground mb-4">Historial de cambios</h2>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay cambios registrados aún</p>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{entry.changed_by_name}</span> cambió el estado
                        {entry.previous_status && (
                          <> de <span className="font-medium">{statusLabels[entry.previous_status]}</span></>
                        )}
                        {' '}a <span className="font-medium">{statusLabels[entry.new_status]}</span>
                      </p>
                      {entry.note && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.note}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ObligationDetail;
