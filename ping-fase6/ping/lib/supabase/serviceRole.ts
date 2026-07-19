import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente com a service_role key — ignora TODAS as políticas de RLS.
// Só pode ser importado por código que roda no servidor (Server Actions,
// Route Handlers, Server Components): NUNCA por um Client Component, e
// NUNCA reexportado de um jeito que acabe no bundle do navegador.
//
// É o único jeito de acessar `clients`/`client_sessions` na Área do
// Cliente, porque quem está logado ali não tem sessão do Supabase Auth —
// o login é próprio, por telefone + senha numérica (ver
// supabase/migrations/0007_client_portal.sql) — não existe `auth.uid()`
// para as policies de RLS reconhecerem.
//
// Requer a variável de ambiente SUPABASE_SERVICE_ROLE_KEY (painel do
// Supabase → Project Settings → API → "service_role" secret). Nunca
// prefixe essa variável com NEXT_PUBLIC_ — isso a exporia no navegador.
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada. Veja o LEIA-ME.md da Área do Cliente."
    );
  }

  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
