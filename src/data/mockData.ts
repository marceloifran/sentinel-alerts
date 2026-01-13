import { Obligation, User } from "@/types/obligation";

export const mockUsers: User[] = [
  { id: "1", email: "admin@empresa.com", name: "María García", role: "admin" },
  { id: "2", email: "juan@empresa.com", name: "Juan Pérez", role: "responsable" },
  { id: "3", email: "ana@empresa.com", name: "Ana López", role: "responsable" },
];

export const mockObligations: Obligation[] = [
  {
    id: "1",
    name: "Habilitación comercial municipal",
    category: "legal",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    responsibleId: "2",
    responsibleName: "Juan Pérez",
    status: "por_vencer",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Declaración jurada IVA",
    category: "fiscal",
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    responsibleId: "3",
    responsibleName: "Ana López",
    status: "vencida",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Inspección de seguridad e higiene",
    category: "seguridad",
    dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    responsibleId: "2",
    responsibleName: "Juan Pérez",
    status: "al_dia",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "4",
    name: "Renovación póliza de seguro",
    category: "operativa",
    dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
    responsibleId: "3",
    responsibleName: "Ana López",
    status: "por_vencer",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "5",
    name: "Certificado de bomberos",
    category: "seguridad",
    dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    responsibleId: "2",
    responsibleName: "Juan Pérez",
    status: "al_dia",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
];
