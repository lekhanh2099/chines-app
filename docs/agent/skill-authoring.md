# Repository Skill Authoring Contract

Repository skills route work; they do not duplicate the complete policy kernel.

Read this document only when creating, editing or auditing skills/instructions.
Application skills must not require it as runtime preflight.

## Authority

Follow the authority order in [`AGENTS.md`](../../AGENTS.md). That file owns
generic verification tiers, confirmation routing and completion requirements.

Canonical domain owners:

- generic state/directory architecture: `docs/architecture/frontend-structure.md`;
- UI semantics and interaction: `docs/ui/component-contracts.md`;
- UI implementation status: `docs/ui/component-inventory.md`;
- theme: `docs/ui/theme-contract.md`;
- rendered evidence: `docs/ui/ui-verification.md`;
- interface copy/navigation: `docs/architecture/i18n.md`;
- HanziHome invariants: `src/features/hanzihome/AGENTS.md`;
- database invariants: `supabase/AGENTS.md`;
- risk/confirmation details: `docs/agent/risk-confirmation.md`.

## Canonical structure

Place repository skills at `.agents/skills/<skill-name>/SKILL.md`. Optional
Codex UI metadata belongs at `.agents/skills/<skill-name>/agents/openai.yaml`.
Use `policy.allow_implicit_invocation: false` when a skill must only run after
explicit invocation.

Each skill contains only the guidance needed for its actual capability:

- exact triggers and exclusions;
- which existing contract sections to read for each concern;
- non-obvious domain procedure, inputs and evidence;
- domain-specific stop conditions and verification where the shared policy
  does not already cover them.

Do not require every skill to repeat a tier matrix, state ownership table,
type rules, preflight report or handoff template. Link to the owner instead.
Retain a short reminder when it prevents a concrete misuse, without redefining
the underlying policy. Keep detailed migration procedures where order matters.

Skills are not a default dependency chain. Root routing selects relevant skills
directly. Use existing canonical docs instead of creating skill-local copies;
references and vendor material are read only for the requested concern.

## Workflow

Before changing routing, inspect root/nested instructions, skill descriptions,
invocation metadata and references. Keep existing names/paths unless a rename
has a concrete benefit and every caller is migrated.

Before deleting repeated text, map each invariant to its canonical owner. Move
unique domain knowledge there first. Update the root routing and inventory in
the same change so they do not continue to request a retired workflow.

Verify references and test representative task routing, including tasks that
must not activate the skill. For behavioral comparisons, use the same tasks,
model and environment before/after and record actual outcomes, loaded context,
scope changes, unnecessary pauses and checks selected. A manual routing review
or byte count is not a model-performance benchmark.

## Learning from code

Code should make ownership and data flow visible through names, types and
invariant-focused tests. Comments are reserved for non-obvious domain,
security, library and compatibility constraints. They do not narrate syntax or
serve as production tutorials.

## Maintenance

Review a skill when its dependency family, local contract, referenced command,
inventory status or architecture owner changes. Broken references, stale
commands and conflicts with local source are release-blocking skill defects.

## Review scorecard

Review a skill on a 100-point scale:

- authority and precedence: 10;
- scope and minimal diff: 10;
- authoritative types and runtime boundaries: 15;
- executable anti-bypass enforcement: 15;
- state/data ownership: 10;
- regression proof: 10;
- UI/accessibility evidence: 8;
- migration/security safety: 8;
- workflow efficiency: 6;
- learning-from-code: 5;
- drift/update discipline: 3.

The score is a review aid, not permission to weaken a hard gate. A skill with a
broken reference, stale command or local-contract conflict cannot be considered
ready regardless of its numeric score.
