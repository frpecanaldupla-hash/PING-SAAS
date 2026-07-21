// Tipos de domínio do PING — espelham as tabelas do Supabase (ver supabase/migrations).
// Mantidos centralizados para reuso entre Server Components, Client Components e rotas de API.

export type Role = "owner" | "manager" | "professional" | "client";

export interface Business {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  createdAt: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  price: number; // em reais
  durationMinutes: number;
  isCombo: boolean;
  comboServiceIds: string[] | null; // se isCombo, quais serviços compõem
  active: boolean;
}

export interface Professional {
  id: string;
  businessId: string;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  role: Role;
  active: boolean;
  commissionPercent: number | null;
}

export interface Client {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  birthday: string | null; // ISO date
  points: number;
  totalVisits: number;
  lastVisitAt: string | null;
  qrToken: string; // token único usado no QR Code da Área do Cliente
  createdAt: string;
}

export interface FidelityConfig {
  businessId: string;
  pointsPerReal: number;
  pointsPerVisit: number;
  rewardThreshold: number;
  rewardValue: number; // desconto em reais ao atingir o threshold
}

export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "no_show"
  | "cancelled";

export interface Appointment {
  id: string;
  businessId: string;
  clientId: string;
  professionalId: string;
  serviceIds: string[];
  startAt: string; // ISO datetime
  endAt: string;
  status: AppointmentStatus;
  totalPrice: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  businessId: string;
  appointmentId: string | null;
  professionalId: string | null;
  amount: number;
  method: "pix" | "cartao" | "dinheiro";
  type: "receita" | "despesa" | "comissao";
  kind?: "resgate" | null; // origem específica, hoje só marca resgates de fidelidade
  createdAt: string;
}

export interface Campaign {
  id: string;
  businessId: string;
  name: string;
  message: string; // gerado ou editado com IA
  audience: "todos" | "inativos_30d" | "aniversariantes" | "pontos_altos";
  status: "rascunho" | "agendada" | "enviada";
  scheduledAt: string | null;
  createdAt: string;
}
