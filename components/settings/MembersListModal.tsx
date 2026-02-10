'use client';

import { useState } from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/hooks';
import { useOrganizationMembers } from '@/lib/hooks/use-organization-members';
import { useJoinRequests } from '@/lib/hooks/use-join-requests';
import { useLanguage } from '@/lib/i18n';
import { MemberRole } from '@/lib/types';
import { SelectDropdown } from '@/components/ui/settings-primitives';
import { cn } from '@/lib/utils';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface MembersListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MembersListModal({ isOpen, onClose }: MembersListModalProps) {
    const { t } = useLanguage();
    const { currentOrg, user: currentUser } = useAuth();
    const { membersWithVisibility, loading: membersLoading, updateMemberRole, removeMember } = useOrganizationMembers();
    const { requests, loading: requestsLoading, acceptRequest, rejectRequest } = useJoinRequests();

    // Confirmation state for existing members
    const [confirmAction, setConfirmAction] = useState<{
        type: 'role' | 'remove';
        userId: string;
        data?: { newRole: MemberRole; isSelf?: boolean };
    } | null>(null);

    // Confirmation state for requests (optional? maybe just accept/reject directly)
    // Let's do direct action for requests for speed, or maybe confirm reject?
    // User asked for "manage members button notification banner, which when clicked, opens up the member list as usual but showing the option to accept or reject the new member at the top of the list"

    if (!isOpen) return null;

    const isLeader = currentOrg?.role === 'leader';
    const loading = membersLoading || requestsLoading;

    // Use translations for role options
    const roleOptions: { value: MemberRole; label: string }[] = [
        { value: 'leader', label: t('members.role_leader') },
        { value: 'employee', label: t('members.role_employee') },
    ];

    const handleRoleChangeRequest = (userId: string, newRole: MemberRole) => {
        if (userId === currentUser?.id) {
            setConfirmAction({
                type: 'role',
                userId,
                data: { newRole, isSelf: true }
            });
        } else {
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
            alert(t('common.error'));
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
                                {t('members.title')}
                            </h2>
                            <p className="text-sm text-[#787774]">
                                {t('members.subtitle', { count: membersWithVisibility.length, org: currentOrg?.name || '' })}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 text-[#9B9A97] hover:text-[#37352F] transition-colors rounded hover:bg-[#EFEFED]"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Pending Requests Banner / Section */}
                    {isLeader && requests.length > 0 && (
                        <div className="px-6 py-3 bg-accent/5 border-b border-accent/10">
                            <h3 className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
                                {t('members.pending_requests', { count: requests.length })}
                            </h3>
                            <div className="space-y-1">
                                {requests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="flex items-center justify-between py-2 px-3 bg-white border border-[#E9E9E7] rounded-md shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFEFED] text-[#5F5E5B] border border-[#E9E9E7] text-xs font-medium">
                                                {request.user?.display_name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-[#37352F]">
                                                    {request.user?.display_name || t('members.unknown_user')}
                                                </div>
                                                <div className="text-xs text-[#787774]">
                                                    {request.user?.email}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => acceptRequest(request.id, request.userId)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-medium rounded hover:bg-accent-dark transition-colors"
                                            >
                                                <Check size={14} />
                                                {t('members.accept')}
                                            </button>
                                            <button
                                                onClick={() => rejectRequest(request.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E9E9E7] text-[#5F5E5B] text-xs font-medium rounded hover:bg-[#F7F6F3] transition-colors"
                                            >
                                                <X size={14} />
                                                {t('members.reject')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                                                        {member.displayName || t('members.unknown_user')}
                                                    </span>
                                                    {member.id === currentUser?.id && (
                                                        <span className="text-[10px] text-[#787774] bg-[#EFEFED] px-1.5 py-0.5 rounded-full">
                                                            {t('members.you')}
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
                                                            title={t('members.remove_tooltip')}
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
                                                    {member.role === 'leader' ? t('members.role_leader') : t('members.role_employee')}
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
                title={confirmAction?.type === 'remove' ? t('members.confirm_remove_title') : t('members.confirm_role_change_title')}
                description={
                    confirmAction?.type === 'remove'
                        ? t('members.confirm_remove_desc')
                        : t('members.confirm_demote_self_desc')
                }
                confirmLabel={confirmAction?.type === 'remove' ? t('members.remove') : t('common.confirm')}
                isDangerous={true}
                onConfirm={executeAction}
                onCancel={() => setConfirmAction(null)}
            />
        </>
    );
}
