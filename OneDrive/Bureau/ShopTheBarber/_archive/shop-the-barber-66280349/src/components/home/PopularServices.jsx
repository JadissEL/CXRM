import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Scissors, Clock, Sparkles, Baby, Brush, Droplets, Zap, Flame, ArrowRight } from "lucide-react";

const services = [
  { icon: Scissors, name: "Haircut", description: "Precision cuts for all styles" },
  { icon: Clock, name: "Beard Trim", description: "Keep your beard looking sharp" },
  { icon: Sparkles, name: "Shave", description: "Hot towel & straight razor" },
  { icon: Baby, name: "Kid's Cut", description: "Gentle cuts for little ones" },
  { icon: Brush, name: "Facial", description: "Rejuvenating skin treatments" },
  { icon: Droplets, name: "Hair Color", description: "Full color & grey blending" },
  { icon: Zap, name: "Fade", description: "Seamless gradient cuts" },
  { icon: Flame, name: "Hot Shave", description: "Traditional luxury experience" },
];

export default function PopularServices() {
  return (
    <section className="py-24 sm:py-32 bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-charcoal dark:text-white tracking-tight">
            Popular Services
          </h2>
          <p className="mt-4 text-lg text-slate dark:text-matte-silver">
            Everything you need to look your best.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <Link to={createPageUrl(`Barbers?service=${service.name.toLowerCase().replace("'", "").replace(' ', '_')}`)}>
                <div className="group relative h-full bg-surface-light dark:bg-surface-dark p-8 rounded-2xl border border-soft-gray dark:border-slate/30 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-soft-md">
                  <div className="flex justify-between items-start mb-8">
                    <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <service.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate dark:text-matte-silver/50 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-semibold text-charcoal dark:text-white mb-2">
                      {service.name}
                    </h3>
                    <p className="text-sm text-slate dark:text-matte-silver/80">
                      {service.description}
                    </p>
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