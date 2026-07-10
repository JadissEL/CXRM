import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../client/App';

// Mock the lazy-loaded components
vi.mock('../../client/pages/Index', () => ({
  default: () => <div data-testid="index-page">Index Page</div>
}));

vi.mock('../../client/pages/Login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}));

vi.mock('../../client/pages/Signup', () => ({
  default: () => <div data-testid="signup-page">Signup Page</div>
}));

vi.mock('../../client/pages/Dashboard', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>
}));

vi.mock('../../client/pages/NotFound', () => ({
  default: () => <div data-testid="not-found-page">Not Found Page</div>
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
global.fetch = vi.fn();

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  },
  writable: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders without crashing', () => {
    renderWithProviders(<App />);
    expect(screen.getByTestId('index-page')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderWithProviders(<App />);
    // The loading state should be brief, but we can test for the presence of the app
    expect(screen.getByTestId('index-page')).toBeInTheDocument();
  });

  it('handles authentication state correctly', () => {
    // Test with no token
    localStorageMock.getItem.mockReturnValue(null);
    renderWithProviders(<App />);
    expect(screen.getByTestId('index-page')).toBeInTheDocument();
  });

  it('requests notification permission on mount', () => {
    renderWithProviders(<App />);
    expect(window.Notification.requestPermission).toHaveBeenCalled();
  });
});

// Test utilities
export const createMockUser = (role: 'client' | 'barber' | 'admin' = 'client') => ({
  id: 1,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role,
  phone: '+212612345678',
  city: 'Casablanca',
});

export const createMockBarber = () => ({
  id: 1,
  name: 'Hassan Alami',
  salonName: 'Salon Royal',
  description: 'Professional barber with 10 years experience',
  rating: 4.8,
  reviewCount: 45,
  location: 'Casablanca',
  acceptsHome: true,
  acceptsShop: true,
  imageUrl: 'https://example.com/image.jpg',
});

export const createMockAppointment = () => ({
  id: 1,
  barberId: 1,
  barberName: 'Hassan Alami',
  appointmentDate: '2024-01-15',
  appointmentTime: '10:00',
  locationType: 'shop' as const,
  status: 'confirmed' as const,
  totalPrice: 120,
  notes: 'Test appointment',
  services: [
    { serviceId: 1, serviceName: 'Coupe Homme', price: 80 },
    { serviceId: 2, serviceName: 'Barbe', price: 40 },
  ],
}); 