import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Star, Award, Trophy, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const topBarbers = [
  {
    rank: 1,
    name: "Julian Hayes",
    shop: "The Gentleman's Cut",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    rating: 4.98,
    reviews: 342,
    bookings: 156,
    specialty: "Master Barber",
    badge: Trophy,
    badgeColor: "from-teal-400 to-cyan-500"
  },
  {
    rank: 2,
    name: "Marcus Thompson",
    shop: "Urban Fades",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face",
    rating: 4.95,
    reviews: 289,
    bookings: 134,
    specialty: "Fade Specialist",
    badge: Award,
    badgeColor: "from-gray-400 to-gray-500"
  },
  {
    rank: 3,
    name: "Leo Chen",
    shop: "Modern Cuts Studio",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
    rating: 4.92,
    reviews: 256,
    bookings: 128,
    specialty: "Creative Stylist",
    badge: Medal,
    badgeColor: "from-teal-600 to-teal-700"
  }
];

export default function TopBarbersMonth() {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-50/80 to-yellow-50/60 mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Top Barbers of the Month
            </h2>
          </div>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Celebrating excellence. These barbers have earned the highest ratings this month.
          </p>
        </div>

        {/* Top 3 Barbers */}
        <div className="grid md:grid-cols-3 gap-6">
          {topBarbers.map((barber, index) => (
            <motion.div
              key={barber.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className={`relative ${index === 0 ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              <div className={`bg-white rounded-3xl p-6 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                index === 0 ? 'border-teal-300 shadow-xl shadow-teal-100' : 'border-gray-100 hover:border-gray-200'
              }`}>
                {/* Rank Badge */}
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br ${barber.badgeColor} flex items-center justify-center shadow-lg`}>
                  <barber.badge className="w-5 h-5 text-white" />
                </div>

                {/* Profile */}
                <div className="text-center pt-4">
                  <div className="relative inline-block mb-4">
                    <img
                      src={barber.image}
                      alt={barber.name}
                      className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                    />
                    <Badge className={`absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r ${barber.badgeColor} text-white border-0 text-[10px] font-bold px-3`}>
                      #{barber.rank}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg">{barber.name}</h3>
                  <p className="text-gray-500 text-sm mb-1">{barber.shop}</p>
                  <Badge variant="outline" className="text-[10px] border-teal-200 text-teal-600 bg-teal-50">
                    {barber.specialty}
                  </Badge>

                  {/* Stats */}
                  <div className="flex justify-center gap-6 mt-5 mb-5">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="w-4 h-4 text-amber-400 fill-current" />
                        <span className="font-bold text-gray-900">{barber.rating}</span>
                      </div>
                      <p className="text-gray-400 text-[10px]">{barber.reviews} reviews</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900">{barber.bookings}</p>
                      <p className="text-gray-400 text-[10px]">This month</p>
                    </div>
                  </div>

                  <Link to={createPageUrl(`BarberProfile?id=${barber.rank}`)}>
                    <Button className={`w-full rounded-xl h-10 text-sm font-semibold ${
                      index === 0 
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:opacity-90' 
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}>
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}