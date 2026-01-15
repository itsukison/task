// Re-export the main component
export { default as EditableTable } from './EditableTable';

// Re-export public types from lib/types
export type {
    EditableTableProps,
    TableColumn,
    ColumnOption,
    DataType,
    SortConfig
} from '@/lib/types';

// Note: Internal types (CellProps, HeaderMenuProps, etc.) are NOT exported
