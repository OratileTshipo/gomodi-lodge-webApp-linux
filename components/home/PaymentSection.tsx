const METHODS = [
  {
    icon: "M2 7h20v13H2zM17 2l-5 5-5-5",
    title: "EFT / Bank Transfer",
    desc: "Pay directly to our business account. Upload proof of payment and we'll verify within one business day.",
    bg: "bg-walnut-tint",
    color: "text-walnut",
  },
  {
    icon: "M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
    title: "Cash on Arrival",
    desc: "Perfect for leisure guests. Settle in person at check-in — no advance payment required.",
    bg: "bg-terracotta-tint",
    color: "text-terracotta-dark",
  },
  {
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
    title: "Proof of Payment",
    desc: "Upload your POP directly through your booking confirmation and we'll mark it verified on your record.",
    bg: "bg-gold-tint",
    color: "text-gold-dark",
  },
];

/** EFT / cash-on-arrival / POP explainer. */
export function PaymentSection() {
  return (
    <section id="payment" className="py-16 md:py-20 bg-cream">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto motion-fade-up motion-ready">
          <h2 className="font-display font-semibold text-ink text-2xl md:text-3xl">
            How you pay.
          </h2>
          <p className="text-stone mt-3">
            EFT or cash on arrival. No online card processing — just the
            methods our guests already use.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {METHODS.map((p, i) => (
            <div
              key={p.title}
              className="bg-white rounded-2xl p-8 border border-walnut/10 card-shadow card-lift motion-scale-in motion-ready"
              data-stagger={i + 1}
            >
              <div
                className={`w-12 h-12 rounded-xl ${p.bg} flex items-center justify-center ${p.color}`}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d={p.icon} />
                </svg>
              </div>
              <h3 className="font-semibold text-ink mt-4">{p.title}</h3>
              <p className="text-stone text-sm mt-2">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
