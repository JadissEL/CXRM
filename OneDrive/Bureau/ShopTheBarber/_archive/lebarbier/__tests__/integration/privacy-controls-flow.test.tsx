import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useUser } from '@clerk/nextjs';
import PrivacyControls from '@/components/profile/PrivacyControls';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@clerk/nextjs');
jest.mock('sonner');

// Mock fetch globally
global.fetch = jest.fn();

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockToast = toast as jest.Mocked<typeof toast>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock user data
const mockUser = {
  id: 'user_123',
  emailAddresses: [{
    id: 'email_123',
    emailAddress: 'test@example.com',
    verification: { status: 'verified' }
  }],
  firstName: 'John',
  lastName: 'Doe'
};

// Mock privacy info responses
const mockExportInfo = {
  canExport: true,
  recentExports: [
    {
      initiated_at: '2023-12-01T10:00:00Z',
      status: 'completed',
      metadata: { export_id: 'export_123', format: 'zip' }
    }
  ],
  rateLimits: {
    maxPerDay: 3,
    currentCount: 1,
    resetTime: '2023-12-02T00:00:00Z'
  },
  supportedFormats: ['json', 'zip'],
  deliveryMethods: ['download', 'email'],
  dataIncluded: [
    'Authentication data (Clerk)',
    'Profile information',
    'Audit logs (optional)',
    'Application data (Supabase)'
  ]
};

const mockDeletionInfo = {
  canDelete: true,
  requirements: [
    {
      requirement: 'No pending bookings',
      met: true,
      description: 'All bookings must be completed or cancelled'
    },
    {
      requirement: 'Account verification completed',
      met: true,
      description: 'Email and phone verification required'
    }
  ],
  estimatedTime: '24-48 hours',
  dataToDelete: [
    'User profile and account data',
    'Booking history and preferences',
    'Uploaded files and images',
    'Communication logs'
  ],
  irreversible: true
};

describe('Privacy Controls Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful user state
    mockUseUser.mockReturnValue({
      user: mockUser as any,
      isLoaded: true,
      isSignedIn: true
    });

    // Mock successful API responses
    mockFetch.mockImplementation((url: string | URL | Request) => {
      const urlString = url.toString();
      
      if (urlString.includes('/api/profile/export-data') && !urlString.includes('POST')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockExportInfo)
        } as Response);
      }
      
      if (urlString.includes('/api/profile/delete-account') && !urlString.includes('DELETE')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDeletionInfo)
        } as Response);
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      } as Response);
    });

    // Mock toast functions
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
  });

  describe('Component Initialization', () => {
    it('should load privacy controls and display user information', async () => {
      render(<PrivacyControls />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Privacy Controls')).toBeInTheDocument();
      });
      
      // Check that both main sections are present
      expect(screen.getByText('Export My Data')).toBeInTheDocument();
      expect(screen.getByText('Delete My Account')).toBeInTheDocument();
      
      // Verify API calls were made
      expect(mockFetch).toHaveBeenCalledWith('/api/profile/export-data');
      expect(mockFetch).toHaveBeenCalledWith('/api/profile/delete-account');
    });

    it('should display loading state initially', () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: false,
        isSignedIn: false
      });
      
      render(<PrivacyControls />);
      
      expect(screen.getByText('Loading privacy controls...')).toBeInTheDocument();
    });

    it('should show unauthorized message for non-authenticated users', () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: true,
        isSignedIn: false
      });
      
      render(<PrivacyControls />);
      
      expect(screen.getByText('You must be signed in to access privacy controls.')).toBeInTheDocument();
    });
  });

  describe('Data Export Flow', () => {
    it('should display export information and capabilities', async () => {
      render(<PrivacyControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Export My Data')).toBeInTheDocument();
      });
      
      // Check export status
      expect(screen.getByText('Available')).toBeInTheDocument();
      
      // Check rate limits
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
      
      // Check data included
      expect(screen.getByText('Authentication data (Clerk)')).toBeInTheDocument();
      expect(screen.getByText('Profile information')).toBeInTheDocument();
      
      // Check export buttons
      expect(screen.getByText('Download ZIP')).toBeInTheDocument();
      expect(screen.getByText('Download JSON')).toBeInTheDocument();
      expect(screen.getByText('Email ZIP')).toBeInTheDocument();
    });

    it('should handle successful JSON export', async () => {
      // Mock successful export response
      mockFetch.mockImplementation((url: string | URL | Request, options?: RequestInit) => {
        const urlString = url.toString();
        
        if (options?.method === 'POST' && urlString.includes('/api/profile/export-data')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                export_info: { export_id: 'export_456' },
                clerk_data: { id: 'user_123' },
                supabase_data: { profile: {} }
              },
              export_id: 'export_456'
            })
          } as Response);
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockExportInfo)
        } as Response);
      });

      // Mock URL.createObjectURL and related DOM methods
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      
      Object.defineProperty(document, 'createElement', {
        value: jest.fn(() => ({
          href: '',
          download: '',
          click: mockClick
        })),
        writable: true
      });
      
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        writable: true
      });
      
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        writable: true
      });

      render(<PrivacyControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Download JSON')).toBeInTheDocument();
      });
      
      // Click download JSON button
      const downloadButton = screen.getByText('Download JSON');
      fireEvent.click(downloadButton);
      
      // Wait for export to complete
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Data export downloaded');
      });
      
      // Verify download was triggered
      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('should handle export with email delivery', async () => {
      // Mock successful email export response
      mockFetch.mockImplementation((url: string | URL | Request, options?: RequestInit) => {
        const urlString = url.toString();
        
        if (options?.method === 'POST' && urlString.includes('/api/profile/export-data')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              message: 'Data export has been sent to your email address.',
              export_id: 'export_789'
            })
          } as Response);
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockExportInfo)
        } as Response);
      });

      render(<PrivacyControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Email ZIP')).toBeInTheDocument();
      });
      
      // Click email ZIP button
      const emailButton = screen.getByText('Email ZIP');
      fireEvent.click(emailButton);
      
      // Wait for export to complete
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Data export sent to your email address');
      });
    });

    it('should handle rate limiting', async () => {
      // Mock rate limited response
      const rateLimitedInfo = {
        ...mockExportInfo,
        canExport: false,
        rateLimits: {
          maxPerDay: 3,
          currentCount: 3,
          resetTime: '2023-12-02T00:00:00Z'
        }
      };
      
      mockFetch.mockImplementation((url: string | URL | Request) => {
        const urlString = url.toString();
        
        if (urlString.includes('/api/profile/export-data') && !urlString.includes('POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(rateLimitedInfo)
          } as Response);
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDeletionInfo)
        } as Response);
      });

      render(<PrivacyControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Rate Limited')).toBeInTheDocument();
      });
      
      // Check that export buttons are disabled
      const downloadButton = screen.getByText('Download ZIP');
      expect(downloadButton).toBeDisabled();
    });
  });

  describe('Account Deletion Flow', () => {
    it('should display deletion requirements and warnings', async () => {
      render(<PrivacyControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Delete My Account')).toBeInTheDocument();
      });
      
      // Check requirements
      expect(screen.getByText('No pending bookings')).toBeInTheDocument();
      expect(screen.getByText('Account verification completed')).toBeInTheDocument();
      
      // Check warning
      expect(screen.getByText(/This action is irreversible!/)).toBeInTheDocument();
      
      // Check data to delete
      expect(screen.getByText('User profile and account data')).toBeInTheDocument();
    });

    it('should handle successful account deletion with confirmation', async () => {
      // Mock successful deletion response
      mockFetch.mockImplementation((url: string | URL | Request, options?: RequestInit) => {
        const urlString = url.toString();
        
        if (options?.method === 'DELETE' && urlString.includes('/api/profile/delete-account')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              message: 'Account deletion completed successfully'
            })
          } as Response);
        }
        
        if (urlString.includes('/api/profile/delete-account')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDeletionInfo)
          } as Response);
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockExportInfo)
        } as Response);
      });

      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<PrivacyControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Delete My Account')).toBeInTheDocument();
      });
      
      // Click delete button to show confirmation
      const deleteButton = screen.getByText('Delete My Account');
      fireEvent.click(deleteButton);
      
      // Enter confirmation text
      const confirmationInput = screen.getByPlaceholderText('DELETE MY ACCOUNT');
      fireEvent.change(confirmationInput, { target: { value: 'DELETE MY ACCOUNT' } });
      
      // Click confirm deletion
      const confirmButton = screen.getByText('Confirm Deletion');
      fireEvent.click(confirmButton);
      
      // Wait for deletion to complete
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'Account deletion initiated. You will be logged out shortly.'
        );
      });
      
      // Wait for redirect (mocked with setTimeout)
      await waitFor(() => {
        // The component should attempt to redirect
        // In a real test, you might check window.location.href
      }, { timeout: 4000 });
    });

    it('should reject deletion without proper confirmation', async () => {
      render(<PrivacyControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Delete My Account')).toBeInTheDocument();
      });
      
      // Click delete button to show confirmation
      const deleteButton = screen.getByText('Delete My Account');
      fireEvent.click(deleteButton);
      
      // Enter wrong confirmation text
      const confirmationInput = screen.getByPlaceholderText('DELETE MY ACCOUNT');
      fireEvent.change(confirmationInput, { target: { value: 'wrong text' } });
      
      // Try to click confirm deletion (should be disabled)
      const confirmButton = screen.getByText('Confirm Deletion');
      expect(confirmButton).toBeDisabled();
    });

    it('should handle deletion requirements not met', async () => {
      // Mock deletion info with unmet requirements
      const restrictedDeletionInfo = {
        ...mockDeletionInfo,
        canDelete: false,
        requirements: [
          {
            requirement: 'No pending bookings',
            met: false,
            description: 'You have pending bookings that must be completed first'
          }
        ]
      };
      
      mockFetch.mockImplementation((url: string | URL | Request) => {
        const urlString = url.toString();
        
        if (urlString.includes('/api/profile/delete-account')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(restrictedDeletionInfo)
          } as Response);
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockExportInfo)
        } as Response);
      });

      render(<PrivacyControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Delete My Account')).toBeInTheDocument();
      });
      
      // Check that delete button is disabled
      const deleteButton = screen.getByText('Delete My Account');
      expect(deleteButton).toBeDisabled();
      
      // Check unmet requirement is shown
      expect(screen.getByText('No pending bookings')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Server error' })
        } as Response);
      });

      render(<PrivacyControls />);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to load privacy settings');
      });
    });

    it('should handle network errors', async () => {
      // Mock network error
      mockFetch.mockImplementation(() => {
        return Promise.reject(new Error('Network error'));
      });

      render(<PrivacyControls />);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to load privacy settings');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<PrivacyControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Privacy Controls')).toBeInTheDocument();
      });
      
      // Check for proper heading structure
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Privacy Controls');
      
      // Check for button accessibility
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Check for proper form elements
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      render(<PrivacyControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Download ZIP')).toBeInTheDocument();
      });
      
      // Test tab navigation
      const downloadButton = screen.getByText('Download ZIP');
      downloadButton.focus();
      expect(document.activeElement).toBe(downloadButton);
    });
  });
});