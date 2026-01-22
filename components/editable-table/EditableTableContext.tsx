'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ActivePopup {
    rowId: string;
    columnId: string;
}

interface EditableTableContextType {
    activePopup: ActivePopup | null;
    setActivePopup: (popup: ActivePopup | null) => void;
}

const EditableTableContext = createContext<EditableTableContextType | undefined>(undefined);

export function EditableTableProvider({ children }: { children: ReactNode }) {
    const [activePopup, setActivePopup] = useState<ActivePopup | null>(null);

    return (
        <EditableTableContext.Provider value={{ activePopup, setActivePopup }}>
            {children}
        </EditableTableContext.Provider>
    );
}

export function useEditableTable() {
    const context = useContext(EditableTableContext);
    if (context === undefined) {
        throw new Error('useEditableTable must be used within an EditableTableProvider');
    }
    return context;
}
