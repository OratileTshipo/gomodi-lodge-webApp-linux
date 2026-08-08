export function PhotoPlaceholder({
  label = "Photograph",
  className = "",
  tone = "terracotta",
}: {
  label?: string;
  className?: string;
  tone?: "terracotta" | "walnut" | "gold";
}) {
  const bg =
    tone === "walnut"
      ? "bg-walnut"
      : tone === "gold"
      ? "bg-gold"
      : "bg-terracotta";
  return (
    <span
      className={`${bg} block w-full h-full flex items-center justify-center ${className}`}
    >
      {/* Dark scrim behind the caption lifts white text above AA on every
          tone — the bare gold swatch (#d4a574) gave white text only 2.23:1. */}
      <span className="bg-ink/45 text-white font-bold text-xs uppercase tracking-wide text-center px-3 py-1.5 rounded">
        {label}
      </span>
    </span>
  );
}
