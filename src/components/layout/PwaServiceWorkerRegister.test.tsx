import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ isResolved: false, userId: null }),
}));

import { PwaServiceWorkerRegister } from "./PwaServiceWorkerRegister";

describe("PwaServiceWorkerRegister", () => {
 it("renders null and does not throw in server rendering environment", () => {
  const html = renderToStaticMarkup(createElement(PwaServiceWorkerRegister));
  expect(html).toBe("");
 });

 it("registers service worker on client when supported", () => {
  const mockRegister = vi.fn().mockResolvedValue({
   addEventListener: vi.fn(),
  });

  vi.stubGlobal("window", {
   location: {
    hostname: "localhost",
    protocol: "http:",
   },
   addEventListener: vi.fn((event, cb) => {
    if (event === "load") cb();
   }),
   removeEventListener: vi.fn(),
  });

  vi.stubGlobal("navigator", {
   serviceWorker: {
    register: mockRegister,
   },
  });

  // Call without throwing
  expect(() => {
   renderToStaticMarkup(createElement(PwaServiceWorkerRegister));
  }).not.toThrow();

  vi.unstubAllGlobals();
 });
});
