import { describe, it, expect, beforeEach } from 'vitest';
import { setLang, t, detectLang, loadLangConfig } from '../src/utils/i18n.js';

describe('i18n', () => {
  beforeEach(() => {
    setLang('en');
  });

  describe('t()', () => {
    it('returns English message when lang is en', () => {
      setLang('en');
      expect(t('auth.success')).toBe('Authentication successful!');
    });

    it('returns Korean message when lang is ko', () => {
      setLang('ko');
      expect(t('auth.success')).toBe('인증 성공!');
    });
  });

  describe('detectLang()', () => {
    it('returns ko when LANG starts with ko', () => {
      const original = process.env.LANG;
      process.env.LANG = 'ko_KR.UTF-8';
      expect(detectLang()).toBe('ko');
      process.env.LANG = original ?? '';
    });

    it('returns en by default', () => {
      const origLang = process.env.LANG;
      const origLanguage = process.env.LANGUAGE;
      const origLcAll = process.env.LC_ALL;
      delete process.env.LANG;
      delete process.env.LANGUAGE;
      delete process.env.LC_ALL;
      expect(detectLang()).toBe('en');
      process.env.LANG = origLang ?? '';
      process.env.LANGUAGE = origLanguage ?? '';
      process.env.LC_ALL = origLcAll ?? '';
    });
  });

  describe('loadLangConfig()', () => {
    it('returns null when no config file exists', () => {
      expect(loadLangConfig()).toBeNull();
    });
  });
});
