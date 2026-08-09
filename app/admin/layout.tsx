import type { Metadata } from "next";

// The admin area (login, dashboard, quotes editor) must never appear in search
// engines — it's an internal tool gated by OTP login.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
