import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ManifestReader, ManifestReaderLive } from '@/services/ManifestReader.ts';

const validManifest = {
  id: 'test-module',
  version: '1.0.0',
  manifest:
    'https://github.com/test/test-module/releases/latest/download/module.json',
  url: 'https://github.com/test/test-module',
  compatibility: { minimum: '13', verified: '13.351' },
};

let tmpFile: string;

beforeEach(() => {
  tmpFile = path.join(
    tmpdir(),
    `manifest-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
  );
});

afterEach(async () => {
  try {
    const { unlink } = await import('node:fs/promises');
    await unlink(tmpFile);
  } catch {}
});

const run = <A, E>(effect: Effect.Effect<A, E, ManifestReader>): Promise<A> =>
  Effect.runPromise(Effect.provide(effect, ManifestReaderLive));

describe('ManifestReader', () => {
  it('reads and validates a valid manifest', async () => {
    await writeFile(tmpFile, JSON.stringify(validManifest));
    const result = await run(Effect.flatMap(ManifestReader, (r) => r.read(tmpFile)));
    expect(result).toStrictEqual(validManifest);
  });

  it('fails with ManifestNotFoundError for missing file', async () => {
    const effect = Effect.flatMap(ManifestReader, (r) =>
      r.read('/nonexistent/manifest.json')
    );
    const exit = await Effect.runPromiseExit(
      Effect.provide(effect, ManifestReaderLive)
    );
    expect(exit._tag).toBe('Failure');
  });

  it('fails with ManifestParseError for invalid JSON', async () => {
    await writeFile(tmpFile, 'not valid json {{{');
    const exit = await Effect.runPromiseExit(
      Effect.provide(
        Effect.flatMap(ManifestReader, (r) => r.read(tmpFile)),
        ManifestReaderLive
      )
    );
    expect(exit._tag).toBe('Failure');
  });

  it('fails with ManifestSchemaError for invalid schema', async () => {
    await writeFile(tmpFile, JSON.stringify({ id: 'test' }));
    const exit = await Effect.runPromiseExit(
      Effect.provide(
        Effect.flatMap(ManifestReader, (r) => r.read(tmpFile)),
        ManifestReaderLive
      )
    );
    expect(exit._tag).toBe('Failure');
  });

  it('strips unknown fields from manifest', async () => {
    const manifest = { ...validManifest, extra: 'field', title: 'Test' };
    await writeFile(tmpFile, JSON.stringify(manifest));
    const result = await run(Effect.flatMap(ManifestReader, (r) => r.read(tmpFile)));
    expect(result).not.toHaveProperty('extra');
    expect(result).not.toHaveProperty('title');
  });
});
