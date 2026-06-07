"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePlanAction } from "@/lib/actions/settings";

export function ChangePlanButton({
  plan,
  label,
  className,
  style,
  confirm,
}: {
  plan: "FREE" | "PRO";
  label: string;
  className: string;
  style?: React.CSSProperties;
  confirm?: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      style={style}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        startTransition(async () => {
          await changePlanAction(plan);
          router.refresh();
        });
      }}
    >
      {pending ? "Procesando…" : label}
    </button>
  );
}
