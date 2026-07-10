import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles, Gift, Percent } from "lucide-react";

const offers = [
  {
    title: "First Visit Special",
    description: "Get 30% off your first haircut when you book through ShopTheBarber.",
    discount: "30% OFF",
    badge: "New Users",
    icon: Gift,
    gradient: "from-teal-500 to-cyan-500",
    bgGradient: "from-teal-50 to-cyan-50"
  },
  {
    title: "Grooming Package",
    description: "Complete grooming: haircut, beard trim, and hot towel treatment.",
    discount: "€45",
    originalPrice: "€65",
    badge: "Best Value",
    icon: Sparkles,
    gradient: "from-teal-600 to-teal-500",
    bgGradient: "from-teal-50 to-white"
  },
  {
    title: "Monthly Membership",
    description: "Unlimited trims & 20% off all services. Cancel anytime.",
    discount: "€29/mo",
    badge: "Popular",
    icon: Percent,
    gradient: "from-cyan-500 to-teal-500",
    bgGradient: "from-cyan-50 to-teal-50"
  },
  {
    title: "Express Cut",
    description: "Quick 15-minute professional trim. Perfect for busy schedules.",
    discount: "€15",
    badge: "Fast",
    icon: Clock,
    gradient: "from-teal-500 to-cyan-600",
    bgGradient: "from-teal-50 to-cyan-50"
  }
];

export default function FeaturedOffersSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-50/80 to-yellow-50/60 mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Featured Offers & Packages
            </h2>
          </div>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Exclusive deals to help you look your best for less.
          </p>
        </div>

        {/* Offers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {offers.map((offer, index) => (
            <motion.div
              key={offer.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`group relative bg-gradient-to-br ${offer.gradient} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
            >
              {/* Badge */}
              <Badge className="absolute top-4 right-4 bg-white/20 text-white border-0 text-[10px] font-semibold">
                {offer.badge}
              </Badge>

              {/* Content */}
              <h3 className="font-bold text-white text-lg mb-2 mt-4">{offer.title}</h3>
              <p className="text-white/80 text-sm mb-4 leading-relaxed">{offer.description}</p>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-white">{offer.discount}</span>
                {offer.originalPrice && (
                  <span className="text-sm text-white/60 line-through">{offer.originalPrice}</span>
                )}
              </div>

              <Link to={createPageUrl("Barbers")}>
                <Button className="w-full bg-white text-teal-600 hover:bg-white/90 rounded-xl h-10 text-sm font-semibold shadow-md">
                  Claim Offer
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}