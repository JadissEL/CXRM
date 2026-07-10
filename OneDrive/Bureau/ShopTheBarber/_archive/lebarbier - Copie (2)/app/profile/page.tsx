import Link from 'next/link';

export default function ProfilePage() {

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
              <Link href="/dashboard" className="text-foreground/80 hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/search" className="text-foreground/80 hover:text-foreground transition-colors">
                Find Barbers
              </Link>
              <Link href="/" className="text-foreground/80 hover:text-foreground transition-colors">
                Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <div className="container-wide py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-border p-6">
            <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>
            
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex-center">
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    User Name
                  </h2>
                  <p className="text-muted-foreground">
                    user@example.com
                  </p>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Information</h3>
                
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      First Name
                    </label>
                    <p className="text-muted-foreground">
                      Not provided
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Last Name
                    </label>
                    <p className="text-muted-foreground">
                      Not provided
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Email Address
                    </label>
                    <p className="text-muted-foreground">
                      user@example.com
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Member Since
                    </label>
                    <p className="text-muted-foreground">
                      Unknown
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-border">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/dashboard" className="btn btn-outline">
                    Back to Dashboard
                  </Link>
                  <button className="btn btn-primary">
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 