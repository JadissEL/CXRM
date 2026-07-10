import { motion } from "framer-motion";
import { 
  Shield, 
  Clock, 
  Award, 
  CreditCard, 
  Users, 
  Smartphone, 
  MapPin, 
  HeartHandshake,
  Star,
  Zap
} from "lucide-react";

const reasons = [
  {
    icon: Shield,
    title: "Verified Professionals",
    description: "Every barber is thoroughly vetted and verified for skills and professionalism."
  },
  {
    icon: Clock,
    title: "24/7 Booking",
    description: "Book appointments anytime, anywhere. Our platform never sleeps."
  },
  {
    icon: Award,
    title: "Quality Guaranteed",
    description: "Not satisfied? We'll make it right or refund your booking fee."
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Your payment details are protected with bank-level encryption."
  },
  {
    icon: Users,
    title: "10,000+ Happy Clients",
    description: "Join our growing community of satisfied grooming enthusiasts."
  },
  {
    icon: Smartphone,
    title: "Easy Mobile Booking",
    description: "Book, reschedule, or cancel with just a few taps on your phone."
  },
  {
    icon: MapPin,
    title: "Barbers Near You",
    description: "Find top-rated barbers within walking distance, wherever you are."
  },
  {
    icon: HeartHandshake,
    title: "Loyalty Rewards",
    description: "Earn points with every visit and redeem them for free services."
  },
  {
    icon: Star,
    title: "Real Reviews",
    description: "Transparent ratings from verified clients to help you choose."
  },
  {
    icon: Zap,
    title: "Instant Confirmations",
    description: "Get immediate booking confirmations and reminders via SMS."
  }
];

export default function WhyChooseUsSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-block px-8 py-3 rounded-2xl bg-gradient-to-r from-violet-50/80 to-purple-50/60 mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Why Choose ShopTheBarber?
            </h2>
          </div>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            We're not just another booking platform. Here's what sets us apart.
          </p>
        </div>

        {/* Reasons Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="group bg-gray-50/80 hover:bg-white rounded-2xl p-5 border border-gray-100 hover:border-teal-200/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm border border-gray-100 group-hover:bg-teal-50 group-hover:border-teal-100 transition-colors">
                <reason.icon className="w-5 h-5 text-gray-600 group-hover:text-teal-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{reason.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{reason.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}