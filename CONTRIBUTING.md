# Contributing to SilentWatch

## Branch Workflow
- Active development is tracked on `silentwatch-gemini`. Do not force-push or rewrite shared history.

## Required Checks Before Opening a PR
```bash
cargo fmt --all -- --check
cargo clippy --workspace --exclude silentwatch-desktop --all-targets -- -D warnings
cargo test --workspace --exclude silentwatch-desktop
npm run typecheck
npm test
npm run build
```
