import { spawnSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import * as prettier from "prettier";
import { describe, it } from "vitest";

const targets = [
 "src/components/layout/ProfileSettingsMenu.tsx",
 "src/components/notes/NoteEditorPanel.tsx",
];

async function printPrettierDiff(path) {
 const source = readFileSync(path, "utf8");
 const config = (await prettier.resolveConfig(path)) ?? {};
 const formatted = await prettier.format(source, { ...config, filepath: path });

 if (source === formatted) {
  console.log(`PRETTIER_OK ${path}`);
  return;
 }

 const temporaryPath = join(tmpdir(), `prettier-${basename(path)}`);
 writeFileSync(temporaryPath, formatted);
 const diff = spawnSync("diff", ["-u", path, temporaryPath], { encoding: "utf8" });
 console.log(`PRETTIER_DIFF ${path}\n${diff.stdout}`);
 unlinkSync(temporaryPath);
}

describe("temporary prettier diagnostics", () => {
 it("prints exact formatter drift for the mobile refactor files", async () => {
  for (const target of targets) await printPrettierDiff(target);
 });
});
