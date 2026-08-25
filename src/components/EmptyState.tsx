import type { ComponentType, ReactNode } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ComponentType<SvgIconProps>;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon: Icon = InfoOutlinedIcon, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon"><Icon /></span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}
