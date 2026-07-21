"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/ui/cn";

// Campos de formulário do design system. Encapsulam o padrão que hoje está
// copiado e colado em LoginForm, RegisterForm, BookingDrawer etc:
// label pequena em paper-500 + campo ink-800 com borda que acende em
// signal no foco. `label` e `hint`/`error` são opcionais; o id é gerado
// e amarrado automaticamente (acessibilidade de leitor de tela grátis).

const FIELD_CLASSES = cn(
  "w-full bg-ink-800 border border-ink-700 rounded-sm px-4 py-3 text-sm",
  "placeholder:text-paper-500/60",
  "focus:border-signal-500 outline-none transition-colors"
);

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    hint?: string;
    error?: string | null;
  }
>(function Input({ label, hint, error, className, id: idProp, ...props }, ref) {
  const autoId = useId();
  const id = idProp ?? autoId;

  return (
    <div>
      {label && (
        <label htmlFor={id} className="text-xs text-paper-500 mb-1.5 block">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(FIELD_CLASSES, error && "border-danger/60", className)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {hint && !error && <p className="text-[11px] text-paper-500 mt-1.5">{hint}</p>}
      {error && <p className="text-danger text-xs mt-1.5">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    hint?: string;
    error?: string | null;
  }
>(function Textarea({ label, hint, error, className, id: idProp, ...props }, ref) {
  const autoId = useId();
  const id = idProp ?? autoId;

  return (
    <div>
      {label && (
        <label htmlFor={id} className="text-xs text-paper-500 mb-1.5 block">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(FIELD_CLASSES, "resize-none", error && "border-danger/60", className)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {hint && !error && <p className="text-[11px] text-paper-500 mt-1.5">{hint}</p>}
      {error && <p className="text-danger text-xs mt-1.5">{error}</p>}
    </div>
  );
});
