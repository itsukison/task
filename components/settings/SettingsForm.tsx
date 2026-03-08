'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/hooks';
import { useUserPreferences } from '@/lib/hooks/use-user-preferences';
import { useJoinRequests } from '@/lib/hooks/use-join-requests';
import {
    SettingSection,
    SettingRow,
    SelectDropdown,
    TimeInput,
    ToggleSwitch
} from '@/components/ui/settings-primitives';
import { SettingsSkeleton } from './SettingsSkeleton';
import { InviteCodeSection } from './InviteCodeSection';
import { MembersListModal } from './MembersListModal';
import { IntegrationsSection } from './IntegrationsSection';
import { AiIntegrationSection } from './AiIntegrationSection';
import { useLanguage, Language } from '@/lib/i18n';

type Theme = 'light' | 'dark' | 'system';
type TaskVisibility = 'private' | 'team' | 'leaders_only';
type ScheduleVisibility = 'private' | 'team' | 'leaders_only';

export function SettingsForm() {
    const { profile: authProfile, currentOrg } = useAuth();
    const {
        profile,
        preferences,
        loading,
        saving,
        updateProfile,
        updatePreferences
    } = useUserPreferences();

    const { language, setLanguage, t } = useLanguage();

    // Local state for settings
    const [theme, setTheme] = useState<Theme>('light');
    const [displayName, setDisplayName] = useState('');
    const [workStartTime, setWorkStartTime] = useState('08:00');
    const [workEndTime, setWorkEndTime] = useState('18:00');
    const [taskVisibility, setTaskVisibility] = useState<TaskVisibility>('team');
    const [scheduleVisibility, setScheduleVisibility] = useState<ScheduleVisibility>('team');
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    const { requests } = useJoinRequests();
    const pendingCount = requests.length;

    // Theme options
    const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
        { value: 'light', label: t('settings.theme_light'), icon: <Sun size={14} /> },
        { value: 'dark', label: t('settings.theme_dark'), icon: <Moon size={14} /> },
        { value: 'system', label: t('settings.theme_system'), icon: <Monitor size={14} /> },
    ];

    const visibilityOptions: { value: TaskVisibility; label: string }[] = [
        { value: 'private', label: t('settings.visibility_private') },
        { value: 'team', label: t('settings.visibility_team') },
        { value: 'leaders_only', label: t('settings.visibility_leaders') },
    ];

    const languageOptions: { value: Language; label: string }[] = [
        { value: 'en', label: 'English' },
        { value: 'ja', label: '日本語' },
    ];

    // Initialize local state from fetched data
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setTaskVisibility(profile.default_task_visibility || 'team');
            setScheduleVisibility(profile.default_schedule_visibility || 'team');
        }
    }, [profile]);

    useEffect(() => {
        if (preferences) {
            setWorkStartTime((preferences as any).work_start_time ?? '08:00');
            setWorkEndTime((preferences as any).work_end_time ?? '18:00');
        }
    }, [preferences]);

    // Load theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('taskos-theme') as Theme | null;
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    // Handle theme change
    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem('taskos-theme', newTheme);
        // In a real app, you'd apply the theme here
    };

    // Handle display name change (debounced save)
    const handleDisplayNameBlur = async () => {
        if (profile && displayName !== profile.display_name) {
            await updateProfile({ display_name: displayName });
        }
    };

    // Handle visibility changes
    const handleTaskVisibilityChange = async (value: TaskVisibility) => {
        setTaskVisibility(value);
        await updateProfile({ default_task_visibility: value });
    };

    const handleScheduleVisibilityChange = async (value: ScheduleVisibility) => {
        setScheduleVisibility(value);
        await updateProfile({ default_schedule_visibility: value });
    };

    if (loading) {
        return <SettingsSkeleton />;
    }

    return (
        <>
            {/* Appearance Section */}
            <SettingSection title={t('settings.appearance')}>
                <SettingRow
                    title={t('settings.language')}
                    description={t('settings.language_description')}
                >
                    <SelectDropdown
                        value={language}
                        options={languageOptions}
                        onChange={(val) => setLanguage(val as Language)}
                    />
                </SettingRow>
                <SettingRow
                    title={t('settings.theme')}
                    description={t('settings.theme_description')}
                >
                    <SelectDropdown
                        value={theme}
                        options={themeOptions.map(t => ({ value: t.value, label: t.label }))}
                        onChange={handleThemeChange}
                    />
                </SettingRow>
            </SettingSection>

            {/* Work Hours Section */}
            <SettingSection title={t('settings.work_hours')}>
                <SettingRow
                    title={t('settings.work_start_time')}
                    description={t('settings.work_start_description')}
                >
                    <TimeInput
                        value={workStartTime}
                        onChange={setWorkStartTime}
                        onBlur={() => updatePreferences({ work_start_time: workStartTime })}
                        disabled={saving}
                    />
                </SettingRow>
                <SettingRow
                    title={t('settings.work_end_time')}
                    description={t('settings.work_end_description')}
                >
                    <TimeInput
                        value={workEndTime}
                        onChange={setWorkEndTime}
                        onBlur={() => updatePreferences({ work_end_time: workEndTime })}
                        disabled={saving}
                    />
                </SettingRow>
            </SettingSection>

            {/* Privacy & Visibility Section */}
            <SettingSection title={t('settings.privacy_visibility')}>
                <SettingRow
                    title={t('settings.task_visibility')}
                    description={t('settings.task_visibility_description')}
                >
                    <SelectDropdown
                        value={taskVisibility}
                        options={visibilityOptions}
                        onChange={handleTaskVisibilityChange}
                        disabled={saving}
                    />
                </SettingRow>
                <SettingRow
                    title={t('settings.schedule_visibility')}
                    description={t('settings.schedule_visibility_description')}
                >
                    <SelectDropdown
                        value={scheduleVisibility}
                        options={visibilityOptions}
                        onChange={handleScheduleVisibilityChange}
                        disabled={saving}
                    />
                </SettingRow>
            </SettingSection>

            {/* Account Section */}
            <SettingSection title={t('settings.account')}>
                <SettingRow
                    title={t('settings.display_name')}
                    description={t('settings.display_name_description')}
                >
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        onBlur={handleDisplayNameBlur}
                        disabled={saving}
                        className={cn(
                            "px-2 py-1 text-sm text-[#37352F] bg-transparent border border-[#E9E9E7] rounded w-48",
                            "hover:border-[#C8C7C5] focus:border-[#2383E2] focus:outline-none",
                            saving && "opacity-50 cursor-not-allowed"
                        )}
                    />
                </SettingRow>
                <SettingRow
                    title={t('settings.email')}
                    description={t('settings.email_description')}
                >
                    <span className="text-sm text-[#787774]">
                        {profile?.email || authProfile?.email || '—'}
                    </span>
                </SettingRow>
            </SettingSection>

            {/* Integrations Section */}
            <IntegrationsSection />

            {/* AI Integration Section */}
            <AiIntegrationSection />

            {/* Organization Info & Members Button */}
            {currentOrg && (
                <SettingSection title={t('settings.organization')}>
                    <SettingRow
                        title={t('settings.current_org')}
                        description={t('settings.current_org_description')}
                    >
                        <span className="text-sm text-[#5F5E5B]">{currentOrg.name}</span>
                    </SettingRow>
                    <SettingRow
                        title={t('settings.your_role')}
                        description={t('settings.your_role_description')}
                    >
                        <span className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded",
                            currentOrg.role === 'leader'
                                ? "bg-accent/10 text-accent"
                                : "bg-[#EFEFED] text-[#5F5E5B]"
                        )}>
                            {currentOrg.role === 'leader' ? t('settings.role_leader') : t('settings.role_employee')}
                        </span>
                    </SettingRow>
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => setIsMembersModalOpen(true)}
                            className="w-full flex items-center justify-between px-4 py-2 bg-white border border-[#E9E9E7] rounded-lg text-sm font-medium text-[#37352F] hover:bg-[#F7F7F5] transition-colors"
                        >
                            <span>{t('settings.manage_members')}</span>
                            {currentOrg?.role === 'leader' && pendingCount > 0 && (
                                <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-[#EB5757] text-[10px] font-bold text-white">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    </div>
                </SettingSection>
            )}

            {/* Members Modal */}
            {currentOrg && (
                <MembersListModal
                    isOpen={isMembersModalOpen}
                    onClose={() => setIsMembersModalOpen(false)}
                />
            )}

            {/* Invite Codes Section (Leaders Only) */}
            {currentOrg?.role === 'leader' && (
                <InviteCodeSection />
            )}

        </>
    );
}
