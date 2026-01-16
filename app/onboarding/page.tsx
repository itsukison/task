'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks';
import { useOrganization } from '@/lib/hooks/use-organization';
import { CreateOrgForm } from '@/components/onboarding/CreateOrgForm';
import { JoinOrgForm } from '@/components/onboarding/JoinOrgForm';

type OnboardingMode = 'create' | 'join';

export default function OnboardingPage() {
    const [mode, setMode] = useState<OnboardingMode>('create');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();
    const { user, signOut, loading: authLoading, initialized } = useAuth();
    const { createOrganization, joinOrganization } = useOrganization();

    // Wait for auth to be initialized before rendering
    if (!initialized || authLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-white">
                <div className="text-[#787774]">Loading...</div>
            </div>
        );
    }

    // Redirect to login if not authenticated (shouldn't happen due to middleware, but safety check)
    if (!user) {
        router.push('/login');
        return null;
    }

    const handleCreateOrg = async (orgName: string) => {
        setError('');
        setLoading(true);

        try {
            await createOrganization(orgName);
            router.push('/workspace');
        } catch (err: any) {
            console.error('Create org error:', err);
            setError(err.message || 'Failed to create organization');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinOrg = async (inviteCode: string) => {
        setError('');
        setLoading(true);

        try {
            await joinOrganization(inviteCode);
            router.push('/workspace');
        } catch (err: any) {
            console.error('Join org error:', err);
            setError(err.message || 'Failed to join organization');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-white">
            <div className="w-full max-w-md px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold text-[#37352F] mb-2">
                        Welcome to TaskOS
                    </h1>
                    <p className="text-sm text-[#787774]">
                        {user.email}
                    </p>
                </div>

                {/* Mode Toggle */}
                <div className="flex mb-6 bg-[#F7F6F3] rounded-lg p-1">
                    <button
                        type="button"
                        onClick={() => { setMode('create'); setError(''); }}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${mode === 'create'
                            ? 'bg-white text-[#37352F] shadow-sm'
                            : 'text-[#787774] hover:text-[#37352F]'
                            }`}
                    >
                        Create Organization
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('join'); setError(''); }}
                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${mode === 'join'
                            ? 'bg-white text-[#37352F] shadow-sm'
                            : 'text-[#787774] hover:text-[#37352F]'
                            }`}
                    >
                        Join with Code
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        {error}
                    </div>
                )}

                {/* Create Organization Form */}
                {mode === 'create' && (
                    <CreateOrgForm loading={loading} onSubmit={handleCreateOrg} />
                )}

                {/* Join Organization Form */}
                {mode === 'join' && (
                    <JoinOrgForm
                        loading={loading}
                        onSubmit={handleJoinOrg}
                        onError={setError}
                    />
                )}

                {/* Sign Out Link */}
                <div className="mt-8 text-center">
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="text-sm text-[#787774] hover:text-[#37352F] transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}
