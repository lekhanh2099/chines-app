import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type ScriptResult = {
 stdout: string;
 stderr: string;
};

async function runDataScript(scriptPath: string): Promise<ScriptResult> {
 const result = await execFileAsync(
  process.execPath,
  ["--experimental-strip-types", scriptPath],
  {
   cwd: process.cwd(),
   maxBuffer: 1024 * 1024 * 8,
  },
 );

 return {
  stdout: result.stdout,
  stderr: result.stderr,
 };
}

export function rebuildHanziHomeDbAfterEdit() {
 return runDataScript("scripts/rebuild-hanzihome-db.ts");
}

export async function auditHanziHomeDbAfterEdit() {
 const structure = await runDataScript("scripts/audit-hanzihome-db.ts");
 const runtime = await runDataScript("scripts/audit-hanzihome-db-runtime.ts");

 return { structure, runtime };
}
