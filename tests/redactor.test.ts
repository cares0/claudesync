import { describe, it, expect } from 'vitest';
import { detectSecrets, redactContent } from '../src/core/redactor.js';

describe('detectSecrets', () => {
  it('detects AWS access key', () => {
    const content = 'aws_key = AKIAIOSFODNN7EXAMPLE';
    const secrets = detectSecrets(content);
    expect(secrets.length).toBeGreaterThan(0);
    expect(secrets[0].pattern).toBe('AWS Access Key');
  });

  it('detects GitHub token', () => {
    const content = 'token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh1234';
    const secrets = detectSecrets(content);
    expect(secrets.length).toBeGreaterThan(0);
  });

  it('detects Anthropic API key', () => {
    const content = 'ANTHROPIC_KEY=sk-ant-api03-abcdefghijklmnopqrst';
    const secrets = detectSecrets(content);
    expect(secrets.length).toBeGreaterThan(0);
  });

  it('detects private key header', () => {
    const content = '-----BEGIN RSA PRIVATE KEY-----\nMIIE...';
    const secrets = detectSecrets(content);
    expect(secrets.length).toBeGreaterThan(0);
    expect(secrets[0].pattern).toBe('Private Key');
  });

  it('detects explicit redact marker', () => {
    const content = 'MY_SECRET=hunter2 # claudesync:redact';
    const secrets = detectSecrets(content);
    expect(secrets.length).toBeGreaterThan(0);
    expect(secrets[0].pattern).toBe('Explicit redact marker');
  });

  it('returns empty for clean content', () => {
    const content = '{\n  "theme": "dark",\n  "fontSize": 14\n}';
    const secrets = detectSecrets(content);
    expect(secrets.length).toBe(0);
  });
});

describe('redactContent', () => {
  it('replaces secret lines with redaction marker', () => {
    const content = 'line1\nMY_SECRET=sk-ant-api03-abcdefghijklmnopqrst\nline3';
    const secrets = detectSecrets(content);
    const redacted = redactContent(content, secrets);
    expect(redacted).toContain('[REDACTED by claudesync]');
    expect(redacted).not.toContain('sk-ant');
    expect(redacted).toContain('line1');
    expect(redacted).toContain('line3');
  });
});
