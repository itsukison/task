'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/hooks';
import { useOrganization } from '@/lib/hooks/use-organization';
import { CreateOrgForm } from '@/components/onboarding/CreateOrgForm';
import { JoinOrgForm } from '@/components/onboarding/JoinOrgForm';
import { useLanguage } from '@/lib/i18n';

interface OrgSwitcherModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Mode = 'create' | 'join';

export function OrgSwitcherModal({ isOpen, onClose }: OrgSwitcherModalProps) {
    const [mode, setMode] = useState<Mode>('join');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { refreshOrganizations } = useAuth();
    const { createOrganization, joinOrganization } = useOrganization();
    const { t } = useLanguage();

    const getOrgErrorMessage = (error: unknown) => {
        const message = error instanceof Error ? error.message : '';
        const map: Record<string, string> = {
            'org_error:auth_required': t('org_errors.auth_required'),
            'org_error:create_failed': t('org_errors.create_failed'),
            'org_error:invite_expired': t('org_errors.invite_expired'),
            'org_error:invite_max_uses': t('org_errors.invite_max_uses'),
            'org_error:already_member': t('org_errors.already_member'),
            'org_error:invalid_invite': t('org_errors.invalid_invite'),
        };
        return map[message] ?? t('org_errors.generic');
    };

    if (!isOpen) return null;

    const handleCreateOrg = async (orgName: string) => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await createOrganization(orgName);
            setSuccess(t('org_switcher.success_created', { name: orgName }));
            await refreshOrganizations();
            // Auto-close after short delay
            setTimeout(() => onClose(), 1500);
        } catch (err: any) {
            console.error('Create org error:', err);
            setError(getOrgErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleJoinOrg = async (inviteCode: string) => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const result = await joinOrganization(inviteCode);

            if (result.status === 'pending') {
                // Request sent, not joined yet
                setSuccess(t('org_switcher.success_request_sent', { name: result.organizationName }));
                // Don't auto-close - let user see the message
            } else {
                // Immediately joined (for future use if we add direct join)
                setSuccess(t('org_switcher.success_joined', { name: result.organizationName }));
                await refreshOrganizations();
                setTimeout(() => onClose(), 1500);
            }
        } catch (err: any) {
            console.error('Join org error:', err);
            setError(getOrgErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError('');
        setSuccess('');
        setMode('join');
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="bg-white rounded-lg shadow-xl w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9E9E7]">
                        <h2 className="text-lg font-semibold text-[#37352F]">
                            {t('org_switcher.title')}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="p-1 text-[#9B9A97] hover:text-[#37352F] transition-colors rounded hover:bg-[#EFEFED]"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Mode Toggle */}
                        <div className="flex mb-6 bg-[#F7F6F3] rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => { setMode('join'); setError(''); setSuccess(''); }}
                                className={cn(
                                    "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors",
                                    mode === 'join'
                                        ? "bg-white text-[#37352F] shadow-sm"
                                        : "text-[#787774] hover:text-[#37352F]"
                                )}
                            >
                                {t('org_switcher.join_tab')}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setMode('create'); setError(''); setSuccess(''); }}
                                className={cn(
                                    "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors",
                                    mode === 'create'
                                        ? "bg-white text-[#37352F] shadow-sm"
                                        : "text-[#787774] hover:text-[#37352F]"
                                )}
                            >
                                {t('org_switcher.create_tab')}
                            </button>
                        </div>

                        {/* Success Message */}
                        {success && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                                {success}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                                {error}
                            </div>
                        )}

                        {/* Forms */}
                        {mode === 'join' ? (
                            <JoinOrgForm
                                loading={loading}
                                onSubmit={handleJoinOrg}
                                onError={setError}
                            />
                        ) : (
                            <CreateOrgForm
                                loading={loading}
                                onSubmit={handleCreateOrg}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
