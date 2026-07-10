import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  updateUserMFAStatus,
  checkUserStatus,
  supabase,
  supabaseAdmin
} from '@/lib/supabase';

// Mock the Supabase clients
jest.mock('@/lib/supabase', () => {
  const mockSupabase = {
    from: jest.fn(),
  };
  
  const mockSupabaseAdmin = {
    from: jest.fn(),
  };
  
  return {
    supabase: mockSupabase,
    supabaseAdmin: mockSupabaseAdmin,
    createUserProfile: jest.fn(),
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    updateUserMFAStatus: jest.fn(),
    checkUserStatus: jest.fn(),
  };
});

// Get the actual implementations for testing
const {
  createUserProfile: actualCreateUserProfile,
  getUserProfile: actualGetUserProfile,
  updateUserProfile: actualUpdateUserProfile,
  updateUserMFAStatus: actualUpdateUserMFAStatus,
  checkUserStatus: actualCheckUserStatus,
} = jest.requireActual('@/lib/supabase');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;

describe('Supabase utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserProfile', () => {
    it('creates user profile successfully', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'user_123', name: 'John Doe', email: 'john@example.com' },
        error: null,
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      });
      
      mockSupabaseAdmin.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      const userData = {
        id: 'user_123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'client' as const,
        status: 'active' as const,
        mfa_enabled: false,
      };

      const result = await actualCreateUserProfile(userData);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('users');
      expect(mockInsert).toHaveBeenCalledWith(userData);
      expect(result).toEqual({ id: 'user_123', name: 'John Doe', email: 'john@example.com' });
    });

    it('handles database errors', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Unique constraint violation' },
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      });
      
      mockSupabaseAdmin.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      const userData = {
        id: 'user_123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'client' as const,
        status: 'active' as const,
        mfa_enabled: false,
      };

      await expect(actualCreateUserProfile(userData)).rejects.toEqual({ message: 'Unique constraint violation' });
    });
  });

  describe('getUserProfile', () => {
    it('retrieves user profile successfully', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'user_123',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'client',
          status: 'active',
          mfa_enabled: false,
        },
        error: null,
      });
      
      const mockEq = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await actualGetUserProfile('user_123');

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'user_123');
      expect(mockSingle).toHaveBeenCalled();
      expect(result?.id).toBe('user_123');
    });

    it('handles user not found', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' },
      });
      
      const mockEq = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await actualGetUserProfile('nonexistent_user');

      expect(result).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('updates user profile successfully', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'user_123', name: 'Jane Doe', email: 'jane@example.com' },
        error: null,
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockEq = jest.fn().mockReturnValue({
        select: mockSelect,
      });
      
      const mockUpdate = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      
      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      const updateData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        mfa_enabled: true,
      };

      const result = await actualUpdateUserProfile('user_123', updateData);

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockUpdate).toHaveBeenCalledWith(updateData);
      expect(mockEq).toHaveBeenCalledWith('id', 'user_123');
      expect(result?.id).toBe('user_123');
    });

    it('handles update errors', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockEq = jest.fn().mockReturnValue({
        select: mockSelect,
      });
      
      const mockUpdate = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      
      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await expect(actualUpdateUserProfile('user_123', { name: 'New Name' })).rejects.toEqual({ message: 'Update failed' });
    });
  });

  describe('updateUserMFAStatus', () => {
    it('updates MFA status successfully', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'user_123', mfa_enabled: true },
        error: null,
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockEq = jest.fn().mockReturnValue({
        select: mockSelect,
      });
      
      const mockUpdate = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      
      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await actualUpdateUserMFAStatus('user_123', true);

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockUpdate).toHaveBeenCalledWith({ mfa_enabled: true });
      expect(mockEq).toHaveBeenCalledWith('id', 'user_123');
      expect(result?.mfa_enabled).toBe(true);
    });

    it('disables MFA successfully', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'user_123', mfa_enabled: false },
        error: null,
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockEq = jest.fn().mockReturnValue({
        select: mockSelect,
      });
      
      const mockUpdate = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      
      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await actualUpdateUserMFAStatus('user_123', false);

      expect(mockUpdate).toHaveBeenCalledWith({ mfa_enabled: false });
      expect(result?.mfa_enabled).toBe(false);
    });
  });

  describe('checkUserStatus', () => {
    it('returns correct status for active verified user', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'user_123',
          status: 'active',
          mfa_enabled: true,
        },
        error: null,
      });
      
      const mockEq = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      // Mock Clerk user verification
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          email_addresses: [{
            verification: { status: 'verified' }
          }]
        }),
      }) as jest.Mock;

      const result = await actualCheckUserStatus('user_123');

      expect(result).toEqual({
        isVerified: true,
        isBanned: false,
        mfaEnabled: true,
      });
    });

    it('returns correct status for banned user', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'user_123',
          status: 'banned',
          mfa_enabled: false,
        },
        error: null,
      });
      
      const mockEq = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          email_addresses: [{
            verification: { status: 'verified' }
          }]
        }),
      }) as jest.Mock;

      const result = await actualCheckUserStatus('user_123');

      expect(result).toEqual({
        isVerified: true,
        isBanned: true,
        mfaEnabled: false,
      });
    });

    it('returns correct status for unverified user', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'user_123',
          status: 'active',
          mfa_enabled: false,
        },
        error: null,
      });
      
      const mockEq = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          email_addresses: [{
            verification: { status: 'unverified' }
          }]
        }),
      }) as jest.Mock;

      const result = await actualCheckUserStatus('user_123');

      expect(result).toEqual({
        isVerified: false,
        isBanned: false,
        mfaEnabled: false,
      });
    });

    it('handles user not found in Supabase', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' },
      });
      
      const mockEq = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await actualCheckUserStatus('nonexistent_user');

      expect(result).toEqual({
        isVerified: false,
        isBanned: true, // Treat as banned if not found
        mfaEnabled: false,
      });
    });

    it('handles Clerk API errors', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'user_123',
          status: 'active',
          mfa_enabled: false,
        },
        error: null,
      });
      
      const mockEq = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      
      mockSupabaseAdmin.from.mockReturnValue({
        select: mockSelect,
      } as any);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }) as jest.Mock;

      const result = await actualCheckUserStatus('user_123');

      expect(result).toEqual({
        isVerified: false, // Default to unverified on API error
        isBanned: false,
        mfaEnabled: false,
      });
    });
  });

  describe('error handling', () => {
    it('handles network errors gracefully', async () => {
      mockSupabaseAdmin.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      await expect(actualGetUserProfile('user_123')).rejects.toThrow('Network error');
    });

    it('handles malformed data gracefully', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { invalid: 'data' },
        error: null,
      });
      
      const mockEq = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      
      mockSupabaseAdmin.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await actualGetUserProfile('user_123');

      expect(result.data).toEqual({ invalid: 'data' });
      expect(result.error).toBeNull();
    });
  });
});