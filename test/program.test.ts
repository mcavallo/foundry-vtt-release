import { Effect, Exit, Layer, LogLevel, Logger } from 'effect';
import { describe, expect, it } from 'vitest';

import type { Manifest } from '@/schemas/manifest.ts';
import type { ReleasePayload, ReleaseSuccessResponse } from '@/schemas/api.ts';
import { ActionInputs } from '@/services/ActionInputs.ts';
import { FoundryApi } from '@/services/FoundryApi.ts';
import { ManifestReader } from '@/services/ManifestReader.ts';
import { program } from '@/program.ts';

const testManifest: Manifest = {
  id: 'test-module',
  version: '2.0.0',
  manifest:
    'https://github.com/test/test-module/releases/latest/download/module.json',
  url: 'https://github.com/test/test-module',
  compatibility: { minimum: '13', verified: '13.351' },
};

const successResponse: ReleaseSuccessResponse = {
  status: 'success',
  page: 'https://foundryvtt.com/packages/test-module/edit/',
};

const makeTestInputs = (overrides: Partial<ActionInputs['Type']> = {}) =>
  Layer.succeed(ActionInputs, {
    foundryReleaseToken: 'fvttp_test_token',
    manifestPath: '/tmp/module.json',
    skipDryRun: false,
    ...overrides,
  });

const TestManifestReader = Layer.succeed(ManifestReader, {
  read: () => Effect.succeed(testManifest),
});

const makeTestApi = (
  fn?: (
    payload: ReleasePayload,
    isDryRun: boolean
  ) => Effect.Effect<ReleaseSuccessResponse, never>
) =>
  Layer.succeed(FoundryApi, {
    releaseVersion: fn ?? (() => Effect.succeed(successResponse)),
  });

const runProgram = (
  layers: Layer.Layer<ActionInputs | ManifestReader | FoundryApi>
) =>
  Effect.runPromiseExit(
    program.pipe(Effect.provide(layers), Logger.withMinimumLogLevel(LogLevel.None))
  );

describe('program', () => {
  it('executes dry-run then release by default', async () => {
    const calls: boolean[] = [];
    const TestApi = makeTestApi((_payload, isDryRun) => {
      calls.push(isDryRun);
      return Effect.succeed(successResponse);
    });
    const layers = Layer.mergeAll(makeTestInputs(), TestManifestReader, TestApi);
    const exit = await runProgram(layers);
    expect(exit._tag).toBe('Success');
    expect(calls).toStrictEqual([true, false]);
  });

  it('skips dry-run when skipDryRun is true', async () => {
    const calls: boolean[] = [];
    const TestApi = makeTestApi((_payload, isDryRun) => {
      calls.push(isDryRun);
      return Effect.succeed(successResponse);
    });
    const layers = Layer.mergeAll(
      makeTestInputs({ skipDryRun: true }),
      TestManifestReader,
      TestApi
    );
    const exit = await runProgram(layers);
    expect(exit._tag).toBe('Success');
    expect(calls).toStrictEqual([false]);
  });

  it('returns the success response from the release', async () => {
    const layers = Layer.mergeAll(
      makeTestInputs(),
      TestManifestReader,
      makeTestApi()
    );
    const exit = await runProgram(layers);
    expect(Exit.isSuccess(exit) && exit.value).toStrictEqual(successResponse);
  });

  it('sends correct payload derived from manifest', async () => {
    let capturedPayload: ReleasePayload | undefined;
    const TestApi = makeTestApi((payload, _isDryRun) => {
      capturedPayload = payload;
      return Effect.succeed(successResponse);
    });
    const layers = Layer.mergeAll(
      makeTestInputs({ skipDryRun: true }),
      TestManifestReader,
      TestApi
    );
    await runProgram(layers);
    expect(capturedPayload).toStrictEqual({
      id: 'test-module',
      release: {
        version: '2.0.0',
        manifest:
          'https://github.com/test/test-module/releases/latest/download/module.json',
        notes: 'https://github.com/test/test-module/releases/tag/v2.0.0',
        compatibility: { minimum: '13', verified: '13.351' },
      },
    });
  });
});
