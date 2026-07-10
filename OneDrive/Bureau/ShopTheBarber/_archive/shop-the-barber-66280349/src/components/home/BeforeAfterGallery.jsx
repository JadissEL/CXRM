import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const transformations = [
  {
    before: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=500&fit=crop",
    after: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=500&fit=crop",
    barber: "Julian Hayes",
    style: "Modern Fade",
    rating: 5
  },
  {
    before: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop",
    after: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
    barber: "Marcus Thompson",
    style: "Classic Cut",
    rating: 5
  },
  {
    before: "https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=400&h=500&fit=crop",
    after: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop",
    barber: "Leo Chen",
    style: "Textured Crop",
    rating: 5
  },
  {
    before: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop",
    after: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop",
    barber: "Samuel Reid",
    style: "Beard Sculpt",
    rating: 5
  }
];

export default function BeforeAfterGallery() {
  const [activeIndex, setActiveIndex] = useState(0);

  const next = () => setActiveIndex((prev) => (prev + 1) % transformations.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + transformations.length) % transformations.length);

  return (
    <section className="py-20 px-6 bg-gray-900 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-8 py-3 rounded-2xl bg-white/5 mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Before & After Gallery
            </h2>
          </div>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Real transformations by our talented barbers.
          </p>
        </div>

        {/* Gallery */}
        <div className="relative">
          {/* Navigation Buttons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 backdrop-blur-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 backdrop-blur-sm"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          {/* Cards Container */}
          <div className="flex justify-center gap-6 px-16">
            {transformations.map((item, index) => {
              const isActive = index === activeIndex;
              const offset = index - activeIndex;
              
              return (
                <motion.div
                  key={index}
                  animate={{
                    scale: isActive ? 1 : 0.85,
                    opacity: Math.abs(offset) <= 1 ? (isActive ? 1 : 0.5) : 0,
                    x: offset * 60
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={`${Math.abs(offset) > 1 ? 'hidden' : ''} shrink-0`}
                >
                  <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
                    {/* Before/After Images */}
                    <div className="flex">
                      <div className="relative w-40 h-56">
                        <img src={item.before} alt="Before" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">Before</span>
                      </div>
                      <div className="relative w-40 h-56">
                        <img src={item.after} alt="After" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 right-2 bg-teal-500 text-white text-[10px] px-2 py-1 rounded-full">After</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="text-white font-semibold text-sm">{item.style}</p>
                      <p className="text-gray-400 text-xs mb-2">by {item.barber}</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-amber-400 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {transformations.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeIndex ? 'bg-teal-500 w-6' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}