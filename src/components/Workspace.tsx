import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CodeIcon from '@mui/icons-material/Code';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import IconButton from '@mui/material/IconButton';
import { navigationById, type NavigationItem } from '../navigation';
import { ApiError, type ApiFileEntry, type GameServerApi, type GraalServer } from '../api/gameServerApi';
import type { ActionNotice, ConnectionState, FeatureId, ServerDirectoryStatus } from '../types';
import { DataTable, FeaturePanel, ToolRow } from './FeaturePanel';
import { EmptyState } from './EmptyState';

interface WorkspaceProps {
  activeFeature: FeatureId;
  openFeatures: FeatureId[];
  notice: ActionNotice | null;
  connectionState: ConnectionState;
  gameServerApi: GameServerApi | null;
  onSelect: (feature: FeatureId) => void;
  onClose: (feature: FeatureId) => void;
  onAction: (feature: FeatureId, operation: string) => void;
  servers: readonly GraalServer[];
  serverDirectoryStatus: ServerDirectoryStatus;
  serverDirectoryError: string | null;
  onFetchServers: () => void;
  onUseServer: (server: GraalServer) => void;
}

export function Workspace({ activeFeature, openFeatures, notice, connectionState, gameServerApi, onSelect, onClose, onAction, servers, serverDirectoryStatus, serverDirectoryError, onFetchServers, onUseServer }: WorkspaceProps) {
  const item = navigationById[activeFeature];
  return (
    <main className="workspace">
      <div className="workspace-content">
        <TabBar activeFeature={activeFeature} openFeatures={openFeatures} onSelect={onSelect} onClose={onClose} />
        {notice && <div className={`notice notice-${notice.kind}`} role="status"><InfoOutlinedIcon /><span>{notice.text}</span></div>}
        <FeatureContent item={item} connectionState={connectionState} gameServerApi={gameServerApi} onAction={onAction} servers={servers} serverDirectoryStatus={serverDirectoryStatus} serverDirectoryError={serverDirectoryError} onFetchServers={onFetchServers} onUseServer={onUseServer} />
      </div>
    </main>
  );
}

interface TabBarProps {
  activeFeature: FeatureId;
  openFeatures: FeatureId[];
  onSelect: (feature: FeatureId) => void;
  onClose: (feature: FeatureId) => void;
}

function TabBar({ activeFeature, openFeatures, onSelect, onClose }: TabBarProps) {
  return (
    <div className="tab-bar" role="tablist" aria-label="Open remote control panels">
      {openFeatures.map(feature => {
        const item = navigationById[feature];
        const Icon = item.icon;
        return <div className={`workspace-tab${activeFeature === feature ? ' active' : ''}`} key={feature} role="tab" aria-selected={activeFeature === feature}>
          <button type="button" className="workspace-tab-select" onClick={() => onSelect(feature)}><Icon /><span>{item.label}</span></button>
          {openFeatures.length > 1 && <button type="button" className="workspace-tab-close" aria-label={`Close ${item.label}`} onClick={() => onClose(feature)}>×</button>}
        </div>;
      })}
    </div>
  );
}

interface FeatureContentProps {
  item: NavigationItem;
  connectionState: ConnectionState;
  gameServerApi: GameServerApi | null;
  onAction: (feature: FeatureId, operation: string) => void;
  servers: readonly GraalServer[];
  serverDirectoryStatus: ServerDirectoryStatus;
  serverDirectoryError: string | null;
  onFetchServers: () => void;
  onUseServer: (server: GraalServer) => void;
}

function FeatureContent({ item, connectionState, gameServerApi, onAction, servers, serverDirectoryStatus, serverDirectoryError, onFetchServers, onUseServer }: FeatureContentProps) {
  switch (item.id) {
    case 'chat': return <ChatPanel item={item} connectionState={connectionState} onAction={onAction} />;
    case 'players': return <PlayersPanel item={item} onAction={onAction} />;
    case 'servers': return <ServersPanel item={item} servers={servers} status={serverDirectoryStatus} error={serverDirectoryError} onFetchServers={onFetchServers} onUseServer={onUseServer} />;
    case 'files': return <FileBrowserPanel item={item} connectionState={connectionState} gameServerApi={gameServerApi} onAction={onAction} />;
    case 'server-options': return <EditorPanel item={item} operation="read server options" onAction={onAction} />;
    case 'folder-config': return <EditorPanel item={item} operation="read folder config" onAction={onAction} />;
    case 'server-flags': return <EditorPanel item={item} operation="read server flags" onAction={onAction} />;
    case 'weapons': return <CatalogPanel item={item} noun="weapon" onAction={onAction} />;
    case 'npcs': return <CatalogPanel item={item} noun="NPC" onAction={onAction} />;
    case 'classes': return <CatalogPanel item={item} noun="class" onAction={onAction} />;
    default: return null;
  }
}

interface PanelFeatureProps {
  item: NavigationItem;
  onAction: (feature: FeatureId, operation: string) => void;
}

function ChatPanel({ item, connectionState, onAction }: PanelFeatureProps & { connectionState: ConnectionState }) {
  const [message, setMessage] = useState('');
  const connected = connectionState === 'connected';
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;
    onAction(item.id, 'send chat message');
    setMessage('');
  };
  return <div className="chat-surface">
    <EmptyState title={connected ? 'RC chat unavailable' : 'No remote-control session'} description={connected ? 'GameServer API login succeeded, but the current API contract does not expose an RC chat transport.' : 'Connect to a GameServer API to receive chat output and issue RC commands.'} icon={item.icon} />
    <form className="chat-composer" onSubmit={submit}>
      <TextField className="rc-text-field" label="Command or message" placeholder="Type a command…" value={message} onChange={(event: ChangeEvent<HTMLInputElement>) => setMessage(event.target.value)} fullWidth />
      <Button className="rc-button rc-button-primary" type="submit" disabled={!message.trim()}>Send</Button>
    </form>
  </div>;
}

function PlayersPanel({ item, onAction }: PanelFeatureProps) {
  const [query, setQuery] = useState('');
  return <FeaturePanel title={item.label} description={item.description} icon={item.icon}>
    <ToolRow end={<Button className="rc-button rc-button-muted" onClick={() => onAction(item.id, 'list players')} startIcon={<RefreshIcon />}>Refresh</Button>}>
      <TextField className="rc-text-field compact-field" label="Search players" placeholder="Account or nickname" value={query} onChange={event => setQuery(event.target.value)} InputProps={{ startAdornment: <SearchIcon className="field-icon" /> }} />
    </ToolRow>
    <DataTable columns={['Player', 'Account', 'Level', 'Status']} emptyTitle={query ? 'No matching players' : 'No players loaded'} emptyDescription="Player data will appear here after the player API is connected." />
  </FeaturePanel>;
}

interface ServersPanelProps {
  item: NavigationItem;
  servers: readonly GraalServer[];
  status: ServerDirectoryStatus;
  error: string | null;
  onFetchServers: () => void;
  onUseServer: (server: GraalServer) => void;
}

function ServersPanel({ item, servers, status, error, onFetchServers, onUseServer }: ServersPanelProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: ServerSortKey; direction: SortDirection }>({ key: 'name', direction: 'asc' });
  const filteredServers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return servers;
    return servers.filter(server => [server.name, server.ip, server.type, server.version].some(value => value.toLowerCase().includes(normalizedQuery)));
  }, [query, servers]);
  const sortedServers = useMemo(() => [...filteredServers].sort((left, right) => compareServers(left, right, sort)), [filteredServers, sort]);
  const handleSort = (key: string) => {
    if (!isServerSortKey(key)) return;
    setSort(current => current.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
  };
  const rows = sortedServers.map(server => {
    const endpoint = getServerEndpoint(server);
    return <tr key={server.id}>
      <td><div className="server-name-cell"><strong>{server.name}</strong><span>{server.type} · {server.version}</span></div></td>
      <td>{server.ip}:{server.port}</td>
      <td>{server.playerCount}</td>
      <td>{server.latency} ms</td>
      <td><Button className="rc-button rc-button-muted" size="small" disabled={!endpoint} onClick={() => onUseServer(server)}>Use endpoint</Button></td>
    </tr>;
  });
  return <section className="feature-panel servers-panel">
    <div className="feature-panel-body">
      {status === 'loading' && <EmptyState title="Loading server list" description="Polling api.graalserver.com for online servers." icon={item.icon} />}
      {status === 'error' && <EmptyState title="Unable to load servers" description={error ?? 'The public server directory could not be read.'} icon={item.icon} action={<Button className="rc-button rc-button-muted" onClick={onFetchServers}>Try again</Button>} />}
      {status !== 'loading' && status !== 'error' && servers.length === 0 && <EmptyState title="No servers loaded" description="Fetch the public server directory to see available IPs and ports." icon={item.icon} />}
      {status === 'ready' && servers.length > 0 && <>
        <ToolRow>
          <TextField className="rc-text-field compact-field" label="Search servers" placeholder="Name or address" value={query} onChange={event => setQuery(event.target.value)} InputProps={{ startAdornment: <SearchIcon className="field-icon" /> }} />
        </ToolRow>
        <DataTable columns={[{ label: 'Server', sortKey: 'name' }, { label: 'Address', sortKey: 'address' }, { label: 'Players', sortKey: 'players' }, { label: 'Latency', sortKey: 'latency' }, { label: '', headerAction: <IconButton className="server-refresh-button" onClick={onFetchServers} aria-label="Refresh server list" title="Refresh server list"><RefreshIcon /></IconButton> }]} sortKey={sort.key} sortDirection={sort.direction} onSort={handleSort} emptyTitle={query ? 'No matching servers' : 'No servers loaded'} emptyDescription={query ? 'Try a different name or address.' : 'The public server directory returned no rows.'}>{rows.length > 0 ? rows : undefined}</DataTable>
      </>}
    </div>
  </section>;
}

type ServerSortKey = 'name' | 'address' | 'players' | 'latency';
type SortDirection = 'asc' | 'desc';

function isServerSortKey(value: string): value is ServerSortKey {
  return value === 'name' || value === 'address' || value === 'players' || value === 'latency';
}

function compareServers(left: GraalServer, right: GraalServer, sort: { key: ServerSortKey; direction: SortDirection }): number {
  const leftValue = sort.key === 'players' ? left.playerCount : sort.key === 'latency' ? left.latency : sort.key === 'address' ? `${left.ip}:${left.port}` : left.name;
  const rightValue = sort.key === 'players' ? right.playerCount : sort.key === 'latency' ? right.latency : sort.key === 'address' ? `${right.ip}:${right.port}` : right.name;
  const result = typeof leftValue === 'number' && typeof rightValue === 'number' ? leftValue - rightValue : String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true, sensitivity: 'base' });
  return (result || left.id.localeCompare(right.id)) * (sort.direction === 'asc' ? 1 : -1);
}

function getServerEndpoint(server: GraalServer): string | null {
  return server.ip && server.ip !== '$AUTO' ? `http://${server.ip}` : null;
}

interface FileBrowserPanelProps extends PanelFeatureProps {
  connectionState: ConnectionState;
  gameServerApi: GameServerApi | null;
}

function FileBrowserPanel({ item, onAction, connectionState, gameServerApi }: FileBrowserPanelProps) {
  const [path, setPath] = useState('');
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<readonly ApiFileEntry[]>([]);
  const [status, setStatus] = useState<FileBrowserStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const canBrowse = connectionState === 'connected' && gameServerApi !== null;
  const loadFiles = useCallback(() => {
    if (!canBrowse || !gameServerApi) return;
    setStatus('loading');
    setError(null);
    void gameServerApi.listFiles(path).then(nextEntries => {
      setEntries(nextEntries);
      setStatus('ready');
    }).catch(reason => {
      setEntries([]);
      setStatus('error');
      setError(getFileListingError(reason));
    });
  }, [canBrowse, gameServerApi, path]);
  useEffect(() => {
    if (!canBrowse) {
      setEntries([]);
      setStatus('idle');
      setError(null);
      return;
    }
    loadFiles();
  }, [canBrowse, loadFiles]);
  const visibleEntries = useMemo(() => entries.filter(entry => entry.name.toLowerCase().includes(query.toLowerCase()) || entry.path.toLowerCase().includes(query.toLowerCase())), [entries, query]);
  const rows = visibleEntries.map(entry => {
    const entryPath = entry.path || [path, entry.name].filter(Boolean).join('/');
    return <tr key={entryPath}><td>{entry.isDirectory ? <Button className="path-button" onClick={() => setPath(entryPath)}>{entry.name}</Button> : <span>{entry.name}</span>}</td><td>{entry.isDirectory ? 'Directory' : 'File'}</td><td>{entry.isDirectory ? '—' : formatFileSize(entry.size)}</td><td>{formatFileModified(entry.modified)}</td><td /></tr>;
  });
  const emptyTitle = query ? 'No matching files' : 'No files in this folder';
  return <FeaturePanel title={item.label} description={item.description} icon={item.icon}>
    <ToolRow end={<>
      <Button className="rc-button rc-button-muted" onClick={loadFiles} disabled={!canBrowse || status === 'loading'} startIcon={<RefreshIcon />}>Refresh</Button>
      <Button className="rc-button rc-button-muted" onClick={() => onAction(item.id, 'create directory')} disabled={!canBrowse} startIcon={<CreateNewFolderOutlinedIcon />}>New folder</Button>
      <Button className="rc-button rc-button-primary" onClick={() => onAction(item.id, 'upload file')} disabled={!canBrowse} startIcon={<UploadFileIcon />}>Upload</Button>
    </>}>
      <TextField className="rc-text-field compact-field" label="Filter files" placeholder="Name or path" value={query} onChange={event => setQuery(event.target.value)} InputProps={{ startAdornment: <SearchIcon className="field-icon" /> }} />
    </ToolRow>
    <div className="file-browser-path"><Button className="path-button" disabled={!path} onClick={() => setPath('')} startIcon={<ArrowBackIcon />}>Root</Button><span>/</span><strong>{path || 'content root'}</strong></div>
    {!canBrowse && <EmptyState title="Connect to browse files" description="Authenticate to the GameServer API to list files allowed by the account." icon={item.icon} />}
    {canBrowse && status === 'loading' && <EmptyState title="Loading files" description="Reading the current content directory from the GameServer API." icon={item.icon} />}
    {canBrowse && status === 'error' && <EmptyState title="Unable to load files" description={error ?? 'The GameServer API did not return a file listing.'} icon={item.icon} action={<Button className="rc-button rc-button-muted" onClick={loadFiles}>Try again</Button>} />}
    {canBrowse && status === 'ready' && <DataTable columns={['Name', 'Type', 'Size', 'Modified', '']} emptyTitle={emptyTitle} emptyDescription="No entries matched the current folder and filter." >{rows.length > 0 ? rows : undefined}</DataTable>}
  </FeaturePanel>;
}

type FileBrowserStatus = 'idle' | 'loading' | 'ready' | 'error';

function getFileListingError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'The GameServer API session is no longer authorized.';
    return `File listing failed (${error.status}).`;
  }
  return error instanceof Error ? error.message : 'Could not load the file listing.';
}

function formatFileSize(size?: number | null): string {
  if (size == null) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFileModified(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

interface EditorPanelProps extends PanelFeatureProps {
  operation: string;
}

function EditorPanel({ item, operation, onAction }: EditorPanelProps) {
  const [source, setSource] = useState('');
  return <FeaturePanel title={item.label} description={item.description} icon={item.icon}>
    <ToolRow end={<>
      <Button className="rc-button rc-button-muted" onClick={() => onAction(item.id, operation)} startIcon={<RefreshIcon />}>Read source</Button>
      <Button className="rc-button rc-button-primary" onClick={() => onAction(item.id, `update ${item.label.toLowerCase()}`)} startIcon={<CodeIcon />}>Save changes</Button>
    </>}>
    </ToolRow>
    <TextField className="rc-editor" multiline minRows={15} value={source} onChange={event => setSource(event.target.value)} placeholder="Source will appear here when this API surface is available." fullWidth />
    <div className="editor-footer"><span>UTF-8</span><span>{source.length} characters</span></div>
  </FeaturePanel>;
}

interface CatalogPanelProps extends PanelFeatureProps {
  noun: string;
}

function CatalogPanel({ item, noun, onAction }: CatalogPanelProps) {
  const [query, setQuery] = useState('');
  const title = noun === 'NPC' ? 'NPC' : noun.charAt(0).toUpperCase() + noun.slice(1);
  const plural = noun === 'class' ? 'classes' : `${noun}s`;
  return <FeaturePanel title={item.label} description={item.description} icon={item.icon}>
    <ToolRow end={<Button className="rc-button rc-button-primary" onClick={() => onAction(item.id, `create ${noun}`)} startIcon={<AddIcon />}>Add {title}</Button>}>
      <TextField className="rc-text-field compact-field" label={`Search ${plural}`} placeholder={`Name or ${noun} ID`} value={query} onChange={event => setQuery(event.target.value)} InputProps={{ startAdornment: <SearchIcon className="field-icon" /> }} />
    </ToolRow>
    <DataTable columns={noun === 'NPC' ? ['Name', 'Type', 'Level', 'ID', ''] : ['Name', 'Source', 'Updated', '']} emptyTitle={query ? `No matching ${plural}` : `No ${plural} loaded`} emptyDescription={`The ${noun} API is not exposed yet; this panel is ready for its typed adapter methods.`} />
    {query.length > 0 && <div className="search-note">Filtering is local to the current empty result set.</div>}
  </FeaturePanel>;
}
