import { Effect, pipe } from 'effect';

import { makeReleasePayload } from '@/payload.ts';
import type { ReleaseSuccessResponse } from '@/schemas/api.ts';
import { ActionInputs } from '@/services/ActionInputs.ts';
import { FoundryApi } from '@/services/FoundryApi.ts';
import { ManifestReader } from '@/services/ManifestReader.ts';
import { maskToken } from '@/utils.ts';

/**
 * Main release program.
 * Pipeline: read inputs → read manifest → make payload → dry-run? → release.
 */
export const program = Effect.gen(function* () {
  const inputs = yield* ActionInputs;
  const manifestReader = yield* ManifestReader;
  const api = yield* FoundryApi;

  const payload = yield* pipe(
    manifestReader.read(inputs.manifestPath),
    Effect.map(makeReleasePayload(inputs.releaseNotesUrl))
  );

  yield* Effect.log(
    `Releasing '${payload.id}' with token '${maskToken(inputs.foundryReleaseToken)}'`
  );

  if (!inputs.skipDryRun) {
    yield* Effect.log('Sending dry-run request...');
    yield* api.releaseVersion(payload, true);
    yield* Effect.log('Dry-run completed.');
  }

  yield* Effect.log('Sending release request...');
  const result: ReleaseSuccessResponse = yield* api.releaseVersion(payload, false);
  yield* Effect.log('Release completed.');

  return result;
});
