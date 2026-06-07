import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/Logo";
import { AcceptInviteForm } from "@/components/invite/AcceptInviteForm";

export default async function InvitePage({ params }: { params: { token: string } }) {
  const t = await getTranslations("invite");
  const tr = await getTranslations("roles");
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
            <h1 className="text-xl font-bold">{t("invalidTitle")}</h1>
            <p className="mt-2 text-sm text-gray-500">
              {t("invalidText")}
            </p>
            <Link href="/login" className="btn-secondary mt-6">
              {t("goLogin")}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold">{t("joinTitle", { business: invitation!.business.name })}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {t("invitedAs", { role: tr(invitation!.role) })}
            </p>
            <AcceptInviteForm token={params.token} email={invitation!.email} />
          </>
        )}
      </div>
    </div>
  );
}
