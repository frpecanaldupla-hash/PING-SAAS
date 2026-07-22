-- PING · migration 0016_subscriptions
-- Assinatura do PING (o SaaS cobrando o DONO da barbearia/salão) — não
-- confundir com `fidelity_configs`/`clients.points`, que é o programa de
-- fidelidade do dono pros CLIENTES dele. Regra de ouro: nenhum dado de
-- cartão/pagamento aqui, só plano escolhido, status, datas e o id da
-- assinatura no Mercado Pago — o cartão em si fica 100% do lado deles.

create table subscriptions (
  business_id uuid primary key references businesses(id) on delete cascade,
  -- Só planos de verdade — "trial" é status, não plano: o dono já escolhe
  -- qual dos 3 vai usar no cadastro (Fase 2), só não paga ainda.
  plan text not null check (plan in ('mensal', 'trimestral', 'anual')),
  status text not null default 'trial' check (status in ('trial', 'ativo', 'vencido', 'cancelado')),
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  -- Preenchido só depois do primeiro pagamento confirmado — quando a
  -- assinatura paga atual vence e precisa renovar.
  current_period_ends_at timestamptz,
  provider text,
  provider_subscription_id text,
  -- Nunca aplica trial/limite de clientes/modo leitura pra essa conta —
  -- ver lib/billing/*. Setado à mão pra contas internas de teste, nunca
  -- pelo próprio dono.
  is_internal_account boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

-- Só leitura pro próprio negócio — mesmo padrão de `businesses` em
-- 0001_init.sql: de propósito NÃO existe policy de insert/update pra
-- usuário autenticado. Toda escrita (criar no cadastro, atualizar no
-- webhook de pagamento) passa por function SECURITY DEFINER ou service
-- role, nunca por um dono editando o próprio status de assinatura direto.
create policy "member reads own subscription" on subscriptions
  for select using (business_id in (select auth_business_ids()));

-- Backfill: todo negócio que já existe hoje nasceu antes do billing existir
-- — são contas de teste/desenvolvimento, não clientes pagantes de verdade.
-- Marcar como interna evita travar qualquer uma delas quando as fases
-- seguintes (trial automático, modo leitura) entrarem em vigor, sem
-- precisar identificar uma conta específica. Negócios criados a partir de
-- agora (Fase 2) nascem com is_internal_account = false e trial normal.
insert into subscriptions (business_id, plan, status, is_internal_account)
select id, 'mensal', 'ativo', true
from businesses
on conflict (business_id) do nothing;
