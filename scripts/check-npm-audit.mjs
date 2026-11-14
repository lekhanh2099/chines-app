import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASELINE_PATH = process.env.NPM_AUDIT_BASELINE_PATH
 ? path.resolve(ROOT, process.env.NPM_AUDIT_BASELINE_PATH)
 : path.join(ROOT, "scripts", "npm-audit-baseline.json");
const SEVERITY_RANK = {
 info: 0,
 low: 1,
 moderate: 2,
 high: 3,
 critical: 4,
};

function readBaseline() {
 const parsed = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));

 if (!parsed.advisories || typeof parsed.advisories !== "object") {
  throw new Error("npm audit baseline must contain an advisories object");
 }

 for (const [source, advisory] of Object.entries(parsed.advisories)) {
  if (!/^\d+$/.test(source)) throw new Error(`Invalid npm advisory source: ${source}`);
  if (typeof advisory.package !== "string" || advisory.package.length === 0) {
   throw new Error(`Missing package for npm advisory ${source}`);
  }
  if (!(advisory.severity in SEVERITY_RANK)) {
   throw new Error(`Invalid severity for npm advisory ${source}`);
  }
 }

 return parsed;
}

function runAudit() {
 const command = process.platform === "win32" ? "npm.cmd" : "npm";
 const result = spawnSync(command, ["audit", "--omit=dev", "--json"], {
  cwd: ROOT,
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
 });

 if (result.error) throw result.error;

 try {
  return JSON.parse(result.stdout);
 } catch {
  if (result.stderr) console.error(result.stderr.trim());
  throw new Error("npm audit did not return valid JSON");
 }
}

function collectAdvisories(vulnerabilities) {
 const advisories = new Map();

 for (const vulnerability of Object.values(vulnerabilities)) {
  for (const via of vulnerability.via ?? []) {
   if (typeof via === "string") continue;
   advisories.set(String(via.source), via);
  }
 }

 return advisories;
}

function resolveSources(packageName, vulnerabilities, seen = new Set()) {
 if (seen.has(packageName)) return new Set();
 const vulnerability = vulnerabilities[packageName];
 if (!vulnerability) return new Set();

 const nextSeen = new Set(seen).add(packageName);
 const sources = new Set();

 for (const via of vulnerability.via ?? []) {
  if (typeof via === "string") {
   for (const source of resolveSources(via, vulnerabilities, nextSeen)) sources.add(source);
  } else {
   sources.add(String(via.source));
  }
 }

 return sources;
}

const baseline = readBaseline();
const report = runAudit();

if (report.error) {
 console.error(
  `npm audit failed: ${report.error.summary ?? report.error.message ?? "unknown error"}`,
 );
 process.exitCode = 1;
} else {
 const vulnerabilities = report.vulnerabilities ?? {};
 const advisories = collectAdvisories(vulnerabilities);
 const failures = [];

 for (const [packageName, vulnerability] of Object.entries(vulnerabilities)) {
  const sources = resolveSources(packageName, vulnerabilities);
  if (sources.size === 0) {
   failures.push(`${packageName}: vulnerability has no resolvable advisory source`);
  }

  for (const source of sources) {
   if (!baseline.advisories[source]) failures.push(`${packageName}: new advisory ${source}`);
  }

  if (vulnerability.severity === "critical") {
   failures.push(`${packageName}: critical vulnerability`);
  }
 }

 for (const [source, advisory] of advisories) {
  const allowed = baseline.advisories[source];
  if (!allowed) continue;

  if (advisory.name !== allowed.package) {
   failures.push(
    `advisory ${source}: baseline package ${allowed.package} does not match ${advisory.name}`,
   );
  }

  if (SEVERITY_RANK[advisory.severity] > SEVERITY_RANK[allowed.severity]) {
   failures.push(
    `${advisory.name}: advisory ${source} increased from ${allowed.severity} to ${advisory.severity}`,
   );
  }
 }

 const staleSources = Object.keys(baseline.advisories).filter((source) => !advisories.has(source));
 if (staleSources.length > 0) {
  console.warn(`Resolved npm advisories still in baseline: ${staleSources.join(", ")}`);
  console.warn("Remove resolved entries from scripts/npm-audit-baseline.json.");
 }

 const summary = report.metadata?.vulnerabilities ?? {};
 console.info(
  `npm audit: ${summary.total ?? 0} known vulnerabilities ` +
   `(${summary.low ?? 0} low, ${summary.moderate ?? 0} moderate, ` +
   `${summary.high ?? 0} high, ${summary.critical ?? 0} critical).`,
 );

 if (failures.length > 0) {
  console.error("npm audit found vulnerabilities outside the approved baseline:");
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
 } else {
  console.info(
   `No new or escalated advisories. Review the baseline by ${baseline.reviewBy ?? "the next dependency update"}.`,
  );
 }
}
