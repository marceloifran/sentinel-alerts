import { useState, useRef, useEffect } from "react";
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
  useObligation,
  useObligationHistory,
  useObligationFiles,
  useUpdateObligationStatus,
  useUpdateObligationNotes,
  useUpdateObligationDueDate,
  useRenewObligation,
  useUploadObligationFile,
  useDeleteObligationFile,
  useDeleteObligation,
} from "@/hooks/useObligations";
import {
  getSignedFileUrl,
  categoryLabels,
  statusLabels,
  recurrenceLabels,
  ObligationStatus,
  updateObligationRecurrence,
  renewObligation as renewObligationService,
} from "@/services/obligationService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Calendar, User, Clock, FileUp, Trash2, Download, File, Loader2, RefreshCw, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageSkeleton } from "@/components/skeletons/Skeletons";
import { ErrorState, NotFoundState } from "@/components/ErrorState";

const ObligationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // React Query hooks
  const { data: obligation, isLoading: obligationLoading, error: obligationError, refetch: refetchObligation } = useObligation(id);
  const { data: history = [], refetch: refetchHistory } = useObligationHistory(id);
  const { data: files = [], refetch: refetchFiles } = useObligationFiles(id);

  // Mutations
  const updateStatusMutation = useUpdateObligationStatus();
  const updateNotesMutation = useUpdateObligationNotes();
  const updateDueDateMutation = useUpdateObligationDueDate();
  const renewMutation = useRenewObligation();
  const uploadFileMutation = useUploadObligationFile();
  const deleteFileMutation = useDeleteObligationFile();
  const deleteObligationMutation = useDeleteObligation();

  // Local state
  const [status, setStatus] = useState<ObligationStatus>(obligation?.status || 'al_dia');
  const [note, setNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [isChangingDate, setIsChangingDate] = useState(false);
  const [newDueDate, setNewDueDate] = useState<Date>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Update local state when obligation loads
  useEffect(() => {
    if (obligation) {
      setStatus(obligation.status);
    }
  }, [obligation]);

  const isLoading = authLoading || obligationLoading;

  // Loading state
  if (isLoading) {
    return <PageSkeleton />;
  }

  // Error state
  if (obligationError) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          userName={profile?.name || user?.email || 'Usuario'}
          onLogout={async () => {
            await signOut();
            navigate('/');
          }}
          isAdmin={isAdmin}
          userPlan={profile?.plan}
        />
        <ErrorState
          error={obligationError as Error}
          onRetry={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  // Not found state
  if (!obligation) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          userName={profile?.name || user?.email || 'Usuario'}
          onLogout={async () => {
            await signOut();
            navigate('/');
          }}
          isAdmin={isAdmin}
          userPlan={profile?.plan}
        />
        <NotFoundState
          title="Obligación no encontrada"
          description="La obligación que buscas no existe o fue eliminada"
          onGoBack={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  const handleStatusChange = async (newStatus: ObligationStatus) => {
    if (!obligation || !user || newStatus === status) return;

    const daysUntilDue = Math.ceil(
      (new Date(obligation.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDue < 0 && (newStatus === 'al_dia' || newStatus === 'por_vencer')) {
      toast.error("No puedes marcar como 'Al día' o 'Por Vencer' una obligación que ya venció.");
      return;
    }

    if (daysUntilDue >= 0 && newStatus === 'vencida') {
      toast.error("No puedes marcar como 'Vencida' una obligación que aún no ha vencido.");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await updateStatusMutation.mutateAsync({
        id: obligation.id,
        status: newStatus,
        previousStatus: obligation.status,
        userId: user.id,
      });
      setStatus(newStatus);

      // Confirmación emocional cuando se cambia a "Al día"
      if (newStatus === 'al_dia') {
        toast.success("Listo. Esta obligación quedó cubierta.", {
          duration: 5000,
        });
      } else {
        toast.success(`Estado actualizado a "${statusLabels[newStatus]}"`);
      }

      refetchHistory();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRenewObligation = async () => {
    if (!obligation || !user || obligation.recurrence === 'none') return;

    setIsRenewing(true);
    try {
      const newDate = await renewObligationService(
        obligation.id,
        obligation.recurrence as 'monthly' | 'annual',
        obligation.due_date,
        user.id
      );

      toast.success(`Obligación renovada. Nueva fecha: ${format(new Date(newDate), "d 'de' MMMM, yyyy", { locale: es })}`);
      refetchObligation();
      refetchHistory();
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
      await updateDueDateMutation.mutateAsync({
        id: obligation.id,
        dueDate: formattedDate,
        userId: user.id,
      });

      toast.success(`Fecha actualizada a ${format(newDueDate, "d 'de' MMMM, yyyy", { locale: es })}`);
      setNewDueDate(undefined);
      refetchObligation();
      refetchHistory();
    } catch (error) {
      console.error('Error changing due date:', error);
    } finally {
      setIsChangingDate(false);
    }
  };

  const handleRecurrenceChange = async (value: 'none' | 'monthly' | 'annual') => {
    if (!obligation || !user) return;

    try {
      await updateObligationRecurrence(obligation.id, value);
      toast.success(`Recurrencia actualizada a "${recurrenceLabels[value]}"`);
      refetchObligation();
    } catch (error) {
      console.error('Error updating recurrence:', error);
      toast.error("Error al actualizar la recurrencia");
    }
  };

  const handleSaveNote = async () => {
    if (!obligation || !user || !note.trim()) return;

    setIsSavingNote(true);
    try {
      await updateNotesMutation.mutateAsync({
        id: obligation.id,
        notes: note,
        userId: user.id
      });

      setNote("");
      refetchHistory();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !obligation || !user) return;

    setIsUploading(true);
    try {
      await uploadFileMutation.mutateAsync({
        obligationId: obligation.id,
        file,
        userId: user.id,
      });

      refetchFiles();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    if (!obligation) return;

    try {
      await deleteFileMutation.mutateAsync({
        fileId,
        filePath,
        obligationId: obligation.id,
      });

      refetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      const signedUrl = await getSignedFileUrl(filePath);
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error("Error al descargar el archivo");
    }
  };

  const handleDeleteObligation = async () => {
    if (!obligation) return;

    setIsDeleting(true);
    try {
      await deleteObligationMutation.mutateAsync(obligation.id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting obligation:', error);
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header
        userName={profile?.name || user.email || 'Usuario'}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        userPlan={profile?.plan}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Button>

        {/* Header with title and delete button */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CategoryIcon category={obligation.category} className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {obligation.name}
              </h1>
              <p className="text-muted-foreground">
                {categoryLabels[obligation.category]}
              </p>
            </div>
          </div>

          {isAdmin && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status card */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold mb-4">Estado</h2>
              <div className="flex items-center gap-4">
                <StatusBadge status={status} />
                <Select
                  value={status}
                  onValueChange={(value) => handleStatusChange(value as ObligationStatus)}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="al_dia">Al día</SelectItem>
                    <SelectItem value="por_vencer">Por vencer</SelectItem>
                    <SelectItem value="vencida">Vencida</SelectItem>
                  </SelectContent>
                </Select>
                {isUpdatingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
            </div>

            {/* Details card */}
            <div className="card-elevated p-6 space-y-4">
              <h2 className="text-lg font-semibold">Detalles</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de vencimiento</p>
                    <p className="font-medium">
                      {format(new Date(obligation.due_date), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Responsable</p>
                    <p className="font-medium">{obligation.responsible_name || 'Sin asignar'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Recurrencia</p>
                    <Select
                      value={obligation.recurrence}
                      onValueChange={handleRecurrenceChange}
                      disabled={!isAdmin}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin recurrencia</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {isAdmin && obligation.recurrence !== 'none' && (
                  <Button
                    onClick={handleRenewObligation}
                    disabled={isRenewing}
                    variant="outline"
                    className="gap-2"
                  >
                    {isRenewing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Renovar obligación
                  </Button>
                )}

                {isAdmin && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Cambiar fecha
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={newDueDate}
                        onSelect={setNewDueDate}
                        initialFocus
                      />
                      <div className="p-3 border-t">
                        <Button
                          onClick={handleChangeDueDate}
                          disabled={!newDueDate || isChangingDate}
                          className="w-full"
                        >
                          {isChangingDate ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Confirmar'
                          )}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {/* Notes section */}
            {obligation.notes && (
              <div className="card-elevated p-6">
                <h2 className="text-lg font-semibold mb-4">Notas</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {obligation.notes}
                </p>
              </div>
            )}

            {/* Add note */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold mb-4">Agregar nota</h2>
              <div className="space-y-3">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Escribe una nota..."
                  rows={3}
                />
                <Button
                  onClick={handleSaveNote}
                  disabled={!note.trim() || isSavingNote}
                  className="gap-2"
                >
                  {isSavingNote ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Guardar nota'
                  )}
                </Button>
              </div>
            </div>

            {/* Files */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold mb-4">Archivos adjuntos</h2>

              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(file.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFile(file.file_path, file.file_name)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id, file.file_path)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {files.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No hay archivos adjuntos
                  </p>
                )}

                <div className="pt-3 border-t">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileUp className="w-4 h-4" />
                    )}
                    Subir archivo
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <NotificationManager
              obligationId={obligation.id}
              userEmail={user?.email || ''}
              obligationName={obligation.name}
              dueDate={obligation.due_date}
              daysUntilDue={Math.ceil((new Date(obligation.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
            />

            {/* History */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold mb-4">Historial</h2>
              <div className="space-y-3">
                {history.map((entry) => (
                  <div key={entry.id} className="pb-3 border-b last:border-0">
                    <p className="text-sm font-medium">
                      {entry.note || (entry.previous_status && entry.new_status
                        ? `Cambió de ${statusLabels[entry.previous_status]} a ${statusLabels[entry.new_status]}`
                        : 'Cambio registrado')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.changed_by_name} •{' '}
                      {format(new Date(entry.created_at), "d 'de' MMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                ))}

                {history.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Sin historial
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar obligación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los archivos,
              notificaciones e historial asociados a esta obligación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteObligation}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ObligationDetail;
