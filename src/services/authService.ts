// Service for authentication operations

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    username?: string;
    full_name?: string;
  };
}

export interface AuthSession {
  currentSession: {
    user: AuthUser;
    access_token: string;
  };
}

import { HttpMethod, RequestBuilder, RequestService } from '@/services/requestService';
import { throwIfError } from '@/services/requestError';

export const authService = {
  login: async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    const service = new RequestService();
    const request = new RequestBuilder<{ email: string; password: string; rememberMe: boolean }>()
      .url('/login')
      .method(HttpMethod.POST)
      .contentTypeHeader('application/json')
      .body({ email, password, rememberMe })
      .responseAsVoid()
      .build();

    const res = await service.sendVoid(request);
    throwIfError(res, 'Login failed');
    return;
  },

  register: async (email: string, password: string, username: string): Promise<AuthUser | null> => {
    // Mock registration
    const mockedUser: AuthUser = {
      id: `mock-user-${Date.now()}`,
      email,
      user_metadata: {
        username,
        full_name: username
      }
    };
    
    const session: AuthSession = {
      currentSession: {
        user: mockedUser,
        access_token: 'mock-token'
      }
    };
    
    localStorage.setItem('supabase.auth.token', JSON.stringify(session));
    window.dispatchEvent(new Event('storage'));
    
    return mockedUser;
  },

  logout: async (): Promise<void> => {
    const service = new RequestService();
    const request = new RequestBuilder<void>()
      .url('/logout')
      .method(HttpMethod.POST)
      .responseAsVoid()
      .build();

    const res = await service.sendVoid(request);
    throwIfError(res, 'Logout failed');

    // Also clear any local mock session to keep UI in sync (for mocked register flows)
    localStorage.removeItem('supabase.auth.token');
    window.dispatchEvent(new Event('storage'));
  },

  getCurrentUser: (): AuthUser | null => {
    const mockedSession = localStorage.getItem('supabase.auth.token');
    if (mockedSession) {
      try {
        const parsed: AuthSession = JSON.parse(mockedSession);
        if (parsed.currentSession?.user) {
          return parsed.currentSession.user;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  }
};
