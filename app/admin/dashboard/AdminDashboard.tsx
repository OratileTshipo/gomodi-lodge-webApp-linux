"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingRequest, BookingAction, User } from "./types";
import { AdminHeader } from "./AdminHeader";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { ManagerStats } from "./ManagerStats";
import { RequestCard } from "./RequestCard";
import { EmptyState } from "./EmptyState";

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
        setLoading(false);
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

  async function handleBookingAction(id: number, action: BookingAction) {
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

  if (!user || loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-cream-light">
      <AdminHeader
        user={user}
        isManager={isManager}
        isPartner={isPartner}
        clockStatus={clockStatus}
        clockTimestamp={clockTimestamp}
        clockLoading={clockLoading}
        onClockAction={() => void handleClockAction()}
        onLogout={() => void handleLogout()}
        onGoToReviews={() => router.push("/admin/reviews")}
        onGoToSite={() => router.push("/")}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {isManager && (
          <ManagerStats
            pendingCount={requests.length}
            conflictCount={requests.filter((r) => r.conflict).length}
          />
        )}

        <div className="space-y-4">
          {requests.length === 0 && <EmptyState />}

          {requests.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              isManager={isManager}
              isPartner={isPartner}
              onApprove={(id) => void handleBookingAction(id, "approve")}
              onDecline={(id) => void handleBookingAction(id, "decline")}
              onContact={(id) => void handleContactAction(id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
