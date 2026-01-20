'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Trash2, Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/lib/hooks/use-organization';
import { SettingSection } from '@/components/ui/settings-primitives';
import { formatInviteCode } from '@/lib/utils/invite-codes';

interface InviteCode {
    id: string;
    invite_code: string;
    expires_at: string | null;
    max_uses: number | null;
    used_count: number | null;
    created_at: string;
}

export function InviteCodeSection() {
    const [invites, setInvites] = useState<InviteCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const { generateInvite, listInvites, revokeInvite } = useOrganization();

    // Fetch invites on mount
    useEffect(() => {
        fetchInvites();
    }, []);

    const fetchInvites = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await listInvites();
            setInvites(data || []);
        } catch (err: any) {
            console.error('Error fetching invites:', err);
            setError('Failed to load invite codes');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            setError('');
            await generateInvite();
            await fetchInvites();
        } catch (err: any) {
            console.error('Error generating invite:', err);
            setError(err.message || 'Failed to generate invite code');
        } finally {
            setGenerating(false);
        }
    };

    const handleRevoke = async (inviteId: string) => {
        try {
            setError('');
            await revokeInvite(inviteId);
            setInvites(prev => prev.filter(i => i.id !== inviteId));
        } catch (err: any) {
            console.error('Error revoking invite:', err);
            setError(err.message || 'Failed to revoke invite code');
        }
    };

    const handleCopy = async (code: string, id: string) => {
        try {
            await navigator.clipboard.writeText(formatInviteCode(code));
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const formatExpiry = (expiresAt: string | null) => {
        if (!expiresAt) return 'Never';
        const date = new Date(expiresAt);
        const now = new Date();
        if (date < now) return 'Expired';

        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) return 'Expires today';
        if (diffDays === 1) return 'Expires tomorrow';
        if (diffDays <= 7) return `Expires in ${diffDays} days`;
        return `Expires ${date.toLocaleDateString()}`;
    };

    const formatUses = (maxUses: number | null, usedCount: number | null) => {
        const used = usedCount ?? 0;
        if (maxUses === null) return `${used} uses`;
        return `${used}/${maxUses} uses`;
    };

    const isExpired = (expiresAt: string | null) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    return (
        <SettingSection title="Invite Codes">
            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    {error}
                </div>
            )}

            {/* Generate Button */}
            <div className="py-3 border-b border-[#E9E9E7]">
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors",
                        "bg-accent text-white hover:bg-accent-dark",
                        generating && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {generating ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Plus size={14} />
                    )}
                    Generate invite code
                </button>
                <p className="mt-2 text-xs text-[#787774]">
                    Codes expire in 7 days by default and can be used unlimited times.
                </p>
            </div>

            {/* Invite List */}
            <div className="py-2">
                {loading ? (
                    <div className="py-4 text-center text-sm text-[#787774]">
                        Loading invite codes...
                    </div>
                ) : invites.length === 0 ? (
                    <div className="py-4 text-center text-sm text-[#787774]">
                        No invite codes yet. Generate one to invite team members.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {invites.map((invite) => {
                            const expired = isExpired(invite.expires_at);
                            return (
                                <div
                                    key={invite.id}
                                    className={cn(
                                        "flex items-center justify-between py-2 px-3 rounded border",
                                        expired
                                            ? "bg-[#FAFAFA] border-[#E9E9E7] opacity-60"
                                            : "bg-white border-[#E9E9E7]"
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <code className="text-sm font-mono text-[#37352F] bg-[#F7F6F3] px-2 py-1 rounded">
                                            {formatInviteCode(invite.invite_code)}
                                        </code>
                                        <div className="flex items-center gap-2 text-xs text-[#787774]">
                                            <span>{formatUses(invite.max_uses, invite.used_count)}</span>
                                            <span>•</span>
                                            <span className={expired ? "text-red-500" : ""}>
                                                {formatExpiry(invite.expires_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleCopy(invite.invite_code, invite.id)}
                                            className="p-1.5 text-[#9B9A97] hover:text-[#37352F] hover:bg-[#EFEFED] rounded transition-colors"
                                            title="Copy code"
                                        >
                                            {copiedId === invite.id ? (
                                                <Check size={14} className="text-green-500" />
                                            ) : (
                                                <Copy size={14} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleRevoke(invite.id)}
                                            className="p-1.5 text-[#9B9A97] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            title="Revoke code"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </SettingSection>
    );
}
