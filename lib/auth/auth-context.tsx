'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];

interface OrganizationContext {
  id: string;
  name: string;
  role: 'leader' | 'employee';
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  currentOrg: OrganizationContext | null;
  organizations: OrganizationContext[];
  loading: boolean;
  initialized: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'taskos_current_org';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    currentOrg: null,
    organizations: [],
    loading: true,
    initialized: false,
  });

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  }, []);

  // Fetch user's organizations
  const fetchOrganizations = useCallback(async (userId: string): Promise<OrganizationContext[]> => {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        role,
        organization_id,
        organizations (
          id,
          name
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching organizations:', error);
      return [];
    }

    return (data || []).map((member: any) => ({
      id: member.organizations.id,
      name: member.organizations.name,
      role: member.role,
    }));
  }, []);

  // Initialize or update auth state
  const initializeAuth = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setState({
        user: null,
        session: null,
        profile: null,
        currentOrg: null,
        organizations: [],
        loading: false,
        initialized: true,
      });
      return;
    }

    const profile = await fetchProfile(session.user.id);
    const organizations = await fetchOrganizations(session.user.id);

    // Try to restore previous org selection from localStorage
    let currentOrg: OrganizationContext | null = null;
    const savedOrgId = localStorage.getItem(STORAGE_KEY);

    if (savedOrgId && organizations.some(org => org.id === savedOrgId)) {
      currentOrg = organizations.find(org => org.id === savedOrgId) || null;
    } else if (organizations.length > 0) {
      // Default to first org if no saved preference
      currentOrg = organizations[0];
      localStorage.setItem(STORAGE_KEY, currentOrg.id);
    }

    setState({
      user: session.user,
      session,
      profile,
      currentOrg,
      organizations,
      loading: false,
      initialized: true,
    });
  }, [fetchProfile, fetchOrganizations]);

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      initializeAuth(session);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      initializeAuth(session);
    });

    return () => subscription.unsubscribe();
  }, [initializeAuth]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[AuthContext] signIn called with:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('[AuthContext] signInWithPassword result:', { data, error });

    if (error) {
      console.error('[AuthContext] signIn error:', error);
      throw error;
    }
    console.log('[AuthContext] signIn success, session will be updated via listener');
    // Auth state will be updated via onAuthStateChange listener
  }, []);

  // Sign up
  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable email verification redirect
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('Sign up failed');

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        display_name: displayName,
        default_task_visibility: 'leaders_only',
        default_schedule_visibility: 'leaders_only',
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw profileError;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Auth state will be updated via onAuthStateChange listener
  }, []);

  // Switch organization
  const switchOrganization = useCallback(async (orgId: string) => {
    const org = state.organizations.find(o => o.id === orgId);
    if (!org) {
      throw new Error('Organization not found');
    }

    localStorage.setItem(STORAGE_KEY, orgId);
    setState(prev => ({ ...prev, currentOrg: org }));
  }, [state.organizations]);

  // Refresh organizations (useful after joining/creating org)
  const refreshOrganizations = useCallback(async () => {
    if (!state.user) return;

    const organizations = await fetchOrganizations(state.user.id);
    setState(prev => ({ ...prev, organizations }));

    // If no current org but orgs exist, set the first one
    if (!state.currentOrg && organizations.length > 0) {
      const firstOrg = organizations[0];
      localStorage.setItem(STORAGE_KEY, firstOrg.id);
      setState(prev => ({ ...prev, currentOrg: firstOrg }));
    }
  }, [state.user, state.currentOrg, fetchOrganizations]);

  const value = {
    ...state,
    signIn,
    signUp,
    signOut,
    switchOrganization,
    refreshOrganizations,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
