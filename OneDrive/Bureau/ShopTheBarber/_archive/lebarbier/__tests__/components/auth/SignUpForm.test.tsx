import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useSignUp } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock the hooks
jest.mock('@clerk/nextjs');
jest.mock('next/navigation');

const mockUseSignUp = useSignUp as jest.MockedFunction<typeof useSignUp>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

describe('SignUpForm', () => {
  const mockPush = jest.fn();
  const mockSignUpCreate = jest.fn();
  const mockAttemptEmailVerification = jest.fn();
  const mockSignUpUpdate = jest.fn();

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

    mockUseSearchParams.mockReturnValue(new URLSearchParams());

    mockUseSignUp.mockReturnValue({
      isLoaded: true,
      signUp: {
        create: mockSignUpCreate,
        attemptEmailAddressVerification: mockAttemptEmailVerification,
        update: mockSignUpUpdate,
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

  it('renders the sign-up form correctly', () => {
    render(<SignUpForm />);
    
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation errors for invalid inputs', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    
    const phoneInput = screen.getByLabelText(/phone/i);
    await user.type(phoneInput, '123');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
    });
  });

  it('shows password strength indicator', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    
    // Test weak password
    await user.type(passwordInput, 'weak');
    expect(screen.getByText(/weak/i)).toBeInTheDocument();
    
    // Test medium password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Medium123');
    expect(screen.getByText(/medium/i)).toBeInTheDocument();
    
    // Test strong password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Strong123!');
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('handles successful sign-up', async () => {
    const user = userEvent.setup();
    
    mockSignUpCreate.mockResolvedValue({
      status: 'missing_requirements',
      unverifiedFields: ['email_address'],
    });
    
    render(<SignUpForm />);
    
    // Fill out the form
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');
    await user.type(screen.getByLabelText(/password/i), 'StrongPassword123!');
    await user.selectOptions(screen.getByLabelText(/role/i), 'client');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
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
  });

  it('handles email verification step', async () => {
    const user = userEvent.setup();
    
    // Mock sign-up creation that requires email verification
    mockSignUpCreate.mockResolvedValue({
      status: 'missing_requirements',
      unverifiedFields: ['email_address'],
    });
    
    render(<SignUpForm />);
    
    // Fill out and submit the form
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');
    await user.type(screen.getByLabelText(/password/i), 'StrongPassword123!');
    await user.selectOptions(screen.getByLabelText(/role/i), 'client');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    // Should show verification step
    await waitFor(() => {
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });
  });

  it('handles email verification completion', async () => {
    const user = userEvent.setup();
    
    // Mock successful verification
    mockAttemptEmailVerification.mockResolvedValue({
      status: 'complete',
      createdSessionId: 'session_123',
    });
    
    // Start with verification step
    mockUseSignUp.mockReturnValue({
      isLoaded: true,
      signUp: {
        create: mockSignUpCreate,
        attemptEmailAddressVerification: mockAttemptEmailVerification,
        update: mockSignUpUpdate,
        status: 'missing_requirements',
        unverifiedFields: ['email_address'],
        createdUserId: null,
        emailAddress: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        username: null,
        hasPassword: true,
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
    
    render(<SignUpForm />);
    
    // Should show verification form
    expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    
    // Enter verification code
    const codeInput = screen.getByLabelText(/verification code/i);
    await user.type(codeInput, '123456');
    
    const verifyButton = screen.getByRole('button', { name: /verify email/i });
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(mockAttemptEmailVerification).toHaveBeenCalledWith({
        code: '123456',
      });
    });
  });

  it('handles sign-up errors', async () => {
    const user = userEvent.setup();
    
    mockSignUpCreate.mockRejectedValue({
      errors: [{ message: 'Email already exists' }],
    });
    
    render(<SignUpForm />);
    
    // Fill out the form
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');
    await user.type(screen.getByLabelText(/password/i), 'StrongPassword123!');
    await user.selectOptions(screen.getByLabelText(/role/i), 'client');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('sets role from URL parameter', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('?role=barber'));
    
    render(<SignUpForm />);
    
    const roleSelect = screen.getByLabelText(/role/i) as HTMLSelectElement;
    expect(roleSelect.value).toBe('barber');
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    mockSignUpCreate.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    render(<SignUpForm />);
    
    // Fill out the form
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');
    await user.type(screen.getByLabelText(/password/i), 'StrongPassword123!');
    await user.selectOptions(screen.getByLabelText(/role/i), 'client');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    // Should show loading state
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});