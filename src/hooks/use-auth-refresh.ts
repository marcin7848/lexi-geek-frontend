import { useEffect } from 'react';
import { authStateService } from '@/services/authStateService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageProvider';

/**
 * Hook to manage automatic session refresh
 * Monitors auth state and displays notifications when session expires
 */
export function useAuthRefresh() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    let wasAuthenticated = authStateService.getCurrentUser() !== null;

    const unsubscribe = authStateService.subscribe((user) => {
      const isNowAuthenticated = user !== null;

      // User was logged in but now logged out (session expired)
      if (wasAuthenticated && !isNowAuthenticated && authStateService.isInitialized()) {
        toast({
          title: t('auth.sessionExpired'),
          description: t('auth.sessionExpiredDesc'),
          variant: 'destructive',
        });
        navigate('/login');
      }

      wasAuthenticated = isNowAuthenticated;
    });

    return () => {
      unsubscribe();
    };
  }, [toast, navigate, t]);
}

