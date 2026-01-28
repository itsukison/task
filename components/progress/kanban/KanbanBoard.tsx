"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { KanbanProvider, KanbanBoard as Board, KanbanCards, KanbanHeader, KanbanItemProps, KanbanCard as UiKanbanCard } from "@/components/ui/kanban"
import { Task, TaskStatus } from "@/lib/types"
import { KanbanTaskContent } from "./KanbanCard"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth/hooks"
import TaskModal from "@/components/task-modal"

interface KanbanBoardProps {
    tasks: Task[]
    // members prop removed as filtering is handled by parent
}

// Extend KanbanItemProps to include our Task data
type KanbanTaskItem = KanbanItemProps & {
    task: Task
}

const COLUMNS = [
    { id: "planned", name: "Planned" },
    { id: "in_progress", name: "In Progress" },
    { id: "overrun", name: "Overrun" },
    { id: "completed", name: "Done" },
]

export function KanbanBoard({ tasks }: KanbanBoardProps) {
    const { currentOrg } = useAuth()
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)

    // Transform tasks to Kanban items
    // We need local state to handle drag interactions smoothly
    const [kanbanItems, setKanbanItems] = useState<KanbanTaskItem[]>([])

    // Sync from props (tasks are already filtered by parent)
    useEffect(() => {
        const items = tasks.map(task => ({
            id: task.id,
            name: task.title,
            column: task.status,
            task: task
        }))
        setKanbanItems(items)
    }, [tasks])

    const handleUpdateStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
        // ... existing implementation
        if (!currentOrg) return

        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', taskId)
                .eq('organization_id', currentOrg.id)

            if (error) throw error

            // Update local state to reflect change immediately
            setKanbanItems(prev => prev.map(item =>
                item.id === taskId
                    ? { ...item, column: newStatus, task: { ...item.task, status: newStatus } }
                    : item
            ))

        } catch (error) {
            console.error('Failed to update task status:', error)
        }
    }, [currentOrg])

    const handleDetailUpdate = async (updatedTask: Task) => {
        if (!currentOrg) return

        // Update local state immediately
        setKanbanItems(prev => prev.map(item =>
            item.id === updatedTask.id
                ? { ...item, name: updatedTask.title, column: updatedTask.status, task: updatedTask }
                : item
        ))

        if (selectedTask?.id === updatedTask.id) {
            setSelectedTask(updatedTask)
        }

        try {
            // We need to exclude UI-only fields or Join fields if the Task type has them, 
            // but assuming Task type maps 1:1 to DB for the fields we care about or handleTaskUpdate in Workspace handles it.
            // Let's mimic what Workspace page does: update specific fields.

            const { error } = await supabase
                .from('tasks')
                .update({
                    title: updatedTask.title,
                    description: updatedTask.description,
                    status: updatedTask.status,
                    expected_time: updatedTask.expectedTime, // Note: DB might be snake_case, let's double check types/supabase
                    actual_time: updatedTask.actualTime,
                    visibility: updatedTask.visibility,
                    // ownerIds might need a separate call if it's a join, but for now let's stick to basic fields
                })
                .eq('id', updatedTask.id)
                .eq('organization_id', currentOrg.id)

            if (error) throw error
        } catch (error) {
            console.error('Failed to update task details:', error)
        }
    }

    // Called when data changes (e.g. dragging over columns)
    const onDataChange = (newData: KanbanTaskItem[]) => {
        setKanbanItems(newData)
    }

    // Called when drag ends (drop)
    const onDragEnd = (event: any) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const activeItem = kanbanItems.find(i => i.id === activeId)

        if (activeItem) {
            // ensure we map column id to TaskStatus
            const newStatus = activeItem.column as TaskStatus
            // Call API
            handleUpdateStatus(String(activeId), newStatus)
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden relative">
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <KanbanProvider<KanbanTaskItem>
                    columns={COLUMNS}
                    data={kanbanItems}
                    onDataChange={onDataChange}
                    onDragEnd={onDragEnd}
                    className="h-full w-full min-w-[800px] p-4 pt-0"
                >
                    {(column) => (
                        <Board key={column.id} id={column.id} className="bg-transparent border-none shadow-none ring-0 w-full min-w-[200px]">
                            <KanbanHeader className="px-1 py-2 mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ColumnBadge columnId={column.id} count={kanbanItems.filter(i => i.column === column.id).length} />
                                </div>
                            </KanbanHeader>
                            <KanbanCards<KanbanTaskItem> id={column.id} className="px-3 gap-3 pb-4">
                                {(item) => (
                                    <UiKanbanCard
                                        key={item.id}
                                        id={item.id}
                                        name={item.name}
                                        column={item.column}
                                        className="bg-white hover:shadow-md transition-shadow duration-200 border-border/50"
                                    >
                                        <div onClick={() => setSelectedTask(item.task)} className="h-full">
                                            <KanbanTaskContent
                                                task={item.task && { ...item.task, status: item.column as TaskStatus }}
                                            />
                                        </div>
                                    </UiKanbanCard>
                                )}
                            </KanbanCards>
                        </Board>
                    )}
                </KanbanProvider>
            </div>

            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleDetailUpdate}
                />
            )}
        </div>
    )
}

function ColumnBadge({ columnId, count }: { columnId: string, count: number }) {
    let colorClass = "bg-gray-100 text-gray-600"
    let label = columnId

    switch (columnId) {
        case "planned":
            label = "Not started"
            colorClass = "bg-gray-100 text-gray-600"
            break
        case "in_progress":
            label = "In progress"
            colorClass = "bg-blue-100 text-blue-600"
            break
        case "completed":
            label = "Done"
            colorClass = "bg-green-100 text-green-600"
            break
        case "overrun":
            label = "Overrun"
            colorClass = "bg-red-100 text-red-600"
            break
    }

    return (
        <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${colorClass}`}>
                {label}
            </span>
            <span className="text-gray-400 text-xs">{count}</span>
        </div>
    )
}
