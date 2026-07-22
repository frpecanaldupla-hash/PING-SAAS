import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  return <RegisterForm referralCode={ref} />;
}
