"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingText,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  style?: React.CSSProperties;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} style={style}>
      {pending ? pendingText ?? "Procesando…" : children}
    </button>
  );
}
