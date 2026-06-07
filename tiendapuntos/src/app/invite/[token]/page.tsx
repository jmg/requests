import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/Logo";
import { AcceptInviteForm } from "@/components/invite/AcceptInviteForm";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  STAFF: "Cajero",
  OWNER: "Dueño",
};

export default async function InvitePage({ params }: { params: { token: string } }) {
  const invitation = await prisma.invitation.findUnique({
    where: { token: params.token },
    include: { business: true },
  });

  const invalid = !invitation || invitation.acceptedAt || invitation.expiresAt < new Date();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <Link href="/">
        <Logo className="mb-8 text-2xl" />
      </Link>
      <div className="w-full max-w-md card">
        {invalid ? (
          <div className="text-center">
            <h1 className="text-xl font-bold">Invitación no válida</h1>
            <p className="mt-2 text-sm text-gray-500">
              Esta invitación no existe, ya fue usada o expiró. Pedile al negocio que te envíe una
              nueva.
            </p>
            <Link href="/login" className="btn-secondary mt-6">
              Ir al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold">Sumate a {invitation!.business.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Te invitaron como{" "}
              <span className="font-medium text-gray-700">
                {roleLabels[invitation!.role] ?? invitation!.role}
              </span>
              . Creá tu cuenta para empezar.
            </p>
            <AcceptInviteForm token={params.token} email={invitation!.email} />
          </>
        )}
      </div>
    </div>
  );
}
