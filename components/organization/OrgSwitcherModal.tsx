'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/hooks';
import { useOrganization } from '@/lib/hooks/use-organization';
import { CreateOrgForm } from '@/components/onboarding/CreateOrgForm';
import { JoinOrgForm } from '@/components/onboarding/JoinOrgForm';

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

    if (!isOpen) return null;

    const handleCreateOrg = async (orgName: string) => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await createOrganization(orgName);
            setSuccess(`Created "${orgName}"! You can switch to it from the sidebar.`);
            await refreshOrganizations();
            // Auto-close after short delay
            setTimeout(() => onClose(), 1500);
        } catch (err: any) {
            console.error('Create org error:', err);
            setError(err.message || 'Failed to create organization');
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
            setSuccess(`Joined "${result.organizationName}"! You can switch to it from the sidebar.`);
            await refreshOrganizations();
            // Auto-close after short delay
            setTimeout(() => onClose(), 1500);
        } catch (err: any) {
            console.error('Join org error:', err);
            setError(err.message || 'Failed to join organization');
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
                            Join or Create Organization
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
                                Join with Code
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
                                Create New
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
