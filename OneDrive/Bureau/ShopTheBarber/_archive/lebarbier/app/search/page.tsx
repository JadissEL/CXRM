import { Metadata } from 'next';
import { Suspense } from 'react';
import BarberSearch from '@/components/search/BarberSearch';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Find Barbers | LeBarbier',
  description: 'Discover skilled barbers near you with real-time availability and instant booking.',
  keywords: 'barber search, haircut, beard trim, barber near me, book appointment',
};

function SearchLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header Skeleton */}
      <div className="text-center space-y-2">
        <div className="h-8 bg-muted rounded-md w-64 mx-auto animate-pulse" />
        <div className="h-4 bg-muted rounded-md w-96 mx-auto animate-pulse" />
      </div>
      
      {/* Search Bar Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 bg-muted rounded-md flex-1 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-10 w-20 bg-muted rounded-md animate-pulse" />
              <div className="h-10 w-16 bg-muted rounded-md animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Results Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-muted rounded-md w-48 animate-pulse" />
                  <div className="h-4 bg-muted rounded-md w-32 animate-pulse" />
                  <div className="h-4 bg-muted rounded-md w-64 animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
                    <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<SearchLoadingSkeleton />}>
        <BarberSearch />
      </Suspense>
    </div>
  );
}