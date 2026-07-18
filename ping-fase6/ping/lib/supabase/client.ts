import { createBrowserClient } from "@supabase/ssr";

// Usado em Client Components. As chaves públicas são seguras para expor —
// a segurança real vem das políticas de RLS no Supabase, não do sigilo da anon key.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
