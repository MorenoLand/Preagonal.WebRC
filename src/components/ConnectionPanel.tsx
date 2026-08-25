import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import TextField from '@mui/material/TextField';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import IconButton from '@mui/material/IconButton';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import Tooltip from '@mui/material/Tooltip';
import { normalizeApiBaseUrl, normalizeServerDirectoryUrl } from '../api/gameServerApi';
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
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);
  const [apiDraft, setApiDraft] = useState({ endpoint: value.endpoint, serverDirectoryUrl });
  useEffect(() => { if (connectionState !== 'connected') setDetailsOpen(false); }, [connectionState]);
  const update = (field: keyof ConnectionForm) => (event: ChangeEvent<HTMLInputElement>) => onChange({ ...value, [field]: event.target.value });
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onConnect(); };
  const openApiSettings = () => { setApiDraft({ endpoint: value.endpoint, serverDirectoryUrl }); setApiSettingsOpen(true); };
  const saveApiSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const endpoint = normalizeApiBaseUrl(apiDraft.endpoint);
    const directoryUrl = normalizeServerDirectoryUrl(apiDraft.serverDirectoryUrl);
    if (!directoryUrl || (apiDraft.endpoint.trim() && !endpoint)) return;
    onChange({ ...value, endpoint: endpoint || value.endpoint });
    onServerDirectoryUrlChange(directoryUrl);
    setApiSettingsOpen(false);
  };
  const directoryUrlValid = Boolean(normalizeServerDirectoryUrl(apiDraft.serverDirectoryUrl));
  const apiSettingsValid = Boolean(directoryUrlValid && (!apiDraft.endpoint.trim() || normalizeApiBaseUrl(apiDraft.endpoint)));
  if (connectionState === 'connected' && !detailsOpen) return <div className="connection-panel connection-panel-collapsed">
    <div className="connection-collapsed-copy"><span className="connection-collapsed-name"><DnsOutlinedIcon />{connectionName || value.endpoint || 'GameServer API'}</span><span className="connection-collapsed-endpoint">{value.endpoint || 'API endpoint'}</span></div>
    <div className="connection-collapsed-actions"><Tooltip title="Configure API endpoints"><IconButton className="connection-expand-button" aria-label="Configure API endpoints" onClick={openApiSettings}><SettingsOutlinedIcon /></IconButton></Tooltip><Tooltip title="Edit connection details"><IconButton className="connection-expand-button" aria-label="Edit connection details" onClick={() => setDetailsOpen(true)}><EditOutlinedIcon /></IconButton></Tooltip></div>
  </div>;
  return (
    <form className="connection-panel" onSubmit={submit}>
      <div className="connection-heading"><span>CONNECTION</span>{connectionName && <span className="connection-selected-name" title={connectionName}>{connectionName}</span>}<span className="connection-dot" /></div>
      <TextField className="rc-text-field" label="Nickname" placeholder="Remote control name" value={value.nickname} onChange={update('nickname')} autoComplete="nickname" fullWidth />
      <TextField className="rc-text-field" label="Account" value={value.account} onChange={update('account')} autoComplete="username" fullWidth />
      <TextField className="rc-text-field" label="Password" type="password" value={value.password} onChange={update('password')} autoComplete="current-password" fullWidth />
      <div className="connection-actions">
        <Tooltip title="Configure API endpoints"><span><IconButton className="connection-action-icon connection-action-settings" type="button" onClick={openApiSettings} aria-label="Configure API endpoints"><SettingsOutlinedIcon /></IconButton></span></Tooltip>
        <Tooltip title={fetchingServers ? 'Fetching servers…' : 'Fetch servers'}><span><IconButton className="connection-action-icon" type="button" onClick={onFetchServers} disabled={fetchingServers} aria-label="Fetch Servers"><DownloadIcon /></IconButton></span></Tooltip>
        <Tooltip title={connecting ? 'Connecting…' : 'Connect'}><span><IconButton className="connection-action-icon connection-action-connect" type="submit" disabled={connecting} aria-label="Connect"><ArrowForwardIcon /></IconButton></span></Tooltip>
      </div>
      <Drawer anchor="right" open={apiSettingsOpen} onClose={() => setApiSettingsOpen(false)} PaperProps={{ className: 'api-settings-drawer' }}>
        <form className="api-settings-drawer-form" onSubmit={saveApiSettings}>
          <div className="api-settings-drawer-header"><div><strong>API endpoints</strong><span>Connection and server list sources</span></div><IconButton aria-label="Close API endpoint settings" onClick={() => setApiSettingsOpen(false)}><CloseIcon /></IconButton></div>
          <p className="api-settings-drawer-copy">These endpoints are kept separate from the login form. The server list URL must allow browser CORS.</p>
          <TextField autoFocus className="rc-text-field" label="GameServer API" placeholder="API base URL" value={apiDraft.endpoint} onChange={event => setApiDraft(current => ({ ...current, endpoint: event.target.value }))} fullWidth />
          <TextField className="rc-text-field" label="Server list API" placeholder="https://api.graalserver.com/servers" value={apiDraft.serverDirectoryUrl} onChange={event => setApiDraft(current => ({ ...current, serverDirectoryUrl: event.target.value }))} error={Boolean(apiDraft.serverDirectoryUrl.trim()) && !directoryUrlValid} helperText={directoryUrlValid ? 'Used by Fetch Servers.' : 'Enter a valid HTTP(S) URL.'} fullWidth />
          <div className="api-settings-drawer-actions"><Button className="rc-button rc-button-muted" type="button" onClick={() => setApiSettingsOpen(false)}>Cancel</Button><Button className="rc-button rc-button-primary" type="submit" disabled={!apiSettingsValid}>Save API endpoints</Button></div>
        </form>
      </Drawer>
    </form>
  );
}
