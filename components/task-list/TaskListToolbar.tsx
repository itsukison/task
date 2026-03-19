import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AdvancedFilterMenu } from './AdvancedFilterMenu';
import { FilterRule } from '@/lib/utils/filterRules';
import { SortConfig } from '../editable-table';

interface TaskListToolbarProps {
    t: any;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    filterRules: FilterRule[];
    onFilterChange?: (rules: FilterRule[]) => void;
    sortConfig?: SortConfig | null;
    onSortChange?: (config: SortConfig | null) => void;
    sortFields: { id: string; label: string }[];
}

export function TaskListToolbar({
    t,
    searchQuery = '',
    onSearchChange,
    filterRules,
    onFilterChange,
    sortConfig,
    onSortChange,
    sortFields,
}: TaskListToolbarProps) {
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);

    const handleSortSelect = (columnId: string, direction: 'asc' | 'desc') => {
        onSortChange?.({ columnId, direction });
        setShowSortMenu(false);
    };

    const toggleSortDirection = () => {
        if (sortConfig) {
            onSortChange?.({
                ...sortConfig,
                direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
            });
        }
    };

    const clearSort = () => {
        onSortChange?.(null);
        setShowSortMenu(false);
    };

    if (!onSearchChange && !onFilterChange && !onSortChange) {
        return null;
    }

    return (
        <div className="px-3 h-12 border-b border-[#E9E9E7] flex items-center gap-1 shrink-0">
            {/* Inline Expanding Search */}
            {onSearchChange && (
                <div className="flex items-center transition-all duration-200 ease-in-out" style={{ width: isSearchExpanded ? '160px' : 'auto' }}>
                    <button
                        onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                        className={`p-1 hover:bg-[#EFEFED] rounded transition-colors flex-shrink-0 cursor-pointer ${searchQuery ? 'text-accent bg-orange-50' : 'text-[#787774]'}`}
                    >
                        <Search size={16} />
                    </button>
                    {isSearchExpanded && (
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={t('common.search_placeholder')}
                            className="flex-1 ml-2 px-0 py-1 text-sm text-[#37352F] placeholder-gray-400 border-0 border-b border-gray-300 outline-none focus:border-orange-500 bg-transparent min-w-0"
                            autoFocus
                        />
                    )}
                </div>
            )}

            {/* Advanced Filter */}
            {onFilterChange && (
                <Popover open={showFilterMenu} onOpenChange={setShowFilterMenu}>
                    <PopoverTrigger asChild>
                        <button
                            className={`p-1 hover:bg-[#EFEFED] rounded transition-colors cursor-pointer ${filterRules.length > 0 ? 'text-accent bg-orange-50' : 'text-[#787774]'}`}
                            title={t('common.filter_tooltip')}
                        >
                            <Filter size={16} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" sideOffset={4} className="p-0 w-auto bg-transparent border-none shadow-none">
                        <AdvancedFilterMenu
                            rules={filterRules}
                            onUpdateRules={onFilterChange}
                            onResetAll={() => onFilterChange([])}
                            onClose={() => setShowFilterMenu(false)}
                        />
                    </PopoverContent>
                </Popover>
            )}

            {/* Sort Control */}
            {onSortChange && (
                <div className="relative">
                    <button
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        className={`p-1 hover:bg-[#EFEFED] rounded transition-colors flex items-center gap-0.5 cursor-pointer ${sortConfig ? 'text-accent bg-orange-50' : 'text-[#787774]'}`}
                        title={t('common.sort_tooltip')}
                    >
                        <ArrowUpDown size={16} />
                    </button>

                    {/* Sort Menu */}
                    {showSortMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                            <div className="absolute top-full left-0 mt-1 z-50 bg-white shadow-lg rounded-lg border border-gray-200 py-1 w-[180px]">
                                <div className="px-3 py-1.5 text-xs font-semibold text-[#9e9e9e] uppercase">{t('common.sort_by')}</div>
                                {sortFields.map(field => (
                                    <button
                                        key={field.id}
                                        className={`w-full px-3 py-1.5 flex items-center gap-2 text-sm hover:bg-gray-50 transition-colors ${sortConfig?.columnId === field.id ? 'text-accent bg-orange-50' : 'text-[#37352F]'}`}
                                        onClick={() => handleSortSelect(field.id, 'asc')}
                                    >
                                        {field.label}
                                        {sortConfig?.columnId === field.id && (
                                            sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        )}
                                    </button>
                                ))}
                                {sortConfig && (
                                    <>
                                        <div className="border-t border-gray-100 my-1" />
                                        <button
                                            className="w-full px-3 py-1.5 flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                            onClick={clearSort}
                                        >
                                            <X size={14} />
                                            {t('common.clear_sort')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Active Sort Indicator */}
            {sortConfig && (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded text-xs text-accent border border-orange-200">
                    <span className="font-medium">
                        {sortFields.find(f => f.id === sortConfig.columnId)?.label}
                    </span>
                    <button
                        onClick={toggleSortDirection}
                        className="hover:bg-orange-100 rounded p-0.5 cursor-pointer"
                    >
                        {sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    </button>
                    <button
                        onClick={clearSort}
                        className="hover:bg-orange-100 rounded p-0.5 cursor-pointer"
                    >
                        <X size={12} />
                    </button>
                </div>
            )}
        </div>
    );
}
