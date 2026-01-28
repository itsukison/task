'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/hooks';
import { generateInviteCode, normalizeInviteCode } from '@/lib/utils/invite-codes';

interface CreateOrgResult {
    organizationId: string;
}

interface JoinOrgResult {
    organizationId: string;
    organizationName: string;
    role: 'leader' | 'employee' | null;
    status: 'active' | 'pending';
}

interface InviteCodeOptions {
    expiresAt?: Date;
    maxUses?: number;
}

export function useOrganization() {
    const { user, currentOrg, refreshOrganizations } = useAuth();

    /**
     * Create a new organization and add current user as leader
     * Uses RPC function that handles org creation, membership, and preferences atomically
     */
    const createOrganization = useCallback(async (name: string): Promise<CreateOrgResult> => {
        if (!user) throw new Error('Must be authenticated to create organization');

        // Call the RPC function which atomically:
        // 1. Creates the organization
        // 2. Adds the user as leader
        // 3. Creates user preferences
        const { data: orgId, error } = await supabase.rpc('create_organization', {
            org_name: name.trim()
        });

        if (error) {
            throw new Error(`Failed to create organization: ${error.message}`);
        }

        // Refresh organizations in auth context
        await refreshOrganizations();

        return { organizationId: orgId };
    }, [user, refreshOrganizations]);

    /**
     * Join an organization using an invite code
     */
    const joinOrganization = useCallback(async (inviteCode: string): Promise<JoinOrgResult> => {
        if (!user) throw new Error('Must be authenticated to join organization');

        const normalizedCode = normalizeInviteCode(inviteCode);

        // Step 1: Validate invite code and get org name in one query
        // We join organizations here since organization_invites has a FK to organizations
        const { data: invite, error: inviteError } = await supabase
            .from('organization_invites')
            .select('id, organization_id, expires_at, max_uses, used_count, organizations(id, name)')
            .eq('invite_code', normalizedCode)
            .single();

        if (inviteError || !invite) {
            throw new Error('Invalid invite code');
        }

        // Extract org name from the joined data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orgData = invite.organizations as any;
        const orgName = orgData?.name || 'Unknown Organization';

        // Check expiration
        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            throw new Error('This invite code has expired');
        }

        // Check max uses
        if (invite.max_uses !== null && (invite.used_count ?? 0) >= invite.max_uses) {
            throw new Error('This invite code has reached its maximum uses');
        }

        // Check if already a member
        const { data: existingMember } = await supabase
            .from('organization_members')
            .select('id')
            .eq('organization_id', invite.organization_id)
            .eq('user_id', user.id)
            .single();

        if (existingMember) {
            throw new Error('You are already a member of this organization');
        }

        // Check for existing request
        const { data: existingRequest } = await supabase
            .from('organization_join_requests')
            .select('id, status')
            .eq('organization_id', invite.organization_id)
            .eq('user_id', user.id)
            .maybeSingle();

        if (existingRequest) {
            if (existingRequest.status === 'pending') {
                // Already pending, just return the pending state
                // (user might have missed the previous screen)
            } else if (existingRequest.status === 'rejected') {
                // Allow re-application: update status back to pending
                const { error: updateError } = await supabase
                    .from('organization_join_requests')
                    .update({ status: 'pending', created_at: new Date().toISOString() })
                    .eq('id', existingRequest.id);

                if (updateError) {
                    console.error('Error re-applying:', updateError);
                    throw new Error('Failed to re-apply. Please try again.');
                }
            }
        } else {
            // Step 2: Create new join request
            const { error: requestError } = await supabase
                .from('organization_join_requests')
                .insert({
                    organization_id: invite.organization_id,
                    user_id: user.id,
                    status: 'pending',
                });

            if (requestError) {
                console.error('Error creating join request:', requestError);
                throw new Error(`Failed to join organization: ${requestError.message}`);
            }

            // Step 3: Increment used_count (best effort)
            await supabase
                .from('organization_invites')
                .update({ used_count: (invite.used_count ?? 0) + 1 })
                .eq('id', invite.id);

            // Note: We do NOT create user_preferences yet. That happens on approval.
        }

        return {
            organizationId: invite.organization_id,
            organizationName: orgName,
            role: null,
            status: 'pending'
        };
    }, [user, refreshOrganizations]);

    /**
     * Generate an invite code for the current organization (leaders only)
     * Default: expires in 7 days, unlimited uses
     */
    const generateInvite = useCallback(async (options?: InviteCodeOptions): Promise<string> => {
        if (!user) throw new Error('Must be authenticated');
        if (!currentOrg) throw new Error('Must have an active organization');
        if (currentOrg.role !== 'leader') throw new Error('Only leaders can generate invite codes');

        // Default: 7 days expiry, unlimited uses
        const expiresAt = options?.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const maxUses = options?.maxUses ?? null; // null = unlimited

        // Try up to 3 times in case of code collision
        for (let attempt = 0; attempt < 3; attempt++) {
            const code = generateInviteCode();

            const { error } = await supabase
                .from('organization_invites')
                .insert({
                    organization_id: currentOrg.id,
                    invite_code: code,
                    created_by: user.id,
                    expires_at: expiresAt.toISOString(),
                    max_uses: maxUses,
                });

            if (!error) {
                return code;
            }

            // If it's a unique constraint violation, retry with new code
            if (error.code === '23505') {
                continue;
            }

            throw new Error(`Failed to generate invite: ${error.message}`);
        }

        throw new Error('Failed to generate unique invite code after 3 attempts');
    }, [user, currentOrg]);

    /**
     * List all invite codes for the current organization (leaders only)
     */
    const listInvites = useCallback(async () => {
        if (!currentOrg) throw new Error('Must have an active organization');

        const { data, error } = await supabase
            .from('organization_invites')
            .select('*')
            .eq('organization_id', currentOrg.id)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to list invites: ${error.message}`);
        }

        return data;
    }, [currentOrg]);

    /**
     * Revoke (delete) an invite code
     */
    const revokeInvite = useCallback(async (inviteId: string): Promise<void> => {
        if (!currentOrg) throw new Error('Must have an active organization');
        if (currentOrg.role !== 'leader') throw new Error('Only leaders can revoke invites');

        const { error } = await supabase
            .from('organization_invites')
            .delete()
            .eq('id', inviteId)
            .eq('organization_id', currentOrg.id);

        if (error) {
            throw new Error(`Failed to revoke invite: ${error.message}`);
        }
    }, [currentOrg]);

    return {
        createOrganization,
        joinOrganization,
        generateInvite,
        listInvites,
        revokeInvite,
    };
}
