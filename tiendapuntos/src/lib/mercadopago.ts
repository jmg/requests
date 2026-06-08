import { appUrl } from "@/lib/app-url";

// Integración con Mercado Pago vía REST (sin SDK). Si no hay access token,
// queda deshabilitada y el upgrade cae al modo simulado.
export function mpEnabled(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

export function mpProPrice(): number {
  const n = Number(process.env.MP_PRO_PRICE);
  return Number.isFinite(n) && n > 0 ? n : 15000;
}

// Crea una preferencia de Checkout Pro y devuelve el init_point (URL de pago).
export async function createMpPreference(opts: {
  businessId: string;
  title: string;
  successUrl: string;
}): Promise<string | undefined> {
  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: opts.title,
          quantity: 1,
          unit_price: mpProPrice(),
          currency_id: "ARS",
        },
      ],
      external_reference: opts.businessId,
      metadata: { businessId: opts.businessId },
      back_urls: {
        success: opts.successUrl,
        pending: opts.successUrl,
        failure: `${appUrl()}/dashboard/billing?canceled=1`,
      },
      auto_return: "approved",
      notification_url: `${appUrl()}/api/webhooks/mercadopago`,
    }),
  });

  if (!res.ok) return undefined;
  const data = (await res.json()) as { init_point?: string };
  return data.init_point;
}

// Consulta el estado de un pago por id (para el webhook).
export async function getMpPayment(
  paymentId: string
): Promise<{ status?: string; external_reference?: string } | null> {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as { status?: string; external_reference?: string };
}
