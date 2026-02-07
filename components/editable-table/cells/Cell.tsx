'use client';

import { CellProps } from '../types';
import { TextCell } from './TextCell';
import { NumberCell } from './NumberCell';
import { SelectCell } from './SelectCell';
import { PeopleCell } from './PeopleCell';
import { TimerNumberCell } from './TimerNumberCell';
import { CombinedTimeCell } from './CombinedTimeCell';
import { SubtaskCell } from './SubtaskCell';
import { DocumentCell } from './DocumentCell';

/**
 * Router component that renders the appropriate cell type
 */
export function Cell(props: CellProps) {
    switch (props.dataType) {
        case 'text':
            return <TextCell {...props} />;
        case 'number':
            return <NumberCell {...props} />;
        case 'select':
            return <SelectCell {...props} />;
        case 'people':
            return <PeopleCell {...props} />;
        case 'timerNumber':
            return <TimerNumberCell {...props} />;
        case 'combinedTime':
            return <CombinedTimeCell {...props} />;
        case 'subtask':
            return <SubtaskCell {...props} />;
        case 'document':
            return <DocumentCell {...props} />;
        default:
            return <TextCell {...props} />;
    }
}
