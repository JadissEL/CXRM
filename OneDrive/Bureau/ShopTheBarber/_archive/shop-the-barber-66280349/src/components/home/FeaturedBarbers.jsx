import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const sampleBarbers = [
  {
    id: "1",
    name: "Legacy Barbers",
    location: "Downtown, 9 Folsom St",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcBaQhy52yX8VDGSqtMtBWhan055dTl6hctDs7VK3y_bO4QZcGwG6b_22VIuf27SALBDCN0kWVmv6XwfKZCCklNtHpvGpI5dk0ispdy9gO8NOv9iqos0fnhO1QJDO2AFzWAb8a3zY5AtRgL7XMISsnBGpIdKyV1Vu2g2odCjnkANHVodQcOZojAfaqjAzOrU8IqgO3-XaezL-8j9t5QAX7TjD-qU01V-Jw_q9UYALIXccJ0xETQUEzUY0knYfULkUJSHXfcjcIvA4",
    rating: 4.9,
  },
  {
    id: "2",
    name: "The Gentleman's Cut",
    location: "Oak District, 12 Oak St",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBstnYnAI5-Bp_UaR4DuoQpA9L1MzeefM_5ah--As2_d6fworXi5EU_gOsTB8-O1tT3lTe6FLHXJmFoa6WCVSKBVVeOQaGkaEy_5RWCaHSDzz_V-_TJqZ2wfLkZ5ajAQhlQdSWEvX3qxK3GNTdfK-Efn4QDQCZp5vvhaYEP-5BhoHR67epLxic7oPFhZUHoA2yIgrKWfHXNj6T5IQBQZmw3gvwE-sMr4Pet7qDx1TXad-ZiwOukYw6vWjb_iPWCs51OnKYb7t42W0E",
    rating: 5.0,
  },
  {
    id: "3",
    name: "Precision Shaves",
    location: "West End, 112 River Rd",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmRc4_5RFHsiTZFRS2p7OflsNT0lPnIyQB6kw8F5LWCycMIK1rdiLrKsNrqb4fqYrGiR7KN9907shEKVmhzFzKYMlfBKO8GeXYVUH2QMXBuyVUbLQCMbe2pqcIN7n-fXhHAIIYyRFILaWK7jkvuuG--z1MjZ_r-emd6-0Ub_d_-252si9tdp7IUbfllU1nKMYyuSFagvAiefqmsmciS_gDTzKtmu_JteJhK3SH__fMW9T5exc8q2cj0-5TYKbZsgEe450OJc_-hnA",
    rating: 4.8,
  },
  {
    id: "4",
    name: "City Style Barbers",
    location: "Market District, 45 Ave",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDoY9TSioPJpUyqS9ccNAfnVLzX4gGqPu7PQfsL66Ce8XSfHsAV6R_T8YLDaUMNLguK2SXQubVzLjt5CyTstnQBiw_GwlYlMhSCFIoY4hiBJI4A7_p5Rd2LgiBj5Z9AObLMgQ6eoD7qOeESO9tdA9gHrxCpfEALkTiYQl2EzgiqoW9dlxK6wlTKWeIDotuQwHO-oPoE8MWjq2vl7DQert73Tin7isekJ-dT51A2nE53DUsqUdrEXKgpAjLT2GK9DJx24z7kgsyDBwo",
    rating: 4.9,
  }
];

export default function FeaturedBarbers({ barbers = [] }) {
  const displayBarbers = barbers.length >= 4 ? barbers.slice(0, 4).map((b, i) => ({
    id: b.id,
    name: b.shop_name || sampleBarbers[i].name,
    location: b.address || sampleBarbers[i].location,
    image: b.portfolio_images?.[0] || sampleBarbers[i].image,
    rating: b.rating || sampleBarbers[i].rating,
  })) : sampleBarbers;

  return (
    <section className="py-24 sm:py-32 bg-soft-gray/30 dark:bg-surface-dark/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-charcoal dark:text-white tracking-tight">
            Featured Barbers
          </h2>
          <p className="mt-4 text-lg text-slate dark:text-matte-silver">
            Meet some of the top-rated professionals in your area.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayBarbers.map((barber, index) => (
            <motion.div
              key={barber.id || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-soft overflow-hidden group"
            >
              <img
                alt={barber.name}
                className="w-full h-48 object-cover"
                src={barber.image}
              />
              <div className="p-6 transform transition-transform duration-300 group-hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-semibold text-lg text-charcoal dark:text-white">
                      {barber.name}
                    </h3>
                    <p className="text-sm text-slate dark:text-matte-silver/80 mt-1">
                      {barber.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-espresso-brown/10 text-espresso-brown text-xs font-bold py-1 px-2 rounded-full">
                    <Star className="w-[14px] h-[14px] fill-current" />
                    <span>{barber.rating}</span>
                  </div>
                </div>
                <Link
                  to={createPageUrl(`BarberProfile?id=${barber.id}`)}
                  className="block text-center mt-6 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/90 px-6 py-2.5 rounded-button font-semibold hover:bg-primary hover:text-white dark:hover:text-white transition-all duration-300"
                >
                  View Profile
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}