import type { ComponentType, ReactNode } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';

interface FeaturePanelProps {
  title: string;
  description: string;
  icon: ComponentType<SvgIconProps>;
  children: ReactNode;
}

export function FeaturePanel({ children }: FeaturePanelProps) {
  return <section className="feature-panel"><div className="feature-panel-body">{children}</div></section>;
}

interface DataTableProps {
  columns: readonly (string | DataTableColumn)[];
  emptyTitle: string;
  emptyDescription: string;
  children?: ReactNode;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (sortKey: string) => void;
}

export interface DataTableColumn {
  label: string;
  sortKey?: string;
  headerAction?: ReactNode;
}

export function DataTable({ columns, emptyTitle, emptyDescription, children, sortKey, sortDirection = 'asc', onSort }: DataTableProps) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead><tr>{columns.map((column, index) => {
          const definition = typeof column === 'string' ? { label: column } : column;
          const sortable = !!definition.sortKey && !!onSort;
          const active = sortable && sortKey === definition.sortKey;
          const SortIcon = active ? sortDirection === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon : UnfoldMoreIcon;
          return <th key={`${definition.label}-${index}`} aria-sort={sortable ? active ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none' : undefined}>{definition.headerAction ?? (sortable ? <button className="table-sort-button" type="button" onClick={() => onSort(definition.sortKey!)} aria-label={`Sort by ${definition.label}`} title={`Sort by ${definition.label}`}><span>{definition.label}</span><SortIcon /></button> : definition.label)}</th>;
        })}</tr></thead>
        <tbody>{children ?? <tr><td colSpan={columns.length}><div className="table-empty"><strong>{emptyTitle}</strong><span>{emptyDescription}</span></div></td></tr>}</tbody>
      </table>
    </div>
  );
}

interface ToolRowProps {
  children?: ReactNode;
  end?: ReactNode;
}

export function ToolRow({ children, end }: ToolRowProps) {
  return <div className="tool-row">{children != null && <div className="tool-row-main">{children}</div>}{end && <div className="tool-row-end">{end}</div>}</div>;
}
