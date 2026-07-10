import "./global.css";
import React from "react";
const { Suspense } = React;
import Link from "next/link";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { FormShowcase } from "./components/ui/form-showcase";
import { DashboardShowcase } from "./components/ui/dashboard-showcase";


const queryClient = new QueryClient();

interface AppProps {
  children: React.ReactNode;
}

export const App = ({ children }: AppProps) => {
  React.useEffect(() => {
    // Global fetch interceptor for demo mode
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      const url = args[0];
      if (typeof url === "string" && url.includes("/api/")) {
        console.log("Demo mode: Blocked API call to", url);
        return Promise.reject(new Error("API calls disabled in demo mode"));
      }
      return originalFetch.apply(window, args);
    };

    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Bienvenue sur ShopTheBarber !", {
            body: "Vous recevrez désormais des rappels et offres exclusives.",
            icon: "/public/favicon.ico",
          });
        }
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Suspense
            fallback={
              <div className="min-h-screen bg-moroccan-charcoal flex items-center justify-center">
                <div className="text-center space-y-6 fade-in">
                  <div className="w-20 h-20 mx-auto bg-moroccan-gradient-primary rounded-2xl flex items-center justify-center shadow-xl shadow-moroccan-gold/20">
                    <div className="w-8 h-8 border-3 border-moroccan-charcoal border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white font-heading">
                      ShopTheBarber
                    </h2>
                    <p className="text-white animate-pulse">
                      Chargement de votre expérience premium...
                    </p>
                    <div className="w-32 h-1 bg-moroccan-darkgrey rounded-full mx-auto overflow-hidden">
                      <div className="h-full bg-moroccan-gradient-primary rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            {/* Pages will be rendered by Next.js file-system router */}
            {children}
          </Suspense>
        </TooltipProvider>
      </QueryClientProvider>
  );
};

// Next.js handles rendering via file-system router
