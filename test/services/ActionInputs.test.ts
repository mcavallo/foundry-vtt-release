import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActionInputs, ActionInputsLive } from '@/services/ActionInputs.ts';

const mockCore = {
  getInput: vi.fn(),
  getBooleanInput: vi.fn(),
};

vi.mock('@actions/core', () => mockCore);

const run = <A, E>(effect: Effect.Effect<A, E, ActionInputs>) =>
  Effect.runPromiseExit(Effect.provide(effect, ActionInputsLive));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ActionInputsLive', () => {
  it('parses valid inputs', async () => {
    mockCore.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        'foundry-release-token': 'fvttp_abc123',
        'manifest-path': 'dist/module.json',
        'release-notes-url': '',
      };
      return inputs[name] ?? '';
    });
    mockCore.getBooleanInput.mockReturnValue(false);

    const exit = await run(Effect.flatMap(ActionInputs, Effect.succeed));
    expect(exit._tag).toBe('Success');
    if (exit._tag === 'Success') {
      expect(exit.value).toStrictEqual({
        foundryReleaseToken: 'fvttp_abc123',
        manifestPath: 'dist/module.json',
        releaseNotesUrl: undefined,
        skipDryRun: false,
      });
    }
  });

  it('passes through release-notes-url when provided', async () => {
    mockCore.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        'foundry-release-token': 'fvttp_abc123',
        'manifest-path': 'dist/module.json',
        'release-notes-url': 'https://example.com/notes',
      };
      return inputs[name] ?? '';
    });
    mockCore.getBooleanInput.mockReturnValue(false);

    const exit = await run(Effect.flatMap(ActionInputs, Effect.succeed));
    expect(exit._tag).toBe('Success');
    if (exit._tag === 'Success') {
      expect(exit.value.releaseNotesUrl).toBe('https://example.com/notes');
    }
  });

  it('parses skip-dry-run as true', async () => {
    mockCore.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        'foundry-release-token': 'fvttp_abc123',
        'manifest-path': 'dist/module.json',
        'release-notes-url': '',
      };
      return inputs[name] ?? '';
    });
    mockCore.getBooleanInput.mockReturnValue(true);

    const exit = await run(Effect.flatMap(ActionInputs, Effect.succeed));
    expect(exit._tag).toBe('Success');
    if (exit._tag === 'Success') {
      expect(exit.value.skipDryRun).toBe(true);
    }
  });

  it('fails with InputValidationError when token is empty', async () => {
    mockCore.getInput.mockReturnValue('');
    mockCore.getBooleanInput.mockReturnValue(false);

    const exit = await run(Effect.flatMap(ActionInputs, Effect.succeed));
    expect(exit._tag).toBe('Failure');
  });
});
