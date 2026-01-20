'use client';

import React from 'react';
import { Users, BarChart3 } from 'lucide-react';

export type ProgressTab = 'overview' | 'reports';

interface ProgressTabBarProps {
    activeTab: ProgressTab;
    onTabChange: (tab: ProgressTab) => void;
}

const tabs: { id: ProgressTab; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    {
        id: 'overview',
        label: 'Team Overview',
        icon: <Users size={14} />,
    },
    {
        id: 'reports',
        label: 'Reports',
        icon: <BarChart3 size={14} />,
        disabled: true,
    },
];

export function ProgressTabBar({ activeTab, onTabChange }: ProgressTabBarProps) {
    return (
        <div className="px-8 ml-2 border-b border-[#E9E9E7]">
            <div className="flex items-center gap-1">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const isDisabled = tab.disabled;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => !isDisabled && onTabChange(tab.id)}
                            disabled={isDisabled}
                            className={`
                                flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors relative
                                ${isActive
                                    ? 'text-[#37352F]'
                                    : isDisabled
                                        ? 'text-[#9B9A97] cursor-not-allowed'
                                        : 'text-[#787774] hover:text-[#37352F]'
                                }
                            `}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            {isDisabled && (
                                <span className="ml-1 text-[10px] text-[#9B9A97] bg-[#F7F7F5] px-1.5 py-0.5 rounded">
                                    Soon
                                </span>
                            )}
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
