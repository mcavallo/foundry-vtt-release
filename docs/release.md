# Releasing

This project uses [release-please](https://github.com/googleapis/release-please) to automate versioning, changelogs, and GitHub releases.

## How it works

1. Push commits to `master` using [conventional commit](https://www.conventionalcommits.org/) format
2. release-please automatically creates or updates a release PR with:
   - Version bump in `package.json`
   - Generated `CHANGELOG.md` from commit messages
3. When you merge the release PR:
   - A git tag is created (e.g. `v1.2.0`)
   - A GitHub Release is published with the changelog
   - The major version tag (e.g. `v1`) is updated to point to the new release

A separate workflow rebuilds `dist/index.js` on every push to `master` that changes source files, so the bundle is always up to date before the release tag is created.

## Version bumps

The version bump is determined by the commit prefixes since the last release:

| Prefix                         | Bump                  | Example                             |
| ------------------------------ | --------------------- | ----------------------------------- |
| `fix:`                         | Patch (1.0.0 → 1.0.1) | `fix: handle 429 response`          |
| `feat:`                        | Minor (1.0.0 → 1.1.0) | `feat: add release-notes-url input` |
| `feat!:` or `BREAKING CHANGE:` | Major (1.0.0 → 2.0.0) | `feat!: require node 24`            |

Commits with `chore:`, `ci:`, `docs:`, `test:` prefixes are excluded from the changelog and don't trigger a version bump on their own.

## Manual steps

1. Write code and push to `master` with conventional commit messages
2. Review the release PR that release-please creates
3. Merge the release PR when ready to ship

That's it. Everything else is automated.
