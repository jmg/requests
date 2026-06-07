import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4 text-center">
      <Logo className="text-2xl" />
      <div>
        <h1 className="text-3xl font-bold">404</h1>
        <p className="mt-2 text-gray-500">No encontramos lo que estabas buscando.</p>
      </div>
      <Link href="/dashboard" className="btn-primary">
        Volver al panel
      </Link>
    </div>
  );
}
