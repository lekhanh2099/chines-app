// pdf.js loads CMaps (CJK text without embedded fonts), standard fonts, ICC
// profiles and WASM image decoders (JBIG2/JPEG 2000, common in scanned books)
// by URL at runtime. Serve the installed version's files from
// public/vendor/pdfjs/<version>/ (git-ignored); the note PDF loader builds the
// same path from `pdfjs.version`.
import { cp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const packageRoot = join(repoRoot, "node_modules", "pdfjs-dist");
const { version } = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
const vendorRoot = join(repoRoot, "public", "vendor", "pdfjs");
const target = join(vendorRoot, version);

// Drop copies left by earlier pdf.js versions.
for (const entry of await readdir(vendorRoot).catch(() => [])) {
 if (entry !== version) await rm(join(vendorRoot, entry), { recursive: true, force: true });
}

await mkdir(target, { recursive: true });
for (const directory of ["cmaps", "standard_fonts", "iccs", "wasm"]) {
 await cp(join(packageRoot, directory), join(target, directory), { recursive: true });
}
process.stdout.write(`pdf.js ${version} assets ready in public/vendor/pdfjs/${version}\n`);
