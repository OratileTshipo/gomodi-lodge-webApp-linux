export function PhotoPlaceholder({
  label = "Photograph",
  className = "",
  tone = "terracotta",
}: {
  label?: string;
  className?: string;
  tone?: "terracotta" | "walnut" | "gold";
}) {
  const gradients: Record<string, string> = {
    terracotta:
      "linear-gradient(145deg, #c65d3c 0%, #b54d2f 35%, #8f3e25 70%, #6d2d1a 100%)",
    walnut:
      "linear-gradient(145deg, #7a5240 0%, #5e3c2e 35%, #4a2e22 70%, #2e1b14 100%)",
    gold: "linear-gradient(145deg, #d4a574 0%, #c49460 35%, #8f6a3e 70%, #6d5030 100%)",
  };

  const patternColors: Record<string, string> = {
    terracotta: "rgba(255,255,255,0.04)",
    walnut: "rgba(255,255,255,0.035)",
    gold: "rgba(255,255,255,0.05)",
  };

  return (
    <span
      className={`block w-full h-full ${className}`}
      style={{ background: gradients[tone] }}
    >
      {/* Subtle geometric pattern overlay */}
      <span
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, ${patternColors[tone]} 1px, transparent 1px), radial-gradient(circle at 80% 70%, ${patternColors[tone]} 1px, transparent 1px)`,
          backgroundSize: "40px 40px, 60px 60px",
        }}
      />
      {/* Soft vignette for depth */}
      <span
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.15) 100%)",
        }}
      />
      {/* Caption label */}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="bg-ink/50 backdrop-blur-sm text-white/90 font-bold text-[11px] uppercase tracking-wider text-center px-4 py-2 rounded-lg shadow-lg border border-white/10">
          {label}
        </span>
      </span>
    </span>
  );
}
