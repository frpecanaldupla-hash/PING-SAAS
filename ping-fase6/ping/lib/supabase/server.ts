import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Usado em Server Components, Server Actions e Route Handlers.
// Lê/escreve a sessão via cookies do Next, respeitando o RLS do Supabase por request.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
  try {
    cookiesToSet.forEach(({ name, value, options }) =>
      cookieStore.set(name, value, options)
    );
  } catch {
    // Chamado de um Server Component sem permissão de escrita — ok,
    // o middleware cuida de renovar a sessão nesse caso.
  }
},
      },
    }
  );
}
