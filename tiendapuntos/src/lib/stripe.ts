import Stripe from "stripe";

// Cliente Stripe perezoso: sólo se instancia si hay clave configurada.
let _stripe: Stripe | null = null;

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PRO);
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY no está configurada");
  }
  if (!_stripe) {
    // Sin fijar apiVersion: usa la versión por defecto de la cuenta.
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}
