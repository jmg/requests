// Configuración de planes del SaaS.
import type { Plan } from "@prisma/client";

export type PlanConfig = {
  id: Plan;
  name: string;
  price: string;
  priceDetail: string;
  customerLimit: number | null; // null = ilimitado
  rewardLimit: number | null;
  teamLimit: number | null;
  features: string[];
};

export const PLANS: Record<Plan, PlanConfig> = {
  FREE: {
    id: "FREE",
    name: "Free",
    price: "$0",
    priceDetail: "para siempre",
    customerLimit: 50,
    rewardLimit: 5,
    teamLimit: 2,
    features: [
      "Hasta 50 clientes",
      "Hasta 5 premios",
      "2 usuarios en el equipo",
      "Portal del cliente final",
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    price: "$15.000",
    priceDetail: "por mes",
    customerLimit: null,
    rewardLimit: null,
    teamLimit: null,
    features: [
      "Clientes ilimitados",
      "Premios ilimitados",
      "Equipo ilimitado",
      "Reportes y exportación a CSV",
      "Branding personalizado",
      "Soporte prioritario",
    ],
  },
};

export function planConfig(plan: Plan): PlanConfig {
  return PLANS[plan];
}
