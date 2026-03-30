import { Schema } from 'effect';

/**
 * Schema for the GitHub Action inputs.
 */
export const ActionInputs = Schema.Struct({
  foundryReleaseToken: Schema.NonEmptyString,
  manifestPath: Schema.NonEmptyString,
  releaseNotesUrl: Schema.optional(Schema.NonEmptyString),
  skipDryRun: Schema.Boolean,
});

export type ActionInputs = typeof ActionInputs.Type;
