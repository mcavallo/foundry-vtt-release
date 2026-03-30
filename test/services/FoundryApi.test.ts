import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReleasePayload } from '@/schemas/api.ts';
import { FoundryApi, makeFoundryApiLive } from '@/services/FoundryApi.ts';

const TOKEN = 'fvttp_test_token_123456';

const payload: ReleasePayload = {
  id: 'my-module',
  release: {
    version: '1.0.0',
    manifest: 'https://example.com/module.json',
    notes: 'https://example.com/releases/tag/v1.0.0',
    compatibility: { minimum: '13', verified: '13.351' },
  },
};

const successResponse = {
  status: 'success' as const,
  page: 'https://foundryvtt.com/packages/my-module/edit/',
};

const dryRunResponse = {
  ...successResponse,
  message: 'Dry run completed successfully.',
};

const errorResponse = {
  status: 'error' as const,
  errors: {
    manifest: [{ message: 'This field is required.', code: 'required' }],
  },
};

const run = <A, E>(effect: Effect.Effect<A, E, FoundryApi>) =>
  Effect.runPromiseExit(Effect.provide(effect, makeFoundryApiLive(TOKEN)));

const mockFetch = (response: unknown, status = 200, headers = {}) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      headers: new Headers(headers),
      json: () => Promise.resolve(response),
    })
  );
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FoundryApi.releaseVersion', () => {
  it('returns success for a valid release', async () => {
    mockFetch(successResponse);
    const exit = await run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, false))
    );
    expect(exit._tag).toBe('Success');
  });

  it('sends dry-run flag when isDryRun is true', async () => {
    mockFetch(dryRunResponse);
    await run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, true))
    );
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]?.body as string);
    expect(body['dry-run']).toBe(true);
  });

  it('does not send dry-run flag when isDryRun is false', async () => {
    mockFetch(successResponse);
    await run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, false))
    );
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]?.body as string);
    expect(body['dry-run']).toBeUndefined();
  });

  it('sends correct authorization header', async () => {
    mockFetch(successResponse);
    await run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, false))
    );
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const headers = fetchCall[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe(TOKEN);
  });

  it('fails with ApiUnauthorizedError on 401', async () => {
    mockFetch({}, 401);
    const exit = await run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, false))
    );
    expect(exit._tag).toBe('Failure');
  });

  it('fails with ApiUnauthorizedError on 403', async () => {
    mockFetch({}, 403);
    const exit = await run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, false))
    );
    expect(exit._tag).toBe('Failure');
  });

  it('fails with ApiReleaseError on application-level error', async () => {
    mockFetch(errorResponse);
    const exit = await run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, false))
    );
    expect(exit._tag).toBe('Failure');
  });

  it('fails with ApiResponseError on non-ok status', async () => {
    mockFetch({ detail: 'Not found' }, 404);
    const exit = await run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, false))
    );
    expect(exit._tag).toBe('Failure');
  });

  it('fails with ApiRequestError on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const exit = await run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, false))
    );
    expect(exit._tag).toBe('Failure');
  });

  it('fails with ApiResponseError when response body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers(),
        json: () => Promise.reject(new Error('invalid json')),
      })
    );
    const exit = await run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, false))
    );
    expect(exit._tag).toBe('Failure');
  });

  it('fails with ApiResponseSchemaError when response JSON fails to parse', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.reject(new Error('json parse failed')),
      })
    );
    const exit = await run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, false))
    );
    expect(exit._tag).toBe('Failure');
  });

  it('fails with ApiResponseSchemaError when response does not match schema', async () => {
    mockFetch({ unexpected: 'shape' });
    const exit = await run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, false))
    );
    expect(exit._tag).toBe('Failure');
  });

  it('defaults Retry-After to 60 when header is missing', async () => {
    vi.useFakeTimers();
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            headers: new Headers(),
            json: () => Promise.resolve({}),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () => Promise.resolve(successResponse),
        });
      })
    );
    const promise = run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, false))
    );
    await vi.advanceTimersByTimeAsync(120_000);
    const exit = await promise;
    expect(exit._tag).toBe('Success');
    vi.useRealTimers();
  });

  it('defaults Retry-After to 60 when header is not a number', async () => {
    vi.useFakeTimers();
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            headers: new Headers({ 'Retry-After': 'invalid' }),
            json: () => Promise.resolve({}),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () => Promise.resolve(successResponse),
        });
      })
    );
    const promise = run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, false))
    );
    await vi.advanceTimersByTimeAsync(120_000);
    const exit = await promise;
    expect(exit._tag).toBe('Success');
    vi.useRealTimers();
  });

  it('fails with ApiReleaseError when errors object is undefined', async () => {
    mockFetch({ status: 'error' });
    const exit = await run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, false))
    );
    expect(exit._tag).toBe('Failure');
  });

  it('retries on 429 then succeeds', async () => {
    vi.useFakeTimers();
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            headers: new Headers({ 'Retry-After': '1' }),
            json: () => Promise.resolve({}),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () => Promise.resolve(successResponse),
        });
      })
    );
    const promise = run(
      Effect.flatMap(FoundryApi, (api) => api.releaseVersion(payload, false))
    );
    await vi.advanceTimersByTimeAsync(120_000);
    const exit = await promise;
    expect(exit._tag).toBe('Success');
    expect(callCount).toBeGreaterThanOrEqual(2);
    vi.useRealTimers();
  });
});
