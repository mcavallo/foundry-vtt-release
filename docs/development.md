# Development

## Requirements

- [Bun](https://bun.sh/) (runtime and package manager)
- [just](https://just.systems/) (task runner)

## Setup

```bash
bun install
```

## Available commands

Run `just` to see all available recipes.

| Command              | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `just build`         | Bundle `src/main.ts` into `dist/index.js` using rolldown |
| `just test`          | Run tests                                                |
| `just test-coverage` | Run tests with coverage report                           |
| `just typecheck`     | Type-check with tsgo                                     |
| `just lint`          | Lint with oxlint                                         |
| `just format`        | Format with oxfmt                                        |
| `just format-check`  | Check formatting                                         |

All commands that accept extra arguments can be passed through, e.g. `just test --reporter verbose`.

## Tech stack

- **TypeScript** with [Effect](https://effect.website/) for typed functional composition
- **Bun** as runtime and package manager
- **rolldown** for bundling
- **tsgo** (`@typescript/native-preview`) for type-checking
- **oxlint** for linting
- **oxfmt** for formatting
- **vitest** for testing with v8 coverage

## Project structure

```
src/
├── main.ts              # Entry point, layer wiring, error presentation
├── program.ts           # Pipeline: inputs → manifest → payload → release
├── errors.ts            # Tagged error types (Data.TaggedError)
├── payload.ts           # Pure: manifest → release payload
├── utils.ts             # Pure: maskToken, formatReleaseErrors
├── schemas/
│   ├── manifest.ts      # Manifest schema (module.json / system.json)
│   ├── inputs.ts        # Action inputs schema
│   └── api.ts           # API request/response schemas
└── services/
    ├── ActionInputs.ts  # Reads inputs from @actions/core
    ├── ManifestReader.ts # Reads and validates manifest files
    └── FoundryApi.ts    # HTTP client for the Foundry Release API
```

## Contributing

1. Create a branch from `master`
2. Make your changes
3. Ensure all checks pass: `just format-check && just lint && just typecheck && just test`
4. Use [conventional commits](https://www.conventionalcommits.org/) (e.g. `feat:`, `fix:`, `chore:`)
5. Open a pull request against `master`

CI will run format, lint, typecheck, and test checks on your PR.
