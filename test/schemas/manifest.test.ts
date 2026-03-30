import { Schema } from 'effect';
import { describe, expect, it } from 'vitest';

import { Manifest } from '@/schemas/manifest.ts';

const decode = Schema.decodeUnknownSync(Manifest);

const validManifest = {
  id: 'my-module',
  version: '1.0.0',
  manifest:
    'https://github.com/mcavallo/my-module/releases/latest/download/module.json',
  url: 'https://github.com/mcavallo/my-module',
  compatibility: { minimum: '13', verified: '13.351' },
};

describe('Manifest schema', () => {
  it('decodes a valid manifest', () => {
    expect(decode(validManifest)).toStrictEqual(validManifest);
  });

  it('decodes a manifest with optional maximum compatibility', () => {
    const manifest = {
      ...validManifest,
      compatibility: { minimum: '13', verified: '13.351', maximum: '13.999' },
    };
    expect(decode(manifest)).toStrictEqual(manifest);
  });

  it('strips unknown fields', () => {
    const manifest = { ...validManifest, title: 'My Module', extra: true };
    const decoded = decode(manifest);
    expect(decoded).not.toHaveProperty('title');
    expect(decoded).not.toHaveProperty('extra');
  });

  it('rejects a manifest missing required fields', () => {
    const { id: _, ...incomplete } = validManifest;
    expect(() => decode(incomplete)).toThrow();
  });

  it('rejects a manifest with invalid compatibility', () => {
    const manifest = {
      ...validManifest,
      compatibility: { minimum: 13 },
    };
    expect(() => decode(manifest)).toThrow();
  });
});
