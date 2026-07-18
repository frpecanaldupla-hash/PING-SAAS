-- PING · migration 0002_signup
-- Não existem políticas de INSERT em `businesses` / `business_members` (só
-- SELECT, ver 0001_init.sql) — de propósito: um usuário autenticado não deve
-- poder inserir uma linha em business_members se atribuindo a um negócio
-- qualquer. Em vez disso, o cadastro passa por esta função SECURITY DEFINER,
-- que cria o negócio e o vínculo de dono (owner) de forma atômica e só para
-- o próprio usuário autenticado (auth.uid()), nunca para outro.

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

  -- Idempotente: se o usuário já tem negócio, não cria outro (isso cobre o
  -- caso de login após confirmação de e-mail chamar esta função de novo).
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

  return new_business_id;
end;
$$;

-- Só usuários autenticados podem chamar — e mesmo assim, só criam negócio
-- para si mesmos (auth.uid() é resolvido no servidor, não vem do cliente).
grant execute on function create_business_and_owner(text) to authenticated;
