# SilentWatch Security & Privacy Policy

## Design Principles
1. **Least Privilege by Default**: SilentWatch runs under standard per-user Windows privileges. Enhanced ETW telemetry requires explicit user opt-in and standard Windows UAC approval. SilentWatch never bypasses UAC, installs kernel drivers, injects code into monitored processes, or conceals itself.
2. **Narrowly Scoped IPC**: The Tauri 2 capability manifest (`src-tauri/capabilities/default.json`) grants only essential window management permissions. Arbitrary shell execution and unrestricted filesystem access are strictly disabled. Command Palette actions are validated against an explicit Rust allowlist (`AllowlistedAction::parse_strict`).
3. **Strict Local Content Security Policy**: All fonts (`Geist Sans`, `Geist Mono`, `Instrument Serif`) and assets are bundled locally. Remote script execution and external network connections from the UI WebView are blocked by CSP.
4. **Automatic Redaction**: `RedactionEngine` strips user profile usernames (`%USERPROFILE%`, `$HOME`), `Bearer` tokens, and CLI secret arguments (`--token`, `--password`, `--api-key`) before persisting command-line metadata, diagnostic logs, or exported Markdown/JSON/CSV reports.
5. **Live / Demo Isolation**: Deterministic Demo Fixture data is served exclusively from read-only in-memory Rust/TS fixtures and never enters the live SQLite WAL database.
