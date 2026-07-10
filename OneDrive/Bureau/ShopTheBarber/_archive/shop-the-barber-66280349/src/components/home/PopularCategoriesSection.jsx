import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Scissors, TrendingUp, Award, Clock, Sparkles, Crown, Flame, Star } from "lucide-react";

const categories = [
  { name: "Classic Haircuts", icon: Scissors, searches: "12.5k", color: "from-teal-500 to-teal-600" },
  { name: "Fade & Taper", icon: TrendingUp, searches: "9.8k", color: "from-teal-600 to-cyan-600" },
  { name: "Beard Grooming", icon: Award, searches: "8.2k", color: "from-cyan-500 to-teal-500" },
  { name: "Quick Trims", icon: Clock, searches: "7.1k", color: "from-teal-500 to-cyan-500" },
  { name: "Luxury Shaves", icon: Sparkles, searches: "5.4k", color: "from-teal-600 to-teal-700" },
  { name: "VIP Services", icon: Crown, searches: "4.9k", color: "from-cyan-600 to-teal-600" },
  { name: "Hot Towel Shave", icon: Flame, searches: "4.2k", color: "from-teal-500 to-teal-600" },
  { name: "Premium Styling", icon: Star, searches: "3.8k", color: "from-cyan-500 to-cyan-600" },
];

export default function PopularCategoriesSection() {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-50/80 to-pink-50/60 mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Popular Searches
            </h2>
          </div>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Trending services and categories our clients love.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: index * 0.06, duration: 0.4 }}
            >
              <Link to={createPageUrl(`Barbers?category=${category.name.toLowerCase().replace(/ /g, '_')}`)}>
                <div className={`group bg-gradient-to-br ${category.color} rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer`}>
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">{category.name}</h3>
                  <p className="text-white/70 text-xs">{category.searches} searches</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}