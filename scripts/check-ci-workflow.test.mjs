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
 earlier = ["package.json"],
 baseOnly = [],
 initialContents = {},
 latestContents = {},
 event = {},
 remove = [],
 pushMergeMessage = "",
} = {}) {
 const directory = mkdtempSync(path.join(tmpdir(), "hanzihome-ci-test-"));
 const git = (...args) =>
  execFileSync("git", args, { cwd: directory, encoding: "utf8", stdio: "pipe" }).trim();
 const commit = (files, message, contents = {}) => {
  for (const file of files) {
   const target = path.join(directory, file);
   mkdirSync(path.dirname(target), { recursive: true });
   writeFileSync(target, contents[file] ?? message);
  }
  git("add", ".");
  git("commit", "--quiet", "-m", message);
  return git("rev-parse", "HEAD");
 };
 try {
  git("init", "--quiet", "-b", "main");
  git("config", "user.name", "CI fixture");
  git("config", "user.email", "ci@example.test");
  let base = commit(
   ["README.md", ...remove, ...Object.keys(initialContents)],
   "baseline",
   initialContents,
  );
  git("switch", "--quiet", "-c", "pr");
  const previous = earlier.length ? commit(earlier, "earlier PR change") : base;
  for (const file of remove) rmSync(path.join(directory, file));
  const head = commit(latest, "current update", latestContents);
  if ((event.EVENT_NAME ?? "pull_request") === "pull_request") {
   git("switch", "--quiet", "main");
   if (baseOnly.length) base = commit(baseOnly, "integration base update");
   git("merge", "--quiet", "--no-ff", "-m", "test merge", head);
  }
  // A push to main that lands the PR: main's previous tip is the push "before".
  const mainBeforeMerge = base;
  if (pushMergeMessage) {
   git("switch", "--quiet", "main");
   git("merge", "--quiet", "--no-ff", "-m", pushMergeMessage, head);
  }
  const output = path.join(directory, "output");
  const env = {
   ...process.env,
   EVENT_NAME: "pull_request",
   EVENT_ACTION: "synchronize",
   PR_DRAFT: "true",
   PR_BASE: base,
   BEFORE_SHA: previous,
   PR_HEAD: head,
   GITHUB_OUTPUT: output,
   GITHUB_STEP_SUMMARY: path.join(directory, "summary"),
   ...event,
  };
  if (event.PR_BASE === "advanced") env.PR_BASE = head;
  if (event.BEFORE_SHA === "main-before-merge") env.BEFORE_SHA = mainBeforeMerge;
  if (event.BEFORE_SHA === "rewritten") {
   env.BEFORE_SHA = git("commit-tree", previous + "^{tree}", "-m", "discarded old head");
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
  expect(result.unit_full).toBe("false");
 });

 it.each([
  "",
  "0000000000000000000000000000000000000000",
  "1111111111111111111111111111111111111111",
  "rewritten",
 ])("uses the complete PR diff when the previous draft head is unusable: %j", (before) => {
  const result = select({
   earlier: ["src/features/home/HomeDashboard.tsx"],
   event: { BEFORE_SHA: before },
  });
  expect(JSON.parse(result.unit_files)).toEqual([
   "src/features/home/HomeDashboard.tsx",
   "src/features/notes/hooks/useNoteDetail.ts",
  ]);
  expect(result).toMatchObject({
   unit_full: "false",
   e2e_grep: "keeps two Notes drafts|fences linked Reader Notes",
  });
 });

 it("uses the complete PR diff when the merge base advanced past the previous draft head", () => {
  const result = select({
   earlier: ["src/features/home/HomeDashboard.tsx"],
   baseOnly: ["src/lib/supabase/server.ts"],
  });
  expect(JSON.parse(result.unit_files)).toEqual([
   "src/features/home/HomeDashboard.tsx",
   "src/features/notes/hooks/useNoteDetail.ts",
  ]);
  expect(result.unit_full).toBe("false");
 });

 it("selects no product cases for a scoped ready Home PR", () => {
  expect(
   select({
    earlier: [],
    latest: ["src/features/home/HomeDashboard.tsx"],
    event: { PR_DRAFT: "false", EVENT_ACTION: "ready_for_review" },
   }),
  ).toMatchObject({
   code: "true",
   guidance: "false",
   unit_full: "false",
   e2e_grep: "",
  });
 });

 it("combines affected consumers from the whole ready PR, including earlier product changes", () => {
  const result = select({
   earlier: ["src/features/notes/hooks/useNoteDetail.ts"],
   latest: ["src/features/home/HomeDashboard.tsx"],
   event: { PR_DRAFT: "false" },
  });
  expect(JSON.parse(result.unit_files)).toEqual([
   "src/features/home/HomeDashboard.tsx",
   "src/features/notes/hooks/useNoteDetail.ts",
  ]);
  expect(result).toMatchObject({
   unit_full: "false",
   e2e_grep: "keeps two Notes drafts|fences linked Reader Notes",
  });
 });

 it.each([
  "src/app/auth/callback/route.ts",
  "src/app/api/ai/conversation/route.ts",
  "public/sw.js",
  "src/components/ui/actions/button.tsx",
  "e2e/hanzihome.spec.ts",
  "src/features/hanzihome/unmapped-owner.ts",
  "src/lib/supabase/server.ts",
 ])("keeps full coverage for a risky or unmapped ready PR path: %s", (file) => {
  const result = select({
   earlier: [],
   latest: ["src/features/home/HomeDashboard.tsx", file],
   event: { PR_DRAFT: "false" },
  });
  expect(result).toMatchObject({ code: "true", unit_full: "true", e2e_grep: "." });
 });

 it("uses the product cases covering a mapped annotations API", () => {
  const result = select({
   earlier: [],
   latest: ["src/app/api/hanzihome/lesson-annotations/route.ts"],
   event: { PR_DRAFT: "false" },
  });
  expect(result).toMatchObject({
   unit_full: "true",
   e2e_grep: "keeps two Notes drafts|fences linked Reader Notes",
  });
 });

 it.each(["true", "false"])(
  "retains full coverage for the shared learning-state hook (draft: %s)",
  (draft) => {
   const result = select({
    earlier: [],
    latest: ["src/features/hanzihome/hooks/useLearningState.ts"],
    event: { PR_DRAFT: draft },
   });
   expect(result).toMatchObject({ unit_full: "true", e2e_grep: "." });
  },
 );

 it.each([
  "src/features/notes/hooks/useCreateLessonLinkedNote.ts",
  "src/features/notes/components/NoteConflictDialog.tsx",
 ])("tests Notes and textbook consumers of shared note editing: %s", (file) => {
  const result = select({ earlier: [], latest: [file], event: { PR_DRAFT: "false" } });
  expect(result.e2e_grep).toBe("keeps two Notes drafts|fences linked Reader Notes");
 });

 it.each([
  { earlier: ["package.json"], event: { PR_DRAFT: "true", EVENT_ACTION: "synchronize" } },
  { earlier: [], event: { PR_DRAFT: "false", EVENT_ACTION: "ready_for_review" } },
 ])("keeps guidance-only changes in tooling checks: %j", ({ earlier, event }) => {
  const result = select({
   earlier,
   latest: ["docs/testing/example.md"],
   event,
  });
  expect(result).toMatchObject({
   code: "false",
   guidance: "true",
   e2e_grep: "",
  });
 });

 it.each([".github/workflows/ci.yml", "scripts/check-ci-workflow.test.mjs", "vercel.json"])(
  "requires full coverage for changes to the pipeline: %s",
  (file) => {
   const result = select({ latest: [file] });
   expect(result).toMatchObject({ code: "true", unit_full: "true", e2e_grep: "." });
   if (file.endsWith("/ci.yml")) expect(result.guidance).toBe("true");
  },
 );

 it("retains product database coverage for a component that handles note conflicts", () => {
  const result = select({ latest: ["src/features/notes/components/NoteConflictDialog.tsx"] });
  expect(result.e2e_grep).toBe("keeps two Notes drafts|fences linked Reader Notes");
 });

 it.each(["true", "false"])(
  "runs full Node coverage for global CSS without a database run (draft: %s)",
  (draft) => {
   const result = select({
    earlier: [],
    latest: ["src/app/globals.css"],
    event: { PR_DRAFT: draft },
   });
   expect(result.e2e_grep).toBe("");
   expect(result.unit_full).toBe("true");
  },
 );

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
  expect(result.e2e_grep).toContain("keeps two Notes drafts");
 });

 it("still runs full coverage when the whole PR fallback includes an earlier dependency change", () => {
  const result = select({ baseOnly: ["src/lib/supabase/server.ts"] });
  expect(JSON.parse(result.unit_files)).toContain("package.json");
  expect(result.e2e_grep).toBe(".");
 });

 it.each([
  { EVENT_ACTION: "opened" },
  { EVENT_ACTION: "reopened" },
  { EVENT_ACTION: "ready_for_review", PR_DRAFT: "false" },
  { PR_DRAFT: "false" },
  { EVENT_NAME: "workflow_dispatch" },
  { EVENT_NAME: "push", BEFORE_SHA: "" },
  { EVENT_NAME: "push", BEFORE_SHA: "0000000000000000000000000000000000000000" },
  { EVENT_NAME: "push", BEFORE_SHA: "1111111111111111111111111111111111111111" },
  { PR_BASE: "" },
  { PR_HEAD: "" },
  { PR_BASE: "advanced" },
  { EVENT_NAME: "push", BEFORE_SHA: "rewritten" },
 ])("requires full product coverage for unsafe or full-run events: %j", (event) => {
  expect(select({ event }).e2e_grep).toBe(".");
 });

 it("re-runs nothing for a merged pull request on main", () => {
  const result = select({
   latest: ["src/features/hanzihome/components/review/AmbientPipFlashcard.tsx"],
   pushMergeMessage: "Merge pull request #42 from owner/feature",
   event: { EVENT_NAME: "push", BEFORE_SHA: "main-before-merge" },
  });
  expect(result).toMatchObject({ run_verify: "false", run_e2e: "false" });
 });

 it("keeps the affected suites for a direct push that is not a pull-request merge", () => {
  const result = select({
   latest: ["src/features/hanzihome/components/review/AmbientPipFlashcard.tsx"],
   pushMergeMessage: "Merge branch 'hotfix'",
   event: { EVENT_NAME: "push", BEFORE_SHA: "main-before-merge" },
  });
  expect(result).toMatchObject({ run_verify: "true", run_e2e: "true" });
 });

 it("runs only verify for a draft and the selected suites once the PR is ready", () => {
  const latest = ["src/features/hanzihome/components/review/AmbientPipFlashcard.tsx"];
  expect(select({ latest, event: { PR_DRAFT: "true" } })).toMatchObject({
   run_verify: "true",
   run_e2e: "false",
  });
  expect(
   select({ latest, event: { PR_DRAFT: "false", EVENT_ACTION: "ready_for_review" } }),
  ).toMatchObject({ run_verify: "true", run_e2e: "true" });
 });

 it("keeps full coverage for a merged pull request pushed over an unsafe base", () => {
  const result = select({
   pushMergeMessage: "Merge pull request #42 from owner/feature",
   event: { EVENT_NAME: "push", BEFORE_SHA: "" },
  });
  expect(result.e2e_grep).toBe(".");
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
   cancelled: () => false,
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
  expect(jobSource("changes")).not.toMatch(/^  if:/m);
  expect(jobSource("gate")).not.toMatch(/^     if:/m);
  for (const action of ["opened", "reopened", "synchronize", "ready_for_review"]) {
   for (const draft of [false, true, undefined]) {
    const github = {
     event_name: "pull_request",
     base_ref: "main",
     event: { action, pull_request: { draft } },
    };
    expect(Boolean(evaluate(field("gate", "if"), github))).toBe(true);
    expect(evaluate(field("gate", "name"), github)).toBe(draft ? "CI draft" : "CI gate");
   }
  }
 });

 it("reports the production check only for a push to main", () => {
  const name = field("gate", "name");
  const mainPush = { event_name: "push", ref: "refs/heads/main", event: {} };
  expect(evaluate(name, mainPush)).toBe("CI production");
  expect(evaluate(name, { ...mainPush, event_name: "workflow_dispatch" })).toBe("CI validation");
  expect(
   evaluate(name, { ...mainPush, ref: "refs/heads/refactor/hanzihome-integrity-remediation" }),
  ).toBe("CI validation");
  expect(
   evaluate(name, {
    event_name: "pull_request",
    base_ref: "refactor/hanzihome-integrity-remediation",
    event: { pull_request: { draft: false } },
   }),
  ).toBe("CI validation");
  expect(workflow).toContain("group: ci-${{ github.event_name }}-${{ github.ref }}\n");
 });

 it.each(["changes", "verify", "e2e"])("checks out the tested merge SHA in %s for a PR", (job) => {
  const checkout = jobSource(job).match(/uses: actions\/checkout@v5\n     with:\n      ref: (.+)/);
  if (!checkout) throw new Error(`Missing exact-source checkout for ${job}`);
  expect(
   evaluate(checkout[1], {
    event_name: "pull_request",
    event: { pull_request: { head: { sha: "pr-head" } } },
    sha: "merge",
   }),
  ).toBe("merge");
  for (const eventName of ["push", "workflow_dispatch"]) {
   expect(evaluate(checkout[1], { event_name: eventName, event: {}, sha: "event-head" })).toBe(
    "event-head",
   );
  }
 });

 it("skips only a cancelled draft gate and always reports the required gate", () => {
  const condition = field("gate", "if").replace(/^\$\{\{\s*|\s*\}\}$/g, "");
  const runs = (cancelled, draft) =>
   vm.runInNewContext(condition, {
    cancelled: () => cancelled,
    github: { event: { pull_request: { draft } } },
   });
  expect(runs(true, true)).toBe(false);
  expect(runs(true, false)).toBe(true);
  expect(runs(false, true)).toBe(true);
  expect(runs(false, false)).toBe(true);
 });

 it("keeps cancelled draft validation separate from the required gate on the same commit", () => {
  const names = [];
  for (const draft of [true, false]) {
   const github = {
    sha: "same-commit",
    event_name: "pull_request",
    base_ref: "main",
    event: {
     action: draft ? "synchronize" : "ready_for_review",
     changes: {},
     pull_request: { draft },
    },
   };
   names.push(evaluate(field("gate", "name"), github));
   const checks = {
    changes: { result: "success", outputs: { e2e_grep: "" } },
    verify: { result: "cancelled" },
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

 it("accepts a skipped verify only when it was not selected", () => {
  const run = (runVerify, verify) => {
   let passed = true;
   vm.runInNewContext(inlineSource("gate"), {
    process: {
     env: {
      CHECK_RESULTS: JSON.stringify({
       changes: {
        result: "success",
        outputs: { run_verify: runVerify, run_e2e: "false" },
       },
       verify: { result: verify },
       e2e: { result: "skipped" },
      }),
     },
     exit: () => {
      passed = false;
     },
    },
    console: { error: () => {}, log: () => {} },
   });
   return passed;
  };
  expect(run("false", "skipped")).toBe(true);
  expect(run("true", "skipped")).toBe(false);
  expect(run("false", "failure")).toBe(false);
 });

 it("rejects failed or cancelled checks across all 128 selection/result combinations", () => {
  const results = ["success", "failure", "cancelled", "skipped"];
  for (const changes of results)
   for (const verify of results)
    for (const e2e of results)
     for (const e2eSelected of [false, true]) {
      const needs = {
       changes: {
        result: changes,
        outputs: {
         run_verify: "true",
         run_e2e: String(e2eSelected),
         e2e_grep: e2eSelected ? "." : "",
        },
       },
       verify: { result: verify },
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
        (e2eSelected ? e2e === "success" : ["success", "skipped"].includes(e2e)),
      );
     }
 });
});
