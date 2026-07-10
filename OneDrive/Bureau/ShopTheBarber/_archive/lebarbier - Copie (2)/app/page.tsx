import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="relative z-10">
        <nav className="container-wide py-6">
          <div className="flex-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold gradient-text">ShopTheBarber</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/search" className="text-foreground/80 hover:text-foreground transition-colors">
                Find Barbers
              </Link>
              <Link href="/services" className="text-foreground/80 hover:text-foreground transition-colors">
                Services
              </Link>
              <Link href="/sign-in" className="btn btn-outline btn-sm">
                Sign In
              </Link>
              <Link href="/sign-up" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container-narrow text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in">
            Find Your Perfect
            <span className="block gradient-text">Barber</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up">
            Discover and book appointments with the best barbers in your area. 
            Professional cuts, great service, and convenient booking.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link href="/search" className="btn btn-primary btn-lg hover-scale">
              Find Barbers Near You
            </Link>
            <Link href="/sign-up" className="btn btn-outline btn-lg hover-scale">
              Join as Barber
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose ShopTheBarber?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We make finding and booking with great barbers simple and convenient
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card hover-lift p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Find Local Barbers</h3>
              <p className="text-muted-foreground">
                Discover top-rated barbers in your area with detailed profiles, reviews, and photos.
              </p>
            </div>
            
            <div className="card hover-lift p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Easy Booking</h3>
              <p className="text-muted-foreground">
                Book appointments instantly with real-time availability and instant confirmations.
              </p>
            </div>
            
            <div className="card hover-lift p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Quality Service</h3>
              <p className="text-muted-foreground">
                Verified barbers with proven track records and customer satisfaction guarantees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="container-narrow text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of customers who trust ShopTheBarber for their grooming needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up" className="btn bg-white text-primary hover:bg-gray-100 btn-lg">
              Create Account
            </Link>
            <Link href="/search" className="btn border-white text-white hover:bg-white/10 btn-outline btn-lg">
              Browse Barbers
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-foreground/80 py-12 px-4">
        <div className="container-wide">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded flex-center">
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