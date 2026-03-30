import { Context, Effect, Layer, Schema } from 'effect';

import { InputValidationError } from '@/errors.ts';
import {
  ActionInputs as ActionInputsSchema,
  type ActionInputs as ActionInputsType,
} from '@/schemas/inputs.ts';

/**
 * Service providing parsed and validated GitHub Action inputs.
 */
export class ActionInputs extends Context.Tag('ActionInputs')<
  ActionInputs,
  ActionInputsType
>() {}

/**
 * Reads a string input from @actions/core.
 */
const getInput = (core: typeof import('@actions/core'), name: string): string =>
  core.getInput(name);

/**
 * Reads a boolean input from @actions/core.
 */
const getBooleanInput = (
  core: typeof import('@actions/core'),
  name: string
): boolean => core.getBooleanInput(name);

/**
 * Live layer that reads inputs from the GitHub Action environment.
 */
export const ActionInputsLive = Layer.effect(
  ActionInputs,
  Effect.gen(function* () {
    const core = yield* Effect.promise(() => import('@actions/core'));
    const raw = {
      foundryReleaseToken: getInput(core, 'foundry-release-token'),
      manifestPath: getInput(core, 'manifest-path'),
      releaseNotesUrl: getInput(core, 'release-notes-url') || undefined,
      skipDryRun: getBooleanInput(core, 'skip-dry-run'),
    };
    return yield* Schema.decodeUnknown(ActionInputsSchema)(raw).pipe(
      Effect.mapError((e) => new InputValidationError({ message: String(e) }))
    );
  })
);
