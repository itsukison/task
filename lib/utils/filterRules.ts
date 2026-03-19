import { Task, TaskStatus } from '../types';

/**
 * Filter operators for different field types
 */
export type FilterOperator =
    // Text operators
    | 'contains'
    | 'does_not_contain'
    | 'is'
    | 'is_not'
    // Select operators
    | 'is_any_of'
    | 'is_not_any_of'
    // Number operators
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'greater_equal'
    | 'less_equal'
    // Common operators
    | 'is_empty'
    | 'is_not_empty';

/**
 * Column field types for filtering
 */
export type FilterColumn = 'title' | 'status' | 'ownerIds' | 'expectedTime';

/**
 * Column metadata for filter UI
 */
export interface ColumnMeta {
    id: FilterColumn;
    label: string;
    type: 'text' | 'select' | 'number' | 'people';
    operators: FilterOperator[];
}

/**
 * Filter rule definition
 */
export interface FilterRule {
    id: string;
    column: FilterColumn;
    operator: FilterOperator;
    value: any; // Type depends on column
}

/**
 * Available columns for filtering
 */
export const FILTER_COLUMNS: Record<FilterColumn, ColumnMeta> = {
    title: {
        id: 'title',
        label: 'Task Name',
        type: 'text',
        operators: ['contains', 'does_not_contain', 'is', 'is_not', 'is_empty', 'is_not_empty'],
    },
    status: {
        id: 'status',
        label: 'Status',
        type: 'select',
        operators: ['is', 'is_not', 'is_any_of', 'is_not_any_of', 'is_empty', 'is_not_empty'],
    },
    ownerIds: {
        id: 'ownerIds',
        label: 'Owner',
        type: 'people',
        operators: ['contains', 'does_not_contain', 'is_empty', 'is_not_empty'],
    },
    expectedTime: {
        id: 'expectedTime',
        label: 'Est. Time',
        type: 'number',
        operators: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'is_empty', 'is_not_empty'],
    },
};

/**
 * Evaluate a single filter rule against a task
 */
export function evaluateFilterRule(task: Task, rule: FilterRule): boolean {
    const value = getTaskValue(task, rule.column);

    switch (rule.operator) {
        case 'is_empty':
            return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
        case 'is_not_empty':
            return value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0);

        // Text operators
        case 'contains':
            return String(value || '').toLowerCase().includes(String(rule.value || '').toLowerCase());
        case 'does_not_contain':
            return !String(value || '').toLowerCase().includes(String(rule.value || '').toLowerCase());
        case 'is':
            if (rule.column === 'status') return value === rule.value;
            return String(value).toLowerCase() === String(rule.value).toLowerCase();
        case 'is_not':
            if (rule.column === 'status') return value !== rule.value;
            return String(value).toLowerCase() !== String(rule.value).toLowerCase();

        // Select operators
        case 'is_any_of':
            return Array.isArray(rule.value) && rule.value.includes(value);
        case 'is_not_any_of':
            return Array.isArray(rule.value) && !rule.value.includes(value);

        // Number operators
        case 'equals':
            return Number(value) === Number(rule.value);
        case 'not_equals':
            return Number(value) !== Number(rule.value);
        case 'greater_than':
            return Number(value) > Number(rule.value);
        case 'less_than':
            return Number(value) < Number(rule.value);
        case 'greater_equal':
            return Number(value) >= Number(rule.value);
        case 'less_equal':
            return Number(value) <= Number(rule.value);

        default:
            return true;
    }
}

/**
 * Evaluate all filter rules against a task (AND logic)
 */
export function evaluateFilterRules(task: Task, rules: FilterRule[]): boolean {
    if (rules.length === 0) return true;
    return rules.every(rule => evaluateFilterRule(task, rule));
}

/**
 * Get task value by column ID
 */
function getTaskValue(task: Task, column: FilterColumn): any {
    switch (column) {
        case 'title':
            return task.title;
        case 'status':
            return task.status;
        case 'ownerIds':
            return task.owners.map(o => o.id);
        case 'expectedTime':
            return task.expectedTime;
        default:
            return null;
    }
}

/**
 * Generate a new filter rule with default values
 */
export function createEmptyFilterRule(): FilterRule {
    return {
        id: `rule-${Date.now()}-${Math.random()}`,
        column: 'title',
        operator: 'contains',
        value: '',
    };
}
