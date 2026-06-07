// Helpers para construir URLs públicas de la app.

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function rootDomain(): string {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
}

// URL del portal público de un negocio. Usa subdominio si hay dominio raíz
// configurado distinto de localhost; si no, cae al path /p/[slug].
export function portalUrl(slug: string): string {
  const root = rootDomain();
  const base = appUrl();
  const isLocal = root.startsWith("localhost") || root.startsWith("127.0.0.1");
  if (isLocal) return `${base}/p/${slug}`;
  const protocol = base.startsWith("https") ? "https" : "http";
  return `${protocol}://${slug}.${root}`;
}

export function inviteUrl(token: string): string {
  return `${appUrl()}/invite/${token}`;
}
