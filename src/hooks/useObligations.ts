import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getObligations,
    getObligation,
    getObligationHistory,
    getObligationFiles,
    getResponsibles,
    createObligation,
    updateObligationStatus,
    updateObligationNotes,
    updateObligationDueDate,
    updateObligationRecurrence,
    renewObligation,
    uploadObligationFile,
    deleteObligationFile,
    deleteObligation,
    Obligation,
    ObligationHistory,
    ObligationFile,
    ObligationStatus
} from '@/services/obligationService';
import { toast } from 'sonner';

// Hook para obtener todas las obligaciones
export function useObligations() {
    return useQuery({
        queryKey: ['obligations'],
        queryFn: getObligations,
        staleTime: 5 * 60 * 1000, // 5 minutos
    });
}

// Hook para obtener una obligación específica
export function useObligation(id: string | undefined) {
    return useQuery({
        queryKey: ['obligation', id],
        queryFn: () => getObligation(id!),
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 minutos
    });
}

// Hook para obtener el historial de una obligación
export function useObligationHistory(id: string | undefined) {
    return useQuery({
        queryKey: ['obligation-history', id],
        queryFn: () => getObligationHistory(id!),
        enabled: !!id,
        staleTime: 15 * 60 * 1000, // 15 minutos
    });
}

// Hook para obtener los archivos de una obligación
export function useObligationFiles(id: string | undefined) {
    return useQuery({
        queryKey: ['obligation-files', id],
        queryFn: () => getObligationFiles(id!),
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 minutos
    });
}

// Hook para obtener responsables
export function useResponsibles(enabled: boolean = true) {
    return useQuery({
        queryKey: ['responsibles'],
        queryFn: getResponsibles,
        enabled,
        staleTime: 30 * 60 * 1000, // 30 minutos - cambia raramente
    });
}

// Hook para crear una obligación
export function useCreateObligation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ obligation, userId }: { obligation: any; userId: string }) =>
            createObligation(obligation, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['obligations'] });
            toast.success('Obligación creada exitosamente');
        },
        onError: (error: any) => {
            console.error('Error creating obligation:', error);

            // Extract error message from Supabase/PostgreSQL error
            let errorMessage = 'Error al crear la obligación';

            // Supabase returns PostgreSQL errors in error.message
            if (error?.message) {
                const message = error.message;

                // If it's a PostgreSQL error with our custom message, extract it
                if (message.includes('Has alcanzado el límite')) {
                    // Extract just the user-friendly part (before technical details)
                    const match = message.match(/(Has alcanzado el límite de \d+ obligaciones de tu plan \w+\. Actualiza tu plan para crear más obligaciones\.)/);
                    errorMessage = match ? match[1] : message;
                } else {
                    errorMessage = message;
                }
            } else if (error?.error?.message) {
                errorMessage = error.error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            // Display the error to the user
            toast.error(errorMessage, {
                duration: 6000, // Show for 6 seconds
            });
        },
    });
}

// Hook para actualizar el estado de una obligación
export function useUpdateObligationStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status, previousStatus, userId, note }: { id: string; status: ObligationStatus; previousStatus: ObligationStatus; userId: string; note?: string }) =>
            updateObligationStatus(id, status, previousStatus, userId, note),
        onMutate: async ({ id, status }) => {
            // Cancelar queries en progreso
            await queryClient.cancelQueries({ queryKey: ['obligation', id] });

            // Snapshot del valor anterior
            const previousObligation = queryClient.getQueryData<Obligation>(['obligation', id]);

            // Actualizar optimísticamente
            if (previousObligation) {
                queryClient.setQueryData<Obligation>(['obligation', id], {
                    ...previousObligation,
                    status,
                });
            }

            return { previousObligation };
        },
        onError: (error, { id }, context) => {
            // Revertir en caso de error
            if (context?.previousObligation) {
                queryClient.setQueryData(['obligation', id], context.previousObligation);
            }
            console.error('Error updating status:', error);
            toast.error('Error al actualizar el estado');
        },
        onSettled: (data, error, { id }) => {
            // Refetch para sincronizar
            queryClient.invalidateQueries({ queryKey: ['obligation', id] });
            queryClient.invalidateQueries({ queryKey: ['obligations'] });
            queryClient.invalidateQueries({ queryKey: ['obligation-history', id] });
        },
    });
}

// Hook para actualizar notas
export function useUpdateObligationNotes() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, notes, userId }: { id: string; notes: string; userId?: string }) =>
            updateObligationNotes(id, notes, userId),
        onSuccess: (data, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['obligation', id] });
            queryClient.invalidateQueries({ queryKey: ['obligation-history', id] });
            toast.success('Notas actualizadas');
        },
        onError: (error) => {
            console.error('Error updating notes:', error);
            toast.error('Error al actualizar las notas');
        },
    });
}

// Hook para actualizar fecha de vencimiento
export function useUpdateObligationDueDate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dueDate, userId }: { id: string; dueDate: string; userId: string }) =>
            updateObligationDueDate(id, dueDate, userId),
        onSuccess: (data, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['obligation', id] });
            queryClient.invalidateQueries({ queryKey: ['obligations'] });
            queryClient.invalidateQueries({ queryKey: ['obligation-history', id] });
            toast.success('Fecha actualizada');
        },
        onError: (error) => {
            console.error('Error updating due date:', error);
            toast.error('Error al actualizar la fecha');
        },
    });
}

// Hook para renovar obligación
export function useRenewObligation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, recurrence, currentDueDate, userId }: { id: string; recurrence: 'monthly' | 'annual'; currentDueDate: string; userId: string }) =>
            renewObligation(id, recurrence, currentDueDate, userId),
        onSuccess: (data, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['obligation', id] });
            queryClient.invalidateQueries({ queryKey: ['obligations'] });
            queryClient.invalidateQueries({ queryKey: ['obligation-history', id] });
            toast.success('Obligación renovada');
        },
        onError: (error) => {
            console.error('Error renewing obligation:', error);
            toast.error('Error al renovar la obligación');
        },
    });
}

// Hook para subir archivo
export function useUploadObligationFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ obligationId, file, userId }: { obligationId: string; file: File; userId: string }) =>
            uploadObligationFile(obligationId, file, userId),
        onSuccess: (data, { obligationId }) => {
            queryClient.invalidateQueries({ queryKey: ['obligation-files', obligationId] });
            queryClient.invalidateQueries({ queryKey: ['obligation-history', obligationId] });
            toast.success('Archivo subido exitosamente');
        },
        onError: (error) => {
            console.error('Error uploading file:', error);
            toast.error('Error al subir el archivo');
        },
    });
}

// Hook para eliminar archivo
export function useDeleteObligationFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ fileId, filePath, obligationId }: { fileId: string; filePath: string; obligationId: string }) =>
            deleteObligationFile(fileId, filePath),
        onSuccess: (data, { obligationId }) => {
            queryClient.invalidateQueries({ queryKey: ['obligation-files', obligationId] });
            toast.success('Archivo eliminado');
        },
        onError: (error) => {
            console.error('Error deleting file:', error);
            toast.error('Error al eliminar el archivo');
        },
    });
}

// Hook para eliminar obligación
export function useDeleteObligation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteObligation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['obligations'] });
            toast.success('Obligación eliminada exitosamente');
        },
        onError: (error) => {
            console.error('Error deleting obligation:', error);
            toast.error('Error al eliminar la obligación');
        },
    });
}
