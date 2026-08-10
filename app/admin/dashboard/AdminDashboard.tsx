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
  notifiedPartnerAt?: string | null;
  contactedAt?: string | null;
}

interface User {
  userId: number;
  name: string;
  role: "owner" | "assistant" | "staff" | "partner";
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
  const isPartner = user?.role === "partner";

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
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/requests");
        if (!res.ok) throw new Error("Failed to fetch");
        // Role scoping is enforced server-side: owner/assistant see all,
        // staff see leisure only, partner (Lelz) sees events only.
        setRequests(await res.json());
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
      setClockTimestamp(data.record?.timestamp ?? new Date().toISOString());
    } catch {
      alert("Failed to log time. Please try again.");
    } finally {
      setClockLoading(false);
    }
  }

  async function handleContactAction(id: number) {
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "contact" }),
      });
      if (!res.ok) throw new Error("Failed to mark contacted");
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, contactedAt: new Date().toISOString() } : r
        )
      );
    } catch {
      alert("Failed to mark as contacted. Please try again.");
    }
  }

  async function handleBookingAction(id: number, action: "approve" | "decline") {
    const confirmMsg =
      action === "approve"
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
      alert(
        `Failed to ${action} booking: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
  };

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

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
    });

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
      <div className="min-h-screen bg-cream-light">
        {/* Skeleton header */}
        <div className="bg-white border-b border-walnut/10 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-48 bg-skeleton rounded animate-pulse" />
              <div className="h-3 w-32 bg-skeleton-light rounded animate-pulse" />
            </div>
            <div className="h-9 w-24 bg-skeleton rounded-lg animate-pulse" />
          </div>
        </div>
        {/* Skeleton cards */}
        <div className="max-w-5xl mx-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-walnut/10 p-5 h-24 animate-pulse"
              />
            ))}
          </div>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-walnut/10 p-6 h-48 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light">
      {/* HEADER */}
      <header className="bg-white border-b border-walnut/10 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-terracotta flex items-center justify-center text-cream-light font-bold text-sm shadow-sm shadow-terracotta/20">
              G
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-ink leading-tight">
                {isManager
                  ? "Operations Dashboard"
                  : isPartner
                    ? "Partner Dashboard"
                    : "Staff Dashboard"}
              </h1>
              <p className="text-xs text-stone">
                {user.name} · {user.role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => router.push("/")}
              className="px-3 py-2 text-stone hover:text-ink hover:bg-walnut/5 text-sm rounded-lg transition-colors"
            >
              ← Site
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-stone hover:text-terracotta-dark hover:bg-terracotta-tint/50 text-sm font-medium rounded-lg transition-colors"
            >
              Logout
            </button>

            {/* TIME CLOCK (not shown to the Lelz partner — she isn't lodge staff) */}
            {!isPartner && (
              <div className="ml-2 pl-2 border-l border-walnut/10">
                <button
                  onClick={handleClockAction}
                  disabled={clockLoading}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm text-white flex items-center gap-2 transition-all btn-press ${
                    clockStatus === "clock_in"
                      ? "bg-terracotta-dark hover:bg-[#74301f] shadow-sm shadow-terracotta-dark/20"
                      : "bg-walnut hover:bg-walnut-dark shadow-sm shadow-walnut/20"
                  } disabled:opacity-50`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {clockLoading
                    ? "Logging..."
                    : clockStatus === "clock_in"
                      ? "Clock Out"
                      : "Clock In"}
                </button>
                {clockTimestamp && clockStatus && (
                  <span className="block text-[10px] text-stone text-right mt-1">
                    {clockStatus === "clock_in" ? "Clocked in" : "Clocked out"} ·{" "}
                    {fmtClockTime(clockTimestamp)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {/* MANAGER: Stats */}
        {isManager && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-2xl border border-walnut/10 shadow-sm">
              <div className="text-stone text-[11px] uppercase tracking-wider font-semibold">
                Pending Requests
              </div>
              <div className="text-3xl font-bold text-ink mt-1">
                {requests.length}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-walnut/10 shadow-sm">
              <div className="text-stone text-[11px] uppercase tracking-wider font-semibold">
                Conflicts
              </div>
              <div className="text-3xl font-bold text-terracotta-dark mt-1">
                {requests.filter((r) => r.conflict).length}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-walnut/10 shadow-sm">
              <div className="text-stone text-[11px] uppercase tracking-wider font-semibold">
                Occupancy (Est)
              </div>
              <div className="text-3xl font-bold text-walnut mt-1">65%</div>
            </div>
          </div>
        )}

        {/* REQUESTS */}
        <div className="space-y-4">
          {requests.length === 0 && (
            <div className="bg-white rounded-2xl border border-walnut/10 shadow-sm p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center mx-auto mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="text-stone"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p className="text-stone font-medium">All caught up</p>
              <p className="text-stone/60 text-sm mt-1">
                No pending requests to review
              </p>
            </div>
          )}

          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white p-5 md:p-6 rounded-2xl border border-walnut/10 shadow-sm"
            >
              {/* Conflict banners */}
              {req.pendingWarning && (
                <div className="bg-gold-tint border border-gold/40 text-gold-dark font-medium p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {req.pendingWarning}
                </div>
              )}

              {req.conflict && (
                <div className="bg-terracotta-tint border border-terracotta/40 text-terracotta-dark font-medium p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  {req.conflict}
                </div>
              )}

              {/* Header row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={getCategoryColor(req.category)}>
                  {getCategoryLabel(req.category)}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    req.proofOfPaymentUploaded
                      ? "bg-walnut-tint text-walnut"
                      : "bg-cream text-stone border border-walnut/10"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${req.proofOfPaymentUploaded ? "bg-walnut" : "bg-stone/30"}`}
                  />
                  POP {req.proofOfPaymentUploaded ? "Uploaded" : "Not Yet"}
                </span>
                {req.category === "event" && req.contactedAt && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-walnut-tint text-walnut">
                    <span className="w-1.5 h-1.5 rounded-full bg-walnut" />
                    Contacted
                  </span>
                )}
                {req.category === "event" && isManager && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      req.notifiedPartnerAt
                        ? "bg-walnut-tint text-walnut"
                        : "bg-gold-tint text-gold-dark border border-gold/30"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        req.notifiedPartnerAt ? "bg-walnut" : "bg-gold-dark"
                      }`}
                    />
                    Lelz {req.notifiedPartnerAt ? "Notified" : "Not Alerted"}
                  </span>
                )}
                <h3 className="font-semibold text-ink text-base ml-auto">
                  {req.guestName}
                </h3>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm border-t border-walnut/10 pt-4 mb-4">
                {/* Corporate fields */}
                {req.category === "corporate" && req.corporateDetails && (
                  <>
                    <div className="md:col-span-2">
                      <span className="text-stone block text-[10px] uppercase tracking-wider font-semibold mb-1">
                        Company
                      </span>
                      <span className="text-ink font-medium">
                        {req.corporateDetails.companyName}
                      </span>
                      {req.corporateDetails.jobTitle && (
                        <span className="block text-stone text-xs">
                          ({req.corporateDetails.jobTitle})
                        </span>
                      )}
                    </div>
                    {req.corporateDetails.poNumber && (
                      <div>
                        <span className="text-stone block text-[10px] uppercase tracking-wider font-semibold mb-1">
                          PO Number
                        </span>
                        <span className="text-ink font-medium">
                          {req.corporateDetails.poNumber}
                        </span>
                      </div>
                    )}
                    {req.corporateDetails.vatNumber && (
                      <div>
                        <span className="text-stone block text-[10px] uppercase tracking-wider font-semibold mb-1">
                          VAT Number
                        </span>
                        <span className="text-ink font-medium">
                          {req.corporateDetails.vatNumber}
                        </span>
                      </div>
                    )}
                    {req.corporateDetails.billingEmail && (
                      <div>
                        <span className="text-stone block text-[10px] uppercase tracking-wider font-semibold mb-1">
                          Billing Email
                        </span>
                        <span className="text-ink font-medium">
                          {req.corporateDetails.billingEmail}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Event fields */}
                {req.category === "event" && req.eventDetails && (
                  <>
                    <div>
                      <span className="text-stone block text-[10px] uppercase tracking-wider font-semibold mb-1">
                        Event Type
                      </span>
                      <span className="text-ink font-medium capitalize">
                        {req.eventDetails.eventType.replace("-", " ")}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone block text-[10px] uppercase tracking-wider font-semibold mb-1">
                        Event Date
                      </span>
                      <span className="text-ink font-medium">
                        {fmtDate(req.eventDetails.eventDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone block text-[10px] uppercase tracking-wider font-semibold mb-1">
                        Expected Guests
                      </span>
                      <span className="text-ink font-medium">
                        {req.eventDetails.expectedGuests}
                      </span>
                    </div>
                    {req.eventDetails.cateringPackage && (
                      <div>
                        <span className="text-stone block text-[10px] uppercase tracking-wider font-semibold mb-1">
                          Catering
                        </span>
                        <span className="text-ink font-medium capitalize">
                          {req.eventDetails.cateringPackage.replace("-", " ")}
                        </span>
                      </div>
                    )}
                    {req.eventDetails.interestedInRooms && (
                      <div className="md:col-span-2">
                        <span className="inline-flex items-center gap-1.5 bg-walnut-tint text-walnut px-2.5 py-1 rounded text-xs font-medium">
                          Interested in room bookings
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Leisure fields */}
                {req.category === "leisure" && (
                  <>
                    <div>
                      <span className="text-stone block text-[10px] uppercase tracking-wider font-semibold mb-1">
                        Dates
                      </span>
                      <span className="text-ink font-medium">
                        {req.checkIn && req.checkOut
                          ? `${fmtDate(req.checkIn)} → ${fmtDate(req.checkOut)}`
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone block text-[10px] uppercase tracking-wider font-semibold mb-1">
                        Room
                      </span>
                      <span className="text-ink font-medium">
                        {req.roomName ?? "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone block text-[10px] uppercase tracking-wider font-semibold mb-1">
                        Guests
                      </span>
                      <span className="text-ink font-medium">
                        {req.guestCount ?? "—"}
                      </span>
                    </div>
                  </>
                )}

                {/* Contact */}
                <div>
                  <span className="text-stone block text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Contact
                  </span>
                  <span className="text-ink font-medium">
                    {req.contactPhone}
                  </span>
                  {req.contactEmail && (
                    <span className="block text-stone text-xs">
                      {req.contactEmail}
                    </span>
                  )}
                </div>

                {/* Meals */}
                {req.addOns && req.addOns.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-stone block text-[10px] uppercase tracking-wider font-semibold mb-1">
                      Meals
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {req.addOns.map((addon, idx) => (
                        <span
                          key={idx}
                          className="bg-cream text-stone px-2 py-0.5 rounded text-xs border border-walnut/10"
                        >
                          {addon.type} ({addon.persons}p)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Requests */}
                {req.specialRequests && (
                  <div className="md:col-span-2">
                    <span className="text-stone block text-[10px] uppercase tracking-wider font-semibold mb-1">
                      Special Requests
                    </span>
                    <p className="text-ink italic bg-cream p-2.5 rounded-lg border-l-2 border-gold-dark text-sm">
                      &ldquo;{req.specialRequests}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {isManager ||
              (isPartner && req.category === "event") ||
              (!isManager && !isPartner && req.category === "leisure") ? (
                <div className="flex gap-3 pt-3 border-t border-walnut/10">
                  {/* Partner (Lelz) can also mark event requests "Contacted" */}
                  {isPartner && req.category === "event" &&
                    (req.contactedAt ? (
                      <div className="flex-1 flex items-center justify-center gap-1.5 bg-walnut-tint text-walnut px-4 py-2.5 rounded-lg text-sm font-semibold">
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Contacted
                      </div>
                    ) : (
                      <button
                        onClick={() => handleContactAction(req.id)}
                        className="flex-1 bg-gold-tint text-gold-dark border border-gold/40 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gold/20 transition-colors btn-press"
                      >
                        Mark Contacted
                      </button>
                    ))}
                  <button
                    onClick={() => handleBookingAction(req.id, "approve")}
                    className="flex-1 bg-walnut text-cream-light px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-walnut-dark transition-colors btn-press shadow-sm shadow-walnut/20"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleBookingAction(req.id, "decline")}
                    className="flex-1 border border-walnut/20 text-walnut px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-walnut/5 transition-colors btn-press"
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-walnut/10">
                  <div className="bg-cream text-stone px-4 py-2.5 rounded-lg text-sm text-center font-medium">
                    Manager Approval Required
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
