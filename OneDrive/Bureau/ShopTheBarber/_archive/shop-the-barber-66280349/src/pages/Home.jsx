import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
// import TopLocationsSection from "@/components/home/TopLocationsSection"; // Removed in new design
// import PopularCategoriesSection from "@/components/home/PopularCategoriesSection"; // Removed in new design
import FeaturedBarbers from "@/components/home/FeaturedBarbers";
// import FeaturedOffersSection from "@/components/home/FeaturedOffersSection"; // Removed in new design
import PopularServices from "@/components/home/PopularServices";
// import BeforeAfterGallery from "@/components/home/BeforeAfterGallery"; // Removed in new design
// import TopBarbersMonth from "@/components/home/TopBarbersMonth"; // Removed in new design
import TestimonialsCarousel from "@/components/home/TestimonialsCarousel";
// import WhyChooseUsSection from "@/components/home/WhyChooseUsSection"; // Merged into FeaturesSection
import CTASection from "@/components/home/CTASection";
// import FooterSection from "@/components/home/FooterSection"; // Moved to Layout

export default function Home() {
  const { data: featuredBarbers = [] } = useQuery({
    queryKey: ['featured-barbers'],
    queryFn: async () => {
      const profiles = await base44.entities.BarberProfile.list('-rating');
      return profiles.slice(0, 4);
    }
  });

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <HeroSection />
      <FeaturesSection />
      <FeaturedBarbers barbers={featuredBarbers} />
      <PopularServices />
      <TestimonialsCarousel />
      <HowItWorksSection />
      <CTASection />
    </div>
  );
}