'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  viewMode: 'grid' | 'list';
  count?: number;
}

export function LoadingSkeleton({ viewMode, count = 6 }: LoadingSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }, (_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Image skeleton */}
                <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
                
                {/* Content skeleton */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-4" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                  
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-6 w-16" />
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-8" />
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, j) => (
                            <Skeleton key={j} className="h-3 w-3" />
                          ))}
                          <Skeleton className="h-3 w-8" />
                        </div>
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Grid view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i}>
          <div className="relative">
            {/* Image skeleton */}
            <Skeleton className="h-48 w-full rounded-t-lg" />
            
            {/* Overlay elements */}
            <div className="absolute top-2 right-2">
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <div className="absolute top-2 left-2">
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
          
          <CardContent className="p-4 space-y-4">
            {/* Service name */}
            <Skeleton className="h-6 w-3/4" />
            
            {/* Barber info */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4" />
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            
            {/* Price and duration */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            
            {/* Rating */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, j) => (
                    <Skeleton key={j} className="h-4 w-4" />
                  ))}
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            
            {/* Button */}
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Filter sidebar skeleton
export function FilterSidebarSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-16" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Categories */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-20" />
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-6" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Price range */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
        
        {/* Duration range */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
        
        {/* Clear button */}
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

// Service detail modal skeleton
export function ServiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-4 w-4" />
              ))}
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      
      {/* Image */}
      <Skeleton className="h-64 w-full rounded-lg" />
      
      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-20" />
          ))}
        </div>
        
        {/* Tab content */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Skeleton className="h-6 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}