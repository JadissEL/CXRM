# OAuth Setup Guide for ShopTheBarber

This guide explains how to configure OAuth authentication (Google, Facebook, Apple) for the ShopTheBarber application.

## Prerequisites

- Node.js and npm installed
- Access to Google Cloud Console, Facebook Developers, and Apple Developer accounts

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SESSION_SECRET=your-session-secret-key-change-in-production

# Frontend URL
FRONTEND_URL=http://localhost:8080

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Facebook OAuth Configuration
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3001/api/auth/facebook/callback

# Apple OAuth Configuration
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY_PATH=./AuthKey_XXXXXXXXXX.p8
APPLE_CALLBACK_URL=http://localhost:3001/api/auth/apple/callback
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Set the authorized redirect URI to: `http://localhost:3001/api/auth/google/callback`
6. Copy the Client ID and Client Secret to your `.env` file

## Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add Facebook Login product to your app
4. Go to "Settings" > "Basic" and copy the App ID and App Secret
5. Go to "Facebook Login" > "Settings" and add the redirect URI: `http://localhost:3001/api/auth/facebook/callback`
6. Add the credentials to your `.env` file

## Apple OAuth Setup

1. Go to [Apple Developer](https://developer.apple.com/)
2. Create a new App ID or select an existing one
3. Enable "Sign In with Apple" capability
4. Create a Services ID for your app
5. Download the private key file and place it in your project root
6. Update the `APPLE_PRIVATE_KEY_PATH` in your `.env` file
7. Add the Team ID, Key ID, and Client ID to your `.env` file

## Database Schema Updates

The OAuth implementation requires the following columns in the `users` table:

```sql
-- OAuth provider IDs
google_id TEXT UNIQUE,
facebook_id TEXT UNIQUE,
apple_id TEXT UNIQUE,
```

These columns are already included in the updated schema.

## Testing OAuth

1. Start the development server: `npm run dev:full`
2. Navigate to the login page
3. Click on any of the social sign-in buttons
4. Complete the OAuth flow
5. You should be redirected back to the application with a JWT token

## Security Considerations

1. **Environment Variables**: Never commit your `.env` file to version control
2. **HTTPS in Production**: Always use HTTPS in production for OAuth callbacks
3. **Token Security**: JWT tokens are signed with a secret key - keep it secure
4. **Session Management**: Sessions are stored securely with proper expiration
5. **Rate Limiting**: OAuth endpoints are protected with rate limiting

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**: Make sure the callback URL in your OAuth provider matches exactly
2. **"Client ID not found"**: Verify your environment variables are loaded correctly
3. **"Token validation failed"**: Check that your JWT secret is consistent
4. **"Database connection error"**: Ensure the database is running and accessible

### Debug Mode

To enable debug logging, set `NODE_ENV=development` in your `.env` file.

## Production Deployment

For production deployment:

1. Update all callback URLs to use your production domain
2. Use strong, unique secrets for JWT and session
3. Enable HTTPS for all OAuth callbacks
4. Set up proper logging and monitoring
5. Configure rate limiting for OAuth endpoints
6. Use environment-specific database configurations

## API Endpoints

The following OAuth endpoints are available:

- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/facebook` - Initiate Facebook OAuth
- `GET /api/auth/facebook/callback` - Facebook OAuth callback
- `GET /api/auth/apple` - Initiate Apple OAuth
- `POST /api/auth/apple/callback` - Apple OAuth callback
- `GET /api/auth/status` - Check OAuth provider status 