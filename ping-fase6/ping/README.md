# PING — SaaS para barbearias e salões

"Dá um PING aí." — agendar, fazer check-in e fidelizar em poucos toques.

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS (tokens de design em `tailwind.config.ts`)
- Supabase: Auth, Database (Postgres), Realtime, RLS

## Rodando localmente
```bash
npm install
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
# aplique supabase/migrations/0001_init.sql no seu projeto Supabase (SQL editor ou CLI)
npm run dev
```

## Estrutura
```
app/
  page.tsx            → landing pública (deslogada)
  login/               → login com Supabase Auth
  dashboard/           → hub autenticado (esta era "app/page.tsx" até a fase 3)
  agenda/               → agenda estilo Google Calendar
  checkin/              → check-in via QR Code
  servicos/             → catálogo de serviços e combos
  fidelidade/           → configuração de pontos e resgates
  rh/                    → equipe e comissões
  financeiro/            → caixa e PIX
  campanhas/             → mensagens geradas com IA
  cliente/               → área do cliente (QR Code pessoal)
components/
  layout/               → Sidebar, BottomNav (rotas autenticadas)
  shared/               → PingMark (assinatura visual), ModuleCard
  auth/                  → LoginForm
  agenda/, checkin/, cliente/ → componentes de cada módulo
lib/
  types/                → tipos de domínio, espelham o schema do Supabase
  supabase/              → clients de browser e server
  mock/                  → dados de demonstração (trocar por queries reais)
supabase/
  migrations/            → schema SQL + políticas de RLS
```

## Design
Paleta e tipografia em `tailwind.config.ts` / `app/layout.tsx`:
- `ink` — preto quente de fundo
- `signal` — vermelho de vitrine, usado para ações principais e o "ping"
- `brass` — latão, reservado para fidelidade e destaques premium
- Display: Bebas Neue (headline, números grandes) · Corpo: Manrope · Dados: JetBrains Mono

## Próximas fases
1. ✅ Estrutura + hub principal com navegação
2. ✅ Agenda (estilo Google Calendar) + fluxo de agendamento em 3 toques
3. ✅ Check-in via QR Code + Área do Cliente + login com Supabase Auth
4. ✅ Landing page pública (separada do hub autenticado)
5. Catálogo de serviços e combos (CRUD)
6. Fidelidade configurável
7. ✅ Dashboard (métricas do dia), RH (equipe) e Financeiro (PIX)
8. ✅ Campanhas com sugestão baseada em segmento + envio via WhatsApp
