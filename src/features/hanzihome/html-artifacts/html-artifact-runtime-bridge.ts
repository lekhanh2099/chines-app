import type { JsonFieldValue } from "@/types/json";
import type { JsonObject } from "@/types/json";
import type { HtmlArtifactRuntimeState } from "./html-artifact.schema";

type RuntimeStateMessage = {
 source: "hanzihome-html-artifact-runtime";
 type: "runtime-state";
 artifactId: string;
 state: HtmlArtifactRuntimeState;
};

const previewContentSecurityPolicy = [
 "default-src 'none'",
 "script-src 'unsafe-inline'",
 "style-src 'unsafe-inline'",
 "img-src data: blob:",
 "font-src data:",
 "media-src data: blob:",
 "connect-src 'none'",
 "object-src 'none'",
 "base-uri 'none'",
 "form-action 'none'",
 "frame-src 'none'",
 "worker-src 'none'",
].join("; ");

function serializeForInlineScript(value: JsonFieldValue): string {
 return JSON.stringify(value)
  .replace(/</g, "\\u003c")
  .replace(/>/g, "\\u003e")
  .replace(/&/g, "\\u0026")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");
}

function isRuntimeState(value: JsonFieldValue): value is HtmlArtifactRuntimeState {
 if (!value || typeof value !== "object" || Array.isArray(value)) return false;
 return Object.values(value).every((item) => typeof item === "string");
}

export function isRuntimeStateMessage(value: JsonFieldValue): value is RuntimeStateMessage {
 if (!value || typeof value !== "object") return false;

 const message = value as JsonObject;
 return (
  message.source === "hanzihome-html-artifact-runtime" &&
  message.type === "runtime-state" &&
  typeof message.artifactId === "string" &&
  isRuntimeState(message.state)
 );
}

function buildRuntimeStateBridgeScript(
 artifactId: string,
 runtimeState: HtmlArtifactRuntimeState,
): string {
 return `<script data-hanzihome-runtime-bridge>
(() => {
  const artifactId = ${serializeForInlineScript(artifactId)};
  const initialState = ${serializeForInlineScript(runtimeState)};
  let nativeLocalStorage = null;
  try {
    nativeLocalStorage = window.localStorage;
  } catch {}
  const state = new Map(Object.entries(initialState).map(([key, value]) => [String(key), String(value)]));
  const cleanupNativeStorage = (key) => {
    try {
      nativeLocalStorage?.removeItem(String(key));
    } catch {}
  };
  const snapshot = () => Object.fromEntries(state.entries());
  const postState = () => {
    window.parent?.postMessage({
      source: "hanzihome-html-artifact-runtime",
      type: "runtime-state",
      artifactId,
      state: snapshot(),
    }, "*");
  };
  let timer = 0;
  const schedulePost = (immediate = false) => {
    if (timer) window.clearTimeout(timer);
    if (immediate) {
      postState();
      return;
    }
    timer = window.setTimeout(postState, 150);
  };

  for (const key of state.keys()) cleanupNativeStorage(key);

  const target = {};
  Object.defineProperties(target, {
    length: { get: () => state.size },
    key: { value: (index) => Array.from(state.keys())[Number(index)] ?? null },
    getItem: { value: (key) => {
      const storageKey = String(key);
      cleanupNativeStorage(storageKey);
      return state.has(storageKey) ? state.get(storageKey) : null;
    }},
    setItem: { value: (key, value) => {
      const storageKey = String(key);
      state.set(storageKey, String(value));
      cleanupNativeStorage(storageKey);
      schedulePost();
    }},
    removeItem: { value: (key) => {
      const storageKey = String(key);
      state.delete(storageKey);
      cleanupNativeStorage(storageKey);
      schedulePost();
    }},
    clear: { value: () => {
      for (const key of state.keys()) cleanupNativeStorage(key);
      state.clear();
      schedulePost();
    }},
  });

  const storage = new Proxy(target, {
    get(targetValue, property) {
      if (property in targetValue) return targetValue[property];
      if (typeof property === "string") {
        cleanupNativeStorage(property);
        return state.has(property) ? state.get(property) : undefined;
      }
      return undefined;
    },
    set(_targetValue, property, value) {
      if (typeof property === "string") {
        state.set(property, String(value));
        cleanupNativeStorage(property);
        schedulePost();
      }
      return true;
    },
    deleteProperty(_targetValue, property) {
      if (typeof property === "string") {
        state.delete(property);
        cleanupNativeStorage(property);
        schedulePost();
      }
      return true;
    },
    ownKeys: () => Array.from(state.keys()),
    getOwnPropertyDescriptor(_targetValue, property) {
      if (typeof property !== "string" || !state.has(property)) return undefined;
      return { configurable: true, enumerable: true, value: state.get(property) };
    },
  });

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  window.addEventListener("pagehide", () => schedulePost(true));
})();
</script>`;
}

export function injectRuntimeStateBridge(
 source: string,
 artifactId: string,
 runtimeState: HtmlArtifactRuntimeState,
): string {
 const securityMeta = `<meta http-equiv="Content-Security-Policy" content="${previewContentSecurityPolicy}" />`;
 const injectedHeadContent = `${securityMeta}${buildRuntimeStateBridgeScript(artifactId, runtimeState)}`;
 const headMatch = source.match(/<head\b[^>]*>/i);

 if (headMatch?.[0] && typeof headMatch.index === "number") {
  const insertionIndex = headMatch.index + headMatch[0].length;
  return `${source.slice(0, insertionIndex)}${injectedHeadContent}${source.slice(insertionIndex)}`;
 }

 const htmlMatch = source.match(/<html\b[^>]*>/i);
 if (htmlMatch?.[0] && typeof htmlMatch.index === "number") {
  const insertionIndex = htmlMatch.index + htmlMatch[0].length;
  return `${source.slice(0, insertionIndex)}<head>${injectedHeadContent}</head>${source.slice(insertionIndex)}`;
 }

 return `<!doctype html><html><head>${injectedHeadContent}</head><body>${source}</body></html>`;
}
