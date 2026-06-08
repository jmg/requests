import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { ProfileForm, ChangePasswordForm } from "@/components/account/AccountForms";

export default async function AccountPage() {
  const t = await getTranslations("account");
  const session = (await getSession())!;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">{t("profileTitle")}</h2>
        <ProfileForm name={session.name} email={session.email} />
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">{t("passwordTitle")}</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
