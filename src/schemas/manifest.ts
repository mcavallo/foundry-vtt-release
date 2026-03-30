import { Schema } from 'effect';

/**
 * Schema for the compatibility section of a Foundry VTT manifest.
 */
export const Compatibility = Schema.Struct({
  minimum: Schema.String,
  verified: Schema.String,
  maximum: Schema.optional(Schema.String),
});

/**
 * Schema for a Foundry VTT manifest file (module.json or system.json).
 */
export const Manifest = Schema.Struct({
  id: Schema.String,
  version: Schema.String,
  manifest: Schema.String,
  url: Schema.String,
  compatibility: Compatibility,
});

export type Manifest = typeof Manifest.Type;
export type Compatibility = typeof Compatibility.Type;
