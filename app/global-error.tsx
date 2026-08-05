"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          background: "#faf6f0",
          color: "#2a1e18",
          padding: 48,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong</h1>
        <p style={{ color: "#6b5b50", marginBottom: 24 }}>Please try again, or contact us on WhatsApp for help.</p>
        <button
          onClick={() => reset()}
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: "#c65d3c",
            color: "#faf6f0",
            fontWeight: 600,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
