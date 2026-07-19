-- PING · migration 0006_stamp_card_defaults
-- Muda o modelo de fidelidade de "pontos por dinheiro gasto" (que nem
-- estava sendo usado de verdade — points_per_real nunca foi lido em nenhum
-- lugar do código) para cartão de carimbo: 1 carimbo por visita, N carimbos
-- vira 1 prêmio. Não precisa mexer no check-in — ele já soma
-- `points_per_visit` a cada visita, só muda o valor desse número.
--
-- Atualiza tanto o padrão pra negócios novos quanto os negócios que já
-- existem hoje (todos ainda estão no valor padrão antigo, porque a tela de
-- configurar fidelidade nunca existiu até agora — ninguém teve como mudar
-- esses números na mão ainda).

alter table fidelity_configs alter column points_per_visit set default 1;
alter table fidelity_configs alter column reward_threshold set default 10;
alter table fidelity_configs alter column reward_value set default 40;

update fidelity_configs set points_per_visit = 1 where points_per_visit = 10;
update fidelity_configs set reward_threshold = 10 where reward_threshold = 500;
update fidelity_configs set reward_value = 40 where reward_value = 50;
