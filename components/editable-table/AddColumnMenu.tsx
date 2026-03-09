'use client';

import React from 'react';
import { List, FileText } from 'lucide-react';

interface AddColumnMenuProps {
    onAddSubtask: () => void;
    onAddDocument: () => void;
    canAddMore: boolean;
}

/**
 * Dropdown menu for adding custom columns (Subtask or Document type)
 */
export function AddColumnMenu({ onAddSubtask, onAddDocument, canAddMore }: AddColumnMenuProps) {
    // Subtask and Document columns are temporarily hidden — return null until they're ready
    return null;
}
