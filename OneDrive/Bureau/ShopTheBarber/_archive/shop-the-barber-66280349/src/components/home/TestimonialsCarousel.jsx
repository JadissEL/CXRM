import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    id: 1,
    text: "I've waited over a decade to finally find someone I could trust to cut my hair. The experience was great to say the least! I am so satisfied with my final look. Will definitely be coming back!",
    author: "Alex Johnson",
    role: "Marketing Executive",
    location: "Brooklyn, NY",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    rating: 5
  },
  {
    id: 2,
    text: "ShopTheBarber has completely changed how I book my grooming. The attention to details, skill, and customer service is unmatched. I recommend it to all my colleagues.",
    author: "David Miller",
    role: "Software Engineer",
    location: "Chicago, IL",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    rating: 5
  },
  {
    id: 3,
    text: "As a father, finding a kid-friendly barber was crucial and I was so happy when I found ShopTheBarber. My son actually looks forward to his haircuts now! Game changer.",
    author: "Michael Chen",
    role: "Product Manager",
    location: "Seattle, WA",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    rating: 5
  },
  {
    id: 4,
    text: "The booking process is seamless and the barbers are truly professionals. I've never had a bad experience. The app makes managing appointments so easy.",
    author: "James Wilson",
    role: "Entrepreneur",
    location: "Austin, TX",
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop",
    rating: 5
  },
  {
    id: 5,
    text: "Finally, a platform that understands what quality grooming means. The barbers here are artists. Best haircuts I've ever had, consistently.",
    author: "Robert Garcia",
    role: "Creative Director",
    location: "Miami, FL",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    rating: 5
  }
];

export default function TestimonialsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const next = () => {
    setAutoPlay(false);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setAutoPlay(false);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-24 sm:py-32 bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-charcoal dark:text-white tracking-tight">
            Loved by Thousands
          </h2>
          <p className="mt-4 text-lg text-slate dark:text-matte-silver">
            Don't just take our word for it. Here's what our clients say.
          </p>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-surface-light dark:bg-surface-dark rounded-2xl p-8 sm:p-12 shadow-soft border border-soft-gray dark:border-slate/30 relative"
            >
              <Quote className="absolute top-8 right-8 w-12 h-12 text-primary/10 dark:text-primary/20" />

              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-espresso-brown fill-current" />
                ))}
              </div>

              <p className="text-charcoal dark:text-white text-xl leading-relaxed mb-8 max-w-2xl font-display">
                "{testimonials[activeIndex].text}"
              </p>

              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14 ring-4 ring-background-light dark:ring-background-dark">
                  <AvatarImage src={testimonials[activeIndex].avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {testimonials[activeIndex].author[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-charcoal dark:text-white">{testimonials[activeIndex].author}</p>
                  <p className="text-slate dark:text-matte-silver/80 text-sm">{testimonials[activeIndex].role}</p>
                  <p className="text-slate/60 dark:text-matte-silver/60 text-xs">{testimonials[activeIndex].location}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              className="rounded-full border-soft-gray dark:border-slate/30 hover:bg-surface-light dark:hover:bg-surface-dark text-charcoal dark:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setAutoPlay(false);
                    setActiveIndex(index);
                  }}
                  className={`h-2 rounded-full transition-all ${index === activeIndex ? 'bg-primary w-8' : 'bg-soft-gray dark:bg-slate/30 w-2 hover:bg-slate dark:hover:bg-matte-silver'
                    }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={next}
              className="rounded-full border-soft-gray dark:border-slate/30 hover:bg-surface-light dark:hover:bg-surface-dark text-charcoal dark:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}