'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, MoreHorizontal, ArrowUpRight, Check, PenLine, ExternalLink, RefreshCw, Bot, Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/lib/i18n';

// Local types reflecting Supabase structure
type WorkflowStep = {
    id?: string;
    order_index: number;
    instruction: string;
};

type Workflow = {
    id: string;
    name: string;
    description: string;
    site: string;
    created_at: string;
    workflow_steps?: WorkflowStep[];
};

interface WorkflowModalProps {
    workflow: Workflow;
    onClose: () => void;
    onUpdate: (updatedWorkflow: Workflow) => void;
    onDelete?: (id: string) => void;
}

export default function WorkflowModal({ workflow, onClose, onUpdate, onDelete }: WorkflowModalProps) {
    const { t } = useLanguage();

    // Mutable state for the entire workflow
    const [editedWorkflow, setEditedWorkflow] = useState<Workflow>(workflow);

    // UI state
    const [isEditingSteps, setIsEditingSteps] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Keep edited values in sync if the incoming prop changes (rare)
    useEffect(() => {
        setEditedWorkflow(workflow);
    }, [workflow]);

    const handleChange = (field: keyof Workflow, value: string) => {
        setEditedWorkflow((prev) => ({ ...prev, [field]: value }));
    };

    const handleStepChange = (index: number, newInstruction: string) => {
        setEditedWorkflow((prev) => {
            const newSteps = [...(prev.workflow_steps || [])];
            newSteps[index] = { ...newSteps[index], instruction: newInstruction };
            return { ...prev, workflow_steps: newSteps };
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/workflows/${workflow.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editedWorkflow.name,
                    description: editedWorkflow.description,
                    site: editedWorkflow.site,
                    steps: editedWorkflow.workflow_steps?.map((s, idx) => ({
                        order_index: idx,
                        instruction: s.instruction
                    })) || []
                }),
            });
            if (!res.ok) throw new Error('Failed to update workflow');

            const data = await res.json();
            // Call onUpdate to refresh the parent view
            if (data.success && data.workflow) {
                onUpdate(data.workflow);
            }
            setIsEditingSteps(false);
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save workflow changes.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!editedWorkflow) return null;

    return (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center backdrop-blur-[2px] transition-all duration-300" onClick={onClose}>
            <div
                className="bg-white w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                onClick={e => e.stopPropagation()}
            >
                {/* Top Actions */}
                <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                    <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors">
                        <ArrowUpRight size={18} />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors">
                        <MoreHorizontal size={18} />
                    </button>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Breadcrumb */}
                <div className="px-12 pt-10 pb-2 text-xs text-[#9B9A97] flex items-center gap-1.5">
                    <span>{t('navigation.workspace')}</span>
                    <span className="text-gray-300">/</span>
                    <span>Workflows</span>
                    <span className="text-gray-300">/</span>
                    <span>{editedWorkflow.id.substring(0, 4)}...</span>
                </div>

                <div className="flex-1 overflow-y-auto px-12 pb-12 custom-scrollbar">

                    {/* Header Title */}
                    <div className="mt-4 mb-4">
                        <input
                            type="text"
                            value={editedWorkflow.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="text-4xl font-bold text-[#37352F] w-full outline-none placeholder-gray-300 bg-transparent"
                            placeholder="Workflow Name"
                        />
                    </div>

                    {/* Properties Grid */}
                    <div className="flex flex-col gap-3 mb-8 max-w-2xl">

                        {/* Target Site */}
                        <div className="flex items-center min-h-[32px]">
                            <div className="w-36 flex items-center gap-2 text-[#787774] text-sm shrink-0">
                                <ExternalLink size={16} /> Target Site
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={editedWorkflow.site}
                                    onChange={(e) => handleChange('site', e.target.value)}
                                    className="appearance-none px-2 py-1 w-full bg-transparent outline-none hover:bg-gray-50 rounded transition-colors text-sm text-[#37352F]"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="flex items-start min-h-[32px]">
                            <div className="w-36 flex items-center gap-2 text-[#787774] text-sm mt-1 shrink-0">
                                <Bot size={16} /> Description
                            </div>
                            <div className="flex-1">
                                <textarea
                                    value={editedWorkflow.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    className="appearance-none px-2 py-1 w-full bg-transparent outline-none hover:bg-gray-50 rounded transition-colors text-sm text-[#37352F] resize-none min-h-[60px]"
                                />
                            </div>
                        </div>

                    </div>

                    <div className="h-px bg-[#E9E9E7] w-full mb-8"></div>

                    {/* Content Area - Execution Steps (Skills) */}
                    <div className="relative group">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-[#37352F] flex items-center gap-2">
                                <Bot className="w-5 h-5 text-[#d76c33]" />
                                Execution Steps (SKILL.md)
                            </h3>
                            <button
                                onClick={() => isEditingSteps ? handleSave() : setIsEditingSteps(true)}
                                disabled={isSaving}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isEditingSteps
                                    ? 'bg-[#d76c33]/10 text-[#d76c33] hover:bg-[#d76c33]/20'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-[#E9E9E7]'
                                    }`}
                            >
                                {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> :
                                    isEditingSteps ? <><Check className="w-4 h-4" /> Save Instructions</> :
                                        <><PenLine className="w-4 h-4" /> Edit Instructions</>}
                            </button>
                        </div>

                        <div className="bg-[#F7F7F5] border border-[#E9E9E7] rounded-xl p-6">
                            <ul className="space-y-4">
                                {(editedWorkflow.workflow_steps || []).sort((a, b) => a.order_index - b.order_index).map((step, idx) => (
                                    <li key={step.id || idx} className="flex items-start gap-4 text-sm group">
                                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white border border-[#E9E9E7] text-[#787774] text-xs font-medium mt-0.5">
                                            {idx + 1}
                                        </span>
                                        <div className="w-full relative">
                                            {isEditingSteps ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={step.instruction}
                                                        onChange={(e) => handleStepChange(idx, e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            setEditedWorkflow(prev => {
                                                                const newSteps = (prev.workflow_steps || []).filter((_, i) => i !== idx).map((s, i) => ({ ...s, order_index: i }));
                                                                return { ...prev, workflow_steps: newSteps };
                                                            });
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-[#37352F] pt-1 leading-relaxed w-full whitespace-pre-wrap">
                                                    {step.instruction.split(/(\{.*?\})/).map((part, i) =>
                                                        part.startsWith('{') && part.endsWith('}') ? (
                                                            <span key={i} className="text-[#d76c33] bg-[#d76c33]/10 px-1.5 py-0.5 rounded border border-[#d76c33]/20 font-medium whitespace-nowrap">
                                                                {part}
                                                            </span>
                                                        ) : (
                                                            part
                                                        )
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                                {isEditingSteps && (
                                    <button
                                        onClick={() => {
                                            setEditedWorkflow(prev => {
                                                const newSteps = [...(prev.workflow_steps || []), { order_index: (prev.workflow_steps || []).length, instruction: '' }];
                                                return { ...prev, workflow_steps: newSteps };
                                            });
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFED] rounded mt-2 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Add Step
                                    </button>
                                )}
                            </ul>
                        </div>
                    </div>

                    {isEditingSteps && (
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#d76c33] hover:bg-[#c4612c] disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                            >
                                {isSaving ? <><RefreshCw className="animate-spin w-4 h-4" /> Saving...</> : <><Check className="w-4 h-4" /> Confirm & Save Steps</>}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div >
    );
}
