"use client";

/** Step 4 — guest contact details (name, WhatsApp number, email, notes). */
export function DetailsStep({
  fullName,
  phone,
  email,
  specialRequests,
  setFullName,
  setPhone,
  setEmail,
  setSpecialRequests,
}: {
  fullName: string;
  phone: string;
  email: string;
  specialRequests: string;
  setFullName: (v: string) => void;
  setPhone: (v: string) => void;
  setEmail: (v: string) => void;
  setSpecialRequests: (v: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-walnut/10 shadow-sm p-5 md:p-6 motion-fade-up motion-ready">
      <div className="mb-4">
        <span className="text-terracotta-dark font-semibold text-xs uppercase tracking-wide">Step 4</span>
        <h2 className="font-semibold text-ink text-lg mt-1">Your details</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="detailsFullName" className="block text-sm font-medium text-ink mb-1.5">Full name *</label>
          <input id="detailsFullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta outline-none" />
        </div>
        <div>
          <label htmlFor="detailsPhone" className="block text-sm font-medium text-ink mb-1.5">WhatsApp number *</label>
          <input id="detailsPhone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta outline-none" />
        </div>
        <div>
          <label htmlFor="detailsEmail" className="block text-sm font-medium text-ink mb-1.5">Email (optional)</label>
          <input id="detailsEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta outline-none" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="detailsNotes" className="block text-sm font-medium text-ink mb-1.5">Anything we should know? (optional)</label>
          <textarea id="detailsNotes" value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={3} className="w-full border border-walnut/20 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta outline-none resize-none" placeholder="e.g. Late arrival, extra pillows, dietary requirements..." />
        </div>
      </div>
    </div>
  );
}
