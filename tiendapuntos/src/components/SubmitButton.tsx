"use client";

import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("common");
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} style={style}>
      {pending ? pendingText ?? t("processing") : children}
    </button>
  );
}
