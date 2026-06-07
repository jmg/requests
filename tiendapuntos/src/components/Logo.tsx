export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        ★
      </span>
      <span>
        Tienda<span className="text-brand-600">Puntos</span>
      </span>
    </span>
  );
}
