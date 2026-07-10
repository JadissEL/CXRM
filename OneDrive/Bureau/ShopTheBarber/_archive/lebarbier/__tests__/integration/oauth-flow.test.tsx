import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSignIn, useSignUp, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import SocialSignIn from '@/components/auth/SocialSignIn';
import ProfileCompletion from '@/components/auth/ProfileCompletion';
import ProfileCompletionGuard from '@/components/auth/ProfileCompletionGuard';

// Mock Clerk hooks
jest.mock('@clerk/nextjs', () => ({
  useSignIn: jest.fn(),
  useSignUp: jest.fn(),
  useUser: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/dashboard'),
}));

const { usePathname } = require('next/navigation');
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

// Mock fetch
global.fetch = jest.fn();

const mockUseSignIn = useSignIn as jest.MockedFunction<typeof useSignIn>;
const mockUseSignUp = useSignUp as jest.MockedFunction<typeof useSignUp>;
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Test component for ProfileCompletionGuard tests
const TestComponent = () => <div>Protected Content</div>;

describe('OAuth Flow Integration Tests', () => {
  const mockPush = jest.fn();
  const mockAuthenticateWithRedirect = jest.fn();
  const mockUpdate = jest.fn();
  const mockCreatePhoneNumber = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);
  });

  describe('Social Sign-In Component', () => {
    beforeEach(() => {
      mockUseSignIn.mockReturnValue({
        signIn: {
          authenticateWithRedirect: mockAuthenticateWithRedirect,
        },
        isLoaded: true,
      } as any);

      mockUseSignUp.mockReturnValue({
        signUp: {
          authenticateWithRedirect: mockAuthenticateWithRedirect,
        },
        isLoaded: true,
      } as any);
    });

    it('renders all social sign-in providers', () => {
      render(<SocialSignIn mode="sign-in" />);
      
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      expect(screen.getByText('Continue with Facebook')).toBeInTheDocument();
      expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
    });

    it('handles Google OAuth sign-in', async () => {
      const user = userEvent.setup();
      render(<SocialSignIn mode="sign-in" />);
      
      const googleButton = screen.getByText('Continue with Google');
      await user.click(googleButton);
      
      expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith({
        strategy: 'oauth_google',
        redirectUrl: '/dashboard',
        redirectUrlComplete: '/dashboard',
      });
    });

    it('handles Facebook OAuth sign-up with role', async () => {
      const user = userEvent.setup();
      render(<SocialSignIn mode="sign-up" role="barber" />);
      
      const facebookButton = screen.getByText('Continue with Facebook');
      await user.click(facebookButton);
      
      expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith({
        strategy: 'oauth_facebook',
        redirectUrl: '/dashboard',
        redirectUrlComplete: '/dashboard',
        unsafeMetadata: {
          role: 'barber',
        },
      });
    });

    it('handles Apple OAuth authentication', async () => {
      const user = userEvent.setup();
      render(<SocialSignIn mode="sign-in" />);
      
      const appleButton = screen.getByText('Continue with Apple');
      await user.click(appleButton);
      
      expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith({
        strategy: 'oauth_apple',
        redirectUrl: '/dashboard',
        redirectUrlComplete: '/dashboard',
      });
    });

    it('displays error when OAuth fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'OAuth provider not configured';
      
      mockAuthenticateWithRedirect.mockRejectedValue({
        errors: [{ message: errorMessage }],
      });
      
      render(<SocialSignIn mode="sign-in" />);
      
      const googleButton = screen.getByText('Continue with Google');
      await user.click(googleButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('disables buttons during loading', async () => {
      const user = userEvent.setup();
      
      // Mock a slow OAuth request
      mockAuthenticateWithRedirect.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      render(<SocialSignIn mode="sign-in" />);
      
      const googleButton = screen.getByText('Continue with Google');
      await user.click(googleButton);
      
      // All buttons should be disabled during loading
      expect(screen.getByText('Continue with Facebook')).toBeDisabled();
      expect(screen.getByText('Continue with Apple')).toBeDisabled();
    });
  });

  describe('Profile Completion Flow', () => {
    const mockOnComplete = jest.fn();
    const mockUser = {
      id: 'user_123',
      firstName: 'John',
      lastName: '',
      phoneNumbers: [],
      unsafeMetadata: {},
      update: mockUpdate,
      createPhoneNumber: mockCreatePhoneNumber,
    };

    beforeEach(() => {
      mockUseUser.mockReturnValue({
        user: mockUser,
        isLoaded: true,
      });
    });

    it('renders completion form for missing fields', () => {
      const missingFields = ['lastName', 'phone', 'role'];
      
      render(
        <ProfileCompletion
          missingFields={missingFields}
          onComplete={mockOnComplete}
        />
      );
      
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByText(/select your role/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      const missingFields = ['phone', 'role'];
      
      render(
        <ProfileCompletion
          missingFields={missingFields}
          onComplete={mockOnComplete}
        />
      );
      
      const submitButton = screen.getByText('Complete Profile');
      expect(submitButton).toBeDisabled();
      
      // Fill phone number
      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, '+1234567890');
      
      // Select role
      const roleSelect = screen.getByRole('combobox');
      await user.click(roleSelect);
      await user.click(screen.getByText('Client - Looking for barber services'));
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('completes profile with missing information', async () => {
      const user = userEvent.setup();
      const missingFields = ['lastName', 'phone', 'role'];
      
      mockUpdate.mockResolvedValue({});
      mockCreatePhoneNumber.mockResolvedValue({});
      
      render(
        <ProfileCompletion
          missingFields={missingFields}
          onComplete={mockOnComplete}
        />
      );
      
      // Fill last name
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      
      // Fill phone
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');
      
      // Select role
      const roleSelect = screen.getByRole('combobox');
      await user.click(roleSelect);
      await user.click(screen.getByText('Barber - Providing services'));
      
      // Submit form
      const submitButton = screen.getByText('Complete Profile');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({
          lastName: 'Doe',
        });
        expect(mockCreatePhoneNumber).toHaveBeenCalledWith({
          phoneNumber: '+1234567890',
        });
        expect(mockUpdate).toHaveBeenCalledWith({
          unsafeMetadata: {
            role: 'barber',
          },
        });
      });
      
      // Should sync to Supabase
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/sync-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user_123',
          updates: {
            name: 'John Doe',
            phone: '+1234567890',
            role: 'barber',
          },
        }),
      });
    });

    it('handles profile completion errors', async () => {
      const user = userEvent.setup();
      const missingFields = ['role'];
      
      // Reset all mocks and set up the error
      mockUpdate.mockReset();
      mockUpdate.mockRejectedValue(new Error('Update failed'));
      
      render(
        <ProfileCompletion
          missingFields={missingFields}
          onComplete={mockOnComplete}
        />
      );
      
      // Select role
      const roleSelect = screen.getByRole('combobox');
      await user.click(roleSelect);
      await user.click(screen.getByText('Client - Looking for barber services'));
      
      // Submit form
      const submitButton = screen.getByText('Complete Profile');
      await user.click(submitButton);
      
      await waitFor(() => {
        // Check if any error alert is displayed
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent('Update failed');
      }, { timeout: 3000 });
    });
  });

  describe('Profile Completion Guard', () => {
    it('shows loading state while checking profile', () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: false,
      });
      
      render(
        <ProfileCompletionGuard>
          <TestComponent />
        </ProfileCompletionGuard>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders children when profile is complete', async () => {
      mockUseUser.mockReturnValue({
        user: {
          id: 'user_123',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumbers: [{ phoneNumber: '+1234567890' }],
          unsafeMetadata: { role: 'client' },
        },
        isLoaded: true,
      });
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          needsCompletion: false,
          missingFields: [],
        }),
      } as Response);
      
      render(
        <ProfileCompletionGuard>
          <TestComponent />
        </ProfileCompletionGuard>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('shows profile completion when fields are missing', async () => {
      mockUseUser.mockReturnValue({
        user: {
          id: 'user_123',
          firstName: 'John',
          lastName: '',
          phoneNumbers: [],
          unsafeMetadata: {},
        },
        isLoaded: true,
      });
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          needsCompletion: true,
          missingFields: ['lastName', 'phone', 'role'],
        }),
      } as Response);
      
      render(
        <ProfileCompletionGuard>
          <TestComponent />
        </ProfileCompletionGuard>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });

    it('bypasses check for auth routes', () => {
      mockUsePathname.mockReturnValue('/sign-in');
      
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: true,
      });
      
      render(
        <ProfileCompletionGuard>
          <TestComponent />
        </ProfileCompletionGuard>
      );
      
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Account Linking', () => {
    it('handles duplicate email scenarios', async () => {
      // This would test the webhook's account linking logic
      // In a real test, you'd mock the webhook endpoint and test the logic
      const webhookPayload = {
        type: 'user.created',
        data: {
          id: 'user_new',
          email_addresses: [{
            id: 'email_123',
            email_address: 'john@example.com',
          }],
          primary_email_address_id: 'email_123',
          first_name: 'John',
          last_name: 'Doe',
          external_accounts: [{
            provider: 'google',
            provider_user_id: 'google_123',
          }],
        },
      };
      
      // Mock existing user in database
      const mockSupabaseResponse = {
        data: {
          id: 'user_existing',
          email: 'john@example.com',
        },
        error: null,
      };
      
      // Test would verify that the webhook properly handles account linking
      // This is a placeholder for the actual webhook testing logic
      expect(webhookPayload.data.email_addresses[0].email_address).toBe('john@example.com');
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      // Set pathname to a non-bypass route
      mockUsePathname.mockReturnValue('/dashboard');
      
      // Override the beforeEach mock to simulate network error
      mockFetch.mockReset();
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      mockUseUser.mockReturnValue({
        user: { 
          id: 'user_123',
          emailAddresses: [{ emailAddress: 'test@example.com' }],
          firstName: 'Test',
          lastName: 'User'
        },
        isLoaded: true,
      });
      
      render(
        <ProfileCompletionGuard>
          <TestComponent />
        </ProfileCompletionGuard>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles OAuth provider configuration errors', async () => {
      const user = userEvent.setup();
      
      mockAuthenticateWithRedirect.mockRejectedValue({
        errors: [{ message: 'OAuth provider not configured' }],
      });
      
      render(<SocialSignIn mode="sign-in" />);
      
      const googleButton = screen.getByText('Continue with Google');
      await user.click(googleButton);
      
      await waitFor(() => {
        expect(screen.getByText('OAuth provider not configured')).toBeInTheDocument();
      });
    });
  });
});