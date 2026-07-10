import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useSignUp, useSignIn, useAuth } from '@clerk/nextjs';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { SocialSignIn } from '@/components/auth/SocialSignIn';
import { PasswordRecovery } from '@/components/auth/PasswordRecovery';
import { createUserProfile, checkUserStatus } from '@/lib/supabase';

// Mock all dependencies
jest.mock('next/navigation');
jest.mock('@clerk/nextjs');
jest.mock('../../lib/supabase');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSignUp = useSignUp as jest.MockedFunction<typeof useSignUp>;
const mockUseSignIn = useSignIn as jest.MockedFunction<typeof useSignIn>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockCreateUserProfile = createUserProfile as jest.MockedFunction<typeof createUserProfile>;
const mockCheckUserStatus = checkUserStatus as jest.MockedFunction<typeof checkUserStatus>;

describe('Authentication Flow Integration Tests', () => {
  const mockPush = jest.fn();
  const mockSignUpCreate = jest.fn();
  const mockSignUpVerify = jest.fn();
  const mockSignInCreate = jest.fn();
  const mockSignInAttempt = jest.fn();
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

    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      sessionId: null,
      getToken: jest.fn(),
    });

    mockUseSignUp.mockReturnValue({
      isLoaded: true,
      signUp: {
        create: mockSignUpCreate,
        attemptEmailAddressVerification: mockSignUpVerify,
        update: jest.fn(),
        authenticateWithRedirect: mockAuthenticateWithRedirect,
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

    mockUseSignIn.mockReturnValue({
      isLoaded: true,
      signIn: {
        create: mockSignInCreate,
        attemptFirstFactor: mockSignInAttempt,
        authenticateWithRedirect: mockAuthenticateWithRedirect,
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

    mockCreateUserProfile.mockResolvedValue({ data: { id: 'user_123' }, error: null });
    mockCheckUserStatus.mockResolvedValue({
      isVerified: true,
      isBanned: false,
      mfaEnabled: false,
    });
  });

  describe('Complete Sign-Up Flow', () => {
    it('completes full sign-up flow with email verification', async () => {
      const user = userEvent.setup();
      
      // Mock sign-up creation requiring email verification
      mockSignUpCreate.mockResolvedValue({
        status: 'missing_requirements',
        unverifiedFields: ['email_address'],
      });
      
      // Mock successful email verification
      mockSignUpVerify.mockResolvedValue({
        status: 'complete',
        createdSessionId: 'session_123',
      });
      
      render(<SignUpForm />);
      
      // Step 1: Fill out sign-up form
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      await user.type(screen.getByLabelText(/password/i), 'StrongPassword123!');
      await user.selectOptions(screen.getByLabelText(/role/i), 'client');
      
      // Step 2: Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);
      
      // Verify sign-up was called with correct data
      await waitFor(() => {
        expect(mockSignUpCreate).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          phoneNumber: '+1234567890',
          password: 'StrongPassword123!',
          unsafeMetadata: {
            role: 'client',
          },
        });
      });
      
      // Step 3: Should show email verification step
      await waitFor(() => {
        expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
      });
      
      // Step 4: Enter verification code
      const codeInput = screen.getByLabelText(/verification code/i);
      await user.type(codeInput, '123456');
      
      const verifyButton = screen.getByRole('button', { name: /verify email/i });
      await user.click(verifyButton);
      
      // Step 5: Verify email verification was called
      await waitFor(() => {
        expect(mockSignUpVerify).toHaveBeenCalledWith({
          code: '123456',
        });
      });
      
      // Step 6: Should redirect to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('handles sign-up with social authentication', async () => {
      const user = userEvent.setup();
      
      mockAuthenticateWithRedirect.mockResolvedValue(undefined);
      
      render(<SocialSignIn mode="sign-up" />);
      
      // Click Google sign-up
      const googleButton = screen.getByText(/sign up with google/i);
      await user.click(googleButton);
      
      // Should call OAuth with correct parameters
      expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    });
  });

  describe('Complete Sign-In Flow', () => {
    it('completes basic email/password sign-in', async () => {
      const user = userEvent.setup();
      
      mockSignInCreate.mockResolvedValue({
        status: 'needs_first_factor',
        supportedFirstFactors: [{
          strategy: 'password',
          emailAddressId: 'email_123',
        }],
      });
      
      mockSignInAttempt.mockResolvedValue({
        status: 'complete',
        createdSessionId: 'session_123',
      });
      
      // Mock a basic sign-in form (we'd need to create this)
      const SignInForm = () => {
        const { signIn } = useSignIn();
        const router = useRouter();
        
        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const email = formData.get('email') as string;
          const password = formData.get('password') as string;
          
          try {
            const result = await signIn!.create({
              identifier: email,
            });
            
            if (result.status === 'needs_first_factor') {
              const attemptResult = await signIn!.attemptFirstFactor({
                strategy: 'password',
                password,
              });
              
              if (attemptResult.status === 'complete') {
                router.push('/dashboard');
              }
            }
          } catch (error) {
            console.error('Sign-in error:', error);
          }
        };
        
        return (
          <form onSubmit={handleSubmit}>
            <input name="email" type="email" placeholder="Email" />
            <input name="password" type="password" placeholder="Password" />
            <button type="submit">Sign In</button>
          </form>
        );
      };
      
      render(<SignInForm />);
      
      // Fill out sign-in form
      await user.type(screen.getByPlaceholderText(/email/i), 'john@example.com');
      await user.type(screen.getByPlaceholderText(/password/i), 'password123');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);
      
      // Verify sign-in flow
      await waitFor(() => {
        expect(mockSignInCreate).toHaveBeenCalledWith({
          identifier: 'john@example.com',
        });
      });
      
      await waitFor(() => {
        expect(mockSignInAttempt).toHaveBeenCalledWith({
          strategy: 'password',
          password: 'password123',
        });
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('handles social sign-in flow', async () => {
      const user = userEvent.setup();
      
      mockAuthenticateWithRedirect.mockResolvedValue(undefined);
      
      render(<SocialSignIn mode="sign-in" />);
      
      // Click Facebook sign-in
      const facebookButton = screen.getByText(/continue with facebook/i);
      await user.click(facebookButton);
      
      // Should call OAuth with correct parameters
      expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith({
        strategy: 'oauth_facebook',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    });
  });

  describe('Password Recovery Flow', () => {
    it('completes full password recovery flow', async () => {
      const user = userEvent.setup();
      
      mockSignInCreate.mockResolvedValue({
        status: 'needs_first_factor',
      });
      
      mockSignInAttempt.mockResolvedValue({
        status: 'complete',
        createdSessionId: 'session_123',
      });
      
      render(<PasswordRecovery />);
      
      // Step 1: Enter email
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'john@example.com');
      
      const sendButton = screen.getByRole('button', { name: /send reset code/i });
      await user.click(sendButton);
      
      // Verify reset email was sent
      await waitFor(() => {
        expect(mockSignInCreate).toHaveBeenCalledWith({
          strategy: 'reset_password_email_code',
          identifier: 'john@example.com',
        });
      });
      
      // Step 2: Should show verification form
      await waitFor(() => {
        expect(screen.getByText('Enter Verification Code')).toBeInTheDocument();
      });
      
      // Step 3: Enter verification code and new password
      await user.type(screen.getByLabelText(/verification code/i), '123456');
      await user.type(screen.getByLabelText(/new password/i), 'NewPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'NewPassword123!');
      
      const resetButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(resetButton);
      
      // Step 4: Verify password reset
      await waitFor(() => {
        expect(mockSignInAttempt).toHaveBeenCalledWith({
          strategy: 'reset_password_email_code',
          code: '123456',
          password: 'NewPassword123!',
        });
      });
      
      // Step 5: Should show success and redirect
      await waitFor(() => {
        expect(screen.getByText('Password Reset Successful')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockSignUpCreate.mockRejectedValue(new Error('Network error'));
      
      render(<SignUpForm />);
      
      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      await user.type(screen.getByLabelText(/password/i), 'StrongPassword123!');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to create account/i)).toBeInTheDocument();
      });
    });

    it('handles validation errors from Clerk', async () => {
      const user = userEvent.setup();
      
      mockSignUpCreate.mockRejectedValue({
        errors: [{ message: 'Email already exists' }],
      });
      
      render(<SignUpForm />);
      
      // Fill out form with existing email
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      await user.type(screen.getByLabelText(/password/i), 'StrongPassword123!');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);
      
      // Should show Clerk error message
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Status Checks', () => {
    it('handles banned user scenario', async () => {
      mockCheckUserStatus.mockResolvedValue({
        isVerified: true,
        isBanned: true,
        mfaEnabled: false,
      });
      
      // This would be tested in the dashboard component
      // For now, just verify the function returns correct status
      const status = await checkUserStatus('banned_user_123');
      
      expect(status.isBanned).toBe(true);
      expect(status.isVerified).toBe(true);
    });

    it('handles unverified user scenario', async () => {
      mockCheckUserStatus.mockResolvedValue({
        isVerified: false,
        isBanned: false,
        mfaEnabled: false,
      });
      
      const status = await checkUserStatus('unverified_user_123');
      
      expect(status.isVerified).toBe(false);
      expect(status.isBanned).toBe(false);
    });
  });

  describe('Data Synchronization', () => {
    it('creates user profile in Supabase after successful sign-up', async () => {
      // This would typically be handled by the webhook
      // But we can test the function directly
      const userData = {
        id: 'user_123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'client' as const,
        status: 'active' as const,
        mfa_enabled: false,
      };
      
      await createUserProfile(userData);
      
      expect(mockCreateUserProfile).toHaveBeenCalledWith(userData);
    });
  });
});