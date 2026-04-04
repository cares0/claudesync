import { describe, it, expect, afterEach } from 'vitest';
import { addPendingNotification, getPendingNotifications, clearPendingNotifications } from '../src/core/notify.js';
import { pendingNotificationsPath } from '../src/utils/paths.js';
import { unlinkSync, existsSync } from 'node:fs';

describe('pending notifications', () => {
  afterEach(() => {
    const path = pendingNotificationsPath();
    if (existsSync(path)) unlinkSync(path);
  });

  it('addPendingNotification stores notification', () => {
    addPendingNotification('warning', 'Primary device changed to macbook-pro');
    const notes = getPendingNotifications();
    expect(notes).toHaveLength(1);
    expect(notes[0].level).toBe('warning');
    expect(notes[0].message).toBe('Primary device changed to macbook-pro');
  });

  it('clearPendingNotifications removes all', () => {
    addPendingNotification('error', 'Sync failed');
    addPendingNotification('warning', 'Test');
    clearPendingNotifications();
    expect(getPendingNotifications()).toEqual([]);
  });

  it('getPendingNotifications returns empty when no file', () => {
    expect(getPendingNotifications()).toEqual([]);
  });
});
