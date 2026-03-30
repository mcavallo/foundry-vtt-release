import { Schema } from 'effect';

import { Compatibility } from './manifest.ts';

/**
 * Schema for the release payload sent to the Foundry API.
 */
export const ReleasePayload = Schema.Struct({
  id: Schema.String,
  'dry-run': Schema.optional(Schema.Boolean),
  release: Schema.Struct({
    version: Schema.String,
    manifest: Schema.String,
    notes: Schema.String,
    compatibility: Compatibility,
  }),
});

/**
 * Schema for the Foundry API error entry.
 */
export const ReleaseError = Schema.Struct({
  message: Schema.String,
  code: Schema.String,
});

/**
 * Schema for a successful Foundry API response.
 */
export const ReleaseSuccessResponse = Schema.Struct({
  status: Schema.Literal('success'),
  page: Schema.String,
  message: Schema.optional(Schema.String),
});

/**
 * Schema for an error Foundry API response.
 */
export const ReleaseErrorResponse = Schema.Struct({
  status: Schema.Literal('error'),
  errors: Schema.optional(
    Schema.Struct({
      __all__: Schema.optional(Schema.Array(ReleaseError)),
      manifest: Schema.optional(Schema.Array(ReleaseError)),
    })
  ),
});

/**
 * Schema for any Foundry API response.
 */
export const ReleaseResponse = Schema.Union(
  ReleaseSuccessResponse,
  ReleaseErrorResponse
);

export type ReleasePayload = typeof ReleasePayload.Type;
export type ReleaseSuccessResponse = typeof ReleaseSuccessResponse.Type;
export type ReleaseErrorResponse = typeof ReleaseErrorResponse.Type;
export type ReleaseResponse = typeof ReleaseResponse.Type;
