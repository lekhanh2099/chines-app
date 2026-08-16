import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.UI_AUDIT_BASE_URL ?? "http://127.0.0.1:3000";
const CDP_URL = process.env.UI_AUDIT_CDP_URL ?? "http://127.0.0.1:9222";
const OUTPUT_DIR = process.env.UI_AUDIT_OUTPUT_DIR ?? "/tmp/ui-audit";
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, "screenshots");

const viewports = {
 phone: { name: "phone", width: 390, height: 844 },
 ipad: { name: "ipad", width: 820, height: 1180 },
 desktop: { name: "desktop", width: 1440, height: 900 },
 wide: { name: "wide", width: 1728, height: 1117 },
};

const shellRoutes = [
 "/",
 "/hanzihome",
 "/reader",
 "/daily-reading",
 "/hsk",
 "/grammar",
 "/humanities",
 "/personal-learning",
 "/notebook",
 "/dictation",
 "/translation",
 "/tts",
 "/dictionary",
 "/memory-tips",
 "/inspector",
 "/conversation",
 "/learning-loop",
 "/data-quality",
 "/vocab",
 "/radicals",
 "/notes",
 "/html-artifacts",
 "/api-docs",
 "/settings?section=app",
];

const deepRoutes = [
 "/reader/course",
 "/reader/hsk",
 "/humanities/history",
 "/humanities/poetry",
 "/settings?section=reading",
 "/settings?section=ai",
];

const darkRoutes = new Set([
 "/reader",
 "/daily-reading",
 "/dictation",
 "/personal-learning",
 "/notes",
 "/settings?section=app",
]);

const reducedMotionRoutes = new Set(["/reader", "/daily-reading", "/conversation"]);
const hardFailures = [];
const warnings = [];
const runtimeEvents = [];
let currentContext = "bootstrap";

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function routePath(route) {
 return new URL(route, BASE_URL).pathname;
}

function safeName(value) {
 return value
  .replace(/^\//, "")
  .replaceAll("/", "__")
  .replaceAll("?", "--")
  .replaceAll("=", "-") || "home";
}

function pushFailure(context, message) {
 hardFailures.push(`${context}: ${message}`);
}

function pushWarning(context, message) {
 warnings.push(`${context}: ${message}`);
}

class CdpClient {
 constructor(url) {
  this.url = url;
  this.nextId = 1;
  this.pending = new Map();
  this.listeners = new Map();
 }

 async connect() {
  this.ws = new WebSocket(this.url);
  await new Promise((resolve, reject) => {
   const timer = setTimeout(() => reject(new Error("CDP websocket timeout")), 10_000);
   this.ws.onopen = () => {
    clearTimeout(timer);
    resolve();
   };
   this.ws.onerror = (error) => {
    clearTimeout(timer);
    reject(error);
   };
  });

  this.ws.onmessage = (event) => {
   const message = JSON.parse(String(event.data));
   if (message.id) {
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);
    if (message.error) pending.reject(new Error(message.error.message));
    else pending.resolve(message.result);
    return;
   }

   for (const listener of this.listeners.get(message.method) ?? []) {
    listener(message.params);
   }
  };
 }

 send(method, params = {}) {
  const id = this.nextId++;
  return new Promise((resolve, reject) => {
   this.pending.set(id, { resolve, reject });
   this.ws.send(JSON.stringify({ id, method, params }));
  });
 }

 on(method, listener) {
  const listeners = this.listeners.get(method) ?? [];
  listeners.push(listener);
  this.listeners.set(method, listeners);
  return () => {
   this.listeners.set(
    method,
    (this.listeners.get(method) ?? []).filter((candidate) => candidate !== listener),
   );
  };
 }

 once(method, timeout = 20_000) {
  return new Promise((resolve, reject) => {
   const timer = setTimeout(() => {
    unsubscribe();
    reject(new Error(`Timed out waiting for ${method}`));
   }, timeout);
   const unsubscribe = this.on(method, (params) => {
    clearTimeout(timer);
    unsubscribe();
    resolve(params);
   });
  });
 }

 close() {
  this.ws.close();
 }
}

async function openClient() {
 const response = await fetch(`${CDP_URL}/json/new?${encodeURIComponent(`${BASE_URL}/reader`)}`, {
  method: "PUT",
 });
 if (!response.ok) throw new Error(`Unable to open Chrome page: ${response.status}`);
 const page = await response.json();
 const client = new CdpClient(page.webSocketDebuggerUrl);
 await client.connect();
 await Promise.all([
  client.send("Page.enable"),
  client.send("Runtime.enable"),
  client.send("Log.enable"),
  client.send("Network.enable"),
 ]);

 client.on("Runtime.exceptionThrown", (params) => {
  const details = params.exceptionDetails ?? {};
  runtimeEvents.push({
   context: currentContext,
   type: "exception",
   text: details.exception?.description ?? details.text ?? "Uncaught runtime exception",
  });
 });
 client.on("Runtime.consoleAPICalled", (params) => {
  if (params.type !== "error") return;
  runtimeEvents.push({
   context: currentContext,
   type: "console-error",
   text: (params.args ?? [])
    .map((arg) => arg.value ?? arg.description ?? "")
    .filter(Boolean)
    .join(" ")
    .slice(0, 500),
  });
 });
 client.on("Log.entryAdded", (params) => {
  if (params.entry?.level !== "error") return;
  runtimeEvents.push({
   context: currentContext,
   type: "log-error",
   text: params.entry.text?.slice(0, 500) ?? "Browser log error",
  });
 });
 client.on("Network.loadingFailed", (params) => {
  if (params.canceled) return;
  runtimeEvents.push({
   context: currentContext,
   type: "network-failure",
   text: `${params.errorText ?? "network failure"} ${params.blockedReason ?? ""}`.trim(),
  });
 });

 await client.send("Page.addScriptToEvaluateOnNewDocument", {
  source: `(() => {
   window.__uiAuditMetrics = { cls: 0, longTaskTotal: 0, longTaskMax: 0, longTaskCount: 0 };
   try {
    new PerformanceObserver((list) => {
     for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) window.__uiAuditMetrics.cls += entry.value;
     }
    }).observe({ type: "layout-shift", buffered: true });
   } catch {}
   try {
    new PerformanceObserver((list) => {
     for (const entry of list.getEntries()) {
      window.__uiAuditMetrics.longTaskCount += 1;
      window.__uiAuditMetrics.longTaskTotal += entry.duration;
      window.__uiAuditMetrics.longTaskMax = Math.max(window.__uiAuditMetrics.longTaskMax, entry.duration);
     }
    }).observe({ type: "longtask", buffered: true });
   } catch {}
  })();`,
 });
 return client;
}

async function directRouteStatus(route) {
 try {
  const response = await fetch(new URL(route, BASE_URL), { redirect: "manual" });
  return {
   status: response.status,
   location: response.headers.get("location"),
  };
 } catch (error) {
  return { status: 0, location: null, error: error instanceof Error ? error.message : String(error) };
 }
}

async function navigate(client, route, viewport, { theme = "light", reducedMotion = false } = {}) {
 await client.send("Emulation.setDeviceMetricsOverride", {
  width: viewport.width,
  height: viewport.height,
  deviceScaleFactor: 1,
  mobile: viewport.width <= viewports.ipad.width,
  screenWidth: viewport.width,
  screenHeight: viewport.height,
 });
 await client.send("Emulation.setEmulatedMedia", {
  features: [
   { name: "prefers-color-scheme", value: theme },
   { name: "prefers-reduced-motion", value: reducedMotion ? "reduce" : "no-preference" },
  ],
 });

 let loaded = client.once("Page.loadEventFired");
 await client.send("Page.navigate", { url: new URL(route, BASE_URL).href });
 await loaded;
 await sleep(200);
 await client.send("Runtime.evaluate", {
  expression: `(() => {
   try {
    localStorage.setItem("chines-app-theme", ${JSON.stringify(theme)});
    localStorage.setItem("chines-app-theme-palette", "editorial");
   } catch {}
  })()`,
 });
 loaded = client.once("Page.loadEventFired");
 await client.send("Page.reload", { ignoreCache: true });
 await loaded;
 await sleep(700);
}

const auditExpression = `(() => {
 const visible = (element) => {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
 };
 const textOf = (element) => (element.getAttribute("aria-label") || element.getAttribute("title") || element.textContent || element.getAttribute("placeholder") || element.getAttribute("value") || "").trim().replace(/\\s+/g, " ").slice(0, 160);
 const interactiveSelector = 'a[href],button,input:not([type="hidden"]),textarea,select,[role="button"],[role="tab"],[role="menuitem"],[role="checkbox"],[role="radio"],[role="switch"],[role="option"],[contenteditable="true"]';
 const interactive = [...document.querySelectorAll(interactiveSelector)].filter(visible);
 const duplicateIds = [...document.querySelectorAll("[id]")].map((node) => node.id).filter((id, index, all) => id && all.indexOf(id) !== index);
 const unlabeled = interactive.filter((element) => {
  if (element.matches('input[type="checkbox"],input[type="radio"]') && element.labels?.length) return false;
  return textOf(element).length === 0;
 }).map((element) => ({ tag: element.tagName, role: element.getAttribute("role"), html: element.outerHTML.slice(0, 220) })).slice(0, 30);
 const nestedInteractive = interactive.flatMap((element) => {
  const parent = element.parentElement?.closest(interactiveSelector);
  return parent && visible(parent) ? [{ child: textOf(element), parent: textOf(parent), html: element.outerHTML.slice(0, 180) }] : [];
 }).slice(0, 30);
 const smallTargets = interactive.flatMap((element) => {
  const rect = element.getBoundingClientRect();
  const role = element.getAttribute("role");
  const dataSize = element.getAttribute("data-size") || element.closest("[data-size]")?.getAttribute("data-size") || "";
  const inlineLink = element.tagName === "A" && Boolean(element.closest("p,li"));
  const labeledCheck = element.matches('input[type="checkbox"],input[type="radio"]') && element.labels?.length;
  if (inlineLink || labeledCheck) return [];
  let threshold = 44;
  if (role === "menuitem") threshold = 40;
  else if (role === "tab" || element.closest('[role="toolbar"],[role="tablist"]')) threshold = 36;
  else if (["toolbar", "icon-toolbar", "icon-xs", "compact", "inline"].includes(dataSize)) threshold = 0;
  if (threshold === 0 || (rect.width >= threshold && rect.height >= threshold)) return [];
  return [{ text: textOf(element), tag: element.tagName, role, dataSize, width: Math.round(rect.width), height: Math.round(rect.height), threshold }];
 }).slice(0, 50);
 const compactStandalone = interactive.flatMap((element) => {
  const dataSize = element.getAttribute("data-size") || element.closest("[data-size]")?.getAttribute("data-size") || "";
  if (!["compact", "icon-xs"].includes(dataSize) || element.closest('[role="toolbar"],[role="tablist"],nav')) return [];
  const rect = element.getBoundingClientRect();
  return [{ text: textOf(element), dataSize, width: Math.round(rect.width), height: Math.round(rect.height) }];
 }).slice(0, 30);
 const overflowElements = [...document.querySelectorAll("body *")].filter(visible).flatMap((element) => {
  const rect = element.getBoundingClientRect();
  if (rect.right <= innerWidth + 1 && rect.left >= -1) return [];
  const style = getComputedStyle(element);
  if (["fixed", "absolute"].includes(style.position) && rect.width <= innerWidth) return [];
  return [{ tag: element.tagName, text: textOf(element), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), className: String(element.className || "").slice(0, 180) }];
 }).slice(0, 30);
 const parseColor = (value) => {
  const match = value.match(/rgba?\\(\\s*([\\d.]+)[, ]+([\\d.]+)[, ]+([\\d.]+)(?:\\s*[,/]\\s*([\\d.]+))?\\s*\\)/i);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : Number(match[4])] : null;
 };
 const composite = (front, back) => {
  const alpha = front[3] + back[3] * (1 - front[3]);
  if (alpha === 0) return [0, 0, 0, 0];
  return [
   (front[0] * front[3] + back[0] * back[3] * (1 - front[3])) / alpha,
   (front[1] * front[3] + back[1] * back[3] * (1 - front[3])) / alpha,
   (front[2] * front[3] + back[2] * back[3] * (1 - front[3])) / alpha,
   alpha,
  ];
 };
 const backgroundFor = (element) => {
  const layers = [];
  let current = element;
  while (current) {
   const parsed = parseColor(getComputedStyle(current).backgroundColor);
   if (parsed && parsed[3] > 0) layers.push(parsed);
   current = current.parentElement;
  }
  const rootFallback = getComputedStyle(document.documentElement).colorScheme.includes("dark") ? [0, 0, 0, 1] : [255, 255, 255, 1];
  return layers.reverse().reduce((back, front) => composite(front, back), rootFallback);
 };
 const luminance = ([r, g, b]) => {
  const convert = (channel) => {
   const value = channel / 255;
   return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * convert(r) + 0.7152 * convert(g) + 0.0722 * convert(b);
 };
 const contrastRatio = (a, b) => {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
 };
 const contrastCandidates = [...document.querySelectorAll("body *")].filter((element) => {
  if (!visible(element) || element.matches(":disabled,[aria-disabled=true]")) return false;
  const ownText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
  return ownText;
 }).flatMap((element) => {
  const style = getComputedStyle(element);
  const foregroundRaw = parseColor(style.color);
  if (!foregroundRaw || foregroundRaw[3] === 0 || Number(style.opacity) < 0.75) return [];
  const background = backgroundFor(element);
  const foreground = composite(foregroundRaw, background);
  const ratio = contrastRatio(foreground, background);
  const fontSize = Number.parseFloat(style.fontSize) || 16;
  const numericWeight = Number.parseInt(style.fontWeight, 10);
  const bold = Number.isFinite(numericWeight) ? numericWeight >= 700 : /bold/i.test(style.fontWeight);
  const large = fontSize >= 24 || (bold && fontSize >= 18.66);
  const required = large ? 3 : 4.5;
  if (ratio + 0.05 >= required) return [];
  return [{ text: textOf(element), ratio: Number(ratio.toFixed(2)), required, fontSize, fontWeight: style.fontWeight, color: style.color, background: getComputedStyle(element).backgroundColor }];
 }).slice(0, 50);
 const runningAnimations = document.getAnimations().filter((animation) => animation.playState === "running").map((animation) => {
  const timing = animation.effect?.getComputedTiming?.() ?? {};
  return { duration: timing.duration, iterations: timing.iterations, currentTime: animation.currentTime };
 }).slice(0, 30);
 const html = document.documentElement;
 const body = document.body;
 return {
  href: location.href,
  pathname: location.pathname,
  title: document.title,
  theme: document.documentElement.getAttribute("data-theme") || document.documentElement.className,
  viewport: { width: innerWidth, height: innerHeight },
  overflowX: Math.max(html.scrollWidth, body?.scrollWidth || 0) - innerWidth,
  mainCount: document.querySelectorAll("main").length,
  h1: [...document.querySelectorAll("h1")].filter(visible).map((node) => node.textContent?.trim()).filter(Boolean).slice(0, 5),
  duplicateIds: [...new Set(duplicateIds)],
  unlabeled,
  nestedInteractive,
  smallTargets,
  compactStandalone,
  overflowElements,
  contrastCandidates,
  runningAnimations,
  activeRouteLinks: [...document.querySelectorAll('[aria-current="page"]')].filter(visible).map((element) => ({ text: textOf(element), href: element.getAttribute("href") })),
  shellRouteHrefs: [...new Set([...document.querySelectorAll('aside a[href], nav a[href]')].map((element) => element.getAttribute("href")).filter(Boolean))],
  metrics: window.__uiAuditMetrics ?? null,
 };
})()`;

async function auditFocusTraversal(client, count = 6) {
 const results = [];
 await client.send("Runtime.evaluate", { expression: "document.activeElement?.blur?.()" });
 for (let index = 0; index < count; index += 1) {
  await client.send("Input.dispatchKeyEvent", {
   type: "keyDown",
   key: "Tab",
   code: "Tab",
   windowsVirtualKeyCode: 9,
  });
  await client.send("Input.dispatchKeyEvent", {
   type: "keyUp",
   key: "Tab",
   code: "Tab",
   windowsVirtualKeyCode: 9,
  });
  await sleep(30);
  const result = await client.send("Runtime.evaluate", {
   expression: `(() => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement)) return null;
    const style = getComputedStyle(element);
    const label = (element.getAttribute("aria-label") || element.getAttribute("title") || element.textContent || element.getAttribute("placeholder") || "").trim().replace(/\\s+/g, " ").slice(0, 120);
    return {
     tag: element.tagName,
     label,
     role: element.getAttribute("role"),
     outlineStyle: style.outlineStyle,
     outlineWidth: style.outlineWidth,
     boxShadow: style.boxShadow,
     borderColor: style.borderColor,
    };
   })()`,
   returnByValue: true,
  });
  if (result.result.value) results.push(result.result.value);
 }
 return results;
}

async function auditMobileNavigationSheet(client) {
 const result = await client.send("Runtime.evaluate", {
  expression: `(() => {
   const trigger = [...document.querySelectorAll("button")].find((node) => node.getAttribute("aria-label") === "Mở toàn bộ điều hướng");
   if (!(trigger instanceof HTMLButtonElement)) return { triggerFound: false };
   trigger.click();
   return { triggerFound: true };
  })()`,
  returnByValue: true,
 });
 if (!result.result.value?.triggerFound) return { triggerFound: false };
 await sleep(200);
 const inspected = await client.send("Runtime.evaluate", {
  expression: `(() => {
   const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
   };
   const dialogs = [...document.querySelectorAll('[role="dialog"]')].filter(visible);
   const settings = [...document.querySelectorAll('a[href^="/settings"]')].filter(visible);
   const nav = [...document.querySelectorAll('nav[aria-label="Toàn bộ khu vực"]')].filter(visible);
   return { dialogCount: dialogs.length, settingsReachable: settings.length > 0, fullNavCount: nav.length };
  })()`,
  returnByValue: true,
 });
 await client.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
 await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
 await sleep(120);
 return inspected.result.value;
}

async function auditGlobalSearchShortcut(client) {
 await client.send("Runtime.evaluate", {
  expression: `window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))`,
 });
 await sleep(180);
 const opened = await client.send("Runtime.evaluate", {
  expression: `(() => {
   const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
   };
   const dialogs = [...document.querySelectorAll('[role="dialog"]')].filter(visible);
   const inputs = [...document.querySelectorAll('input,[role="combobox"]')].filter(visible);
   return { dialogCount: dialogs.length, inputCount: inputs.length, activeTag: document.activeElement?.tagName ?? null };
  })()`,
  returnByValue: true,
 });
 await client.send("Runtime.evaluate", {
  expression: `window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`,
 });
 await sleep(120);
 const closed = await client.send("Runtime.evaluate", {
  expression: `(() => {
   const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
   };
   return [...document.querySelectorAll('[role="dialog"]')].filter(visible).length;
  })()`,
  returnByValue: true,
 });
 return { opened: opened.result.value, visibleDialogsAfterEscape: closed.result.value };
}

async function captureScreenshot(client, name) {
 const shot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
 fs.writeFileSync(path.join(SCREENSHOT_DIR, `${name}.png`), Buffer.from(shot.data, "base64"));
}

async function auditState(client, route, viewport, options) {
 const theme = options.theme ?? "light";
 const reducedMotion = options.reducedMotion ?? false;
 const stateName = `${safeName(route)}__${viewport.name}__${theme}${reducedMotion ? "__reduced" : ""}`;
 const context = `${route} ${viewport.width}x${viewport.height} ${theme}${reducedMotion ? " reduced-motion" : ""}`;
 currentContext = context;
 const directStatus = await directRouteStatus(route);
 await navigate(client, route, viewport, options);
 const evaluated = await client.send("Runtime.evaluate", { expression: auditExpression, returnByValue: true });
 const result = evaluated.result.value;
 const focusTraversal = await auditFocusTraversal(client);
 await captureScreenshot(client, stateName);

 if (directStatus.status >= 400 || directStatus.status === 0) {
  pushFailure(context, `route response ${directStatus.status}${directStatus.error ? ` (${directStatus.error})` : ""}`);
 }
 if (directStatus.status >= 300 && directStatus.status < 400) {
  pushWarning(context, `route response redirects to ${directStatus.location ?? "unknown"}`);
 }
 if (result.pathname !== routePath(route)) {
  pushFailure(context, `rendered ${result.pathname} instead of ${routePath(route)}`);
 }
 if (result.overflowX > 1) pushFailure(context, `horizontal overflow ${Math.round(result.overflowX)}px`);
 if (result.mainCount !== 1) pushFailure(context, `expected exactly one <main>, found ${result.mainCount}`);
 if (result.duplicateIds.length) pushFailure(context, `duplicate ids: ${result.duplicateIds.join(", ")}`);
 if (result.unlabeled.length) pushFailure(context, `${result.unlabeled.length} visible interactive controls have no accessible name`);
 if (result.nestedInteractive.length) pushFailure(context, `${result.nestedInteractive.length} nested interactive controls`);
 if (result.smallTargets.length) pushFailure(context, `${result.smallTargets.length} controls below their local density threshold`);
 if (result.overflowElements.length) pushWarning(context, `${result.overflowElements.length} visible elements cross viewport bounds`);
 if (result.compactStandalone.length) pushWarning(context, `${result.compactStandalone.length} compact controls appear outside toolbar/tab/navigation context`);
 if (result.contrastCandidates.length) pushWarning(context, `${result.contrastCandidates.length} computed contrast candidates require review`);
 if (result.metrics?.cls > 0.1) pushWarning(context, `observed CLS ${Number(result.metrics.cls).toFixed(3)} after initial load`);
 if (result.metrics?.longTaskMax > 200) pushWarning(context, `observed max long task ${Math.round(result.metrics.longTaskMax)}ms after initial load`);
 if (reducedMotion && result.runningAnimations.length) pushWarning(context, `${result.runningAnimations.length} animations still running with reduced motion`);
 if (focusTraversal.length === 0) pushWarning(context, "Tab traversal did not reach a focusable element");

 return { route, viewport, theme, reducedMotion, directStatus, ...result, focusTraversal };
}

async function main() {
 const client = await openClient();
 const report = [];
 try {
  for (const route of shellRoutes) {
   for (const viewport of [viewports.phone, viewports.ipad, viewports.desktop]) {
    report.push(await auditState(client, route, viewport, { theme: "light" }));
   }
   if (darkRoutes.has(route)) {
    for (const viewport of [viewports.phone, viewports.desktop]) {
     report.push(await auditState(client, route, viewport, { theme: "dark" }));
    }
   }
   if (reducedMotionRoutes.has(route)) {
    report.push(await auditState(client, route, viewports.phone, { theme: "light", reducedMotion: true }));
   }
  }

  for (const route of deepRoutes) {
   for (const viewport of [viewports.phone, viewports.desktop]) {
    report.push(await auditState(client, route, viewport, { theme: "light" }));
   }
  }

  currentContext = "interaction /reader phone";
  await navigate(client, "/reader", viewports.phone, { theme: "light" });
  const mobileNavigationSheet = await auditMobileNavigationSheet(client);
  await captureScreenshot(client, "reader__phone__mobile-navigation-sheet");
  if (!mobileNavigationSheet.triggerFound) pushFailure(currentContext, "mobile full-navigation trigger not found");
  else {
   if (mobileNavigationSheet.dialogCount !== 1) pushFailure(currentContext, `expected one navigation dialog, found ${mobileNavigationSheet.dialogCount}`);
   if (!mobileNavigationSheet.settingsReachable) pushFailure(currentContext, "Settings is not reachable from mobile full navigation");
   if (mobileNavigationSheet.fullNavCount !== 1) pushFailure(currentContext, "full-navigation landmark not visible inside Sheet");
  }

  currentContext = "interaction /reader desktop";
  await navigate(client, "/reader", viewports.desktop, { theme: "light" });
  const globalSearchShortcut = await auditGlobalSearchShortcut(client);
  if ((globalSearchShortcut.opened?.dialogCount ?? 0) < 1) pushFailure(currentContext, "Ctrl+K did not expose a visible dialog");
  if ((globalSearchShortcut.opened?.inputCount ?? 0) < 1) pushFailure(currentContext, "Ctrl+K dialog did not expose a visible input/combobox");
  if ((globalSearchShortcut.visibleDialogsAfterEscape ?? 0) !== 0) pushFailure(currentContext, "Escape did not close the global search dialog");

  const discoveredShellRoutes = [...new Set(report.flatMap((entry) => entry.shellRouteHrefs ?? []))]
   .filter((href) => href.startsWith("/"))
   .map((href) => href.split("#")[0]);
  const coveredRoutePaths = new Set([...shellRoutes, ...deepRoutes].map((route) => routePath(route)));
  const uncoveredShellRoutes = discoveredShellRoutes.filter((href) => !coveredRoutePaths.has(routePath(href)));
  if (uncoveredShellRoutes.length) {
   pushWarning("route registry", `shell exposes routes not covered by this audit: ${uncoveredShellRoutes.join(", ")}`);
  }

  for (const event of runtimeEvents) {
   if (event.type === "exception") pushFailure(event.context, event.text);
   else pushWarning(event.context, `${event.type}: ${event.text}`);
  }

  const summary = {
   generatedAt: new Date().toISOString(),
   baseUrl: BASE_URL,
   statesRendered: report.length,
   routesConfigured: shellRoutes.length + deepRoutes.length,
   shellRoutes,
   deepRoutes,
   discoveredShellRoutes,
   uncoveredShellRoutes,
   interactionChecks: { mobileNavigationSheet, globalSearchShortcut },
   hardFailures,
   warnings,
   runtimeEvents,
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, "report.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  console.log(`Rendered ${report.length} route/viewport/theme states.`);
  console.log(`Hard failures: ${hardFailures.length}`);
  hardFailures.forEach((failure) => console.error(`ERROR ${failure}`));
  console.log(`Warnings: ${warnings.length}`);
  warnings.slice(0, 120).forEach((warning) => console.log(`WARN ${warning}`));
  console.log(`Evidence: ${OUTPUT_DIR}`);

  if (hardFailures.length) process.exitCode = 1;
 } finally {
  client.close();
 }
}

main().catch((error) => {
 console.error(error);
 process.exit(1);
});
