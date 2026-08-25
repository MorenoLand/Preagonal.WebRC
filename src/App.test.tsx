import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the RC shell and the initial chat workspace', () => {
    render(<App />);
    expect(screen.getByText('RC Web')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'RC Chat' })).toBeInTheDocument();
    expect(screen.getByText('No remote-control session')).toBeInTheDocument();
  });

  it('opens feature panels from the sidebar without making a network request', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'File Browser' }));
    expect(screen.getByRole('heading', { name: 'File Browser' })).toBeInTheDocument();
    expect(screen.getByText('No files loaded')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows the typed placeholder state when a future operation is selected', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'NPCs' }));
    await user.click(screen.getByRole('button', { name: 'Add NPC' }));
    expect(screen.getByRole('status')).toHaveTextContent('NPCs create NPC is not implemented');
  });
});
