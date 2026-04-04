# claudesync

Sync your [Claude Code](https://docs.anthropic.com/en/docs/claude-code) settings across machines via GitHub Gist.

[![npm version](https://img.shields.io/npm/v/claudesync)](https://www.npmjs.com/package/claudesync)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)

[한국어](./README.ko.md)

## Why?

Claude Code stores settings in `~/.claude/` — instructions, hooks, skills, keybindings, and more. These don't sync between machines.

**claudesync** saves them to a private GitHub Gist so you can restore your setup anywhere with one command.

- **Selective sync** — push/pull by category (`--only hooks`, `--only skills`)
- **Diff preview** — see exactly what changes before applying
- **Version history** — browse revisions and rollback to any state
- **Auto sync** — scheduled push/pull with OS-native schedulers
- **Secret detection** — scans for API keys, tokens, private keys before upload
- **Encryption** — optional AES-256-GCM encryption for all files
- **Secure token storage** — macOS Keychain / Linux libsecret / encrypted file fallback
- **Zero runtime dependencies** — Node.js built-ins only

## Install

```bash
npm install -g claudesync
```

<details>
<summary>Build from source</summary>

```bash
git clone https://github.com/cares0/claudesync.git
cd claudesync
npm install
npm run build
npm link
```

</details>

Requires **Node.js 18+**.

## Quick Start

```bash
# 1. Authenticate with GitHub (opens browser)
claudesync init

# 2. Upload your settings
claudesync push -m "initial sync"

# 3. On another machine — pull them down
claudesync init
claudesync pull
```

Example output:

```
$ claudesync push -m "initial sync"
  Scanning ~/.claude/ ...

  Changes:
    + [settings]     settings.json
    + [settings]     keybindings.json
    + [instructions] CLAUDE.md
    + [hooks]        hooks/pre-tool-use.sh
    + [skills]       skills/my-skill.md

  5 files to upload. Proceed? (Y/n) y

  ✔ Pushed to Gist (5 files)
    https://gist.github.com/you/abc123
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

Conversation logs, sessions, caches, and `~/.claude.json` are **never** synced.

## Commands

### Auth

```bash
claudesync init                    # OAuth Device Flow (browser)
claudesync init --token            # Manual PAT input
claudesync link <gist-id>          # Link an existing Gist
```

### Sync

```bash
claudesync push                    # Upload to Gist
claudesync push -m "message"       # With a sync message
claudesync push --only hooks       # Single category
claudesync push --encrypt          # Encrypt before upload
claudesync push --force            # Skip confirmation

claudesync pull                    # Download from Gist (shows diff first)
claudesync pull --only skills      # Single category
claudesync pull --force            # Skip confirmation
```

### Compare

```bash
claudesync diff                    # Full diff: local vs remote
claudesync diff --only settings    # Diff single category
claudesync status                  # Auth & sync status
claudesync list                    # List all syncable local files
claudesync list --only hooks       # List single category
```

### History

```bash
claudesync history                 # Recent revisions (last 10)
claudesync rollback <version>      # Restore a specific revision
```

### Auto Sync

```bash
claudesync auto                    # Interactive setup (direction, interval, categories)
claudesync auto status             # Show current auto-sync config & recent logs
claudesync auto disable            # Stop and unregister auto-sync
```

Sets up periodic sync via **launchd** (macOS), **systemd** (Linux), or **Task Scheduler** (Windows). Supports push/pull direction, configurable interval (min 60s), category filter, encryption, and conflict policies (overwrite / skip / backup).

### Config

```bash
claudesync config list             # Show all settings
claudesync config lang ko          # Set language to Korean
claudesync config lang en          # Set language to English
```

## Options

| Flag | Description |
|------|-------------|
| `-m, --message <msg>` | Sync message (shown in `history`) |
| `--only <category>` | Filter: `settings` / `instructions` / `hooks` / `skills` / `plugins` / `teams` / `ui` |
| `--force` | Skip confirmation prompts |
| `--encrypt` | AES-256-GCM encrypt files before upload |
| `--lang ko\|en` | Set display language |
| `-h, --help` | Show help |
| `-v, --version` | Show version |

## How It Works

Settings are stored as files in a single **private GitHub Gist**. Each file maps 1:1 to a Gist file, with directory separators converted to `--` (e.g. `hooks/pre-tool-use.sh` becomes `hooks--pre-tool-use.sh`).

A `_meta.json` file in the Gist tracks file mappings, categories, encryption status, sync timestamps, machine info, and push messages. Gist's built-in revision history powers `history` and `rollback`.

## Security

- **Token storage** — macOS Keychain, Linux libsecret, or file with `chmod 600`
- **Secret scanning** — 15 regex patterns + Shannon entropy analysis on every push
- **Manual redaction** — add `# claudesync:redact` to any line to always exclude it
- **Encryption** — `--encrypt` applies AES-256-GCM with scrypt key derivation
- **Private Gists** — all Gists are created as private
- **Path traversal protection** — blocks unsafe paths on pull/rollback
- **Concurrent lock** — file-based lock prevents overlapping auto-sync runs

## FAQ

**Is my data safe?**
Gists are private. Only someone with your GitHub token or the direct URL can see them. Use `--encrypt` for extra protection.

**Can I sync project-specific settings?**
Not yet — only global `~/.claude/` settings are supported.

**What if settings changed on both machines?**
`pull` shows a diff first. Existing files are backed up as `.bak` before overwriting.

**Can I skip OAuth?**
Yes. `claudesync init --token` accepts a [Personal Access Token](https://github.com/settings/tokens) with `gist` scope.

**What about multiple machines pushing?**
Auto-sync tracks a **primary device** for push mode. Only the primary machine pushes automatically, preventing conflicts.

**Does it work on Windows?**
Yes. Auto-sync uses Windows Task Scheduler. Token storage falls back to an encrypted file.

## License

[MIT](LICENSE)
