import { describe, expect, it } from 'vitest';

import { formatReleaseErrors, maskToken, toUserMessage } from '@/utils.ts';

const msg = (error: Record<string, unknown>) =>
  toUserMessage(error as { readonly _tag: string });

describe('maskToken', () => {
  it('masks the middle of a long token', () => {
    expect(maskToken('abcdef1234567890ghijkl')).toBe('abcdef**********ghijkl');
  });

  it('fully masks a short token', () => {
    expect(maskToken('short')).toBe('*****');
  });

  it('fully masks a 12-char token', () => {
    expect(maskToken('123456789012')).toBe('************');
  });

  it('masks a 13-char token with one star', () => {
    expect(maskToken('1234567890123')).toBe('123456*890123');
  });
});

describe('formatReleaseErrors', () => {
  it('formats array error messages', () => {
    const errors = {
      manifest: [{ message: 'This field is required.', code: 'required' }],
    };
    expect(formatReleaseErrors(errors)).toBe('manifest: This field is required.');
  });

  it('formats multiple errors across fields', () => {
    const errors = {
      __all__: [{ message: 'Duplicate version', code: 'unique_together' }],
      manifest: [{ message: 'Invalid URL', code: 'invalid' }],
    };
    expect(formatReleaseErrors(errors)).toBe(
      '__all__: Duplicate version; manifest: Invalid URL'
    );
  });

  it('handles non-array values gracefully', () => {
    const errors = { field: 'unexpected value' };
    expect(formatReleaseErrors(errors)).toBe('field: unexpected value');
  });
});

describe('toUserMessage', () => {
  it('maps InputValidationError', () => {
    expect(
      msg({ _tag: 'InputValidationError', message: 'bad token' })
    ).toBe('Invalid inputs: bad token');
  });

  it('maps ManifestNotFoundError', () => {
    expect(
      msg({ _tag: 'ManifestNotFoundError', path: '/missing.json' })
    ).toBe('Manifest not found: /missing.json');
  });

  it('maps ManifestParseError', () => {
    expect(
      msg({ _tag: 'ManifestParseError', path: '/bad.json' })
    ).toBe('Manifest is not valid JSON: /bad.json');
  });

  it('maps ManifestSchemaError', () => {
    expect(
      msg({ _tag: 'ManifestSchemaError', issue: 'missing id' })
    ).toBe('Manifest schema invalid: missing id');
  });

  it('maps ApiRequestError', () => {
    expect(
      msg({ _tag: 'ApiRequestError', cause: 'network down' })
    ).toBe('API request failed: network down');
  });

  it('maps ApiResponseError', () => {
    expect(msg({ _tag: 'ApiResponseError', status: 500 })).toBe(
      'API returned HTTP 500'
    );
  });

  it('maps ApiResponseSchemaError', () => {
    expect(
      msg({ _tag: 'ApiResponseSchemaError', issue: 'bad shape' })
    ).toBe('Unexpected API response: bad shape');
  });

  it('maps ApiRateLimitError', () => {
    expect(
      msg({ _tag: 'ApiRateLimitError', retryAfter: 30 })
    ).toBe('Rate limited. Retry after 30s');
  });

  it('maps ApiUnauthorizedError', () => {
    expect(
      msg({ _tag: 'ApiUnauthorizedError', status: 403 })
    ).toBe('Unauthorized (HTTP 403). Check your release token.');
  });

  it('maps ApiReleaseError', () => {
    expect(
      msg({
        _tag: 'ApiReleaseError',
        errors: {
          manifest: [{ message: 'required', code: 'required' }],
        },
      })
    ).toBe('Release failed: manifest: required');
  });

  it('maps unknown errors', () => {
    expect(msg({ _tag: 'SomethingElse' })).toBe(
      'Unexpected error: {"_tag":"SomethingElse"}'
    );
  });
});
