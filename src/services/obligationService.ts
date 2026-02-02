import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';


type ObligationRow = Database['public']['Tables']['obligations']['Row'];
type ObligationInsert = Database['public']['Tables']['obligations']['Insert'];
type ObligationStatus = Database['public']['Enums']['obligation_status'];
type ObligationCategory = Database['public']['Enums']['obligation_category'];
type ObligationFileRow = Database['public']['Tables']['obligation_files']['Row'];
type ObligationHistoryRow = Database['public']['Tables']['obligation_history']['Row'];

export interface Obligation extends Omit<ObligationRow, 'recurrence'> {
  responsible_name?: string;
  recurrence: 'none' | 'monthly' | 'annual';
}

export const recurrenceLabels: Record<string, string> = {
  none: 'Sin recurrencia',
  monthly: 'Mensual',
  annual: 'Anual',
};

export interface ObligationFile extends ObligationFileRow { }

export interface ObligationHistory extends ObligationHistoryRow {
  changed_by_name?: string;
}

export const categoryLabels: Record<ObligationCategory, string> = {
  legal: 'Legal',
  fiscal: 'Fiscal',
  seguridad: 'Seguridad',
  operativa: 'Operativa',
};

export const statusLabels: Record<ObligationStatus, string> = {
  al_dia: 'Al día',
  por_vencer: 'Por vencer',
  vencida: 'Vencida',
};



// Calculate status based on due date
export function calculateStatus(dueDate: string): ObligationStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'vencida';
  if (diffDays <= 30) return 'por_vencer';
  return 'al_dia';
}

export async function getObligations(): Promise<Obligation[]> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Usuario no autenticado');

  // Get only obligations created by current user
  const { data: obligations, error: obligationsError } = await supabase
    .from('obligations')
    .select('*')
    .eq('created_by', user.id)
    .order('due_date', { ascending: true });

  if (obligationsError) throw obligationsError;
  if (!obligations || obligations.length === 0) return [];

  // Get unique responsible IDs
  const responsibleIds = [...new Set(obligations.map(o => o.responsible_id))];

  // Fetch profiles for these IDs
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', responsibleIds);

  if (profilesError) throw profilesError;

  // Create a map of id -> name
  const profileMap = new Map((profiles || []).map(p => [p.id, p.name]));

  // Enrich obligations with responsible names
  return obligations.map(obligation => ({
    ...obligation,
    recurrence: (obligation.recurrence || 'none') as 'none' | 'monthly' | 'annual',
    responsible_name: profileMap.get(obligation.responsible_id) || 'Sin asignar'
  }));
}

export async function getObligation(id: string): Promise<Obligation | null> {
  const { data, error } = await supabase
    .from('obligations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // Fetch the responsible person's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', data.responsible_id)
    .maybeSingle();

  return {
    ...data,
    recurrence: (data.recurrence || 'none') as 'none' | 'monthly' | 'annual',
    responsible_name: profile?.name || 'Sin asignar'
  };
}

export async function createObligation(
  obligation: Omit<ObligationInsert, 'created_by' | 'status'>,
  userId: string
): Promise<Obligation> {
  const status = calculateStatus(obligation.due_date);

  const { data, error } = await supabase
    .from('obligations')
    .insert({
      ...obligation,
      status,
      created_by: userId
    })
    .select()
    .single();

  if (error) throw error;

  // Get responsible name for sync
  let responsibleName = 'Sin asignar';
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', obligation.responsible_id)
      .maybeSingle();

    if (profile) {
      responsibleName = profile.name;

      // Crear automáticamente la notificación para el creador
      await supabase
        .from('obligation_notifications' as any)
        .insert({
          obligation_id: data.id,
          user_email: profile.email,
          user_name: profile.name,
          custom_message: null,
          days_before: 7,
          is_active: true,
        });
    }
  } catch (notificationError) {
    console.error('Error creando notificación automática:', notificationError);
  }

  return {
    ...data,
    recurrence: (data.recurrence || 'none') as 'none' | 'monthly' | 'annual'
  };
}

export async function updateObligationStatus(
  obligationId: string,
  newStatus: ObligationStatus,
  previousStatus: ObligationStatus,
  userId: string,
  note?: string
): Promise<void> {
  // Update obligation
  const { error: updateError } = await supabase
    .from('obligations')
    .update({ status: newStatus })
    .eq('id', obligationId);

  if (updateError) throw updateError;

  // Add history entry
  const { error: historyError } = await supabase
    .from('obligation_history')
    .insert({
      obligation_id: obligationId,
      previous_status: previousStatus,
      new_status: newStatus,
      changed_by: userId,
      note
    });

  if (historyError) throw historyError;
}

export async function updateObligationNotes(
  obligationId: string,
  notes: string
): Promise<void> {
  const { error } = await supabase
    .from('obligations')
    .update({ notes })
    .eq('id', obligationId);

  if (error) throw error;
}

export async function updateObligationDueDate(
  obligationId: string,
  newDueDate: string,
  userId: string
): Promise<void> {
  const newStatus = calculateStatus(newDueDate);

  const { error: updateError } = await supabase
    .from('obligations')
    .update({
      due_date: newDueDate,
      status: newStatus
    })
    .eq('id', obligationId);

  if (updateError) throw updateError;

  // Add history entry for date change
  const { error: historyError } = await supabase
    .from('obligation_history')
    .insert({
      obligation_id: obligationId,
      previous_status: null,
      new_status: newStatus,
      changed_by: userId,
      note: `Fecha de vencimiento actualizada a ${newDueDate}`
    });

  if (historyError) throw historyError;
}

export async function renewObligation(
  obligationId: string,
  recurrence: 'monthly' | 'annual',
  currentDueDate: string,
  userId: string
): Promise<string> {
  const currentDate = new Date(currentDueDate);
  let newDate: Date;

  if (recurrence === 'monthly') {
    newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
  } else {
    newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
  }

  const newDueDate = newDate.toISOString().split('T')[0];
  const newStatus = calculateStatus(newDueDate);

  const { error: updateError } = await supabase
    .from('obligations')
    .update({
      due_date: newDueDate,
      status: newStatus
    })
    .eq('id', obligationId);

  if (updateError) throw updateError;

  // Add history entry for renewal
  const { error: historyError } = await supabase
    .from('obligation_history')
    .insert({
      obligation_id: obligationId,
      previous_status: null,
      new_status: newStatus,
      changed_by: userId,
      note: `Obligación renovada (${recurrence === 'monthly' ? 'mensual' : 'anual'}). Nueva fecha: ${newDueDate}`
    });

  if (historyError) throw historyError;

  return newDueDate;
}

export async function updateObligationRecurrence(
  obligationId: string,
  recurrence: 'none' | 'monthly' | 'annual'
): Promise<void> {
  const { error } = await supabase
    .from('obligations')
    .update({ recurrence } as any)
    .eq('id', obligationId);

  if (error) throw error;
}

export async function getObligationHistory(obligationId: string): Promise<ObligationHistory[]> {
  const { data: history, error } = await supabase
    .from('obligation_history')
    .select('*')
    .eq('obligation_id', obligationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!history || history.length === 0) return [];

  // Get unique user IDs
  const userIds = [...new Set(history.map(h => h.changed_by))];

  // Fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds);

  // Create map
  const profileMap = new Map((profiles || []).map(p => [p.id, p.name]));

  return history.map(item => ({
    ...item,
    changed_by_name: profileMap.get(item.changed_by) || 'Usuario'
  }));
}

export async function uploadObligationFile(
  obligationId: string,
  file: File,
  userId: string
): Promise<ObligationFile> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${obligationId}/${Date.now()}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('obligation-files')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // Save file reference
  const { data, error } = await supabase
    .from('obligation_files')
    .insert({
      obligation_id: obligationId,
      file_name: file.name,
      file_path: fileName,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: userId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getObligationFiles(obligationId: string): Promise<ObligationFile[]> {
  const { data, error } = await supabase
    .from('obligation_files')
    .select('*')
    .eq('obligation_id', obligationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteObligationFile(fileId: string, filePath: string): Promise<void> {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('obligation-files')
    .remove([filePath]);

  if (storageError) throw storageError;

  // Delete from database
  const { error: dbError } = await supabase
    .from('obligation_files')
    .delete()
    .eq('id', fileId);

  if (dbError) throw dbError;
}

export async function deleteObligation(obligationId: string): Promise<void> {
  // 1. Get all files associated with this obligation
  const { data: files, error: filesError } = await supabase
    .from('obligation_files')
    .select('id, file_path')
    .eq('obligation_id', obligationId);

  if (filesError) throw filesError;

  // 2. Delete all files from storage
  if (files && files.length > 0) {
    const filePaths = files.map(f => f.file_path);
    const { error: storageError } = await supabase.storage
      .from('obligation-files')
      .remove(filePaths);

    if (storageError) {
      console.error('Error deleting files from storage:', storageError);
      // Continue anyway - we'll delete the DB records
    }
  }

  // 3. Delete file records from database
  const { error: deleteFilesError } = await supabase
    .from('obligation_files')
    .delete()
    .eq('obligation_id', obligationId);

  if (deleteFilesError) throw deleteFilesError;

  // 4. Delete notification records (if table exists)
  try {
    await supabase
      .from('email_notifications' as any)
      .delete()
      .eq('obligation_id', obligationId);
  } catch (error) {
    console.error('Error deleting notifications:', error);
    // Continue anyway
  }

  // 5. Delete history records
  const { error: deleteHistoryError } = await supabase
    .from('obligation_history')
    .delete()
    .eq('obligation_id', obligationId);

  if (deleteHistoryError) throw deleteHistoryError;

  // 6. Finally, delete the obligation itself
  const { error: deleteObligationError } = await supabase
    .from('obligations')
    .delete()
    .eq('id', obligationId);

  if (deleteObligationError) throw deleteObligationError;
}

export function getFileUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('obligation-files')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function getSignedFileUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('obligation-files')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
}

export async function getResponsibles(): Promise<{ id: string; name: string; email: string }[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email')
    .order('name');

  if (error) throw error;
  return data || [];
}

export function subscribeToObligations(callback: () => void) {
  const channel = supabase
    .channel('obligations-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'obligations'
      },
      () => {
        callback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export type { ObligationStatus, ObligationCategory };
