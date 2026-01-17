'use client';

import { SettingSection, SettingRow } from '@/components/ui/settings-primitives';
import { Skeleton } from '@/components/ui/skeleton';

export function SettingsSkeleton() {
    return (
        <div className="animate-in fade-in-50">
            {/* Appearance Section */}
            <SettingSection title="Appearance">
                <SettingRow
                    title={<Skeleton className="h-3.5 w-16" />}
                    description={<Skeleton className="h-2.5 w-48" />}
                >
                    <Skeleton className="h-7 w-24" />
                </SettingRow>
            </SettingSection>

            {/* Work Hours Section */}
            <SettingSection title="Work Hours">
                <SettingRow
                    title={<Skeleton className="h-3.5 w-24" />}
                    description={<Skeleton className="h-2.5 w-56" />}
                >
                    <Skeleton className="h-7 w-24" />
                </SettingRow>
                <SettingRow
                    title={<Skeleton className="h-3.5 w-24" />}
                    description={<Skeleton className="h-2.5 w-64" />}
                >
                    <Skeleton className="h-7 w-24" />
                </SettingRow>
            </SettingSection>

            {/* Privacy & Visibility Section */}
            <SettingSection title="Privacy & Visibility">
                <SettingRow
                    title={<Skeleton className="h-3.5 w-32" />}
                    description={<Skeleton className="h-2.5 w-40" />}
                >
                    <Skeleton className="h-7 w-32" />
                </SettingRow>
                <SettingRow
                    title={<Skeleton className="h-3.5 w-36" />}
                    description={<Skeleton className="h-2.5 w-44" />}
                >
                    <Skeleton className="h-7 w-32" />
                </SettingRow>
            </SettingSection>

            {/* Account Section */}
            <SettingSection title="Account">
                <SettingRow
                    title={<Skeleton className="h-3.5 w-20" />}
                    description={<Skeleton className="h-2.5 w-40" />}
                >
                    <Skeleton className="h-7 w-48" />
                </SettingRow>
                <SettingRow
                    title={<Skeleton className="h-3.5 w-12" />}
                    description={<Skeleton className="h-2.5 w-32" />}
                >
                    <Skeleton className="h-3.5 w-36" />
                </SettingRow>
            </SettingSection>

            {/* Organization Section */}
            <SettingSection title="Organization">
                <SettingRow
                    title={<Skeleton className="h-3.5 w-28" />}
                    description={<Skeleton className="h-2.5 w-48" />}
                >
                    <Skeleton className="h-3.5 w-24" />
                </SettingRow>
                <SettingRow
                    title={<Skeleton className="h-3.5 w-16" />}
                    description={<Skeleton className="h-2.5 w-44" />}
                >
                    <Skeleton className="h-5 w-16 rounded" />
                </SettingRow>
            </SettingSection>
        </div>
    );
}
