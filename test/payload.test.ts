import { describe, expect, it } from 'vitest';

import type { Manifest } from '@/schemas/manifest.ts';
import { makeNotesUrl, makeReleasePayload } from '@/payload.ts';

const baseManifest: Manifest = {
  id: 'my-module',
  version: '1.2.3',
  manifest:
    'https://github.com/mcavallo/my-module/releases/latest/download/module.json',
  url: 'https://github.com/mcavallo/my-module',
  compatibility: { minimum: '13', verified: '13.351' },
};

describe('makeNotesUrl', () => {
  it('builds the release notes URL from manifest url and version', () => {
    expect(makeNotesUrl(baseManifest)).toBe(
      'https://github.com/mcavallo/my-module/releases/tag/v1.2.3'
    );
  });
});

describe('makeReleasePayload', () => {
  it('transforms a manifest into a release payload', () => {
    expect(makeReleasePayload()(baseManifest)).toStrictEqual({
      id: 'my-module',
      release: {
        version: '1.2.3',
        manifest:
          'https://github.com/mcavallo/my-module/releases/latest/download/module.json',
        notes: 'https://github.com/mcavallo/my-module/releases/tag/v1.2.3',
        compatibility: { minimum: '13', verified: '13.351' },
      },
    });
  });

  it('uses custom release notes URL when provided', () => {
    const customUrl = 'https://example.com/changelog/v1.2.3';
    const result = makeReleasePayload(customUrl)(baseManifest);
    expect(result.release.notes).toBe(customUrl);
  });

  it('preserves optional maximum compatibility', () => {
    const manifest: Manifest = {
      ...baseManifest,
      compatibility: {
        minimum: '13',
        verified: '13.351',
        maximum: '13.999',
      },
    };
    expect(makeReleasePayload()(manifest).release.compatibility.maximum).toBe(
      '13.999'
    );
  });
});
