'use client';

import React from 'react';

export interface MemberStats {
    memberId: string;
    memberName: string;
    memberEmail: string;
    tasksToday: number;
    tasksLeft: number;
    estimatedMinutes: number;
    actualMinutes: number;
}

interface TeamOverviewTableProps {
    memberStats: MemberStats[];
    onMemberClick: (memberId: string) => void;
    loading?: boolean;
}

// Get initials from display name
function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

// Format minutes to hours display (e.g., "2.5h" or "45m")
function formatTime(minutes: number): string {
    if (minutes === 0) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
}

export function TeamOverviewTable({
    memberStats,
    onMemberClick,
    loading = false,
}: TeamOverviewTableProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-sm text-[#787774]">Loading team data...</div>
            </div>
        );
    }

    if (memberStats.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-sm text-[#787774]">No team members found</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-[#E9E9E7] overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-[#F7F7F5] border-b border-[#E9E9E7] text-xs text-[#787774] font-medium">
                    <tr>
                        <th className="px-6 py-3">Members</th>
                        <th className="px-6 py-3 text-center">Tasks Today</th>
                        <th className="px-6 py-3 text-center">Tasks Left</th>
                        <th className="px-6 py-3 text-right">Est. Time</th>
                        <th className="px-6 py-3 text-right">Act. Time</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E9E7]">
                    {memberStats.map((member) => (
                        <tr
                            key={member.memberId}
                            onClick={() => onMemberClick(member.memberId)}
                            className="hover:bg-[#F7F7F5] cursor-pointer transition-colors"
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-medium">
                                        {getInitials(member.memberName)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-[#37352F]">{member.memberName}</div>
                                        <div className="text-xs text-[#9B9A97]">{member.memberEmail}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className="text-[#37352F] font-medium">{member.tasksToday}</span>
                                <span className="text-[#9B9A97] ml-1 text-sm">tasks</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                {member.tasksLeft > 0 ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                        {member.tasksLeft} left
                                    </span>
                                ) : member.tasksToday > 0 ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Done
                                    </span>
                                ) : (
                                    <span className="text-[#9B9A97] text-sm">—</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-sm text-[#37352F]">
                                {member.estimatedMinutes > 0 ? formatTime(member.estimatedMinutes) : '—'}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-sm text-[#37352F]">
                                {member.actualMinutes > 0 ? formatTime(member.actualMinutes) : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
