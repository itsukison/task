'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/hooks';
import { Database } from '@/lib/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
type TaskVisibility = Database['public']['Enums']['task_visibility'];
type ScheduleVisibility = Database['public']['Enums']['schedule_visibility'];

interface UserSettings {
    profile: UserProfile | null;
    preferences: UserPreferences | null;
}

interface UpdateProfileData {
    display_name?: string;
    default_task_visibility?: TaskVisibility;
    default_schedule_visibility?: ScheduleVisibility;
}

interface UpdatePreferencesData {
    work_start_time?: string;
    work_end_time?: string;
    calendar_tasks_split_ratio?: number;
    show_weekends?: boolean;
}

export function useUserPreferences() {
    const { user, currentOrg } = useAuth();
    const [settings, setSettings] = useState<UserSettings>({
        profile: null,
        preferences: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Use stable IDs to prevent unnecessary re-fetches when objects are recreated
    const userId = user?.id;
    const orgId = currentOrg?.id;

    // Fetch user profile and preferences
    const fetchSettings = useCallback(async () => {
        if (!userId) {
            setSettings({ profile: null, preferences: null });
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch profile
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;

            // Fetch preferences for current org
            let preferences: UserPreferences | null = null;
            if (orgId) {
                const { data: prefs, error: prefsError } = await supabase
                    .from('user_preferences')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('organization_id', orgId)
                    .single();

                if (prefsError && prefsError.code !== 'PGRST116') {
                    // PGRST116 = no rows found, which is okay
                    throw prefsError;
                }
                preferences = prefs;
            }

            setSettings({ profile, preferences });
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError(err instanceof Error ? err.message : 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    }, [userId, orgId]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Update user profile
    const updateProfile = useCallback(async (data: UpdateProfileData): Promise<boolean> => {
        if (!user) {
            setError('Must be authenticated');
            return false;
        }

        setSaving(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    ...data,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Update local state
            setSettings(prev => ({
                ...prev,
                profile: prev.profile ? { ...prev.profile, ...data } : null,
            }));

            return true;
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to update profile');
            return false;
        } finally {
            setSaving(false);
        }
    }, [user]);

    // Update user preferences
    const updatePreferences = useCallback(async (data: UpdatePreferencesData): Promise<boolean> => {
        if (!user || !currentOrg) {
            setError('Must be authenticated with an organization');
            return false;
        }

        setSaving(true);
        setError(null);

        try {
            // Upsert preferences (create if not exists, update if exists)
            const { error: updateError } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    organization_id: currentOrg.id,
                    ...data,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,organization_id',
                });

            if (updateError) throw updateError;

            // Update local state
            setSettings(prev => ({
                ...prev,
                preferences: prev.preferences
                    ? { ...prev.preferences, ...data }
                    : null,
            }));

            return true;
        } catch (err) {
            console.error('Error updating preferences:', err);
            setError(err instanceof Error ? err.message : 'Failed to update preferences');
            return false;
        } finally {
            setSaving(false);
        }
    }, [user, currentOrg]);

    return {
        profile: settings.profile,
        preferences: settings.preferences,
        loading,
        error,
        saving,
        updateProfile,
        updatePreferences,
        refresh: fetchSettings,
    };
}
