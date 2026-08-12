import { HeroSection } from "@/components/home/HeroSection";
import { WaysToStaySection } from "@/components/home/WaysToStaySection";
import { AboutSection } from "@/components/home/AboutSection";
import { RoomsPreviewSection } from "@/components/home/RoomsPreviewSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { AmenitiesSection } from "@/components/home/AmenitiesSection";
import { DiningSection } from "@/components/home/DiningSection";
import { EventsSection } from "@/components/home/EventsSection";
import { CorporateSection } from "@/components/home/CorporateSection";
import { ExploreSection } from "@/components/home/ExploreSection";
import { PaymentSection } from "@/components/home/PaymentSection";
import { ContactCtaSection } from "@/components/home/ContactCtaSection";
import { listApprovedReviews, reviewStats } from "@/lib/reviews";
import { getRooms } from "@/lib/rooms-cache";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Real sample rooms for the "Rooms Preview" teaser (3 of the 9), replacing
  // the original design's fictional room-type pricing with our actual flat-rate
  // data. Room list is 60s-cached (lib/rooms-cache) so repeat visits skip the
  // remote-Neon round-trip; availability is always re-checked live on submit.
  const previewRooms = (await getRooms()).slice(0, 3);

  // What guests say — only APPROVED reviews are ever shown publicly. If the
  // reviews tables aren't pushed yet (or the DB is briefly unavailable) the
  // homepage degrades to the empty state instead of failing the whole page.
  let approvedReviews: Awaited<ReturnType<typeof listApprovedReviews>> = [];
  let aggregate: Awaited<ReturnType<typeof reviewStats>> = { count: 0, average: 0 };
  try {
    [approvedReviews, aggregate] = await Promise.all([
      listApprovedReviews(3),
      reviewStats(),
    ]);
  } catch (err) {
    console.error("Reviews section unavailable (tables may not be pushed yet):", err);
  }

  return (
    <main className="page-transition">
      <HeroSection />
      <WaysToStaySection />
      <AboutSection />
      <RoomsPreviewSection rooms={previewRooms} />
      <ReviewsSection reviews={approvedReviews} aggregate={aggregate} />
      <AmenitiesSection />
      <DiningSection />
      <EventsSection />
      <CorporateSection />
      <ExploreSection />
      <PaymentSection />
      <ContactCtaSection />
    </main>
  );
}
