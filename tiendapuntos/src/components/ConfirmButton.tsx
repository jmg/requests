"use client";

import { useFormStatus } from "react-dom";

function Inner({
  children,
  className,
  pendingText,
}: {
  children: React.ReactNode;
  className: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText ?? "…" : children}
    </button>
  );
}

// Botón que envuelve una server action con confirmación previa.
export function ConfirmButton({
  action,
  children,
  confirm = "¿Confirmás esta acción?",
  className = "btn-danger",
  pendingText,
}: {
  action: () => void | Promise<void>;
  children: React.ReactNode;
  confirm?: string;
  className?: string;
  pendingText?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      <Inner className={className} pendingText={pendingText}>
        {children}
      </Inner>
    </form>
  );
}
