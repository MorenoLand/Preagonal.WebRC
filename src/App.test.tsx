import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the RC shell and the initial chat workspace', () => {
    render(<App />);
    expect(screen.getByText('RC Web')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'RC Chat' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'RC Chat' })).not.toBeInTheDocument();
    expect(screen.getByText('No remote-control session')).toBeInTheDocument();
  });

  it('opens feature panels from the sidebar without making a network request', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'File Browser' }));
    expect(screen.getByRole('tab', { name: /File Browser/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'File Browser' })).not.toBeInTheDocument();
    expect(screen.getByText('Connect to browse files')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows the typed placeholder state when a future operation is selected', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'NPCs' }));
    await user.click(screen.getByRole('button', { name: 'Add NPC' }));
    expect(screen.getByRole('status')).toHaveTextContent('NPCs create NPC is not implemented');
  });

  it('fetches the public server directory and applies a selected endpoint', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ status: 'There is 1 server online.', siteUrl: '', donateUrl: '', servers: [{ id: 'server-1', name: 'SharpServer TEST', type: 'Hidden', description: 'CSharp GServer', url: '', language: 'English', version: 'Custom version: 0.0.25', playerCount: 1, players: [], ip: 'sharpserver.home.eevul.net', port: 14916, latency: 95, allowedVersions: [] }] }), { headers: { 'content-type': 'application/json' } }));
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Fetch Servers' }));
    await waitFor(() => expect(screen.getByText('SharpServer TEST')).toBeInTheDocument());
    expect(fetchSpy).toHaveBeenCalledWith('https://api.graalserver.com/servers', expect.objectContaining({ headers: { Accept: 'application/json' } }));
    await user.type(screen.getByRole('textbox', { name: 'Search servers' }), 'SharpServer');
    expect(screen.getByText('SharpServer TEST')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Use endpoint' }));
    expect(screen.getByRole('textbox', { name: 'GameServer API' })).toHaveValue('http://sharpserver.home.eevul.net');
    fetchSpy.mockRestore();
  });

  it('fetches servers from the configured directory URL and persists it', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ status: 'ok', siteUrl: '', donateUrl: '', servers: [{ id: 'custom-1', name: 'Custom Directory Server', type: 'Hosted', description: '', url: '', language: 'English', version: '1', playerCount: 0, players: [], ip: 'custom.test', port: 14916, latency: 0, allowedVersions: [] }] }), { headers: { 'content-type': 'application/json' } }));
    render(<App />);
    const directoryInput = screen.getByRole('textbox', { name: 'Server list API' });
    await user.clear(directoryInput);
    await user.type(directoryInput, 'https://directory.test/servers/');
    await user.click(screen.getByRole('button', { name: 'Fetch Servers' }));
    await waitFor(() => expect(screen.getByText('Custom Directory Server')).toBeInTheDocument());
    expect(fetchSpy).toHaveBeenCalledWith('https://directory.test/servers', expect.objectContaining({ headers: { Accept: 'application/json' } }));
    expect(window.localStorage.getItem('preagonal.webrc.server-directory-url.v1')).toBe('https://directory.test/servers');
    window.localStorage.removeItem('preagonal.webrc.server-directory-url.v1');
    fetchSpy.mockRestore();
  });

  it('authenticates against the selected GameServer API endpoint', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('jwt-token', { headers: { 'content-type': 'text/plain' } })).mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ok', siteUrl: '', donateUrl: '', servers: [{ id: 'server-1', name: 'SharpServer TEST', type: 'Hidden', description: '', url: '', language: 'English', version: '0.0.25', playerCount: 0, players: [], ip: 'server.test', port: 14916, latency: 0, allowedVersions: [] }] }), { headers: { 'content-type': 'application/json' } }));
    render(<App />);
    await user.type(screen.getByRole('textbox', { name: 'GameServer API' }), 'http://server.test');
    await user.type(screen.getByRole('textbox', { name: 'Account' }), 'staff');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Connect' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Connected to http://server.test.'));
    expect(fetchSpy).toHaveBeenCalledWith('http://server.test/api/v1/login', expect.objectContaining({ method: 'POST' }));
    const request = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(request.body).toBe(JSON.stringify({ account: 'staff', password: 'secret' }));
    await waitFor(() => expect(document.querySelector('.summary-status-label')).toHaveTextContent('SharpServer TEST'));
    expect(screen.queryByText('Connected · server.test')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit connection details' }));
    expect(screen.getByRole('textbox', { name: 'GameServer API' })).toBeVisible();
    expect(screen.getByText('RC chat unavailable')).toBeInTheDocument();
    fetchSpy.mockRestore();
  });

  it('lists files after the GameServer API session is authenticated', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('jwt-token', { headers: { 'content-type': 'text/plain' } })).mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ok', siteUrl: '', donateUrl: '', servers: [] }), { headers: { 'content-type': 'application/json' } })).mockResolvedValueOnce(new Response(JSON.stringify([
      { name: 'world', path: 'world', isDirectory: true, size: null, modified: null },
      { name: 'start.nw', path: 'start.nw', isDirectory: false, size: 2048, modified: '2026-08-25T12:00:00Z' }
    ]), { headers: { 'content-type': 'application/json' } }));
    render(<App />);
    await user.type(screen.getByRole('textbox', { name: 'GameServer API' }), 'http://server.test');
    await user.type(screen.getByRole('textbox', { name: 'Account' }), 'staff');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Connect' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Connected to http://server.test.'));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole('button', { name: 'File Browser' }));
    await waitFor(() => expect(screen.getByText('world')).toBeInTheDocument());
    expect(screen.getByText('start.nw')).toBeInTheDocument();
    expect(screen.getByTestId('file-entry-icon-world')).toBeInTheDocument();
    expect(screen.getByTestId('file-entry-icon-start.nw')).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenNthCalledWith(3, 'http://server.test/api/v1/files', expect.objectContaining({ headers: expect.any(Headers) }));
    const request = fetchSpy.mock.calls[2][1] as RequestInit;
    expect((request.headers as Headers).get('Authorization')).toBe('Bearer jwt-token');
    fetchSpy.mockRestore();
  });

  it('sorts server rows in both directions and by numeric columns', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ status: 'ok', siteUrl: '', donateUrl: '', servers: [
      { id: 'zeta', name: 'Zeta', type: 'Hosted', description: '', url: '', language: 'English', version: '1', playerCount: 2, players: [], ip: 'zeta.test', port: 1, latency: 90, allowedVersions: [] },
      { id: 'alpha', name: 'Alpha', type: 'Hosted', description: '', url: '', language: 'English', version: '1', playerCount: 1, players: [], ip: 'alpha.test', port: 2, latency: 10, allowedVersions: [] }
    ] }), { headers: { 'content-type': 'application/json' } }));
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Fetch Servers' }));
    await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument());
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Alpha');
    await user.type(screen.getByRole('textbox', { name: 'Search servers' }), 'Zeta');
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Zeta');
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    await user.clear(screen.getByRole('textbox', { name: 'Search servers' }));
    await user.click(screen.getByRole('button', { name: 'Sort by Server' }));
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Zeta');
    await user.click(screen.getByRole('button', { name: 'Sort by Players' }));
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Alpha');
    fetchSpy.mockRestore();
  });
});
