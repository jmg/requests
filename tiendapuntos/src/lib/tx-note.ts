// Notas de movimientos generadas por el sistema. Se guardan codificadas
// ("@@<key>|<value>") para poder traducirlas al mostrarlas, en vez de
// persistir texto en un idioma fijo. Las notas escritas por el usuario se
// guardan tal cual (sin el prefijo "@@").

export function encodeNote(key: string, value?: string): string {
  return value != null && value !== "" ? `@@${key}|${value}` : `@@${key}`;
}

export function decodeNote(note: string): { key: string; value?: string } | null {
  if (!note.startsWith("@@")) return null;
  const rest = note.slice(2);
  const idx = rest.indexOf("|");
  if (idx === -1) return { key: rest };
  return { key: rest.slice(0, idx), value: rest.slice(idx + 1) };
}

// Devuelve el texto a mostrar: traduce las notas del sistema y deja intactas
// las notas escritas por el usuario.
export function renderNote(
  note: string | null,
  // El translator de next-intl (getTranslations("txNote")).
  t: (key: any, values?: any) => string
): string | null {
  if (!note) return null;
  const decoded = decodeNote(note);
  if (!decoded) return note;
  return t(decoded.key, decoded.value != null ? { value: decoded.value } : undefined);
}
