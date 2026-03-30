import type { ReleasePayload } from '@/schemas/api.ts';
import type { Manifest } from '@/schemas/manifest.ts';

/**
 * Builds a release notes URL from the manifest url and version.
 */
export const makeNotesUrl = (manifest: Manifest): string =>
  `${manifest.url}/releases/tag/v${manifest.version}`;

/**
 * Transforms a parsed manifest into a Foundry API release payload.
 */
export const makeReleasePayload =
  (releaseNotesUrl?: string) =>
  (manifest: Manifest): ReleasePayload => ({
    id: manifest.id,
    release: {
      version: manifest.version,
      manifest: manifest.manifest,
      notes: releaseNotesUrl ?? makeNotesUrl(manifest),
      compatibility: manifest.compatibility,
    },
  });
