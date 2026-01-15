'use client';

import { CellProps } from '../types';
import { TextCell } from './TextCell';
import { NumberCell } from './NumberCell';
import { SelectCell } from './SelectCell';

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
        default:
            return <TextCell {...props} />;
    }
}
