import { afterEach, describe, expect, it, vi } from "vitest";

import { navigationPendingStore } from "@/stores/navigation-pending-store";

afterEach(() => {
 navigationPendingStore.actions.finishNavigation();
 vi.useRealTimers();
});

describe("navigationPendingStore", () => {
 it("starts and finishes pending navigation correctly", () => {
  expect(navigationPendingStore.state.isPending).toBe(false);
  expect(navigationPendingStore.state.pendingHref).toBeNull();

  navigationPendingStore.actions.startNavigation("/hsk/nhip-cau-han-ngu");
  expect(navigationPendingStore.state.isPending).toBe(true);
  expect(navigationPendingStore.state.pendingHref).toBe("/hsk/nhip-cau-han-ngu");

  navigationPendingStore.actions.finishNavigation();
  expect(navigationPendingStore.state.isPending).toBe(false);
  expect(navigationPendingStore.state.pendingHref).toBeNull();
 });

 it("does not publish a new state when finishNavigation is called on idle state", () => {
  const idleState = navigationPendingStore.state;
  navigationPendingStore.actions.finishNavigation();
  expect(navigationPendingStore.state).toBe(idleState);
 });

 it("automatically resets after timeout if navigation never completes", () => {
  vi.useFakeTimers();

  navigationPendingStore.actions.startNavigation("/hsk/doc-hieu");
  expect(navigationPendingStore.state.isPending).toBe(true);

  vi.advanceTimersByTime(8000);
  expect(navigationPendingStore.state.isPending).toBe(false);
  expect(navigationPendingStore.state.pendingHref).toBeNull();
 });
});
