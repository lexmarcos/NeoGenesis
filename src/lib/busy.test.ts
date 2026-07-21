import { describe, expect, it } from "vitest";
import { createBusyLock } from "./busy";

describe("createBusyLock", () => {
  it("starts free", () => {
    const lock = createBusyLock();
    expect(lock.busy).toBe(false);
    expect(lock.acquire()).toBe(true);
    expect(lock.busy).toBe(true);
  });

  it("refuses a second acquire while held", () => {
    const lock = createBusyLock();
    expect(lock.acquire()).toBe(true);
    expect(lock.acquire()).toBe(false);
    expect(lock.acquire()).toBe(false);
  });

  it("frees on release", () => {
    const lock = createBusyLock();
    lock.acquire();
    lock.release();
    expect(lock.busy).toBe(false);
    expect(lock.acquire()).toBe(true);
  });

  it("tolerates release when free", () => {
    const lock = createBusyLock();
    lock.release();
    expect(lock.busy).toBe(false);
    expect(lock.acquire()).toBe(true);
  });

  it("lets exactly one of two concurrent callers through", () => {
    // Both callers run before any re-render, so both would see the same stale
    // React state; only the synchronous lock separates them.
    const lock = createBusyLock();
    const results = [lock.acquire(), lock.acquire()];
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("serializes a second caller only after the first releases", () => {
    const lock = createBusyLock();
    expect(lock.acquire()).toBe(true);
    expect(lock.acquire()).toBe(false);
    lock.release();
    expect(lock.acquire()).toBe(true);
  });
});
