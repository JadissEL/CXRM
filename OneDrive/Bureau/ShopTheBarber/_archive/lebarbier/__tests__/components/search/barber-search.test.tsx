import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUser } from '@clerk/nextjs';
import BarberSearch from '@/components/search/BarberSearch';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@clerk/nextjs');
jest.mock('sonner');
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: any) => value
}));

// Mock fetch
global.fetch = jest.fn();

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

const mockUser = {
  id: 'user_123',
  firstName: 'John',
  lastName: 'Doe',
  emailAddresses: [{ emailAddress: 'john@example.com' }]
};

const mockBarberData = {
  success: true,
  data: [
    {
      id: 'barber_1',
      name: 'John Smith',
      business_name: 'Smith Barbershop',
      avatar_url: 'https://example.com/avatar1.jpg',
      rating: 4.8,
      total_reviews: 127,
      price_range: '$$',
      specialties: ['Classic Cuts', 'Beard Specialist'],
      location: {
        city: 'New York',
        state: 'NY',
        distance_km: 2.5
      },
      contact: {
        phone: '+1234567890',
        website: 'https://smithbarbershop.com',
        instagram: '@smithbarbershop'
      },
      languages: ['English', 'Spanish'],
      is_mobile: false,
      service_radius_km: null,
      services: [
        {
          id: 'service_1',
          name: 'Classic Haircut',
          category: 'haircut',
          price: 35,
          duration: 30
        },
        {
          id: 'service_2',
          name: 'Beard Trim',
          category: 'beard_trim',
          price: 20,
          duration: 15
        }
      ],
      featured_photo: 'https://example.com/shop1.jpg',
      available_slots: [
        '2024-01-15T10:00:00Z',
        '2024-01-15T14:00:00Z',
        '2024-01-16T09:00:00Z'
      ],
      is_favorited: false
    },
    {
      id: 'barber_2',
      name: 'Maria Garcia',
      business_name: 'Garcia Hair Studio',
      avatar_url: 'https://example.com/avatar2.jpg',
      rating: 4.9,
      total_reviews: 89,
      price_range: '$$$',
      specialties: ['Modern Styles', 'Coloring'],
      location: {
        city: 'Brooklyn',
        state: 'NY',
        distance_km: 5.2
      },
      contact: {
        phone: '+1987654321',
        instagram: '@garciastudio'
      },
      languages: ['English', 'Spanish', 'French'],
      is_mobile: true,
      service_radius_km: 15,
      services: [
        {
          id: 'service_3',
          name: 'Modern Cut & Style',
          category: 'styling',
          price: 65,
          duration: 45
        }
      ],
      available_slots: ['2024-01-15T11:00:00Z'],
      is_favorited: true
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 2,
    total_pages: 1,
    has_next: false,
    has_prev: false
  },
  filters_applied: {}
};

describe('BarberSearch Component', () => {
  const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
  const mockToast = toast as jest.MockedFunction<typeof toast>;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseUser.mockReturnValue({
      user: mockUser,
      isLoaded: true,
      isSignedIn: true
    } as any);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockBarberData
    } as Response);

    // Mock successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      } as GeolocationPosition);
    });
  });

  describe('Initial Render', () => {
    it('renders search interface correctly', async () => {
      render(<BarberSearch />);
      
      expect(screen.getByText('Find Your Perfect Barber')).toBeInTheDocument();
      expect(screen.getByText('Discover skilled barbers near you with real-time availability')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search by name, service, or location...')).toBeInTheDocument();
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: false,
        isSignedIn: false
      } as any);
      
      render(<BarberSearch />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('requests user location on mount', () => {
      render(<BarberSearch />);
      
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('performs search with query', async () => {
      const user = userEvent.setup();
      render(<BarberSearch />);
      
      const searchInput = screen.getByPlaceholderText('Search by name, service, or location...');
      await user.type(searchInput, 'haircut');
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/barbers/search?q=haircut')
        );
      });
    });

    it('displays search results', async () => {
      render(<BarberSearch />);
      
      await waitFor(() => {
        expect(screen.getByText('Smith Barbershop')).toBeInTheDocument();
        expect(screen.getByText('Garcia Hair Studio')).toBeInTheDocument();
      });
    });

    it('shows results summary', async () => {
      render(<BarberSearch />);
      
      await waitFor(() => {
        expect(screen.getByText(/Showing 1-2 of 2 barbers/)).toBeInTheDocument();
      });
    });

    it('handles search errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Search failed'));
      
      render(<BarberSearch />);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Search failed');
      });
    });
  });

  describe('Filters', () => {
    it('toggles filter panel', async () => {
      const user = userEvent.setup();
      render(<BarberSearch />);
      
      const filtersButton = screen.getByText('Filters');
      await user.click(filtersButton);
      
      expect(screen.getByText('Search Filters')).toBeInTheDocument();
    });

    it('applies location filter', async () => {
      const user = userEvent.setup();
      render(<BarberSearch />);
      
      // Open filters
      await user.click(screen.getByText('Filters'));
      
      // Set custom location
      const locationInput = screen.getByPlaceholderText('Enter city, address, or ZIP');
      await user.type(locationInput, 'Brooklyn, NY');
      await user.click(screen.getByText('Search'));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('location=Brooklyn%2C%20NY')
        );
      });
    });

    it('applies service category filter', async () => {
      const user = userEvent.setup();
      render(<BarberSearch />);
      
      // Open filters
      await user.click(screen.getByText('Filters'));
      
      // Select haircut category
      const haircutButton = screen.getByText('Haircut');
      await user.click(haircutButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('category=haircut')
        );
      });
    });

    it('applies rating filter', async () => {
      const user = userEvent.setup();
      render(<BarberSearch />);
      
      // Open filters
      await user.click(screen.getByText('Filters'));
      
      // Adjust rating slider (simplified test)
      const ratingSlider = screen.getByRole('slider', { name: /minimum rating/i });
      fireEvent.change(ratingSlider, { target: { value: '4' } });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('min_rating=4')
        );
      });
    });

    it('clears all filters', async () => {
      const user = userEvent.setup();
      render(<BarberSearch />);
      
      // Open filters and apply some
      await user.click(screen.getByText('Filters'));
      await user.click(screen.getByText('Haircut'));
      
      // Clear all filters
      await user.click(screen.getByText('Clear All'));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.not.stringContaining('category=haircut')
        );
      });
    });
  });

  describe('View Modes', () => {
    it('switches between list and map view', async () => {
      const user = userEvent.setup();
      render(<BarberSearch />);
      
      // Should start in list view
      await waitFor(() => {
        expect(screen.getByText('Smith Barbershop')).toBeInTheDocument();
      });
      
      // Switch to map view
      const mapButton = screen.getByRole('button', { name: /map/i });
      await user.click(mapButton);
      
      // Map view should be active (simplified check)
      expect(mapButton).toHaveClass('bg-primary');
    });
  });

  describe('Barber Cards', () => {
    it('displays barber information correctly', async () => {
      render(<BarberSearch />);
      
      await waitFor(() => {
        // Check first barber
        expect(screen.getByText('Smith Barbershop')).toBeInTheDocument();
        expect(screen.getByText('4.8')).toBeInTheDocument();
        expect(screen.getByText('(127)')).toBeInTheDocument();
        expect(screen.getByText('New York, NY')).toBeInTheDocument();
        expect(screen.getByText('2.5km away')).toBeInTheDocument();
        
        // Check specialties
        expect(screen.getByText('Classic Cuts')).toBeInTheDocument();
        expect(screen.getByText('Beard Specialist')).toBeInTheDocument();
        
        // Check services
        expect(screen.getByText('Classic Haircut')).toBeInTheDocument();
        expect(screen.getByText('$35')).toBeInTheDocument();
      });
    });

    it('handles favorite toggle for signed-in users', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
      
      render(<BarberSearch />);
      
      await waitFor(() => {
        expect(screen.getByText('Smith Barbershop')).toBeInTheDocument();
      });
      
      // Find and click favorite button for first barber
      const favoriteButtons = screen.getAllByRole('button', { name: /favorite/i });
      await user.click(favoriteButtons[0]);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/profile/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favorite_type: 'barber',
          favorite_id: 'barber_1'
        })
      });
    });

    it('shows sign-in prompt for favorite when not authenticated', async () => {
      const user = userEvent.setup();
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: true,
        isSignedIn: false
      } as any);
      
      render(<BarberSearch />);
      
      await waitFor(() => {
        expect(screen.getByText('Smith Barbershop')).toBeInTheDocument();
      });
      
      const favoriteButtons = screen.getAllByRole('button', { name: /favorite/i });
      await user.click(favoriteButtons[0]);
      
      expect(mockToast.error).toHaveBeenCalledWith('Please sign in to save favorites');
    });
  });

  describe('Pagination', () => {
    it('handles pagination when multiple pages exist', async () => {
      const multiPageData = {
        ...mockBarberData,
        pagination: {
          page: 1,
          limit: 20,
          total: 50,
          total_pages: 3,
          has_next: true,
          has_prev: false
        }
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => multiPageData
      } as Response);
      
      const user = userEvent.setup();
      render(<BarberSearch />);
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Next'));
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });
  });

  describe('Empty States', () => {
    it('shows no results message when no barbers found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockBarberData,
          data: [],
          pagination: { ...mockBarberData.pagination, total: 0 }
        })
      } as Response);
      
      render(<BarberSearch />);
      
      await waitFor(() => {
        expect(screen.getByText('No barbers found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search criteria or expanding your search radius.')).toBeInTheDocument();
      });
    });

    it('provides reset filters option in empty state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockBarberData,
          data: [],
          pagination: { ...mockBarberData.pagination, total: 0 }
        })
      } as Response);
      
      const user = userEvent.setup();
      render(<BarberSearch />);
      
      await waitFor(() => {
        expect(screen.getByText('Reset Filters')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Reset Filters'));
      
      // Should trigger a new search with default filters
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('radius=50')
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      render(<BarberSearch />);
      
      expect(screen.getByRole('searchbox')).toHaveAccessibleName();
      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<BarberSearch />);
      
      const searchInput = screen.getByPlaceholderText('Search by name, service, or location...');
      
      // Tab to search input
      await user.tab();
      expect(searchInput).toHaveFocus();
      
      // Tab to filters button
      await user.tab();
      expect(screen.getByText('Filters')).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<BarberSearch />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('handles API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Invalid search parameters'
        })
      } as Response);
      
      render(<BarberSearch />);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Invalid search parameters');
      });
    });

    it('handles geolocation errors', () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error!({
          code: 1,
          message: 'User denied geolocation'
        } as GeolocationPositionError);
      });
      
      render(<BarberSearch />);
      
      // Should still render without location
      expect(screen.getByText('Find Your Perfect Barber')).toBeInTheDocument();
    });
  });
});