import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    id: 1,
    text: "I've waited over a decade to finally find someone I could trust to cut my hair. The experience was great to say the least! I am so satisfied in my final look.",
    author: "Alex Johnson",
    location: "Brooklyn, NY",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    rating: 5,
    highlight: true
  },
  {
    id: 2,
    text: "ShopTheBarber has completely changed how I book my grooming. This attention to details, skill, and customer service is unmatched.",
    author: "David Miller",
    location: "Chicago, IL",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    rating: 5,
    highlight: false
  },
  {
    id: 3,
    text: "As a father, finding a kid-friendly barber was crucial and I was so happy when I found ShopTheBarber. My son actually looks forward to his haircuts now!",
    author: "Michael Chen",
    location: "Seattle, WA",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    rating: 5,
    highlight: false
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-5xl mx-auto">
        {/* Header with subtle pastel tint */}
        <div className="text-center mb-14">
          <div className="inline-block px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/60 mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              What Our Clients Say
            </h2>
          </div>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Trusted by thousands for a consistently premium experience.
          </p>
        </div>

        {/* Testimonials Grid with increased padding */}
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.12, duration: 0.5, ease: "easeOut" }}
              className={`rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 ${
                testimonial.highlight 
                  ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-xl shadow-teal-500/25' 
                  : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg'
              }`}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 fill-current ${testimonial.highlight ? 'text-white/90' : 'text-amber-400'}`} 
                  />
                ))}
              </div>

              {/* Text */}
              <p className={`text-sm leading-relaxed mb-6 ${testimonial.highlight ? 'text-white/95' : 'text-gray-600'}`}>
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 ring-2 ring-white/20">
                  <AvatarImage src={testimonial.avatar} />
                  <AvatarFallback className={testimonial.highlight ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}>
                    {testimonial.author[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className={`font-semibold text-sm ${testimonial.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {testimonial.author}
                  </p>
                  <p className={`text-xs ${testimonial.highlight ? 'text-white/70' : 'text-gray-400'}`}>
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}