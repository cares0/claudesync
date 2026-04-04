import { describe, it, expect } from 'vitest';
import { buildLaunchdPlist, buildSystemdService, buildSystemdTimer, buildSchtasksXml } from '../src/core/scheduler.js';

describe('scheduler file generation', () => {
  const cliPath = '/usr/local/bin/claudesync';
  const intervalSeconds = 300;

  it('buildLaunchdPlist generates valid plist', () => {
    const plist = buildLaunchdPlist(cliPath, intervalSeconds);
    expect(plist).toContain('com.claudesync.auto');
    expect(plist).toContain('<integer>300</integer>');
    expect(plist).toContain(cliPath);
    expect(plist).toContain('auto-run');
  });

  it('buildSystemdService generates valid unit', () => {
    const unit = buildSystemdService(cliPath);
    expect(unit).toContain('[Service]');
    expect(unit).toContain(cliPath);
    expect(unit).toContain('auto-run');
  });

  it('buildSystemdTimer generates valid timer', () => {
    const timer = buildSystemdTimer(intervalSeconds);
    expect(timer).toContain('[Timer]');
    expect(timer).toContain('OnUnitActiveSec=300s');
  });

  it('buildSchtasksXml generates valid XML', () => {
    const xml = buildSchtasksXml(cliPath, intervalSeconds);
    expect(xml).toContain('claudesync-auto');
    expect(xml).toContain(cliPath);
    expect(xml).toContain('auto-run');
  });
});
