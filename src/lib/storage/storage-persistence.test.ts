import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestStoragePersistence } from "./storage-persistence";

describe("storage-persistence", () => {
 beforeEach(() => {
  vi.restoreAllMocks();
 });

 afterEach(() => {
  vi.unstubAllGlobals();
 });

 describe("requestStoragePersistence", () => {
  it("returns supported: false when navigator.storage is missing", async () => {
   vi.stubGlobal("window", {});
   vi.stubGlobal("navigator", {});

   const result = await requestStoragePersistence();
   expect(result).toEqual({ supported: false, persisted: false });
  });

  it("returns supported: true, persisted: true immediately if already persisted", async () => {
   const persistedMock = vi.fn().mockResolvedValue(true);
   const persistMock = vi.fn().mockResolvedValue(true);

   vi.stubGlobal("window", {});
   vi.stubGlobal("navigator", {
    storage: {
     persisted: persistedMock,
     persist: persistMock,
    },
   });

   const result = await requestStoragePersistence();
   expect(result).toEqual({ supported: true, persisted: true });
   expect(persistedMock).toHaveBeenCalledOnce();
   expect(persistMock).not.toHaveBeenCalled();
  });

  it("calls persist() if not already persisted and returns result", async () => {
   const persistedMock = vi.fn().mockResolvedValue(false);
   const persistMock = vi.fn().mockResolvedValue(true);

   vi.stubGlobal("window", {});
   vi.stubGlobal("navigator", {
    storage: {
     persisted: persistedMock,
     persist: persistMock,
    },
   });

   const result = await requestStoragePersistence();
   expect(result).toEqual({ supported: true, persisted: true });
   expect(persistMock).toHaveBeenCalledOnce();
  });

  it("handles rejection gracefully without throwing", async () => {
   const persistedMock = vi.fn().mockRejectedValue(new Error("SecurityError"));

   vi.stubGlobal("window", {});
   vi.stubGlobal("navigator", {
    storage: {
     persisted: persistedMock,
     persist: vi.fn(),
    },
   });

   const result = await requestStoragePersistence();
   expect(result).toEqual({ supported: true, persisted: false });
  });
 });
});
