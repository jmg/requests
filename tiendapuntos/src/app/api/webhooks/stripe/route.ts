import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripeEnabled, getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  if (!stripeEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe no configurado", { status: 400 });
  }

  const stripe = getStripe();
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Falta firma", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Firma inválida: ${err instanceof Error ? err.message : "error"}`, {
      status: 400,
    });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const sessionObj = event.data.object as Stripe.Checkout.Session;
      const businessId = sessionObj.metadata?.businessId;
      if (businessId) {
        await prisma.business.update({
          where: { id: businessId },
          data: {
            plan: "PRO",
            planSince: new Date(),
            stripeCustomerId: (sessionObj.customer as string) ?? undefined,
            stripeSubscriptionId: (sessionObj.subscription as string) ?? undefined,
          },
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const business = await prisma.business.findFirst({
        where: { stripeSubscriptionId: sub.id },
      });
      if (business) {
        await prisma.business.update({
          where: { id: business.id },
          data: { plan: "FREE", planSince: new Date(), stripeSubscriptionId: null },
        });
      }
      break;
    }
    default:
      break;
  }

  return new Response("ok", { status: 200 });
}
