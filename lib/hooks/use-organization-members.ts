'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/hooks';
import { PeopleOption, PeopleOptionWithVisibility, MemberRole } from '@/lib/types';

export interface UseOrganizationMembersReturn {
    members: PeopleOption[];
    membersWithVisibility: PeopleOptionWithVisibility[];
    loading: boolean;
    error: string | null;
    updateMemberRole: (userId: string, role: MemberRole) => Promise<void>;
    removeMember: (userId: string) => Promise<void>;
}

export function useOrganizationMembers(): UseOrganizationMembersReturn {
    const { currentOrg } = useAuth();
    const [members, setMembers] = useState<PeopleOption[]>([]);
    const [membersWithVisibility, setMembersWithVisibility] = useState<PeopleOptionWithVisibility[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMembers = useCallback(async () => {
        if (!currentOrg) {
            setMembers([]);
            setMembersWithVisibility([]);
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('organization_members')
                .select(`
                    user_id,
                    role,
                    user_profiles!organization_members_user_profiles_fkey (
                        id,
                        display_name,
                        email,
                        default_schedule_visibility
                    )
                `)
                .eq('organization_id', currentOrg.id);

            if (fetchError) throw fetchError;

            // Transform to PeopleOption format (basic)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transformedMembers = (data || []).map((row: any) => ({
                id: row.user_profiles.id,
                displayName: row.user_profiles.display_name,
                email: row.user_profiles.email,
            }));

            // Transform to PeopleOptionWithVisibility format (extended)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transformedMembersWithVisibility = (data || []).map((row: any) => ({
                id: row.user_profiles.id,
                displayName: row.user_profiles.display_name,
                email: row.user_profiles.email,
                scheduleVisibility: row.user_profiles.default_schedule_visibility,
                role: row.role,
            }));

            setMembers(transformedMembers);
            setMembersWithVisibility(transformedMembersWithVisibility);
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

    const updateMemberRole = async (userId: string, role: MemberRole) => {
        if (!currentOrg) return;

        try {
            const { error } = await supabase
                .from('organization_members')
                .update({ role })
                .eq('organization_id', currentOrg.id)
                .eq('user_id', userId);

            if (error) throw error;

            // Optimistic update
            setMembersWithVisibility(prev => prev.map(member =>
                member.id === userId ? { ...member, role } : member
            ));
        } catch (err) {
            console.error('Error updating member role:', err);
            throw err;
        }
    };

    const removeMember = async (userId: string) => {
        if (!currentOrg) return;

        try {
            const { error } = await supabase
                .from('organization_members')
                .delete()
                .eq('organization_id', currentOrg.id)
                .eq('user_id', userId);

            if (error) throw error;

            // Optimistic update
            setMembersWithVisibility(prev => prev.filter(member => member.id !== userId));
            setMembers(prev => prev.filter(member => member.id !== userId));
        } catch (err) {
            console.error('Error removing member:', err);
            throw err;
        }
    };

    return {
        members,
        membersWithVisibility,
        loading,
        error,
        updateMemberRole,
        removeMember
    };
}
