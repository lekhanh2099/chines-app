import { describe, expect, it } from "vitest";

import { inspectAgentContracts } from "./check-agent-contracts.mjs";

const root = "/virtual/repo";
const skillFile = ".agents/skills/example/SKILL.md";
const skillSource = [
 "---",
 "name: example",
 "description: Example repository skill.",
 "---",
 "",
 "# Example",
 "",
 "Read `docs/agent/skill-authoring.md`.",
 "See [reference](references/reference.md).",
].join("\n");
const packageJson = {
 scripts: {
  check: "npm run agent:check",
  "agent:check": "node scripts/check-agent-contracts.mjs",
 },
};

function inspect(overrides = {}) {
 const files = new Map([
  ["AGENTS.md", "Authority order is:\n\n## Workflow tiers"],
  ["docs/agent/skill-authoring.md", "# Skill authoring"],
  [skillFile, skillSource],
  [".agents/skills/example/references/reference.md", "# Reference"],
  ["scripts/check-agent-contracts.mjs", ""],
 ]);

 const options = {
  root,
  skillFiles: [skillFile],
  packageJson,
  virtualFiles: new Set(files.keys()),
  readFile: (file) => files.get(file.slice(root.length + 1)),
  ...overrides,
 };

 return inspectAgentContracts(options);
}

describe("agent contract drift guard", () => {
 it("accepts a valid skill, reference and package gate", () => {
  expect(inspect()).toEqual([]);
 });

 it("reports missing skill references and package script files", () => {
  expect(
   inspect({
    packageJson: {
     scripts: {
      check: "npm run agent:check",
      "agent:check": "node scripts/missing.mjs",
     },
    },
    skillFiles: [skillFile],
    virtualFiles: new Set([
     "AGENTS.md",
     "docs/agent/skill-authoring.md",
     skillFile,
     "scripts/check-agent-contracts.mjs",
    ]),
   }),
  ).toEqual([
   expect.stringContaining("links a missing local reference"),
   expect.stringContaining("package script references missing file"),
  ]);
 });

 it("reports a skill that exceeds the context budget", () => {
  const longSkill = `${skillSource}${"\nline".repeat(500)}`;
  const failures = inspect({
   readFile: (file) => {
    if (file.endsWith(skillFile)) return longSkill;
    if (file.endsWith("AGENTS.md")) return "Authority order is:\n\n## Workflow tiers";
    if (file.endsWith("skill-authoring.md")) return "# Skill authoring";
    return "# Reference";
   },
  });

  expect(failures).toEqual([expect.stringContaining("exceeds 500 lines")]);
 });
});
