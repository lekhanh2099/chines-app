import { afterEach, describe, expect, it } from "vitest";

import { headerToolbarStore } from "@/stores/shell/header-toolbar-store";

const OWNER_A = "test-owner-a";
const OWNER_B = "test-owner-b";

afterEach(() => {
 headerToolbarStore.actions.clearOwnedContent(OWNER_A);
 headerToolbarStore.actions.clearOwnedContent(OWNER_B);
 headerToolbarStore.actions.clearContent();
 headerToolbarStore.actions.clearOwnedSettings(OWNER_A);
 headerToolbarStore.actions.clearOwnedSettings(OWNER_B);
});

describe("headerToolbarStore", () => {
 it("keeps an explicitly owned toolbar when legacy cleanup runs", () => {
  headerToolbarStore.actions.setOwnedContent(OWNER_A, "Owned toolbar");

  headerToolbarStore.actions.clearContent();

  expect(headerToolbarStore.state.ownerId).toBe(OWNER_A);
  expect(headerToolbarStore.state.content).toBe("Owned toolbar");
 });

 it("ignores cleanup from a stale owner", () => {
  headerToolbarStore.actions.setOwnedContent(OWNER_A, "Old toolbar");
  headerToolbarStore.actions.setOwnedContent(OWNER_B, "Current toolbar");

  headerToolbarStore.actions.clearOwnedContent(OWNER_A);

  expect(headerToolbarStore.state.ownerId).toBe(OWNER_B);
  expect(headerToolbarStore.state.content).toBe("Current toolbar");
 });

 it("does not publish a new state for the same owner and content", () => {
  headerToolbarStore.actions.setOwnedContent(OWNER_A, "Stable toolbar");
  const stableState = headerToolbarStore.state;

  headerToolbarStore.actions.setOwnedContent(OWNER_A, "Stable toolbar");

  expect(headerToolbarStore.state).toBe(stableState);
 });
 it("keeps the current Reader settings when an older Reader unmounts", () => {
  headerToolbarStore.actions.setOwnedSettings(OWNER_A, "Old display", "Old playback");
  headerToolbarStore.actions.setOwnedSettings(OWNER_B, "Current display", "Current playback");
  headerToolbarStore.actions.clearOwnedSettings(OWNER_A);
  expect(headerToolbarStore.state.readingSettings).toBe("Current display");
  expect(headerToolbarStore.state.listeningSettings).toBe("Current playback");
  headerToolbarStore.actions.clearOwnedSettings(OWNER_B);
  expect(headerToolbarStore.state.readingSettings).toBeNull();
  expect(headerToolbarStore.state.listeningSettings).toBeNull();
  expect(headerToolbarStore.state.settingsOwnerId).toBeNull();
 });
 it("keeps Reader settings independent of breadcrumb registration", () => {
  headerToolbarStore.actions.setOwnedSettings(OWNER_A, "Display", "Playback");
  headerToolbarStore.actions.setOwnedContent(OWNER_B, "Breadcrumb");
  headerToolbarStore.actions.clearOwnedContent(OWNER_B);
  expect(headerToolbarStore.state.readingSettings).toBe("Display");
  expect(headerToolbarStore.state.listeningSettings).toBe("Playback");
 });
});
