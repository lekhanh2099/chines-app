---
name: hanzihome-data-import-audit
description: Audit HanziHome JSON, CSV, or normalized seed inputs before Supabase import. Use for source-data readiness, parser/normalizer changes, seed reconciliation, missing pinyin or meaning, duplicate or unstable IDs, orphan references, unmapped fields, and static-to-database comparison work.
---

# HanziHome Data Import Audit

## Overview

Prove that external source artifacts can become normalized Supabase rows without silent loss, fabricated learner content, unstable editable IDs, or runtime fallback coupling.

## Workflow

1. Read root `AGENTS.md` and `scripts/AGENTS.md`.
2. Inventory input files, encoding, size, top-level shapes, source identifiers, and expected record counts. Do not edit source artifacts during audit.
3. Identify the existing parser, normalizer, schema, seed script, and verification script. Extend those boundaries instead of parsing inside UI code.
4. Produce counts for accepted, rejected, duplicate, orphaned, and unmapped records. Report required learner fields separately from optional enrichment.
5. Confirm every editable node has a stable source or database ID. Array indexes may be diagnostic locations only.
6. Compare representative normalized output with its source, including a sparse record and the most complex exercise/reading shape.
7. Run the relevant `data:hanzihome:*` audit command without enabling a write/reset flag.

Read [references/audit-checklist.md](references/audit-checklist.md) for required evidence.

## Rules

- Static artifacts are migration/bootstrap inputs, never app runtime fallbacks.
- Missing pinyin or meaning stays missing and is marked for review; do not invent `-`, generic meaning, or a false clean status.
- Preserve source file, source entity ID, ordering, and parent relationship when available.
- Unknown fields must be mapped, explicitly ignored with a reason, or reported as unmapped.
- Do not seed or run destructive repair unless the user explicitly authorizes the write operation.

## Output

Report inputs inspected, exact commands run, count reconciliation, unmapped fields, ID/reference failures, representative samples checked, and a clear ready/not-ready decision.
