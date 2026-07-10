import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Scissors } from "lucide-react";

const popularBarbers = [
  {
    name: "Alex",
    rating: 4.8,
    reviews: "500+",
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=300&h=300&fit=crop"
  },
  {
    name: "Ryan",
    rating: 4.9,
    reviews: "450+",
    image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300&h=300&fit=crop"
  },
  {
    name: "Chris",
    rating: 4.7,
    reviews: "400+",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&h=300&fit=crop"
  }
];

const promotions = [
  {
    title: "20% off haircuts",
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300&h=200&fit=crop",
    color: "from-orange-500 to-red-500"
  },
  {
    title: "15% off beard trims",
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=300&h=200&fit=crop",
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "10% off hair styling",
    image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=300&h=200&fit=crop",
    color: "from-blue-500 to-cyan-500"
  }
];

const newShops = [
  {
    name: "The Modern Barber",
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300&h=200&fit=crop"
  },
  {
    name: "The Classic Cut",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&h=200&fit=crop"
  },
  {
    name: "The Minimalist Groomer",
    image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=300&h=200&fit=crop"
  }
];

export default function UserHome() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-[#1a1d21]">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <Scissors className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-xl">Trim</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to={createPageUrl("Barbers")} className="text-gray-400 hover:text-white text-sm transition-colors">
                Explore
              </Link>
              <Link to={createPageUrl("Marketplace")} className="text-gray-400 hover:text-white text-sm transition-colors">
                Services
              </Link>
              <Link to={createPageUrl("Blog")} className="text-gray-400 hover:text-white text-sm transition-colors">
                Pricing
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search"
                className="w-48 pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 rounded-lg h-9"
              />
            </div>
            <Link to={createPageUrl("Barbers")}>
              <Button className="bg-[#6366f1] hover:bg-[#5558e3] text-white text-sm h-9 px-4 rounded-lg">
                Book Now
              </Button>
            </Link>
            <Link to={createPageUrl("Profile")}>
              <Avatar className="w-9 h-9 border-2 border-gray-700">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-gray-700 text-white text-sm">
                  {firstName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <h1 className="text-3xl font-bold text-white mb-6">
          Welcome back, {firstName}
        </h1>

        {/* Search Bar */}
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            placeholder="Search for barbers or services"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 rounded-xl text-base"
          />
        </div>

        {/* Popular Barbers */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-5">Popular Barbers</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {popularBarbers.map((barber, index) => (
              <Link key={index} to={createPageUrl("Barbers")} className="shrink-0">
                <div className="w-36">
                  <div className="aspect-square rounded-xl overflow-hidden mb-2">
                    <img
                      src={barber.image}
                      alt={barber.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-white text-sm">
                    {barber.name}, {barber.rating} • {barber.reviews} reviews
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Promotions */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-5">Promotions</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {promotions.map((promo, index) => (
              <Link key={index} to={createPageUrl("Barbers")} className="shrink-0">
                <div className="w-36">
                  <div className="aspect-square rounded-xl overflow-hidden mb-2">
                    <img
                      src={promo.image}
                      alt={promo.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-white text-sm">{promo.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* New Shops */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-5">New Shops</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {newShops.map((shop, index) => (
              <Link key={index} to={createPageUrl("Barbers")} className="shrink-0">
                <div className="w-44">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden mb-2">
                    <img
                      src={shop.image}
                      alt={shop.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-white text-sm">{shop.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}