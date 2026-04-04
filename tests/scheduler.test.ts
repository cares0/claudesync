import { describe, it, expect } from 'vitest';
import { buildLaunchdPlist, buildSystemdService, buildSystemdTimer, buildSchtasksXml } from '../src/core/scheduler.js';

describe('scheduler file generation', () => {
  const cliArgs = ['/usr/local/bin/claudesync'];
  const cliArgsWithNode = ['/usr/bin/node', '/path/to/dist/cli.js'];
  const intervalSeconds = 300;

  it('buildLaunchdPlist generates valid plist with single binary', () => {
    const plist = buildLaunchdPlist(cliArgs, intervalSeconds);
    expect(plist).toContain('com.claudesync.auto');
    expect(plist).toContain('<integer>300</integer>');
    expect(plist).toContain('<string>/usr/local/bin/claudesync</string>');
    expect(plist).toContain('<string>auto-run</string>');
  });

  it('buildLaunchdPlist generates separate args for node + script', () => {
    const plist = buildLaunchdPlist(cliArgsWithNode, intervalSeconds);
    expect(plist).toContain('<string>/usr/bin/node</string>');
    expect(plist).toContain('<string>/path/to/dist/cli.js</string>');
    expect(plist).toContain('<string>auto-run</string>');
  });

  it('buildSystemdService generates valid unit', () => {
    const unit = buildSystemdService(cliArgsWithNode);
    expect(unit).toContain('[Service]');
    expect(unit).toContain('ExecStart=/usr/bin/node /path/to/dist/cli.js auto-run');
  });

  it('buildSystemdTimer generates valid timer', () => {
    const timer = buildSystemdTimer(intervalSeconds);
    expect(timer).toContain('[Timer]');
    expect(timer).toContain('OnUnitActiveSec=300s');
  });

  it('buildSchtasksXml generates valid XML', () => {
    const xml = buildSchtasksXml(cliArgsWithNode, intervalSeconds);
    expect(xml).toContain('claudesync-auto');
    expect(xml).toContain('<Command>/usr/bin/node</Command>');
    expect(xml).toContain('<Arguments>/path/to/dist/cli.js auto-run</Arguments>');
  });
});
