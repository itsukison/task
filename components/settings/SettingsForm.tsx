'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/hooks';
import { useUserPreferences } from '@/lib/hooks/use-user-preferences';
import {
    SettingSection,
    SettingRow,
    SelectDropdown,
    TimeInput,
    ToggleSwitch
} from '@/components/ui/settings-primitives';
import { SettingsSkeleton } from './SettingsSkeleton';

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

    // Local state for settings
    const [theme, setTheme] = useState<Theme>('light');
    const [displayName, setDisplayName] = useState('');
    const [workStartTime, setWorkStartTime] = useState('09:00');
    const [workEndTime, setWorkEndTime] = useState('18:00');
    const [showWeekends, setShowWeekends] = useState(false);
    const [taskVisibility, setTaskVisibility] = useState<TaskVisibility>('leaders_only');
    const [scheduleVisibility, setScheduleVisibility] = useState<ScheduleVisibility>('leaders_only');

    // Theme options
    const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
        { value: 'light', label: 'Light', icon: <Sun size={14} /> },
        { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
        { value: 'system', label: 'System', icon: <Monitor size={14} /> },
    ];

    const visibilityOptions: { value: TaskVisibility; label: string }[] = [
        { value: 'private', label: 'Private' },
        { value: 'team', label: 'Team' },
        { value: 'leaders_only', label: 'Leaders only' },
    ];

    // Initialize local state from fetched data
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setTaskVisibility(profile.default_task_visibility || 'leaders_only');
            setScheduleVisibility(profile.default_schedule_visibility || 'leaders_only');
        }
    }, [profile]);

    useEffect(() => {
        if (preferences) {
            // Parse time from database format if exists
            // Assuming format is "HH:MM:SS" or similar
            // For now, using defaults if not set
            setShowWeekends(preferences.show_weekends ?? false);
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
            <SettingSection title="Appearance">
                <SettingRow
                    title="Theme"
                    description="Customize how TaskOS looks on your device."
                >
                    <SelectDropdown
                        value={theme}
                        options={themeOptions.map(t => ({ value: t.value, label: t.label }))}
                        onChange={handleThemeChange}
                    />
                </SettingRow>
            </SettingSection>

            {/* Work Hours Section */}
            <SettingSection title="Work Hours">
                <SettingRow
                    title="Work start time"
                    description="Calendar will highlight work hours differently."
                >
                    <TimeInput
                        value={workStartTime}
                        onChange={setWorkStartTime}
                        disabled={saving}
                    />
                </SettingRow>
                <SettingRow
                    title="Work end time"
                    description="Tasks scheduled after this time will show as after-hours."
                >
                    <TimeInput
                        value={workEndTime}
                        onChange={setWorkEndTime}
                        disabled={saving}
                    />
                </SettingRow>
                <SettingRow
                    title="Show weekends"
                    description="Display Saturday and Sunday in the calendar week view."
                >
                    <ToggleSwitch
                        checked={showWeekends}
                        onChange={async (checked) => {
                            setShowWeekends(checked);
                            await updatePreferences({ show_weekends: checked });
                        }}
                        disabled={saving}
                    />
                </SettingRow>
            </SettingSection>

            {/* Privacy & Visibility Section */}
            <SettingSection title="Privacy & Visibility">
                <SettingRow
                    title="Default task visibility"
                    description="Who can see new tasks you create."
                >
                    <SelectDropdown
                        value={taskVisibility}
                        options={visibilityOptions}
                        onChange={handleTaskVisibilityChange}
                        disabled={saving}
                    />
                </SettingRow>
                <SettingRow
                    title="Default schedule visibility"
                    description="Who can see your calendar blocks."
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
            <SettingSection title="Account">
                <SettingRow
                    title="Display name"
                    description="Your name as shown to team members."
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
                    title="Email"
                    description="Your account email address."
                >
                    <span className="text-sm text-[#787774]">
                        {profile?.email || authProfile?.email || '—'}
                    </span>
                </SettingRow>
            </SettingSection>

            {/* Organization Section */}
            {currentOrg && (
                <SettingSection title="Organization">
                    <SettingRow
                        title="Current organization"
                        description="The workspace you're currently working in."
                    >
                        <span className="text-sm text-[#5F5E5B]">{currentOrg.name}</span>
                    </SettingRow>
                    <SettingRow
                        title="Your role"
                        description="Your permission level in this organization."
                    >
                        <span className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded",
                            currentOrg.role === 'leader'
                                ? "bg-accent/10 text-accent"
                                : "bg-[#EFEFED] text-[#5F5E5B]"
                        )}>
                            {currentOrg.role === 'leader' ? 'Leader' : 'Employee'}
                        </span>
                    </SettingRow>
                </SettingSection>
            )}

        </>
    );
}
