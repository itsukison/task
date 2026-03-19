'use client';

import { AlignLeft, Hash, CircleDot, Users, Clock, ListTodo, FileText } from 'lucide-react';
import { DataType } from '@/lib/types';

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Icon component for different data types
 */
export function DataTypeIcon({ dataType }: { dataType: DataType }) {
    switch (dataType) {
        case 'text':
            return <AlignLeft size={14} className="text-[#9e9e9e]" />;
        case 'number':
            return <Hash size={14} className="text-[#9e9e9e]" />;
        case 'select':
            return <CircleDot size={14} className="text-[#9e9e9e]" />;
        case 'people':
            return <Users size={14} className="text-[#9e9e9e]" />;
        case 'timerNumber':
            return <Hash size={14} className="text-[#9e9e9e]" />;
        case 'combinedTime':
            return <Clock size={14} className="text-[#9e9e9e]" />;
        case 'estimatedTime':
            return <Clock size={14} className="text-[#9e9e9e]" />;
        case 'subtask':
            return <ListTodo size={14} className="text-[#9e9e9e]" />;
        case 'document':
            return <FileText size={14} className="text-[#9e9e9e]" />;
        default:
            return <AlignLeft size={14} className="text-[#9e9e9e]" />;
    }
}
