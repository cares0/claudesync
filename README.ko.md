# claudesync

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) 설정을 GitHub Gist로 동기화합니다.

[![npm version](https://img.shields.io/npm/v/claudesync)](https://www.npmjs.com/package/claudesync)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](./README.md)

## 왜 만들었나요?

Claude Code의 설정 파일(`~/.claude/`)은 기기 간 동기화가 안 됩니다. 여러 머신에서 작업하면 매번 설정을 다시 해야 하죠.

**claudesync**는 이 설정들을 비공개 GitHub Gist에 저장해서, 어디서든 한 줄로 복원할 수 있게 해줍니다.

### 특징

- **카테고리별 동기화** — `--only hooks`, `--only skills` 등 필요한 것만 골라서
- **diff 미리보기** — 적용 전에 뭐가 바뀌는지 확인
- **버전 관리** — 이전 상태로 롤백 가능
- **비밀 탐지** — push 전에 API 키, 토큰 등을 자동으로 걸러냄
- **런타임 의존성 제로**
- **토큰 안전 저장** — macOS Keychain / Linux libsecret 사용

## 설치

```bash
npm install -g claudesync
```

**Node.js 18+** 필요.

## 시작하기

```bash
# 1. GitHub 인증
claudesync init

# 2. 설정 업로드
claudesync push -m "첫 동기화"

# 3. 다른 머신에서
claudesync init
claudesync pull
```

## 동기화 대상

| 카테고리 | 파일 |
|----------|------|
| **settings** | `settings.json`, `keybindings.json`, `policy-limits.json`, `remote-settings.json` |
| **instructions** | `CLAUDE.md` |
| **hooks** | `hooks/` 디렉토리 |
| **skills** | `skills/` 디렉토리 |
| **plugins** | `plugins/installed_plugins.json`, `known_marketplaces.json`, `blocklist.json` |
| **teams** | `teams/` 디렉토리 |
| **ui** | `statusline-command.sh` |

대화 로그, 세션, 캐시, `~/.claude.json` 등은 동기화하지 않습니다.

## 명령어

```bash
# 인증
claudesync init                    # OAuth (브라우저에서 인증)
claudesync init --token            # PAT 직접 입력
claudesync link <gist-id>          # 기존 Gist 연결

# 동기화
claudesync push                    # Gist에 업로드
claudesync push -m "메시지"        # 메시지 남기면서 업로드
claudesync push --only hooks       # hooks만 업로드
claudesync pull                    # Gist에서 가져오기 (diff 먼저 보여줌)
claudesync pull --only skills      # skills만 가져오기

# 비교
claudesync diff                    # 로컬 vs 원격 비교
claudesync status                  # 인증/동기화 상태
claudesync list                    # 동기화 대상 파일 목록

# 히스토리
claudesync history                 # 동기화 이력 (메시지 포함)
claudesync rollback <version>      # 특정 버전으로 복원
```

## 옵션

| 플래그 | 설명 |
|--------|------|
| `-m, --message <msg>` | push 메시지 (history에서 확인 가능) |
| `--only <category>` | `settings` / `instructions` / `hooks` / `skills` / `plugins` / `teams` / `ui` |
| `--force` | 확인 없이 바로 실행 |
| `--encrypt` | AES-256-GCM으로 암호화해서 업로드 |
| `--lang=ko\|en` | 출력 언어 변경 |

## 보안

- 토큰은 macOS Keychain이나 Linux libsecret에 저장 (없으면 파일에 `chmod 600`으로)
- push 전 자동으로 비밀 스캔 (API 키, 토큰, 개인 키, 수상한 문자열)
- 특정 줄에 `# claudesync:redact` 주석을 달면 무조건 제외
- `--encrypt` 옵션으로 전체 파일 암호화 가능
- Gist는 비공개로 생성

## 자주 묻는 질문

**내 설정이 외부에 노출되지는 않나요?**
Gist는 비공개로 만들어집니다. GitHub 토큰이나 직접 URL이 없으면 볼 수 없어요. 더 안전하게 하려면 `--encrypt`를 쓰세요.

**프로젝트별 설정도 동기화할 수 있나요?**
아직은 전역 설정(`~/.claude/`)만 지원합니다.

**두 머신에서 설정을 각각 수정했으면 어떻게 되나요?**
`pull` 하면 diff를 먼저 보여줍니다. 기존 파일은 `.bak`으로 백업한 뒤 덮어씁니다.

**OAuth 말고 다른 인증 방법은?**
`claudesync init --token`으로 [Personal Access Token](https://github.com/settings/tokens)을 직접 입력할 수 있습니다. `gist` 권한만 있으면 됩니다.

## 라이선스

[MIT](LICENSE)
