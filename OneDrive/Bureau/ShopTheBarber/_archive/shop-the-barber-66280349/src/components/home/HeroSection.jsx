import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative rounded-xl lg:rounded-2xl overflow-hidden hero-gradient-bg min-h-[70vh] flex items-center py-20 lg:py-0 mx-4 sm:mx-6 lg:mx-8 mt-8">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-charcoal dark:text-white tracking-tight"
          >
            Grooming for men and boys — book the best barbers <span className="text-primary">near you.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-lg text-slate dark:text-matte-silver max-w-2xl mx-auto"
          >
            Discover and book top-rated barbers for premium haircuts, shaves, and styles. Effortless booking, exceptional results.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to={createPageUrl("Barbers")} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-primary text-white px-8 py-6 rounded-button font-semibold shadow-soft-md hover:scale-[1.03] transform transition-transform duration-300 text-base">
                Find a barber
              </Button>
            </Link>
            <Link to="#" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto bg-surface-light/60 dark:bg-surface-dark/60 backdrop-blur-sm text-charcoal dark:text-white px-8 py-6 rounded-button font-semibold border border-soft-gray dark:border-slate/50 hover:border-slate/80 dark:hover:border-matte-silver/80 transform transition-colors duration-300 text-base">
                Become a Partner
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}