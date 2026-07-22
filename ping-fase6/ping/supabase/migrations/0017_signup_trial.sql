-- PING · migration 0017_signup_trial
-- Todo negócio novo já nasce com 7 dias de trial e o plano que o dono
-- escolheu no cadastro (sem cobrar nada ainda — isso é a Fase 3). O plano
-- escolhido fica guardado desde já; só o status muda de 'trial' pra 'ativo'
-- quando o primeiro pagamento for confirmado.

-- Mais um parâmetro novo (3 → 4) — precisa dropar a versão de 3 parâmetros
-- antes, senão ficam duas funções e uma chamada com nomeados vira
-- "function is not unique" (mesmo motivo de 0004 e 0015).
drop function if exists create_business_and_owner(text, text, text);

create or replace function create_business_and_owner(
  business_name text,
  owner_name text default null,
  p_referral_code text default null,
  p_plan text default 'mensal'
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
  chosen_plan text;
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

  -- Plano inválido/ausente cai pro mesmo padrão do check constraint —
  -- 'mensal' é o mais seguro (menor valor cobrado se algo passar batido).
  chosen_plan := case
    when p_plan in ('mensal', 'trimestral', 'anual') then p_plan
    else 'mensal'
  end;

  insert into subscriptions (business_id, plan, status, trial_started_at, trial_ends_at)
  values (new_business_id, chosen_plan, 'trial', now(), now() + interval '7 days');

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

grant execute on function create_business_and_owner(text, text, text, text) to authenticated;
