'use client';

import { CellProps } from '../types';
import { TextCell } from './TextCell';
import { NumberCell } from './NumberCell';
import { SelectCell } from './SelectCell';
import { PeopleCell } from './PeopleCell';
import { TimerNumberCell } from './TimerNumberCell';

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
        default:
            return <TextCell {...props} />;
    }
}
