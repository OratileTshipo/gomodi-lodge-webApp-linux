import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BranchModalProvider } from "@/components/BranchModalContext";
import { BranchModal } from "@/components/BranchModal";
import { FadeInObserver } from "@/components/FadeInObserver";
import { MotionObserver } from "@/lib/motion";

export const metadata: Metadata = {
  title: "Gomodi Guest Lodge | Boutique Guest House",
  description:
    "9 recently renovated en-suite rooms in Mahikeng. Book direct for the best rates — leisure stays, corporate & government bookings, and events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-cream-light text-ink">
        <BranchModalProvider>
          <Nav />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
          <BranchModal />
          <FadeInObserver />
          <MotionObserver />
        </BranchModalProvider>
      </body>
    </html>
  );
}
