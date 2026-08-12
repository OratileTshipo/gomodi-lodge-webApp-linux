"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);
  const router = useRouter();

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDevOtp(undefined);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      if (data.devOtp) {
        setDevOtp(data.devOtp);
      } else if (data.message) {
        const otpMatch = data.message.match(/OTP: (\d{6})/);
        if (otpMatch) {
          setDevOtp(otpMatch[1]);
        }
      }

      setStep("otp");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      if (!res.ok) throw new Error("Invalid OTP");

      router.push("/admin/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(145deg, #4a2e22 0%, #2e1b14 50%, #1a0f0a 100%)",
          }}
        />
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 flex flex-col justify-center px-16 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-terracotta flex items-center justify-center text-cream-light font-bold text-lg shadow-lg shadow-terracotta/30">
              G
            </div>
            <div>
              <div className="font-semibold text-cream-light text-lg">
                Gomodi Guest Lodge
              </div>
            </div>
          </div>
          <div className="font-display text-4xl italic font-semibold text-gold-light tracking-wide mb-6">
            Iphe Lerato
          </div>
          <p className="text-cream/60 text-base leading-relaxed">
            Staff approval and management dashboard. Review booking requests,
            manage availability, and track operations.
          </p>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-cream-light">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-terracotta flex items-center justify-center text-cream-light font-bold text-lg shadow-lg shadow-terracotta/30 mx-auto mb-3">
              G
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              Gomodi Admin
            </h1>
            <p className="text-stone text-sm mt-1">Staff management portal</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1 className="font-display text-2xl font-semibold text-ink">
              Sign in to admin
            </h1>
            <p className="text-stone text-sm mt-1">
              Enter your phone number to receive an OTP
            </p>
          </div>

          {/* Development OTP */}
          {devOtp && (
            <div className="mb-6 bg-gold-tint border border-gold/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="text-gold-dark"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-gold-dark font-semibold text-sm">
                  Development Mode
                </span>
              </div>
              <div className="text-3xl font-bold text-terracotta-dark tracking-[0.2em] text-center py-2 bg-white rounded-lg border border-walnut/10">
                {devOtp}
              </div>
              <p className="text-stone text-xs mt-2 text-center">
                In production, OTP arrives via WhatsApp
              </p>
            </div>
          )}

          {/* Login card */}
          <div className="bg-white rounded-2xl border border-walnut/10 shadow-sm p-8">
            {step === "phone" ? (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label htmlFor="adminPhone" className="block text-sm font-medium text-ink mb-1.5">
                    Phone Number
                  </label>
                  <input
                    id="adminPhone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+27..."
                    className="w-full px-4 py-3 bg-white border border-walnut/20 rounded-lg text-sm focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta outline-none transition-all"
                    required
                  />
                </div>
                {error && (
                  <div className="bg-terracotta-tint border border-terracotta/30 rounded-lg p-3 text-sm text-terracotta-dark flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 px-4 rounded-lg font-semibold text-sm disabled:opacity-50 shadow-sm shadow-terracotta-dark/20 hover:shadow-md hover:shadow-terracotta-dark/30 transition-all btn-press ripple"
                >
                  {loading ? "Sending..." : "Request OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label htmlFor="adminOtp" className="block text-sm font-medium text-ink mb-1.5">
                    Enter OTP
                  </label>
                  <input
                    id="adminOtp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-white border border-walnut/20 rounded-lg text-sm text-center text-2xl tracking-[0.3em] font-semibold focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta outline-none transition-all"
                    required
                  />
                </div>
                {error && (
                  <div className="bg-terracotta-tint border border-terracotta/30 rounded-lg p-3 text-sm text-terracotta-dark flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 px-4 rounded-lg font-semibold text-sm disabled:opacity-50 shadow-sm shadow-terracotta-dark/20 hover:shadow-md hover:shadow-terracotta-dark/30 transition-all btn-press ripple"
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setDevOtp(undefined);
                    setError("");
                  }}
                  className="w-full text-stone hover:text-ink text-sm py-2 transition-colors"
                >
                  ← Back to phone number
                </button>
              </form>
            )}
          </div>

          {/* Test credentials */}
          <div className="mt-6 text-center text-xs text-stone/60">
            <p className="mb-1 font-medium text-stone">Test credentials</p>
            <p>Owner: +27820000001 · Manager: +27820000002 · Staff: +27820000003</p>
            <p>Partner (Lelz): +27780784139</p>
          </div>
        </div>
      </div>
    </div>
  );
}
