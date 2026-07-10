import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/auth/sync-profile/route';
import { auth } from '@clerk/nextjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VerificationJSON } from '@clerk/types';

// Mocks
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
}));
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

type ClerkUserOpts = {
  id?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  role?: string | null;
  email?: string;
  missingFields?: string[];
};

const defaultVerification: VerificationJSON = {
  status: 'verified',
  strategy: 'email_code',
  external_verification_redirect_url: null,
  expire_at: Date.now() + 3600000,
  verified_at_client: '',
  attempts: 0,
  error: null,
  id: 'ver_123',
  object: 'verification'
};

const mockClerkUser = ({
  id = 'user_123',
  firstName = 'John',
  lastName = 'Doe',
  phone = '+1234567890',
  role = 'client',
  email = 'john@example.com',
  missingFields = [],
}: ClerkUserOpts = {}) => ({
  id,
  firstName: missingFields.includes('firstName') ? '' : firstName,
  lastName: missingFields.includes('lastName') ? '' : lastName,
  phoneNumbers: phone
    ? [
        {
          phoneNumber: phone,
          id: '',
          reservedForSecondFactor: false,
          defaultSecondFactor: false,
          verification: defaultVerification,
          linkedTo: [],
        },
      ]
    : [],
  emailAddresses: [
    {
      id: 'email_123',
      emailAddress: email,
      verification: defaultVerification,
      linkedTo: [],
    },
  ],
  unsafeMetadata: role ? { role } : {},
  passwordEnabled: false,
  totpEnabled: false,
  backupCodeEnabled: false,
  twoFactorEnabled: false,
  banned: false,
  createdAt: 0,
  updatedAt: 0,
  profileImageUrl: '',
  imageUrl: 'https://example.com/avatar.jpg',
  hasImage: true,
  gender: '',
  birthday: '',
  primaryEmailAddressId: 'email_123',
  primaryPhoneNumberId: null,
  primaryWeb3WalletId: null,
  lastSignInAt: null,
  externalId: null,
  username: null,
  publicMetadata: {},
  privateMetadata: {},
  web3Wallets: [],
  externalAccounts: [],
  createOrganizationEnabled: false,
});

function getMockSupabase() {
  // Strong typing, mimics SupabaseClient methods you use
  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    upsert: jest.fn(),
  } as unknown as Partial<Pick<SupabaseClient<any, any, any>, 'from' | 'select' | 'eq' | 'single' | 'upsert'>>;
}

describe('/api/auth/sync-profile', () => {
  let mockSupabase: ReturnType<typeof getMockSupabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = getMockSupabase();
    mockCreateClient.mockReturnValue(mockSupabase as any);
  });

  describe('POST /api/auth/sync-profile', () => {
    it('successfully syncs user profile to Supabase', async () => {
      mockAuth.mockReturnValue({
        userId: 'user_123',
        user: mockClerkUser()
      });

      (mockSupabase.upsert as jest.Mock).mockResolvedValue({
        data: {
          id: 'user_123',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          role: 'client',
          avatar_url: 'https://example.com/avatar.jpg',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user_123',
          updates: {
            name: 'John Doe',
            phone: '+1234567890',
            role: 'client',
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.upsert).toHaveBeenCalledWith({
        id: 'user_123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'client',
        avatar_url: 'https://example.com/avatar.jpg',
        updated_at: expect.any(String),
      });
    });

    it('returns 401 for unauthenticated requests', async () => {
      mockAuth.mockReturnValue({
        userId: null,
        user: null,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user_123',
          updates: { name: 'John Doe' },
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 403 for mismatched user IDs', async () => {
      mockAuth.mockReturnValue({
        userId: 'user_456',
        user: mockClerkUser({ id: 'user_456' }),
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user_123',
          updates: { name: 'John Doe' },
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden: User ID mismatch');
    });

    it('handles Supabase errors gracefully', async () => {
      mockAuth.mockReturnValue({
        userId: 'user_123',
        user: mockClerkUser()
      });

      (mockSupabase.upsert as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user_123',
          updates: { name: 'John Doe' },
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to sync profile');
      expect(data.details).toBe('Database connection failed');
    });

    it('validates request body schema', async () => {
      mockAuth.mockReturnValue({
        userId: 'user_123',
        user: mockClerkUser()
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile', {
        method: 'POST',
        body: JSON.stringify({
          // Missing userId
          updates: { name: 'John Doe' },
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });
  });

  describe('GET /api/auth/sync-profile', () => {
    it('returns missing fields for incomplete profile', async () => {
      mockAuth.mockReturnValue({
        userId: 'user_123',
        user: mockClerkUser({ lastName: '', phone: null, role: null, missingFields: ['lastName', 'phone', 'role'] })
      });

      (mockSupabase.single as jest.Mock).mockResolvedValue({
        data: {
          id: 'user_123',
          name: 'John',
          phone: null,
          role: null,
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.needsCompletion).toBe(true);
      expect(data.missingFields).toEqual(expect.arrayContaining(['lastName', 'phone', 'role']));
    });

    it('returns no missing fields for complete profile', async () => {
      mockAuth.mockReturnValue({
        userId: 'user_123',
        user: mockClerkUser()
      });

      (mockSupabase.single as jest.Mock).mockResolvedValue({
        data: {
          id: 'user_123',
          name: 'John Doe',
          phone: '+1234567890',
          role: 'client',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.needsCompletion).toBe(false);
      expect(data.missingFields).toEqual([]);
    });

    it('handles user not found in Supabase', async () => {
      mockAuth.mockReturnValue({
        userId: 'user_123',
        user: mockClerkUser()
      });

      (mockSupabase.single as jest.Mock).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Not found
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.needsCompletion).toBe(false);
      expect(data.missingFields).toEqual([]);
    });

    it('returns 401 for unauthenticated requests', async () => {
      mockAuth.mockReturnValue({
        userId: null,
        user: null,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('handles Supabase query errors', async () => {
      mockAuth.mockReturnValue({
        userId: 'user_123',
        user: mockClerkUser()
      });

      (mockSupabase.single as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to check profile completion');
    });
  });

  describe('Profile Completion Logic', () => {
    it.each([
      { missing: ['firstName'], desc: 'missing firstName' },
      { missing: ['lastName'], desc: 'missing lastName' },
      { missing: ['phone'], desc: 'missing phone' },
      { missing: ['role'], desc: 'missing role' },
    ])('correctly identifies $desc', async ({ missing }) => {
      mockAuth.mockReturnValue({
        userId: 'user_123',
        user: mockClerkUser({ missingFields: missing })
      });

      (mockSupabase.single as jest.Mock).mockResolvedValue({
        data: {
          id: 'user_123',
          name: 'John Doe',
          phone: missing.includes('phone') ? null : '+1234567890',
          role: missing.includes('role') ? null : 'client',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/sync-profile');
      const response = await GET(request);
      const data = await response.json();

      expect(data.needsCompletion).toBe(true);
      expect(data.missingFields).toEqual(expect.arrayContaining(missing));
    });
  });
});
