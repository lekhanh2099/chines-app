import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");

function jobSource(name) {
 const source = workflow.split(`\n ${name}:\n`)[1];
 if (!source) throw new Error(`Missing CI job ${name}`);
 return source.split(/\n [a-z][a-z_]*:\n/, 1)[0];
}

function inlineSource(name) {
 const match = jobSource(name).match(/node --input-type=module <<'JS'\n([\s\S]*?)\n      JS/);
 if (!match) throw new Error(`Missing inline CI script for ${name}`);
 return match[1].replace(/^ {6}/gm, "");
}

function field(name, key) {
 const match = jobSource(name).match(new RegExp(`^  ${key}: (.+)$`, "m"));
 if (!match) throw new Error(`Missing CI ${name}.${key}`);
 return match[1];
}

function select({
 latest = ["src/features/notes/hooks/useNoteDetail.ts"],
 event = {},
 remove = [],
} = {}) {
 const directory = mkdtempSync(path.join(tmpdir(), "hanzihome-ci-test-"));
 const git = (...args) =>
  execFileSync("git", args, { cwd: directory, encoding: "utf8", stdio: "pipe" }).trim();
 const commit = (files, message) => {
  for (const file of files) {
   const target = path.join(directory, file);
   mkdirSync(path.dirname(target), { recursive: true });
   writeFileSync(target, message);
  }
  git("add", ".");
  git("commit", "--quiet", "-m", message);
  return git("rev-parse", "HEAD");
 };
 try {
  git("init", "--quiet", "-b", "main");
  git("config", "user.name", "CI fixture");
  git("config", "user.email", "ci@example.test");
  const base = commit(["README.md", ...remove], "baseline");
  const previous = commit(["package.json"], "earlier dependency patch");
  for (const file of remove) rmSync(path.join(directory, file));
  const head = commit(latest, "current update");
  const output = path.join(directory, "output");
  const env = {
   ...process.env,
   EVENT_NAME: "pull_request",
   EVENT_ACTION: "synchronize",
   PR_DRAFT: "true",
   PR_BASE: base,
   PUSH_BASE: previous,
   PR_HEAD: head,
   GITHUB_OUTPUT: output,
   GITHUB_STEP_SUMMARY: path.join(directory, "summary"),
   ...event,
  };
  if (event.PR_BASE === "advanced") env.PR_BASE = head;
  if (event.PUSH_BASE === "rewritten") {
   env.PUSH_BASE = head;
   env.PR_HEAD = previous;
  }
  execFileSync(process.execPath, ["--input-type=module"], {
   cwd: directory,
   env,
   input: inlineSource("changes"),
   encoding: "utf8",
   stdio: "pipe",
  });
  return Object.fromEntries(
   readFileSync(output, "utf8")
    .trim()
    .split("\n")
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
  );
 } finally {
  rmSync(directory, { recursive: true, force: true });
 }
}

describe("CI affected selection with actual Git history", () => {
 it("uses a draft's new delta despite an earlier dependency patch", () => {
  const result = select();
  expect(result.e2e_grep).toBe("keeps two Notes drafts|fences linked Reader Notes");
  expect(JSON.parse(result.unit_files)).toEqual(["src/features/notes/hooks/useNoteDetail.ts"]);
  expect(result.browser_files).toContain("NoteEditor.browser.test.ts");
  expect(result.unit_full).toBe("false");
 });

 it.each(["docs/testing/example.md", ".github/workflows/ci.yml"])(
  "keeps guidance-only draft changes in tooling checks: %s",
  (file) => {
   const result = select({ latest: [file] });
   expect(result).toMatchObject({
    code: "false",
    guidance: "true",
    browser_files: "",
    e2e_grep: "",
   });
  },
 );

 it.each([
  "src/features/hsk/HskWorkspace.tsx",
  "src/features/hanzihome/HanziHomeLibraryHome.tsx",
  "src/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace.tsx",
 ])("selects the actual mounted Reading consumer for %s", (file) => {
  expect(select({ latest: [file] }).browser_files).toContain(
   "src/features/reading/workspaces/Reading.browser.test.ts",
  );
 });

 it("keeps component-only changes out of the product database setup", () => {
  const result = select({ latest: ["src/features/notes/components/NoteConflictDialog.tsx"] });
  expect(result.browser_files).toContain("NoteEditor.browser.test.ts");
  expect(result.e2e_grep).toBe("");
 });

 it("uses all mounted consumers for global CSS without a database run", () => {
  const result = select({ latest: ["src/app/globals.css"] });
  expect(result.browser_files.split(" ")).toHaveLength(15);
  expect(result.e2e_grep).toBe("");
  expect(result.unit_full).toBe("true");
 });

 it("selects the unsaved-draft navigation browser regression", () => {
  const result = select({
   latest: ["src/components/layout/navigation/UnsavedDraftNavigationGuard.tsx"],
  });
  expect(result.browser_files).toContain(
   "src/components/layout/navigation/UnsavedDraftNavigationGuard.browser.test.ts",
  );
  expect(result.e2e_grep).toBe("");
 });

 it.each(["e2e/hanzihome.spec.ts", "scripts/e2e/seed-fixtures.mjs", "playwright.config.ts"])(
  "runs the full product suite when its harness changes: %s",
  (file) => {
   expect(select({ latest: [file] })).toMatchObject({ unit_full: "true", e2e_grep: "." });
  },
 );

 it.each(["package.json", "src/lib/supabase/server.ts", "src/unmapped-owner.ts"])(
  "falls back to full coverage for shared or unmapped ownership: %s",
  (file) => {
   expect(select({ latest: [file] })).toMatchObject({
    code: "true",
    unit_full: "true",
    e2e_grep: ".",
   });
  },
 );

 it("retains full Node coverage and affected consumers for deleted owners", () => {
  const result = select({ latest: [], remove: ["src/features/notes/hooks/useNoteDetail.ts"] });
  expect(result.unit_full).toBe("true");
  expect(result.browser_files).toContain("NoteEditor.browser.test.ts");
  expect(result.e2e_grep).toContain("keeps two Notes drafts");
 });

 it.each([
  { EVENT_ACTION: "opened" },
  { EVENT_ACTION: "reopened" },
  { EVENT_ACTION: "ready_for_review", PR_DRAFT: "false" },
  { PR_DRAFT: "false" },
  { EVENT_NAME: "workflow_dispatch" },
  { PUSH_BASE: "" },
  { PUSH_BASE: "0000000000000000000000000000000000000000" },
  { PUSH_BASE: "1111111111111111111111111111111111111111" },
  { PR_BASE: "" },
  { PR_HEAD: "" },
  { PR_BASE: "advanced" },
  { PUSH_BASE: "rewritten" },
 ])("requires full product coverage for unsafe or full-run events: %j", (event) => {
  expect(select({ event }).e2e_grep).toBe(".");
 });

 it("uses only the new push scope on main", () => {
  expect(select({ latest: ["docs/example.md"], event: { EVENT_NAME: "push" } })).toMatchObject({
   code: "false",
   e2e_grep: "",
  });
 });
});

describe("CI aggregation and metadata isolation", () => {
 const evaluate = (expression, github) =>
  vm.runInNewContext(expression.replace(/^\$\{\{\s*|\s*\}\}$/g, ""), {
   github,
   always: () => true,
  });

 it("subscribes to code and readiness events without replacing checks on metadata edits", () => {
  const types = workflow.match(/^ pull_request:\n  types: \[([^\]]+)\]/m)?.[1];
  if (!types) throw new Error("Missing CI pull-request events");
  expect(types.split(",").map((value) => value.trim())).toEqual([
   "opened",
   "reopened",
   "synchronize",
   "ready_for_review",
  ]);
 });

 it("aggregates every triggered validation without a metadata success path", () => {
  expect(workflow).toContain("group: ci-${{ github.ref }}\n");
  expect(jobSource("changes")).not.toMatch(/^  if:/m);
  expect(jobSource("gate")).not.toMatch(/^     if:/m);
  for (const action of ["opened", "reopened", "synchronize", "ready_for_review"]) {
   for (const draft of [false, true, undefined]) {
    const github = {
     event_name: "pull_request",
     event: { action, pull_request: { draft } },
    };
    expect(Boolean(evaluate(field("gate", "if"), github))).toBe(true);
    expect(evaluate(field("gate", "name"), github)).toBe(draft ? "CI draft" : "CI gate");
   }
  }
  for (const eventName of ["push", "workflow_dispatch"]) {
   expect(evaluate(field("gate", "name"), { event_name: eventName, event: {} })).toBe("CI gate");
  }
 });

 it.each(["changes", "verify", "browser", "e2e"])(
  "tests the exact head in %s so unchanged-source readiness is independent of retargeting",
  (job) => {
   const checkout = jobSource(job).match(/uses: actions\/checkout@v5\n     with:\n      ref: (.+)/);
   if (!checkout) throw new Error(`Missing exact-source checkout for ${job}`);
   expect(
    evaluate(checkout[1], {
     event_name: "pull_request",
     event: { pull_request: { head: { sha: "pr-head" } } },
     sha: "merge",
    }),
   ).toBe("pr-head");
   for (const eventName of ["push", "workflow_dispatch"]) {
    expect(evaluate(checkout[1], { event_name: eventName, event: {}, sha: "event-head" })).toBe(
     "event-head",
    );
   }
  },
 );

 it("keeps cancelled draft validation separate from the required gate on the same commit", () => {
  const names = [];
  for (const draft of [true, false]) {
   const github = {
    sha: "same-commit",
    event_name: "pull_request",
    event: {
     action: draft ? "synchronize" : "ready_for_review",
     changes: {},
     pull_request: { draft },
    },
   };
   names.push(evaluate(field("gate", "name"), github));
   const checks = {
    changes: { result: "success", outputs: { browser_files: "", e2e_grep: "" } },
    verify: { result: "cancelled" },
    browser: { result: "skipped" },
    e2e: { result: "skipped" },
   };
   let passed = true;
   vm.runInNewContext(inlineSource("gate"), {
    process: {
     env: { CHECK_RESULTS: JSON.stringify(checks) },
     exit: () => {
      passed = false;
     },
    },
    console: { error: () => {}, log: () => {} },
   });
   expect(passed).toBe(false);
  }
  expect(names).toEqual(["CI draft", "CI gate"]);
 });

 it("rejects failed or cancelled checks across all 1,024 selection/result combinations", () => {
  const results = ["success", "failure", "cancelled", "skipped"];
  for (const changes of results)
   for (const verify of results)
    for (const browser of results)
     for (const e2e of results)
      for (const browserSelected of [false, true])
       for (const e2eSelected of [false, true]) {
        const needs = {
         changes: {
          result: changes,
          outputs: {
           browser_files: browserSelected ? "fixture.ts" : "",
           e2e_grep: e2eSelected ? "." : "",
          },
         },
         verify: { result: verify },
         browser: { result: browser },
         e2e: { result: e2e },
        };
        let passed = true;
        vm.runInNewContext(inlineSource("gate"), {
         process: {
          env: { CHECK_RESULTS: JSON.stringify(needs) },
          exit: () => {
           passed = false;
          },
         },
         console: { error: () => {}, log: () => {} },
        });
        expect(passed).toBe(
         changes === "success" &&
          verify === "success" &&
          (browserSelected ? browser === "success" : ["success", "skipped"].includes(browser)) &&
          (e2eSelected ? e2e === "success" : ["success", "skipped"].includes(e2e)),
        );
       }
 });
});
