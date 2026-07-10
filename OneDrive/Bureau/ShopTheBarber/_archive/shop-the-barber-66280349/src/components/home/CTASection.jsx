import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section className="py-24 sm:py-32 cta-gradient-bg relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-charcoal dark:text-white mb-6 tracking-tight">
            Ready to Look Your Best?
          </h2>
          <p className="text-lg text-slate dark:text-matte-silver max-w-2xl mx-auto mb-10">
            Join thousands of satisfied clients who have found their perfect barber.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={createPageUrl("Barbers")} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 font-semibold px-8 py-6 rounded-button shadow-soft-md hover:scale-[1.03] transition-all duration-300 text-base">
                Find a Barber
              </Button>
            </Link>
            <Link to="#" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto bg-transparent text-charcoal dark:text-white border-charcoal/20 dark:border-white/20 hover:bg-charcoal/5 dark:hover:bg-white/10 font-semibold px-8 py-6 rounded-button transition-all duration-300 text-base">
                For Barbers
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}