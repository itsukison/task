'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/hooks';
import { JoinRequest, MemberRole } from '@/lib/types';

export function useJoinRequests() {
    const { currentOrg } = useAuth();
    const [requests, setRequests] = useState<JoinRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        if (!currentOrg || currentOrg.role !== 'leader') {
            setRequests([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('organization_join_requests')
                .select(`
                    *,
                    user:user_profiles (
                        id,
                        display_name,
                        email
                    )
                `)
                .eq('organization_id', currentOrg.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formattedRequests: JoinRequest[] = (data || []).map((req: any) => ({
                id: req.id,
                organizationId: req.organization_id,
                userId: req.user_id,
                status: req.status,
                createdAt: req.created_at,
                user: req.user ? {
                    id: req.user.id,
                    display_name: req.user.display_name,
                    email: req.user.email,
                } : undefined
            }));

            setRequests(formattedRequests);
        } catch (error) {
            console.error('Error fetching join requests:', error);
        } finally {
            setLoading(false);
        }
    }, [currentOrg]);

    // Initial fetch and Realtime subscription
    useEffect(() => {
        fetchRequests();

        if (!currentOrg || currentOrg.role !== 'leader') return;

        const channel = supabase
            .channel('join-requests-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'organization_join_requests',
                    filter: `organization_id=eq.${currentOrg.id}`
                },
                () => {
                    fetchRequests();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentOrg, fetchRequests]);

    const acceptRequest = async (requestId: string, userId: string) => {
        if (!currentOrg) return;

        try {
            // 1. Add to organization_members
            const { error: memberError } = await supabase
                .from('organization_members')
                .insert({
                    organization_id: currentOrg.id,
                    user_id: userId,
                    role: 'employee' as MemberRole
                });

            if (memberError) throw memberError;

            // 2. Create user preferences
            await supabase
                .from('user_preferences')
                .insert({
                    organization_id: currentOrg.id,
                    user_id: userId,
                });

            // 3. Delete the request (or update status to approved if we kept history, but plan said delete/update)
            // Let's delete it to keep it simple as per plan "Insert to organization_members -> Delete/Update"
            // Actually, deleting is cleaner for "Pending" list.
            const { error: deleteError } = await supabase
                .from('organization_join_requests')
                .delete()
                .eq('id', requestId);

            if (deleteError) throw deleteError;

            // Optimistic update
            setRequests(prev => prev.filter(r => r.id !== requestId));

        } catch (error) {
            console.error('Error accepting request:', error);
            throw error;
        }
    };

    const rejectRequest = async (requestId: string) => {
        try {
            const { error } = await supabase
                .from('organization_join_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId);

            if (error) throw error;

            setRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (error) {
            console.error('Error rejecting request:', error);
            throw error;
        }
    };

    return {
        requests,
        loading,
        acceptRequest,
        rejectRequest
    };
}
