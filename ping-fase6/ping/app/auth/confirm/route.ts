import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Route Handler dedicada para o link de confirmação de e-mail, em vez de
// deixar o Supabase mandar direto para a ConfirmationURL padrão dele.
// Motivo: a maioria dos clientes de e-mail (Gmail, Outlook) faz um
// pré-carregamento de segurança em todo link recebido, o que consome o
// token de uso único do Supabase antes do usuário clicar — o resultado é
// "Email link is invalid or has expired" mesmo num link legítimo e recém
// enviado. Uma Route Handler nossa não sofre esse pré-carregamento porque
// não é um destino conhecido de scanners de e-mail. Ver emailRedirectTo em
// RegisterForm.tsx.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmacao`);
}
