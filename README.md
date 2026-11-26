# SilentWatch

**SilentWatch** is a Windows-first, local-first application behavior monitoring and investigation desktop application built with **Tauri 2**, **Rust**, **SQLite (WAL)**, **React**, **TypeScript**, and **Motion**.

SilentWatch helps device owners understand what applications and processes are actually doing on their own PC — capturing process lifecycles, parent-child relationships, executable identities and signatures, CPU/memory usage, network endpoints, loaded DLLs/modules, declarative rule evaluations, and sanitized local evidence reports — with **zero cloud uploads, zero accounts, and zero covert surveillance**.

---

## Key Capabilities
- **Dual Approved Visual Identity**:
  - **First-Launch & 5-Step Setup Wizard**: Mindly-inspired warm alabaster (`#FBFAF6`), `Instrument Serif` Roman + Italic headlines, sculptural anodized-graphite & smoked optical-glass aperture centerpiece, and 3 floating translucent telemetry cards.
  - **Main Desktop Workspace**: Helios-inspired obsidian dark (`#0A0A0A` inlays inside `#4D4449 → #151017` smoky wash) with strict single-identity Dusty Mauve (`#CBA6C5`) accents, `Geist Sans` + `Geist Mono` (`tabular-nums`), and Raycast-inspired desktop craft (zero `cursor: pointer`, zero startup white-flash, `Ctrl+K` Command Palette).
- **Flagship Behavior Explorer**: Interactive pan/zoom application behavior graph strictly separating **Confirmed Recorded Telemetry** (solid cubic bezier edges) from **Inferred Context** (dashed amber edges), with collapsible DLL clusters, pinned 340px Event Inspector, and millisecond chronological replay (`0.5x / 1x / 2x`).
- **Complete 4-Tier Motion System (`ANIM-01` – `ANIM-19`)**: Centralized motion tokens with `Full`, `Balanced`, and `Off` tiers plus automatic Windows reduced-motion support and hidden-window animation pausing.
- **Real Windows Monitoring Engine**:
  - Process lifecycle & PID-reuse-safe `ProcessInstanceId` (`boot_id + pid + start_time_ms`) via Toolhelp32 & Process APIs.
  - TCP/UDP owning-process attribution via Windows IP Helper API (`GetExtendedTcpTable` / `GetExtendedUdpTable`) without packet payload inspection.
  - Loaded DLL/module snapshots & Authenticode verification with honest snapshot-vs-ETW provenance.
  - Two-tier privilege model: **Standard Per-User** by default, optional **Enhanced ETW** only on explicit user request with clear UAC explanation.
- **Local SQLite WAL Storage & Sanitized Exports**: Versioned migrations, FIFO ring-buffer retention accounting for `.db` + `.db-wal`, strict Live vs. Demo Fixture isolation, and Markdown/JSON/CSV exports with automatic path & secret redaction.

---

## Windows PowerShell Setup, Build & Test Instructions

### Prerequisites (Windows 10/11)
1. **Node.js 20+** (`winget install OpenJS.NodeJS.LTS`)
2. **Rust stable toolchain** (`winget install Rustlang.Rustup`) with MSVC build tools (`Desktop development with C++`)
3. **WebView2 Runtime** (pre-installed on Windows 11; bundled bootstrapper configured for Windows 10)

### Development & Testing Commands (PowerShell)
```powershell
# 1. Clone the repository (silentwatch-gemini branch)
git clone -b silentwatch-gemini https://github.com/motionedits246-max/SilentWatch.git
cd SilentWatch

# 2. Generate desktop icons (one-time if icons are not yet present)
pip install pillow
python scripts/generate-icons.py

# 3. Install frontend dependencies
npm install

# 4. Run Rust backend tests (core, collectors, storage, rules, ipc)
cargo test --workspace --exclude silentwatch-desktop

# 5. Run frontend typecheck & Vitest component/interaction tests
npm run typecheck
npm test

# 6. Launch the full Tauri 2 desktop application in dev mode
npx tauri dev

# 7. Build unsigned Windows NSIS & MSI release installers
npx tauri build --bundles nsis,msi
```

> **CI Workflow Note**: Copy `docs/ci/github-actions-ci.yml` to `.github/workflows/ci.yml` to activate automated Rust, frontend, and Windows NSIS/MSI builds on GitHub Actions.
> **Installer Signing Note**: Local and CI builds produce **unsigned** Windows NSIS/MSI installers unless an official Authenticode certificate is configured in your environment.
