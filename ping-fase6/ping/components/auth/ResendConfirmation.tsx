"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ResendConfirmation() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
      },
    });

    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-success">
        Novo link enviado para <strong className="text-paper-50">{email}</strong>.
        Confira sua caixa de entrada (e o spam).
      </p>
    );
  }

  return (
    <form onSubmit={handleResend} className="flex flex-col gap-2.5">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu e-mail"
        className="w-full bg-ink-800 border border-ink-700 rounded-sm px-4 py-3 text-sm focus:border-signal-500 outline-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full py-3 bg-signal-500 hover:bg-signal-400 disabled:opacity-60 text-ink-950 font-semibold rounded-sm text-sm transition-colors"
      >
        {status === "sending" ? "Enviando..." : "Reenviar link de confirmação"}
      </button>
      {status === "error" && (
        <p className="text-danger text-xs">
          Não foi possível reenviar agora. Tente de novo em instantes.
        </p>
      )}
    </form>
  );
}
