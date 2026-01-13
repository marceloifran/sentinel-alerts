import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ObligationRow = Database['public']['Tables']['obligations']['Row'];
type ObligationInsert = Database['public']['Tables']['obligations']['Insert'];
type ObligationUpdate = Database['public']['Tables']['obligations']['Update'];
type ObligationStatus = Database['public']['Enums']['obligation_status'];
type ObligationCategory = Database['public']['Enums']['obligation_category'];
type ObligationFileRow = Database['public']['Tables']['obligation_files']['Row'];
type ObligationHistoryRow = Database['public']['Tables']['obligation_history']['Row'];

export interface Obligation extends ObligationRow {
  responsible_name?: string;
}

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

export const categoryIcons: Record<ObligationCategory, string> = {
  legal: '⚖️',
  fiscal: '📊',
  seguridad: '🛡️',
  operativa: '⚙️',
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
  const { data, error } = await supabase
    .from('obligations')
    .select(`
      *,
      profiles!obligations_responsible_id_fkey(name)
    `)
    .order('due_date', { ascending: true });

  if (error) throw error;

  return (data || []).map(item => ({
    ...item,
    responsible_name: (item.profiles as any)?.name || 'Sin asignar'
  }));
}

export async function getObligation(id: string): Promise<Obligation | null> {
  const { data, error } = await supabase
    .from('obligations')
    .select(`
      *,
      profiles!obligations_responsible_id_fkey(name)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    responsible_name: (data.profiles as any)?.name || 'Sin asignar'
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
  return data;
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

export async function getObligationHistory(obligationId: string): Promise<ObligationHistory[]> {
  const { data, error } = await supabase
    .from('obligation_history')
    .select(`
      *,
      profiles!obligation_history_changed_by_fkey(name)
    `)
    .eq('obligation_id', obligationId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(item => ({
    ...item,
    changed_by_name: (item.profiles as any)?.name || 'Usuario'
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
  const { error } = await supabase
    .from('obligation_files')
    .delete()
    .eq('id', fileId);

  if (error) throw error;
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
