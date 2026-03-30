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
    const ORG_ERROR = {
        authRequired: 'org_error:auth_required',
        createFailed: 'org_error:create_failed',
        inviteExpired: 'org_error:invite_expired',
        inviteMaxUses: 'org_error:invite_max_uses',
        alreadyMember: 'org_error:already_member',
        invalidInvite: 'org_error:invalid_invite',
    } as const;

    /**
     * Create a new organization and add current user as leader
     * Uses RPC function that handles org creation, membership, and preferences atomically
     */
    const createOrganization = useCallback(async (name: string): Promise<CreateOrgResult> => {
        if (!user) throw new Error(ORG_ERROR.authRequired);

        // Call the RPC function which atomically:
        // 1. Creates the organization
        // 2. Adds the user as leader
        // 3. Creates user preferences
        const { data: orgId, error } = await supabase.rpc('create_organization', {
            org_name: name.trim()
        });

        if (error) {
            throw new Error(ORG_ERROR.createFailed);
        }

        // Refresh organizations in auth context
        await refreshOrganizations();

        return { organizationId: orgId };
    }, [user, refreshOrganizations]);

    /**
     * Join an organization using an invite code.
     * Delegates all validation and atomic state changes to the server-side
     * join_organization_with_invite RPC (SECURITY DEFINER).
     */
    const joinOrganization = useCallback(async (inviteCode: string): Promise<JoinOrgResult> => {
        if (!user) throw new Error(ORG_ERROR.authRequired);

        const normalizedCode = normalizeInviteCode(inviteCode);

        const { data, error } = await (supabase.rpc as any)('join_organization_with_invite', {
            p_invite_code: normalizedCode,
        });

        if (error) {
            // Surface user-friendly messages from the server-side checks
            const msg: string = error.message || '';
            if (msg.includes('expired')) throw new Error(ORG_ERROR.inviteExpired);
            if (msg.includes('maximum uses')) throw new Error(ORG_ERROR.inviteMaxUses);
            if (msg.includes('Already a member')) throw new Error(ORG_ERROR.alreadyMember);
            throw new Error(ORG_ERROR.invalidInvite);
        }

        return {
            organizationId: data.organizationId,
            organizationName: data.organizationName,
            role: null,
            status: 'pending',
        };
    }, [user]);

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
