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
