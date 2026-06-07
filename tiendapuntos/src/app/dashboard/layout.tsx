import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/lib/actions/auth";
import { NavLink } from "@/components/NavLink";
import { Logo } from "@/components/Logo";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) redirect("/login");

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside className="border-b border-gray-200 bg-white lg:fixed lg:inset-y-0 lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col">
          <div className="border-b border-gray-100 px-5 py-4">
            <Link href="/dashboard">
              <Logo className="text-lg" />
            </Link>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: business.brandColor }}
              >
                {business.logoEmoji}
              </span>
              <p className="truncate text-sm font-medium text-gray-700">{business.name}</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            <NavLink href="/dashboard" icon="🏠" exact>
              Resumen
            </NavLink>
            <NavLink href="/dashboard/customers" icon="👥">
              Clientes
            </NavLink>
            <NavLink href="/dashboard/rewards" icon="🎁">
              Premios
            </NavLink>
            <NavLink href="/dashboard/redemptions" icon="🎟️">
              Canjes
            </NavLink>
            <NavLink href="/dashboard/transactions" icon="📈">
              Movimientos
            </NavLink>
            <NavLink href="/dashboard/reports" icon="📊">
              Reportes
            </NavLink>
            <NavLink href="/dashboard/billing" icon="💳">
              Plan
            </NavLink>
            <NavLink href="/dashboard/settings" icon="⚙️">
              Configuración
            </NavLink>
            <a
              href={`/p/${business.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              <span className="text-lg">🔗</span>
              Portal público ↗
            </a>
          </nav>

          <div className="border-t border-gray-100 p-3">
            <div className="px-2 pb-2">
              <p className="truncate text-sm font-medium text-gray-700">{session.name}</p>
              <p className="truncate text-xs text-gray-400">{session.email}</p>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="btn-secondary w-full">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-64">
        <div className="mx-auto max-w-5xl px-5 py-8">{children}</div>
      </main>
    </div>
  );
}
