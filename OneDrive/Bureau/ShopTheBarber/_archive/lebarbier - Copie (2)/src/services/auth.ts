import { User, Profile } from '@/types';
import { api } from './api';
import { AUTH_CONFIG } from '@/config/constants';

class AuthService {
  private user: User | null = null;
  private session: any = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Check for existing session
    const token = this.getToken();
    if (token) {
      try {
        await this.validateToken(token);
      } catch {
        this.logout();
      }
    }
  }

  // Get stored token
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  // Store token
  private setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  }

  // Remove token
  private removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  }

  // Validate token with server
  private async validateToken(token: string): Promise<boolean> {
    try {
      const response = await api.get<{ user: User }>('/auth/validate', { token });
      if (response.success && response.data) {
        this.user = response.data.user;
        this.setupRefreshTimer();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Setup automatic token refresh
  private setupRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(async () => {
      try {
        await this.refreshToken();
      } catch {
        this.logout();
      }
    }, AUTH_CONFIG.refreshThreshold);
  }

  // Refresh token
  private async refreshToken(): Promise<void> {
    try {
      const response = await api.post<{ token: string }>('/auth/refresh');
      if (response.success && response.data) {
        this.setToken(response.data.token);
        this.setupRefreshTimer();
      }
    } catch {
      throw new Error('Failed to refresh token');
    }
  }

  // Sign in
  async signIn(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await api.post<{ user: User; token: string }>('/auth/signin', {
        email,
        password,
      });

      if (response.success && response.data) {
        this.user = response.data.user;
        this.setToken(response.data.token);
        this.setupRefreshTimer();
        return { success: true, user: response.data.user };
      }

      return { success: false, error: response.error || 'Sign in failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Sign up
  async signUp(userData: { name: string; email: string; password: string; phone?: string }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await api.post<{ user: User; token: string }>('/auth/signup', userData);

      if (response.success && response.data) {
        this.user = response.data.user;
        this.setToken(response.data.token);
        this.setupRefreshTimer();
        return { success: true, user: response.data.user };
      }

      return { success: false, error: response.error || 'Sign up failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await api.post('/auth/signout');
    } catch {
      // Continue with logout even if server request fails
    } finally {
      this.logout();
    }
  }

  // Logout (local cleanup)
  private logout(): void {
    this.user = null;
    this.session = null;
    this.removeToken();
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.user !== null;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  // Update user profile
  async updateProfile(profileData: Partial<Profile>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await api.put<{ user: User }>('/auth/profile', profileData);

      if (response.success && response.data) {
        this.user = response.data.user;
        return { success: true, user: response.data.user };
      }

      return { success: false, error: response.error || 'Profile update failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (response.success) {
        return { success: true };
      }

      return { success: false, error: response.error || 'Password change failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post('/auth/forgot-password', { email });

      if (response.success) {
        return { success: true };
      }

      return { success: false, error: response.error || 'Password reset request failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword,
      });

      if (response.success) {
        return { success: true };
      }

      return { success: false, error: response.error || 'Password reset failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Verify email
  async verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post('/auth/verify-email', { token });

      if (response.success) {
        return { success: true };
      }

      return { success: false, error: response.error || 'Email verification failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Get auth headers for API requests
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export convenience functions
export const auth = {
  signIn: (email: string, password: string) => authService.signIn(email, password),
  signUp: (userData: { name: string; email: string; password: string; phone?: string }) => authService.signUp(userData),
  signOut: () => authService.signOut(),
  getCurrentUser: () => authService.getCurrentUser(),
  isAuthenticated: () => authService.isAuthenticated(),
  hasRole: (role: string) => authService.hasRole(role),
  updateProfile: (profileData: Partial<Profile>) => authService.updateProfile(profileData),
  changePassword: (currentPassword: string, newPassword: string) => authService.changePassword(currentPassword, newPassword),
  requestPasswordReset: (email: string) => authService.requestPasswordReset(email),
  resetPassword: (token: string, newPassword: string) => authService.resetPassword(token, newPassword),
  verifyEmail: (token: string) => authService.verifyEmail(token),
  getAuthHeaders: () => authService.getAuthHeaders(),
}; 