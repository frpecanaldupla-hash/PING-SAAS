-- PING · migration 0012_professional_time_off
-- Bloqueios de horário por profissional: recorrentes (ex: almoço toda
-- terça) ou pontuais (ex: folga no dia 30/07). Um `kind` discrimina os dois
-- casos em vez de duas tabelas — o consumo do lado do app é idêntico nos
-- dois (a Fase 4 soma isso ao cálculo de horário livre, junto do horário de
-- funcionamento da Fase 3). Ninguém no app lê essa tabela ainda.
create table professional_time_off (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  professional_id uuid references professionals(id) on delete cascade not null,
  kind text not null check (kind in ('recurring', 'date')),
  -- kind='recurring': weekday obrigatório (mesma convenção 0=domingo..6=sábado
  -- de business_hours), date deve ser null.
  weekday int check (weekday between 0 and 6),
  -- kind='date': date obrigatório, weekday deve ser null.
  date date,
  -- Em ambos os casos, start_time/end_time nulos = dia inteiro bloqueado.
  start_time time,
  end_time time,
  label text,
  created_at timestamptz not null default now(),
  check (
    (kind = 'recurring' and weekday is not null and date is null) or
    (kind = 'date' and date is not null and weekday is null)
  )
);

create index professional_time_off_professional_idx on professional_time_off (professional_id);

alter table professional_time_off enable row level security;

create policy "member full access" on professional_time_off
  for all using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));
