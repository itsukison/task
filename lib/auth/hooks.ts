import { useAuthContext } from './auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Access the full auth context
 */
export function useAuth() {
  return useAuthContext();
}

/**
 * Get the current user (throws if not authenticated)
 * Use this hook in components that require authentication
 */
export function useUser() {
  const { user, loading } = useAuthContext();

  if (!loading && !user) {
    throw new Error('useUser must be used in an authenticated context');
  }

  return user;
}

/**
 * Get the user profile
 */
export function useProfile() {
  const { profile } = useAuthContext();
  return profile;
}

/**
 * Get the current organization context
 */
export function useCurrentOrg() {
  const { currentOrg } = useAuthContext();
  return currentOrg;
}

/**
 * Hook that redirects to login if not authenticated
 * Use this in pages that require authentication
 */
export function useRequireAuth() {
  const { user, loading, initialized } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.push('/login');
    }
  }, [user, loading, initialized, router]);

  return { user, loading };
}

/**
 * Hook that redirects to workspace if already authenticated
 * Use this in auth pages (login/signup)
 */
export function useRequireNoAuth() {
  const { user, loading, initialized } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !loading && user) {
      router.push('/workspace');
    }
  }, [user, loading, initialized, router]);

  return { loading };
}

/**
 * Hook that ensures user is in an organization
 * Redirects to onboarding if no organization
 */
export function useRequireOrg() {
  const { user, currentOrg, loading, initialized } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !loading && user && !currentOrg) {
      router.push('/onboarding');
    }
  }, [user, currentOrg, loading, initialized, router]);

  return { currentOrg, loading };
}
