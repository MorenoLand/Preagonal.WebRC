import type { ComponentType, ReactNode } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';

interface FeaturePanelProps {
  title: string;
  description: string;
  icon: ComponentType<SvgIconProps>;
  children: ReactNode;
}

export function FeaturePanel({ title, description, icon: Icon, children }: FeaturePanelProps) {
  return (
    <section className="feature-panel">
      <header className="feature-panel-header">
        <div className="feature-panel-title">
          <span className="feature-icon"><Icon /></span>
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>
      </header>
      <div className="feature-panel-body">{children}</div>
    </section>
  );
}

interface DataTableProps {
  columns: string[];
  emptyTitle: string;
  emptyDescription: string;
  children?: ReactNode;
}

export function DataTable({ columns, emptyTitle, emptyDescription, children }: DataTableProps) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{children ?? <tr><td colSpan={columns.length}><div className="table-empty"><strong>{emptyTitle}</strong><span>{emptyDescription}</span></div></td></tr>}</tbody>
      </table>
    </div>
  );
}

interface ToolRowProps {
  children: ReactNode;
  end?: ReactNode;
}

export function ToolRow({ children, end }: ToolRowProps) {
  return <div className="tool-row"><div className="tool-row-main">{children}</div>{end && <div className="tool-row-end">{end}</div>}</div>;
}
