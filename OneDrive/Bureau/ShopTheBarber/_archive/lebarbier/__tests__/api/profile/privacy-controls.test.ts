import { NextRequest } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { DELETE, GET } from '@/app/api/profile/delete-account/route';
import { POST as ExportPOST, GET as ExportGET } from '@/app/api/profile/export-data/route';
import { GET as DownloadGET, POST as DownloadPOST } from '@/app/api/profile/download-export/route';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@supabase/supabase-js');
jest.mock('crypto');
jest.mock('jszip');
jest.mock('nodemailer');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockClerkClient = clerkClient as jest.Mocked<typeof clerkClient>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  rpc: jest.fn()
};

// Mock JWT claims
const mockJwtPayload = {
  __raw: 'mock-jwt-token',
  iss: 'https://clerk.example.com',
  sub: 'user_123',
  sid: 'session_123',
  nbf: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
  org_id: null,
  org_slug: null,
  org_role: null,
  org_permissions: []
};

// Mock user data
const mockUser = {
  id: 'user_123',
  emailAddresses: [{
    id: 'email_123',
    emailAddress: 'test@example.com',
    verification: { status: 'verified' }
  }],
  phoneNumbers: [],
  firstName: 'John',
  lastName: 'Doe',
  profileImageUrl: 'https://example.com/avatar.jpg',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-12-01'),
  lastSignInAt: new Date('2023-12-01'),
  externalAccounts: [],
  twoFactorEnabled: false,
  backupCodeEnabled: false,
  publicMetadata: {},
  privateMetadata: {},
  unsafeMetadata: {},
  primaryEmailAddressId: 'email_123',
  primaryPhoneNumberId: null
};

describe('Privacy Controls API - Comprehensive Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
    
    // Setup environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.DOWNLOAD_TOKEN_SECRET = 'test-secret';
  });

  describe('Account Deletion Lifecycle', () => {
    describe('GET /api/profile/delete-account', () => {
      it('should return deletion requirements for authenticated user', async () => {
        mockAuth.mockReturnValue({ 
          userId: 'user_123',
          sessionClaims: mockJwtPayload,
          sessionId: 'session_123',
          actor: null,
          orgId: null,
          orgSlug: null,
          orgRole: null,
          orgPermissions: [],
          getToken: jest.fn().mockResolvedValue('mock-token'),
          protect: jest.fn(),
          has: jest.fn().mockReturnValue(false),
          debug: jest.fn(),
          user: mockUser as any,
          organization: null,
          session: {
            id: 'session_123',
            status: 'active',
            expireAt: new Date(Date.now() + 3600000),
            abandonAt: new Date(Date.now() + 7200000),
            lastActiveAt: new Date(),
            updatedAt: new Date(),
            createdAt: new Date()
          } as any
        });
        mockClerkClient.users.getUser = jest.fn().mockResolvedValue(mockUser as any);
        mockSupabaseClient.single.mockResolvedValue({
          data: { clerk_user_id: 'user_123', id: 'profile_123' },
          error: null
        });

        const request = new NextRequest('http://localhost:3000/api/profile/delete-account');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('canDelete');
        expect(data).toHaveProperty('requirements');
        expect(data).toHaveProperty('dataToDelete');
        expect(data.irreversible).toBe(true);
      });

      it('should return 401 for unauthenticated user', async () => {
        mockAuth.mockReturnValue({ 
          userId: null,
          sessionClaims: null,
          sessionId: null,
          actor: null,
          orgId: null,
          orgSlug: null,
          orgRole: null,
          orgPermissions: [],
          getToken: jest.fn().mockResolvedValue(null),
          protect: jest.fn().mockImplementation(() => { throw new Error('Not signed in') }),
          has: jest.fn().mockReturnValue(false),
          debug: jest.fn(),
          user: null,
          organization: null,
          session: null
        });

        const request = new NextRequest('http://localhost:3000/api/profile/delete-account');
        const response = await GET(request);

        expect(response.status).toBe(401);
      });
    });

    describe('DELETE /api/profile/delete-account', () => {
      it('should successfully delete account with proper confirmation', async () => {
        mockAuth.mockReturnValue({ 
          userId: 'user_123',
          sessionClaims: mockJwtPayload,
          sessionId: 'session_123',
          actor: null,
          orgId: null,
          orgSlug: null,
          orgRole: null,
          orgPermissions: [],
          getToken: jest.fn().mockResolvedValue('mock-token'),
          protect: jest.fn(),
          has: jest.fn().mockReturnValue(false),
          debug: jest.fn(),
          user: mockUser as any,
          organization: null,
          session: {
            id: 'session_123',
            status: 'active',
            expireAt: new Date(Date.now() + 3600000),
            abandonAt: new Date(Date.now() + 7200000),
            lastActiveAt: new Date(),
            updatedAt: new Date(),
            createdAt: new Date()
          } as any
        });
        mockClerkClient.users.getUser = jest.fn().mockResolvedValue(mockUser as any);
        mockClerkClient.users.deleteUser = jest.fn().mockResolvedValue(undefined as any);
        
        // Mock successful profile lookup
        mockSupabaseClient.single.mockResolvedValue({
          data: { clerk_user_id: 'user_123', id: 'profile_123' },
          error: null
        });
        
        // Mock successful operations
        mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null });
        mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null });
        mockSupabaseClient.update.mockResolvedValue({ data: null, error: null });

        const request = new NextRequest('http://localhost:3000/api/profile/delete-account', {
          method: 'DELETE',
          body: JSON.stringify({ confirmation: 'DELETE MY ACCOUNT' }),
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.1',
            'user-agent': 'Test Browser'
          }
        });

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('Account deletion completed');
        expect(mockClerkClient.users.deleteUser).toHaveBeenCalledWith('user_123');
      });

      it('should reject deletion without proper confirmation', async () => {
        mockAuth.mockReturnValue({ 
          userId: 'user_123',
          sessionClaims: mockJwtPayload,
          sessionId: 'session_123',
          actor: null,
          orgId: null,
          orgSlug: null,
          orgRole: null,
          orgPermissions: [],
          getToken: jest.fn().mockResolvedValue('mock-token'),
          protect: jest.fn(),
          has: jest.fn().mockReturnValue(false),
          debug: jest.fn(),
          user: mockUser as any,
          organization: null,
          session: {
            id: 'session_123',
            status: 'active',
            expireAt: new Date(Date.now() + 3600000),
            abandonAt: new Date(Date.now() + 7200000),
            lastActiveAt: new Date(),
            updatedAt: new Date(),
            createdAt: new Date()
          } as any
        });

        const request = new NextRequest('http://localhost:3000/api/profile/delete-account', {
          method: 'DELETE',
          body: JSON.stringify({ confirmation: 'wrong confirmation' }),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('confirmation');
      });

      it('should handle Clerk deletion failure gracefully', async () => {
        mockAuth.mockReturnValue({ 
          userId: 'user_123',
          sessionClaims: mockJwtPayload,
          sessionId: 'session_123',
          actor: null,
          orgId: null,
          orgSlug: null,
          orgRole: null,
          orgPermissions: [],
          getToken: jest.fn().mockResolvedValue('mock-token'),
          protect: jest.fn(),
          has: jest.fn().mockReturnValue(false),
          debug: jest.fn(),
          user: mockUser as any,
          organization: null,
          session: {
            id: 'session_123',
            status: 'active',
            expireAt: new Date(Date.now() + 3600000),
            abandonAt: new Date(Date.now() + 7200000),
            lastActiveAt: new Date(),
            updatedAt: new Date(),
            createdAt: new Date()
          } as any
        });
        mockClerkClient.users.getUser = jest.fn().mockResolvedValue(mockUser as any);
        mockClerkClient.users.deleteUser = jest.fn().mockRejectedValue(new Error('Clerk deletion failed'));
        
        mockSupabaseClient.single.mockResolvedValue({
          data: { clerk_user_id: 'user_123', id: 'profile_123' },
          error: null
        });
        mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null });
        mockSupabaseClient.update.mockResolvedValue({ data: null, error: null });

        const request = new NextRequest('http://localhost:3000/api/profile/delete-account', {
          method: 'DELETE',
          body: JSON.stringify({ confirmation: 'DELETE MY ACCOUNT' }),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain('Failed to delete account');
      });
    });
  });

  describe('Data Export Workflows', () => {
    describe('GET /api/profile/export-data', () => {
      it('should return export capabilities and history', async () => {
        mockAuth.mockReturnValue({ 
          userId: 'user_123',
          sessionClaims: mockJwtPayload,
          sessionId: 'session_123',
          actor: null,
          orgId: null,
          orgSlug: null,
          orgRole: null,
          orgPermissions: [],
          getToken: jest.fn().mockResolvedValue('mock-token'),
          protect: jest.fn(),
          has: jest.fn().mockReturnValue(false),
          debug: jest.fn(),
          user: mockUser as any,
          organization: null,
          session: {
            id: 'session_123',
            status: 'active',
            expireAt: new Date(Date.now() + 3600000),
            abandonAt: new Date(Date.now() + 7200000),
            lastActiveAt: new Date(),
            updatedAt: new Date(),
            createdAt: new Date()
          } as any
        });
        mockSupabaseClient.single.mockResolvedValue({ data: [], error: null });

        const request = new NextRequest('http://localhost:3000/api/profile/export-data');
        const response = await ExportGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('canExport');
        expect(data).toHaveProperty('rateLimits');
        expect(data).toHaveProperty('supportedFormats');
        expect(data).toHaveProperty('deliveryMethods');
        expect(data.supportedFormats).toContain('json');
        expect(data.supportedFormats).toContain('zip');
      });
    });

    describe('POST /api/profile/export-data', () => {
      it('should successfully export data in JSON format', async () => {
        mockAuth.mockReturnValue({ 
          userId: 'user_123',
          sessionClaims: mockJwtPayload,
          sessionId: 'session_123',
          actor: null,
          orgId: null,
          orgSlug: null,
          orgRole: null,
          orgPermissions: [],
          getToken: jest.fn().mockResolvedValue('mock-token'),
          protect: jest.fn(),
          has: jest.fn().mockReturnValue(false),
          debug: jest.fn(),
          user: mockUser as any,
          organization: null,
          session: {
            id: 'session_123',
            status: 'active',
            expireAt: new Date(Date.now() + 3600000),
            abandonAt: new Date(Date.now() + 7200000),
            lastActiveAt: new Date(),
            updatedAt: new Date(),
            createdAt: new Date()
          } as any
        });
        mockClerkClient.users.getUser = jest.fn().mockResolvedValue(mockUser as any);
        
        // Mock rate limiting check (no recent exports)
        mockSupabaseClient.single.mockResolvedValue({ data: [], error: null });
        mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null });
        mockSupabaseClient.update.mockResolvedValue({ data: null, error: null });

        const request = new NextRequest('http://localhost:3000/api/profile/export-data', {
          method: 'POST',
          body: JSON.stringify({
            format: 'json',
            deliveryMethod: 'download',
            includeAuditLogs: true
          }),
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.1',
            'user-agent': 'Test Browser'
          }
        });

        const response = await ExportPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data).toHaveProperty('data');
        expect(data).toHaveProperty('export_id');
        expect(data.data).toHaveProperty('clerk_data');
        expect(data.data).toHaveProperty('supabase_data');
      });

      it('should enforce rate limiting', async () => {
        mockAuth.mockReturnValue({ 
          userId: 'user_123',
          sessionClaims: mockJwtPayload,
          sessionId: 'session_123',
          actor: null,
          orgId: null,
          orgSlug: null,
          orgRole: null,
          orgPermissions: [],
          getToken: jest.fn().mockResolvedValue('mock-token'),
          protect: jest.fn(),
          has: jest.fn().mockReturnValue(false),
          debug: jest.fn(),
          user: mockUser as any,
          organization: null,
          session: {
            id: 'session_123',
            status: 'active',
            expireAt: new Date(Date.now() + 3600000),
            abandonAt: new Date(Date.now() + 7200000),
            lastActiveAt: new Date(),
            updatedAt: new Date(),
            createdAt: new Date()
          } as any
        });
        
        // Mock recent exports (rate limit exceeded)
        const recentExports = Array(3).fill({
          initiated_at: new Date().toISOString()
        });
        mockSupabaseClient.single.mockResolvedValue({ data: recentExports, error: null });

        const request = new NextRequest('http://localhost:3000/api/profile/export-data', {
          method: 'POST',
          body: JSON.stringify({ format: 'json' }),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await ExportPOST(request);
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data.error).toContain('Too many export requests');
      });

      it('should handle ZIP export with email delivery', async () => {
        mockAuth.mockReturnValue({ 
          userId: 'user_123',
          sessionClaims: mockJwtPayload,
          sessionId: 'session_123',
          actor: null,
          orgId: null,
          orgSlug: null,
          orgRole: null,
          orgPermissions: [],
          getToken: jest.fn().mockResolvedValue('mock-token'),
          protect: jest.fn(),
          has: jest.fn().mockReturnValue(false),
          debug: jest.fn(),
          user: mockUser as any,
          organization: null,
          session: {
            id: 'session_123',
            status: 'active',
            expireAt: new Date(Date.now() + 3600000),
            abandonAt: new Date(Date.now() + 7200000),
            lastActiveAt: new Date(),
            updatedAt: new Date(),
            createdAt: new Date()
          } as any
        });
        mockClerkClient.users.getUser = jest.fn().mockResolvedValue(mockUser as any);
        
        // Mock email configuration
        process.env.SMTP_HOST = 'smtp.test.com';
        process.env.SMTP_USER = 'test@example.com';
        process.env.SMTP_PASS = 'password';
        process.env.SMTP_FROM = 'noreply@example.com';
        
        mockSupabaseClient.single.mockResolvedValue({ data: [], error: null });
        mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null });
        mockSupabaseClient.update.mockResolvedValue({ data: null, error: null });

        // Mock JSZip
        const mockZip = {
          file: jest.fn(),
          generateAsync: jest.fn().mockResolvedValue(Buffer.from('mock zip data'))
        };
        const JSZip = require('jszip');
        JSZip.mockImplementation(() => mockZip);

        // Mock nodemailer
        const mockTransporter = {
          sendMail: jest.fn().mockResolvedValue({})
        };
        const nodemailer = require('nodemailer');
        nodemailer.createTransporter.mockReturnValue(mockTransporter);

        const request = new NextRequest('http://localhost:3000/api/profile/export-data', {
          method: 'POST',
          body: JSON.stringify({
            format: 'zip',
            deliveryMethod: 'email'
          }),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await ExportPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('sent to your email');
      });
    });
  });

  describe('Export Download Management', () => {
    describe('GET /api/profile/download-export', () => {
      it('should successfully download valid export', async () => {
        mockAuth.mockReturnValue({ 
          userId: 'user_123',
          sessionClaims: mockJwtPayload,
          sessionId: 'session_123',
          actor: null,
          orgId: null,
          orgSlug: null,
          orgRole: null,
          orgPermissions: [],
          getToken: jest.fn().mockResolvedValue('mock-token'),
          protect: jest.fn(),
          has: jest.fn().mockReturnValue(false),
          debug: jest.fn(),
          user: mockUser as any,
          organization: null,
          session: {
            id: 'session_123',
            status: 'active',
            expireAt: new Date(Date.now() + 3600000),
            abandonAt: new Date(Date.now() + 7200000),
            lastActiveAt: new Date(),
            updatedAt: new Date(),
            createdAt: new Date()
          } as any
        });
        
        const exportRecord = {
          user_id: 'user_123',
          action_type: 'data_export',
          status: 'completed',
          completed_at: new Date().toISOString(),
          metadata: { export_id: 'export_123' }
        };
        
        mockSupabaseClient.single.mockResolvedValue({
          data: exportRecord,
          error: null
        });
        mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null });

        // Mock crypto for token validation
        const crypto = require('crypto');
        crypto.timingSafeEqual.mockReturnValue(true);
        crypto.createHmac.mockReturnValue({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue('valid-token')
        });

        const request = new NextRequest(
          'http://localhost:3000/api/profile/download-export?token=valid-token&id=export_123'
        );

        const response = await DownloadGET(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/json');
        expect(response.headers.get('Content-Disposition')).toContain('attachment');
      });

      it('should reject expired download links', async () => {
        mockAuth.mockReturnValue({ 
          userId: 'user_123',
          sessionClaims: mockJwtPayload,
          sessionId: 'session_123',
          actor: null,
          orgId: null,
          orgSlug: null,
          orgRole: null,
          orgPermissions: [],
          getToken: jest.fn().mockResolvedValue('mock-token'),
          protect: jest.fn(),
          has: jest.fn().mockReturnValue(false),
          debug: jest.fn(),
          user: mockUser as any,
          organization: null,
          session: {
            id: 'session_123',
            status: 'active',
            expireAt: new Date(Date.now() + 3600000),
            abandonAt: new Date(Date.now() + 7200000),
            lastActiveAt: new Date(),
            updatedAt: new Date(),
            createdAt: new Date()
          } as any
        });
        
        // Export completed more than 15 minutes ago
        const expiredDate = new Date(Date.now() - 20 * 60 * 1000).toISOString();
        const exportRecord = {
          user_id: 'user_123',
          action_type: 'data_export',
          status: 'completed',
          completed_at: expiredDate,
          metadata: { export_id: 'export_123' }
        };
        
        mockSupabaseClient.single.mockResolvedValue({
          data: exportRecord,
          error: null
        });
        mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null });

        const request = new NextRequest(
          'http://localhost:3000/api/profile/download-export?token=valid-token&id=export_123'
        );

        const response = await DownloadGET(request);
        const data = await response.json();

        expect(response.status).toBe(410);
        expect(data.error).toContain('expired');
      });

      it('should reject invalid tokens', async () => {
        mockAuth.mockReturnValue({ 
          userId: 'user_123',
          sessionClaims: mockJwtPayload,
          sessionId: 'session_123',
          actor: null,
          orgId: null,
          orgSlug: null,
          orgRole: null,
          orgPermissions: [],
          getToken: jest.fn().mockResolvedValue('mock-token'),
          protect: jest.fn(),
          has: jest.fn().mockReturnValue(false),
          debug: jest.fn(),
          user: mockUser as any,
          organization: null,
          session: {
            id: 'session_123',
            status: 'active',
            expireAt: new Date(Date.now() + 3600000),
            abandonAt: new Date(Date.now() + 7200000),
            lastActiveAt: new Date(),
            updatedAt: new Date(),
            createdAt: new Date()
          } as any
        });
        
        const exportRecord = {
          user_id: 'user_123',
          action_type: 'data_export',
          status: 'completed',
          completed_at: new Date().toISOString(),
          metadata: { export_id: 'export_123' }
        };
        
        mockSupabaseClient.single.mockResolvedValue({
          data: exportRecord,
          error: null
        });
        mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null });

        // Mock crypto for invalid token
        const crypto = require('crypto');
        crypto.timingSafeEqual.mockReturnValue(false);
        crypto.createHmac.mockReturnValue({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue('expected-token')
        });

        const request = new NextRequest(
          'http://localhost:3000/api/profile/download-export?token=invalid-token&id=export_123'
        );

        const response = await DownloadGET(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toContain('Invalid download token');
      });
    });

    describe('POST /api/profile/download-export', () => {
      it('should generate new download token for valid export', async () => {
        mockAuth.mockReturnValue({ 
          userId: 'user_123',
          sessionClaims: mockJwtPayload,
          sessionId: 'session_123',
          actor: null,
          orgId: null,
          orgSlug: null,
          orgRole: null,
          orgPermissions: [],
          getToken: jest.fn().mockResolvedValue('mock-token'),
          protect: jest.fn(),
          has: jest.fn().mockReturnValue(false),
          debug: jest.fn(),
          user: mockUser as any,
          organization: null,
          session: {
            id: 'session_123',
            status: 'active',
            expireAt: new Date(Date.now() + 3600000),
            abandonAt: new Date(Date.now() + 7200000),
            lastActiveAt: new Date(),
            updatedAt: new Date(),
            createdAt: new Date()
          } as any
        });
        
        const exportRecord = {
          user_id: 'user_123',
          action_type: 'data_export',
          status: 'completed',
          completed_at: new Date().toISOString(),
          metadata: { export_id: 'export_123' }
        };
        
        mockSupabaseClient.single.mockResolvedValue({
          data: exportRecord,
          error: null
        });

        // Mock crypto for token generation
        const crypto = require('crypto');
        crypto.createHmac.mockReturnValue({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue('new-token')
        });

        const request = new NextRequest('http://localhost:3000/api/profile/download-export', {
          method: 'POST',
          body: JSON.stringify({ export_id: 'export_123' }),
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await DownloadPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('download_url');
        expect(data).toHaveProperty('expires_at');
        expect(data.export_id).toBe('export_123');
      });
    });
  });

  describe('Security & Compliance Verification', () => {
    it('should log all privacy actions for audit trail', async () => {
      mockAuth.mockReturnValue({ 
        userId: 'user_123',
        sessionClaims: mockJwtPayload,
        sessionId: 'session_123',
        actor: null,
        orgId: null,
        orgSlug: null,
        orgRole: null,
        orgPermissions: [],
        getToken: jest.fn().mockResolvedValue('mock-token'),
        protect: jest.fn(),
        has: jest.fn().mockReturnValue(false),
        debug: jest.fn(),
        user: mockUser as any,
        organization: null,
        session: {
          id: 'session_123',
          status: 'active',
          expireAt: new Date(Date.now() + 3600000),
          abandonAt: new Date(Date.now() + 7200000),
          lastActiveAt: new Date(),
          updatedAt: new Date(),
          createdAt: new Date()
        } as any
      });
      mockSupabaseClient.single.mockResolvedValue({ data: [], error: null });
      mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null });

      const request = new NextRequest('http://localhost:3000/api/profile/export-data', {
        method: 'POST',
        body: JSON.stringify({ format: 'json' }),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Test Browser'
        }
      });

      await ExportPOST(request);

      // Verify audit logging
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user_123',
          action_type: 'data_export',
          request_ip: '192.168.1.1',
          user_agent: 'Test Browser'
        })
      );
    });

    it('should validate all input parameters', async () => {
      mockAuth.mockReturnValue({ 
        userId: 'user_123',
        sessionClaims: mockJwtPayload,
        sessionId: 'session_123',
        actor: null,
        orgId: null,
        orgSlug: null,
        orgRole: null,
        orgPermissions: [],
        getToken: jest.fn().mockResolvedValue('mock-token'),
        protect: jest.fn(),
        has: jest.fn().mockReturnValue(false),
        debug: jest.fn(),
        user: mockUser as any,
        organization: null,
        session: {
          id: 'session_123',
          status: 'active',
          expireAt: new Date(Date.now() + 3600000),
          abandonAt: new Date(Date.now() + 7200000),
          lastActiveAt: new Date(),
          updatedAt: new Date(),
          createdAt: new Date()
        } as any
      });

      const request = new NextRequest('http://localhost:3000/api/profile/export-data', {
        method: 'POST',
        body: JSON.stringify({
          format: 'invalid-format',
          deliveryMethod: 'invalid-method'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await ExportPOST(request);

      expect(response.status).toBe(500); // Should fail validation
    });

    it('should handle database errors gracefully', async () => {
      mockAuth.mockReturnValue({ 
        userId: 'user_123',
        sessionClaims: mockJwtPayload,
        sessionId: 'session_123',
        actor: null,
        orgId: null,
        orgSlug: null,
        orgRole: null,
        orgPermissions: [],
        getToken: jest.fn().mockResolvedValue('mock-token'),
        protect: jest.fn(),
        has: jest.fn().mockReturnValue(false),
        debug: jest.fn(),
        user: mockUser as any,
        organization: null,
        session: {
          id: 'session_123',
          status: 'active',
          expireAt: new Date(Date.now() + 3600000),
          abandonAt: new Date(Date.now() + 7200000),
          lastActiveAt: new Date(),
          updatedAt: new Date(),
          createdAt: new Date()
        } as any
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      });

      const request = new NextRequest('http://localhost:3000/api/profile/export-data');
      const response = await ExportGET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('End-to-End Integration Scenarios', () => {
    it('should complete full export-download cycle', async () => {
      mockAuth.mockReturnValue({ 
        userId: 'user_123',
        sessionClaims: mockJwtPayload,
        sessionId: 'session_123',
        actor: null,
        orgId: null,
        orgSlug: null,
        orgRole: null,
        orgPermissions: [],
        getToken: jest.fn().mockResolvedValue('mock-token'),
        protect: jest.fn(),
        has: jest.fn().mockReturnValue(false),
        debug: jest.fn(),
        user: mockUser as any,
        organization: null,
        session: {
          id: 'session_123',
          status: 'active',
          expireAt: new Date(Date.now() + 3600000),
          abandonAt: new Date(Date.now() + 7200000),
          lastActiveAt: new Date(),
          updatedAt: new Date(),
          createdAt: new Date()
        } as any
      });
      mockClerkClient.users.getUser = jest.fn().mockResolvedValue(mockUser as any);
      
      // Mock successful export
      mockSupabaseClient.single.mockResolvedValue({ data: [], error: null });
      mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null });
      mockSupabaseClient.update.mockResolvedValue({ data: null, error: null });

      // Step 1: Create export
      const exportRequest = new NextRequest('http://localhost:3000/api/profile/export-data', {
        method: 'POST',
        body: JSON.stringify({ format: 'json' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const exportResponse = await ExportPOST(exportRequest);
      const exportData = await exportResponse.json();

      expect(exportResponse.status).toBe(200);
      expect(exportData.success).toBe(true);

      // Step 2: Generate download token
      const exportRecord = {
        user_id: 'user_123',
        action_type: 'data_export',
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: { export_id: exportData.export_id }
      };
      
      mockSupabaseClient.single.mockResolvedValue({
        data: exportRecord,
        error: null
      });

      const crypto = require('crypto');
      crypto.createHmac.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('download-token')
      });

      const tokenRequest = new NextRequest('http://localhost:3000/api/profile/download-export', {
        method: 'POST',
        body: JSON.stringify({ export_id: exportData.export_id }),
        headers: { 'Content-Type': 'application/json' }
      });

      const tokenResponse = await DownloadPOST(tokenRequest);
      const tokenData = await tokenResponse.json();

      expect(tokenResponse.status).toBe(200);
      expect(tokenData).toHaveProperty('download_url');

      // Step 3: Download file
      crypto.timingSafeEqual.mockReturnValue(true);
      
      const downloadRequest = new NextRequest(
        `http://localhost:3000/api/profile/download-export?token=download-token&id=${exportData.export_id}`
      );

      const downloadResponse = await DownloadGET(downloadRequest);

      expect(downloadResponse.status).toBe(200);
      expect(downloadResponse.headers.get('Content-Type')).toBe('application/json');
    });
  });
});
