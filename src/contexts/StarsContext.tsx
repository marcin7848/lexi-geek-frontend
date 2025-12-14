import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { accountService } from '@/services/accountService';
import { authStateService } from '@/services/authStateService';

interface StarsContextType {
  stars: number;
  loading: boolean;
  refreshStars: () => Promise<void>;
}

const StarsContext = createContext<StarsContextType | undefined>(undefined);

export const StarsProvider = ({ children }: { children: ReactNode }) => {
  const [stars, setStars] = useState(0);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const fetchStars = async () => {
    try {
      const starsCount = await accountService.getStars();
      setStars(starsCount);
    } catch (error) {
      console.error('Failed to fetch stars:', error);
      setStars(0);
    } finally {
      setLoading(false);
    }
  };

  const refreshStars = async () => {
    await fetchStars();
  };

  // Fetch stars on auth state changes
  useEffect(() => {
    const currentUser = authStateService.getCurrentUser();

    if (currentUser) {
      fetchStars();
    } else {
      setStars(0);
      setLoading(false);
    }

    const unsubscribe = authStateService.subscribe((newUser) => {
      if (newUser) {
        fetchStars();
      } else {
        setStars(0);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Refetch stars on route/page changes
  useEffect(() => {
    const currentUser = authStateService.getCurrentUser();
    if (currentUser) {
      fetchStars();
    }
  }, [location.pathname]);

  return (
    <StarsContext.Provider value={{ stars, loading, refreshStars }}>
      {children}
    </StarsContext.Provider>
  );
};

export const useStars = () => {
  const context = useContext(StarsContext);
  if (context === undefined) {
    throw new Error('useStars must be used within a StarsProvider');
  }
  return context;
};

