export interface LoginRequest {
  account: string;
  password: string;
}

export interface ApiFileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number | null;
  modified?: string | null;
}

export interface ServerStats {
  levels: number;
  players: number;
}

export interface FileWriteOptions {
  directory?: boolean;
  overwrite?: boolean;
}

export interface GameServerApi {
  login(request: LoginRequest): Promise<string>;
  getStats(): Promise<ServerStats>;
  listFiles(path?: string): Promise<readonly ApiFileEntry[]>;
  putFile(path: string, file?: File, options?: FileWriteOptions): Promise<void>;
  renameFile(path: string, destination: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  getScriptDefinitions(): Promise<unknown>;
  getScriptStats(): Promise<unknown>;
  listPlayers(): Promise<never>;
  sendChat(message: string): Promise<never>;
  getServerOptions(): Promise<never>;
  updateServerOptions(source: string): Promise<never>;
  getFolderConfig(): Promise<never>;
  updateFolderConfig(source: string): Promise<never>;
  getServerFlags(): Promise<never>;
  updateServerFlags(source: string): Promise<never>;
  listWeapons(): Promise<never>;
  getWeapon(name: string): Promise<never>;
  saveWeapon(name: string, source: string): Promise<never>;
  deleteWeapon(name: string): Promise<never>;
  listNpcs(): Promise<never>;
  getNpc(id: number): Promise<never>;
  saveNpc(id: number, source: string): Promise<never>;
  deleteNpc(id: number): Promise<never>;
  listClasses(): Promise<never>;
  getClass(name: string): Promise<never>;
  saveClass(name: string, source: string): Promise<never>;
  deleteClass(name: string): Promise<never>;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiNotImplementedError extends Error {
  constructor(public readonly feature: string, public readonly operation: string) {
    super(`${feature} ${operation} is not implemented by the GameServer API yet.`);
    this.name = 'ApiNotImplementedError';
  }
}

export function normalizeApiBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function normalizeFilePath(value: string): string {
  const normalized = value.replaceAll('\\', '/').split('/').filter(Boolean).join('/');
  if (normalized.includes(':') || normalized.split('/').some(part => part === '.' || part === '..'))
    throw new Error('File paths must remain relative to the GameServer content root.');
  return normalized;
}

function encodeFilePath(path: string): string {
  return normalizeFilePath(path).split('/').map(segment => encodeURIComponent(segment)).join('/');
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class HttpGameServerApi implements GameServerApi {
  private token: string | null = null;

  constructor(private readonly baseUrl: string, private readonly fetchImpl: FetchLike = fetch) {}

  setToken(token: string | null): void {
    this.token = token;
  }

  async login(request: LoginRequest): Promise<string> {
    const token = await this.request<string>('/api/v1/login', { method: 'POST', body: JSON.stringify({ Account: request.account, Password: request.password }) });
    this.token = token;
    return token;
  }

  getStats(): Promise<ServerStats> {
    return this.request<ServerStats>('/api/v1/stats');
  }

  listFiles(path = ''): Promise<readonly ApiFileEntry[]> {
    const normalized = normalizeFilePath(path);
    return this.request<readonly ApiFileEntry[]>(normalized ? `/api/v1/files/${encodeFilePath(normalized)}` : '/api/v1/files');
  }

  putFile(path: string, file?: File, options: FileWriteOptions = {}): Promise<void> {
    const form = new FormData();
    if (!options.directory && file)
      form.append('file', file, file.name);
    const query = new URLSearchParams();
    if (options.directory)
      query.set('directory', 'true');
    if (options.overwrite)
      query.set('overwrite', 'true');
    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    return this.request<void>(`/api/v1/files/${encodeFilePath(path)}${suffix}`, { method: 'PUT', body: form });
  }

  renameFile(path: string, destination: string): Promise<void> {
    const form = new FormData();
    const query = new URLSearchParams({ destination: normalizeFilePath(destination) });
    return this.request<void>(`/api/v1/files/${encodeFilePath(path)}?${query.toString()}`, { method: 'POST', body: form });
  }

  deleteFile(path: string): Promise<void> {
    return this.request<void>(`/api/v1/files/${encodeFilePath(path)}`, { method: 'DELETE' });
  }

  getScriptDefinitions(): Promise<unknown> {
    return this.request<unknown>('/api/v1/scripts/definitions');
  }

  getScriptStats(): Promise<unknown> {
    return this.request<unknown>('/api/v1/scripts/stats');
  }

  listPlayers(): Promise<never> { return this.unsupported('players', 'list'); }
  sendChat(_message: string): Promise<never> { return this.unsupported('chat', 'send'); }
  getServerOptions(): Promise<never> { return this.unsupported('server options', 'read'); }
  updateServerOptions(_source: string): Promise<never> { return this.unsupported('server options', 'update'); }
  getFolderConfig(): Promise<never> { return this.unsupported('folder config', 'read'); }
  updateFolderConfig(_source: string): Promise<never> { return this.unsupported('folder config', 'update'); }
  getServerFlags(): Promise<never> { return this.unsupported('server flags', 'read'); }
  updateServerFlags(_source: string): Promise<never> { return this.unsupported('server flags', 'update'); }
  listWeapons(): Promise<never> { return this.unsupported('weapons', 'list'); }
  getWeapon(_name: string): Promise<never> { return this.unsupported('weapons', 'read'); }
  saveWeapon(_name: string, _source: string): Promise<never> { return this.unsupported('weapons', 'update'); }
  deleteWeapon(_name: string): Promise<never> { return this.unsupported('weapons', 'delete'); }
  listNpcs(): Promise<never> { return this.unsupported('NPCs', 'list'); }
  getNpc(_id: number): Promise<never> { return this.unsupported('NPCs', 'read'); }
  saveNpc(_id: number, _source: string): Promise<never> { return this.unsupported('NPCs', 'update'); }
  deleteNpc(_id: number): Promise<never> { return this.unsupported('NPCs', 'delete'); }
  listClasses(): Promise<never> { return this.unsupported('classes', 'list'); }
  getClass(_name: string): Promise<never> { return this.unsupported('classes', 'read'); }
  saveClass(_name: string, _source: string): Promise<never> { return this.unsupported('classes', 'update'); }
  deleteClass(_name: string): Promise<never> { return this.unsupported('classes', 'delete'); }

  private unsupported(feature: string, operation: string): Promise<never> {
    return Promise.reject(new ApiNotImplementedError(feature, operation));
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (this.token)
      headers.set('Authorization', `Bearer ${this.token}`);
    if (init.body && !(init.body instanceof FormData))
      headers.set('Content-Type', 'application/json');
    const response = await this.fetchImpl(`${normalizeApiBaseUrl(this.baseUrl)}${path}`, { ...init, headers });
    const body = await response.text();
    if (!response.ok)
      throw new ApiError(response.status, body || response.statusText);
    if (response.status === 204 || body.length === 0)
      return undefined as T;
    const contentType = response.headers.get('content-type') ?? '';
    return contentType.includes('json') ? JSON.parse(body) as T : body as T;
  }
}

export class PlaceholderGameServerApi implements GameServerApi {
  async login(_request: LoginRequest): Promise<string> { return this.run('authentication', 'login'); }
  async getStats(): Promise<ServerStats> { return this.run('server stats', 'read'); }
  async listFiles(_path = ''): Promise<readonly ApiFileEntry[]> { return this.run('file browser', 'list'); }
  async putFile(_path: string, _file?: File, _options?: FileWriteOptions): Promise<void> { return this.run('file browser', 'write'); }
  async renameFile(_path: string, _destination: string): Promise<void> { return this.run('file browser', 'rename'); }
  async deleteFile(_path: string): Promise<void> { return this.run('file browser', 'delete'); }
  async getScriptDefinitions(): Promise<unknown> { return this.run('scripts', 'definitions'); }
  async getScriptStats(): Promise<unknown> { return this.run('scripts', 'stats'); }
  async listPlayers(): Promise<never> { return this.run('players', 'list'); }
  async sendChat(_message: string): Promise<never> { return this.run('chat', 'send'); }
  async getServerOptions(): Promise<never> { return this.run('server options', 'read'); }
  async updateServerOptions(_source: string): Promise<never> { return this.run('server options', 'update'); }
  async getFolderConfig(): Promise<never> { return this.run('folder config', 'read'); }
  async updateFolderConfig(_source: string): Promise<never> { return this.run('folder config', 'update'); }
  async getServerFlags(): Promise<never> { return this.run('server flags', 'read'); }
  async updateServerFlags(_source: string): Promise<never> { return this.run('server flags', 'update'); }
  async listWeapons(): Promise<never> { return this.run('weapons', 'list'); }
  async getWeapon(_name: string): Promise<never> { return this.run('weapons', 'read'); }
  async saveWeapon(_name: string, _source: string): Promise<never> { return this.run('weapons', 'update'); }
  async deleteWeapon(_name: string): Promise<never> { return this.run('weapons', 'delete'); }
  async listNpcs(): Promise<never> { return this.run('NPCs', 'list'); }
  async getNpc(_id: number): Promise<never> { return this.run('NPCs', 'read'); }
  async saveNpc(_id: number, _source: string): Promise<never> { return this.run('NPCs', 'update'); }
  async deleteNpc(_id: number): Promise<never> { return this.run('NPCs', 'delete'); }
  async listClasses(): Promise<never> { return this.run('classes', 'list'); }
  async getClass(_name: string): Promise<never> { return this.run('classes', 'read'); }
  async saveClass(_name: string, _source: string): Promise<never> { return this.run('classes', 'update'); }
  async deleteClass(_name: string): Promise<never> { return this.run('classes', 'delete'); }

  async run(feature: string, operation: string): Promise<never> {
    throw new ApiNotImplementedError(feature, operation);
  }
}

export function createPlaceholderApi(): PlaceholderGameServerApi {
  return new PlaceholderGameServerApi();
}

export function createHttpGameServerApi(baseUrl: string, fetchImpl?: FetchLike): HttpGameServerApi {
  return new HttpGameServerApi(baseUrl, fetchImpl);
}
