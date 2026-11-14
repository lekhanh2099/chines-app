import { createStore } from "@tanstack/react-store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { selectNoteDividerPosition, selectNoteSplitView, splitViewStore } from "./split-view-store";

beforeEach(() => splitViewStore.setState(() => ({ activeNotes: {}, dividerPositions: {} })));

describe("Notes split-view subscriptions", () => {
 it("keeps note A quiet while note B changes", () => {
  const active = createStore(() => selectNoteSplitView("A")(splitViewStore.get()));
  const divider = createStore(() => selectNoteDividerPosition("A")(splitViewStore.get()));
  const activeChanged = vi.fn<() => void>();
  const dividerChanged = vi.fn<() => void>();
  const subscriptions = [active.subscribe(activeChanged), divider.subscribe(dividerChanged)];
  try {
   splitViewStore.actions.setSplitView("B", true);
   splitViewStore.actions.setDividerPosition("B", 60);
   expect(activeChanged).not.toHaveBeenCalled();
   expect(dividerChanged).not.toHaveBeenCalled();
   splitViewStore.actions.setSplitView("A", true);
   expect(activeChanged).toHaveBeenCalledOnce();
   expect(dividerChanged).not.toHaveBeenCalled();
   splitViewStore.actions.setDividerPosition("A", 65);
   expect(dividerChanged).toHaveBeenCalledOnce();
  } finally {
   for (const subscription of subscriptions) subscription.unsubscribe();
  }
 });
 it("preserves the same store snapshot for semantic no-op writes", () => {
  const initial = splitViewStore.get();
  splitViewStore.actions.setSplitView("A", false);
  splitViewStore.actions.setDividerPosition("A", 50);
  expect(splitViewStore.get()).toBe(initial);
  splitViewStore.actions.setDividerPosition("A", 100);
  const clamped = splitViewStore.get();
  splitViewStore.actions.setDividerPosition("A", 80);
  expect(splitViewStore.get()).toBe(clamped);
 });
});
