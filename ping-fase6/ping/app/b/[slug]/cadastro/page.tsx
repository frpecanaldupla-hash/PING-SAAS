import { notFound } from "next/navigation";
import { RegisterForm } from "@/components/negocio/RegisterForm";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export default async function BusinessRegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServiceRoleClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();

  if (!business) notFound();

  return <RegisterForm slug={slug} businessName={business.name} />;
}
