import { cookies } from "next/headers";
import crypto from "crypto";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

// Sessão própria da Área do Cliente — não é cookie do Supabase Auth (esse
// é gerenciado por @supabase/ssr em lib/supabase/server.ts e serve só pra
// login da equipe). O token nunca é guardado em texto puro: só o hash vai
// pro banco (client_sessions.token_hash); o valor puro fica só no cookie
// httpOnly do navegador do cliente.

const COOKIE_NAME = "ping_client_session";
const SESSION_DAYS = 30;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Salga com o próprio id do cliente. O objetivo aqui não é resistir a um
// ataque sofisticado de força bruta num PIN de 4 dígitos — é simplesmente
// não guardar o número em texto puro no banco.
export function hashPin(pin: string, clientId: string) {
  return crypto.createHash("sha256").update(`${clientId}:${pin}`).digest("hex");
}

export async function createClientSession(clientId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("client_sessions").insert({
    client_id: clientId,
    token_hash: hashToken(token),
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error("Não foi possível criar a sessão do cliente.");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getSessionClientId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("client_sessions")
    .select("client_id, expires_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (!data || new Date(data.expires_at) < new Date()) return null;
  return data.client_id as string;
}

export async function destroyClientSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    const supabase = createServiceRoleClient();
    await supabase.from("client_sessions").delete().eq("token_hash", hashToken(token));
  }

  cookieStore.delete(COOKIE_NAME);
}
