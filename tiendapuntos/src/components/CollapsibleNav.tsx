"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

// Envuelve la navegación del panel: en mobile se colapsa detrás de un botón;
// en pantallas grandes siempre está visible.
export function CollapsibleNav({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cerramos el menú al navegar.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-600 lg:hidden"
      >
        <span className="text-lg">☰</span> {t("menu")}
      </button>
      <div className={`${open ? "flex" : "hidden"} flex-1 flex-col lg:flex`}>{children}</div>
    </>
  );
}
