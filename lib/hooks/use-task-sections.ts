import { useMemo } from 'react';
import { addDays } from 'date-fns';
import { Task, CalendarBlock } from '@/lib/types';
import { FilterRule, evaluateFilterRules } from '@/lib/utils/filterRules';
import { SortConfig } from '@/lib/types';
import { formatDateToLocalISO, getRelativeDayLabel } from '@/lib/utils/task-helpers';

export type TaskWithExtras = Task & {
    ownerIds: string[];
    startTime?: string;
    parentCompleted?: boolean;
};

export type DaySection = {
    date: Date;
    dateKey: string;
    title: string;
    tasks: TaskWithExtras[];
};

export interface UseTaskSectionsProps {
    tasks: Task[];
    calendarBlocks: CalendarBlock[];
    selectedDate: Date;
    anchorDate: Date;
    searchQuery?: string;
    filterRules?: FilterRule[];
    sortConfig?: SortConfig | null;
    previewTask?: Partial<Task> & { id: string; scheduledDate?: string | null; owners?: any[] } | null;
    isDraggingTaskRow?: boolean;
    draggingTask?: Task | null;
    dragOverDateKey?: string | null;
    expandedParentIds: Set<string>;
    t: any; // Translation function
}

export function useTaskSections({
    tasks,
    calendarBlocks,
    selectedDate,
    anchorDate,
    searchQuery,
    filterRules,
    sortConfig,
    previewTask,
    isDraggingTaskRow,
    draggingTask,
    dragOverDateKey,
    expandedParentIds,
    t
}: UseTaskSectionsProps) {
    const selectedDateKey = useMemo(() => formatDateToLocalISO(selectedDate), [selectedDate]);
    const todayKey = useMemo(() => formatDateToLocalISO(new Date()), []);

    const dayRange = useMemo(() => {
        return Array.from({ length: 61 }, (_, index) => {
            const date = addDays(anchorDate, index - 30);
            return {
                date,
                dateKey: formatDateToLocalISO(date),
            };
        });
    }, [anchorDate]);

    const dayTitleFormatter = useMemo(() => {
        return new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    }, []);

    const dayTitleWithYearFormatter = useMemo(() => {
        return new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }, []);

    const blockStartTimeByTaskId = useMemo(() => {
        const blockMap = new Map<string, string>();
        calendarBlocks.forEach((block) => {
            if (!blockMap.has(block.taskId)) {
                blockMap.set(block.taskId, block.startTime);
            }
        });
        return blockMap;
    }, [calendarBlocks]);

    // All tasks as TaskWithExtras
    const allTasksWithExtras = useMemo((): TaskWithExtras[] => {
        return tasks.map(t => ({
            ...t,
            ownerIds: t.owners?.map((o: any) => o.id) || [],
            startTime: blockStartTimeByTaskId.get(t.id),
        }));
    }, [tasks, blockStartTimeByTaskId]);

    // Subtasks grouped by parent ID
    const subtasksByParentId = useMemo((): Map<string, TaskWithExtras[]> => {
        const map = new Map<string, TaskWithExtras[]>();
        allTasksWithExtras.forEach(t => {
            if (t.parentTaskId) {
                const list = map.get(t.parentTaskId) ?? [];
                list.push(t);
                map.set(t.parentTaskId, list);
            }
        });
        return map;
    }, [allTasksWithExtras]);

    // Count of subtasks per parent task
    const subtaskCountMap = useMemo((): Map<string, number> => {
        const map = new Map<string, number>();
        subtasksByParentId.forEach((children, parentId) => {
            map.set(parentId, children.length);
        });
        return map;
    }, [subtasksByParentId]);

    const sortedFilteredTasks = useMemo((): TaskWithExtras[] => {
        // Only top-level tasks
        let result = [...tasks].filter(t => !t.parentTaskId) as TaskWithExtras[];

        if (filterRules && filterRules.length > 0) {
            result = result.filter(t => evaluateFilterRules(t, filterRules));
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.owners?.some((o: any) => o.display_name?.toLowerCase().includes(query))
            );
        }

        const enrichedTasks = result.map(t => ({
            ...t,
            ownerIds: t.owners?.map((o: any) => o.id) || [],
            startTime: blockStartTimeByTaskId.get(t.id),
        }));

        if (!sortConfig) {
            enrichedTasks.sort((a, b) => {
                if (a.startTime && !b.startTime) return -1;
                if (!a.startTime && b.startTime) return 1;
                if (a.startTime && b.startTime) {
                    return a.startTime.localeCompare(b.startTime);
                }
                return 0;
            });
        }

        return enrichedTasks;
    }, [tasks, filterRules, searchQuery, sortConfig, blockStartTimeByTaskId]);

    const daySections = useMemo((): DaySection[] => {
        const tasksByDate = new Map<string, TaskWithExtras[]>();
        sortedFilteredTasks.forEach(task => {
            if (!task.scheduledDate) return;
            const bucket = tasksByDate.get(task.scheduledDate) ?? [];
            bucket.push(task);
            tasksByDate.set(task.scheduledDate, bucket);
        });

        if (previewTask?.scheduledDate) {
            const previewWithExtras: TaskWithExtras = {
                ...previewTask,
                ownerIds: previewTask.owners?.map(o => o.id) || [],
                startTime: blockStartTimeByTaskId.get(previewTask.id as string),
            } as TaskWithExtras;
            const previewBucket = tasksByDate.get(previewTask.scheduledDate) ?? [];
            tasksByDate.set(previewTask.scheduledDate, [previewWithExtras, ...previewBucket]);
        }

        const currentYear = new Date().getFullYear();

        const completedParentIds = new Set(
            sortedFilteredTasks.filter(task => task.status === 'completed').map(task => task.id)
        );

        return dayRange.map(({ date, dateKey }) => {
            const relativeLabel = getRelativeDayLabel(date, new Date(todayKey));
            const title = relativeLabel ? t(`common.${relativeLabel}`) : (date.getFullYear() === currentYear
                ? dayTitleFormatter.format(date)
                : dayTitleWithYearFormatter.format(date));

            const rawTopLevelTasks = tasksByDate.get(dateKey) ?? [];
            const topLevelTasks = rawTopLevelTasks.filter(task => {
                if (!isDraggingTaskRow || !draggingTask || !dragOverDateKey) return true;
                if (dragOverDateKey === dateKey) return true;
                return task.id !== draggingTask.id;
            });

            // Interleave subtasks after their expanded parents
            const interleaved: TaskWithExtras[] = [];
            topLevelTasks.forEach(task => {
                interleaved.push(task);
                if (expandedParentIds.has(task.id)) {
                    const children = subtasksByParentId.get(task.id) ?? [];
                    const parentCompleted = completedParentIds.has(task.id);
                    interleaved.push(
                        ...children.map(child => ({
                            ...child,
                            parentCompleted,
                        }))
                    );
                }
            });

            return {
                date,
                dateKey,
                title,
                tasks: interleaved,
            };
        });
    }, [dayRange, sortedFilteredTasks, previewTask, blockStartTimeByTaskId, dayTitleFormatter, dayTitleWithYearFormatter, todayKey, t, expandedParentIds, subtasksByParentId, isDraggingTaskRow, draggingTask, dragOverDateKey]);

    const selectedDayTaskCount = useMemo(() => {
        const selectedSection = daySections.find(section => section.dateKey === selectedDateKey);
        return selectedSection?.tasks.length ?? 0;
    }, [daySections, selectedDateKey]);

    return {
        selectedDateKey,
        todayKey,
        dayRange,
        daySections,
        selectedDayTaskCount,
        subtaskCountMap,
    };
}
