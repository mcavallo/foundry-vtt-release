# Foundry VTT Release

A GitHub Action for publishing [Foundry VTT](https://foundryvtt.com/) packages (modules and systems) using the [Package Release API](https://foundryvtt.com/article/package-release-api/).

## Requirements

- A **Foundry VTT package release token** — found on your package's page under "Package Release Token"
- A **built manifest file** (`module.json` or `system.json`) containing the package metadata

The manifest must include these fields: `id`, `version`, `manifest`, `url`, and `compatibility` (with `minimum` and `verified`).

## Inputs

| Input                   | Required | Default | Description                                                          |
| ----------------------- | -------- | ------- | -------------------------------------------------------------------- |
| `foundry-release-token` | Yes      | —       | Foundry VTT package release API token                                |
| `manifest-path`         | Yes      | —       | Path to the built manifest file (module.json or system.json)         |
| `release-notes-url`     | No       | —       | URL to the release notes. Derived from the manifest if not provided. |
| `skip-dry-run`          | No       | `false` | Skip the dry-run validation before the actual release                |

## Usage

### Basic module release

```yaml
- name: Publish to Foundry VTT
  uses: mcavallo/foundry-vtt-release@v1
  with:
    foundry-release-token: ${{ secrets.FOUNDRY_RELEASE_TOKEN }}
    manifest-path: dist/module.json
```

### System release

```yaml
- name: Publish to Foundry VTT
  uses: mcavallo/foundry-vtt-release@v1
  with:
    foundry-release-token: ${{ secrets.FOUNDRY_RELEASE_TOKEN }}
    manifest-path: dist/system.json
```

### Custom release notes URL

```yaml
- name: Publish to Foundry VTT
  uses: mcavallo/foundry-vtt-release@v1
  with:
    foundry-release-token: ${{ secrets.FOUNDRY_RELEASE_TOKEN }}
    manifest-path: dist/module.json
    release-notes-url: 'https://example.com/changelog/v1.2.3'
```

### Skipping dry-run

```yaml
- name: Publish to Foundry VTT
  uses: mcavallo/foundry-vtt-release@v1
  with:
    foundry-release-token: ${{ secrets.FOUNDRY_RELEASE_TOKEN }}
    manifest-path: dist/module.json
    skip-dry-run: 'true'
```

## How it works

1. Reads and validates the manifest file at the given path
2. Builds a release payload from the manifest metadata
3. Sends a dry-run request to the Foundry API to validate the payload (unless `skip-dry-run` is set)
4. Sends the actual release request to publish the package version

Release notes URL is automatically derived from the manifest as `{manifest.url}/releases/tag/v{version}`, unless overridden via the `release-notes-url` input.

## Documentation

- [Development](docs/development.md)
- [Releasing](docs/release.md)

## License

[MIT](LICENSE)
