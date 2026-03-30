default:
    @just --list

build:
    bunx rolldown -c rolldown.config.ts

test *args:
    bunx vitest run {{ args }}

test-coverage *args:
    bunx vitest run --coverage {{ args }}

typecheck:
    bunx tsgo --noEmit

lint *args:
    bunx oxlint {{ args }}

format *args:
    bunx oxfmt {{ args }}

format-check *args:
    bunx oxfmt --check {{ args }}
