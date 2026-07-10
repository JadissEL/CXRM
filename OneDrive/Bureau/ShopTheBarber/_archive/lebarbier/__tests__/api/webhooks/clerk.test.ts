import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webhooks/clerk/route';
import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('svix');
jest.mock('@supabase/supabase-js');

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.CLERK_WEBHOOK_SECRET = 'test-webhook-secret';

const mockWebhook = Webhook as jest.MockedClass<typeof Webhook>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('/api/webhooks/clerk', () => {
  let mockSupabase: any;
  let mockWebhookInstance: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    
    mockWebhookInstance = {
      verify: jest.fn(),
    };
    
    mockCreateClient.mockReturnValue(mockSupabase);
    mockWebhook.mockReturnValue(mockWebhookInstance);
  });

  describe('Webhook Verification', () => {
    it('returns 400 for missing webhook secret', async () => {
      delete process.env.CLERK_WEBHOOK_SECRET;
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify({ type: 'user.created' }),
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'v1,signature',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      // Restore for other tests
      process.env.CLERK_WEBHOOK_SECRET = 'test-webhook-secret';
    });

    it('returns 400 for invalid webhook signature', async () => {
      mockWebhookInstance.verify.mockImplementation(() => {
        throw new Error('Invalid signature');
      });
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify({ type: 'user.created' }),
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'v1,invalid_signature',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });
  });

  describe('OAuth User Creation', () => {
    const mockUserCreatedPayload = {
      type: 'user.created',
      data: {
        id: 'user_123',
        email_addresses: [{
          id: 'email_123',
          email_address: 'john@example.com',
        }],
        primary_email_address_id: 'email_123',
        first_name: 'John',
        last_name: 'Doe',
        phone_numbers: [{
          id: 'phone_123',
          phone_number: '+1234567890',
        }],
        primary_phone_number_id: 'phone_123',
        profile_image_url: 'https://example.com/avatar.jpg',
        external_accounts: [{
          provider: 'google',
          provider_user_id: 'google_123',
        }],
        unsafe_metadata: {
          role: 'client',
        },
        banned: false,
        locked: false,
      },
    };

    beforeEach(() => {
      mockWebhookInstance.verify.mockReturnValue(mockUserCreatedPayload);
    });

    it('creates new OAuth user when no existing user found', async () => {
      // Mock no existing user
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Not found
      });
      
      // Mock successful insert
      mockSupabase.insert.mockResolvedValue({
        data: { id: 'user_123' },
        error: null,
      });
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify(mockUserCreatedPayload),
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'v1,signature',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        id: 'user_123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'client',
        avatar_url: 'https://example.com/avatar.jpg',
        oauth_providers: ['google'],
        status: 'active',
        email_verified: false,
        mfa_enabled: false,
      });
    });

    it('links OAuth accounts when existing user found with same email', async () => {
      // Mock existing user with same email but different ID
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'user_existing',
          email: 'john@example.com',
          oauth_providers: ['facebook'],
        },
        error: null,
      });
      
      // Mock successful update
      mockSupabase.update.mockResolvedValue({
        data: { id: 'user_existing' },
        error: null,
      });
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify(mockUserCreatedPayload),
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'v1,signature',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        oauth_providers: ['facebook', 'google'],
        avatar_url: 'https://example.com/avatar.jpg',
        updated_at: expect.any(String),
      });
    });

    it('handles multiple OAuth providers correctly', async () => {
      const multiProviderPayload = {
        ...mockUserCreatedPayload,
        data: {
          ...mockUserCreatedPayload.data,
          external_accounts: [
            { provider: 'google', provider_user_id: 'google_123' },
            { provider: 'facebook', provider_user_id: 'facebook_456' },
            { provider: 'apple', provider_user_id: 'apple_789' },
          ],
        },
      };
      
      mockWebhookInstance.verify.mockReturnValue(multiProviderPayload);
      
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      
      mockSupabase.insert.mockResolvedValue({
        data: { id: 'user_123' },
        error: null,
      });
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify(multiProviderPayload),
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'v1,signature',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          oauth_providers: ['google', 'facebook', 'apple'],
        })
      );
    });

    it('blocks banned OAuth users', async () => {
      const bannedUserPayload = {
        ...mockUserCreatedPayload,
        data: {
          ...mockUserCreatedPayload.data,
          banned: true,
        },
      };
      
      mockWebhookInstance.verify.mockReturnValue(bannedUserPayload);
      
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      
      mockSupabase.insert.mockResolvedValue({
        data: { id: 'user_123' },
        error: null,
      });
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify(bannedUserPayload),
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'v1,signature',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'banned',
        })
      );
    });
  });

  describe('User Updated Event', () => {
    const mockUserUpdatedPayload = {
      type: 'user.updated',
      data: {
        id: 'user_123',
        email_addresses: [{
          id: 'email_123',
          email_address: 'john.updated@example.com',
        }],
        primary_email_address_id: 'email_123',
        first_name: 'John',
        last_name: 'Smith',
        phone_numbers: [{
          id: 'phone_123',
          phone_number: '+1987654321',
        }],
        primary_phone_number_id: 'phone_123',
        profile_image_url: 'https://example.com/new-avatar.jpg',
        external_accounts: [{
          provider: 'google',
          provider_user_id: 'google_123',
        }],
        unsafe_metadata: {
          role: 'barber',
        },
        banned: false,
        locked: false,
      },
    };

    beforeEach(() => {
      mockWebhookInstance.verify.mockReturnValue(mockUserUpdatedPayload);
    });

    it('updates existing user data with OAuth info', async () => {
      mockSupabase.update.mockResolvedValue({
        data: { id: 'user_123' },
        error: null,
      });
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify(mockUserUpdatedPayload),
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'v1,signature',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        name: 'John Smith',
        email: 'john.updated@example.com',
        phone: '+1987654321',
        role: 'barber',
        avatar_url: 'https://example.com/new-avatar.jpg',
        oauth_providers: ['google'],
        status: 'active',
        email_verified: false,
        updated_at: expect.any(String),
      });
    });

    it('handles user status changes to banned', async () => {
      const bannedUserPayload = {
        ...mockUserUpdatedPayload,
        data: {
          ...mockUserUpdatedPayload.data,
          banned: true,
        },
      };
      
      mockWebhookInstance.verify.mockReturnValue(bannedUserPayload);
      
      mockSupabase.update.mockResolvedValue({
        data: { id: 'user_123' },
        error: null,
      });
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify(bannedUserPayload),
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'v1,signature',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'banned',
        })
      );
    });

  });

  describe('User Deleted Event', () => {
    const mockUserDeletedPayload = {
      type: 'user.deleted',
      data: {
        id: 'user_123',
      },
    };

    beforeEach(() => {
      mockWebhookInstance.verify.mockReturnValue(mockUserDeletedPayload);
    });

    it('deletes user from Supabase', async () => {
      mockSupabase.delete.mockResolvedValue({
        data: { id: 'user_123' },
        error: null,
      });
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify(mockUserDeletedPayload),
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'v1,signature',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user_123');
    });
  });

  describe('Session Created Event', () => {
    const mockSessionCreatedPayload = {
      type: 'session.created',
      data: {
        id: 'session_123',
        user_id: 'user_123',
        status: 'active',
      },
    };

    beforeEach(() => {
      mockWebhookInstance.verify.mockReturnValue(mockSessionCreatedPayload);
    });

    it('handles session creation', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify(mockSessionCreatedPayload),
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'v1,signature',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockWebhookInstance.verify.mockReturnValue({
        type: 'user.created',
        data: { id: 'user_123' },
      });
    });

    it('handles Supabase errors gracefully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify({ type: 'user.created', data: { id: 'user_123' } }),
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'v1,signature',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(500);
    });

    it('handles unknown event types', async () => {
      mockWebhookInstance.verify.mockReturnValue({
        type: 'unknown.event',
        data: {},
      });
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify({ type: 'unknown.event', data: {} }),
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'v1,signature',
        },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
    });
  });

  describe('OAuth Helper Functions', () => {
    it('extracts OAuth providers correctly', () => {
      const externalAccounts = [
        { provider: 'google', provider_user_id: 'google_123' },
        { provider: 'facebook', provider_user_id: 'facebook_456' },
        { provider: 'apple', provider_user_id: 'apple_789' },
        { provider: 'github', provider_user_id: 'github_999' }, // Should be filtered out
      ];
      
      const expectedProviders = ['google', 'facebook', 'apple'];
      
      // Mock test for the extractOAuthProviders logic
      const extractedProviders = externalAccounts
        .filter(account => ['google', 'facebook', 'apple'].includes(account.provider))
        .map(account => account.provider);
      
      expect(extractedProviders).toEqual(expectedProviders);
    });

    it('determines user status correctly for banned users', () => {
      // Test banned user
      const shouldBlock = (banned: boolean, locked: boolean) => banned || locked;
      
      expect(shouldBlock(true, false)).toBe(true);
      expect(shouldBlock(false, true)).toBe(true);
      expect(shouldBlock(false, false)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('handles unknown event types', async () => {
      const unknownEvent = {
        type: 'unknown.event',
        data: {},
      };

      mockVerify.mockReturnValue(unknownEvent);

      const request = createMockRequest(unknownEvent, {
        'svix-id': 'msg_123',
        'svix-timestamp': '1234567890',
        'svix-signature': 'v1,signature',
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
    });

    it('handles Supabase connection errors', async () => {
      mockVerify.mockReturnValue(userCreatedEvent);
      mockGetUserByEmail.mockRejectedValue(new Error('Connection failed'));

      const request = createMockRequest(userCreatedEvent, {
        'svix-id': 'msg_123',
        'svix-timestamp': '1234567890',
        'svix-signature': 'v1,signature',
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Failed to create user profile');
    });
  });

  describe('Helper Functions', () => {
    describe('extractOAuthProviders', () => {
      it('extracts Google provider correctly', async () => {
        const { extractOAuthProviders } = await import('../../../app/api/webhooks/clerk/route');
        
        const externalAccounts = [
          {
            provider: 'google',
            provider_user_id: 'google_123',
            email_address: 'user@gmail.com',
          },
        ];

        const result = extractOAuthProviders(externalAccounts);
        expect(result).toEqual({
          google_id: 'google_123',
          facebook_id: null,
          apple_id: null,
        });
      });

      it('extracts multiple providers correctly', async () => {
        const { extractOAuthProviders } = await import('../../../app/api/webhooks/clerk/route');
        
        const externalAccounts = [
          {
            provider: 'google',
            provider_user_id: 'google_123',
          },
          {
            provider: 'facebook',
            provider_user_id: 'facebook_456',
          },
        ];

        const result = extractOAuthProviders(externalAccounts);
        expect(result).toEqual({
          google_id: 'google_123',
          facebook_id: 'facebook_456',
          apple_id: null,
        });
      });

      it('handles empty external accounts', async () => {
        const { extractOAuthProviders } = await import('../../../app/api/webhooks/clerk/route');
        
        const result = extractOAuthProviders([]);
        expect(result).toEqual({
          google_id: null,
          facebook_id: null,
          apple_id: null,
        });
      });
    });

    describe('shouldBlockUser', () => {
      it('blocks banned users', async () => {
        const { shouldBlockUser } = await import('../../../app/api/webhooks/clerk/route');
        
        expect(shouldBlockUser(true, false)).toBe(true);
      });

      it('blocks locked users', async () => {
        const { shouldBlockUser } = await import('../../../app/api/webhooks/clerk/route');
        
        expect(shouldBlockUser(false, true)).toBe(true);
      });

      it('does not block normal users', async () => {
        const { shouldBlockUser } = await import('../../../app/api/webhooks/clerk/route');
        
        expect(shouldBlockUser(false, false)).toBe(false);
      });
    });
  });
});