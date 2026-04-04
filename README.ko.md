# claudesync

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) 설정을 GitHub Gist로 동기화합니다.

[![npm version](https://img.shields.io/npm/v/claudesync)](https://www.npmjs.com/package/claudesync)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)

[English](./README.md)

## 왜 만들었나요?

Claude Code의 설정(`~/.claude/`)은 기기 간 동기화가 안 됩니다. 커스텀 인스트럭션, 훅, 스킬, 키바인딩 등을 여러 머신에서 매번 다시 설정해야 하죠.

**claudesync**는 이 설정들을 비공개 GitHub Gist에 저장해서, 어디서든 한 줄로 복원할 수 있게 해줍니다.

- **카테고리별 동기화** — `--only hooks`, `--only skills` 등 필요한 것만 골라서
- **diff 미리보기** — 적용 전에 뭐가 바뀌는지 정확히 확인
- **버전 관리** — 리비전 탐색, 원하는 시점으로 롤백
- **자동 동기화** — OS 스케줄러를 활용한 주기적 push/pull
- **비밀 탐지** — push 전에 API 키, 토큰, 개인 키를 자동 스캔
- **암호화** — AES-256-GCM 선택적 파일 암호화
- **토큰 안전 저장** — macOS Keychain / Linux libsecret / 암호화 파일 fallback
- **런타임 의존성 제로** — Node.js 내장 모듈만 사용

## 설치

```bash
npm install -g claudesync
```

<details>
<summary>소스에서 빌드</summary>

```bash
git clone https://github.com/cares0/claudesync.git
cd claudesync
npm install
npm run build
npm link
```

</details>

**Node.js 18+** 필요.

## 시작하기

```bash
# 1. GitHub 인증 (브라우저 열림)
claudesync init

# 2. 설정 업로드
claudesync push -m "첫 동기화"

# 3. 다른 머신에서 가져오기
claudesync init
claudesync pull
```

실행 예시:

```
$ claudesync push -m "첫 동기화"
  ~/.claude/ 스캔 중...

  변경사항:
    + [settings]     settings.json
    + [settings]     keybindings.json
    + [instructions] CLAUDE.md
    + [hooks]        hooks/pre-tool-use.sh
    + [skills]       skills/my-skill.md

  5개 파일 업로드. 계속할까요? (Y/n) y

  ✔ Gist에 푸시 완료 (5개 파일)
    https://gist.github.com/you/abc123
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

대화 로그, 세션, 캐시, `~/.claude.json` 등은 동기화하지 **않습니다**.

## 명령어

### 인증

```bash
claudesync init                    # OAuth Device Flow (브라우저)
claudesync init --token            # PAT 직접 입력
claudesync link <gist-id>          # 기존 Gist 연결
```

### 동기화

```bash
claudesync push                    # Gist에 업로드
claudesync push -m "메시지"        # 메시지와 함께 업로드
claudesync push --only hooks       # 단일 카테고리
claudesync push --encrypt          # 암호화 후 업로드
claudesync push --force            # 확인 없이 실행

claudesync pull                    # Gist에서 가져오기 (diff 먼저 표시)
claudesync pull --only skills      # 단일 카테고리
claudesync pull --force            # 확인 없이 실행
```

### 비교

```bash
claudesync diff                    # 전체 diff: 로컬 vs 원격
claudesync diff --only settings    # 단일 카테고리 diff
claudesync status                  # 인증/동기화 상태
claudesync list                    # 동기화 대상 파일 목록
claudesync list --only hooks       # 단일 카테고리 목록
```

### 히스토리

```bash
claudesync history                 # 최근 리비전 (최대 10개)
claudesync rollback <version>      # 특정 리비전으로 복원
```

### 자동 동기화

```bash
claudesync auto                    # 대화형 설정 (방향, 간격, 카테고리)
claudesync auto status             # 현재 설정 및 최근 로그
claudesync auto disable            # 자동 동기화 중지 및 해제
```

**launchd** (macOS), **systemd** (Linux), **Task Scheduler** (Windows)를 통해 주기적 동기화를 설정합니다. push/pull 방향, 간격(최소 60초), 카테고리 필터, 암호화, 충돌 정책(덮어쓰기 / 건너뛰기 / 백업)을 지원합니다.

### 설정

```bash
claudesync config list             # 현재 설정 보기
claudesync config lang ko          # 한국어로 변경
claudesync config lang en          # 영어로 변경
```

## 옵션

| 플래그 | 설명 |
|--------|------|
| `-m, --message <msg>` | 동기화 메시지 (`history`에서 확인 가능) |
| `--only <category>` | 필터: `settings` / `instructions` / `hooks` / `skills` / `plugins` / `teams` / `ui` |
| `--force` | 확인 프롬프트 건너뛰기 |
| `--encrypt` | AES-256-GCM으로 암호화 후 업로드 |
| `--lang ko\|en` | 출력 언어 변경 |
| `-h, --help` | 도움말 |
| `-v, --version` | 버전 정보 |

## 작동 방식

설정 파일은 하나의 **비공개 GitHub Gist**에 저장됩니다. 각 파일이 Gist 파일에 1:1로 매핑되며, 디렉토리 구분자는 `--`로 변환됩니다 (예: `hooks/pre-tool-use.sh` → `hooks--pre-tool-use.sh`).

Gist 안의 `_meta.json`에 파일 매핑, 카테고리, 암호화 여부, 동기화 시각, 머신 정보, push 메시지가 기록됩니다. Gist의 내장 리비전 히스토리가 `history`와 `rollback`을 지원합니다.

## 보안

- **토큰 저장** — macOS Keychain, Linux libsecret, 또는 `chmod 600` 파일
- **비밀 스캔** — 매 push마다 15개 정규식 패턴 + Shannon 엔트로피 분석
- **수동 제외** — `# claudesync:redact`를 줄에 추가하면 항상 제외
- **암호화** — `--encrypt` 옵션으로 AES-256-GCM + scrypt 키 유도 적용
- **비공개 Gist** — 모든 Gist는 비공개로 생성
- **경로 순회 방지** — pull/rollback 시 위험한 경로 차단
- **동시 실행 잠금** — 파일 기반 락으로 자동 동기화 중복 실행 방지

## 자주 묻는 질문

**내 설정이 외부에 노출되지는 않나요?**
Gist는 비공개로 생성됩니다. GitHub 토큰이나 직접 URL이 없으면 접근할 수 없습니다. `--encrypt`로 추가 보호가 가능합니다.

**프로젝트별 설정도 동기화할 수 있나요?**
아직은 전역 설정(`~/.claude/`)만 지원합니다.

**두 머신에서 설정을 각각 수정했으면 어떻게 되나요?**
`pull` 하면 diff를 먼저 보여줍니다. 기존 파일은 `.bak`으로 백업한 뒤 덮어씁니다.

**OAuth 말고 다른 인증 방법은?**
`claudesync init --token`으로 [Personal Access Token](https://github.com/settings/tokens)을 직접 입력할 수 있습니다. `gist` 권한만 필요합니다.

**여러 머신에서 자동 push를 하면 충돌이 생기지 않나요?**
자동 동기화는 **primary device**를 추적합니다. primary로 지정된 머신만 자동으로 push하므로 충돌이 방지됩니다.

**Windows에서도 되나요?**
네. 자동 동기화는 Windows Task Scheduler를 사용합니다. 토큰 저장은 암호화 파일로 fallback됩니다.

## 라이선스

[MIT](LICENSE)
