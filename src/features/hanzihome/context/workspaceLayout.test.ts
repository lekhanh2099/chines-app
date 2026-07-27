import { describe, expect, it } from "vitest";

import {
 defaultPaneLayout,
 moveModuleInLayout,
 normalizePaneLayout,
 setPaneActive,
} from "./workspaceLayout";

describe("workspace pane layout", () => {
 it("keeps the existing pane partition", () => {
  expect(normalizePaneLayout(defaultPaneLayout)).toEqual(defaultPaneLayout);
 });

 it("moves a module between panes for drag and drop or pane selection", () => {
  expect(moveModuleInLayout(defaultPaneLayout, "vocab", "right", "left", 1)).toEqual({
   left: ["overview", "vocab", "lessonText", "notes"],
   right: ["grammar", "review"],
   activeLeft: "vocab",
   activeRight: "grammar",
  });
 });

 it("copies the lesson text viewer between panes so each pane can select its own section", () => {
  expect(moveModuleInLayout(defaultPaneLayout, "lessonText", "left", "right", 1)).toEqual({
   left: ["overview", "lessonText", "notes"],
   right: ["vocab", "lessonText", "grammar", "review"],
   activeLeft: "overview",
   activeRight: "lessonText",
  });
 });

 it("uses the dragged source pane after the lesson text viewer exists in both panes", () => {
  const duplicatedLayout = moveModuleInLayout(defaultPaneLayout, "lessonText", "left", "right", 1);

  expect(moveModuleInLayout(duplicatedLayout, "lessonText", "right", "right", 3)).toEqual({
   left: ["overview", "lessonText", "notes"],
   right: ["vocab", "grammar", "review", "lessonText"],
   activeLeft: "overview",
   activeRight: "lessonText",
  });
 });

 it("changes the active module without changing pane membership", () => {
  expect(setPaneActive(defaultPaneLayout, "left", "lessonText")).toEqual({
   ...defaultPaneLayout,
   activeLeft: "lessonText",
  });
 });
});
