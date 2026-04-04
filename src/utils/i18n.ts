import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { userConfigPath } from './paths.js';

type Lang = 'ko' | 'en';

const messages = {
  // ── General ───────────────────────────────
  'app.name': { ko: 'claudesync', en: 'claudesync' },
  'app.description': {
    ko: 'Claude Code 설정을 GitHub Gist로 동기화합니다',
    en: 'Sync Claude Code settings via GitHub Gist',
  },

  // ── Auth ──────────────────────────────────
  'auth.no_token': {
    ko: '인증 정보가 없습니다. `claudesync init`을 먼저 실행하세요.',
    en: 'No auth found. Run `claudesync init` first.',
  },
  'auth.token_saved': {
    ko: '토큰이 저장되었습니다.',
    en: 'Token saved.',
  },
  'auth.device_prompt': {
    ko: '아래 URL을 브라우저에서 열고 코드를 입력하세요:',
    en: 'Open the following URL and enter the code:',
  },
  'auth.waiting': {
    ko: '인증 대기 중...',
    en: 'Waiting for authorization...',
  },
  'auth.success': {
    ko: '인증 성공!',
    en: 'Authentication successful!',
  },
  'auth.enter_token': {
    ko: 'GitHub Personal Access Token (gist 스코프 필요): ',
    en: 'GitHub Personal Access Token (gist scope required): ',
  },

  // ── Push ──────────────────────────────────
  'push.scanning': {
    ko: '설정 파일을 스캔 중...',
    en: 'Scanning settings files...',
  },
  'push.no_files': {
    ko: '동기화할 파일이 없습니다.',
    en: 'No files to sync.',
  },
  'push.summary': {
    ko: '변경 요약:',
    en: 'Change summary:',
  },
  'push.confirm': {
    ko: '위 변경사항을 Gist에 업로드하시겠습니까?',
    en: 'Upload these changes to Gist?',
  },
  'push.success': {
    ko: 'Gist에 동기화 완료!',
    en: 'Synced to Gist!',
  },
  'push.cancelled': {
    ko: '업로드가 취소되었습니다.',
    en: 'Upload cancelled.',
  },
  'push.creating_gist': {
    ko: '새 Gist를 생성 중...',
    en: 'Creating new Gist...',
  },

  // ── Pull ──────────────────────────────────
  'pull.fetching': {
    ko: 'Gist에서 설정을 가져오는 중...',
    en: 'Fetching settings from Gist...',
  },
  'pull.no_changes': {
    ko: '변경사항이 없습니다. 로컬과 원격이 동일합니다.',
    en: 'No changes. Local and remote are identical.',
  },
  'pull.confirm': {
    ko: '위 변경사항을 로컬에 적용하시겠습니까?',
    en: 'Apply these changes locally?',
  },
  'pull.success': {
    ko: '로컬 설정이 업데이트되었습니다!',
    en: 'Local settings updated!',
  },
  'pull.cancelled': {
    ko: '복원이 취소되었습니다.',
    en: 'Restore cancelled.',
  },

  // ── Diff ──────────────────────────────────
  'diff.no_diff': {
    ko: '차이가 없습니다.',
    en: 'No differences found.',
  },

  // ── Status ────────────────────────────────
  'status.authenticated': {
    ko: '인증됨',
    en: 'Authenticated',
  },
  'status.not_authenticated': {
    ko: '인증 안됨',
    en: 'Not authenticated',
  },
  'status.gist_linked': {
    ko: 'Gist 연결됨',
    en: 'Gist linked',
  },
  'status.no_gist': {
    ko: 'Gist 연결 안됨',
    en: 'No Gist linked',
  },

  // ── History ───────────────────────────────
  'history.title': {
    ko: '동기화 히스토리',
    en: 'Sync history',
  },
  'history.empty': {
    ko: '히스토리가 없습니다.',
    en: 'No history found.',
  },

  // ── Conflict ──────────────────────────────
  'conflict.detected': {
    ko: '충돌이 감지되었습니다:',
    en: 'Conflicts detected:',
  },
  'conflict.options': {
    ko: '로컬 유지 / 원격 적용 / diff 보기 / 건너뛰기',
    en: 'Keep local / Use remote / Show diff / Skip',
  },

  // ── Errors ────────────────────────────────
  'error.gist_not_found': {
    ko: 'Gist를 찾을 수 없습니다. ID를 확인하세요.',
    en: 'Gist not found. Check the ID.',
  },
  'error.api_failed': {
    ko: 'GitHub API 요청 실패:',
    en: 'GitHub API request failed:',
  },
  'error.path_unsafe': {
    ko: '안전하지 않은 경로가 감지되었습니다:',
    en: 'Unsafe path detected:',
  },

  // ── Auto Sync ────────────────────────────────
  'auto.title': {
    ko: '자동 동기화 설정',
    en: 'Auto Sync Setup',
  },
  'auto.select_direction': {
    ko: 'push / pull 중 선택하세요:',
    en: 'Select push or pull:',
  },
  'auto.direction_push': {
    ko: 'Push — 이 디바이스의 설정을 Gist에 자동 업로드',
    en: 'Push — auto-upload this device settings to Gist',
  },
  'auto.direction_pull': {
    ko: 'Pull — Gist의 설정을 이 디바이스에 자동 다운로드',
    en: 'Pull — auto-download Gist settings to this device',
  },
  'auto.primary_warning': {
    ko: '현재 Primary 디바이스: {machine} ({hostname}). 이 디바이스로 변경하면 기존 디바이스의 auto push는 무시됩니다.',
    en: 'Current primary device: {machine} ({hostname}). Changing to this device will ignore the previous auto push.',
  },
  'auto.select_conflict_policy': {
    ko: '로컬 파일이 변경된 경우 처리 방식:',
    en: 'How to handle locally modified files:',
  },
  'auto.policy_overwrite': {
    ko: 'Overwrite — 원격으로 덮어쓰기',
    en: 'Overwrite — replace with remote',
  },
  'auto.policy_skip': {
    ko: 'Skip — 로컬 변경 파일은 건너뛰기',
    en: 'Skip — skip locally modified files',
  },
  'auto.policy_backup': {
    ko: 'Backup — .bak 백업 후 덮어쓰기',
    en: 'Backup — backup to .bak then overwrite',
  },
  'auto.select_interval': {
    ko: '동기화 주기를 입력하세요 (예: 5m, 1h, 30s, 1d):',
    en: 'Enter sync interval (e.g., 5m, 1h, 30s, 1d):',
  },
  'auto.interval_too_short': {
    ko: '최소 주기는 1분(60초)입니다.',
    en: 'Minimum interval is 1 minute (60 seconds).',
  },
  'auto.interval_invalid': {
    ko: '올바른 형식: 숫자 + s/m/h/d (예: 5m, 1h)',
    en: 'Valid format: number + s/m/h/d (e.g., 5m, 1h)',
  },
  'auto.select_categories': {
    ko: '동기화할 카테고리를 선택하세요 (쉼표로 구분, 빈 입력=전체):',
    en: 'Select categories to sync (comma-separated, empty=all):',
  },
  'auto.select_encrypt': {
    ko: '암호화를 활성화하시겠습니까?',
    en: 'Enable encryption?',
  },
  'auto.enabled': {
    ko: '자동 동기화가 활성화되었습니다!',
    en: 'Auto sync enabled!',
  },
  'auto.disabled': {
    ko: '자동 동기화가 비활성화되었습니다.',
    en: 'Auto sync disabled.',
  },
  'auto.not_configured': {
    ko: '자동 동기화가 설정되지 않았습니다. `claudesync auto`를 실행하세요.',
    en: 'Auto sync not configured. Run `claudesync auto`.',
  },
  'auto.status_title': {
    ko: '자동 동기화 상태',
    en: 'Auto Sync Status',
  },
  'auto.confirm_primary_change': {
    ko: 'Primary 디바이스를 이 머신으로 변경하시겠습니까?',
    en: 'Change primary device to this machine?',
  },
  'auto.lock_held': {
    ko: '동기화가 진행 중입니다. 잠시 후 다시 시도하세요.',
    en: 'Sync in progress. Try again later.',
  },

  // ── Config ───────────────────────────────────
  'config.not_set': {
    ko: '(설정 안됨)',
    en: '(not set)',
  },
  'config.invalid_lang': {
    ko: '지원하는 언어: ko, en',
    en: 'Supported languages: ko, en',
  },
  'config.lang_saved': {
    ko: '언어 설정이 저장되었습니다.',
    en: 'Language setting saved.',
  },
  'config.unknown_key': {
    ko: '알 수 없는 설정 키입니다. 사용 가능: lang',
    en: 'Unknown config key. Available: lang',
  },

  // ── Help ─────────────────────────────────────
  'help.usage': {
    ko: '사용법: claudesync <command> [options]',
    en: 'Usage: claudesync <command> [options]',
  },
  'help.commands': {
    ko: '명령어:',
    en: 'Commands:',
  },
  'help.options': {
    ko: '옵션:',
    en: 'Options:',
  },
  'help.init': {
    ko: '인증 설정 (OAuth Device Flow)',
    en: 'Set up authentication (OAuth Device Flow)',
  },
  'help.init_token': {
    ko: 'PAT 수동 입력',
    en: 'Manual PAT input',
  },
  'help.link': {
    ko: '기존 Gist 연결',
    en: 'Link existing Gist',
  },
  'help.push': {
    ko: '로컬 → Gist 업로드',
    en: 'Upload local → Gist',
  },
  'help.pull': {
    ko: 'Gist → 로컬 복원',
    en: 'Restore Gist → local',
  },
  'help.diff': {
    ko: '로컬 vs 원격 비교',
    en: 'Compare local vs remote',
  },
  'help.status': {
    ko: '인증/동기화 상태 확인',
    en: 'Check auth/sync status',
  },
  'help.list': {
    ko: '동기화 대상 로컬 파일 목록',
    en: 'List local files to sync',
  },
  'help.history': {
    ko: 'Gist revision 히스토리',
    en: 'Gist revision history',
  },
  'help.rollback': {
    ko: '특정 버전으로 복원',
    en: 'Restore to specific version',
  },
  'help.auto': {
    ko: '자동 동기화 설정 (인터랙티브)',
    en: 'Set up auto sync (interactive)',
  },
  'help.auto_disable': {
    ko: '자동 동기화 해제',
    en: 'Disable auto sync',
  },
  'help.auto_status': {
    ko: '자동 동기화 상태 확인',
    en: 'Check auto sync status',
  },
  'help.config': {
    ko: '설정 관리',
    en: 'Manage configuration',
  },
  'help.opt_message': {
    ko: 'push 시 메시지 기록 (history에서 표시)',
    en: 'Record message on push (shown in history)',
  },
  'help.opt_only': {
    ko: '카테고리 필터 (settings|instructions|hooks|skills|plugins|teams|ui)',
    en: 'Category filter (settings|instructions|hooks|skills|plugins|teams|ui)',
  },
  'help.opt_force': {
    ko: '확인 없이 실행',
    en: 'Run without confirmation',
  },
  'help.opt_encrypt': {
    ko: '암호화 활성화',
    en: 'Enable encryption',
  },
  'help.opt_lang': {
    ko: '언어 설정',
    en: 'Set language',
  },
  'help.opt_help': {
    ko: '도움말',
    en: 'Help',
  },
  'help.opt_version': {
    ko: '버전 정보',
    en: 'Version info',
  },

  // ── CLI ──────────────────────────────────────
  'cli.link_usage': {
    ko: 'Usage: claudesync link <gist-id>',
    en: 'Usage: claudesync link <gist-id>',
  },
  'cli.rollback_usage': {
    ko: 'Usage: claudesync rollback <version>',
    en: 'Usage: claudesync rollback <version>',
  },
  'cli.list_empty': {
    ko: '동기화 대상 파일 없음',
    en: 'No files to sync',
  },
  'cli.list_total': {
    ko: '총 {count}개 파일',
    en: '{count} files total',
  },
  'cli.unknown_command': {
    ko: '알 수 없는 명령어: {command}',
    en: 'Unknown command: {command}',
  },

  // ── Terminal ─────────────────────────────────
  'terminal.select_prompt': {
    ko: '선택 (1-{max}):',
    en: 'Choose (1-{max}):',
  },

  // ── Init ─────────────────────────────────────
  'init.no_token_input': {
    ko: '토큰이 입력되지 않았습니다.',
    en: 'No token entered.',
  },
  'init.gist_linked': {
    ko: 'Gist {id}에 연결되었습니다.',
    en: 'Linked to Gist {id}.',
  },
  'init.validating': {
    ko: '토큰 검증 중...',
    en: 'Validating token...',
  },
  'init.token_invalid': {
    ko: '토큰이 유효하지 않습니다. gist 스코프가 있는지 확인하세요.',
    en: 'Token is invalid. Make sure it has the gist scope.',
  },
  'init.searching_gist': {
    ko: '기존 claudesync Gist 검색 중...',
    en: 'Searching for existing claudesync Gist...',
  },
  'init.gist_found': {
    ko: '기존 Gist를 찾았습니다: {id}',
    en: 'Found existing Gist: {id}',
  },
  'init.no_gist': {
    ko: '기존 Gist가 없습니다. `claudesync push`로 새로 생성하세요.',
    en: 'No existing Gist found. Run `claudesync push` to create one.',
  },

  // ── Push (additional) ────────────────────────
  'push.secret_found': {
    ko: '{path}: {count}개 의심 항목 발견',
    en: '{path}: {count} suspicious item(s) found',
  },
  'push.no_changes': {
    ko: '변경사항 없음. 로컬과 원격이 동일합니다.',
    en: 'No changes. Local and remote are identical.',
  },
  'push.gist_not_found_creating': {
    ko: 'Gist를 찾을 수 없습니다. 새로 생성합니다.',
    en: 'Gist not found. Creating a new one.',
  },
  'push.uploading_new': {
    ko: '{count}개 파일을 새 Gist에 업로드합니다:',
    en: 'Uploading {count} file(s) to new Gist:',
  },

  // ── Pull (additional) ────────────────────────
  'pull.no_gist': {
    ko: 'Gist가 연결되지 않았습니다. `claudesync push` 또는 `claudesync link <id>`를 먼저 실행하세요.',
    en: 'No Gist linked. Run `claudesync push` or `claudesync link <id>` first.',
  },
  'pull.changes_heading': {
    ko: '변경사항:',
    en: 'Changes:',
  },
  'pull.icon_added': {
    ko: '+ 추가',
    en: '+ Add',
  },
  'pull.icon_modified': {
    ko: '~ 수정',
    en: '~ Mod',
  },
  'pull.icon_deleted': {
    ko: '- 삭제',
    en: '- Del',
  },
  'pull.diff_truncated': {
    ko: '({count}줄 변경 — claudesync diff로 전체 확인)',
    en: '({count} lines changed — run claudesync diff to see full diff)',
  },
  'pull.skip_deleted': {
    ko: '스킵: {path} (원격에서 삭제됨, 로컬은 유지)',
    en: 'Skipped: {path} (deleted on remote, kept locally)',
  },
  'pull.decrypt_failed': {
    ko: '복호화 실패: {path}',
    en: 'Decryption failed: {path}',
  },
  'pull.applied': {
    ko: '{count}개 파일 적용',
    en: '{count} file(s) applied',
  },

  // ── Diff (additional) ────────────────────────
  'diff.no_gist': {
    ko: 'Gist가 연결되지 않았습니다.',
    en: 'No Gist linked.',
  },
  'diff.fetching': {
    ko: '원격 설정을 가져오는 중...',
    en: 'Fetching remote settings...',
  },
  'diff.total': {
    ko: '총 {count}개 파일에 차이가 있습니다.',
    en: '{count} file(s) have differences.',
  },

  // ── Status (additional) ──────────────────────
  'status.title': {
    ko: 'claudesync 상태',
    en: 'claudesync status',
  },
  'status.auth_label': {
    ko: '인증',
    en: 'Auth',
  },
  'status.gist_label': {
    ko: 'Gist',
    en: 'Gist',
  },
  'status.last_sync': {
    ko: '마지막 동기화:',
    en: 'Last sync:',
  },
  'status.machine': {
    ko: '머신',
    en: 'Machine',
  },
  'status.host': {
    ko: '호스트',
    en: 'Host',
  },
  'status.platform': {
    ko: '플랫폼',
    en: 'Platform',
  },
  'status.time': {
    ko: '시간',
    en: 'Time',
  },
  'status.file_count': {
    ko: '파일 수',
    en: 'Files',
  },
  'status.remote_files': {
    ko: '원격 파일: {count}개',
    en: 'Remote files: {count}',
  },
  'status.gist_fetch_failed': {
    ko: 'Gist 조회 실패 — 네트워크를 확인하세요',
    en: 'Failed to fetch Gist — check your network',
  },
  'status.current_machine': {
    ko: '현재 머신',
    en: 'Current machine',
  },

  // ── History (additional) ─────────────────────
  'history.no_gist': {
    ko: 'Gist가 연결되지 않았습니다.',
    en: 'No Gist linked.',
  },
  'history.loading': {
    ko: '최근 {count}개 리비전의 메시지를 불러오는 중...',
    en: 'Loading messages for {count} recent revision(s)...',
  },
  'history.more': {
    ko: '... 외 {count}개',
    en: '... and {count} more',
  },
  'history.total': {
    ko: '총 {count}개 리비전',
    en: '{count} revision(s) total',
  },
  'history.rollback_hint': {
    ko: '복원: claudesync rollback <version>',
    en: 'Restore: claudesync rollback <version>',
  },

  // ── Rollback ─────────────────────────────────
  'rollback.no_gist': {
    ko: 'Gist가 연결되지 않았습니다.',
    en: 'No Gist linked.',
  },
  'rollback.not_found': {
    ko: "리비전 '{version}'을 찾을 수 없습니다. `claudesync history`로 확인하세요.",
    en: "Revision '{version}' not found. Run `claudesync history` to check.",
  },
  'rollback.restoring': {
    ko: '리비전 {sha} ({date})을 복원합니다.',
    en: 'Restoring revision {sha} ({date}).',
  },
  'rollback.target_heading': {
    ko: '복원 대상:',
    en: 'Restore targets:',
  },
  'rollback.new_file': {
    ko: '(새 파일)',
    en: '(new file)',
  },
  'rollback.decrypt_failed': {
    ko: '복호화 실패: {path}',
    en: 'Decryption failed: {path}',
  },
  'rollback.no_changes': {
    ko: '현재 상태와 동일합니다.',
    en: 'Already at this state.',
  },
  'rollback.files_changed': {
    ko: '{count}개 파일이 변경됩니다.',
    en: '{count} file(s) will be changed.',
  },
  'rollback.confirm': {
    ko: '복원하시겠습니까?',
    en: 'Restore?',
  },
  'rollback.cancelled': {
    ko: '복원이 취소되었습니다.',
    en: 'Restore cancelled.',
  },
  'rollback.success': {
    ko: '리비전 {sha}로 복원 완료!',
    en: 'Restored to revision {sha}!',
  },

  // ── Auto (additional) ────────────────────────
  'auto.no_gist': {
    ko: 'Gist가 연결되지 않았습니다. `claudesync push` 또는 `claudesync link <id>`를 먼저 실행하세요.',
    en: 'No Gist linked. Run `claudesync push` or `claudesync link <id>` first.',
  },
  'auto.setup_cancelled': {
    ko: '설정이 취소되었습니다.',
    en: 'Setup cancelled.',
  },
  'auto.invalid_categories': {
    ko: '유효한 카테고리가 없습니다. 전체 카테고리로 설정합니다.',
    en: 'No valid categories. Using all categories.',
  },
  'auto.scheduler_failed': {
    ko: '스케줄러 등록 실패: {error}',
    en: 'Scheduler registration failed: {error}',
  },
  'auto.primary_register_failed': {
    ko: 'Primary 디바이스 정보를 Gist에 등록하지 못했습니다. 다음 auto push 시 등록됩니다.',
    en: 'Failed to register primary device to Gist. It will be registered on next auto push.',
  },
  'auto.summary_direction': {
    ko: '방향',
    en: 'Direction',
  },
  'auto.summary_interval': {
    ko: '주기',
    en: 'Interval',
  },
  'auto.summary_categories': {
    ko: '카테고리',
    en: 'Categories',
  },
  'auto.summary_encrypt': {
    ko: '암호화',
    en: 'Encrypt',
  },
  'auto.summary_conflict': {
    ko: '충돌 정책',
    en: 'Conflict',
  },
  'auto.yes': {
    ko: '예',
    en: 'Yes',
  },
  'auto.no': {
    ko: '아니오',
    en: 'No',
  },

  // ── Auto Status (additional) ─────────────────
  'auto.status_enabled': {
    ko: '활성',
    en: 'Enabled',
  },
  'auto.status_disabled': {
    ko: '비활성',
    en: 'Disabled',
  },
  'auto.interval_seconds': {
    ko: '{n}초',
    en: '{n}s',
  },
  'auto.interval_minutes': {
    ko: '{n}분',
    en: '{n}m',
  },
  'auto.interval_hours': {
    ko: '{n}시간',
    en: '{n}h',
  },
  'auto.interval_days': {
    ko: '{n}일',
    en: '{n}d',
  },
  'auto.status_label': {
    ko: '상태',
    en: 'Status',
  },
  'auto.created_label': {
    ko: '생성일',
    en: 'Created',
  },
  'auto.primary_device_label': {
    ko: 'Primary 디바이스',
    en: 'Primary Device',
  },
  'auto.this_machine': {
    ko: '(이 머신)',
    en: '(this machine)',
  },
  'auto.since_label': {
    ko: '등록일',
    en: 'Since',
  },
  'auto.recent_logs_label': {
    ko: '최근 로그',
    en: 'Recent Logs',
  },

  // ── Core errors ──────────────────────────────
  'error.cli_not_found': {
    ko: 'claudesync CLI 경로를 찾을 수 없습니다. 글로벌 설치를 권장합니다: npm install -g claudesync',
    en: 'claudesync CLI path not found. Global install recommended: npm install -g claudesync',
  },
  'auth.device_url': {
    ko: '  URL: {url}',
    en: '  URL: {url}',
  },
  'auth.device_code': {
    ko: '  코드: {code}',
    en: '  Code: {code}',
  },
  'auth.oauth_error': {
    ko: 'OAuth 오류: {error}',
    en: 'OAuth error: {error}',
  },
  'auth.device_flow_timeout': {
    ko: 'Device flow 시간 초과',
    en: 'Device flow timed out',
  },
  'error.unsupported_platform': {
    ko: '지원하지 않는 플랫폼: {platform}',
    en: 'Unsupported platform: {platform}',
  },

  // ── Auto Run ─────────────────────────────────
  'auto_run.failed': {
    ko: '자동 {direction} 실패: {message}',
    en: 'Auto {direction} failed: {message}',
  },
  'auto_run.push_synced': {
    ko: '{count}개 파일 동기화됨',
    en: '{count} files synced',
  },
  'auto_run.pull_applied': {
    ko: '{applied}개 파일 적용',
    en: '{applied} files applied',
  },
  'auto_run.pull_applied_skipped': {
    ko: '{applied}개 파일 적용, {skipped}개 건너뜀',
    en: '{applied} files applied, {skipped} skipped',
  },
} as const;

type MessageKey = keyof typeof messages;

let currentLang: Lang = 'en';

export function setLang(lang: Lang): void {
  currentLang = lang;
}

export function getLang(): Lang {
  return currentLang;
}

export function t(key: MessageKey): string {
  return messages[key]?.[currentLang] ?? key;
}

export function detectLang(): Lang {
  const env = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || '';
  if (env.startsWith('ko')) return 'ko';
  return 'en';
}

/** Load lang from ~/.claudesync/config.json */
export function loadLangConfig(): Lang | null {
  const path = userConfigPath();
  if (!existsSync(path)) return null;
  try {
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    if (data.lang === 'ko' || data.lang === 'en') return data.lang;
    return null;
  } catch {
    return null;
  }
}

/** Save lang to ~/.claudesync/config.json */
export function saveLangConfig(lang: Lang): void {
  const path = userConfigPath();
  let data: Record<string, unknown> = {};
  if (existsSync(path)) {
    try {
      data = JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      data = {};
    }
  }
  data.lang = lang;
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}
