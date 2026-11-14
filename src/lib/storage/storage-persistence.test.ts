import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
 checkStoragePersistence,
 getStorageQuotaEstimate,
 requestStoragePersistence,
} from "./storage-persistence";

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

 describe("checkStoragePersistence", () => {
  it("checks status without calling persist", async () => {
   const persistedMock = vi.fn().mockResolvedValue(true);

   vi.stubGlobal("window", {});
   vi.stubGlobal("navigator", {
    storage: {
     persisted: persistedMock,
    },
   });

   const result = await checkStoragePersistence();
   expect(result).toEqual({ supported: true, persisted: true });
   expect(persistedMock).toHaveBeenCalledOnce();
  });
 });

 describe("getStorageQuotaEstimate", () => {
  it("returns formatted megabytes and percentages correctly", async () => {
   const estimateMock = vi.fn().mockResolvedValue({
    usage: 52428800, // 50 MB
    quota: 104857600, // 100 MB
   });

   vi.stubGlobal("window", {});
   vi.stubGlobal("navigator", {
    storage: {
     estimate: estimateMock,
    },
   });

   const estimate = await getStorageQuotaEstimate();
   expect(estimate.supported).toBe(true);
   expect(estimate.usedBytes).toBe(52428800);
   expect(estimate.quotaBytes).toBe(104857600);
   expect(estimate.usedMB).toBe(50);
   expect(estimate.quotaMB).toBe(100);
   expect(estimate.percentUsed).toBe(50);
  });

  it("returns zeroed fallback on unsupporting platforms", async () => {
   vi.stubGlobal("window", {});
   vi.stubGlobal("navigator", {});

   const estimate = await getStorageQuotaEstimate();
   expect(estimate).toEqual({
    supported: false,
    usedBytes: 0,
    quotaBytes: 0,
    percentUsed: 0,
    usedMB: 0,
    quotaMB: 0,
   });
  });
 });
});
