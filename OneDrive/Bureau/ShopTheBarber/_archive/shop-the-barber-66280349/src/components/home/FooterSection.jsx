import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Scissors } from "lucide-react";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { name: "Features", url: "#" },
      { name: "For Barbers", url: "#" },
      { name: "For Clients", url: "#" },
      { name: "Pricing", url: "#" }
    ]
  },
  company: {
    title: "Company",
    links: [
      { name: "About Us", url: "#" },
      { name: "Careers", url: "#" },
      { name: "Press", url: "#" }
    ]
  },
  resources: {
    title: "Resources",
    links: [
      { name: "Blog", url: createPageUrl("Blog") },
      { name: "FAQ", url: "#" },
      { name: "Help Center", url: "#" }
    ]
  },
  followUs: {
    title: "Follow Us",
    links: [
      { name: "Twitter", url: "#" },
      { name: "Instagram", url: "#" },
      { name: "Facebook", url: "#" }
    ]
  }
};

export default function FooterSection() {
  return (
    <footer className="bg-gray-900 pt-14 pb-10 px-6 relative">
      {/* Top border with gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <Scissors className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-sm">ShopTheBarber</span>
            </Link>
            <p className="text-gray-500 text-xs leading-relaxed">
              The ultimate platform for premium grooming.
            </p>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-white mb-4 text-xs uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.url}
                      className="text-gray-500 hover:text-teal-400 text-xs transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8">
          <p className="text-gray-600 text-xs text-center">
            © 2024 ShopTheBarber. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}