'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/hooks';
import { useOrganization } from '@/lib/hooks/use-organization';
import { OnboardingWizard, type OnboardingData } from '@/components/onboarding/OnboardingWizard';

type OnboardingMode = 'create' | 'join';

export default function OnboardingPage() {
    const [mode, setMode] = useState<OnboardingMode>('create');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [pendingRequest, setPendingRequest] = useState<{ orgName: string } | null>(null);

    const router = useRouter();
    const { user, signOut, loading: authLoading, initialized } = useAuth();
    const { createOrganization, joinOrganization } = useOrganization();

    // Check for pending requests on mount
    React.useEffect(() => {
        if (!user) return;

        const checkPendingRequests = async () => {
            // We can check this via a direct Supabase call since we don't have a specialized hook for "my requests" yet
            // but we can query organization_join_requests where user_id = user.id
            const { supabase } = await import('@/lib/supabase');

            const { data, error } = await supabase
                .from('organization_join_requests')
                .select('status, organizations(name)')
                .eq('user_id', user.id)
                .eq('status', 'pending')
                .maybeSingle();

            if (data && data.organizations) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setPendingRequest({ orgName: (data.organizations as any).name });
                setMode('join'); // Switch to join mode context visually if needed, or just show the card
            }
        };

        checkPendingRequests();
    }, [user]);

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
            const result = await joinOrganization(inviteCode);
            if (result.status === 'pending') {
                setPendingRequest({ orgName: result.organizationName });
            } else {
                router.push('/workspace');
            }
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

    const handleProfileComplete = async (data: OnboardingData) => {
        // Update user profile with collected data
        const { supabase } = await import('@/lib/supabase');

        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
                display_name: data.displayName,
                job_title: data.jobTitle || null,
                usage_intent: data.usageIntent
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error updating profile:', updateError);
            // Continue anyway - these are optional fields
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-white">
            <div className="w-full max-w-md p-8 space-y-6">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Image src="/logo.png" alt="Chrono Logo" width={32} height={32} />
                        <h1 className="text-2xl font-semibold text-[#37352F]">
                            Welcome to Chrono
                        </h1>
                    </div>
                    <p className="text-sm text-[#787774]">
                        {user.email}
                    </p>
                </div>

                <OnboardingWizard
                    onSaveProfile={handleProfileComplete}
                    onCreateOrg={handleCreateOrg}
                    onJoinOrg={handleJoinOrg}
                    orgLoading={loading}
                    orgError={error}
                    setOrgError={setError}
                    pendingRequest={pendingRequest}
                />


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
