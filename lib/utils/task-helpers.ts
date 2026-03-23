import { TableColumn, ColumnOption } from '@/lib/types';
import { Task, PeopleOption } from '@/lib/types';

export const getSortFields = (t: any) => [
    { id: 'title', label: t('headers.task_name') },
    { id: 'status', label: t('headers.status') },
    { id: 'expectedTime', label: t('headers.est_time') },
    { id: 'owner', label: t('headers.owner') },
];

export const formatDateToLocalISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getRelativeDayLabel = (target: Date, reference: Date): 'yesterday' | 'today' | 'tomorrow' | null => {
    const targetMidnight = new Date(target);
    targetMidnight.setHours(0, 0, 0, 0);

    const referenceMidnight = new Date(reference);
    referenceMidnight.setHours(0, 0, 0, 0);

    const diffDays = Math.round((targetMidnight.getTime() - referenceMidnight.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === -1) return 'yesterday';
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    return null;
};

export const STATUS_OPTIONS: ColumnOption[] = [
    { label: 'planned', backgroundColor: 'hsl(0, 0%, 93%)' },
    { label: 'in_progress', backgroundColor: 'hsl(35, 100%, 90%)' },
    { label: 'overrun', backgroundColor: 'hsl(0, 100%, 92%)' },
    { label: 'completed', backgroundColor: 'hsl(120, 60%, 90%)' },
];

export function getTaskColumns(orgMembers: PeopleOption[], customColumns: any[], t: any): TableColumn<Task>[] {
    const baseColumns = [
        {
            id: 'title',
            label: t('headers.task_name'),
            dataType: 'text',
            width: 600,
            minWidth: 150,
        },
        {
            id: 'expectedTime',
            label: t('headers.est_time'),
            dataType: 'estimatedTime',
            width: 54,
            minWidth: 54,
        },
        {
            id: 'ownerIds',
            label: t('headers.owner'),
            dataType: 'people',
            width: 54,
            minWidth: 54,
            peopleOptions: orgMembers,
        },
    ];

    return baseColumns as TableColumn<Task>[];
}
