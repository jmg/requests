"use client";

import { useState } from "react";

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard no disponible */
    }
  };

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-lg bg-gray-100 px-3 py-2 text-sm">{value}</code>
      <button type="button" onClick={copy} className="btn-secondary shrink-0">
        {copied ? "¡Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
