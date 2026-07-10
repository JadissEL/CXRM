import { auth, currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { getUserProfile, checkUserStatus } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { UserNav } from '@/components/UserNav';
import { Calendar, Users, Settings, BarChart3, Clock, Star } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  // Check user status in Supabase
  const userStatus = await checkUserStatus(userId);
  const userProfile = await getUserProfile(userId);

  // Block banned users
  if (userStatus.isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Account Suspended</CardTitle>
            <CardDescription>
              Your account has been suspended. Please contact support for assistance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="mailto:support@shopthebarber.com">Contact Support</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Block unverified users
  if (!userStatus.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-yellow-600">Email Verification Required</CardTitle>
            <CardDescription>
              Please verify your email address to access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Check your email for a verification link. If you didn't receive it, you can request a new one from your account settings.
              </AlertDescription>
            </Alert>
            <div className="mt-4 space-y-2">
              <Button className="w-full" asChild>
                <Link href="/user-profile">Go to Account Settings</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/sign-out">Sign Out</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userRole = userProfile?.role || 'client';
  const isBarber = userRole === 'barber';
  const isAdmin = userRole === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">ShopTheBarber</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome back, {user.firstName || 'User'}!
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={isBarber ? 'default' : 'secondary'}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
            {userProfile?.mfa_enabled && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                2FA Enabled
              </Badge>
            )}
            <UserNav user={user} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isBarber ? 'Total Appointments' : 'Upcoming Appointments'}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                {isBarber ? '+2 from last month' : 'Next: Tomorrow 2:00 PM'}
              </p>
            </CardContent>
          </Card>

          {isBarber && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">48</div>
                  <p className="text-xs text-muted-foreground">+5 new this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.8</div>
                  <p className="text-xs text-muted-foreground">Based on 127 reviews</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$2,840</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>
            </>
          )}

          {!isBarber && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Favorite Barbers</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Saved for quick booking</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$480</div>
                  <p className="text-xs text-muted-foreground">This year</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                {isBarber ? 'Manage your barber business' : 'Book and manage appointments'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isBarber ? (
                <>
                  <Button className="w-full justify-start" asChild>
                    <Link href="/dashboard/appointments">
                      <Calendar className="mr-2 h-4 w-4" />
                      View Appointments
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/dashboard/services">
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Services
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/dashboard/availability">
                      <Clock className="mr-2 h-4 w-4" />
                      Set Availability
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button className="w-full justify-start" asChild>
                    <Link href="/search">
                      <Users className="mr-2 h-4 w-4" />
                      Find Barbers
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/dashboard/appointments">
                      <Calendar className="mr-2 h-4 w-4" />
                      My Appointments
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/dashboard/favorites">
                      <Star className="mr-2 h-4 w-4" />
                      Favorite Barbers
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest {isBarber ? 'bookings and updates' : 'appointments and reviews'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {isBarber ? 'New appointment booked' : 'Appointment confirmed'}
                    </p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {isBarber ? 'Profile updated' : 'Review submitted'}
                    </p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {isBarber ? 'Payment received' : 'Payment processed'}
                    </p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}