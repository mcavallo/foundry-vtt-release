import { Schema } from 'effect';
import { describe, expect, it } from 'vitest';

import {
  ReleaseErrorResponse,
  ReleaseResponse,
  ReleaseSuccessResponse,
} from '@/schemas/api.ts';

describe('ReleaseSuccessResponse schema', () => {
  const decode = Schema.decodeUnknownSync(ReleaseSuccessResponse);

  it('decodes a success response', () => {
    const data = {
      status: 'success',
      page: 'https://foundryvtt.com/packages/my-module/edit/',
    };
    expect(decode(data)).toStrictEqual(data);
  });

  it('decodes a dry-run success response with message', () => {
    const data = {
      status: 'success',
      page: 'https://foundryvtt.com/packages/my-module/edit/',
      message: 'Dry run completed successfully.',
    };
    expect(decode(data)).toStrictEqual(data);
  });

  it('rejects a response with wrong status', () => {
    expect(() => decode({ status: 'error', page: '/edit/' })).toThrow();
  });
});

describe('ReleaseErrorResponse schema', () => {
  const decode = Schema.decodeUnknownSync(ReleaseErrorResponse);

  it('decodes an error response with field errors', () => {
    const data = {
      status: 'error',
      errors: {
        manifest: [{ message: 'This field is required.', code: 'required' }],
      },
    };
    expect(decode(data)).toStrictEqual(data);
  });

  it('decodes an error response without errors object', () => {
    expect(decode({ status: 'error' })).toStrictEqual({
      status: 'error',
    });
  });
});

describe('ReleaseResponse schema', () => {
  const decode = Schema.decodeUnknownSync(ReleaseResponse);

  it('decodes a success response', () => {
    const data = {
      status: 'success',
      page: 'https://foundryvtt.com/packages/my-module/edit/',
    };
    expect(decode(data)).toStrictEqual(data);
  });

  it('decodes an error response', () => {
    const data = {
      status: 'error',
      errors: {
        __all__: [{ message: 'Duplicate', code: 'unique_together' }],
      },
    };
    expect(decode(data)).toStrictEqual(data);
  });
});
