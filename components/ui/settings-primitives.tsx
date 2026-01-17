'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Setting Layout Components
// ============================================================================

interface SettingSectionProps {
    title: string;
    children: React.ReactNode;
}

export function SettingSection({ title, children }: SettingSectionProps) {
    return (
        <div className="mb-8">
            <h2 className="text-base font-semibold text-[#37352F] pb-2 border-b border-[#E9E9E7]">{title}</h2>
            <div>{children}</div>
        </div>
    );
}

interface SettingRowProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
}

export function SettingRow({ title, description, children }: SettingRowProps) {
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

// ============================================================================
// Setting Input Components
// ============================================================================

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                checked ? "bg-[#F97316]" : "bg-[#DCDCDC]",
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

export function SelectDropdown<T extends string>({ value, options, onChange, disabled }: SelectDropdownProps<T>) {
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

export function TimeInput({ value, onChange, disabled }: TimeInputProps) {
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
