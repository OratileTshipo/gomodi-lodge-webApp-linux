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
    <div
      className={`${bg} w-full h-full flex items-center justify-center ${className}`}
    >
      <span className="text-white font-bold text-xs uppercase tracking-wide opacity-90 text-center px-3">
        {label}
      </span>
    </div>
  );
}
