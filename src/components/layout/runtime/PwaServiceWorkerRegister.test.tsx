import { createElement, type EffectCallback } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({ effects: new Array<EffectCallback>() }));
vi.mock("react", async (importOriginal) => {
 const original = await importOriginal<typeof import("react")>();
 return {
  ...original,
  useEffect: (effect: EffectCallback) => harness.effects.push(effect),
 };
});

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ isResolved: false, userId: null }),
}));

import { PwaServiceWorkerRegister } from "./PwaServiceWorkerRegister";

describe("PwaServiceWorkerRegister", () => {
 beforeEach(() => {
  harness.effects.length = 0;
 });
 afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
 });
 it("renders null and does not throw in server rendering environment", () => {
  const html = renderToStaticMarkup(createElement(PwaServiceWorkerRegister));
  expect(html).toBe("");
 });

 it("refreshes public shells on reload and warms study routes only when the controller changes", async () => {
  vi.stubEnv("NODE_ENV", "production");
  const postMessage = vi.fn();
  const controllerEvents = new EventTarget();
  const mockRegister = vi.fn().mockResolvedValue({
   addEventListener: vi.fn(),
  });

  vi.stubGlobal("window", {
   location: {
    hostname: "localhost",
    protocol: "http:",
    pathname: "/vi/reader",
   },
   addEventListener: vi.fn((event, cb) => {
    if (event === "load") cb();
   }),
   removeEventListener: vi.fn(),
  });

  vi.stubGlobal("document", { readyState: "complete" });

  vi.stubGlobal("navigator", {
   serviceWorker: {
    register: mockRegister,
    controller: { postMessage },
    addEventListener: controllerEvents.addEventListener.bind(controllerEvents),
    removeEventListener: controllerEvents.removeEventListener.bind(controllerEvents),
   },
  });

  renderToStaticMarkup(createElement(PwaServiceWorkerRegister));
  for (const effect of harness.effects) effect();
  await vi.waitFor(() => expect(mockRegister).toHaveBeenCalledWith("/sw.js", { scope: "/" }));
  expect(postMessage).toHaveBeenCalledOnce();
  expect(postMessage).toHaveBeenNthCalledWith(1, {
   type: "WARMUP_OFFLINE_CACHE",
   routes: ["/vi/offline", "/en/offline", "/zh-CN/offline"],
  });
  controllerEvents.dispatchEvent(new Event("controllerchange"));
  expect(postMessage).toHaveBeenCalledTimes(2);
  expect(postMessage).toHaveBeenNthCalledWith(2, {
   type: "WARMUP_OFFLINE_CACHE",
   routes: [
    "/vi/reader",
    "/vi/offline",
    "/en/offline",
    "/zh-CN/offline",
    "/vi/hanzihome",
    "/vi/hsk/han-thuong-mai",
    "/vi/hsk/nhip-cau-han-ngu",
    "/vi/hsk/doc-hieu",
    "/vi/hsk/khau-ngu-tc1",
   ],
  });
 });

 it("unregisters the app worker in development without touching other registrations", async () => {
  vi.stubEnv("NODE_ENV", "development");
  const unregister = vi.fn().mockResolvedValue(true);
  const unregisterOther = vi.fn().mockResolvedValue(true);
  const register = vi.fn();
  vi.stubGlobal("window", {});
  vi.stubGlobal("navigator", {
   serviceWorker: {
    register,
    getRegistrations: async () => [
     { active: { scriptURL: "http://localhost:3001/sw.js" }, unregister },
     {
      active: { scriptURL: "http://localhost:3001/other-worker.js" },
      unregister: unregisterOther,
     },
    ],
   },
  });
  renderToStaticMarkup(createElement(PwaServiceWorkerRegister));
  for (const effect of harness.effects) effect();
  await vi.waitFor(() => expect(unregister).toHaveBeenCalledOnce());
  expect(register).not.toHaveBeenCalled();
  expect(unregisterOther).not.toHaveBeenCalled();
 });
});
