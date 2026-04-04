# claudesync

Sync your [Claude Code](https://docs.anthropic.com/en/docs/claude-code) settings across machines using GitHub Gist.

[![npm version](https://img.shields.io/npm/v/claudesync)](https://www.npmjs.com/package/claudesync)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[한국어](./README.ko.md)

## Why?

Claude Code stores settings in `~/.claude/` — custom instructions, hooks, skills, keybindings, and more. These don't sync between machines.

**claudesync** stores them in a private GitHub Gist so you can restore your setup anywhere.

### Features

- **Selective sync** — Push/pull by category (`--only hooks`, `--only skills`)
- **Diff preview** — See what will change before applying
- **Version history** — Browse and rollback to any previous state
- **Secret detection** — Scans for API keys and credentials before upload
- **Zero runtime dependencies**
- **Secure token storage** — macOS Keychain / Linux libsecret

## Install

```bash
npm install -g claudesync
```

Requires **Node.js 18+**.

## Quick Start

```bash
# 1. Authenticate with GitHub
claudesync init

# 2. Upload your settings
claudesync push -m "initial sync"

# 3. On another machine
claudesync init
claudesync pull
```

## What Gets Synced

| Category | Files |
|----------|-------|
| **settings** | `settings.json`, `keybindings.json`, `policy-limits.json`, `remote-settings.json` |
| **instructions** | `CLAUDE.md` |
| **hooks** | `hooks/` directory |
| **skills** | `skills/` directory |
| **plugins** | `plugins/installed_plugins.json`, `known_marketplaces.json`, `blocklist.json` |
| **teams** | `teams/` directory |
| **ui** | `statusline-command.sh` |

Conversation logs, session data, caches, and `~/.claude.json` are **not synced** by design.

## Commands

```bash
# Auth
claudesync init                    # OAuth Device Flow
claudesync init --token            # Manual PAT input
claudesync link <gist-id>          # Link existing Gist

# Sync
claudesync push                    # Upload to Gist
claudesync push -m "message"       # Upload with message
claudesync push --only hooks       # Category filter
claudesync pull                    # Download (shows diff first)
claudesync pull --only skills      # Category filter

# Compare
claudesync diff                    # Local vs remote diff
claudesync status                  # Auth & sync status
claudesync list                    # List syncable files

# History
claudesync history                 # Recent revisions with messages
claudesync rollback <version>      # Restore specific revision
```

## Options

| Flag | Description |
|------|-------------|
| `-m, --message <msg>` | Message for push (shown in history) |
| `--only <category>` | `settings` / `instructions` / `hooks` / `skills` / `plugins` / `teams` / `ui` |
| `--force` | Skip confirmation |
| `--encrypt` | AES-256-GCM encrypt before upload |
| `--lang=ko\|en` | Display language |

## Security

- Tokens stored in macOS Keychain or Linux libsecret (file fallback with `chmod 600`)
- Automatic secret scanning before every push (API keys, tokens, private keys, high-entropy strings)
- Add `# claudesync:redact` to any line to always exclude it
- `--encrypt` for full AES-256-GCM encryption
- Gists are private by default

## FAQ

**Is my data safe?**
Gists are created as private. Only someone with your GitHub token or the direct URL can access them. Use `--encrypt` for additional security.

**Can I sync project-specific settings?**
Not yet. Currently only global `~/.claude/` settings are synced.

**What if settings changed on both machines?**
`pull` shows a diff first. Existing files are backed up as `.bak` before overwriting.

**Can I skip OAuth?**
Yes. `claudesync init --token` accepts a [Personal Access Token](https://github.com/settings/tokens) with `gist` scope.

## License

[MIT](LICENSE)
