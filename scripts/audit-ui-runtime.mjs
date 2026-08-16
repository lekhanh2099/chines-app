import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.UI_AUDIT_BASE_URL ?? "http://127.0.0.1:3000";
const CDP_URL = process.env.UI_AUDIT_CDP_URL ?? "http://127.0.0.1:9222";
const OUTPUT_DIR = process.env.UI_AUDIT_OUTPUT_DIR ?? "/tmp/ui-audit";
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, "screenshots");
const VIEWPORTS = [
 { name: "phone", width: 390, height: 844 },
 { name: "ipad", width: 820, height: 1180 },
 { name: "desktop", width: 1440, height: 900 },
];
const PUBLIC_ROUTES = [
 "/reader",
 "/reader/course",
 "/reader/hsk",
 "/reader/mock",
 "/reader/practice",
 "/hsk",
 "/daily-reading",
 "/dictation",
 "/humanities",
 "/humanities/history",
 "/humanities/poetry",
 "/personal-learning",
 "/translation",
 "/tts",
];
const PROTECTED_ROUTES = [
 "/",
 "/hanzihome",
 "/conversation",
 "/data-quality",
 "/dictionary",
 "/grammar",
 "/html-artifacts",
 "/inspector",
 "/learning-loop",
 "/memory-tips",
 "/notebook",
 "/notes",
 "/radicals",
 "/settings?section=app",
 "/settings?section=reading",
 "/settings?section=ai",
 "/vocab",
 "/api-docs",
];
const DARK_ROUTES = new Set(["/reader", "/daily-reading", "/dictation", "/personal-learning"]);
const REDUCED_ROUTES = new Set(["/reader", "/daily-reading", "/dictation"]);
const failures = [];
const warnings = [];
const runtimeEvents = [];
let context = "bootstrap";

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const safeName = (route) =>
 route.replace(/^\//, "").replaceAll("/", "__").replaceAll("?", "--").replaceAll("=", "-") ||
 "home";

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
   for (const listener of this.listeners.get(message.method) ?? []) listener(message.params);
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
 }

 once(method, timeout = 20_000) {
  return new Promise((resolve, reject) => {
   const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeout);
   const listener = (params) => {
    clearTimeout(timer);
    this.listeners.set(
     method,
     (this.listeners.get(method) ?? []).filter((item) => item !== listener),
    );
    resolve(params);
   };
   this.on(method, listener);
  });
 }

 close() {
  this.ws.close();
 }
}

async function openClient() {
 const page = await fetch(`${CDP_URL}/json/new?${encodeURIComponent(`${BASE_URL}/reader`)}`, {
  method: "PUT",
 }).then((response) => response.json());
 const client = new CdpClient(page.webSocketDebuggerUrl);
 await client.connect();
 await Promise.all([
  client.send("Page.enable"),
  client.send("Runtime.enable"),
  client.send("Log.enable"),
  client.send("Network.enable"),
 ]);
 client.on("Runtime.exceptionThrown", (params) =>
  runtimeEvents.push({
   context,
   type: "exception",
   text:
    params.exceptionDetails?.exception?.description ??
    params.exceptionDetails?.text ??
    "Uncaught runtime exception",
  }),
 );
 client.on("Runtime.consoleAPICalled", (params) => {
  if (params.type !== "error") return;
  runtimeEvents.push({
   context,
   type: "console-error",
   text: (params.args ?? [])
    .map((arg) => arg.value ?? arg.description ?? "")
    .filter(Boolean)
    .join(" ")
    .slice(0, 500),
  });
 });
 client.on("Network.responseReceived", (params) => {
  if (params.response?.status < 400) return;
  runtimeEvents.push({
   context,
   type: "http-error",
   text: `${Math.round(params.response.status)} ${params.response.url}`,
  });
 });
 await client.send("Page.addScriptToEvaluateOnNewDocument", {
  source: `(() => {
   window.__uiAuditMetrics = { cls: 0, longTaskMax: 0 };
   try {
    new PerformanceObserver((list) => {
     for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__uiAuditMetrics.cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
   } catch {}
   try {
    new PerformanceObserver((list) => {
     for (const entry of list.getEntries()) window.__uiAuditMetrics.longTaskMax = Math.max(window.__uiAuditMetrics.longTaskMax, entry.duration);
    }).observe({ type: "longtask", buffered: true });
   } catch {}
  })();`,
 });
 return client;
}

async function navigate(client, route, viewport, theme = "light", reducedMotion = false) {
 await client.send("Emulation.setDeviceMetricsOverride", {
  width: viewport.width,
  height: viewport.height,
  deviceScaleFactor: 1,
  mobile: viewport.width <= 820,
  screenWidth: viewport.width,
  screenHeight: viewport.height,
 });
 await client.send("Emulation.setTouchEmulationEnabled", {
  enabled: viewport.width <= 820,
  maxTouchPoints: viewport.width <= 820 ? 5 : 1,
 });
 await client.send("Emulation.setEmulatedMedia", {
  features: [
   { name: "prefers-color-scheme", value: theme },
   { name: "prefers-reduced-motion", value: reducedMotion ? "reduce" : "no-preference" },
  ],
 });
 await client.send("Runtime.evaluate", {
  expression: `try {
   localStorage.setItem("chines-app-theme", ${JSON.stringify(theme)});
   localStorage.setItem("chines-app-theme-palette", "editorial");
  } catch {}`,
 });
 const loaded = client.once("Page.loadEventFired");
 await client.send("Page.navigate", { url: new URL(route, BASE_URL).href });
 await loaded;
 await sleep(450);
}

const AUDIT_EXPRESSION = `(() => {
 const visible = (element) => {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
 };
 const textOf = (element) => (element.getAttribute("aria-label") || element.getAttribute("title") || element.textContent || element.getAttribute("placeholder") || "").trim().replace(/\\s+/g, " ").slice(0, 140);
 const selector = 'a[href],button,input:not([type="hidden"]),textarea,select,[role="button"],[role="tab"],[role="menuitem"],[role="checkbox"],[role="radio"],[role="switch"],[role="option"],[role="combobox"],[contenteditable="true"]';
 const interactive = [...document.querySelectorAll(selector)].filter(visible);
 const ids = [...document.querySelectorAll("[id]")].map((node) => node.id).filter(Boolean);
 const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
 const unlabeled = interactive
  .filter((element) => !(element.matches('input[type="checkbox"],input[type="radio"]') && element.labels?.length) && !textOf(element))
  .map((element) => element.outerHTML.slice(0, 180))
  .slice(0, 20);
 const nestedInteractive = interactive
  .filter((element) => {
   const parent = element.parentElement?.closest(selector);
   return parent && visible(parent);
  })
  .map((element) => ({ child: textOf(element), parent: textOf(element.parentElement?.closest(selector) ?? element) }))
  .slice(0, 20);
 const targetFailures = interactive.flatMap((element) => {
  const slot = element.getAttribute("data-slot") || "";
  if (slot !== "button" && slot !== "chip") return [];
  const size = element.getAttribute("data-size") || "";
  const coarsePointer = matchMedia("(pointer: coarse)").matches;
  let threshold = 0;
  if (slot === "chip") threshold = coarsePointer ? 44 : 0;
  else if (size === "compact") threshold = coarsePointer ? 44 : 32;
  else if (size === "menu") threshold = 40;
  else if (["toolbar", "icon-toolbar", "tab"].includes(size) || element.closest('[role="toolbar"],[role="tablist"]')) threshold = 36;
  else if (["touch", "sm", "lg", "icon", "icon-sm", "icon-lg", "icon-round"].includes(size)) threshold = 44;
  if (!threshold) return [];
  const rect = element.getBoundingClientRect();
  return rect.width < threshold || rect.height < threshold
   ? [{ text: textOf(element), size, width: Math.round(rect.width), height: Math.round(rect.height), threshold }]
   : [];
 }).slice(0, 30);
 const outOfBounds = [...document.querySelectorAll("body *")]
  .filter(visible)
  .filter((element) => {
   const rect = element.getBoundingClientRect();
   const style = getComputedStyle(element);
   return (rect.left < -1 || rect.right > innerWidth + 1) && !(["fixed", "absolute"].includes(style.position) && rect.width <= innerWidth);
  })
  .map((element) => ({ tag: element.tagName, text: textOf(element) }))
  .slice(0, 20);
 const mains = [...document.querySelectorAll("main")];
 const html = document.documentElement;
 const body = document.body;
 return {
  pathname: location.pathname,
  mainCount: mains.length,
  nestedMainCount: mains.filter((main) => main.querySelector("main")).length,
  overflowX: Math.max(html.scrollWidth, body?.scrollWidth || 0) - innerWidth,
  duplicateIds,
  unlabeled,
  nestedInteractive,
  targetFailures,
  outOfBounds,
  runningAnimations: document.getAnimations().filter((animation) => animation.playState === "running").length,
  metrics: window.__uiAuditMetrics ?? null,
 };
})()`;

const CONTRAST_EXPRESSION = `(() => {
 const parseRgb = (value) => {
  const match = value.match(/^rgba?\\(([-.\\d]+)[, ]+([-.\\d]+)[, ]+([-.\\d]+)(?:[, /]+([-.\\d]+))?\\)$/);
  if (!match) return null;
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: match[4] === undefined ? 1 : Number(match[4]) };
 };
 const luminance = ({ r, g, b }) => {
  const channel = (value) => {
   const normalized = value / 255;
   return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
 };
 const contrast = (foreground, background) => {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
 };
 const visible = (element) => {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
 };
 const backgroundOf = (element) => {
  let current = element;
  while (current) {
   const parsed = parseRgb(getComputedStyle(current).backgroundColor);
   if (parsed && parsed.a >= 0.99) return parsed;
   current = current.parentElement;
  }
  return parseRgb(getComputedStyle(document.body).backgroundColor);
 };
 const candidates = [...document.querySelectorAll("body *")]
  .filter(visible)
  .filter((element) => [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()))
  .flatMap((element) => {
   const style = getComputedStyle(element);
   const foreground = parseRgb(style.color);
   const background = backgroundOf(element);
   if (!foreground || foreground.a < 0.99 || !background) return [];
   if (style.backgroundImage !== "none") return [];
   const ratio = contrast(foreground, background);
   const fontSize = Number.parseFloat(style.fontSize);
   const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
   const large = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
   const threshold = large ? 3 : 4.5;
   if (ratio + 0.01 >= threshold) return [];
   const text = element.textContent?.trim().replace(/\\s+/g, " ").slice(0, 120) ?? "";
   return [{ tag: element.tagName, text, ratio: Number(ratio.toFixed(2)), threshold, color: style.color, background: getComputedStyle(element).backgroundColor }];
  });
 const unique = [];
 const keys = new Set();
 for (const item of candidates) {
  const key = [item.text, item.ratio, item.color, item.background].join("|");
  if (keys.has(key)) continue;
  keys.add(key);
  unique.push(item);
  if (unique.length >= 30) break;
 }
 return unique;
})()`;

async function capture(client, name) {
 const shot = await client.send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: false,
 });
 fs.writeFileSync(path.join(SCREENSHOT_DIR, `${name}.png`), Buffer.from(shot.data, "base64"));
}

async function evaluate(client, expression) {
 return (await client.send("Runtime.evaluate", { expression, returnByValue: true })).result.value;
}

async function auditState(client, route, viewport, theme = "light", reducedMotion = false) {
 context = `${route} ${viewport.width}x${viewport.height} ${theme}${reducedMotion ? " reduced-motion" : ""}`;
 await navigate(client, route, viewport, theme, reducedMotion);
 const result = await evaluate(client, AUDIT_EXPRESSION);
 const contrastCandidates = await evaluate(client, CONTRAST_EXPRESSION);
 await capture(
  client,
  `${safeName(route)}__${viewport.name}__${theme}${reducedMotion ? "__reduced" : ""}`,
 );
 if (result.pathname !== new URL(route, BASE_URL).pathname)
  failures.push(`${context}: rendered ${result.pathname}`);
 if (result.mainCount !== 1)
  failures.push(
   `${context}: expected one <main>, found ${result.mainCount} (${result.nestedMainCount} nested)`,
  );
 if (result.nestedMainCount !== 0)
  failures.push(`${context}: found ${result.nestedMainCount} nested <main> landmarks`);
 if (result.overflowX > 1)
  failures.push(`${context}: horizontal overflow ${Math.round(result.overflowX)}px`);
 if (result.duplicateIds.length)
  failures.push(`${context}: duplicate ids ${result.duplicateIds.join(", ")}`);
 if (result.unlabeled.length)
  failures.push(`${context}: ${result.unlabeled.length} unlabeled interactive controls`);
 if (result.nestedInteractive.length)
  failures.push(`${context}: ${result.nestedInteractive.length} nested interactive controls`);
 if (result.targetFailures.length)
  failures.push(`${context}: ${result.targetFailures.length} Button targets violate local density`);
 if (result.outOfBounds.length)
  warnings.push(`${context}: ${result.outOfBounds.length} visible elements cross viewport bounds`);
 if (contrastCandidates.length)
  warnings.push(
   `${context}: ${contrastCandidates.length} simple rendered contrast candidates below AA`,
  );
 if ((result.metrics?.cls ?? 0) > 0.1)
  warnings.push(`${context}: observed CLS ${Number(result.metrics.cls).toFixed(3)}`);
 if ((result.metrics?.longTaskMax ?? 0) > 200)
  warnings.push(`${context}: max long task ${Math.round(result.metrics.longTaskMax)}ms`);
 if (reducedMotion && result.runningAnimations)
  warnings.push(`${context}: ${result.runningAnimations} animations running under reduced motion`);
 return { route, viewport, theme, reducedMotion, contrastCandidates, ...result };
}

async function mobileNavCheck(client) {
 context = "interaction /reader phone";
 await navigate(client, "/reader", VIEWPORTS[0]);
 const opened = await evaluate(
  client,
  `(() => {
   const trigger = [...document.querySelectorAll("button")].find((node) => node.getAttribute("aria-label") === "Mở toàn bộ điều hướng");
   if (!(trigger instanceof HTMLButtonElement)) return false;
   trigger.click();
   return true;
  })()`,
 );
 if (!opened) return { triggerFound: false };
 await sleep(180);
 const result = await evaluate(
  client,
  `(() => {
   const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
   };
   return {
    dialogCount: [...document.querySelectorAll('[role="dialog"]')].filter(visible).length,
    settingsReachable: [...document.querySelectorAll('a[href^="/settings"]')].filter(visible).length > 0,
    fullNavCount: [...document.querySelectorAll('nav[aria-label="Toàn bộ khu vực"]')].filter(visible).length,
   };
  })()`,
 );
 return { triggerFound: true, ...result };
}

async function globalSearchCheck(client) {
 context = "interaction /reader desktop";
 await navigate(client, "/reader", VIEWPORTS[2]);
 await client.send("Input.dispatchKeyEvent", {
  type: "keyDown",
  key: "k",
  code: "KeyK",
  windowsVirtualKeyCode: 75,
  modifiers: 2,
 });
 await client.send("Input.dispatchKeyEvent", {
  type: "keyUp",
  key: "k",
  code: "KeyK",
  windowsVirtualKeyCode: 75,
  modifiers: 2,
 });
 await sleep(200);
 const opened = await evaluate(
  client,
  `(() => {
   const input = document.querySelector('[role="combobox"]');
   if (!(input instanceof HTMLInputElement)) return { dialog: false, combobox: false };
   const controls = input.getAttribute("aria-controls");
   return {
    dialog: Boolean(input.closest('[role="dialog"]')),
    combobox: true,
    controls,
    controlsExists: Boolean(controls && document.getElementById(controls)),
    activeDescendant: input.getAttribute("aria-activedescendant"),
   };
  })()`,
 );
 await client.send("Input.dispatchKeyEvent", {
  type: "keyDown",
  key: "ArrowDown",
  code: "ArrowDown",
  windowsVirtualKeyCode: 40,
 });
 await client.send("Input.dispatchKeyEvent", {
  type: "keyUp",
  key: "ArrowDown",
  code: "ArrowDown",
  windowsVirtualKeyCode: 40,
 });
 await sleep(80);
 const afterArrow = await evaluate(
  client,
  `(() => {
   const input = document.querySelector('[role="combobox"]');
   if (!(input instanceof HTMLInputElement)) return null;
   const active = input.getAttribute("aria-activedescendant");
   const option = active ? document.getElementById(active) : null;
   const listbox = input.getAttribute("aria-controls");
   return {
    active,
    activeExists: Boolean(option),
    activeSelected: option?.getAttribute("aria-selected") === "true",
    optionInControlledListbox: Boolean(option && listbox && option.closest('[role="listbox"]')?.id === listbox),
    focusStayedOnCombobox: document.activeElement === input,
   };
  })()`,
 );
 await client.send("Input.dispatchKeyEvent", {
  type: "keyDown",
  key: "Escape",
  code: "Escape",
  windowsVirtualKeyCode: 27,
 });
 await client.send("Input.dispatchKeyEvent", {
  type: "keyUp",
  key: "Escape",
  code: "Escape",
  windowsVirtualKeyCode: 27,
 });
 await sleep(180);
 const remaining = await evaluate(
  client,
  `[...document.querySelectorAll('[role="dialog"]')].filter((element) => {
   const style = getComputedStyle(element);
   const rect = element.getBoundingClientRect();
   return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }).length`,
 );
 return { opened, afterArrow, remaining };
}

async function dictationChoiceCheck(client) {
 context = "interaction /dictation phone";
 await navigate(client, "/dictation", VIEWPORTS[0]);
 return evaluate(
  client,
  `(() => {
   const group = document.querySelector('[role="group"][aria-label="Nguồn nghe chép"]');
   if (!(group instanceof HTMLElement)) return { found: false };
   const labels = ["Bài học / bài đọc HSK", "Từ thư viện", "Dán nội dung"];
   const controls = [...group.querySelectorAll("button")];
   return {
    found: true,
    labels: labels.map((label) => {
     const control = controls.find((button) => button.textContent?.includes(label));
     if (!control) return { label, found: false };
     const rect = control.getBoundingClientRect();
     return {
      label,
      found: true,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      intersectsViewport: rect.left >= -1 && rect.right <= innerWidth + 1,
     };
    }),
    horizontalScrollNeeded: group.scrollWidth > group.clientWidth + 1,
   };
  })()`,
 );
}

async function ttsTargetCheck(client) {
 context = "interaction /tts phone";
 await navigate(client, "/tts", VIEWPORTS[0]);
 return evaluate(
  client,
  `(() => {
   const group = document.querySelector('[role="group"][aria-label="Chọn câu nghe thử"]');
   if (!(group instanceof HTMLElement)) return { found: false, targets: [] };
   return {
    found: true,
    targets: [...group.querySelectorAll("button")].map((button) => {
     const rect = button.getBoundingClientRect();
     return {
      label: button.getAttribute("aria-label") || button.textContent?.trim() || "",
      width: Math.round(rect.width),
      height: Math.round(rect.height),
     };
    }),
   };
  })()`,
 );
}

async function main() {
 const client = await openClient();
 const report = [];
 try {
  for (const route of PUBLIC_ROUTES) {
   for (const viewport of VIEWPORTS) report.push(await auditState(client, route, viewport));
   if (DARK_ROUTES.has(route)) {
    report.push(await auditState(client, route, VIEWPORTS[0], "dark"));
    report.push(await auditState(client, route, VIEWPORTS[2], "dark"));
   }
   if (REDUCED_ROUTES.has(route))
    report.push(await auditState(client, route, VIEWPORTS[0], "light", true));
  }

  const mobileNavigation = await mobileNavCheck(client);
  if (!mobileNavigation.triggerFound) failures.push(`${context}: trigger not found`);
  else {
   if (mobileNavigation.dialogCount !== 1)
    failures.push(`${context}: expected one dialog, found ${mobileNavigation.dialogCount}`);
   if (!mobileNavigation.settingsReachable)
    failures.push(`${context}: Settings unreachable from full navigation`);
   if (mobileNavigation.fullNavCount !== 1)
    failures.push(`${context}: full navigation landmark missing`);
  }

  const globalSearch = await globalSearchCheck(client);
  if (!globalSearch.opened?.dialog) failures.push(`${context}: Ctrl+K search dialog did not open`);
  if (!globalSearch.opened?.combobox) failures.push(`${context}: search dialog has no combobox`);
  if (!globalSearch.opened?.controlsExists)
   failures.push(`${context}: combobox aria-controls target is missing`);
  if (globalSearch.afterArrow) {
   if (!globalSearch.afterArrow.activeExists)
    failures.push(`${context}: aria-activedescendant does not resolve after ArrowDown`);
   if (!globalSearch.afterArrow.activeSelected)
    failures.push(`${context}: active option is not aria-selected after ArrowDown`);
   if (!globalSearch.afterArrow.optionInControlledListbox)
    failures.push(`${context}: active option is outside controlled listbox`);
   if (!globalSearch.afterArrow.focusStayedOnCombobox)
    failures.push(`${context}: DOM focus left combobox during active-descendant navigation`);
  }
  if (globalSearch.remaining !== 0) failures.push(`${context}: Escape did not close search dialog`);

  const dictationChoices = await dictationChoiceCheck(client);
  if (!dictationChoices.found) failures.push(`${context}: source choice group missing`);
  else {
   for (const item of dictationChoices.labels) {
    if (!item.found) failures.push(`${context}: missing source choice ${item.label}`);
    else if (!item.intersectsViewport)
     failures.push(`${context}: source choice ${item.label} is outside phone viewport`);
    else if (item.height < 44)
     failures.push(`${context}: source choice ${item.label} is only ${item.height}px high`);
   }
   if (dictationChoices.horizontalScrollNeeded)
    failures.push(`${context}: finite source choices still require horizontal scrolling`);
  }

  const ttsTargets = await ttsTargetCheck(client);
  if (ttsTargets.found) {
   for (const target of ttsTargets.targets) {
    if (target.width < 44 || target.height < 44)
     failures.push(
      `${context}: ${target.label} is ${target.width}x${target.height}, expected 44x44 minimum`,
     );
   }
  }

  for (const event of runtimeEvents) {
   const line = `${event.context}: ${event.type}: ${event.text}`;
   if (event.type === "exception") failures.push(line);
   else warnings.push(line);
  }

  const summary = {
   generatedAt: new Date().toISOString(),
   statesRendered: report.length,
   publicRoutes: PUBLIC_ROUTES,
   protectedRoutesNotRendered: PROTECTED_ROUTES,
   interactionChecks: { mobileNavigation, globalSearch, dictationChoices, ttsTargets },
   hardFailures: failures,
   warnings,
   runtimeEvents,
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, "report.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(
   `Rendered ${report.length} public states; ${PROTECTED_ROUTES.length} protected routes intentionally unrendered without auth fixture.`,
  );
  console.log(`Hard failures: ${failures.length}`);
  failures.forEach((line) => console.error(`ERROR ${line}`));
  console.log(`Warnings: ${warnings.length}`);
  warnings.slice(0, 200).forEach((line) => console.log(`WARN ${line}`));
  if (failures.length) process.exitCode = 1;
 } finally {
  client.close();
 }
}

main().catch((error) => {
 console.error(error);
 process.exit(1);
});
