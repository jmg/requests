export function TierBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="badge text-white"
      style={{ backgroundColor: color }}
    >
      ★ {name}
    </span>
  );
}
