// Helpers varios.

export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// Genera un código corto y legible para los canjes (ej: "7K3Q-9F2M").
export function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = (n: number) =>
    Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `${pick(4)}-${pick(4)}`;
}

// Código de referido corto y legible (ej: "JUAN-7K3Q").
export function generateReferralCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
}

// Mapea el locale de la app (es/en) a un BCP-47 para Intl.
export function intlLocale(locale?: string): string {
  return locale === "en" ? "en-US" : "es-AR";
}

export function formatNumber(n: number, locale?: string): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(n);
}

export function formatDate(d: Date | string, locale?: string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatCurrency(n: number, currency = "ARS", locale?: string): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}
