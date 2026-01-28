'use client';

import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/hooks';
import { useOrganizationMembers } from '@/lib/hooks/use-organization-members';
import { MemberRole } from '@/lib/types';
import { SelectDropdown } from '@/components/ui/settings-primitives';
import { cn } from '@/lib/utils';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface MembersListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MembersListModal({ isOpen, onClose }: MembersListModalProps) {
    const { currentOrg, user: currentUser } = useAuth();
    const { membersWithVisibility, loading, updateMemberRole, removeMember } = useOrganizationMembers();

    // Confirmation state
    const [confirmAction, setConfirmAction] = useState<{
        type: 'role' | 'remove';
        userId: string;
        data?: { newRole: MemberRole; isSelf?: boolean };
    } | null>(null);

    if (!isOpen) return null;

    const isLeader = currentOrg?.role === 'leader';
    const roleOptions: { value: MemberRole; label: string }[] = [
        { value: 'leader', label: 'Leader' },
        { value: 'employee', label: 'Employee' },
    ];

    const handleRoleChangeRequest = (userId: string, newRole: MemberRole) => {
        if (userId === currentUser?.id) {
            setConfirmAction({
                type: 'role',
                userId,
                data: { newRole, isSelf: true }
            });
        } else {
            // Direct update for others is fine, but maybe good to confirm?
            // For now, let's confirm for important changes
            updateMemberRole(userId, newRole);
        }
    };

    const handleRemoveRequest = (userId: string) => {
        setConfirmAction({
            type: 'remove',
            userId
        });
    };

    const executeAction = async () => {
        if (!confirmAction) return;

        try {
            if (confirmAction.type === 'role' && confirmAction.data) {
                await updateMemberRole(confirmAction.userId, confirmAction.data.newRole);
            } else if (confirmAction.type === 'remove') {
                await removeMember(confirmAction.userId);
            }
        } catch (error) {
            console.error(error);
            alert('Action failed');
        } finally {
            setConfirmAction(null);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-[90] backdrop-blur-[2px] transition-all duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                <div
                    className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9E9E7]">
                        <div>
                            <h2 className="text-lg font-semibold text-[#37352F]">
                                Manage Members
                            </h2>
                            <p className="text-sm text-[#787774]">
                                {membersWithVisibility.length} members in {currentOrg?.name}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 text-[#9B9A97] hover:text-[#37352F] transition-colors rounded hover:bg-[#EFEFED]"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-12 bg-gray-100 rounded" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {membersWithVisibility.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between py-3 group border-b border-[#F7F7F5] last:border-0"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {/* Avatar / Icon */}
                                            <div className={cn(
                                                "flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium",
                                                "bg-[#EFEFED] text-[#5F5E5B] border border-[#E9E9E7]"
                                            )}>
                                                {member.displayName?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || '?'}
                                            </div>

                                            {/* Info */}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-[#37352F] truncate">
                                                        {member.displayName || 'Unknown Name'}
                                                    </span>
                                                    {member.id === currentUser?.id && (
                                                        <span className="text-[10px] text-[#787774] bg-[#EFEFED] px-1.5 py-0.5 rounded-full">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-[#787774] truncate">
                                                    {member.email}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {isLeader ? (
                                                <>
                                                    <SelectDropdown
                                                        value={member.role}
                                                        options={roleOptions}
                                                        onChange={(val) => handleRoleChangeRequest(member.id, val as MemberRole)}
                                                        disabled={member.id === currentUser?.id && membersWithVisibility.filter(m => m.role === 'leader').length === 1}
                                                    />

                                                    {member.id !== currentUser?.id && (
                                                        <button
                                                            onClick={() => handleRemoveRequest(member.id)}
                                                            className="p-1.5 text-[#9B9A97] hover:text-[#EB5757] hover:bg-[#EB5757]/10 rounded transition-colors"
                                                            title="Remove member"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <span className={cn(
                                                    "px-2 py-0.5 text-xs font-medium rounded",
                                                    member.role === 'leader'
                                                        ? "bg-accent/10 text-accent"
                                                        : "bg-[#EFEFED] text-[#5F5E5B]"
                                                )}>
                                                    {member.role === 'leader' ? 'Leader' : 'Employee'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Dialogs */}
            <ConfirmationModal
                isOpen={!!confirmAction}
                title={confirmAction?.type === 'remove' ? 'Remove Member' : 'Change Role'}
                description={
                    confirmAction?.type === 'remove'
                        ? "Are you sure you want to remove this member from the organization? They will lose access to all tasks and data immediately."
                        : "If you demote yourself to Employee, you will lose access to organization settings and member management."
                }
                confirmLabel={confirmAction?.type === 'remove' ? 'Remove' : 'Confirm'}
                isDangerous={true}
                onConfirm={executeAction}
                onCancel={() => setConfirmAction(null)}
            />
        </>
    );
}
