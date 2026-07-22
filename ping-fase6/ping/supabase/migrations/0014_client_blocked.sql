-- PING · migration 0014_client_blocked
-- Bloqueio de cliente: impede que ELE crie novos agendamentos pela Área do
-- Cliente (guarda entra em createMyAppointment na Fase 7) — a equipe
-- continua podendo agendar por ele manualmente pela Agenda, sem checagem
-- nenhuma lá. timestamptz em vez de boolean, no mesmo estilo de
-- last_visit_at/pin_set_at: null = nunca bloqueado, e quando preenchido já
-- registra quando aconteceu, de graça.
alter table clients add column if not exists blocked_at timestamptz;
