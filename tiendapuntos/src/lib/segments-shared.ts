// Constantes de segmentos sin dependencias de servidor (seguras para el cliente).
export const SEGMENTS = [
  "ALL",
  "HAS_EMAIL",
  "BIRTHDAYS",
  "INACTIVE_30",
  "INACTIVE_60",
  "INACTIVE_90",
] as const;

export type Segment = (typeof SEGMENTS)[number];

export function isSegment(value: string): value is Segment {
  return (SEGMENTS as readonly string[]).includes(value);
}
