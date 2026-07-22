-- PING · migration 0015_referrals
-- Indicação entre donos: cada negócio ganha um código único; quem se
-- cadastra com esse código vira uma linha em `referrals`, apontando pro
-- negócio que indicou. `converted_at` só é preenchido quando o indicado
-- completa o PRIMEIRO PAGAMENTO — como billing ainda não existe no PING,
-- isso é feito por creditReferralOnFirstPayment (ver
-- lib/referrals/creditReferralOnFirstPayment.ts), que hoje não tem nenhum
-- lugar que a chame.

alter table businesses add column if not exists referral_code text unique;

-- Backfill: negócios que já existem também ganham código, pra poder indicar
-- a partir de hoje sem esperar recriar a conta.
update businesses
set referral_code = upper(substr(md5(random()::text || id::text), 1, 8))
where referral_code is null;

create table referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_business_id uuid references businesses(id) on delete cascade not null,
  -- unique: um negócio só pode ter sido indicado por UM código — evita
  -- disputa de "quem indicou primeiro" se o mesmo cadastro rodasse duas vezes.
  referred_business_id uuid references businesses(id) on delete cascade not null unique,
  converted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table referrals enable row level security;

create policy "member reads own referrals" on referrals
  for select using (referrer_business_id in (select auth_business_ids()));

-- A RLS padrão de `businesses` ("member reads own business") não deixa o
-- indicador ver o NOME do negócio que ele indicou, já que ele não é membro
-- de lá. Esta policy extra libera só isso: ler businesses que aparecem como
-- referred_business_id numa linha onde o indicador é o dono. Políticas de
-- SELECT no Postgres se somam (OR), então isso não afrouxa nada que já existia.
create policy "referrer reads referred business name" on businesses
  for select using (
    id in (select referred_business_id from referrals where referrer_business_id in (select auth_business_ids()))
  );

-- Estende create_business_and_owner (mesmo padrão de 0004/0006/0011): todo
-- negócio novo já nasce com seu próprio referral_code, e se veio um código
-- de indicação válido, grava o vínculo na mesma transação.
--
-- O número de parâmetros cresceu de 2 pra 3 — `create or replace` só
-- substitui de verdade quando a assinatura é idêntica; sem o drop, ficariam
-- DUAS funções (2 e 3 parâmetros) e uma chamada com 2 argumentos nomeados
-- viraria "function is not unique" (mesmo problema que 0004 já resolveu ao
-- crescer de 1 pra 2 parâmetros).
drop function if exists create_business_and_owner(text, text);

create or replace function create_business_and_owner(
  business_name text,
  owner_name text default null,
  p_referral_code text default null
)
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
  new_referral_code text;
  referrer_id uuid;
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

  new_referral_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  while exists (select 1 from businesses where referral_code = new_referral_code) loop
    new_referral_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  end loop;

  insert into businesses (name, slug, referral_code)
  values (coalesce(nullif(trim(business_name), ''), 'Meu negócio'), final_slug, new_referral_code)
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

  insert into business_hours (business_id, weekday, opens_at, closes_at, closed)
  select new_business_id, d.weekday, '07:00', '23:00', false
  from generate_series(0, 6) as d(weekday);

  if p_referral_code is not null and trim(p_referral_code) <> '' then
    select id into referrer_id from businesses where referral_code = upper(trim(p_referral_code));
    if referrer_id is not null and referrer_id <> new_business_id then
      insert into referrals (referrer_business_id, referred_business_id)
      values (referrer_id, new_business_id)
      on conflict (referred_business_id) do nothing;
    end if;
  end if;

  return new_business_id;
end;
$$;

grant execute on function create_business_and_owner(text, text, text) to authenticated;
