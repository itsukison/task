'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useOrganizationMembers } from '@/lib/hooks/use-organization-members';
import { useTeamTasks } from '@/lib/hooks/use-team-tasks';
import {
    ProgressHeader,
    ProgressTabBar,
    TeamOverviewTable,
    TasksReportTable,
    MemberTasksModal,
    type ProgressTab,
    type MemberStats,
} from '@/components/progress';

// Format date to local ISO string (YYYY-MM-DD) accounting for timezone
function formatDateToLocalISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function ProgressPage() {
    // State
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ProgressTab>('overview');

    // Format date for query
    const selectedDateISO = formatDateToLocalISO(selectedDate);

    // Fetch data
    const { members, loading: membersLoading } = useOrganizationMembers();
    const { teamTasks, loading: tasksLoading, error } = useTeamTasks({
        scheduledDate: selectedDateISO,
    });

    // Calculate member stats
    const memberStats = useMemo<MemberStats[]>(() => {
        return members.map((member) => {
            const memberTasks = teamTasks.filter((t) => t.ownerId === member.id);

            // Find in_progress tasks, sorted by most recently updated first
            const inProgressTasks = memberTasks
                .filter((t) => t.status === 'in_progress')
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .map((t) => ({ id: t.id, title: t.title }));

            return {
                memberId: member.id,
                memberName: member.displayName,
                memberEmail: member.email,
                tasksToday: memberTasks.length,
                tasksLeft: memberTasks.filter((t) =>
                    ['planned', 'in_progress', 'overrun'].includes(t.status)
                ).length,
                estimatedMinutes: memberTasks.reduce((sum, t) => sum + t.expectedTime, 0),
                actualMinutes: memberTasks.reduce((sum, t) => sum + (t.actualTime || 0), 0),
                currentTasks: inProgressTasks,
            };
        });
    }, [members, teamTasks]);

    // Find selected member for modal
    const selectedMember = selectedMemberId
        ? members.find((m) => m.id === selectedMemberId)
        : null;

    const selectedMemberTasks = selectedMemberId
        ? teamTasks.filter((t) => t.ownerId === selectedMemberId)
        : [];

    // Loading state
    const isLoading = membersLoading || tasksLoading;

    return (
        <div className="flex flex-col h-full w-full bg-white">
            {/* Header */}
            <ProgressHeader
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
            />

            {/* Tab Bar */}
            <ProgressTabBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* Content */}
            <div className="flex-1 overflow-auto p-8 ml-2">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {activeTab === 'overview' && (
                    <TeamOverviewTable
                        memberStats={memberStats}
                        onMemberClick={setSelectedMemberId}
                        loading={isLoading}
                    />
                )}

                {activeTab === 'reports' && (
                    <TasksReportTable
                        tasks={teamTasks}
                        loading={isLoading}
                    />
                )}
            </div>

            {/* Member Tasks Modal */}
            {selectedMember && (
                <MemberTasksModal
                    member={selectedMember}
                    tasks={selectedMemberTasks}
                    selectedDate={selectedDate}
                    onClose={() => setSelectedMemberId(null)}
                />
            )}
        </div>
    );
}
