'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Scissors, 
  Palette, 
  Baby, 
  Package, 
  Eye, 
  Sparkles, 
  Droplets, 
  HandMetal, 
  MoreHorizontal,
  Check,
  Zap
} from 'lucide-react';

export interface ServiceCategory {
  id: string;
  name: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  count: number;
  color: string;
}

export interface ServiceCategoriesProps {
  categories: ServiceCategory[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  className?: string;
}

// Men-only barber service categories
export const MEN_BARBER_CATEGORIES: Omit<ServiceCategory, 'count'>[] = [
  {
    id: 'haircut',
    name: 'haircut',
    label: 'Haircut',
    icon: Scissors,
    description: 'Classic and modern men\'s haircuts',
    color: 'bg-blue-500'
  },
  {
    id: 'shave_beard',
    name: 'shave_beard',
    label: 'Shave & Beard Trim',
    icon: Zap,
    description: 'Professional shaving and beard grooming',
    color: 'bg-gray-600'
  },
  {
    id: 'coloring',
    name: 'coloring',
    label: 'Hair Coloring',
    icon: Palette,
    description: 'Hair dye, highlights, and color treatments',
    color: 'bg-purple-500'
  },
  {
    id: 'kids_teens',
    name: 'kids_teens',
    label: 'Kids/Teens',
    icon: Baby,
    description: 'Specialized cuts for young men',
    color: 'bg-green-500'
  },
  {
    id: 'packages',
    name: 'packages',
    label: 'Packages/Bundles',
    icon: Package,
    description: 'Multiple services at discounted rates',
    color: 'bg-orange-500'
  },
  {
    id: 'eyebrow',
    name: 'eyebrow',
    label: 'Eyebrow Grooming',
    icon: Eye,
    description: 'Eyebrow shaping and maintenance',
    color: 'bg-pink-500'
  },
  {
    id: 'facial',
    name: 'facial',
    label: 'Facial/Skin Care',
    icon: Sparkles,
    description: 'Men\'s facials and skin treatments',
    color: 'bg-indigo-500'
  },
  {
    id: 'treatments',
    name: 'treatments',
    label: 'Hair Treatments',
    icon: Droplets,
    description: 'Keratin, anti-dandruff, scalp treatments',
    color: 'bg-teal-500'
  },
  {
    id: 'nails',
    name: 'nails',
    label: 'Nails & Hand Grooming',
    icon: HandMetal,
    description: 'Male manicure and hand care',
    color: 'bg-red-500'
  },
  {
    id: 'other',
    name: 'other',
    label: 'Other',
    icon: MoreHorizontal,
    description: 'Custom requests and add-ons',
    color: 'bg-slate-500'
  }
];

export function ServiceCategories({
  categories,
  selectedCategory,
  onCategorySelect,
  className = ''
}: ServiceCategoriesProps) {
  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      onCategorySelect(null); // Deselect if already selected
    } else {
      onCategorySelect(categoryId);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Categories - Horizontal Scroll */}
      <div className="hidden md:block">
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <Card
                  key={category.id}
                  className={`
                    flex-shrink-0 cursor-pointer transition-all duration-200 hover:shadow-md
                    ${isSelected 
                      ? 'ring-2 ring-primary bg-primary/5 border-primary' 
                      : 'hover:border-primary/50'
                    }
                  `}
                  onClick={() => handleCategoryClick(category.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCategoryClick(category.id);
                    }
                  }}
                  aria-pressed={isSelected}
                  aria-label={`${category.label} category with ${category.count} services`}
                >
                  <CardContent className="p-4 w-32 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-white
                        ${category.color}
                        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                      `}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-medium text-sm leading-tight">
                          {category.label}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {category.count}
                        </Badge>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Mobile Categories - Grid Layout */}
      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <Card
                key={category.id}
                className={`
                  cursor-pointer transition-all duration-200 hover:shadow-md
                  ${isSelected 
                    ? 'ring-2 ring-primary bg-primary/5 border-primary' 
                    : 'hover:border-primary/50'
                  }
                `}
                onClick={() => handleCategoryClick(category.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCategoryClick(category.id);
                  }
                }}
                aria-pressed={isSelected}
                aria-label={`${category.label} category with ${category.count} services`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0
                      ${category.color}
                      ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}
                    `}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm leading-tight truncate">
                        {category.label}
                      </h3>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {category.count}
                        </Badge>
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Category Description */}
      {selectedCategory && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {categories.find(c => c.id === selectedCategory)?.description}
          </p>
        </div>
      )}
    </div>
  );
}

// Category filter chips for showing selected categories
export function CategoryChips({
  categories,
  selectedCategory,
  onCategoryRemove
}: {
  categories: ServiceCategory[];
  selectedCategory: string | null;
  onCategoryRemove: () => void;
}) {
  if (!selectedCategory) return null;

  const category = categories.find(c => c.id === selectedCategory);
  if (!category) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="default" className="gap-1">
        <span>{category.label}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-transparent"
          onClick={onCategoryRemove}
          aria-label={`Remove ${category.label} filter`}
        >
          ×
        </Button>
      </Badge>
    </div>
  );
} 