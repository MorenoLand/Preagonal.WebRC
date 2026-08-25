import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ApiError, ApiNotImplementedError, createHttpGameServerApi, createPlaceholderApi, createServerDirectoryApi, GRAAL_SERVER_DIRECTORY_URL, normalizeApiBaseUrl, normalizeServerDirectoryUrl, type GraalServer, type ServerStats } from './api/gameServerApi';
import { AppShell } from './components/AppShell';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { navigationById } from './navigation';
import { appTheme } from './theme';
import type { ActionNotice, ConnectionForm, ConnectionState, FeatureId, ServerDirectoryStatus } from './types';
import './styles.css';

const initialConnection: ConnectionForm = { endpoint: '', nickname: '', account: '', password: '' };
const serverDirectoryStorageKey = 'preagonal.webrc.server-directory-url.v1';

export function App() {
  const [activeFeature, setActiveFeature] = useState<FeatureId>('chat');
  const [openFeatures, setOpenFeatures] = useState<FeatureId[]>(['chat']);
  const [connection, setConnection] = useState<ConnectionForm>(initialConnection);
  const [serverDirectoryUrl, setServerDirectoryUrl] = useState(() => getStoredServerDirectoryUrl());
  const [connectionName, setConnectionName] = useState('');
  const [connectionState, setConnectionState] = useState<ConnectionState>('offline');
  const [serverStats, setServerStats] = useState<ServerStats | null>(null);
  const [serverStatsLoading, setServerStatsLoading] = useState(false);
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [servers, setServers] = useState<readonly GraalServer[]>([]);
  const [serverDirectoryStatus, setServerDirectoryStatus] = useState<ServerDirectoryStatus>('idle');
  const [serverDirectoryError, setServerDirectoryError] = useState<string | null>(null);
  const placeholderApi = useMemo(() => createPlaceholderApi(), []);
  const serverDirectoryApi = useMemo(() => {
    const normalizedUrl = normalizeServerDirectoryUrl(serverDirectoryUrl);
    return normalizedUrl ? createServerDirectoryApi(normalizedUrl) : null;
  }, [serverDirectoryUrl]);
  const gameServerApi = useMemo(() => connection.endpoint.trim() ? createHttpGameServerApi(connection.endpoint) : null, [connection.endpoint]);
  useEffect(() => {
    const normalizedUrl = normalizeServerDirectoryUrl(serverDirectoryUrl);
    try {
      if (normalizedUrl) window.localStorage.setItem(serverDirectoryStorageKey, normalizedUrl);
      else window.localStorage.removeItem(serverDirectoryStorageKey);
    } catch { }
  }, [serverDirectoryUrl]);

  const openFeature = useCallback((feature: FeatureId) => {
    setActiveFeature(feature);
    setOpenFeatures(current => current.includes(feature) ? current : [...current, feature]);
    setNotice(null);
  }, []);

  const closeFeature = useCallback((feature: FeatureId) => {
    setOpenFeatures(current => {
      if (current.length === 1) return current;
      const next = current.filter(item => item !== feature);
      if (activeFeature === feature) setActiveFeature(next[next.length - 1]);
      return next;
    });
  }, [activeFeature]);

  const showPlaceholder = useCallback((feature: string, operation: string) => {
    void placeholderApi.run(feature, operation).catch(error => {
      if (error instanceof ApiNotImplementedError)
        setNotice({ kind: 'info', text: `${error.message} The panel is ready for the future endpoint.` });
      else
        setNotice({ kind: 'error', text: 'The placeholder operation failed unexpectedly.' });
    });
  }, [placeholderApi]);

  const handleAction = useCallback((feature: FeatureId, operation: string) => showPlaceholder(navigationById[feature].label, operation), [showPlaceholder]);
  const handleConnectionChange = useCallback((value: ConnectionForm) => {
    if (value.endpoint.trim() !== connection.endpoint.trim() || value.account.trim() !== connection.account.trim() || value.password !== connection.password) {
      setConnectionState('offline');
      setServerStats(null);
      setServerStatsLoading(false);
      setNotice(null);
    }
    if (value.endpoint.trim() !== connection.endpoint.trim()) setConnectionName('');
    setConnection(value);
  }, [connection.account, connection.endpoint, connection.password]);
  const handleServerDirectoryUrlChange = useCallback((value: string) => {
    setServerDirectoryUrl(value);
    setServers([]);
    setServerDirectoryStatus('idle');
    setServerDirectoryError(null);
  }, []);
  const handleConnect = useCallback(() => {
    const endpoint = normalizeApiBaseUrl(connection.endpoint);
    const account = connection.account.trim();
    if (!endpoint || !account || !connection.password) {
      setConnectionState('offline');
      setNotice({ kind: 'error', text: 'GameServer API, account, and password are required.' });
      return;
    }
    if (!gameServerApi) return;
    setConnectionState('connecting');
    setServerStats(null);
    setServerStatsLoading(true);
    setNotice(null);
    void gameServerApi.login({ account, password: connection.password }).then(() => {
      setConnectionState('connected');
      setNotice({ kind: 'success', text: `Connected to ${endpoint}.` });
      void gameServerApi.getStats().then(setServerStats).catch(() => setServerStats(null)).finally(() => setServerStatsLoading(false));
      const knownServerName = connectionName || findServerName(endpoint, servers);
      if (knownServerName) {
        setConnectionName(knownServerName);
        return;
      }
      if (!serverDirectoryApi) return;
      void serverDirectoryApi.listServers().then(response => {
        const serverName = findServerName(endpoint, response.servers);
        if (serverName) setConnectionName(serverName);
      }).catch(() => undefined);
    }).catch(error => {
      setConnectionState('offline');
      setServerStats(null);
      setServerStatsLoading(false);
      setNotice({ kind: 'error', text: getConnectionErrorMessage(error) });
    });
  }, [connection.account, connection.endpoint, connection.password, connectionName, gameServerApi, serverDirectoryApi, servers]);
  const handleFetchServers = useCallback(() => {
    openFeature('servers');
    if (!serverDirectoryApi) {
      setServers([]);
      setServerDirectoryStatus('error');
      setServerDirectoryError('Enter a valid HTTP(S) server directory URL.');
      return;
    }
    setServerDirectoryStatus('loading');
    setServerDirectoryError(null);
    void serverDirectoryApi.listServers().then(response => {
      setServers(response.servers);
      setServerDirectoryStatus('ready');
    }).catch(error => {
      setServers([]);
      setServerDirectoryStatus('error');
      setServerDirectoryError(error instanceof Error ? error.message : 'The public server directory could not be read.');
    });
  }, [openFeature, serverDirectoryApi]);

  const handleUseServer = useCallback((server: GraalServer) => {
    if (!server.ip || server.ip === '$AUTO') return;
    const endpoint = normalizeApiBaseUrl(`http://${server.ip}`);
    setConnectionName(server.name);
    setConnection(current => ({ ...current, endpoint }));
    setConnectionState('offline');
    setServerStats(null);
    setServerStatsLoading(false);
    setNotice({ kind: 'success', text: `${server.name} selected.` });
  }, []);

  return <ThemeProvider theme={appTheme}>
    <CssBaseline />
    <AppShell sidebar={<Sidebar activeFeature={activeFeature} connection={connection} connectionName={connectionName} onlinePlayers={serverStats?.players ?? null} statsLoading={serverStatsLoading} serverDirectoryUrl={serverDirectoryUrl} onSelect={openFeature} onConnectionChange={handleConnectionChange} onServerDirectoryUrlChange={handleServerDirectoryUrlChange} onConnect={handleConnect} onFetchServers={handleFetchServers} fetchingServers={serverDirectoryStatus === 'loading'} connectionState={connectionState} />}>
      <Workspace activeFeature={activeFeature} openFeatures={openFeatures} notice={notice} connectionState={connectionState} gameServerApi={gameServerApi} onSelect={openFeature} onClose={closeFeature} onAction={handleAction} servers={servers} serverDirectoryStatus={serverDirectoryStatus} serverDirectoryError={serverDirectoryError} onFetchServers={handleFetchServers} onUseServer={handleUseServer} />
    </AppShell>
  </ThemeProvider>;
}

function getStoredServerDirectoryUrl(): string {
  try {
    const stored = window.localStorage.getItem(serverDirectoryStorageKey);
    return stored && normalizeServerDirectoryUrl(stored) ? normalizeServerDirectoryUrl(stored) : GRAAL_SERVER_DIRECTORY_URL;
  } catch {
    return GRAAL_SERVER_DIRECTORY_URL;
  }
}

function findServerName(endpoint: string, servers: readonly GraalServer[]): string {
  const host = getHost(endpoint);
  return servers.find(server => server.name && server.ip !== '$AUTO' && getHost(server.ip) === host)?.name ?? '';
}

function getHost(value: string): string {
  try {
    return new URL(value.includes('://') ? value : `http://${value}`).hostname.toLowerCase();
  } catch {
    return value.toLowerCase().split(':')[0];
  }
}

function getConnectionErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'The GameServer API rejected the account or password.';
    if (error.status === 503) return 'The GameServer API is not connected to its list server.';
    return `GameServer API request failed (${error.status}).`;
  }
  return error instanceof Error ? error.message : 'Could not connect to the GameServer API.';
}

export default App;
