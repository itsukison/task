'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/hooks';
import { useUserPreferences } from '@/lib/hooks/use-user-preferences';

type Theme = 'light' | 'dark' | 'system';
type TaskVisibility = 'private' | 'team' | 'leaders_only';
type ScheduleVisibility = 'private' | 'team' | 'leaders_only';

// ============================================================================
// Setting Components
// ============================================================================

interface SettingSectionProps {
    title: string;
    children: React.ReactNode;
}

function SettingSection({ title, children }: SettingSectionProps) {
    return (
        <div className="mb-8">
            <h2 className="text-base font-semibold text-[#37352F] pb-2 border-b border-[#E9E9E7]">{title}</h2>
            <div>{children}</div>
        </div>
    );
}

interface SettingRowProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

function SettingRow({ title, description, children }: SettingRowProps) {
    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex-1 mr-4">
                <div className="text-sm font-medium text-[#37352F]">{title}</div>
                {description && (
                    <div className="text-sm text-[#787774] mt-0.5">{description}</div>
                )}
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );
}

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                checked ? "bg-[#2383E2]" : "bg-[#DCDCDC]",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <span
                className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                    checked ? "translate-x-[22px]" : "translate-x-[2px]"
                )}
            />
        </button>
    );
}

interface SelectDropdownProps<T extends string> {
    value: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
    disabled?: boolean;
}

function SelectDropdown<T extends string>({ value, options, onChange, disabled }: SelectDropdownProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-1 px-2 py-1 text-sm text-[#5F5E5B] hover:bg-[#EFEFED] rounded transition-colors",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <span>{selectedOption?.label || value}</span>
                <ChevronDown size={14} className="text-[#9B9A97]" />
            </button>
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-[#E9E9E7] rounded-lg shadow-lg py-1 min-w-[140px]">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full px-3 py-1.5 text-sm text-left hover:bg-[#EFEFED] transition-colors",
                                    option.value === value ? "text-[#37352F] font-medium" : "text-[#5F5E5B]"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

interface TimeInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

function TimeInput({ value, onChange, disabled }: TimeInputProps) {
    return (
        <input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={cn(
                "px-2 py-1 text-sm text-[#5F5E5B] bg-transparent border border-[#E9E9E7] rounded",
                "hover:border-[#C8C7C5] focus:border-[#2383E2] focus:outline-none",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        />
    );
}

// ============================================================================
// Main Settings Page
// ============================================================================

export default function SettingsPage() {
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

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-[#787774]">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="pt-12 px-8 pb-16 max-w-xl mx-auto">
                {/* Header */}
                <h1 className="text-3xl font-bold text-[#37352F] mb-6 tracking-tight">Settings</h1>

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

                {/* Saving indicator */}
                {saving && (
                    <div className="fixed bottom-4 right-4 px-4 py-2 bg-[#37352F] text-white text-sm rounded-lg shadow-lg">
                        Saving...
                    </div>
                )}
            </div>
        </div>
    );
}
