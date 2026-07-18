-- PING · migration 0003_default_services
-- Estende create_business_and_owner para deixar um cardápio de partida já
-- pronto (editável) assim que o negócio é criado. Sem isso, /servicos nasce
-- vazio e o dono tem que cadastrar cada corte do zero antes de conseguir
-- usar o resto do produto (agenda e check-in dependem de haver serviço).
--
-- Importante: só roda no momento da CRIAÇÃO do negócio (o guard de
-- idempotência já existente na função retorna cedo se o negócio já existe),
-- então isso nunca sobrescreve um cardápio que o dono já editou.

create or replace function create_business_and_owner(business_name text)
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

  -- Cardápio de partida — o dono edita preço/duração, remove o que não usa
  -- e adiciona serviços ou combos novos depois, em /servicos.
  insert into services (business_id, name, price, duration_minutes, is_combo, active)
  values
    (new_business_id, 'Corte', 40, 30, false, true),
    (new_business_id, 'Barba', 30, 20, false, true),
    (new_business_id, 'Corte + Barba', 60, 50, true, true),
    (new_business_id, 'Sobrancelha', 15, 10, false, true),
    (new_business_id, 'Pezinho', 15, 10, false, true),
    (new_business_id, 'Coloração', 50, 40, false, true);

  return new_business_id;
end;
$$;

grant execute on function create_business_and_owner(text) to authenticated;
