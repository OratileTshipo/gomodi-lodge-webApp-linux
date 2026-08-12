/**
 * Contact surfaces — single source of truth.
 *
 * The real WhatsApp number is not published yet (PRODUCT.md: phone and
 * WhatsApp links are placeholders and must NOT be presented as real). Until
 * the owner supplies the E.164 number, every WhatsApp CTA renders as "#" so
 * nothing fake ships. When the number lands, update WHATSAPP_NUMBER here and
 * every surface (homepage, corporate, footer, nav) swaps in one place.
 */
export const WHATSAPP_NUMBER: string | null = null;

export function whatsappHref(): string {
  return WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}` : "#";
}

export const ENQUIRIES_EMAIL = "enquiries@gomodiguestlodge.co.za";
export const CORPORATE_EMAIL = "corporate@gomodiguestlodge.co.za";
