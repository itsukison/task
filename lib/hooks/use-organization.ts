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
    role: 'leader' | 'employee';
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

        // Step 1: Validate invite code
        const { data: invite, error: inviteError } = await supabase
            .from('organization_invites')
            .select(`
        id,
        organization_id,
        expires_at,
        max_uses,
        used_count,
        organizations (
          id,
          name
        )
      `)
            .eq('invite_code', normalizedCode)
            .single();

        if (inviteError || !invite) {
            throw new Error('Invalid invite code');
        }

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

        // Step 2: Add user as employee
        const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
                organization_id: invite.organization_id,
                user_id: user.id,
                role: 'employee',
            });

        if (memberError) {
            console.error('Error joining organization:', memberError);
            throw new Error(`Failed to join organization: ${memberError.message}`);
        }

        // Step 3: Increment used_count (best effort, don't fail if this errors)
        await supabase
            .from('organization_invites')
            .update({ used_count: (invite.used_count ?? 0) + 1 })
            .eq('id', invite.id);

        // Step 4: Create user preferences
        const { error: prefError } = await supabase
            .from('user_preferences')
            .insert({
                organization_id: invite.organization_id,
                user_id: user.id,
            });

        if (prefError) {
            console.error('Error creating preferences:', prefError);
        }

        // Step 5: Refresh organizations
        await refreshOrganizations();

        const org = invite.organizations as { id: string; name: string };
        return {
            organizationId: org.id,
            organizationName: org.name,
            role: 'employee',
        };
    }, [user, refreshOrganizations]);

    /**
     * Generate an invite code for the current organization (leaders only)
     */
    const generateInvite = useCallback(async (options?: InviteCodeOptions): Promise<string> => {
        if (!user) throw new Error('Must be authenticated');
        if (!currentOrg) throw new Error('Must have an active organization');
        if (currentOrg.role !== 'leader') throw new Error('Only leaders can generate invite codes');

        // Try up to 3 times in case of code collision
        for (let attempt = 0; attempt < 3; attempt++) {
            const code = generateInviteCode();

            const { error } = await supabase
                .from('organization_invites')
                .insert({
                    organization_id: currentOrg.id,
                    invite_code: code,
                    created_by: user.id,
                    expires_at: options?.expiresAt?.toISOString(),
                    max_uses: options?.maxUses,
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
