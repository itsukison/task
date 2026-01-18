'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/hooks';
import { PeopleOption } from '@/lib/types';

export interface UseOrganizationMembersReturn {
    members: PeopleOption[];
    loading: boolean;
    error: string | null;
}

export function useOrganizationMembers(): UseOrganizationMembersReturn {
    const { currentOrg } = useAuth();
    const [members, setMembers] = useState<PeopleOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMembers = useCallback(async () => {
        if (!currentOrg) {
            setMembers([]);
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('organization_members')
                .select(`
                    user_id,
                    user_profiles!organization_members_user_profiles_fkey (
                        id,
                        display_name,
                        email
                    )
                `)
                .eq('organization_id', currentOrg.id);

            if (fetchError) throw fetchError;

            // Transform to PeopleOption format
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transformedMembers = (data || []).map((row: any) => ({
                id: row.user_profiles.id,
                displayName: row.user_profiles.display_name,
                email: row.user_profiles.email,
            }));

            setMembers(transformedMembers);
        } catch (err: unknown) {
            console.error('Full error object:', JSON.stringify(err, null, 2));
            const message = err instanceof Error ? err.message : 'Failed to fetch organization members';
            setError(message);
            console.error('Error fetching organization members:', err);
        } finally {
            setLoading(false);
        }
    }, [currentOrg]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    return {
        members,
        loading,
        error,
    };
}
