export function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}

// {nome} vem só do primeiro nome — "Oi João!" soa natural, "Oi João Silva!"
// soa formal demais pra uma mensagem de WhatsApp.
export function personalizeMessage(template: string, vars: { clientName: string; businessName: string }) {
  const firstName = vars.clientName.trim().split(/\s+/)[0] ?? vars.clientName;
  return template.replaceAll("{nome}", firstName).replaceAll("{negocio}", vars.businessName);
}
