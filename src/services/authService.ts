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

export const authService = {
  login: async (email: string, password: string): Promise<AuthUser | null> => {
    // Mock login - check credentials
    if (email === "test@test.com" && password === "test12") {
      const mockedUser: AuthUser = {
        id: "mock-user-123",
        email: "test@test.com",
        user_metadata: {
          username: "TestUser",
          full_name: "Test User"
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
    }
    
    return null;
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
