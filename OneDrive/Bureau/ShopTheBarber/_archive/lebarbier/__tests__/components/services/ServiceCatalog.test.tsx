import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceCatalog } from '@/components/services/ServiceCatalog';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('sonner');
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: any) => value,
}));

// Mock fetch
global.fetch = jest.fn();

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockGet = jest.fn();
const mockToast = toast as jest.MockedFunction<typeof toast>;

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

const mockServices = [
  {
    id: '1',
    name: 'Classic Haircut',
    description: 'Traditional haircut with styling',
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
  },
  {
    id: '2',
    name: 'Beard Trim',
    description: 'Professional beard trimming and styling',
    price: 15,
    duration: 20,
    category: 'beard',
    image_url: 'https://example.com/image2.jpg',
    is_active: true,
    rating: 4.8,
    review_count: 15,
    barber_profiles: {
      id: 'barber2',
      business_name: 'Mike\'s Cuts',
      avatar_url: 'https://example.com/avatar2.jpg',
      verified: false,
    },
    service_categories: {
      id: 'cat2',
      name: 'Beard Care',
    },
  },
];

const mockCategories = [
  { id: 'cat1', name: 'Haircuts', count: 5 },
  { id: 'cat2', name: 'Beard Care', count: 3 },
  { id: 'cat3', name: 'Styling', count: 2 },
];

const mockApiResponse = {
  services: mockServices,
  categories: mockCategories,
  pagination: {
    page: 1,
    limit: 12,
    total: 2,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
  priceRange: [0, 100],
  durationRange: [15, 120],
};

describe('ServiceCatalog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    } as any);
    
    mockUseSearchParams.mockReturnValue({
      get: mockGet,
      toString: () => '',
    } as any);
    
    mockGet.mockReturnValue(null);
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render service catalog with services', async () => {
    render(<ServiceCatalog />);
    
    // Check for loading state initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for services to load
    await waitFor(() => {
      expect(screen.getByText('Classic Haircut')).toBeInTheDocument();
      expect(screen.getByText('Beard Trim')).toBeInTheDocument();
    });
    
    // Check service details
    expect(screen.getByText('$25')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('John\'s Barbershop')).toBeInTheDocument();
  });

  it('should handle search functionality', async () => {
    const user = userEvent.setup();
    render(<ServiceCatalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Classic Haircut')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search services...');
    await user.type(searchInput, 'haircut');
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=haircut'),
        expect.any(Object)
      );
    });
  });

  it('should toggle between grid and list view', async () => {
    const user = userEvent.setup();
    render(<ServiceCatalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Classic Haircut')).toBeInTheDocument();
    });
    
    // Find view toggle buttons
    const listViewButton = screen.getByRole('button', { name: /list view/i });
    const gridViewButton = screen.getByRole('button', { name: /grid view/i });
    
    // Switch to list view
    await user.click(listViewButton);
    
    // Check if view changed (this would depend on your implementation)
    expect(listViewButton).toHaveAttribute('aria-pressed', 'true');
    
    // Switch back to grid view
    await user.click(gridViewButton);
    expect(gridViewButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('should handle category filtering', async () => {
    const user = userEvent.setup();
    render(<ServiceCatalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Classic Haircut')).toBeInTheDocument();
    });
    
    // Find and click on a category filter
    const haircutCategory = screen.getByLabelText('Haircuts');
    await user.click(haircutCategory);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=cat1'),
        expect.any(Object)
      );
    });
  });

  it('should handle price range filtering', async () => {
    const user = userEvent.setup();
    render(<ServiceCatalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Classic Haircut')).toBeInTheDocument();
    });
    
    // Find price range slider (this would depend on your slider implementation)
    const priceSlider = screen.getByRole('slider', { name: /price range/i });
    
    // Simulate changing the price range
    fireEvent.change(priceSlider, { target: { value: '50' } });
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('maxPrice=50'),
        expect.any(Object)
      );
    });
  });

  it('should handle sorting', async () => {
    const user = userEvent.setup();
    render(<ServiceCatalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Classic Haircut')).toBeInTheDocument();
    });
    
    // Find sort dropdown
    const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
    await user.click(sortSelect);
    
    // Select price low to high
    const priceLowOption = screen.getByText('Price: Low to High');
    await user.click(priceLowOption);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=price&sortOrder=asc'),
        expect.any(Object)
      );
    });
  });

  it('should handle pagination', async () => {
    const user = userEvent.setup();
    
    // Mock response with multiple pages
    const multiPageResponse = {
      ...mockApiResponse,
      pagination: {
        page: 1,
        limit: 12,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      },
    };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => multiPageResponse,
    });
    
    render(<ServiceCatalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Classic Haircut')).toBeInTheDocument();
    });
    
    // Find and click next page button
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });
  });

  it('should open service detail modal', async () => {
    const user = userEvent.setup();
    render(<ServiceCatalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Classic Haircut')).toBeInTheDocument();
    });
    
    // Click on a service card
    const serviceCard = screen.getByText('Classic Haircut').closest('div');
    if (serviceCard) {
      await user.click(serviceCard);
    }
    
    // Check if modal opened (this would depend on your modal implementation)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<ServiceCatalog />);
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Failed to load services. Please try again.'
      );
    });
  });

  it('should show empty state when no services found', async () => {
    const emptyResponse = {
      ...mockApiResponse,
      services: [],
      pagination: {
        ...mockApiResponse.pagination,
        total: 0,
      },
    };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => emptyResponse,
    });
    
    render(<ServiceCatalog />);
    
    await waitFor(() => {
      expect(screen.getByText('No services found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or search terms.')).toBeInTheDocument();
    });
  });

  it('should clear filters', async () => {
    const user = userEvent.setup();
    render(<ServiceCatalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Classic Haircut')).toBeInTheDocument();
    });
    
    // Apply some filters first
    const haircutCategory = screen.getByLabelText('Haircuts');
    await user.click(haircutCategory);
    
    // Find and click clear filters button
    const clearButton = screen.getByRole('button', { name: /clear all filters/i });
    await user.click(clearButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.not.stringContaining('category='),
        expect.any(Object)
      );
    });
  });

  it('should handle mobile filter sheet', async () => {
    const user = userEvent.setup();
    
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    render(<ServiceCatalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Classic Haircut')).toBeInTheDocument();
    });
    
    // Find and click mobile filter button
    const filterButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filterButton);
    
    // Check if filter sheet opened
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should preserve URL state', async () => {
    mockGet.mockImplementation((key: string) => {
      const params: Record<string, string> = {
        search: 'haircut',
        category: 'cat1',
        sortBy: 'price',
        page: '2',
      };
      return params[key] || null;
    });
    
    render(<ServiceCatalog />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=haircut'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=cat1'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=price'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });
  });
});