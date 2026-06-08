// Lógica de niveles VIP.

export type TierLike = {
  id: string;
  name: string;
  threshold: number;
  multiplier: number;
  color: string;
};

// Niveles por defecto que se crean al registrar un negocio.
export const DEFAULT_TIERS = [
  { name: "Bronce", threshold: 0, multiplier: 1, color: "#b45309" },
  { name: "Plata", threshold: 1000, multiplier: 1.2, color: "#64748b" },
  { name: "Oro", threshold: 5000, multiplier: 1.5, color: "#d97706" },
];

// Nivel actual: el de mayor umbral que no supere los puntos acumulados.
export function currentTier<T extends TierLike>(tiers: T[], lifetimePoints: number): T | null {
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
  let result: T | null = null;
  for (const t of sorted) {
    if (lifetimePoints >= t.threshold) result = t;
  }
  return result;
}

// Próximo nivel a alcanzar (si existe).
export function nextTier<T extends TierLike>(tiers: T[], lifetimePoints: number): T | null {
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
  return sorted.find((t) => t.threshold > lifetimePoints) ?? null;
}

// Multiplicador de puntos según el nivel actual (1 si no hay niveles).
export function tierMultiplier(tiers: TierLike[], lifetimePoints: number): number {
  return currentTier(tiers, lifetimePoints)?.multiplier ?? 1;
}
