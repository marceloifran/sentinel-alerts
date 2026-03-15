import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAccountantClients,
  addClientCompany,
  removeClientCompany,
} from '@/services/accountantClientService';

export const ACCOUNTANT_CLIENTS_KEY = 'accountant-clients';

export function useAccountantClients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [ACCOUNTANT_CLIENTS_KEY, user?.id],
    queryFn: () => getAccountantClients(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

export function useAddClientCompany() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({
      companyName,
      cuit,
    }: {
      companyName: string;
      cuit?: string;
    }) => addClientCompany(user!.id, companyName, cuit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTANT_CLIENTS_KEY] });
    },
  });
}

export function useRemoveClientCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) => removeClientCompany(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTANT_CLIENTS_KEY] });
    },
  });
}
