import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  // Suspense é exigido pelo Next.js porque LoginForm usa useSearchParams
  // (lê ?error=confirmacao vindo de app/auth/confirm/route.ts) — sem isso,
  // o build falha com "useSearchParams() should be wrapped in a suspense boundary".
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
