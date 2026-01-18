'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';

interface CalendarContextMenuProps {
  contextMenu: { x: number; y: number; taskId: string; blockId?: string } | null;
  onDeleteBlock?: (blockId: string) => void;
  onClose: () => void;
}

export const CalendarContextMenu = React.memo(function CalendarContextMenu({
  contextMenu,
  onDeleteBlock,
  onClose
}: CalendarContextMenuProps) {
  if (!contextMenu) return null;

  return (
    <div
      className="fixed z-50 bg-white shadow-lg rounded-md border border-gray-200 py-1 w-32 animate-in fade-in zoom-in-95 duration-100"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          if (contextMenu.blockId && onDeleteBlock) {
            onDeleteBlock(contextMenu.blockId);
          }
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <Trash2 size={14} /> Remove from Calendar
      </button>
    </div>
  );
});
