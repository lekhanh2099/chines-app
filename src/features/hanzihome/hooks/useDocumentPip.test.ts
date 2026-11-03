import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
 isDocumentPipSupported,
 useDocumentPip,
 type UseDocumentPipReturn,
} from "./useDocumentPip";

describe("useDocumentPip", () => {
 it("returns false for isDocumentPipSupported in SSR / Node environment", () => {
  expect(isDocumentPipSupported()).toBe(false);
 });

 it("provides stable hook interface during SSR rendering", () => {
  const hookRef: { current: UseDocumentPipReturn | null } = { current: null };
  function TestConsumer() {
   hookRef.current = useDocumentPip();
   return null;
  }

  renderToStaticMarkup(createElement(TestConsumer));

  expect(hookRef.current?.isSupported).toBe(false);
  expect(hookRef.current?.isOpen).toBe(false);
  expect(hookRef.current?.pipWindow).toBeNull();
  expect(typeof hookRef.current?.openPip).toBe("function");
  expect(typeof hookRef.current?.closePip).toBe("function");
 });
});
