import { authService, type AuthUser as ServiceAuthUser } from '@/services/authService';
import type { AuthUser as LibAuthUser } from '@/lib/supabase';

type AuthStateListener = (user: ServiceAuthUser | null) => void;

function convertToServiceAuthUser(user: LibAuthUser | ServiceAuthUser | null | undefined): ServiceAuthUser | null {
  if (!user) return null;

  if ('email' in user && typeof user.email === 'string') {
    return user as ServiceAuthUser;
  }

  return {
    id: user.id,
    email: user.email || '',
    user_metadata: user.user_metadata || {}
  };
}

class AuthStateService {
  private user: ServiceAuthUser | null = null;
  private initialized = false;
  private initPromise: Promise<ServiceAuthUser | null> | null = null;
  private listeners: AuthStateListener[] = [];

  async initialize(): Promise<ServiceAuthUser | null> {
    if (this.initialized) {
      return this.user;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = authService.initializeFromAccount();

    try {
      this.user = await this.initPromise;
      this.initialized = true;
      this.notifyListeners();
      return this.user;
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.user = null;
      this.initialized = true;
      this.notifyListeners();
      return null;
    } finally {
      this.initPromise = null;
    }
  }

  /**
   * Get current user without triggering API call
   */
  getCurrentUser(): ServiceAuthUser | null {
    return this.user;
  }

  /**
   * Check if auth state has been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Update user state (e.g., after login/logout)
   * Accepts both LibAuthUser and ServiceAuthUser types
   */
  setUser(user: LibAuthUser | ServiceAuthUser | null | undefined): void {
    this.user = convertToServiceAuthUser(user);
    this.initialized = true;
    this.notifyListeners();
  }

  /**
   * Reset auth state (e.g., after logout)
   */
  reset(): void {
    this.user = null;
    this.initialized = false;
    this.initPromise = null;
    this.notifyListeners();
  }

  /**
   * Subscribe to auth state changes
   * Immediately calls the listener with the current state
   */
  subscribe(listener: AuthStateListener): () => void {
    this.listeners.push(listener);

    listener(this.user);

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.user));
  }
}

export const authStateService = new AuthStateService();

