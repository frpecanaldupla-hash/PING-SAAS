-- PING · migration 0001_init
-- Schema inicial + RLS. Todo dado é isolado por business_id: cada usuário só
-- enxerga o negócio ao qual pertence (via tabela business_members).

create extension if not exists "uuid-ossp";

create table businesses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  logo_url text,
  created_at timestamptz not null default now()
);

create table business_members (
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','professional')),
  primary key (business_id, user_id)
);

create table services (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  price numeric(10,2) not null,
  duration_minutes int not null,
  is_combo boolean not null default false,
  combo_service_ids uuid[],
  active boolean not null default true
);

create table professionals (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  name text not null,
  avatar_url text,
  role text not null default 'professional',
  active boolean not null default true,
  commission_percent numeric(5,2)
);

create table clients (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  phone text not null,
  birthday date,
  points int not null default 0,
  total_visits int not null default 0,
  last_visit_at timestamptz,
  qr_token uuid not null default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  unique (business_id, phone)
);

create table fidelity_configs (
  business_id uuid primary key references businesses(id) on delete cascade,
  points_per_real numeric(5,2) not null default 1,
  points_per_visit int not null default 10,
  reward_threshold int not null default 500,
  reward_value numeric(10,2) not null default 50
);

create table appointments (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  client_id uuid references clients(id) not null,
  professional_id uuid references professionals(id) not null,
  service_ids uuid[] not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled','checked_in','in_progress','completed','no_show','cancelled')),
  total_price numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  appointment_id uuid references appointments(id),
  professional_id uuid references professionals(id),
  amount numeric(10,2) not null,
  method text not null check (method in ('pix','cartao','dinheiro')),
  type text not null check (type in ('receita','despesa','comissao')),
  created_at timestamptz not null default now()
);

create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  message text not null,
  audience text not null check (audience in ('todos','inativos_30d','aniversariantes','pontos_altos')),
  status text not null default 'rascunho' check (status in ('rascunho','agendada','enviada')),
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

-- ==================== RLS ====================

alter table businesses enable row level security;
alter table business_members enable row level security;
alter table services enable row level security;
alter table professionals enable row level security;
alter table clients enable row level security;
alter table fidelity_configs enable row level security;
alter table appointments enable row level security;
alter table transactions enable row level security;
alter table campaigns enable row level security;

-- Helper: negócios aos quais o usuário autenticado pertence
create or replace function auth_business_ids()
returns setof uuid
language sql stable
as $$
  select business_id from business_members where user_id = auth.uid();
$$;

create policy "member reads own business" on businesses
  for select using (id in (select auth_business_ids()));

create policy "member reads own membership" on business_members
  for select using (user_id = auth.uid());

-- Política padrão replicada em todas as tabelas com business_id:
-- leitura e escrita só dentro do(s) negócio(s) do usuário autenticado.
create policy "member full access" on services
  for all using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));

create policy "member full access" on professionals
  for all using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));

create policy "member full access" on clients
  for all using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));

create policy "member full access" on fidelity_configs
  for all using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));

create policy "member full access" on appointments
  for all using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));

create policy "member full access" on transactions
  for all using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));

create policy "member full access" on campaigns
  for all using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));
