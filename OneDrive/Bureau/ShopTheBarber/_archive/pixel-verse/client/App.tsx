import "./global.css";

import React from "react";
const { Suspense } = React;
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { FormShowcase } from "@/components/ui/form-showcase";
import { DashboardShowcase } from "@/components/ui/dashboard-showcase";

const Reservations = React.lazy(() => import("./pages/Reservations"));

const queryClient = new QueryClient();

const App = () => {
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Bienvenue sur ShopTheBarber !', {
            body: 'Vous recevrez désormais des rappels et offres exclusives.',
            icon: '/public/favicon.ico',
          });
        }
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className='min-h-screen flex items-center justify-center text-2xl'>Chargement...</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route 
                path="/client-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <ClientDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/barber-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['barber']}>
                    <BarberDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/client-settings" 
                element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <ClientSettings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/barber-settings" 
                element={
                  <ProtectedRoute allowedRoles={['barber']}>
                    <BarberSettings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-settings" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminSettings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/client-reports" 
                element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <ClientReports />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/barber-reports" 
                element={<BarberReports />}
              />
              <Route 
                path="/barber-services" 
                element={
                  <ProtectedRoute allowedRoles={['barber']}>
                    <BarberServices />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/barber-earnings" 
                element={
                  <ProtectedRoute allowedRoles={['barber']}>
                    <BarberEarnings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reservations" 
                element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <Reservations />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-reports" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminReports />
                  </ProtectedRoute>
                } 
              />
              <Route path="/blog" element={<Blog />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/form-showcase" element={<FormShowcase />} />
              <Route path="/dashboard-showcase" element={<DashboardShowcase />} />
              <Route path="/city/:city" element={<CityBarbers />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/barbers" element={<AdminBarbers />} />
              <Route path="/admin/moderation" element={<AdminModeration />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const Index = React.lazy(() => import("./pages/Index"));
const Login = React.lazy(() => import("./pages/Login"));
const Signup = React.lazy(() => import("./pages/Signup"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const ClientDashboard = React.lazy(() => import("./pages/ClientDashboard"));
const BarberDashboard = React.lazy(() => import("./pages/BarberDashboard"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const ClientSettings = React.lazy(() => import("./pages/ClientSettings"));
const BarberSettings = React.lazy(() => import("./pages/BarberSettings"));
const AdminSettings = React.lazy(() => import("./pages/AdminSettings"));
const ClientReports = React.lazy(() => import("./pages/ClientReports"));
const BarberReports = React.lazy(() => import("./pages/BarberReports"));
const AdminReports = React.lazy(() => import("./pages/AdminReports"));
const CityBarbers = React.lazy(() => import("./pages/CityBarbers"));
const BarberServices = React.lazy(() => import("./pages/BarberServices"));
const BarberEarnings = React.lazy(() => import("./pages/BarberEarnings"));
const Blog = React.lazy(() => import("./pages/Blog"));
const Marketplace = React.lazy(() => import("./pages/Marketplace"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const AdminUsers = React.lazy(() => import("./pages/AdminUsers"));
const AdminBarbers = React.lazy(() => import("./pages/AdminBarbers"));
const AdminModeration = React.lazy(() => import("./pages/AdminModeration"));
const AdminAnalytics = React.lazy(() => import("./pages/AdminAnalytics"));

createRoot(document.getElementById("root")!).render(<App />);
