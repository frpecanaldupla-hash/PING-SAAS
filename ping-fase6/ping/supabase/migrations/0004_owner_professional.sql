-- PING · migration 0004_owner_professional
-- Estende create_business_and_owner mais uma vez para já criar o dono como
-- o primeiro profissional da Agenda, usando o nome que ele mesmo digitou no
-- cadastro (não um nome genérico tipo "Dono"). Sem isso, a tela de Agenda
-- nasce sem ninguém pra escolher no agendamento — beco sem saída.
--
-- `owner_name` é opcional (default null) só por segurança de compatibilidade
-- — o app sempre vai mandar o nome real digitado no cadastro.
--
-- Precisa dropar a assinatura antiga de 1 parâmetro antes de recriar com 2,
-- senão o Postgres mantém as duas versões da função ao mesmo tempo e toda
-- chamada com 1 argumento só vira "function is not unique".

drop function if exists create_business_and_owner(text);

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

  -- O dono já entra como o primeiro profissional da Agenda. `user_id`
  -- aponta pra ele mesmo, o que permite depois identificar "qual chip de
  -- profissional é o meu" pra mostrar o lápis de editar nome só nele.
  insert into professionals (business_id, user_id, name, role, active)
  values (
    new_business_id,
    auth.uid(),
    coalesce(nullif(trim(owner_name), ''), 'Você'),
    'owner',
    true
  );

  return new_business_id;
end;
$$;

grant execute on function create_business_and_owner(text, text) to authenticated;
