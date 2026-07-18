import type { Service, Professional, Appointment, Client, FidelityConfig, Transaction, Campaign } from "@/lib/types";

// Dados de demonstração — mesmo formato das tabelas do Supabase, para a UI já
// nascer plugável. Trocar por queries reais (`createClient().from("services")...`)
// assim que o projeto Supabase estiver conectado.

function todayAt(hh: number, mm: number) {
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function birthdayToday() {
  const d = new Date();
  return `1990-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const MOCK_BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

export const MOCK_SERVICES: Service[] = [
  { id: "s1", businessId: MOCK_BUSINESS_ID, name: "Corte Masculino", price: 45, durationMinutes: 40, isCombo: false, comboServiceIds: null, active: true },
  { id: "s2", businessId: MOCK_BUSINESS_ID, name: "Barba Completa", price: 35, durationMinutes: 30, isCombo: false, comboServiceIds: null, active: true },
  { id: "s3", businessId: MOCK_BUSINESS_ID, name: "Corte + Barba", price: 75, durationMinutes: 60, isCombo: true, comboServiceIds: ["s1", "s2"], active: true },
  { id: "s4", businessId: MOCK_BUSINESS_ID, name: "Corte Feminino", price: 65, durationMinutes: 50, isCombo: false, comboServiceIds: null, active: true },
  { id: "s5", businessId: MOCK_BUSINESS_ID, name: "Progressiva", price: 180, durationMinutes: 120, isCombo: false, comboServiceIds: null, active: true },
  { id: "s6", businessId: MOCK_BUSINESS_ID, name: "Combo Semana (Cabelo + Barba)", price: 95, durationMinutes: 70, isCombo: true, comboServiceIds: ["s1", "s2"], active: true },
];

export const MOCK_PROFESSIONALS: Professional[] = [
  { id: "p1", businessId: MOCK_BUSINESS_ID, userId: null, name: "Zé", avatarUrl: null, role: "professional", active: true, commissionPercent: 40 },
  { id: "p2", businessId: MOCK_BUSINESS_ID, userId: null, name: "Lucas", avatarUrl: null, role: "professional", active: true, commissionPercent: 40 },
  { id: "p3", businessId: MOCK_BUSINESS_ID, userId: null, name: "Thiago", avatarUrl: null, role: "professional", active: true, commissionPercent: 35 },
];

export const MOCK_CLIENTS: Client[] = [
  { id: "c1", businessId: MOCK_BUSINESS_ID, name: "João Silva", phone: "11987654321", birthday: null, points: 245, totalVisits: 12, lastVisitAt: "2026-07-10", qrToken: "qr-c1", createdAt: "2025-01-10" },
  { id: "c2", businessId: MOCK_BUSINESS_ID, name: "Maria Oliveira", phone: "11912345678", birthday: birthdayToday(), points: 890, totalVisits: 21, lastVisitAt: "2026-07-15", qrToken: "qr-c2", createdAt: "2024-11-02" },
  { id: "c3", businessId: MOCK_BUSINESS_ID, name: "Pedro Souza", phone: "11976543210", birthday: null, points: 60, totalVisits: 3, lastVisitAt: daysAgo(35), qrToken: "qr-c3", createdAt: "2025-06-01" },
  { id: "c4", businessId: MOCK_BUSINESS_ID, name: "Ana Costa", phone: "11965432109", birthday: null, points: 310, totalVisits: 8, lastVisitAt: daysAgo(45), qrToken: "qr-c4", createdAt: "2025-03-15" },
];

export const MOCK_FIDELITY_CONFIG: FidelityConfig = {
  businessId: MOCK_BUSINESS_ID,
  pointsPerReal: 1,
  pointsPerVisit: 10,
  rewardThreshold: 500,
  rewardValue: 50,
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "t1", businessId: MOCK_BUSINESS_ID, appointmentId: "a1", professionalId: "p1", amount: 75, method: "pix", type: "receita", createdAt: todayAt(10, 5) },
  { id: "t2", businessId: MOCK_BUSINESS_ID, appointmentId: "a2", professionalId: "p2", amount: 65, method: "cartao", type: "receita", createdAt: todayAt(11, 25) },
  { id: "t3", businessId: MOCK_BUSINESS_ID, appointmentId: null, professionalId: null, amount: 120, method: "dinheiro", type: "despesa", createdAt: todayAt(9, 0) },
  { id: "t4", businessId: MOCK_BUSINESS_ID, appointmentId: "a1", professionalId: "p1", amount: 30, method: "pix", type: "comissao", createdAt: todayAt(10, 6) },
  { id: "t5", businessId: MOCK_BUSINESS_ID, appointmentId: null, professionalId: null, amount: 1044, method: "pix", type: "receita", createdAt: todayAt(8, 0) },
];

// Agenda de hoje — horários em minutos desde 00:00, via todayAt() definida acima

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "a1", businessId: MOCK_BUSINESS_ID, clientId: "c1", professionalId: "p1",
    serviceIds: ["s3"], startAt: todayAt(9, 0), endAt: todayAt(10, 0),
    status: "completed", totalPrice: 75, createdAt: todayAt(8, 0),
  },
  {
    id: "a2", businessId: MOCK_BUSINESS_ID, clientId: "c2", professionalId: "p2",
    serviceIds: ["s4"], startAt: todayAt(10, 30), endAt: todayAt(11, 20),
    status: "checked_in", totalPrice: 65, createdAt: todayAt(8, 30),
  },
  {
    id: "a3", businessId: MOCK_BUSINESS_ID, clientId: "c1", professionalId: "p1",
    serviceIds: ["s1"], startAt: todayAt(11, 10), endAt: todayAt(11, 50),
    status: "scheduled", totalPrice: 45, createdAt: todayAt(9, 0),
  },
  {
    id: "a4", businessId: MOCK_BUSINESS_ID, clientId: "c2", professionalId: "p3",
    serviceIds: ["s5"], startAt: todayAt(14, 0), endAt: todayAt(16, 0),
    status: "scheduled", totalPrice: 180, createdAt: todayAt(9, 10),
  },
  {
    id: "a5", businessId: MOCK_BUSINESS_ID, clientId: "c1", professionalId: "p2",
    serviceIds: ["s6"], startAt: todayAt(15, 0), endAt: todayAt(16, 10),
    status: "scheduled", totalPrice: 95, createdAt: todayAt(9, 20),
  },
];

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "camp1", businessId: MOCK_BUSINESS_ID, name: "Volta pro corte",
    message: "Faz um tempo que a gente não te vê por aqui! Que tal um Corte + Barba com 10% de desconto essa semana?",
    audience: "inativos_30d", status: "enviada", scheduledAt: null, createdAt: daysAgo(6),
  },
  {
    id: "camp2", businessId: MOCK_BUSINESS_ID, name: "Aniversariantes do mês",
    message: "Parabéns! Ganhe 50 pontos de bônus se agendar um horário essa semana.",
    audience: "aniversariantes", status: "agendada", scheduledAt: todayAt(18, 0), createdAt: daysAgo(2),
  },
];
