import Link from 'next/link';
import BarberSearch from '@/components/search/BarberSearch';

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold gradient-text">ShopTheBarber</span>
            </div>
            
            <nav className="flex items-center space-x-6">
              <Link href="/services" className="text-foreground/80 hover:text-foreground transition-colors">
                Services
              </Link>
              <Link href="/dashboard" className="text-foreground/80 hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/" className="text-foreground/80 hover:text-foreground transition-colors">
                Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="bg-white border-b border-border">
        <div className="container mx-auto py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Find Your Perfect Barber
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover professional barbers in your area. Filter by location, services, ratings, and more to find the perfect match for your grooming needs.
            </p>
          </div>
        </div>
      </div>

      {/* Search Component */}
      <div className="py-8">
        <BarberSearch />
      </div>

      {/* Call to Action */}
      <section className="bg-primary py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Book Your Appointment?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Found your perfect barber? Book your appointment and get ready to look your best.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/services" className="btn bg-white text-primary hover:bg-gray-100 btn-lg">
              Browse Services
            </Link>
            <Link href="/dashboard" className="btn border-white text-white hover:bg-white/10 btn-outline btn-lg">
              My Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-foreground/80 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-foreground">ShopTheBarber</span>
              </div>
              <p className="text-sm">
                Connecting customers with the best barbers in their area.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">For Customers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/search" className="hover:text-foreground transition-colors">Find Barbers</Link></li>
                <li><Link href="/services" className="hover:text-foreground transition-colors">Services</Link></li>
                <li><Link href="/sign-up" className="hover:text-foreground transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">For Barbers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/sign-up" className="hover:text-foreground transition-colors">Join Platform</Link></li>
                <li><Link href="/services" className="hover:text-foreground transition-colors">Manage Services</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-foreground/20 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 ShopTheBarber. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 