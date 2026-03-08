'use client';

import React, { useState } from 'react';

import { Briefcase, User, GraduationCap } from 'lucide-react';
import { CreateOrgForm } from './CreateOrgForm';
import { JoinOrgForm } from './JoinOrgForm';
import { PendingRequestCard } from './PendingRequestCard';

export type OnboardingStep = 'profile' | 'usage-intent' | 'organization';

export interface OnboardingData {
    displayName: string;
    usageIntent: 'work' | 'personal' | 'education' | null;
    jobTitle: string;
}

interface OnboardingWizardProps {
    onSaveProfile: (data: OnboardingData) => Promise<void>;
    onCreateOrg: (name: string) => Promise<void>;
    onJoinOrg: (code: string) => Promise<void>;
    orgLoading: boolean;
    orgError: string;
    setOrgError: (error: string) => void;
    pendingRequest: { orgName: string } | null;
}

export function OnboardingWizard({
    onSaveProfile,
    onCreateOrg,
    onJoinOrg,
    orgLoading,
    orgError,
    setOrgError,
    pendingRequest
}: OnboardingWizardProps) {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile');
    // Organization step state
    const [orgMode, setOrgMode] = useState<'create' | 'join'>('create');

    const [formData, setFormData] = useState<OnboardingData>({
        displayName: '',
        usageIntent: null,
        jobTitle: '',
    });

    const steps: OnboardingStep[] = ['profile', 'usage-intent', 'organization'];
    const currentStepIndex = steps.indexOf(currentStep);

    // If there is a pending request, we might want to default to org step or show it there
    React.useEffect(() => {
        if (pendingRequest) {
            setCurrentStep('organization');
        }
    }, [pendingRequest]);

    const handleUsageIntentSelect = async (intent: 'work' | 'personal' | 'education') => {
        const newData = { ...formData, usageIntent: intent };
        setFormData(newData);

        // Save profile before moving to org step
        await onSaveProfile(newData);
        setCurrentStep('organization');
    };

    const handleProfileSubmit = (data: { displayName: string; jobTitle: string }) => {
        setFormData(prev => ({ ...prev, ...data }));
        // Auto-advance
        setCurrentStep('usage-intent');
    };

    const handleSkipProfile = () => {
        // Should not happen as name is required now
    };

    // Organization step is now handled within the wizard


    return (
        <div className="w-full max-w-md mx-auto">
            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {steps.map((_, idx) => (
                    <div
                        key={idx}
                        className={`h-1.5 w-12 rounded-full transition-colors ${idx <= currentStepIndex ? 'bg-accent' : 'bg-[#E9E9E7]'
                            }`}
                    />
                ))}
            </div>

            {/* Step Content */}
            {/* Step Content */}
            {currentStep === 'profile' && (
                <ProfileStep
                    initialName={formData.displayName}
                    initialJob={formData.jobTitle}
                    onSubmit={handleProfileSubmit}
                />
            )}

            {currentStep === 'usage-intent' && (
                <UsageIntentStep onSelect={handleUsageIntentSelect} selected={formData.usageIntent} />
            )}

            {currentStep === 'organization' && (
                <div className="space-y-6">
                    {pendingRequest ? (
                        <PendingRequestCard orgName={pendingRequest.orgName} />
                    ) : (
                        <>
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-semibold text-[#37352F] mb-2">Setup your workspace</h2>
                                <p className="text-sm text-[#787774]">Create a new organization or join an existing one</p>
                            </div>

                            {/* Mode Toggle */}
                            <div className="flex mb-6 bg-[#F7F6F3] rounded-lg p-1">
                                <button
                                    type="button"
                                    onClick={() => { setOrgMode('create'); setOrgError(''); }}
                                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${orgMode === 'create'
                                        ? 'bg-white text-[#37352F] shadow-sm'
                                        : 'text-[#787774] hover:text-[#37352F]'
                                        }`}
                                >
                                    Create Organization
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setOrgMode('join'); setOrgError(''); }}
                                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${orgMode === 'join'
                                        ? 'bg-white text-[#37352F] shadow-sm'
                                        : 'text-[#787774] hover:text-[#37352F]'
                                        }`}
                                >
                                    Join with Code
                                </button>
                            </div>

                            {/* Error Message */}
                            {orgError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                                    {orgError}
                                </div>
                            )}

                            {/* Forms */}
                            {orgMode === 'create' && (
                                <CreateOrgForm loading={orgLoading} onSubmit={onCreateOrg} />
                            )}

                            {orgMode === 'join' && (
                                <JoinOrgForm
                                    loading={orgLoading}
                                    onSubmit={onJoinOrg}
                                    onError={setOrgError}
                                />
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// Usage Intent Step Component
interface UsageIntentStepProps {
    onSelect: (intent: 'work' | 'personal' | 'education') => void;
    selected: 'work' | 'personal' | 'education' | null;
}

function UsageIntentStep({ onSelect, selected }: UsageIntentStepProps) {
    const options = [
        {
            value: 'work' as const,
            icon: <Briefcase className="w-6 h-6" />,
            title: 'Work',
            description: 'Manage projects and team collaboration'
        },
        {
            value: 'personal' as const,
            icon: <User className="w-6 h-6" />,
            title: 'Personal',
            description: 'Track personal goals and tasks'
        },
        {
            value: 'education' as const,
            icon: <GraduationCap className="w-6 h-6" />,
            title: 'Education',
            description: 'Organize courses and study schedules'
        }
    ];

    return (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-[#37352F] mb-2">How will you use Taskle?</h2>
                <p className="text-sm text-[#787774]">Choose the option that best describes your needs</p>
            </div>

            <div className="space-y-3">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onSelect(option.value)}
                        className={`w-full p-6 rounded-lg border-2 transition-all text-left ${selected === option.value
                            ? 'border-accent bg-accent/5'
                            : 'border-[#E9E9E7] hover:border-[#C8C7C5] hover:bg-[#FAFAFA]'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${selected === option.value ? 'bg-accent/10' : 'bg-[#F7F7F5]'
                                }`}>
                                {option.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-[#37352F] mb-1">{option.title}</h3>
                                <p className="text-sm text-[#787774]">{option.description}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// Profile Step Component
interface ProfileStepProps {
    initialName: string;
    initialJob: string;
    onSubmit: (data: { displayName: string; jobTitle: string }) => void;
}

function ProfileStep({ initialName, initialJob, onSubmit }: ProfileStepProps) {
    const [displayName, setDisplayName] = useState(initialName);
    const [jobTitle, setJobTitle] = useState(initialJob);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim()) return;
        onSubmit({ displayName, jobTitle });
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-[#37352F] mb-2">Tell us about yourself</h2>
                <p className="text-sm text-[#787774]">Help us personalize your experience</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#37352F]">
                        Display Name
                    </label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                        required
                        className="w-full px-3 py-2 text-sm border border-[#E9E9E7] rounded-lg hover:border-[#C8C7C5] focus:border-[#2383E2] focus:outline-none transition-colors"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#37352F]">
                        Job Title <span className="text-[#9B9A97] font-normal">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Product Manager"
                        className="w-full px-3 py-2 text-sm border border-[#E9E9E7] rounded-lg hover:border-[#C8C7C5] focus:border-[#2383E2] focus:outline-none transition-colors"
                    />
                </div>

                <div className="space-y-3">
                    <button
                        type="submit"
                        disabled={!displayName.trim()}
                        className="w-full px-4 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-[#FF7F3D] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        Continue
                    </button>
                </div>
            </form>
        </div>
    );
}
