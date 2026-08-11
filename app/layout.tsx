import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

// Self-hosted fonts via next/font — zero layout shift, no external requests.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  // Real italics for the "Iphe Lerato" motto — Playfair's italic is a
  // genuine cut, not a browser-synthesised slant.
  style: ["normal", "italic"],
});
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BranchModalProvider } from "@/components/BranchModalContext";
import { BranchModal } from "@/components/BranchModal";
import { HeaderSpacer } from "@/components/HeaderSpacer";
import { MotionObserver } from "@/lib/motion";

export const metadata: Metadata = {
  title: "Gomodi Guest Lodge | Boutique Guest House",
  description:
    "9 recently renovated en-suite rooms in Mahikeng. Book direct for the best rates — leisure stays, corporate & government bookings, and events.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Per-request CSP nonce set by middleware.ts (x-nonce header). Next.js
  // auto-applies it to its own inline scripts; we apply it to ours so the
  // strict nonce-based Content-Security-Policy never blocks first-paint JS.
  const nonce = (await headers()).get("x-nonce") || undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": "Gomodi Guest Lodge",
    "alternateName": "Gomodi",
    "slogan": "Iphe Lerato",
    "description": "9-room boutique guest house in Mafikeng, South Africa. Leisure stays, corporate bookings, and events.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Unit 13, Mmabatho",
      "addressLocality": "Mafikeng",
      "addressRegion": "North West Province",
      "addressCountry": "ZA"
    },
    "telephone": "+27",
    "email": "enquiries@gomodiguestlodge.co.za",
    "priceRange": "R750",
    "amenityFeature": [
      { "@type": "LocationFeatureSpecification", "name": "Free WiFi", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Smart TV", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Air Conditioning", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Secure Parking", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Breakfast Available", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Dinner Available", "value": true }
    ],
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "-25.8564",
      "longitude": "25.6424"
    }
  };

  return (
    /* suppressHydrationWarning: the inline head script adds `motion-armed` to
       <html> before first paint (so scroll-reveal hidden states apply only
       once JS is active). React would otherwise flag that class as a
       hydration mismatch. The script itself makes no-other DOM changes. */
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <head>
        {/* suppressHydrationWarning: after a nonce'd script executes, the
            browser clears its nonce attribute (CSP spec), so React's hydration
            comparison always sees a mismatch on these elements. The DOM keeps
            the correct nonce and execution is unaffected. */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.classList.add("motion-armed")}catch(e){}`,
          }}
        />
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-cream-light text-ink">
        <BranchModalProvider>
          <Nav />
          {/* pt-[var(--header-h)] keeps all page heroes exactly below the fixed site header (HeaderSpacer keeps the variable in sync) */}
          <div className="flex-1 flex flex-col pt-[var(--header-h)]">{children}</div>
          <Footer />
          <BranchModal />
          <HeaderSpacer />
          <MotionObserver />
        </BranchModalProvider>
      </body>
    </html>
  );
}
