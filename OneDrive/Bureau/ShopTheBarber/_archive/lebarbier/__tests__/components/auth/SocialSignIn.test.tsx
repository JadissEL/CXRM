import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialSignIn } from '@/components/auth/SocialSignIn';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// Mock the hooks
jest.mock('@clerk/nextjs');
jest.mock('next/navigation');

const mockUseSignIn = useSignIn as jest.MockedFunction<typeof useSignIn>;
const mockUseSignUp = useSignUp as jest.MockedFunction<typeof useSignUp>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('SocialSignIn', () => {
  const mockPush = jest.fn();
  const mockAuthenticateWithRedirect = jest.fn();

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

    mockUseSignIn.mockReturnValue({
      isLoaded: true,
      signIn: {
        authenticateWithRedirect: mockAuthenticateWithRedirect,
        create: jest.fn(),
        attemptFirstFactor: jest.fn(),
        status: null,
        supportedFirstFactors: [],
        supportedSecondFactors: [],
        identifier: null,
        createdSessionId: null,
        firstFactorVerification: null,
        secondFactorVerification: null,
        userData: null,
      },
      setActive: jest.fn(),
    });

    mockUseSignUp.mockReturnValue({
      isLoaded: true,
      signUp: {
        authenticateWithRedirect: mockAuthenticateWithRedirect,
        create: jest.fn(),
        attemptEmailAddressVerification: jest.fn(),
        update: jest.fn(),
        status: null,
        createdUserId: null,
        emailAddress: null,
        firstName: null,
        lastName: null,
        phoneNumber: null,
        username: null,
        hasPassword: false,
        unverifiedFields: [],
        verifications: {
          emailAddress: { status: 'unverified', strategy: 'email_code' },
          phoneNumber: { status: 'unverified', strategy: 'phone_code' },
        },
        prepareEmailAddressVerification: jest.fn(),
        preparePhoneNumberVerification: jest.fn(),
        attemptPhoneNumberVerification: jest.fn(),
      },
      setActive: jest.fn(),
    });
  });

  it('renders social sign-in buttons for sign-in mode', () => {
    render(<SocialSignIn mode="sign-in" />);
    
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with facebook/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with apple/i)).toBeInTheDocument();
  });

  it('renders social sign-up buttons for sign-up mode', () => {
    render(<SocialSignIn mode="sign-up" />);
    
    expect(screen.getByText(/sign up with google/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up with facebook/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up with apple/i)).toBeInTheDocument();
  });

  it('handles Google sign-in', async () => {
    const user = userEvent.setup();
    render(<SocialSignIn mode="sign-in" />);
    
    const googleButton = screen.getByText(/continue with google/i);
    await user.click(googleButton);
    
    expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    });
  });

  it('handles Facebook sign-in', async () => {
    const user = userEvent.setup();
    render(<SocialSignIn mode="sign-in" />);
    
    const facebookButton = screen.getByText(/continue with facebook/i);
    await user.click(facebookButton);
    
    expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith({
      strategy: 'oauth_facebook',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    });
  });

  it('handles Apple sign-in', async () => {
    const user = userEvent.setup();
    render(<SocialSignIn mode="sign-in" />);
    
    const appleButton = screen.getByText(/continue with apple/i);
    await user.click(appleButton);
    
    expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith({
      strategy: 'oauth_apple',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    });
  });

  it('handles Google sign-up', async () => {
    const user = userEvent.setup();
    render(<SocialSignIn mode="sign-up" />);
    
    const googleButton = screen.getByText(/sign up with google/i);
    await user.click(googleButton);
    
    expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    });
  });

  it('shows loading state during authentication', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    mockAuthenticateWithRedirect.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    render(<SocialSignIn mode="sign-in" />);
    
    const googleButton = screen.getByText(/continue with google/i);
    await user.click(googleButton);
    
    // Should show loading state
    expect(screen.getByTestId('google-loading')).toBeInTheDocument();
    expect(googleButton.closest('button')).toBeDisabled();
  });

  it('handles authentication errors', async () => {
    const user = userEvent.setup();
    
    mockAuthenticateWithRedirect.mockRejectedValue({
      errors: [{ message: 'OAuth provider error' }],
    });
    
    render(<SocialSignIn mode="sign-in" />);
    
    const googleButton = screen.getByText(/continue with google/i);
    await user.click(googleButton);
    
    await waitFor(() => {
      expect(screen.getByText(/oauth provider error/i)).toBeInTheDocument();
    });
  });

  it('handles generic authentication errors', async () => {
    const user = userEvent.setup();
    
    mockAuthenticateWithRedirect.mockRejectedValue(new Error('Network error'));
    
    render(<SocialSignIn mode="sign-in" />);
    
    const googleButton = screen.getByText(/continue with google/i);
    await user.click(googleButton);
    
    await waitFor(() => {
      expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
    });
  });

  it('disables all buttons when one is loading', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    mockAuthenticateWithRedirect.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    render(<SocialSignIn mode="sign-in" />);
    
    const googleButton = screen.getByText(/continue with google/i);
    await user.click(googleButton);
    
    // All buttons should be disabled
    expect(googleButton.closest('button')).toBeDisabled();
    expect(screen.getByText(/continue with facebook/i).closest('button')).toBeDisabled();
    expect(screen.getByText(/continue with apple/i).closest('button')).toBeDisabled();
  });

  it('clears error when starting new authentication', async () => {
    const user = userEvent.setup();
    
    // First, cause an error
    mockAuthenticateWithRedirect.mockRejectedValueOnce({
      errors: [{ message: 'OAuth provider error' }],
    });
    
    render(<SocialSignIn mode="sign-in" />);
    
    const googleButton = screen.getByText(/continue with google/i);
    await user.click(googleButton);
    
    await waitFor(() => {
      expect(screen.getByText(/oauth provider error/i)).toBeInTheDocument();
    });
    
    // Now try Facebook - error should be cleared
    mockAuthenticateWithRedirect.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    const facebookButton = screen.getByText(/continue with facebook/i);
    await user.click(facebookButton);
    
    expect(screen.queryByText(/oauth provider error/i)).not.toBeInTheDocument();
  });

  it('shows correct button text for different modes', () => {
    const { rerender } = render(<SocialSignIn mode="sign-in" />);
    
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with facebook/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with apple/i)).toBeInTheDocument();
    
    rerender(<SocialSignIn mode="sign-up" />);
    
    expect(screen.getByText(/sign up with google/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up with facebook/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up with apple/i)).toBeInTheDocument();
  });

  it('handles when Clerk is not loaded', () => {
    mockUseSignIn.mockReturnValue({
      isLoaded: false,
      signIn: null as any,
      setActive: jest.fn(),
    });
    
    mockUseSignUp.mockReturnValue({
      isLoaded: false,
      signUp: null as any,
      setActive: jest.fn(),
    });
    
    render(<SocialSignIn mode="sign-in" />);
    
    // Buttons should be disabled when not loaded
    expect(screen.getByText(/continue with google/i).closest('button')).toBeDisabled();
    expect(screen.getByText(/continue with facebook/i).closest('button')).toBeDisabled();
    expect(screen.getByText(/continue with apple/i).closest('button')).toBeDisabled();
  });
});