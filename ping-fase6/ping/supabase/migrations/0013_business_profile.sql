-- PING · migration 0013_business_profile
-- Perfil público do negócio: amenidades (checkboxes simples), endereço e
-- link do Google Maps. Sem geocoding/embed — só o link que o dono cola,
-- resolvido num botão "Como chegar" (Fase 2 edita, Fase 5 exibe em /b/[slug]).
alter table businesses add column if not exists address text;
alter table businesses add column if not exists maps_url text;
alter table businesses add column if not exists has_wifi boolean not null default false;
alter table businesses add column if not exists has_kids_area boolean not null default false;
alter table businesses add column if not exists has_parking boolean not null default false;
alter table businesses add column if not exists has_accessibility boolean not null default false;

-- `businesses` só tinha policy de SELECT até aqui (ver 0001_init.sql) — o
-- dono nunca editava a própria linha antes de existir a tela de
-- Configurações. Sem policy de UPDATE, a Fase 2 não conseguiria salvar
-- essas colunas com o client autenticado normal (mesmo padrão de escrita já
-- usado em renameProfessional, app/agenda/actions.ts).
create policy "member updates own business" on businesses
  for update using (id in (select auth_business_ids()))
  with check (id in (select auth_business_ids()));

-- Sem policy de SELECT pra visitante anônimo de propósito: a Fase 5 (perfil
-- público em /b/[slug]) vai ler essa linha com o service role client, no
-- mesmo padrão que app/cliente já usa pra tudo que roda sem sessão do
-- Supabase Auth (ver lib/supabase/serviceRole.ts) — RLS continua "só
-- membro" em toda parte, sem abrir leitura anônima nova.
