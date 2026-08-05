import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-ink text-cream/70 py-12">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-terracotta flex items-center justify-center text-cream-light font-bold text-sm">
              G
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-cream-light text-sm">Gomodi Guest Lodge</div>
            </div>
          </div>
          <div className="text-xl md:text-2xl italic font-semibold text-gold-light tracking-wide mb-4">
            Iphe Lerato
          </div>
          <p className="text-sm max-w-sm">
            Nine rooms, freshly renovated. Leisure stays, corporate bookings, and
            private events — all booked directly with us.
          </p>
          <div className="mt-4 text-xs text-cream/70">
            <p className="font-medium text-cream/80 mb-1">Address</p>
            <p>Unit 13, Mmabatho</p>
            <p>Mafikeng, North West Province</p>
            <p>South Africa</p>
          </div>
        </div>
        <div>
          <h4 className="text-cream-light font-semibold text-sm mb-3">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/rooms" className="hover:text-cream-light">Rooms</Link></li>
            <li><Link href="/book" className="hover:text-cream-light">Book a Stay</Link></li>
            <li><Link href="/events" className="hover:text-cream-light">Events</Link></li>
            <li><Link href="/corporate" className="hover:text-cream-light">Corporate</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-cream-light font-semibold text-sm mb-3">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li>WhatsApp (fastest)</li>
            <li>enquiries@gomodiguestlodge.co.za</li>
            <li>South Africa</li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-10 pt-6 border-t border-cream/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div>© 2026 Gomodi Guest Lodge. All rights reserved.</div>
        <div className="flex gap-6">
          <span className="hover:text-cream-light cursor-pointer">Privacy (POPIA)</span>
          <span className="hover:text-cream-light cursor-pointer">Terms</span>
          <span className="hover:text-cream-light cursor-pointer">Cancellation Policy</span>
        </div>
      </div>
    </footer>
  );
}
