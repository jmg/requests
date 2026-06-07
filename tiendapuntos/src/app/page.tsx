import Link from "next/link";
import { Logo } from "@/components/Logo";

const features = [
  {
    icon: "👥",
    title: "Base de clientes",
    text: "Registrá a tus clientes con su teléfono o email y tené todo su historial a mano.",
  },
  {
    icon: "⭐",
    title: "Sumá puntos",
    text: "Cargá puntos por monto de compra o cantidad fija. Vos definís cuántos puntos vale cada peso.",
  },
  {
    icon: "🎁",
    title: "Catálogo de premios",
    text: "Creá premios canjeables, controlá el stock y generá códigos de canje al instante.",
  },
  {
    icon: "📊",
    title: "Métricas en vivo",
    text: "Mirá cuántos puntos emitiste, cuántos se canjearon y quiénes son tus mejores clientes.",
  },
  {
    icon: "🧑‍🤝‍🧑",
    title: "Multiusuario",
    text: "Sumá a tu equipo con roles (dueño, admin y cajero) para que carguen puntos sin acceso total.",
  },
  {
    icon: "🔒",
    title: "Datos aislados",
    text: "Cada negocio tiene su propio espacio. Tus clientes y premios son sólo tuyos.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo className="text-xl" />
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary">
            Ingresar
          </Link>
          <Link href="/register" className="btn-primary">
            Crear cuenta
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 text-center">
        <span className="badge bg-brand-100 text-brand-700">
          Programa de fidelización para tu negocio
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Premiá a tus clientes y hacé que vuelvan
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
          TiendaPuntos es la forma simple de armar tu propio sistema de puntos: sumá puntos por cada
          compra y dejá que tus clientes los canjeen por premios. Sin tarjetas de plástico, todo
          desde tu panel.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            Empezar gratis
          </Link>
          <Link href="/login" className="btn-secondary px-6 py-3 text-base">
            Ya tengo cuenta
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
          <h2 className="text-3xl font-bold">Listo en 2 minutos</h2>
          <p className="mt-3 text-brand-100">
            Creá tu cuenta, cargá tus premios y empezá a sumar puntos hoy mismo.
          </p>
          <Link
            href="/register"
            className="btn mt-6 bg-white px-6 py-3 text-base text-brand-700 hover:bg-brand-50"
          >
            Crear mi cuenta
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-gray-500">
        <Logo /> — Demo de programa de fidelización · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
