import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import TextField from '@mui/material/TextField';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import type { ConnectionForm, ConnectionState } from '../types';

interface ConnectionPanelProps {
  value: ConnectionForm;
  onChange: (value: ConnectionForm) => void;
  onConnect: () => void;
  onFetchServers: () => void;
  fetchingServers?: boolean;
  connecting?: boolean;
  connectionName?: string;
  serverDirectoryUrl: string;
  onServerDirectoryUrlChange: (value: string) => void;
  connectionState: ConnectionState;
}

export function ConnectionPanel({ value, onChange, onConnect, onFetchServers, fetchingServers = false, connecting = false, connectionName = '', serverDirectoryUrl, onServerDirectoryUrlChange, connectionState }: ConnectionPanelProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  useEffect(() => { if (connectionState !== 'connected') setDetailsOpen(false); }, [connectionState]);
  const update = (field: keyof ConnectionForm) => (event: ChangeEvent<HTMLInputElement>) => onChange({ ...value, [field]: event.target.value });
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onConnect(); };
  if (connectionState === 'connected' && !detailsOpen) return <div className="connection-panel connection-panel-collapsed">
    <div className="connection-collapsed-copy"><span className="connection-collapsed-name"><DnsOutlinedIcon />{connectionName || value.endpoint || 'GameServer API'}</span><span className="connection-collapsed-endpoint">{value.endpoint || 'API endpoint'}</span></div>
    <Tooltip title="Edit connection details"><IconButton className="connection-expand-button" aria-label="Edit connection details" onClick={() => setDetailsOpen(true)}><EditOutlinedIcon /></IconButton></Tooltip>
  </div>;
  return (
    <form className="connection-panel" onSubmit={submit}>
      <div className="connection-heading"><span>CONNECTION</span><span className="connection-dot" /></div>
      <TextField className="rc-text-field" label="GameServer API" placeholder="API base URL" value={value.endpoint} onChange={update('endpoint')} autoComplete="url" fullWidth />
      <TextField className="rc-text-field" label="Server list API" placeholder="https://api.graalserver.com/servers" value={serverDirectoryUrl} onChange={event => onServerDirectoryUrlChange(event.target.value)} autoComplete="url" fullWidth />
      <TextField className="rc-text-field" label="Nickname" placeholder="Remote control name" value={value.nickname} onChange={update('nickname')} autoComplete="nickname" fullWidth />
      <TextField className="rc-text-field" label="Account" value={value.account} onChange={update('account')} autoComplete="username" fullWidth />
      <TextField className="rc-text-field" label="Password" type="password" value={value.password} onChange={update('password')} autoComplete="current-password" fullWidth />
      <div className="connection-actions">
        <Tooltip title={fetchingServers ? 'Fetching servers…' : 'Fetch servers'}><span><IconButton className="connection-action-icon" type="button" onClick={onFetchServers} disabled={fetchingServers} aria-label="Fetch Servers"><DownloadIcon /></IconButton></span></Tooltip>
        <Tooltip title={connecting ? 'Connecting…' : 'Connect'}><span><IconButton className="connection-action-icon connection-action-connect" type="submit" disabled={connecting} aria-label="Connect"><ArrowForwardIcon /></IconButton></span></Tooltip>
      </div>
    </form>
  );
}
