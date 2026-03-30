import * as core from '@actions/core';
import { Effect, Layer } from 'effect';

import { program } from '@/program.ts';
import { ActionInputs, ActionInputsLive } from '@/services/ActionInputs.ts';
import { makeFoundryApiLive } from '@/services/FoundryApi.ts';
import { ManifestReaderLive } from '@/services/ManifestReader.ts';
import { toUserMessage } from '@/utils.ts';

/**
 * Program with errors mapped to user-friendly strings.
 */
const withErrorHandling = Effect.catchAll(program, (error) =>
  Effect.fail(toUserMessage(error))
);

/**
 * FoundryApi layer derived from ActionInputs.
 * Reads the release token from inputs to construct the API client.
 */
const FoundryApiLive = Layer.unwrapEffect(
  Effect.map(ActionInputs, (inputs) =>
    makeFoundryApiLive(inputs.foundryReleaseToken)
  )
).pipe(Layer.provide(ActionInputsLive));

/**
 * Composite live layer providing all services.
 */
const LiveLayer = Layer.mergeAll(
  ActionInputsLive,
  ManifestReaderLive,
  FoundryApiLive
);

/**
 * Runs the program with live layers and reports results via @actions/core.
 */
Effect.runPromise(
  withErrorHandling.pipe(
    Effect.provide(LiveLayer),
    Effect.match({
      onSuccess: (result) => {
        core.info(`Release published: ${result.page}`);
      },
      onFailure: (message) => {
        core.setFailed(message);
      },
    })
  )
);
