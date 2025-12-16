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
  private refreshIntervalId: number | null = null;
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // Refresh every 5 minutes
  private lastActivityTime: number = Date.now();

  constructor() {
    // Listen for page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    // Listen for user activity to update last activity time
    if (typeof window !== 'undefined') {
      ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        window.addEventListener(event, this.updateActivity.bind(this), { passive: true });
      });
    }
  }

  private updateActivity() {
    this.lastActivityTime = Date.now();
  }

  private async handleVisibilityChange() {
    if (document.visibilityState === 'visible' && this.user) {
      // Page became visible, check if we should refresh the session
      const timeSinceLastActivity = Date.now() - this.lastActivityTime;

      // If more than 5 minutes since last activity, refresh the session
      if (timeSinceLastActivity > this.REFRESH_INTERVAL) {
        console.log('Page visible after inactivity, refreshing session...');
        await this.refreshSession();
      }
    }
  }

  private startRefreshTimer() {
    if (this.refreshIntervalId !== null) {
      return; // Already running
    }

    this.refreshIntervalId = window.setInterval(async () => {
      if (this.user && document.visibilityState === 'visible') {
        console.log('Auto-refreshing session...');
        await this.refreshSession();
      }
    }, this.REFRESH_INTERVAL);
  }

  private stopRefreshTimer() {
    if (this.refreshIntervalId !== null) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
    }
  }

  async refreshSession(): Promise<ServiceAuthUser | null> {
    try {
      const user = await authService.refreshSession();

      if (user) {
        this.user = user;
        this.notifyListeners();
        return user;
      } else {
        // Session expired or invalid
        console.log('Session expired, logging out...');
        this.reset();
        return null;
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      // Don't reset on network errors, just return null
      return null;
    }
  }

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

      // Start refresh timer if user is authenticated
      if (this.user) {
        this.startRefreshTimer();
      }

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

    // Start or stop refresh timer based on user state
    if (this.user) {
      this.startRefreshTimer();
    } else {
      this.stopRefreshTimer();
    }

    this.notifyListeners();
  }

  /**
   * Reset auth state (e.g., after logout)
   */
  reset(): void {
    this.user = null;
    this.initialized = false;
    this.initPromise = null;
    this.stopRefreshTimer();
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

