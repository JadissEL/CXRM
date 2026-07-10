import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    sessionId: null,
    getToken: jest.fn(),
  })),
  useUser: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: false,
    user: null,
  })),
  useSignIn: jest.fn(() => ({
    isLoaded: true,
    signIn: {
      create: jest.fn(),
      attemptFirstFactor: jest.fn(),
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
  })),
  useSignUp: jest.fn(() => ({
    isLoaded: true,
    signUp: {
      create: jest.fn(),
      attemptEmailAddressVerification: jest.fn(),
      update: jest.fn(),
      authenticateWithRedirect: jest.fn(),
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
  })),
  useClerk: () => ({
    signOut: jest.fn(),
    openSignIn: jest.fn(),
    openSignUp: jest.fn(),
  }),
  ClerkProvider: ({ children }) => children,
  SignIn: jest.fn(() => null),
  SignUp: jest.fn(() => null),
  UserButton: jest.fn(() => null),
  SignedIn: jest.fn(({ children }) => children),
  SignedOut: jest.fn(({ children }) => children),
  RedirectToSignIn: jest.fn(() => null),
  auth: jest.fn(),
  currentUser: jest.fn(),
}));

// Mock Supabase
jest.mock('./lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
  createUserProfile: jest.fn(),
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  updateUserMFAStatus: jest.fn(),
  checkUserStatus: jest.fn(() => Promise.resolve({
    isVerified: true,
    isBanned: false,
    mfaEnabled: false,
  })),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock';
process.env.CLERK_SECRET_KEY = 'sk_test_mock';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock_anon_key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_service_role_key';
process.env.CLERK_WEBHOOK_SECRET = 'whsec_mock';

// Mock fetch
global.fetch = jest.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});