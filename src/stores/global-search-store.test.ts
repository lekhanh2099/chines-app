import { afterEach, describe, expect, it } from "vitest";

import { globalSearchStore } from "@/stores/global-search-store";

afterEach(() => {
 globalSearchStore.actions.closeSearch();
 globalSearchStore.actions.clearQuery();
});

describe("globalSearchStore", () => {
 it("keeps query and open state independently controllable", () => {
  globalSearchStore.actions.setQuery("把字句");
  globalSearchStore.actions.openSearch();

  expect(globalSearchStore.state.query).toBe("把字句");
  expect(globalSearchStore.state.open).toBe(true);

  globalSearchStore.actions.closeSearch();

  expect(globalSearchStore.state.query).toBe("把字句");
  expect(globalSearchStore.state.open).toBe(false);
 });

 it("does not publish a new state when the same value is written", () => {
  globalSearchStore.actions.setQuery("语法");
  const queryState = globalSearchStore.state;
  globalSearchStore.actions.setQuery("语法");
  expect(globalSearchStore.state).toBe(queryState);

  globalSearchStore.actions.openSearch();
  const openState = globalSearchStore.state;
  globalSearchStore.actions.openSearch();
  expect(globalSearchStore.state).toBe(openState);
 });
});
