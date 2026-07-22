import { LoginFlow } from "@/components/cliente/LoginFlow";

export default async function ClienteEntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ negocio?: string }>;
}) {
  const { negocio } = await searchParams;
  return <LoginFlow slug={negocio} />;
}
