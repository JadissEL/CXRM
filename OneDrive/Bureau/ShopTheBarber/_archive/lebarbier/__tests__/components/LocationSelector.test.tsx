import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import LocationSelector from '@/components/booking/LocationSelector';

// Mock fetch
global.fetch = jest.fn();

// Mock geocoding function
jest.mock('@/lib/geocoding', () => ({
  geocodeAddress: jest.fn(),
}));

describe('LocationSelector Component', () => {
  const defaultProps = {
    barberId: 'barber_123',
    selectedLocation: 'shop' as const,
    onLocationChange: jest.fn(),
    serviceAddress: '',
    onAddressChange: jest.fn(),
    coordinates: null,
    onCoordinatesChange: jest.fn(),
    totalServicePrice: 50,
    onTravelFeeChange: jest.fn(),
    onValidationChange: jest.fn(),
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful barber info fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        offersHomeVisits: true,
        homeVisitInfo: {
          baseFee: 10,
          feePerKm: 2,
          maxDistance: 25,
        },
        shopLocation: {
          address: '456 Barber Shop Ave, Salon City, SC 12345',
          coordinates: { lat: 40.7128, lng: -74.0060 },
        },
      }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders location selector with shop and home options', async () => {
    render(<LocationSelector {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Service Location')).toBeInTheDocument();
      expect(screen.getByText('In Salon')).toBeInTheDocument();
      expect(screen.getByText('At Home')).toBeInTheDocument();
    });
  });

  it('shows shop location when shop is selected', async () => {
    render(<LocationSelector {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('456 Barber Shop Ave, Salon City, SC 12345')).toBeInTheDocument();
    });
  });

  it('shows address form when home is selected', async () => {
    const user = userEvent.setup();
    render(<LocationSelector {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('At Home')).toBeInTheDocument();
    });

    await user.click(screen.getByText('At Home'));

    expect(defaultProps.onLocationChange).toHaveBeenCalledWith('home');
  });

  it('displays home visit pricing information', async () => {
    render(<LocationSelector {...defaultProps} selectedLocation="home" />);

    await waitFor(() => {
      expect(screen.getByText('Home Visit Pricing')).toBeInTheDocument();
      expect(screen.getByText('Base fee: $10.00')).toBeInTheDocument();
      expect(screen.getByText('+ $2.00 per km')).toBeInTheDocument();
      expect(screen.getByText('Max distance: 25 km')).toBeInTheDocument();
    });
  });

  it('validates address and calculates travel fee', async () => {
    const user = userEvent.setup();
    const { geocodeAddress } = require('@/lib/geocoding');
    
    // Mock geocoding
    geocodeAddress.mockResolvedValue({
      lat: 40.7589,
      lng: -73.9851,
    });

    // Mock address validation
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          offersHomeVisits: true,
          homeVisitInfo: {
            baseFee: 10,
            feePerKm: 2,
            maxDistance: 25,
          },
          shopLocation: {
            address: '456 Barber Shop Ave, Salon City, SC 12345',
            coordinates: { lat: 40.7128, lng: -74.0060 },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isValid: true,
          travelInfo: {
            distance_km: 15.5,
            travel_time_minutes: 22,
            travel_fee: 41.0,
          },
        }),
      });

    render(
      <LocationSelector
        {...defaultProps}
        selectedLocation="home"
        serviceAddress="123 Main St, New York, NY 10001"
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('123 Main St, New York, NY 10001')).toBeInTheDocument();
    });

    // Trigger address validation
    const addressInput = screen.getByDisplayValue('123 Main St, New York, NY 10001');
    await user.clear(addressInput);
    await user.type(addressInput, '123 Main St, New York, NY 10001');
    
    // Wait for debounced validation
    await waitFor(() => {
      expect(geocodeAddress).toHaveBeenCalledWith('123 Main St, New York, NY 10001');
    }, { timeout: 2000 });

    await waitFor(() => {
      expect(defaultProps.onTravelFeeChange).toHaveBeenCalledWith(41.0);
      expect(defaultProps.onValidationChange).toHaveBeenCalledWith(true);
    });
  });

  it('shows error for invalid address', async () => {
    const user = userEvent.setup();
    const { geocodeAddress } = require('@/lib/geocoding');
    
    // Mock failed geocoding
    geocodeAddress.mockRejectedValue(new Error('Address not found'));

    render(
      <LocationSelector
        {...defaultProps}
        selectedLocation="home"
      />
    );

    const addressInput = screen.getByPlaceholderText('Enter your full address');
    await user.type(addressInput, 'Invalid Address');
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid address')).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(defaultProps.onValidationChange).toHaveBeenCalledWith(false, 'Please enter a valid address');
  });

  it('shows error for address outside service area', async () => {
    const user = userEvent.setup();
    const { geocodeAddress } = require('@/lib/geocoding');
    
    // Mock geocoding
    geocodeAddress.mockResolvedValue({
      lat: 45.0000,
      lng: -80.0000,
    });

    // Mock address validation failure
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          offersHomeVisits: true,
          homeVisitInfo: {
            baseFee: 10,
            feePerKm: 2,
            maxDistance: 25,
          },
          shopLocation: {
            address: '456 Barber Shop Ave, Salon City, SC 12345',
            coordinates: { lat: 40.7128, lng: -74.0060 },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Address is outside service area',
        }),
      });

    render(
      <LocationSelector
        {...defaultProps}
        selectedLocation="home"
      />
    );

    const addressInput = screen.getByPlaceholderText('Enter your full address');
    await user.type(addressInput, '999 Far Away St, Distant City, State 99999');
    
    await waitFor(() => {
      expect(screen.getByText('Address is outside service area')).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(defaultProps.onValidationChange).toHaveBeenCalledWith(false, 'Address is outside service area');
  });

  it('disables home visit option when barber does not offer it', async () => {
    // Mock barber who doesn't offer home visits
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        offersHomeVisits: false,
        shopLocation: {
          address: '456 Barber Shop Ave, Salon City, SC 12345',
          coordinates: { lat: 40.7128, lng: -74.0060 },
        },
      }),
    });

    render(<LocationSelector {...defaultProps} />);

    await waitFor(() => {
      const homeButton = screen.getByText('At Home').closest('button');
      expect(homeButton).toBeDisabled();
      expect(screen.getByText('Home visits not available')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching barber info', () => {
    // Mock pending fetch
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<LocationSelector {...defaultProps} />);

    expect(screen.getByText('Loading location options...')).toBeInTheDocument();
  });

  it('displays travel information when address is valid', async () => {
    const user = userEvent.setup();
    const { geocodeAddress } = require('@/lib/geocoding');
    
    geocodeAddress.mockResolvedValue({
      lat: 40.7589,
      lng: -73.9851,
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          offersHomeVisits: true,
          homeVisitInfo: {
            baseFee: 10,
            feePerKm: 2,
            maxDistance: 25,
          },
          shopLocation: {
            address: '456 Barber Shop Ave, Salon City, SC 12345',
            coordinates: { lat: 40.7128, lng: -74.0060 },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isValid: true,
          travelInfo: {
            distance_km: 15.5,
            travel_time_minutes: 22,
            travel_fee: 41.0,
          },
        }),
      });

    render(
      <LocationSelector
        {...defaultProps}
        selectedLocation="home"
        serviceAddress="123 Main St, New York, NY 10001"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Travel Information')).toBeInTheDocument();
      expect(screen.getByText('Distance: 15.5 km')).toBeInTheDocument();
      expect(screen.getByText('Travel time: 22 minutes')).toBeInTheDocument();
      expect(screen.getByText('Travel fee: $41.00')).toBeInTheDocument();
      expect(screen.getByText('Total: $91.00')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles disabled state correctly', async () => {
    render(<LocationSelector {...defaultProps} disabled={true} />);

    await waitFor(() => {
      const shopButton = screen.getByText('In Salon').closest('button');
      const homeButton = screen.getByText('At Home').closest('button');
      
      expect(shopButton).toBeDisabled();
      expect(homeButton).toBeDisabled();
    });
  });

  it('updates coordinates when address changes', async () => {
    const user = userEvent.setup();
    const { geocodeAddress } = require('@/lib/geocoding');
    
    geocodeAddress.mockResolvedValue({
      lat: 40.7589,
      lng: -73.9851,
    });

    render(
      <LocationSelector
        {...defaultProps}
        selectedLocation="home"
      />
    );

    const addressInput = screen.getByPlaceholderText('Enter your full address');
    await user.type(addressInput, '123 Main St, New York, NY 10001');
    
    await waitFor(() => {
      expect(defaultProps.onCoordinatesChange).toHaveBeenCalledWith({
        lat: 40.7589,
        lng: -73.9851,
      });
    }, { timeout: 2000 });
  });

  it('clears travel fee when switching to shop', async () => {
    const user = userEvent.setup();
    
    render(
      <LocationSelector
        {...defaultProps}
        selectedLocation="home"
        serviceAddress="123 Main St"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('In Salon')).toBeInTheDocument();
    });

    await user.click(screen.getByText('In Salon'));

    expect(defaultProps.onLocationChange).toHaveBeenCalledWith('shop');
    expect(defaultProps.onTravelFeeChange).toHaveBeenCalledWith(0);
    expect(defaultProps.onValidationChange).toHaveBeenCalledWith(true);
  });
});