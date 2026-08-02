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
    "priceRange": "R950-R1200",
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
    <html lang="en" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
