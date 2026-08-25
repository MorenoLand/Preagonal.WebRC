export type FeatureId = 'chat' | 'players' | 'servers' | 'files' | 'server-options' | 'folder-config' | 'server-flags' | 'weapons' | 'npcs' | 'classes';

export type ConnectionState = 'offline' | 'connected';

export interface ConnectionForm {
  endpoint: string;
  nickname: string;
  account: string;
  password: string;
}

export interface ActionNotice {
  kind: 'info' | 'success' | 'error';
  text: string;
}
