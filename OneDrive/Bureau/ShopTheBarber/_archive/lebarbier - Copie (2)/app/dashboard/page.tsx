import Link from 'next/link';

export default function DashboardPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="container-wide py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold gradient-text">ShopTheBarber</span>
            </div>
            
            <nav className="flex items-center space-x-6">
              <Link href="/search" className="text-foreground/80 hover:text-foreground transition-colors">
                Find Barbers
              </Link>
              <Link href="/services" className="text-foreground/80 hover:text-foreground transition-colors">
                Services
              </Link>
              <Link href="/" className="text-foreground/80 hover:text-foreground transition-colors">
                Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="container-wide py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-sm border border-border p-6 mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, User!
            </h1>
            <p className="text-muted-foreground">
              Manage your appointments, profile, and preferences from your dashboard.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link href="/search" className="card hover-lift p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Find Barbers</h3>
              <p className="text-sm text-muted-foreground">Discover and book with local barbers</p>
            </Link>

            <Link href="/booking" className="card hover-lift p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">My Bookings</h3>
              <p className="text-sm text-muted-foreground">View and manage your appointments</p>
            </Link>

            <Link href="/profile" className="card hover-lift p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Profile</h3>
              <p className="text-sm text-muted-foreground">Update your personal information</p>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Welcome to ShopTheBarber!</p>
                  <p className="text-sm text-muted-foreground">Your account has been created successfully.</p>
                </div>
                <span className="text-sm text-muted-foreground">Just now</span>
              </div>
              
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent bookings yet</p>
                <Link href="/search" className="btn btn-primary btn-sm mt-2">
                  Book Your First Appointment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 