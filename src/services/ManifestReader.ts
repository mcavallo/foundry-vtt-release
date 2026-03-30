import { readFile } from 'node:fs/promises';

import { Context, Effect, Layer, Schema } from 'effect';

import {
  ManifestNotFoundError,
  ManifestParseError,
  ManifestSchemaError,
} from '@/errors.ts';
import { Manifest, type Manifest as ManifestType } from '@/schemas/manifest.ts';

/**
 * Service for reading and validating Foundry VTT manifest files.
 */
export class ManifestReader extends Context.Tag('ManifestReader')<
  ManifestReader,
  {
    /** Reads and validates a manifest file at the given path. */
    readonly read: (
      path: string
    ) => Effect.Effect<
      ManifestType,
      ManifestNotFoundError | ManifestParseError | ManifestSchemaError
    >;
  }
>() {}

/**
 * Reads a file as a UTF-8 string, mapping errors to ManifestNotFoundError.
 */
const readManifestFile = (path: string) =>
  Effect.tryPromise({
    try: () => readFile(path, 'utf-8'),
    catch: () => new ManifestNotFoundError({ path }),
  });

/**
 * Parses a JSON string, mapping errors to ManifestParseError.
 */
const parseJson = (path: string) => (content: string) =>
  Effect.try({
    try: () => JSON.parse(content) as unknown,
    catch: (cause) => new ManifestParseError({ path, cause }),
  });

/**
 * Validates an unknown value against the Manifest schema.
 */
const decodeManifest = Schema.decodeUnknown(Manifest);

/**
 * Validates unknown JSON against the Manifest schema.
 */
const validateManifest = (data: unknown) =>
  decodeManifest(data).pipe(
    Effect.mapError((e) => new ManifestSchemaError({ issue: String(e) }))
  );

/**
 * Live layer that reads manifest files from the filesystem.
 */
export const ManifestReaderLive = Layer.succeed(ManifestReader, {
  read: (path) =>
    readManifestFile(path).pipe(
      Effect.flatMap(parseJson(path)),
      Effect.flatMap(validateManifest)
    ),
});
