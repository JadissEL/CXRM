import { Metadata } from 'next';
import { ServiceCatalog } from '@/components/services/ServiceCatalog';

export const metadata: Metadata = {
  title: 'Service Catalog | LeBarbier',
  description: 'Browse and book professional barber services. Find the perfect service for your grooming needs.',
  keywords: 'barber services, haircut, beard trim, grooming, booking',
};

export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Service Catalog
        </h1>
        <p className="text-muted-foreground text-lg">
          Discover and book professional barber services from skilled professionals in your area.
        </p>
      </div>
      
      <ServiceCatalog />
    </div>
  );
}