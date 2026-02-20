'use client';

import React from 'react';
import { Trash2, Plus } from 'lucide-react';

interface CalendarContextMenuProps {
  contextMenu: { x: number; y: number; taskId?: string; blockId?: string; date?: Date } | null;
  onDeleteBlock?: (blockId: string) => void;
  onCreateTask?: (date: Date) => void;
  onClose: () => void;
}

export const CalendarContextMenu = React.memo(function CalendarContextMenu({
  contextMenu,
  onDeleteBlock,
  onCreateTask,
  onClose
}: CalendarContextMenuProps) {
  if (!contextMenu) return null;

  return (
    <div
      className="fixed z-50 bg-white shadow-lg rounded-md border border-gray-200 py-1 w-40 animate-in fade-in zoom-in-95 duration-100"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Create Task Option */}
      {!contextMenu.taskId && !contextMenu.blockId && onCreateTask && (
        <button
          onClick={() => {
            if (contextMenu.date) {
              onCreateTask(contextMenu.date);
              onClose();
            }
          }}
          className="w-full text-left px-3 py-1.5 text-sm text-[#37352F] hover:bg-[#EFEFED] flex items-center gap-2 transition-colors"
        >
          <Plus size={14} className="text-[#5F5E5B]" />
          Create Task
        </button>
      )}

      {contextMenu.blockId && onDeleteBlock && (
        <button
          onClick={() => {
            if (contextMenu.blockId) {
              onDeleteBlock(contextMenu.blockId);
            }
            onClose();
          }}
          className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
        >
          <Trash2 size={14} /> Remove
        </button>
      )}
    </div>
  );
});
