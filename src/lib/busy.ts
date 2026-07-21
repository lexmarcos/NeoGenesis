/**
 * One-slot lock for device writes.
 *
 * The backend already serializes on DEVICE_IO, so a second write cannot reach
 * the device mid-flash. What this lock prevents sits upstream of that: an
 * unexpected queued write that runs once the first one finishes, leaving
 * whichever transaction happened to go last as the profile on the keyboard.
 *
 * React state alone cannot prevent it: two programmatic calls issued before a
 * re-render both read the old `applying` value, so the guard has to flip
 * synchronously.
 */
export interface BusyLock {
  readonly busy: boolean;
  /** Take the lock. Returns false when it is already held. */
  acquire(): boolean;
  release(): void;
}

export function createBusyLock(): BusyLock {
  let busy = false;
  return {
    get busy() {
      return busy;
    },
    acquire() {
      if (busy) return false;
      busy = true;
      return true;
    },
    release() {
      busy = false;
    }
  };
}
