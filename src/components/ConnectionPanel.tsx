import type { ChangeEvent, FormEvent } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DownloadIcon from '@mui/icons-material/Download';
import type { ConnectionForm } from '../types';

interface ConnectionPanelProps {
  value: ConnectionForm;
  onChange: (value: ConnectionForm) => void;
  onConnect: () => void;
  onFetchServers: () => void;
}

export function ConnectionPanel({ value, onChange, onConnect, onFetchServers }: ConnectionPanelProps) {
  const update = (field: keyof ConnectionForm) => (event: ChangeEvent<HTMLInputElement>) => onChange({ ...value, [field]: event.target.value });
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onConnect(); };
  return (
    <form className="connection-panel" onSubmit={submit}>
      <div className="connection-heading"><span>CONNECTION</span><span className="connection-dot" /></div>
      <TextField className="rc-text-field" label="GameServer API" placeholder="API base URL" value={value.endpoint} onChange={update('endpoint')} autoComplete="url" fullWidth />
      <TextField className="rc-text-field" label="Nickname" placeholder="Remote control name" value={value.nickname} onChange={update('nickname')} autoComplete="nickname" fullWidth />
      <TextField className="rc-text-field" label="Account" value={value.account} onChange={update('account')} autoComplete="username" fullWidth />
      <TextField className="rc-text-field" label="Password" type="password" value={value.password} onChange={update('password')} autoComplete="current-password" fullWidth />
      <div className="connection-actions">
        <Button className="rc-button rc-button-muted" type="button" onClick={onFetchServers} startIcon={<DownloadIcon />}>Fetch Servers</Button>
        <Button className="rc-button rc-button-primary" type="submit" endIcon={<ArrowForwardIcon />}>Connect</Button>
      </div>
    </form>
  );
}
