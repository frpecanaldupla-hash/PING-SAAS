-- PING · migration 0011_business_hours
-- Horário de funcionamento configurável por dia da semana, substituindo os
-- AGENDA_START_MIN/END_MIN fixos em lib/agenda/time.ts (a Fase 3 troca quem
-- lê essa janela; até lá essa tabela existe mas ninguém no app consulta).
-- `weekday` segue a convenção do JS Date.getDay(): 0=domingo, 6=sábado — a
-- mesma que o app já usa do lado do cliente (parseLocalDateOnly, nextNDays
-- etc.), pra não precisar traduzir índice nenhum entre banco e front.
create table business_hours (
  business_id uuid references businesses(id) on delete cascade not null,
  weekday int not null check (weekday between 0 and 6),
  opens_at time not null default '07:00',
  closes_at time not null default '23:00',
  closed boolean not null default false,
  primary key (business_id, weekday)
);

alter table business_hours enable row level security;

create policy "member full access" on business_hours
  for all using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));

-- Backfill: negócios que já existem recebem os 7 dias com o valor que hoje
-- é fixo no código (07:00–23:00, todo dia aberto) — ninguém muda de janela
-- sem entrar em Configurações e editar de propósito.
insert into business_hours (business_id, weekday, opens_at, closes_at, closed)
select b.id, d.weekday, '07:00', '23:00', false
from businesses b
cross join generate_series(0, 6) as d(weekday)
on conflict (business_id, weekday) do nothing;

-- Estende create_business_and_owner (mesmo padrão de 0004/0006) pra
-- negócios novos já nascerem com os 7 dias configurados.
create or replace function create_business_and_owner(business_name text, owner_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_business_id uuid;
  base_slug text;
  final_slug text;
  suffix int := 0;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if exists (select 1 from business_members where user_id = auth.uid()) then
    select business_id into new_business_id
    from business_members where user_id = auth.uid() limit 1;
    return new_business_id;
  end if;

  base_slug := lower(regexp_replace(coalesce(nullif(trim(business_name), ''), 'negocio'), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then
    base_slug := 'negocio';
  end if;
  final_slug := base_slug;

  while exists (select 1 from businesses where slug = final_slug) loop
    suffix := suffix + 1;
    final_slug := base_slug || '-' || suffix;
  end loop;

  insert into businesses (name, slug)
  values (coalesce(nullif(trim(business_name), ''), 'Meu negócio'), final_slug)
  returning id into new_business_id;

  insert into business_members (business_id, user_id, role)
  values (new_business_id, auth.uid(), 'owner');

  insert into fidelity_configs (business_id)
  values (new_business_id);

  insert into services (business_id, name, price, duration_minutes, is_combo, active)
  values
    (new_business_id, 'Corte', 40, 30, false, true),
    (new_business_id, 'Barba', 30, 20, false, true),
    (new_business_id, 'Corte + Barba', 60, 50, true, true),
    (new_business_id, 'Sobrancelha', 15, 10, false, true),
    (new_business_id, 'Pezinho', 15, 10, false, true),
    (new_business_id, 'Coloração', 50, 40, false, true);

  insert into professionals (business_id, user_id, name, role, active)
  values (
    new_business_id,
    auth.uid(),
    coalesce(nullif(trim(owner_name), ''), 'Você'),
    'owner',
    true
  );

  -- Horário padrão pro negócio recém-criado: 07:00–23:00 todo dia, igual
  -- ao AGENDA_START_MIN/END_MIN fixo que existia antes desta migration —
  -- o dono ajusta em Configurações quando quiser.
  insert into business_hours (business_id, weekday, opens_at, closes_at, closed)
  select new_business_id, d.weekday, '07:00', '23:00', false
  from generate_series(0, 6) as d(weekday);

  return new_business_id;
end;
$$;

grant execute on function create_business_and_owner(text, text) to authenticated;
