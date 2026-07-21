-- PING · migration 0009_transaction_kind
-- O dashboard precisa contar "pontos resgatados hoje", mas `transactions`
-- não tem como distinguir um resgate de fidelidade (ver redeemReward em
-- app/fidelidade/actions.ts) de uma despesa qualquer em dinheiro — ambos
-- caem em type='despesa'. Em vez de sobrecarregar `type` (que já tem um
-- check constraint e é usado pra receita/despesa/comissão no Financeiro),
-- uma coluna nova e opcional só pra marcar a origem.
alter table transactions add column if not exists kind text;
