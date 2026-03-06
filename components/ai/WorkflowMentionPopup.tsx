'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useCurrentOrg } from '@/lib/auth/hooks';

interface Workflow {
    id: string;
    name: string;
    description: string;
    site: string;
}

interface WorkflowMentionPopupProps {
    query: string;
    onSelect: (workflow: Workflow) => void;
    position: { top: number; left: number } | null;
}

export function WorkflowMentionPopup({ query, onSelect, position }: WorkflowMentionPopupProps) {
    const currentOrg = useCurrentOrg();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!position || !currentOrg) return;

        // In a real app we'd debounce this or just fetch all once and filter client-side
        // For MVP, fetch all and filter
        const fetchWorkflows = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/workflows?workspaceId=${currentOrg.id}`);
                if (res.ok) {
                    const data = await res.json();
                    // Filter by query (case-insensitive)
                    const filtered = data.filter((wf: Workflow) =>
                        wf.name.toLowerCase().includes(query.toLowerCase()) ||
                        wf.site.toLowerCase().includes(query.toLowerCase())
                    );
                    setWorkflows(filtered);
                }
            } catch (err) {
                console.error('Failed to fetch workflows for popup:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkflows();
    }, [query, position]);

    if (!position) return null;

    return (
        <div
            className="absolute z-50 w-80 bg-white border border-[#E9E9E7] rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{
                bottom: '100%',
                left: 0,
                marginBottom: '8px'
            }}
        >
            <div className="px-3 py-2 flex justify-between items-center">
                <span className="text-xs font-semibold text-[#787774]">Workflows</span>
                {loading && <Loader2 className="w-3 h-3 animate-spin text-[#d76c33]" />}
            </div>

            <div className="max-h-48 overflow-y-auto">
                {!loading && workflows.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[#787774] text-center">
                        No workflows found matching "{query}"
                    </div>
                ) : (
                    <ul className="py-1">
                        {workflows.map((wf) => (
                            <li key={wf.id}>
                                <button
                                    onClick={() => onSelect(wf)}
                                    className="w-full text-left px-3 py-2.5 hover:bg-[#F7F7F5] transition-colors group flex items-start gap-2"
                                >
                                    <div className="text-sm font-medium text-[#37352F] group-hover:text-[#111111] truncate w-full">
                                        {wf.name}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
