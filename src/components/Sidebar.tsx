import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import Tooltip from '@mui/material/Tooltip';
import rcIcon from '../../images/rcicon.png';
import { navigationGroups, type NavigationGroup } from '../navigation';
import type { ConnectionForm, ConnectionState, FeatureId } from '../types';
import { ConnectionPanel } from './ConnectionPanel';

interface SidebarProps {
  activeFeature: FeatureId;
  connection: ConnectionForm;
  connectionName: string;
  onlinePlayers: number | null;
  statsLoading: boolean;
  serverDirectoryUrl: string;
  onSelect: (feature: FeatureId) => void;
  onConnectionChange: (value: ConnectionForm) => void;
  onServerDirectoryUrlChange: (value: string) => void;
  onConnect: () => void;
  onFetchServers: () => void;
  fetchingServers: boolean;
  connectionState: ConnectionState;
}

export function Sidebar({ activeFeature, connection, connectionName, onlinePlayers, statsLoading, serverDirectoryUrl, onSelect, onConnectionChange, onServerDirectoryUrlChange, onConnect, onFetchServers, fetchingServers, connectionState }: SidebarProps) {
  const statusLabel = connectionState === 'connected' ? connectionName || getEndpointLabel(connection.endpoint) : connectionState === 'connecting' ? 'Connecting…' : 'Not Connected';
  const summaryCount = connectionState !== 'connected' ? '0 online' : statsLoading ? '… online' : onlinePlayers === null ? '— online' : `${onlinePlayers} online`;
  return (
    <aside className="sidebar">
      <header className="brand-header">
        <img src={rcIcon} alt="RC" className="brand-icon" />
        <div className="brand-copy"><strong>RC Web</strong><span>PREAGONAL CONTROL</span></div>
      </header>
      <div className="server-summary">
        <div className="summary-status"><span className={`status-indicator status-${connectionState}`} /><span className="summary-status-label">{statusLabel}</span></div>
        <span className="summary-count">{summaryCount}</span>
      </div>
      <nav className="sidebar-navigation" aria-label="Remote control navigation">
        {navigationGroups.map(group => <NavigationSection key={group.label} group={group} activeFeature={activeFeature} onSelect={onSelect} />)}
      </nav>
      <ConnectionPanel value={connection} connectionName={connectionName} serverDirectoryUrl={serverDirectoryUrl} connectionState={connectionState} onChange={onConnectionChange} onServerDirectoryUrlChange={onServerDirectoryUrlChange} onConnect={onConnect} onFetchServers={onFetchServers} fetchingServers={fetchingServers} connecting={connectionState === 'connecting'} />
    </aside>
  );
}

function getEndpointLabel(endpoint: string): string {
  try {
    return new URL(endpoint).host || 'GameServer API';
  } catch {
    return endpoint || 'GameServer API';
  }
}

interface NavigationSectionProps {
  group: NavigationGroup;
  activeFeature: FeatureId;
  onSelect: (feature: FeatureId) => void;
}

function NavigationSection({ group, activeFeature, onSelect }: NavigationSectionProps) {
  return (
    <section className="navigation-section">
      <h3>{group.label}</h3>
      {group.items.map(item => <NavigationButton key={item.id} label={item.label} icon={item.icon} active={activeFeature === item.id} onClick={() => onSelect(item.id)} />)}
    </section>
  );
}

interface NavigationButtonProps {
  label: string;
  icon: ComponentType<SvgIconProps>;
  active: boolean;
  onClick: () => void;
}

function NavigationButton({ label, icon: Icon, active, onClick }: NavigationButtonProps) {
  return (
    <Tooltip title={label} placement="right">
      <button className={`navigation-button${active ? ' active' : ''}`} type="button" onClick={onClick} aria-current={active ? 'page' : undefined}>
        <Icon /><span>{label}</span>
      </button>
    </Tooltip>
  );
}
