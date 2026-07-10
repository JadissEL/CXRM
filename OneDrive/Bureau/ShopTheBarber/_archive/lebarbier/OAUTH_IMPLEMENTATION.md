# OAuth Implementation Guide

This document provides a comprehensive guide to the OAuth implementation in the LeBarbier application, including setup, configuration, and usage.

## Overview

The OAuth implementation supports Google, Facebook, and Apple sign-in providers through Clerk authentication, with automatic account linking and profile completion flows.

## Features

### 🔐 Supported OAuth Providers
- **Google OAuth 2.0**: Sign in with Google accounts
- **Facebook Login**: Sign in with Facebook accounts  
- **Apple Sign In**: Sign in with Apple ID

### 🔗 Account Linking
- Automatic linking of OAuth accounts with existing email-based accounts
- Multiple OAuth provider support per user
- Seamless account merging

### 📝 Profile Completion
- Automatic detection of missing required fields after OAuth sign-in
- Interactive profile completion form
- Real-time validation and synchronization

### 🛡️ Security Features
- Webhook-based user synchronization
- Banned/locked user detection
- Secure profile data handling

## Architecture

### Components

#### 1. SocialSignIn Component
**Location**: `components/auth/SocialSignIn.tsx`

```typescript
// Handles OAuth provider buttons and sign-in flow
<SocialSignIn 
  userRole="client" // or "barber"
  onError={(error) => console.error(error)}
/>
```

#### 2. ProfileCompletion Component
**Location**: `components/auth/ProfileCompletion.tsx`

```typescript
// Collects missing profile information after OAuth sign-in
<ProfileCompletion 
  onComplete={() => router.push('/dashboard')}
  onError={(error) => setError(error)}
/>
```

#### 3. ProfileCompletionGuard Component
**Location**: `components/auth/ProfileCompletionGuard.tsx`

```typescript
// Middleware to check profile completion status
<ProfileCompletionGuard>
  <YourProtectedContent />
</ProfileCompletionGuard>
```

### API Routes

#### 1. Profile Sync API
**Location**: `app/api/auth/sync-profile/route.ts`

- **GET**: Check for missing required fields
- **POST**: Update user profile and sync with Supabase

#### 2. Clerk Webhooks
**Location**: `app/api/webhooks/clerk/route.ts`

- Handles user creation, updates, and deletion
- Manages OAuth provider information
- Implements account linking logic

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local` file:

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# OAuth Provider Credentials
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

NEXT_PUBLIC_APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret

# Feature Flags
NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=true
NEXT_PUBLIC_ENABLE_MFA=true
NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION=true

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

### 2. Clerk Dashboard Configuration

1. **Enable OAuth Providers**:
   - Go to Clerk Dashboard → Authentication → Social Connections
   - Enable Google, Facebook, and Apple providers
   - Configure redirect URLs and credentials

2. **Configure Webhooks**:
   - Go to Clerk Dashboard → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
   - Enable events: `user.created`, `user.updated`, `user.deleted`, `session.created`

### 3. OAuth Provider Setup

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs from Clerk

#### Facebook Login Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. Get App ID and App Secret

#### Apple Sign In Setup
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create a new identifier for Sign in with Apple
3. Configure service ID and domains
4. Generate private key and get team ID

## Usage Examples

### Basic OAuth Sign-In

```typescript
// In your sign-up page
import { SocialSignIn } from '@/components/auth/SocialSignIn';

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const userRole = searchParams.get('role') as 'client' | 'barber';

  return (
    <div>
      <SignUp />
      <SocialSignIn 
        userRole={userRole}
        onError={(error) => {
          console.error('OAuth error:', error);
        }}
      />
    </div>
  );
}
```

### Protected Route with Profile Completion

```typescript
// In your layout or protected pages
import { ProfileCompletionGuard } from '@/components/auth/ProfileCompletionGuard';

export default function DashboardLayout({ children }) {
  return (
    <ProfileCompletionGuard>
      {children}
    </ProfileCompletionGuard>
  );
}
```

### Manual Profile Sync

```typescript
// Check profile completion status
const checkProfile = async () => {
  const response = await fetch('/api/auth/sync-profile');
  const data = await response.json();
  
  if (data.missingFields?.length > 0) {
    // Show profile completion form
    setShowProfileCompletion(true);
  }
};

// Update profile
const updateProfile = async (profileData) => {
  const response = await fetch('/api/auth/sync-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  
  if (response.ok) {
    // Profile updated successfully
    router.refresh();
  }
};
```

## Database Schema

### Users Table

The following fields are added/updated for OAuth support:

```sql
-- OAuth provider IDs
google_id TEXT,
facebook_id TEXT,
apple_id TEXT,

-- Profile information
avatar_url TEXT,
status TEXT DEFAULT 'active',

-- Timestamps
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
```

## Testing

### Unit Tests

```bash
# Run OAuth-specific tests
npm test -- oauth-flow.test.tsx
npm test -- sync-profile.test.ts
npm test -- clerk.test.ts
```

### Integration Tests

```bash
# Run full integration test suite
npm test -- integration/
```

### Manual Testing Checklist

- [ ] Google OAuth sign-in works
- [ ] Facebook OAuth sign-in works
- [ ] Apple OAuth sign-in works
- [ ] Account linking with existing email accounts
- [ ] Profile completion flow after OAuth
- [ ] Multiple OAuth providers per user
- [ ] Webhook synchronization
- [ ] Error handling and validation

## Troubleshooting

### Common Issues

1. **OAuth Provider Not Working**
   - Check environment variables
   - Verify Clerk dashboard configuration
   - Ensure redirect URLs match

2. **Profile Completion Not Triggering**
   - Check webhook configuration
   - Verify required fields in validation schema
   - Check API route responses

3. **Account Linking Issues**
   - Verify email matching logic
   - Check Supabase user queries
   - Review webhook event handling

### Debug Mode

Enable debug logging by setting:

```bash
NEXT_PUBLIC_DEBUG_OAUTH=true
```

### Webhook Testing

Use tools like ngrok for local webhook testing:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the ngrok URL in Clerk webhook configuration
```

## Security Considerations

1. **Environment Variables**: Never commit OAuth secrets to version control
2. **Webhook Verification**: Always verify webhook signatures
3. **User Validation**: Validate all user input in profile completion
4. **Rate Limiting**: Implement rate limiting for OAuth endpoints
5. **Error Handling**: Don't expose sensitive information in error messages

## Performance Optimization

1. **Lazy Loading**: Components are lazy-loaded to reduce bundle size
2. **Caching**: Profile completion status is cached
3. **Debouncing**: Form validation is debounced
4. **Minimal API Calls**: Efficient data fetching strategies

## Future Enhancements

- [ ] LinkedIn OAuth support
- [ ] Twitter/X OAuth support
- [ ] Enhanced profile completion UI
- [ ] OAuth provider management dashboard
- [ ] Advanced account linking options
- [ ] Social profile data import

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review test files for usage examples
3. Check Clerk documentation
4. Review OAuth provider documentation