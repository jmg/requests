import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/Logo";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export default async function HomePage() {
  const t = await getTranslations("landing");

  const features = [
    { icon: "👥", title: t("f1Title"), text: t("f1Text") },
    { icon: "⭐", title: t("f2Title"), text: t("f2Text") },
    { icon: "🎁", title: t("f3Title"), text: t("f3Text") },
    { icon: "📊", title: t("f4Title"), text: t("f4Text") },
    { icon: "🧑‍🤝‍🧑", title: t("f5Title"), text: t("f5Text") },
    { icon: "🔒", title: t("f6Title"), text: t("f6Text") },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo className="text-xl" />
        <nav className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link href="/login" className="btn-secondary">
            {t("signIn")}
          </Link>
          <Link href="/register" className="btn-primary">
            {t("signUp")}
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 text-center">
        <span className="badge bg-brand-100 text-brand-700">{t("badge")}</span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">{t("heroSubtitle")}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            {t("ctaStart")}
          </Link>
          <Link href="/login" className="btn-secondary px-6 py-3 text-base">
            {t("ctaHave")}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-600 py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl font-bold">{t("ctaSectionTitle")}</h2>
          <p className="mt-3 text-brand-100">{t("ctaSectionText")}</p>
          <Link
            href="/register"
            className="btn mt-6 bg-white px-6 py-3 text-base text-brand-700 hover:bg-brand-50"
          >
            {t("ctaSectionButton")}
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-gray-500">
        <Logo /> — {t("footer")} · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
