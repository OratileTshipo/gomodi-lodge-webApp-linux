import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative bg-ink text-cream/70 pt-14 pb-10">
      {/* Gradient top accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-terracotta/50 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center text-cream-light font-bold text-sm shadow-lg shadow-terracotta/20">
              G
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-cream-light text-sm">
                Gomodi Guest Lodge
              </div>
            </div>
          </div>
          <div className="font-display text-2xl md:text-3xl italic font-semibold text-gold-light tracking-wide mb-4">
            Iphe Lerato
          </div>
          <p className="text-sm max-w-sm leading-relaxed">
            Nine rooms, freshly renovated. Leisure stays, corporate bookings,
            and private events — booked directly with us.
          </p>
          <div className="mt-6 text-xs text-cream/60">
            <p className="font-medium text-cream/80 mb-1.5 uppercase tracking-wider text-[10px]">
              Address
            </p>
            <p className="leading-relaxed">
              Unit 13, Mmabatho
              <br />
              Mafikeng, North West Province
              <br />
              South Africa
            </p>
          </div>
        </div>
        <div>
          <h4 className="text-cream-light font-semibold text-sm mb-4 uppercase tracking-wider text-[10px]">
            Explore
          </h4>
          <ul className="space-y-0.5 text-sm">
            {[
              { href: "/rooms", label: "Rooms" },
              { href: "/book", label: "Book a Stay" },
              { href: "/events", label: "Events" },
              { href: "/corporate", label: "Corporate" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-2 py-3 hover:text-cream-light transition-colors"
                >
                  <span className="w-1 h-1 rounded-full bg-terracotta-dark/60" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-cream-light font-semibold text-sm mb-4 uppercase tracking-wider text-[10px]">
            Contact
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <svg
                className="w-4 h-4 mt-0.5 text-terracotta-dark flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>WhatsApp (fastest)</span>
            </li>
            <li className="flex items-start gap-2.5">
              <svg
                className="w-4 h-4 mt-0.5 text-terracotta-dark flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>enquiries@gomodiguestlodge.co.za</span>
            </li>
            <li className="flex items-start gap-2.5">
              <svg
                className="w-4 h-4 mt-0.5 text-terracotta-dark flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Mafikeng, South Africa</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12 pt-6 border-t border-cream/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div>
            © {new Date().getFullYear()} Gomodi Guest Lodge. All rights
            reserved.
          </div>
          <div className="flex flex-wrap gap-x-1 gap-y-1">
            {["Privacy (POPIA)", "Terms", "Cancellation Policy"].map(
              (item) => (
                <span
                  key={item}
                  className="inline-flex items-center min-h-11 px-3 py-2 hover:text-cream-light cursor-pointer transition-colors rounded-lg hover:bg-cream/5"
                >
                  {item}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
