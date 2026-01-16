'use client';

import React, { useState } from 'react';
import { isValidInviteCodeFormat } from '@/lib/utils/invite-codes';

interface JoinOrgFormProps {
    loading: boolean;
    onSubmit: (inviteCode: string) => Promise<void>;
    onError: (message: string) => void;
}

export function JoinOrgForm({ loading, onSubmit, onError }: JoinOrgFormProps) {
    const [inviteCode, setInviteCode] = useState('');

    // Format invite code as user types (XXX-XXX-XXX)
    const handleInviteCodeChange = (value: string) => {
        // Remove non-alphanumeric characters
        const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Add dashes at appropriate positions
        let formatted = '';
        for (let i = 0; i < cleaned.length && i < 9; i++) {
            if (i === 3 || i === 6) {
                formatted += '-';
            }
            formatted += cleaned[i];
        }

        setInviteCode(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValidInviteCodeFormat(inviteCode)) {
            onError('Please enter a valid invite code (format: XXX-XXX-XXX)');
            return;
        }

        await onSubmit(inviteCode);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-[#37352F] mb-1">
                    Invite Code
                </label>
                <input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => handleInviteCodeChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#E9E9E7] rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-[#37352F] font-mono text-center tracking-wider"
                    placeholder="ABC-123-XYZ"
                    disabled={loading}
                    autoFocus
                    maxLength={11}
                />
                <p className="mt-1 text-xs text-[#787774]">
                    Ask your team leader for an invite code
                </p>
            </div>

            <button
                type="submit"
                disabled={loading || inviteCode.length < 11}
                className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Joining...' : 'Join Organization'}
            </button>
        </form>
    );
}
