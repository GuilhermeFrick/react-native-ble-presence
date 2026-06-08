import { describe, expect, it, vi } from 'vitest';
import { noopBackgroundBleMonitor } from './noopBackgroundBleMonitor';

describe('noopBackgroundBleMonitor', () => {
  it('provides a safe unavailable monitor', async () => {
    const monitor = noopBackgroundBleMonitor();
    const listener = vi.fn();
    const unsubscribe = monitor.subscribe(listener);

    await expect(monitor.isAvailable()).resolves.toBe(false);
    await expect(monitor.getPendingEvents()).resolves.toEqual([]);
    await expect(monitor.start({ filters: [] })).resolves.toBeUndefined();
    await expect(monitor.stop()).resolves.toBeUndefined();

    unsubscribe();
    expect(listener).not.toHaveBeenCalled();
  });
});
