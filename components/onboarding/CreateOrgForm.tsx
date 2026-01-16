'use client';

import React, { useState } from 'react';

interface CreateOrgFormProps {
    loading: boolean;
    onSubmit: (orgName: string) => Promise<void>;
}

export function CreateOrgForm({ loading, onSubmit }: CreateOrgFormProps) {
    const [orgName, setOrgName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgName.trim()) return;
        await onSubmit(orgName);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-[#37352F] mb-1">
                    Organization Name
                </label>
                <input
                    id="orgName"
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#E9E9E7] rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-[#37352F]"
                    placeholder="My Team"
                    disabled={loading}
                    autoFocus
                />
                <p className="mt-1 text-xs text-[#787774]">
                    You'll be the leader of this organization
                </p>
            </div>

            <button
                type="submit"
                disabled={loading || !orgName.trim()}
                className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Creating...' : 'Create Organization'}
            </button>
        </form>
    );
}
