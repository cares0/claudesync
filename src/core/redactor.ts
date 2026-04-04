/** Secret detection patterns */
const SECRET_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'AWS Secret Key', regex: /(?:aws_secret_access_key|secret_key)\s*[=:]\s*\S+/i },
  { name: 'GitHub Token', regex: /gh[pousr]_[A-Za-z0-9_]{36,}/ },
  { name: 'GitHub Classic Token', regex: /ghp_[A-Za-z0-9]{36,}/ },
  { name: 'Anthropic API Key', regex: /sk-ant-[A-Za-z0-9-_]{20,}/ },
  { name: 'OpenAI API Key', regex: /sk-[A-Za-z0-9]{32,}/ },
  { name: 'Slack Token', regex: /xox[bprs]-[A-Za-z0-9-]+/ },
  { name: 'Slack Webhook', regex: /hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/ },
  { name: 'Private Key', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Generic Secret', regex: /(?:secret|password|passwd|token|api_key|apikey|auth)\s*[=:]\s*['"][^'"]{8,}['"]/i },
  { name: 'Bearer Token', regex: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/i },
  { name: 'Basic Auth', regex: /Basic\s+[A-Za-z0-9+/]+=*/i },
  { name: 'Connection String', regex: /(?:mongodb|postgres|mysql|redis):\/\/[^\s]+/i },
  { name: 'npm Token', regex: /\/\/registry\.npmjs\.org\/:_authToken=\S+/ },
  { name: 'Hex Secret (32+)', regex: /(?:secret|key|token|password)\s*[=:]\s*[0-9a-f]{32,}/i },
];

const REDACT_COMMENT = '# claudesync:redact';

export interface SecretMatch {
  line: number;
  pattern: string;
  match: string;
  /** The full line content */
  lineContent: string;
}

/** Scan content for potential secrets */
export function detectSecrets(content: string): SecretMatch[] {
  const matches: SecretMatch[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Explicit redact marker
    if (line.includes(REDACT_COMMENT)) {
      matches.push({
        line: i + 1,
        pattern: 'Explicit redact marker',
        match: line.trim(),
        lineContent: line,
      });
      continue;
    }

    for (const { name, regex } of SECRET_PATTERNS) {
      const m = line.match(regex);
      if (m) {
        matches.push({
          line: i + 1,
          pattern: name,
          match: m[0].slice(0, 20) + (m[0].length > 20 ? '...' : ''),
          lineContent: line,
        });
        break; // one match per line is enough
      }
    }

    // Shannon entropy check for long tokens
    if (!matches.some((m) => m.line === i + 1)) {
      const tokens = line.match(/[A-Za-z0-9+/=_\-]{32,}/g);
      if (tokens) {
        for (const token of tokens) {
          if (shannonEntropy(token) > 4.5) {
            matches.push({
              line: i + 1,
              pattern: 'High entropy string',
              match: token.slice(0, 20) + '...',
              lineContent: line,
            });
            break;
          }
        }
      }
    }
  }

  return matches;
}

/** Redact detected secrets in content */
export function redactContent(content: string, secrets: SecretMatch[]): string {
  const lines = content.split('\n');
  const secretLines = new Set(secrets.map((s) => s.line));

  return lines
    .map((line, i) => {
      if (secretLines.has(i + 1)) {
        return '# [REDACTED by claudesync]';
      }
      return line;
    })
    .join('\n');
}

/** Calculate Shannon entropy of a string */
function shannonEntropy(str: string): number {
  const freq = new Map<string, number>();
  for (const ch of str) {
    freq.set(ch, (freq.get(ch) || 0) + 1);
  }
  let entropy = 0;
  const len = str.length;
  for (const count of freq.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}
