create table revenue_goals (
  business_id uuid primary key references businesses(id) on delete cascade,
  monthly_target numeric(10,2) not null default 0
);

alter table revenue_goals enable row level security;

create policy "member full access" on revenue_goals
  for all using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));
