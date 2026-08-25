import { describe, expect, it, vi } from 'vitest';
import { ApiError, HttpGameServerApi, normalizeFilePath } from './gameServerApi';

function response(body: string, status = 200, contentType = 'application/json'): Response {
  return new Response(status === 204 ? null : body, { status, headers: { 'content-type': contentType } });
}

describe('GameServerApi', () => {
  it('normalizes safe relative file paths and rejects traversal', () => {
    expect(normalizeFilePath('\\world\\start.nw')).toBe('world/start.nw');
    expect(() => normalizeFilePath('../outside.txt')).toThrow('relative to the GameServer content root');
    expect(() => normalizeFilePath('C:/outside.txt')).toThrow('relative to the GameServer content root');
  });

  it('builds the authenticated file listing request', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(response('[]'));
    const api = new HttpGameServerApi('http://server.test/', fetchSpy);
    api.setToken('jwt-token');
    await api.listFiles('world');
    expect(fetchSpy).toHaveBeenCalledWith('http://server.test/api/v1/files/world', expect.objectContaining({ headers: expect.any(Headers) }));
    const request = fetchSpy.mock.calls[0][1] as RequestInit;
    expect((request.headers as Headers).get('Authorization')).toBe('Bearer jwt-token');
  });

  it('builds multipart upload and rename requests', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(response('', 204, ''));
    const api = new HttpGameServerApi('http://server.test', fetchSpy);
    const file = new File(['source'], 'start.nw', { type: 'text/plain' });
    await api.putFile('world/start.nw', file, { overwrite: true });
    await api.renameFile('world/start.nw', 'world/renamed.nw');
    expect(fetchSpy).toHaveBeenNthCalledWith(1, 'http://server.test/api/v1/files/world/start.nw?overwrite=true', expect.objectContaining({ method: 'PUT', body: expect.any(FormData) }));
    expect(fetchSpy).toHaveBeenNthCalledWith(2, 'http://server.test/api/v1/files/world/start.nw?destination=world%2Frenamed.nw', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
  });

  it('maps protected API failures to ApiError', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(response('Forbidden', 403, 'text/plain'));
    const api = new HttpGameServerApi('http://server.test', fetchSpy);
    await expect(api.listFiles()).rejects.toEqual(expect.objectContaining({ status: 403, message: 'Forbidden' } satisfies Partial<ApiError>));
  });
});
