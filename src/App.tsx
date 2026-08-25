import { useCallback, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ApiError, ApiNotImplementedError, createHttpGameServerApi, createPlaceholderApi, createServerDirectoryApi, normalizeApiBaseUrl, type GraalServer } from './api/gameServerApi';
import { AppShell } from './components/AppShell';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { navigationById } from './navigation';
import { appTheme } from './theme';
import type { ActionNotice, ConnectionForm, ConnectionState, FeatureId, ServerDirectoryStatus } from './types';
import './styles.css';

const initialConnection: ConnectionForm = { endpoint: '', nickname: '', account: '', password: '' };

export function App() {
  const [activeFeature, setActiveFeature] = useState<FeatureId>('chat');
  const [openFeatures, setOpenFeatures] = useState<FeatureId[]>(['chat']);
  const [connection, setConnection] = useState<ConnectionForm>(initialConnection);
  const [connectionState, setConnectionState] = useState<ConnectionState>('offline');
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [servers, setServers] = useState<readonly GraalServer[]>([]);
  const [serverDirectoryStatus, setServerDirectoryStatus] = useState<ServerDirectoryStatus>('idle');
  const [serverDirectoryError, setServerDirectoryError] = useState<string | null>(null);
  const placeholderApi = useMemo(() => createPlaceholderApi(), []);
  const serverDirectoryApi = useMemo(() => createServerDirectoryApi(), []);
  const gameServerApi = useMemo(() => connection.endpoint.trim() ? createHttpGameServerApi(connection.endpoint) : null, [connection.endpoint]);

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
      setNotice(null);
    }
    setConnection(value);
  }, [connection.account, connection.endpoint, connection.password]);
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
    setNotice(null);
    void gameServerApi.login({ account, password: connection.password }).then(() => {
      setConnectionState('connected');
      setNotice({ kind: 'success', text: `Connected to ${endpoint}.` });
    }).catch(error => {
      setConnectionState('offline');
      setNotice({ kind: 'error', text: getConnectionErrorMessage(error) });
    });
  }, [connection.account, connection.endpoint, connection.password, gameServerApi]);
  const handleFetchServers = useCallback(() => {
    openFeature('servers');
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
    setConnection(current => ({ ...current, endpoint }));
    setConnectionState('offline');
    setNotice({ kind: 'success', text: `${server.name} endpoint selected.` });
  }, []);

  return <ThemeProvider theme={appTheme}>
    <CssBaseline />
    <AppShell sidebar={<Sidebar activeFeature={activeFeature} connection={connection} onSelect={openFeature} onConnectionChange={handleConnectionChange} onConnect={handleConnect} onFetchServers={handleFetchServers} fetchingServers={serverDirectoryStatus === 'loading'} connectionState={connectionState} />}>
      <Workspace activeFeature={activeFeature} openFeatures={openFeatures} notice={notice} connectionState={connectionState} onSelect={openFeature} onClose={closeFeature} onAction={handleAction} servers={servers} serverDirectoryStatus={serverDirectoryStatus} serverDirectoryError={serverDirectoryError} onFetchServers={handleFetchServers} onUseServer={handleUseServer} />
    </AppShell>
  </ThemeProvider>;
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
