import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceCard } from '@/components/services/ServiceCard';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('sonner');
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

const mockToast = toast as jest.MockedFunction<typeof toast>;

const mockService = {
  id: '1',
  name: 'Classic Haircut',
  description: 'Traditional haircut with professional styling. Perfect for a clean, polished look.',
  price: 25,
  duration: 30,
  category: 'haircut',
  image_url: 'https://example.com/image1.jpg',
  is_active: true,
  rating: 4.5,
  review_count: 10,
  barber_profiles: {
    id: 'barber1',
    business_name: 'John\'s Barbershop',
    avatar_url: 'https://example.com/avatar1.jpg',
    verified: true,
  },
  service_categories: {
    id: 'cat1',
    name: 'Haircuts',
  },
};

const mockOnClick = jest.fn();
const mockOnFavoriteToggle = jest.fn();

describe('ServiceCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Grid View', () => {
    it('should render service card in grid view', () => {
      render(
        <ServiceCard
          service={mockService}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      // Check service details
      expect(screen.getByText('Classic Haircut')).toBeInTheDocument();
      expect(screen.getByText('$25')).toBeInTheDocument();
      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('John\'s Barbershop')).toBeInTheDocument();
      expect(screen.getByText('Haircuts')).toBeInTheDocument();

      // Check rating
      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('(10 reviews)')).toBeInTheDocument();

      // Check image
      const image = screen.getByAltText('Classic Haircut');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');
    });

    it('should show verified badge for verified barbers', () => {
      render(
        <ServiceCard
          service={mockService}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      expect(screen.getByTitle('Verified barber')).toBeInTheDocument();
    });

    it('should not show verified badge for unverified barbers', () => {
      const unverifiedService = {
        ...mockService,
        barber_profiles: {
          ...mockService.barber_profiles,
          verified: false,
        },
      };

      render(
        <ServiceCard
          service={unverifiedService}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      expect(screen.queryByTitle('Verified barber')).not.toBeInTheDocument();
    });

    it('should handle click events', async () => {
      const user = userEvent.setup();
      render(
        <ServiceCard
          service={mockService}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      const card = screen.getByRole('button');
      await user.click(card);

      expect(mockOnClick).toHaveBeenCalledWith(mockService);
    });

    it('should handle favorite toggle', async () => {
      const user = userEvent.setup();
      render(
        <ServiceCard
          service={mockService}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
          isFavorite={false}
        />
      );

      const favoriteButton = screen.getByRole('button', { name: /add to favorites/i });
      await user.click(favoriteButton);

      expect(mockOnFavoriteToggle).toHaveBeenCalledWith(mockService.id, true);
      expect(mockOnClick).not.toHaveBeenCalled(); // Should not trigger card click
    });

    it('should show favorite state correctly', () => {
      render(
        <ServiceCard
          service={mockService}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
          isFavorite={true}
        />
      );

      const favoriteButton = screen.getByRole('button', { name: /remove from favorites/i });
      expect(favoriteButton).toBeInTheDocument();
    });

    it('should show placeholder image when image fails to load', () => {
      const serviceWithoutImage = {
        ...mockService,
        image_url: null,
      };

      render(
        <ServiceCard
          service={serviceWithoutImage}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      // Should show placeholder
      expect(screen.getByText('No image available')).toBeInTheDocument();
    });

    it('should truncate long descriptions', () => {
      const serviceWithLongDescription = {
        ...mockService,
        description: 'This is a very long description that should be truncated when displayed in the service card to maintain a clean and consistent layout across all service cards in the grid view.',
      };

      render(
        <ServiceCard
          service={serviceWithLongDescription}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      // Description should be truncated (implementation dependent)
      const description = screen.getByText(/This is a very long description/);
      expect(description).toBeInTheDocument();
    });
  });

  describe('List View', () => {
    it('should render service card in list view', () => {
      render(
        <ServiceCard
          service={mockService}
          viewMode="list"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      // Check service details
      expect(screen.getByText('Classic Haircut')).toBeInTheDocument();
      expect(screen.getByText('$25')).toBeInTheDocument();
      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('John\'s Barbershop')).toBeInTheDocument();

      // In list view, description should be more visible
      expect(screen.getByText(/Traditional haircut with professional styling/)).toBeInTheDocument();
    });

    it('should have different layout in list view', () => {
      const { container } = render(
        <ServiceCard
          service={mockService}
          viewMode="list"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      // List view should have horizontal layout
      expect(container.firstChild).toHaveClass('flex');
    });
  });

  describe('Rating Display', () => {
    it('should display rating with stars', () => {
      render(
        <ServiceCard
          service={mockService}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      // Check for star icons (implementation dependent)
      const stars = screen.getAllByText('★');
      expect(stars).toHaveLength(5); // Should show 5 stars
    });

    it('should handle services with no reviews', () => {
      const serviceWithoutReviews = {
        ...mockService,
        rating: 0,
        review_count: 0,
      };

      render(
        <ServiceCard
          service={serviceWithoutReviews}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    });

    it('should display correct rating value', () => {
      const serviceWithDifferentRating = {
        ...mockService,
        rating: 3.7,
        review_count: 25,
      };

      render(
        <ServiceCard
          service={serviceWithDifferentRating}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      expect(screen.getByText('3.7')).toBeInTheDocument();
      expect(screen.getByText('(25 reviews)')).toBeInTheDocument();
    });
  });

  describe('Price and Duration', () => {
    it('should format price correctly', () => {
      const expensiveService = {
        ...mockService,
        price: 125.50,
      };

      render(
        <ServiceCard
          service={expensiveService}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      expect(screen.getByText('$125.50')).toBeInTheDocument();
    });

    it('should format duration correctly', () => {
      const longService = {
        ...mockService,
        duration: 90,
      };

      render(
        <ServiceCard
          service={longService}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      expect(screen.getByText('90 min')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <ServiceCard
          service={mockService}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('Classic Haircut'));

      const favoriteButton = screen.getByRole('button', { name: /add to favorites/i });
      expect(favoriteButton).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <ServiceCard
          service={mockService}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      const card = screen.getByRole('button');
      
      // Focus the card
      card.focus();
      expect(card).toHaveFocus();

      // Press Enter to click
      await user.keyboard('{Enter}');
      expect(mockOnClick).toHaveBeenCalledWith(mockService);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing barber profile gracefully', () => {
      const serviceWithoutBarber = {
        ...mockService,
        barber_profiles: null,
      };

      render(
        <ServiceCard
          service={serviceWithoutBarber}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      // Should still render the service
      expect(screen.getByText('Classic Haircut')).toBeInTheDocument();
      expect(screen.getByText('Unknown Barber')).toBeInTheDocument();
    });

    it('should handle missing category gracefully', () => {
      const serviceWithoutCategory = {
        ...mockService,
        service_categories: null,
      };

      render(
        <ServiceCard
          service={serviceWithoutCategory}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={mockOnFavoriteToggle}
        />
      );

      // Should still render the service
      expect(screen.getByText('Classic Haircut')).toBeInTheDocument();
      expect(screen.getByText('Uncategorized')).toBeInTheDocument();
    });

    it('should handle favorite toggle errors', async () => {
      const user = userEvent.setup();
      const errorOnFavoriteToggle = jest.fn().mockRejectedValue(new Error('Network error'));
      
      render(
        <ServiceCard
          service={mockService}
          viewMode="grid"
          onClick={mockOnClick}
          onFavoriteToggle={errorOnFavoriteToggle}
        />
      );

      const favoriteButton = screen.getByRole('button', { name: /add to favorites/i });
      await user.click(favoriteButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Failed to update favorites. Please try again.'
        );
      });
    });
  });
});