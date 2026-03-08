// Imports mostly cleaned up
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Task } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock } from "lucide-react"
import { useLanguage } from '@/lib/i18n';



export function KanbanTaskContent({ task }: { task: Task }) {
    const { t } = useLanguage();

    // Status Badge Color Map
    const statusColor = useMemo(() => {
        switch (task.status) {
            case "planned": return "bg-[#f1f1ef] text-[#787774] hover:bg-[#e8e8e6]"
            case "in_progress": return "bg-[#faebdd] text-[#d9730d] hover:bg-[#f5dec8]"
            case "completed": return "bg-[#edf3ec] text-[#448361] hover:bg-[#dcedd9]"
            case "overrun": return "bg-[#fdebec] text-[#eb5757] hover:bg-[#f9d7d9]"
            default: return "bg-[#f1f1ef] text-[#787774]"
        }
    }, [task.status])

    const statusLabel = useMemo(() => {
        switch (task.status) {
            case "in_progress": return t('tasks.status.in_progress')
            case "completed": return t('tasks.status.completed')
            case "planned": return t('tasks.status.planned')
            case "overrun": return t('tasks.status.overrun')
            default: return (task.status as string).replace("_", " ") // fallback
        }
    }, [task.status, t])

    return (
        <div className="flex flex-col gap-2">
            {/* Title */}
            <div className="font-medium text-sm text-[#37352F] line-clamp-2">
                {task.title}
            </div>

            {/* Metadata Row */}
            <div className="flex items-center justify-between mt-1">
                {/* Status Badge */}
                <div className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium capitalize", statusColor)}>
                    {statusLabel}
                </div>

                {/* Owners & Time */}
                <div className="flex items-center gap-2">
                    {/* Expected Time if > 0 */}
                    {task.expectedTime > 0 && (
                        <div className="flex items-center text-[10px] text-muted-foreground gap-0.5">
                            <Clock size={10} />
                            <span>{task.expectedTime}m</span>
                        </div>
                    )}

                    {/* Owners Avatars */}
                    {task.owners && task.owners.length > 0 && (
                        <div className="flex -space-x-1.5">
                            {task.owners.slice(0, 3).map((owner) => (
                                <Avatar key={owner.id} className="h-5 w-5 border border-white">
                                    {/*  Assume we might not have 'image' in OwnerProfile yet, falling back to initials */}
                                    <AvatarFallback className="text-[8px] bg-[#faebdd] text-[#d9730d]">
                                        {owner.display_name?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {task.owners.length > 3 && (
                                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 border border-white text-[8px] text-gray-600">
                                    +{task.owners.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
