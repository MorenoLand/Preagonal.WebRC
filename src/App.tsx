import { useCallback, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ApiNotImplementedError, createPlaceholderApi } from './api/gameServerApi';
import { AppShell } from './components/AppShell';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { navigationById } from './navigation';
import { appTheme } from './theme';
import type { ActionNotice, ConnectionForm, FeatureId } from './types';
import './styles.css';

const initialConnection: ConnectionForm = { endpoint: '', nickname: '', account: '', password: '' };

export function App() {
  const [activeFeature, setActiveFeature] = useState<FeatureId>('chat');
  const [openFeatures, setOpenFeatures] = useState<FeatureId[]>(['chat']);
  const [connection, setConnection] = useState<ConnectionForm>(initialConnection);
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const placeholderApi = useMemo(() => createPlaceholderApi(), []);

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
  const handleConnect = useCallback(() => showPlaceholder('authentication', 'login'), [showPlaceholder]);
  const handleFetchServers = useCallback(() => showPlaceholder('servers', 'fetch'), [showPlaceholder]);

  return <ThemeProvider theme={appTheme}>
    <CssBaseline />
    <AppShell sidebar={<Sidebar activeFeature={activeFeature} connection={connection} onSelect={openFeature} onConnectionChange={setConnection} onConnect={handleConnect} onFetchServers={handleFetchServers} />}>
      <Workspace activeFeature={activeFeature} openFeatures={openFeatures} notice={notice} onSelect={openFeature} onClose={closeFeature} onAction={handleAction} />
    </AppShell>
  </ThemeProvider>;
}

export default App;
