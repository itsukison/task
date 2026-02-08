import React from 'react';
import { X, Plus, ChevronsUpDown } from 'lucide-react';
import { FilterRule, FilterOperator, FILTER_COLUMNS, FilterColumn, createEmptyFilterRule } from '@/lib/utils/filterRules';
import { useLanguage } from '@/lib/i18n';
import { TaskStatus } from '@/lib/types';
import { useOrganizationMembers } from '@/lib/hooks/use-organization-members';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface AdvancedFilterMenuProps {
    rules: FilterRule[];
    onUpdateRules: (rules: FilterRule[]) => void;
    onResetAll: () => void;
    onClose: () => void;
}

const STATUS_OPTIONS: TaskStatus[] = ['planned', 'in_progress', 'overrun', 'completed'];

export function AdvancedFilterMenu({
    rules,
    onUpdateRules,
    onResetAll,
    onClose
}: AdvancedFilterMenuProps) {
    const { t } = useLanguage();
    const { members } = useOrganizationMembers();

    const handleAddRule = () => {
        onUpdateRules([...rules, createEmptyFilterRule()]);
    };

    const handleRemoveRule = (ruleId: string) => {
        onUpdateRules(rules.filter(r => r.id !== ruleId));
    };

    const handleUpdateRule = (ruleId: string, updates: Partial<FilterRule>) => {
        onUpdateRules(rules.map(r => r.id === ruleId ? { ...r, ...updates } : r));
    };

    const handleColumnChange = (ruleId: string, column: FilterColumn) => {
        const columnMeta = FILTER_COLUMNS[column];
        const defaultOperator = columnMeta.operators[0];
        handleUpdateRule(ruleId, {
            column,
            operator: defaultOperator,
            value: column === 'status' ? [] : ''
        });
    };

    const renderValueInput = (rule: FilterRule) => {
        const columnMeta = FILTER_COLUMNS[rule.column];

        // No value needed for is_empty/is_not_empty
        if (rule.operator === 'is_empty' || rule.operator === 'is_not_empty') {
            return null;
        }

        switch (columnMeta.type) {
            case 'text':
                return (
                    <input
                        type="text"
                        value={rule.value || ''}
                        onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                        placeholder={t('common.select_value')}
                        className="flex-1 min-w-0 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                );

            case 'select':
                if (rule.operator === 'is_any_of' || rule.operator === 'is_not_any_of') {
                    // Custom Multi-select for is_any_of using Popover + Checkboxes
                    const selectedValues = Array.isArray(rule.value) ? rule.value : [];
                    const displayValue = selectedValues.length > 0
                        ? `${selectedValues.length} selected`
                        : t('common.select_value');

                    return (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="flex h-9 w-full flex-1 items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
                                    <span>{displayValue}</span>
                                    <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[180px] p-0" align="start">
                                <div className="p-1 max-h-[200px] overflow-auto">
                                    {STATUS_OPTIONS.map((status) => {
                                        const isSelected = selectedValues.includes(status);
                                        return (
                                            <div
                                                key={status}
                                                className="flex items-center space-x-2 p-2 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer"
                                                onClick={() => {
                                                    const newValue = isSelected
                                                        ? selectedValues.filter(v => v !== status)
                                                        : [...selectedValues, status];
                                                    handleUpdateRule(rule.id, { value: newValue });
                                                }}
                                            >
                                                <Checkbox checked={isSelected} />
                                                <span className="text-sm">{t(`tasks.status.${status}`)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </PopoverContent>
                        </Popover>
                    );
                } else {
                    // Single select
                    return (
                        <Select
                            value={String(rule.value || '')}
                            onValueChange={(val) => handleUpdateRule(rule.id, { value: val })}
                        >
                            <SelectTrigger className="flex-1 h-9">
                                <SelectValue placeholder={t('common.select_value')} />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map(status => (
                                    <SelectItem key={status} value={status}>
                                        {t(`tasks.status.${status}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    );
                }

            case 'number':
                return (
                    <input
                        type="number"
                        value={rule.value || ''}
                        onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                        placeholder={t('common.select_value')}
                        className="flex-1 min-w-0 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                );

            case 'people':
                // Assuming 'contains' for people uses single ID for now based on filterRules logic
                // If is_any_of was supported, we'd need multi-select here too.
                // Currently only 'contains' / 'does_not_contain' / 'is_empty' are in default people ops.
                return (
                    <Select
                        value={String(rule.value || '')}
                        onValueChange={(val) => handleUpdateRule(rule.id, { value: val })}
                    >
                        <SelectTrigger className="flex-1 h-9">
                            <SelectValue placeholder={t('common.select_value')} />
                        </SelectTrigger>
                        <SelectContent>
                            {members.map(member => (
                                <SelectItem key={member.id} value={member.id}>
                                    <div className="flex items-center gap-2">
                                        <span>{member.displayName}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            default:
                return null;
        }
    };

    return (
        <div
            className="bg-white shadow-lg rounded-lg border border-gray-200 py-1 w-[460px] max-h-[400px] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="px-3 py-1.5 text-xs font-semibold text-[#9e9e9e] uppercase">
                {t('common.where')}
            </div>

            <div className="overflow-y-auto px-3 py-2 space-y-2">
                {/* Filter Rules */}
                <div className="space-y-2">
                    {rules.map((rule) => {
                        const columnMeta = FILTER_COLUMNS[rule.column];
                        return (
                            <div key={rule.id} className="flex items-start gap-2">
                                {/* Column Selector */}
                                <div className="w-[100px] shrink-0">
                                    <Select
                                        value={rule.column}
                                        onValueChange={(val) => handleColumnChange(rule.id, val as FilterColumn)}
                                    >
                                        <SelectTrigger className="h-9 w-full bg-white border border-[#E9E9E7] hover:bg-gray-50 text-[#37352F] shadow-sm focus:ring-gray-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            {Object.values(FILTER_COLUMNS).map(col => {
                                                const getLabel = () => {
                                                    switch (col.id) {
                                                        case 'title': return t('headers.task_name');
                                                        case 'status': return t('headers.status');
                                                        case 'ownerIds': return t('headers.owner');
                                                        case 'expectedTime': return t('headers.est_time');
                                                        case 'actualTime': return t('headers.act_time');
                                                        default: return col.label;
                                                    }
                                                };
                                                return (
                                                    <SelectItem
                                                        key={col.id}
                                                        value={col.id}
                                                        className="focus:bg-gray-100 focus:text-[#37352F]"
                                                    >
                                                        {getLabel()}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Operator Selector */}
                                <div className="w-[100px] shrink-0">
                                    <Select
                                        value={rule.operator}
                                        onValueChange={(val) => handleUpdateRule(rule.id, { operator: val as FilterOperator })}
                                    >
                                        <SelectTrigger className="h-9 w-full bg-white border border-[#E9E9E7] hover:bg-gray-50 text-[#37352F] shadow-sm focus:ring-gray-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            {columnMeta.operators.map(op => (
                                                <SelectItem
                                                    key={op}
                                                    value={op}
                                                    className="focus:bg-gray-100 focus:text-[#37352F]"
                                                >
                                                    {t(`filter_operators.${op}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Value Input */}
                                <div className="flex-1 min-w-0">
                                    {renderValueInput(rule)}
                                </div>

                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemoveRule(rule.id)}
                                    className="h-9 w-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                                    title="Remove filter"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        );
                    })}

                    {/* Add Filter Button */}
                    <button
                        onClick={handleAddRule}
                        className="w-full h-8 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded px-2 transition-colors"
                    >
                        <Plus size={14} />
                        {t('common.add_filter')}
                    </button>
                </div>

                {/* Reset All Button */}
                {rules.length > 0 && (
                    <>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                            className="w-full px-3 py-1.5 flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 transition-colors rounded-md"
                            onClick={() => {
                                onResetAll();
                                onClose();
                            }}
                        >
                            <X size={14} />
                            {t('common.reset_all_filters')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
