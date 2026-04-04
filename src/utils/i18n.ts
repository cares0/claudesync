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
} as const;

type MessageKey = keyof typeof messages;

let currentLang: Lang = 'ko';

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
