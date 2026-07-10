import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordRecovery } from '@/components/auth/PasswordRecovery';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// Mock the hooks
jest.mock('@clerk/nextjs');
jest.mock('next/navigation');

const mockUseSignIn = useSignIn as jest.MockedFunction<typeof useSignIn>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('PasswordRecovery', () => {
  const mockPush = jest.fn();
  const mockSignInCreate = jest.fn();
  const mockAttemptFirstFactor = jest.fn();

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
        create: mockSignInCreate,
        attemptFirstFactor: mockAttemptFirstFactor,
        authenticateWithRedirect: jest.fn(),
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
  });

  it('renders the email step initially', () => {
    render(<PasswordRecovery />);
    
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByText(/enter your email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset code/i })).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<PasswordRecovery />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /send reset code/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('handles successful email submission', async () => {
    const user = userEvent.setup();
    
    mockSignInCreate.mockResolvedValue({
      status: 'needs_first_factor',
    });
    
    render(<PasswordRecovery />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: /send reset code/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignInCreate).toHaveBeenCalledWith({
        strategy: 'reset_password_email_code',
        identifier: 'test@example.com',
      });
    });
    
    // Should move to verification step
    await waitFor(() => {
      expect(screen.getByText('Enter Verification Code')).toBeInTheDocument();
      expect(screen.getByText(/we sent a verification code to test@example.com/i)).toBeInTheDocument();
    });
  });

  it('handles email submission errors', async () => {
    const user = userEvent.setup();
    
    mockSignInCreate.mockRejectedValue({
      errors: [{ message: 'Email not found' }],
    });
    
    render(<PasswordRecovery />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: /send reset code/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email not found/i)).toBeInTheDocument();
    });
  });

  it('renders verification step after email submission', async () => {
    const user = userEvent.setup();
    
    mockSignInCreate.mockResolvedValue({
      status: 'needs_first_factor',
    });
    
    render(<PasswordRecovery />);
    
    // Submit email
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: /send reset code/i });
    await user.click(submitButton);
    
    // Should show verification form
    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resend code/i })).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    const user = userEvent.setup();
    
    // Start at verification step
    mockSignInCreate.mockResolvedValue({ status: 'needs_first_factor' });
    
    render(<PasswordRecovery />);
    
    // Submit email first
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));
    
    // Now in verification step
    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });
    
    // Fill form with mismatched passwords
    await user.type(screen.getByLabelText(/verification code/i), '123456');
    await user.type(screen.getByLabelText(/new password/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different123');
    
    const resetButton = screen.getByRole('button', { name: /reset password/i });
    await user.click(resetButton);
    
    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('handles successful password reset', async () => {
    const user = userEvent.setup();
    
    // Mock successful email submission
    mockSignInCreate.mockResolvedValue({ status: 'needs_first_factor' });
    
    // Mock successful password reset
    mockAttemptFirstFactor.mockResolvedValue({
      status: 'complete',
      createdSessionId: 'session_123',
    });
    
    render(<PasswordRecovery />);
    
    // Submit email
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));
    
    // Fill verification form
    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });
    
    await user.type(screen.getByLabelText(/verification code/i), '123456');
    await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123');
    
    const resetButton = screen.getByRole('button', { name: /reset password/i });
    await user.click(resetButton);
    
    await waitFor(() => {
      expect(mockAttemptFirstFactor).toHaveBeenCalledWith({
        strategy: 'reset_password_email_code',
        code: '123456',
        password: 'newpassword123',
      });
    });
    
    // Should show success step
    await waitFor(() => {
      expect(screen.getByText('Password Reset Successful')).toBeInTheDocument();
      expect(screen.getByText(/redirecting to dashboard/i)).toBeInTheDocument();
    });
  });

  it('handles password reset errors', async () => {
    const user = userEvent.setup();
    
    // Mock successful email submission
    mockSignInCreate.mockResolvedValue({ status: 'needs_first_factor' });
    
    // Mock failed password reset
    mockAttemptFirstFactor.mockRejectedValue({
      errors: [{ message: 'Invalid verification code' }],
    });
    
    render(<PasswordRecovery />);
    
    // Submit email
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));
    
    // Fill verification form
    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });
    
    await user.type(screen.getByLabelText(/verification code/i), '123456');
    await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123');
    
    const resetButton = screen.getByRole('button', { name: /reset password/i });
    await user.click(resetButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid verification code/i)).toBeInTheDocument();
    });
  });

  it('handles resend code functionality', async () => {
    const user = userEvent.setup();
    
    // Mock successful email submission
    mockSignInCreate.mockResolvedValue({ status: 'needs_first_factor' });
    
    render(<PasswordRecovery />);
    
    // Submit email
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));
    
    // Should be in verification step
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resend code/i })).toBeInTheDocument();
    });
    
    // Click resend
    const resendButton = screen.getByRole('button', { name: /resend code/i });
    await user.click(resendButton);
    
    await waitFor(() => {
      expect(mockSignInCreate).toHaveBeenCalledTimes(2);
      expect(mockSignInCreate).toHaveBeenLastCalledWith({
        strategy: 'reset_password_email_code',
        identifier: 'test@example.com',
      });
    });
  });

  it('shows loading states', async () => {
    const user = userEvent.setup();
    
    // Mock delayed response
    mockSignInCreate.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    render(<PasswordRecovery />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: /send reset code/i });
    await user.click(submitButton);
    
    // Should show loading state
    expect(screen.getByText(/sending/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('redirects to dashboard after successful reset', async () => {
    const user = userEvent.setup();
    
    // Mock successful flows
    mockSignInCreate.mockResolvedValue({ status: 'needs_first_factor' });
    mockAttemptFirstFactor.mockResolvedValue({
      status: 'complete',
      createdSessionId: 'session_123',
    });
    
    // Mock setTimeout to execute immediately
    jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
      fn();
      return 0 as any;
    });
    
    render(<PasswordRecovery />);
    
    // Complete the flow
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });
    
    await user.type(screen.getByLabelText(/verification code/i), '123456');
    await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpassword123');
    
    const resetButton = screen.getByRole('button', { name: /reset password/i });
    await user.click(resetButton);
    
    await waitFor(() => {
      expect(screen.getByText('Password Reset Successful')).toBeInTheDocument();
    });
    
    // Should redirect to dashboard
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    
    // Restore setTimeout
    jest.restoreAllMocks();
  });

  it('shows back to sign in link', () => {
    render(<PasswordRecovery />);
    
    const backLink = screen.getByText(/back to sign in/i);
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/sign-in');
  });

  it('handles when Clerk is not loaded', () => {
    mockUseSignIn.mockReturnValue({
      isLoaded: false,
      signIn: null as any,
      setActive: jest.fn(),
    });
    
    render(<PasswordRecovery />);
    
    // Should show loading spinner
    expect(screen.getByTestId('loading-spinner') || screen.getByRole('status')).toBeInTheDocument();
  });
});