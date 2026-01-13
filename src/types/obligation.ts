export type ObligationStatus = 'al_dia' | 'por_vencer' | 'vencida';

export type ObligationCategory = 'legal' | 'fiscal' | 'seguridad' | 'operativa';

export interface Obligation {
  id: string;
  name: string;
  category: ObligationCategory;
  dueDate: Date;
  responsibleId: string;
  responsibleName: string;
  status: ObligationStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ObligationHistoryEntry {
  id: string;
  obligationId: string;
  previousStatus: ObligationStatus;
  newStatus: ObligationStatus;
  changedBy: string;
  changedAt: Date;
  note?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'responsable';
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
