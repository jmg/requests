import { prisma } from "@/lib/prisma";
import { mpEnabled, getMpPayment } from "@/lib/mercadopago";

// Webhook de Mercado Pago: ante un pago aprobado, activa el plan Pro del negocio
// (identificado por external_reference = businessId).
export async function POST(req: Request) {
  if (!mpEnabled()) return new Response("Mercado Pago no configurado", { status: 400 });

  const url = new URL(req.url);
  let type = url.searchParams.get("type") || url.searchParams.get("topic");
  let dataId = url.searchParams.get("data.id") || url.searchParams.get("id");

  // MP también puede enviar el detalle en el body.
  if (!type || !dataId) {
    try {
      const body = (await req.json()) as { type?: string; data?: { id?: string } };
      type = type || body.type || null;
      dataId = dataId || body.data?.id || null;
    } catch {
      /* sin body JSON */
    }
  }

  if (type === "payment" && dataId) {
    const payment = await getMpPayment(dataId);
    if (payment?.status === "approved" && payment.external_reference) {
      await prisma.business.update({
        where: { id: payment.external_reference },
        data: { plan: "PRO", planSince: new Date() },
      });
    }
  }

  // Siempre 200 para que MP no reintente indefinidamente.
  return new Response("ok", { status: 200 });
}
