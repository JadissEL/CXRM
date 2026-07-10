import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Home,
  Scissors,
  ShoppingBag,
  BookOpen,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  Store,
  Shield,
  Moon,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

function LayoutContent({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log("User not logged in");
      }
    };
    loadUser();

    // Initialize dark mode from localStorage
    const savedTheme = localStorage.getItem('shopthebarber-theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('shopthebarber-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('shopthebarber-theme', 'light');
    }
  };

  const publicNavigation = [
    { title: "Features", url: "#", icon: Home }, // Placeholder for design match
    { title: "Barbers", url: createPageUrl("Barbers"), icon: Scissors },
    { title: "Pricing", url: "#", icon: ShoppingBag }, // Placeholder for design match
    { title: "About", url: "#", icon: BookOpen }, // Placeholder for design match
  ];

  const getRoleDashboards = () => {
    if (!user) return [];

    const dashboards = [];

    // Dashboard principal selon le rôle
    if (user.role === 'admin') {
      dashboards.push({
        title: "Admin Dashboard",
        url: createPageUrl("AdminDashboard"),
        icon: Shield,
        color: "text-red-600",
        bgColor: "bg-red-100"
      });
    }

    if (user.role === 'barber') {
      dashboards.push({
        title: "Barber Dashboard",
        url: createPageUrl("BarberDashboard"),
        icon: Scissors,
        color: "text-purple-600",
        bgColor: "bg-purple-100"
      });
    }

    if (user.role === 'vendor') {
      dashboards.push({
        title: "Vendor Dashboard",
        url: createPageUrl("VendorDashboard"),
        icon: Store,
        color: "text-orange-600",
        bgColor: "bg-orange-100"
      });
    }

    // Dashboard client (tous les utilisateurs)
    dashboards.push({
      title: "Mon Espace Client",
      url: createPageUrl("ClientDashboard"),
      icon: LayoutDashboard,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    });

    return dashboards;
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const handleLogout = async () => {
    const homeUrl = window.location.origin + createPageUrl("Home");
    await base44.auth.logout(homeUrl);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-body text-slate dark:text-matte-silver/80 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-50">
          <nav className="container mx-auto max-w-7xl px-6 py-3 rounded-2xl flex items-center justify-between glassmorphism shadow-soft">
            <Link className="text-xl font-display font-bold text-charcoal dark:text-background-light" to={createPageUrl("Home")}>
              ShopTheBarber
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              {publicNavigation.map((item) => (
                <Link
                  key={item.title}
                  className="text-slate dark:text-matte-silver/80 hover:text-primary dark:hover:text-white transition-colors text-[15px]"
                  to={item.url}
                >
                  {item.title}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600" />}
              </button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border border-gray-200 dark:border-gray-700">
                        <AvatarImage src={user.avatar_url} alt={user.first_name} />
                        <AvatarFallback>{user.first_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.first_name} {user.last_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {getRoleDashboards().map((dashboard) => (
                      <DropdownMenuItem key={dashboard.title} asChild>
                        <Link to={dashboard.url} className="cursor-pointer">
                          <dashboard.icon className={`mr-2 h-4 w-4 ${dashboard.color}`} />
                          <span>{dashboard.title}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Se déconnecter</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <button
                    onClick={handleLogin}
                    className="hidden sm:block text-charcoal dark:text-matte-silver hover:text-primary dark:hover:text-white transition-colors font-medium text-[15px]"
                  >
                    Log in
                  </button>
                  <button
                    onClick={handleLogin} // Assuming sign up goes to same auth flow for now
                    className="bg-charcoal dark:bg-background-light text-white dark:text-charcoal px-5 py-2.5 rounded-button font-medium text-[15px] hover:opacity-90 transition-opacity"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-charcoal dark:text-white">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </nav>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 md:hidden">
              <div className="flex flex-col space-y-4">
                {publicNavigation.map((item) => (
                  <Link
                    key={item.title}
                    className="text-slate dark:text-matte-silver hover:text-primary dark:hover:text-white font-medium"
                    to={item.url}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </header>

        <main className="mt-8">
          {children}
        </main>

        <footer className="mt-24 sm:mt-32 border-t border-soft-gray dark:border-slate/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
              <div className="col-span-2 lg:col-span-2">
                <Link className="text-2xl font-display font-bold text-charcoal dark:text-background-light" to={createPageUrl("Home")}>
                  ShopTheBarber
                </Link>
                <p className="mt-4 text-slate dark:text-matte-silver/80 max-w-xs">
                  The premier ecosystem for discovering and booking men's grooming services.
                </p>
              </div>
              <div>
                <h4 className="font-display text-charcoal dark:text-white font-semibold">Company</h4>
                <ul className="mt-4 space-y-3">
                  <li><a className="text-slate dark:text-matte-silver/80 hover:text-primary dark:hover:text-white transition-colors" href="#">About</a></li>
                  <li><a className="text-slate dark:text-matte-silver/80 hover:text-primary dark:hover:text-white transition-colors" href="#">Careers</a></li>
                  <li><a className="text-slate dark:text-matte-silver/80 hover:text-primary dark:hover:text-white transition-colors" href="#">Press</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-display text-charcoal dark:text-white font-semibold">For Barbers</h4>
                <ul className="mt-4 space-y-3">
                  <li><a className="text-slate dark:text-matte-silver/80 hover:text-primary dark:hover:text-white transition-colors" href="#">Become a Partner</a></li>
                  <li><a className="text-slate dark:text-matte-silver/80 hover:text-primary dark:hover:text-white transition-colors" href="#">Pricing</a></li>
                  <li><a className="text-slate dark:text-matte-silver/80 hover:text-primary dark:hover:text-white transition-colors" href="#">Dashboard Login</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-display text-charcoal dark:text-white font-semibold">Resources</h4>
                <ul className="mt-4 space-y-3">
                  <li><a className="text-slate dark:text-matte-silver/80 hover:text-primary dark:hover:text-white transition-colors" href="#">Help Center</a></li>
                  <li><a className="text-slate dark:text-matte-silver/80 hover:text-primary dark:hover:text-white transition-colors" href="#">Contact Us</a></li>
                  <li><a className="text-slate dark:text-matte-silver/80 hover:text-primary dark:hover:text-white transition-colors" href="#">Terms of Service</a></li>
                </ul>
              </div>
              <div className="col-span-2 md:col-span-4 lg:col-span-1">
                <h4 className="font-display text-charcoal dark:text-white font-semibold">Follow Us</h4>
                <div className="flex items-center space-x-4 mt-4">
                  <a className="text-matte-silver hover:text-primary dark:hover:text-white transition-colors" href="#">
                    <span className="sr-only">Facebook</span>
                    <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd"></path></svg>
                  </a>
                  <a className="text-matte-silver hover:text-espresso-brown dark:hover:text-white transition-colors" href="#">
                    <span className="sr-only">Instagram</span>
                    <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.585-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.585-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.585.069-4.85c.149-3.225 1.664-4.771 4.919-4.919C8.415 2.175 8.796 2.163 12 2.163zm0 1.441c-3.116 0-3.479.011-4.694.067-2.45.112-3.582 1.232-3.694 3.694-.056 1.215-.067 1.578-.067 4.694s.011 3.479.067 4.694c.112 2.461 1.244 3.582 3.694 3.694 1.215.056 1.578.067 4.694.067s3.479-.011 4.694-.067c2.461-.112 3.582-1.232 3.694-3.694.056-1.215.067-1.578.067-4.694s-.011-3.479-.067-4.694c-.112-2.461-1.244-3.582-3.694-3.694-1.215-.056-1.578-.067-4.694-.067zM12 6.874c-2.849 0-5.156 2.306-5.156 5.156s2.306 5.156 5.156 5.156 5.156-2.306 5.156-5.156-2.306-5.156-5.156-5.156zm0 8.518c-1.856 0-3.364-1.508-3.364-3.364s1.508-3.364 3.364-3.364 3.364 1.508 3.364 3.364-1.508 3.364-3.364 3.364zm5.156-8.232c-.722 0-1.306-.585-1.306-1.306s.585-1.306 1.306-1.306 1.306.585 1.306 1.306-.585 1.306-1.306 1.306z"></path></svg>
                  </a>
                  <a className="text-matte-silver hover:text-primary dark:hover:text-white transition-colors" href="#">
                    <span className="sr-only">Twitter</span>
                    <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-16 pt-8 border-t border-soft-gray dark:border-slate/20 text-center text-sm text-matte-silver">
              <p>© 2024 ShopTheBarber. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LayoutContent>{children}</LayoutContent>
    </QueryClientProvider>
  );
}