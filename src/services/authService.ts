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

// Backend Account DTO shape
export interface AccountDto {
  uuid: string;
  username: string;
  email: string;
}

import { HttpMethod, RequestBuilder, RequestService } from '@/services/requestService';
import { throwIfError } from '@/services/requestError';

function saveMockSession(user: AuthUser) {
  const session: AuthSession = {
    currentSession: {
      user,
      access_token: 'cookie-based-session',
    },
  };
  localStorage.setItem('supabase.auth.token', JSON.stringify(session));
  // notify listeners (Header/Sidebar/Index)
  window.dispatchEvent(new Event('storage'));
}

function clearMockSession() {
  localStorage.removeItem('supabase.auth.token');
  window.dispatchEvent(new Event('storage'));
}

export const authService = {
  login: async (email: string, password: string, rememberMe: boolean = false): Promise<AuthUser | null> => {
    const service = new RequestService();
    const request = new RequestBuilder<{ email: string; password: string; rememberMe: boolean }>()
      .url('/login')
      .method(HttpMethod.POST)
      .contentTypeHeader('application/json')
      .body({ email, password, rememberMe })
      .build();

    const res = await service.send(request);
    throwIfError(res, 'Login failed');

    return await authService.initializeFromAccount();
  },

  initializeFromAccount: async (): Promise<AuthUser | null> => {
    try {
      const account = await authService.getAccount();
      if (account) {
        const user: AuthUser = {
          id: account.uuid,
          email: account.email,
          user_metadata: {
            username: account.username,
            full_name: account.username,
          },
        };
        saveMockSession(user);
        return user;
      }
    } catch (_) {
      // ignore and treat as unauthenticated
    }
    clearMockSession();
    return null;
  },

  // Direct call to backend /api/account
  getAccount: async (): Promise<AccountDto | null> => {
    const service = new RequestService();
    const request = new RequestBuilder<void>()
      .url('/account')
      .method(HttpMethod.GET)
      .build();

    const res = await service.send<void, AccountDto | null>(request);
    if (res.statusCode === 200 && res.body && typeof res.body === 'object') {
      // Basic runtime guard
      const b = res.body as AccountDto;
      if (b && typeof b.uuid === 'string' && typeof b.email === 'string' && typeof b.username === 'string') {
        return b;
      }
    }
    return null;
  },

  register: async (email: string, password: string, username: string): Promise<AuthUser | null> => {
    const service = new RequestService();
    const request = new RequestBuilder<{ username: string; email: string; password: string }>()
      .url('/register')
      .method(HttpMethod.POST)
      .contentTypeHeader('application/json')
      .body({ username, email, password })
      .build();

    const res = await service.send(request);
    throwIfError(res, 'Registration failed');

    return await authService.initializeFromAccount();
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
    clearMockSession();
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
