import { describe, expect, it } from "vitest";

import { ListeningShortcutAction, resolveListeningShortcut } from "./useListeningHotkeys";

type ShortcutEvent = {
 altKey: boolean;
 code: string;
 ctrlKey: boolean;
 key: string;
 metaKey: boolean;
 shiftKey: boolean;
};

type ShortcutCase = [event: ShortcutEvent, action: ListeningShortcutAction];

function event(code: string, key: string, overrides: Partial<ShortcutEvent> = {}): ShortcutEvent {
 return {
  altKey: false,
  code,
  ctrlKey: false,
  key,
  metaKey: false,
  shiftKey: false,
  ...overrides,
 };
}

const shortcutCases: ShortcutCase[] = [
 [event("Digit1", "1"), ListeningShortcutAction.Previous],
 [event("Digit2", "2"), ListeningShortcutAction.PlayToggle],
 [event("Digit3", "3"), ListeningShortcutAction.Repeat],
 [event("Digit4", "4"), ListeningShortcutAction.Next],
 [event("Digit5", "5"), ListeningShortcutAction.ToggleLoop],
 [event("Digit6", "6"), ListeningShortcutAction.Confirm],
 [event("Space", " "), ListeningShortcutAction.PlayToggle],
 [event("ArrowLeft", "ArrowLeft"), ListeningShortcutAction.Previous],
 [event("ArrowRight", "ArrowRight"), ListeningShortcutAction.Next],
 [event("KeyR", "r"), ListeningShortcutAction.Repeat],
 [event("KeyL", "L"), ListeningShortcutAction.ToggleLoop],
 [event("Escape", "Escape"), ListeningShortcutAction.Stop],
 [event("Enter", "Enter", { ctrlKey: true }), ListeningShortcutAction.Confirm],
 [event("Enter", "Enter", { metaKey: true }), ListeningShortcutAction.Confirm],
 [event("ArrowLeft", "ArrowLeft", { ctrlKey: true }), ListeningShortcutAction.Previous],
 [event("ArrowLeft", "ArrowLeft", { metaKey: true }), ListeningShortcutAction.Previous],
 [event("ArrowRight", "ArrowRight", { ctrlKey: true }), ListeningShortcutAction.Next],
 [event("ArrowRight", "ArrowRight", { metaKey: true }), ListeningShortcutAction.Next],
 [event("BracketLeft", "[", { ctrlKey: true }), ListeningShortcutAction.Previous],
 [event("BracketRight", "]", { ctrlKey: true }), ListeningShortcutAction.Next],
 [event("KeyR", "r", { ctrlKey: true }), ListeningShortcutAction.Repeat],
 [event("KeyR", "r", { metaKey: true }), ListeningShortcutAction.Repeat],
 [event("Space", " ", { ctrlKey: true }), ListeningShortcutAction.PlayToggle],
 [event("Space", " ", { metaKey: true }), ListeningShortcutAction.PlayToggle],
];

describe("resolveListeningShortcut", () => {
 it.each(shortcutCases)("maps %o to %s", (shortcutEvent, action) => {
  expect(resolveListeningShortcut(shortcutEvent, false)).toBe(action);
 });

 it("keeps normal typing untouched in editable controls, including numbers and space", () => {
  expect(resolveListeningShortcut(event("Space", " "), true)).toBeNull();
  expect(resolveListeningShortcut(event("KeyR", "r"), true)).toBeNull();
  expect(resolveListeningShortcut(event("Digit1", "1"), true)).toBeNull();
  expect(resolveListeningShortcut(event("Digit2", "2"), true)).toBeNull();
  expect(resolveListeningShortcut(event("Digit3", "3"), true)).toBeNull();
  expect(resolveListeningShortcut(event("Digit4", "4"), true)).toBeNull();
  expect(resolveListeningShortcut(event("Digit5", "5"), true)).toBeNull();
  expect(resolveListeningShortcut(event("Digit6", "6"), true)).toBeNull();
 });

 it("still accepts modifier confirm, repeat, play/pause and navigation while editing", () => {
  expect(resolveListeningShortcut(event("Enter", "Enter", { ctrlKey: true }), true)).toBe(
   ListeningShortcutAction.Confirm,
  );
  expect(resolveListeningShortcut(event("ArrowLeft", "ArrowLeft", { ctrlKey: true }), true)).toBe(
   ListeningShortcutAction.Previous,
  );
  expect(resolveListeningShortcut(event("ArrowRight", "ArrowRight", { metaKey: true }), true)).toBe(
   ListeningShortcutAction.Next,
  );
  expect(resolveListeningShortcut(event("BracketRight", "]", { ctrlKey: true }), true)).toBe(
   ListeningShortcutAction.Next,
  );
  expect(resolveListeningShortcut(event("KeyR", "r", { ctrlKey: true }), true)).toBe(
   ListeningShortcutAction.Repeat,
  );
  expect(resolveListeningShortcut(event("Space", " ", { ctrlKey: true }), true)).toBe(
   ListeningShortcutAction.PlayToggle,
  );
 });

 it("ignores unrelated keys", () => {
  expect(resolveListeningShortcut(event("KeyA", "a"), false)).toBeNull();
 });
});
