"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AddOn {
  type: string;
  persons: number;
  date: string;
}

interface CorporateDetails {
  jobTitle?: string | null;
  companyName: string;
  billingEmail?: string | null;
  poNumber?: string | null;
  vatNumber?: string | null;
  clientRef?: string | null;
  notes?: string | null;
}

interface EventDetails {
  eventType: string;
  expectedGuests: number;
  eventDate: string;
  altDate?: string | null;
  cateringPackage?: string | null;
  interestedInRooms: boolean;
  notes?: string | null;
}

interface BookingRequest {
  id: number;
  category: "leisure" | "corporate" | "event";
  guestName: string;
  contactPhone: string;
  contactEmail?: string | null;
  // null for event requests, which have no room line
  checkIn?: string | null;
  checkOut?: string | null;
  roomName?: string | null;
  guestCount?: number | null;
  specialRequests?: string | null;
  status: "pending" | "approved" | "declined";
  conflict?: string | null;
  pendingWarning?: string | null;
  addOns?: AddOn[];
  corporateDetails?: CorporateDetails | null;
  eventDetails?: EventDetails | null;
  proofOfPaymentUploaded: boolean;
}

interface User {
  userId: number;
  name: string;
  role: "owner" | "assistant" | "staff";
}

export function AdminDashboard() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [clockStatus, setClockStatus] = useState<"clock_in" | "clock_out" | null>(null);
  const [clockTimestamp, setClockTimestamp] = useState<string | null>(null);
  const [clockLoading, setClockLoading] = useState(false);
  const router = useRouter();

  const isManager = user?.role === "owner" || user?.role === "assistant";

  // Mount-time data fetches live directly in the effects as async IIFEs so
  // setState only ever runs in async continuations (react-hooks lint rule).
  // `router` is stable so the session check still runs exactly once on mount.
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          setUser(await res.json());
        } else {
          router.push("/admin");
        }
      } catch {
        router.push("/admin");
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const manager = user.role === "owner" || user.role === "assistant";
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/requests");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        // RBAC Filter: Staff only see Leisure. Managers see all.
        const filtered = !manager ? data.filter((r: BookingRequest) => r.category === "leisure") : data;
        setRequests(filtered);
      } catch (err) {
        console.error("Failed to load requests:", err);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    })();
    void (async () => {
      try {
        const res = await fetch(`/api/admin/time-clock?userId=${user.userId}`);
        if (res.ok) {
          const data = await res.json();
          setClockStatus(data.lastAction);
          setClockTimestamp(data.lastTimestamp ?? null);
        }
      } catch (err) {
        console.error("Failed to load clock status", err);
      }
    })();
  }, [user]);

  async function handleClockAction() {
    if (!user) return;
    setClockLoading(true);
    const newAction = clockStatus === "clock_in" ? "clock_out" : "clock_in";
    
    try {
      const res = await fetch("/api/admin/time-clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId, action: newAction }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setClockStatus(newAction);
      // Show the exact logged timestamp returned by the server
      setClockTimestamp(data.record?.timestamp ?? new Date().toISOString());
    } catch {
      alert("Failed to log time. Please try again.");
    } finally {
      setClockLoading(false);
    }
  }

  async function handleBookingAction(id: number, action: "approve" | "decline") {
    const confirmMsg = action === "approve" 
      ? "Approve this booking? The guest will be notified." 
      : "Decline this booking?";
      
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || `Failed to ${action} booking.`);
        return;
      }
      
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(`Failed to ${action} booking: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  const handleLogout = async () => {
    // Session cookie is httpOnly — only the server can clear it.
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
  };

  // Reuse the public pill system so category chips match the site exactly
  // (incl. the contrast-corrected event gold).
  const getCategoryColor = (cat: string) => {
    if (cat === "leisure") return "pill pill-leisure";
    if (cat === "corporate") return "pill pill-corporate";
    if (cat === "event") return "pill pill-event";
    return "pill pill-neutral";
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === "leisure") return "LEISURE";
    if (cat === "corporate") return "CORPORATE";
    if (cat === "event") return "EVENT";
    return cat.toUpperCase();
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });

  const fmtClockTime = (iso: string) =>
    new Date(iso).toLocaleString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-cream-light p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl card-shadow border border-walnut/10 p-6 h-40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              {isManager ? "Operations Dashboard" : "Staff Dashboard"}
            </h1>
            <p className="text-sm text-stone">Logged in as {user.name} ({user.role})</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={() => router.push("/")} className="text-stone hover:text-ink text-sm">← Site</button>
            <button onClick={handleLogout} className="text-red-600 text-sm font-medium">Logout</button>
            
            {/* TIME CLOCK */}
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleClockAction}
                disabled={clockLoading}
                className={`px-4 py-2 rounded-lg font-semibold text-sm text-white flex items-center gap-2 ${clockStatus === "clock_in" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} disabled:opacity-50`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {clockLoading ? "Logging..." : (clockStatus === "clock_in" ? "Clock Out" : "Clock In")}
              </button>
              {clockTimestamp && clockStatus && (
                <span className="text-[11px] text-stone">
                  {clockStatus === "clock_in" ? "Clocked in" : "Clocked out"} · {fmtClockTime(clockTimestamp)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* MANAGER ONLY: Operations Report */}
        {isManager && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-2xl card-shadow border border-walnut/10">
              <div className="text-stone text-xs uppercase">Total Pending</div>
              <div className="text-2xl font-bold text-ink">{requests.length}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl card-shadow border border-walnut/10">
              <div className="text-stone text-xs uppercase">Conflicts</div>
              <div className="text-2xl font-bold text-red-600">{requests.filter(r => r.conflict).length}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl card-shadow border border-walnut/10">
              <div className="text-stone text-xs uppercase">Occupancy (Est)</div>
              <div className="text-2xl font-bold text-green-600">65%</div>
            </div>
          </div>
        )}

        {/* REQUESTS LIST */}
        <div className="space-y-4">
           {requests.length === 0 && (
             <div className="bg-white rounded-2xl card-shadow border border-walnut/10 p-12 text-center">
               <p className="text-stone text-lg">No pending requests — you&apos;re all caught up.</p>
             </div>
           )}
           
           {requests.map(req => (
             <div key={req.id} className="bg-white p-4 md:p-6 rounded-2xl border border-walnut/10 card-shadow">
                
                {/* SOFT CONFLICT WARNING (Amber - Phase 2b Style Note) */}
                {req.pendingWarning && (
                  <div className="bg-amber-100 border border-amber-300 text-amber-900 font-bold p-3 rounded-md mb-3 text-sm tracking-wide flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {req.pendingWarning}
                  </div>
                )}

                {/* HARD CONFLICT BANNER (Red - Phase 2b Style Note) */}
                {req.conflict && (
                  <div className="bg-red-600 text-white font-bold p-3 rounded-md mb-4 text-sm tracking-wide flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    {req.conflict}
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={getCategoryColor(req.category)}>
                    {getCategoryLabel(req.category)}
                  </span>
                  {/* Proof of Payment Badge - Phase 2b Style Note: Always show with text label */}
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    req.proofOfPaymentUploaded 
                      ? "bg-green-100 text-green-800" 
                      : "bg-cream text-stone border border-walnut/10"
                  }`}>
                    Proof of Payment: {req.proofOfPaymentUploaded ? "Uploaded" : "Not Yet"}
                  </span>
                  <h3 className="font-semibold text-lg text-ink">{req.guestName}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm border-t border-walnut/10 pt-4 mb-4">
                  {/* Corporate-specific fields */}
                  {req.category === "corporate" && req.corporateDetails && (
                    <>
                      <div className="md:col-span-2">
                        <span className="text-stone block text-xs uppercase tracking-wide mb-1">Company</span>
                        <span className="text-ink font-medium">{req.corporateDetails.companyName}</span>
                        {req.corporateDetails.jobTitle && (
                          <span className="block text-stone text-xs">({req.corporateDetails.jobTitle})</span>
                        )}
                      </div>
                      {req.corporateDetails.poNumber && (
                        <div>
                          <span className="text-stone block text-xs uppercase tracking-wide mb-1">PO Number</span>
                          <span className="text-ink font-medium">{req.corporateDetails.poNumber}</span>
                        </div>
                      )}
                      {req.corporateDetails.vatNumber && (
                        <div>
                          <span className="text-stone block text-xs uppercase tracking-wide mb-1">VAT Number</span>
                          <span className="text-ink font-medium">{req.corporateDetails.vatNumber}</span>
                        </div>
                      )}
                      {req.corporateDetails.billingEmail && (
                        <div>
                          <span className="text-stone block text-xs uppercase tracking-wide mb-1">Billing Email</span>
                          <span className="text-ink font-medium">{req.corporateDetails.billingEmail}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Event-specific fields */}
                  {req.category === "event" && req.eventDetails && (
                    <>
                      <div>
                        <span className="text-stone block text-xs uppercase tracking-wide mb-1">Event Type</span>
                        <span className="text-ink font-medium capitalize">{req.eventDetails.eventType.replace("-", " ")}</span>
                      </div>
                      <div>
                        <span className="text-stone block text-xs uppercase tracking-wide mb-1">Event Date</span>
                        <span className="text-ink font-medium">{fmtDate(req.eventDetails.eventDate)}</span>
                      </div>
                      <div>
                        <span className="text-stone block text-xs uppercase tracking-wide mb-1">Expected Guests</span>
                        <span className="text-ink font-medium">{req.eventDetails.expectedGuests}</span>
                      </div>
                      {req.eventDetails.cateringPackage && (
                        <div>
                          <span className="text-stone block text-xs uppercase tracking-wide mb-1">Catering</span>
                          <span className="text-ink font-medium capitalize">{req.eventDetails.cateringPackage.replace("-", " ")}</span>
                        </div>
                      )}
                      {req.eventDetails.interestedInRooms && (
                        <div className="md:col-span-2">
                          <span className="text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-medium">Interested in room bookings for guests</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Standard fields for all categories */}
                  {req.category === "leisure" && (
                    <>
                      <div>
                        <span className="text-stone block text-xs uppercase tracking-wide mb-1">Dates</span>
                        <span className="text-ink font-medium">{req.checkIn && req.checkOut ? `${fmtDate(req.checkIn)} → ${fmtDate(req.checkOut)}` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-stone block text-xs uppercase tracking-wide mb-1">Room</span>
                        <span className="text-ink font-medium">{req.roomName ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-stone block text-xs uppercase tracking-wide mb-1">Guests</span>
                        <span className="text-ink font-medium">{req.guestCount ?? "—"}</span>
                      </div>
                    </>
                  )}

                  {/* Contact info for all */}
                  <div>
                    <span className="text-stone block text-xs uppercase tracking-wide mb-1">Contact</span>
                    <span className="text-ink font-medium">{req.contactPhone}</span>
                    {req.contactEmail && <span className="block text-stone text-xs">{req.contactEmail}</span>}
                  </div>
                  
                  {/* Add-ons */}
                  {req.addOns && req.addOns.length > 0 && (
                    <div className="md:col-span-2">
                      <span className="text-stone block text-xs uppercase tracking-wide mb-1">Meals</span>
                      <div className="flex flex-wrap gap-2">
                        {req.addOns.map((addon, idx) => (
                          <span key={idx} className="bg-walnut-tint text-walnut px-2 py-1 rounded text-xs">
                            {addon.type} ({addon.persons}p)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Requests */}
                  {req.specialRequests && (
                    <div className="md:col-span-2">
                      <span className="text-stone block text-xs uppercase tracking-wide mb-1">Special Requests</span>
                      <p className="text-ink italic bg-cream p-2 rounded border-l-2 border-gold-dark">
                        &ldquo;{req.specialRequests}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* RBAC: Staff cannot approve/decline corporate or event requests */}
                {!isManager && (req.category === "corporate" || req.category === "event") ? (
                  <div className="pt-2 border-t border-walnut/10">
                    <div className="bg-cream text-stone px-3 py-2 rounded-lg text-sm text-center font-medium opacity-60 pointer-events-none">
                      Manager Approval Required
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 pt-2 border-t border-walnut/10">
                    <button 
                      onClick={() => handleBookingAction(req.id, "approve")} 
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleBookingAction(req.id, "decline")} 
                      className="flex-1 btn-outline px-3 py-2 rounded-lg text-sm font-medium"
                    >
                      Decline
                    </button>
                  </div>
                )}
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
