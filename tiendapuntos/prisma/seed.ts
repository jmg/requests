import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function code() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const p = (n: number) =>
    Array.from({ length: n }, () => a[Math.floor(Math.random() * a.length)]).join("");
  return `${p(4)}-${p(4)}`;
}

async function main() {
  console.log("🌱 Sembrando datos de demo…");

  // Limpiamos el negocio demo previo (idempotente).
  const existing = await prisma.business.findUnique({ where: { slug: "cafe-central" } });
  if (existing) {
    await prisma.business.delete({ where: { id: existing.id } });
  }

  const password = await bcrypt.hash("demo1234", 10);

  const business = await prisma.business.create({
    data: {
      name: "Café Central",
      slug: "cafe-central",
      pointsName: "puntos",
      pointsPerCurrency: 1,
      currency: "ARS",
      brandColor: "#7c3aed",
      logoEmoji: "☕",
      plan: "PRO",
      referrerBonus: 100,
      refereeBonus: 50,
      birthdayBonus: 200,
      tiers: {
        create: [
          { name: "Bronce", threshold: 0, multiplier: 1, color: "#b45309" },
          { name: "Plata", threshold: 1000, multiplier: 1.2, color: "#64748b" },
          { name: "Oro", threshold: 5000, multiplier: 1.5, color: "#d97706" },
        ],
      },
      users: {
        create: [
          { name: "Ana Dueña", email: "demo@tiendapuntos.com", password, role: "OWNER" },
          { name: "Caja 1", email: "caja@tiendapuntos.com", password, role: "STAFF" },
        ],
      },
      rewards: {
        create: [
          { name: "Café gratis", description: "Un café de especialidad", pointsCost: 100, stock: null, active: true },
          { name: "Medialuna", description: "Medialuna de manteca", pointsCost: 50, stock: 30, active: true },
          { name: "Combo desayuno", description: "Café + tostado + jugo", pointsCost: 400, stock: 10, active: true },
          { name: "Taza de regalo", description: "Taza con logo", pointsCost: 800, stock: 5, active: false },
        ],
      },
    },
    include: { users: true, rewards: true },
  });

  const owner = business.users.find((u) => u.role === "OWNER")!;
  const reward = business.rewards[0];

  // Un par de cumpleaños en el mes actual para ver el widget.
  const thisMonth = new Date().getMonth();
  const bday = (day: number) => new Date(1990, thisMonth, day);

  const customersData = [
    { name: "Juan Pérez", phone: "+54 11 5555-1111", email: "juan@example.com", points: 350, birthday: bday(12) },
    { name: "María Gómez", phone: "+54 11 5555-2222", email: "maria@example.com", points: 120, birthday: bday(24) },
    { name: "Carlos Ruiz", phone: "+54 11 5555-3333", points: 0, birthday: null as Date | null },
    { name: "Lucía Fernández", phone: "+54 11 5555-4444", email: "lucia@example.com", points: 5980, birthday: null as Date | null },
  ];

  for (const c of customersData) {
    const customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        name: c.name,
        phone: c.phone,
        email: c.email ?? null,
        points: c.points,
        lifetimePoints: c.points,
        birthday: c.birthday,
        referralCode: code().replace("-", ""),
      },
    });

    if (c.points > 0) {
      await prisma.pointsTransaction.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          type: "EARN",
          points: c.points,
          amount: c.points,
          note: "@@demoInitial",
          userId: owner.id,
        },
      });
    }
  }

  // Un canje pendiente de ejemplo para Lucía.
  const lucia = await prisma.customer.findFirst({
    where: { businessId: business.id, name: "Lucía Fernández" },
  });
  if (lucia) {
    await prisma.$transaction([
      prisma.pointsTransaction.create({
        data: {
          businessId: business.id,
          customerId: lucia.id,
          type: "REDEEM",
          points: -reward.pointsCost,
          note: `@@redeem|${reward.name}`,
          userId: owner.id,
        },
      }),
      prisma.customer.update({
        where: { id: lucia.id },
        data: { points: { decrement: reward.pointsCost } },
      }),
      prisma.redemption.create({
        data: {
          businessId: business.id,
          customerId: lucia.id,
          rewardId: reward.id,
          rewardName: reward.name,
          pointsCost: reward.pointsCost,
          code: code(),
          status: "PENDING",
        },
      }),
    ]);
  }

  console.log("✅ Listo. Ingresá con:");
  console.log("   Dueño  → demo@tiendapuntos.com / demo1234");
  console.log("   Cajero → caja@tiendapuntos.com / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
