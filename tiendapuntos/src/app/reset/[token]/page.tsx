import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/Logo";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ResetPage({ params }: { params: { token: string } }) {
  const t = await getTranslations("reset");
  const reset = await prisma.passwordReset.findUnique({ where: { token: params.token } });
  const invalid = !reset || reset.usedAt || reset.expiresAt < new Date();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <Link href="/">
        <Logo className="mb-8 text-2xl" />
      </Link>
      <div className="w-full max-w-md card">
        {invalid ? (
          <div className="text-center">
            <h1 className="text-xl font-bold">{t("invalidTitle")}</h1>
            <p className="mt-2 text-sm text-gray-500">{t("invalidText")}</p>
            <Link href="/forgot" className="btn-secondary mt-6">
              {t("requestNew")}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold">{t("title")}</h1>
            <ResetPasswordForm token={params.token} />
          </>
        )}
      </div>
    </div>
  );
}
