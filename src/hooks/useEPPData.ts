import { useQuery } from "@tanstack/react-query";
import { getEmployees, getEPPItems, getEPPDeliveries } from "@/services/eppService";

// Query keys
export const eppKeys = {
  all: ["epp"] as const,
  employees: (companyId: string) => [...eppKeys.all, "employees", companyId] as const,
  items: (companyId: string) => [...eppKeys.all, "items", companyId] as const,
  deliveries: (companyId: string) => [...eppKeys.all, "deliveries", companyId] as const,
};

// 1. Hook for employees list
export function useEmployees(companyId: string | undefined) {
  return useQuery({
    queryKey: eppKeys.employees(companyId || ""),
    queryFn: () => getEmployees(companyId!),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh time
    gcTime: 1000 * 60 * 30,    // 30 minutes cache time
  });
}

// 2. Hook for EPP inventory items
export function useEPPItems(companyId: string | undefined) {
  return useQuery({
    queryKey: eppKeys.items(companyId || ""),
    queryFn: () => getEPPItems(companyId!),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh time
    gcTime: 1000 * 60 * 30,    // 30 minutes cache time
  });
}

// 3. Hook for EPP deliveries log
export function useEPPDeliveries(companyId: string | undefined) {
  return useQuery({
    queryKey: eppKeys.deliveries(companyId || ""),
    queryFn: () => getEPPDeliveries(companyId!),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh time
    gcTime: 1000 * 60 * 30,    // 30 minutes cache time
  });
}
