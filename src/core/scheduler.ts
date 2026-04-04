import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { homedir } from 'node:os';

const LAUNCHD_LABEL = 'com.claudesync.auto';
const SYSTEMD_SERVICE = 'claudesync-auto';

// ── Template generators (pure, testable) ────────────────────

export function buildLaunchdPlist(cliPath: string, intervalSeconds: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LAUNCHD_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${cliPath}</string>
    <string>auto-run</string>
  </array>
  <key>StartInterval</key>
  <integer>${intervalSeconds}</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${join(homedir(), '.claudesync', 'launchd-stdout.log')}</string>
  <key>StandardErrorPath</key>
  <string>${join(homedir(), '.claudesync', 'launchd-stderr.log')}</string>
</dict>
</plist>`;
}

export function buildSystemdService(cliPath: string): string {
  return `[Unit]
Description=claudesync auto sync
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=${cliPath} auto-run
Environment=PATH=/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=default.target`;
}

export function buildSystemdTimer(intervalSeconds: number): string {
  return `[Unit]
Description=claudesync auto sync timer

[Timer]
OnBootSec=60s
OnUnitActiveSec=${intervalSeconds}s
Persistent=true

[Install]
WantedBy=timers.target`;
}

export function buildSchtasksXml(cliPath: string, intervalSeconds: number): string {
  const minutes = Math.max(1, Math.round(intervalSeconds / 60));
  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>claudesync-auto automatic sync</Description>
  </RegistrationInfo>
  <Triggers>
    <TimeTrigger>
      <Repetition>
        <Interval>PT${minutes}M</Interval>
        <StopAtDurationEnd>false</StopAtDurationEnd>
      </Repetition>
      <StartBoundary>2026-01-01T00:00:00</StartBoundary>
      <Enabled>true</Enabled>
    </TimeTrigger>
  </Triggers>
  <Actions>
    <Exec>
      <Command>${cliPath}</Command>
      <Arguments>auto-run</Arguments>
    </Exec>
  </Actions>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
  </Settings>
</Task>`;
}

// ── Resolve CLI path ────────────────────────────────────────

function resolveCliPath(): string {
  try {
    return execSync('which claudesync', { encoding: 'utf-8' }).trim();
  } catch {
    // Fallback: assume global npm bin
    const npmBin = execSync('npm bin -g', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return join(npmBin, 'claudesync');
  }
}

// ── Register / Unregister ───────────────────────────────────

export function registerScheduler(intervalSeconds: number): void {
  const cliPath = resolveCliPath();

  if (process.platform === 'darwin') {
    registerLaunchd(cliPath, intervalSeconds);
  } else if (process.platform === 'linux') {
    registerSystemd(cliPath, intervalSeconds);
  } else if (process.platform === 'win32') {
    registerSchtasks(cliPath, intervalSeconds);
  } else {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

export function unregisterScheduler(): void {
  if (process.platform === 'darwin') {
    unregisterLaunchd();
  } else if (process.platform === 'linux') {
    unregisterSystemd();
  } else if (process.platform === 'win32') {
    unregisterSchtasks();
  }
}

// ── macOS launchd ───────────────────────────────────────────

function launchdPlistPath(): string {
  return join(homedir(), 'Library', 'LaunchAgents', `${LAUNCHD_LABEL}.plist`);
}

function registerLaunchd(cliPath: string, intervalSeconds: number): void {
  const plistDir = join(homedir(), 'Library', 'LaunchAgents');
  if (!existsSync(plistDir)) mkdirSync(plistDir, { recursive: true });

  const plistPath = launchdPlistPath();

  // Unload if already loaded
  try {
    execSync(`launchctl unload "${plistPath}"`, { stdio: 'ignore' });
  } catch { /* not loaded */ }

  writeFileSync(plistPath, buildLaunchdPlist(cliPath, intervalSeconds), 'utf-8');
  execSync(`launchctl load "${plistPath}"`, { stdio: 'ignore' });
}

function unregisterLaunchd(): void {
  const plistPath = launchdPlistPath();
  if (existsSync(plistPath)) {
    try {
      execSync(`launchctl unload "${plistPath}"`, { stdio: 'ignore' });
    } catch { /* already unloaded */ }
    unlinkSync(plistPath);
  }
}

// ── Linux systemd ───────────────────────────────────────────

function systemdDir(): string {
  return join(homedir(), '.config', 'systemd', 'user');
}

function registerSystemd(cliPath: string, intervalSeconds: number): void {
  const dir = systemdDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(join(dir, `${SYSTEMD_SERVICE}.service`), buildSystemdService(cliPath), 'utf-8');
  writeFileSync(join(dir, `${SYSTEMD_SERVICE}.timer`), buildSystemdTimer(intervalSeconds), 'utf-8');

  execSync('systemctl --user daemon-reload', { stdio: 'ignore' });
  execSync(`systemctl --user enable --now ${SYSTEMD_SERVICE}.timer`, { stdio: 'ignore' });
}

function unregisterSystemd(): void {
  const dir = systemdDir();
  try {
    execSync(`systemctl --user disable --now ${SYSTEMD_SERVICE}.timer`, { stdio: 'ignore' });
  } catch { /* not enabled */ }

  const servicePath = join(dir, `${SYSTEMD_SERVICE}.service`);
  const timerPath = join(dir, `${SYSTEMD_SERVICE}.timer`);
  if (existsSync(servicePath)) unlinkSync(servicePath);
  if (existsSync(timerPath)) unlinkSync(timerPath);

  try {
    execSync('systemctl --user daemon-reload', { stdio: 'ignore' });
  } catch { /* ignore */ }
}

// ── Windows Task Scheduler ──────────────────────────────────

function registerSchtasks(cliPath: string, intervalSeconds: number): void {
  const xmlPath = join(homedir(), '.claudesync', 'schtask.xml');
  writeFileSync(xmlPath, buildSchtasksXml(cliPath, intervalSeconds), 'utf-16le');
  execSync(`schtasks /Create /TN "claudesync-auto" /XML "${xmlPath}" /F`, { stdio: 'ignore' });
  unlinkSync(xmlPath);
}

function unregisterSchtasks(): void {
  try {
    execSync('schtasks /Delete /TN "claudesync-auto" /F', { stdio: 'ignore' });
  } catch { /* not registered */ }
}
