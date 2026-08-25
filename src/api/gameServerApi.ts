import { ApiException as GeneratedApiException, GameServerClient, LoginRequest as GeneratedLoginRequest } from './generated/gameServerClient';
import type { FileParameter, ScriptExecutionStatistic, ScriptTypeMetadata } from './generated/gameServerClient';

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

export interface GraalServerPlayer {
  id: number;
  account: string;
  nickname: string;
  clientType: string;
  currentLevel: string;
  x: number;
  y: number;
  alignment: number;
}

export interface GraalServer {
  id: string;
  name: string;
  type: string;
  description: string;
  url: string;
  language: string;
  version: string;
  buildDate?: string;
  playerCount: number;
  players: readonly GraalServerPlayer[];
  ip: string;
  port: number;
  latency: number;
  allowedVersions: readonly string[];
}

export interface GraalServerDirectoryResponse {
  status: string;
  siteUrl: string;
  donateUrl: string;
  servers: readonly GraalServer[];
}

export const GRAAL_SERVER_DIRECTORY_URL = 'https://api.graalserver.com/servers';

export interface ServerDirectoryApi {
  listServers(): Promise<GraalServerDirectoryResponse>;
}

export interface FileWriteOptions {
  directory?: boolean;
  overwrite?: boolean;
}

export interface GameServerApi {
  login(request: LoginRequest): Promise<string>;
  getStats(): Promise<ServerStats>;
  getFileContent(path: string): Promise<string>;
  listFiles(path?: string): Promise<readonly ApiFileEntry[]>;
  putFile(path: string, file?: File, options?: FileWriteOptions): Promise<void>;
  renameFile(path: string, destination: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  getScriptDefinitions(): Promise<readonly ScriptTypeMetadata[]>;
  getScriptStats(): Promise<readonly ScriptExecutionStatistic[]>;
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
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  try {
    return new URL(trimmed).toString().replace(/\/+$/, '');
  } catch {
    return trimmed;
  }
}

export function normalizeServerDirectoryUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.toString().replace(/\/+$/, '');
  } catch {
    return '';
  }
}

export class HttpServerDirectoryApi implements ServerDirectoryApi {
  private readonly directoryUrl: string;

  constructor(directoryUrl = GRAAL_SERVER_DIRECTORY_URL, private readonly fetchImpl: FetchLike = browserFetch) {
    this.directoryUrl = normalizeServerDirectoryUrl(directoryUrl);
    if (!this.directoryUrl) throw new Error('Server directory URL must use http or https.');
  }

  async listServers(): Promise<GraalServerDirectoryResponse> {
    const response = await this.fetchImpl(this.directoryUrl, { headers: { Accept: 'application/json' } });
    const body = await response.text();
    if (!response.ok)
      throw new ApiError(response.status, body || response.statusText);
    if (!body)
      throw new Error('The server directory returned an empty response.');
    return normalizeServerDirectoryResponse(body);
  }
}

function normalizeServerDirectoryResponse(body: string): GraalServerDirectoryResponse {
  const payload = asRecord(JSON.parse(body), 'server directory response');
  const rawServers = readValue(payload, 'servers', 'Servers');
  if (!Array.isArray(rawServers)) throw new Error('The server directory response did not contain a servers array.');
  return { status: readString(payload, 'status', 'Status'), siteUrl: readString(payload, 'siteUrl', 'SiteUrl'), donateUrl: readString(payload, 'donateUrl', 'DonateUrl'), servers: rawServers.map(normalizeGraalServer) };
}

function normalizeGraalServer(value: unknown): GraalServer {
  const server = asRecord(value, 'server directory entry');
  return { id: readString(server, 'id', 'Id'), name: readString(server, 'name', 'Name'), type: readString(server, 'type', 'Type'), description: readString(server, 'description', 'Description'), url: readString(server, 'url', 'Url'), language: readString(server, 'language', 'Language'), version: readString(server, 'version', 'Version'), buildDate: readString(server, 'buildDate', 'BuildDate') || undefined, playerCount: readNumber(server, 'playerCount', 'PlayerCount'), players: normalizePlayers(readValue(server, 'players', 'Players')), ip: readString(server, 'ip', 'Ip'), port: readNumber(server, 'port', 'Port'), latency: readNumber(server, 'latency', 'Latency'), allowedVersions: readStringList(readValue(server, 'allowedVersions', 'AllowedVersions')) };
}

function normalizePlayers(value: unknown): readonly GraalServerPlayer[] {
  if (!Array.isArray(value)) return [];
  return value.map(entry => {
    const player = asRecord(entry, 'server player');
    return { id: readNumber(player, 'id', 'Id'), account: readString(player, 'account', 'Account'), nickname: readString(player, 'nickname', 'Nickname'), clientType: readString(player, 'clientType', 'ClientType'), currentLevel: readString(player, 'currentLevel', 'CurrentLevel'), x: readNumber(player, 'x', 'X'), y: readNumber(player, 'y', 'Y'), alignment: readNumber(player, 'alignment', 'Alignment') };
  });
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`The ${label} was not an object.`);
  return value as Record<string, unknown>;
}

function readValue(record: Record<string, unknown>, ...keys: string[]): unknown {
  return keys.map(key => record[key]).find(value => value !== undefined && value !== null);
}

function readString(record: Record<string, unknown>, ...keys: string[]): string {
  const value = readValue(record, ...keys);
  return value === undefined ? '' : String(value);
}

function readNumber(record: Record<string, unknown>, ...keys: string[]): number {
  const value = Number(readValue(record, ...keys));
  return Number.isFinite(value) ? value : 0;
}

function readStringList(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function normalizeStats(body: string): ServerStats {
  const payload = asRecord(JSON.parse(body), 'server stats response');
  return { levels: readNumber(payload, 'levels', 'Levels'), players: readNumber(payload, 'players', 'Players') };
}

export function normalizeFilePath(value: string): string {
  const normalized = value.replaceAll('\\', '/').split('/').filter(Boolean).join('/');
  if (normalized.includes(':') || normalized.split('/').some(part => part === '.' || part === '..'))
    throw new Error('File paths must remain relative to the GameServer content root.');
  return normalized;
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
const browserFetch: FetchLike = (input, init) => globalThis.fetch(input, init);

function emptyMultipartFile(): FileParameter {
  return { data: new Blob(), fileName: 'file' };
}

export class HttpGameServerApi implements GameServerApi {
  private token: string | null = null;
  private readonly baseUrl: string;
  private readonly client: GameServerClient;

  constructor(baseUrl: string, private readonly fetchImpl: FetchLike = browserFetch) {
    this.baseUrl = normalizeApiBaseUrl(baseUrl);
    this.client = new GameServerClient(this.baseUrl, { fetch: (input, init) => this.fetchWithAuth(input, init) });
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  async login(request: LoginRequest): Promise<string> {
    this.token = null;
    const token = await this.run(() => this.client.login(new GeneratedLoginRequest({ account: request.account, password: request.password })));
    this.token = token;
    return token;
  }

  async getStats(): Promise<ServerStats> {
    const body = await this.readBody(`${this.baseUrl}/api/v1/stats`, { headers: { Accept: 'application/json' } }, 'Server stats');
    return normalizeStats(body);
  }

  async getFileContent(path: string): Promise<string> {
    const normalized = normalizeFilePath(path);
    if (!normalized) throw new Error('A file path is required.');
    return this.readBody(`${this.baseUrl}/api/v1/files/${encodeURIComponent(normalized)}`, { headers: { Accept: 'text/plain, application/octet-stream' } }, 'File read');
  }

  async listFiles(path = ''): Promise<readonly ApiFileEntry[]> {
    const normalized = normalizeFilePath(path);
    const entries = await this.run(() => normalized ? this.client.filesAll2(normalized) : this.client.filesAll());
    return entries.map(entry => ({ name: entry.name ?? '', path: entry.path ?? '', isDirectory: entry.isDirectory ?? false, size: entry.size, modified: entry.modified?.toISOString() ?? null }));
  }

  putFile(path: string, file?: File, options: FileWriteOptions = {}): Promise<void> {
    const normalized = normalizeFilePath(path);
    const parameter: FileParameter | undefined = file ? { data: file, fileName: file.name } : options.directory ? emptyMultipartFile() : undefined;
    return this.run(() => normalized ? this.client.filesPUT2(normalized, options.directory, options.overwrite, parameter) : this.client.filesPUT(options.directory, options.overwrite, parameter));
  }

  renameFile(path: string, destination: string): Promise<void> {
    const normalized = normalizeFilePath(path);
    const target = normalizeFilePath(destination);
    const parameter = emptyMultipartFile();
    return this.run(() => normalized ? this.client.filesPOST2(normalized, target, parameter) : this.client.filesPOST(target, parameter));
  }

  deleteFile(path: string): Promise<void> {
    const normalized = normalizeFilePath(path);
    return this.run(() => normalized ? this.client.filesDELETE2(normalized) : this.client.filesDELETE());
  }

  getScriptDefinitions(): Promise<readonly ScriptTypeMetadata[]> {
    return this.run(() => this.client.definitions());
  }

  getScriptStats(): Promise<readonly ScriptExecutionStatistic[]> {
    return this.run(() => this.client.statsAll());
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

  private fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    if (this.token)
      headers.set('Authorization', `Bearer ${this.token}`);
    return this.fetchImpl(input, { ...init, headers });
  }

  private async readBody(input: RequestInfo | URL, init: RequestInit, operation: string): Promise<string> {
    const response = await this.fetchWithAuth(input, init);
    const body = await response.text();
    if (!response.ok) throw new ApiError(response.status, body || response.statusText || `${operation} failed.`);
    return body;
  }

  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (GeneratedApiException.isApiException(error))
        throw new ApiError(error.status, error.response || error.message);
      throw error;
    }
  }
}

export class PlaceholderGameServerApi {
  async getStats(): Promise<ServerStats> { return this.run('server stats', 'read'); }
  async getFileContent(_path: string): Promise<string> { return this.run('file browser', 'read'); }
  async listFiles(_path = ''): Promise<readonly ApiFileEntry[]> { return this.run('file browser', 'list'); }
  async putFile(_path: string, _file?: File, _options?: FileWriteOptions): Promise<void> { return this.run('file browser', 'write'); }
  async renameFile(_path: string, _destination: string): Promise<void> { return this.run('file browser', 'rename'); }
  async deleteFile(_path: string): Promise<void> { return this.run('file browser', 'delete'); }
  async getScriptDefinitions(): Promise<readonly ScriptTypeMetadata[]> { return this.run('scripts', 'definitions'); }
  async getScriptStats(): Promise<readonly ScriptExecutionStatistic[]> { return this.run('scripts', 'stats'); }
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

export function createServerDirectoryApi(directoryUrl = GRAAL_SERVER_DIRECTORY_URL, fetchImpl?: FetchLike): HttpServerDirectoryApi {
  return new HttpServerDirectoryApi(directoryUrl, fetchImpl);
}
