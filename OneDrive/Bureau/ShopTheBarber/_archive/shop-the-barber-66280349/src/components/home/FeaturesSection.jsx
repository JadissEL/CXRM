import { motion } from "framer-motion";
import { ShieldCheck, Calendar, Scissors } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Vetted Professionals",
    description: "Only the best, highly-rated barbers and shops make it to our platform.",
    color: "text-primary",
    bgColor: "bg-primary/10 dark:bg-primary/20"
  },
  {
    icon: Calendar,
    title: "Effortless Booking",
    description: "Find available slots and book your appointment in just a few taps.",
    color: "text-espresso-brown",
    bgColor: "bg-espresso-brown/10 dark:bg-espresso-brown/20"
  },
  {
    icon: Scissors,
    title: "Diverse Services",
    description: "From classic cuts to modern fades and luxury shaves, find your perfect service.",
    color: "text-primary",
    bgColor: "bg-primary/10 dark:bg-primary/20"
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-24 sm:py-32 bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-charcoal dark:text-white tracking-tight">
            Why Choose ShopTheBarber
          </h2>
          <p className="mt-4 text-lg text-slate dark:text-matte-silver">
            A seamless experience for the modern gentleman.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-surface-light dark:bg-surface-dark p-8 rounded-lg shadow-soft border border-soft-gray dark:border-slate/30"
            >
              <div className={`${feature.bgColor} p-3 rounded-lg w-fit mb-6`}>
                <feature.icon className={`w-8 h-8 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-display font-semibold text-charcoal dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-slate dark:text-matte-silver/80">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}