import { useMemo, useState } from 'react';
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
import { navigationById, type NavigationItem } from '../navigation';
import type { ApiFileEntry } from '../api/gameServerApi';
import type { ActionNotice, FeatureId } from '../types';
import { DataTable, FeaturePanel, ToolRow } from './FeaturePanel';
import { EmptyState } from './EmptyState';

const emptyFileEntries: readonly ApiFileEntry[] = [];

interface WorkspaceProps {
  activeFeature: FeatureId;
  openFeatures: FeatureId[];
  notice: ActionNotice | null;
  onSelect: (feature: FeatureId) => void;
  onClose: (feature: FeatureId) => void;
  onAction: (feature: FeatureId, operation: string) => void;
}

export function Workspace({ activeFeature, openFeatures, notice, onSelect, onClose, onAction }: WorkspaceProps) {
  const item = navigationById[activeFeature];
  return (
    <main className="workspace">
      <header className="workspace-topbar">
        <div className="workspace-location"><span>RC WEB</span><span className="location-separator">/</span><strong>{item.label}</strong></div>
        <div className="workspace-health"><span className="status-indicator" />API adapter ready<span className="health-divider" />Integration pending</div>
      </header>
      <div className="workspace-content">
        <TabBar activeFeature={activeFeature} openFeatures={openFeatures} onSelect={onSelect} onClose={onClose} />
        {notice && <div className={`notice notice-${notice.kind}`} role="status"><InfoOutlinedIcon /><span>{notice.text}</span></div>}
        <FeatureContent item={item} onAction={onAction} />
      </div>
      <footer className="workspace-footer"><span>PREAGONAL / RC WEB</span><span>v0.1 skeleton</span></footer>
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
  onAction: (feature: FeatureId, operation: string) => void;
}

function FeatureContent({ item, onAction }: FeatureContentProps) {
  switch (item.id) {
    case 'chat': return <ChatPanel item={item} onAction={onAction} />;
    case 'players': return <PlayersPanel item={item} onAction={onAction} />;
    case 'servers': return <ServersPanel item={item} onAction={onAction} />;
    case 'files': return <FileBrowserPanel item={item} onAction={onAction} />;
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

function ChatPanel({ item, onAction }: PanelFeatureProps) {
  const [message, setMessage] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;
    onAction(item.id, 'send chat message');
    setMessage('');
  };
  return <FeaturePanel title={item.label} description={item.description} icon={item.icon}>
    <div className="chat-surface">
      <EmptyState title="No remote-control session" description="Connect to a GameServer API to receive chat output and issue RC commands." icon={item.icon} />
      <form className="chat-composer" onSubmit={submit}>
        <TextField className="rc-text-field" label="Command or message" placeholder="Type a command…" value={message} onChange={(event: ChangeEvent<HTMLInputElement>) => setMessage(event.target.value)} fullWidth />
        <Button className="rc-button rc-button-primary" type="submit" disabled={!message.trim()}>Send</Button>
      </form>
    </div>
  </FeaturePanel>;
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

function ServersPanel({ item, onAction }: PanelFeatureProps) {
  return <FeaturePanel title={item.label} description={item.description} icon={item.icon}>
    <div className="feature-toolbar"><Button className="rc-button rc-button-muted" onClick={() => onAction(item.id, 'fetch servers')} startIcon={<RefreshIcon />}>Fetch server list</Button></div>
    <EmptyState title="No server selected" description="The server list is intentionally empty until the API adapter is enabled." icon={item.icon} />
  </FeaturePanel>;
}

function FileBrowserPanel({ item, onAction }: PanelFeatureProps) {
  const [path, setPath] = useState('');
  const [query, setQuery] = useState('');
  const visibleEntries = useMemo(() => emptyFileEntries.filter(entry => entry.name.toLowerCase().includes(query.toLowerCase())), [query]);
  return <FeaturePanel title={item.label} description={item.description} icon={item.icon}>
    <ToolRow end={<>
      <Button className="rc-button rc-button-muted" onClick={() => onAction(item.id, 'list files')} startIcon={<RefreshIcon />}>Refresh</Button>
      <Button className="rc-button rc-button-muted" onClick={() => onAction(item.id, 'create directory')} startIcon={<CreateNewFolderOutlinedIcon />}>New folder</Button>
      <Button className="rc-button rc-button-primary" onClick={() => onAction(item.id, 'upload file')} startIcon={<UploadFileIcon />}>Upload</Button>
    </>}>
      <TextField className="rc-text-field compact-field" label="Filter files" placeholder="Name or path" value={query} onChange={event => setQuery(event.target.value)} InputProps={{ startAdornment: <SearchIcon className="field-icon" /> }} />
    </ToolRow>
    <div className="file-browser-path"><Button className="path-button" disabled={!path} onClick={() => setPath('')} startIcon={<ArrowBackIcon />}>Root</Button><span>/</span><strong>{path || 'content root'}</strong></div>
    <DataTable columns={['Name', 'Type', 'Size', 'Modified', '']} emptyTitle={visibleEntries.length === 0 ? 'No files loaded' : 'No matching files'} emptyDescription="The visible entries will follow the GameServer ApiFileEntry contract." />
  </FeaturePanel>;
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
      <span className="tool-label">SOURCE EDITOR</span>
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
  return <FeaturePanel title={item.label} description={item.description} icon={item.icon}>
    <ToolRow end={<Button className="rc-button rc-button-primary" onClick={() => onAction(item.id, `create ${noun}`)} startIcon={<AddIcon />}>Add {title}</Button>}>
      <TextField className="rc-text-field compact-field" label={`Search ${noun}s`} placeholder={`Name or ${noun} ID`} value={query} onChange={event => setQuery(event.target.value)} InputProps={{ startAdornment: <SearchIcon className="field-icon" /> }} />
    </ToolRow>
    <DataTable columns={noun === 'NPC' ? ['Name', 'Type', 'Level', 'ID', ''] : ['Name', 'Source', 'Updated', '']} emptyTitle={query ? `No matching ${noun}s` : `No ${noun}s loaded`} emptyDescription={`The ${noun} API is not exposed yet; this panel is ready for its typed adapter methods.`} />
    {query.length > 0 && <div className="search-note">Filtering is local to the current empty result set.</div>}
  </FeaturePanel>;
}
