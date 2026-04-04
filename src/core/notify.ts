import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { pendingNotificationsPath } from '../utils/paths.js';

interface PendingNotification {
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

/** Send OS-native notification (best-effort, never throws) */
export function sendOsNotification(title: string, message: string): void {
  try {
    if (process.platform === 'darwin') {
      execSync(
        `osascript -e 'display notification "${message}" with title "${title}"'`,
        { stdio: 'ignore' },
      );
    } else if (process.platform === 'linux') {
      execSync(`notify-send "${title}" "${message}"`, { stdio: 'ignore' });
    } else if (process.platform === 'win32') {
      const ps = `
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
        $textNodes = $template.GetElementsByTagName('text')
        $textNodes.Item(0).AppendChild($template.CreateTextNode('${title}')) | Out-Null
        $textNodes.Item(1).AppendChild($template.CreateTextNode('${message}')) | Out-Null
        $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('claudesync').Show($toast)
      `.trim();
      execSync(`powershell -Command "${ps.replace(/"/g, '\\"')}"`, { stdio: 'ignore' });
    }
  } catch {
    // Notification is best-effort — never fail the sync
  }
}

/** Add a notification to be shown on next CLI run */
export function addPendingNotification(level: PendingNotification['level'], message: string): void {
  const notifications = getPendingNotifications();
  notifications.push({ level, message, timestamp: new Date().toISOString() });
  writeFileSync(pendingNotificationsPath(), JSON.stringify(notifications, null, 2), 'utf-8');
}

/** Read all pending notifications */
export function getPendingNotifications(): PendingNotification[] {
  const path = pendingNotificationsPath();
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return [];
  }
}

/** Clear all pending notifications */
export function clearPendingNotifications(): void {
  const path = pendingNotificationsPath();
  if (existsSync(path)) unlinkSync(path);
}
