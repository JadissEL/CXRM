import { motion } from "framer-motion";
import { Search, CalendarCheck, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Find Your Barber",
    description: "Browse profiles, reviews, and portfolios to discover the perfect match for your style."
  },
  {
    icon: CalendarCheck,
    step: "02",
    title: "Book Instantly",
    description: "Select your service, pick a convenient time, and confirm your appointment in seconds."
  },
  {
    icon: Sparkles,
    step: "03",
    title: "Look Your Best",
    description: "Show up, relax, and leave with a fresh cut that makes you feel confident."
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 sm:py-32 bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-charcoal dark:text-white tracking-tight">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-slate dark:text-matte-silver">
            Three simple steps to your best look yet.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-soft-gray dark:via-slate/30 to-transparent" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="text-center relative"
            >
              <div className="relative inline-flex mb-8">
                <div className="w-24 h-24 bg-surface-light dark:bg-surface-dark rounded-2xl flex items-center justify-center shadow-soft border border-soft-gray dark:border-slate/30 relative z-10">
                  <step.icon className="w-10 h-10 text-primary" />
                </div>
                <span className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-white text-sm font-bold rounded-full flex items-center justify-center shadow-md z-20 border-2 border-background-light dark:border-background-dark">
                  {step.step}
                </span>
              </div>

              <h3 className="text-xl font-display font-semibold text-charcoal dark:text-white mb-3">
                {step.title}
              </h3>
              <p className="text-slate dark:text-matte-silver/80 leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}