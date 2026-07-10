import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const locations = [
  { city: "Paris", count: 245, image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop" },
  { city: "Lyon", count: 128, image: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400&h=300&fit=crop" },
  { city: "Marseille", count: 96, image: "https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?w=400&h=300&fit=crop" },
  { city: "Bordeaux", count: 74, image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop" },
  { city: "Toulouse", count: 62, image: "https://images.unsplash.com/photo-1582974230289-da0a0a55d302?w=400&h=300&fit=crop" },
  { city: "Nice", count: 58, image: "https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=400&h=300&fit=crop" },
];

export default function TopLocationsSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Top Locations
            </h2>
          </div>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Find the best barbers in your city. We're expanding nationwide.
          </p>
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {locations.map((location, index) => (
            <motion.div
              key={location.city}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
            >
              <Link to={createPageUrl(`Barbers?city=${location.city.toLowerCase()}`)}>
                <div className="group relative overflow-hidden rounded-2xl aspect-[4/5] cursor-pointer">
                  <img
                    src={location.image}
                    alt={location.city}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-lg">{location.city}</h3>
                    <div className="flex items-center gap-1 text-white/80 text-xs">
                      <MapPin className="w-3 h-3" />
                      <span>{location.count} barbers</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}