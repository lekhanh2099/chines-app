# Repository Skill Authoring Contract

Repository skills route work; they do not duplicate the complete policy kernel.

## Authority

Use this order:

1. explicit user requirements;
2. nearest applicable `AGENTS.md`, then root `AGENTS.md`;
3. local generated types, schemas, installed docs, contracts and source;
4. repository skills and domain docs;
5. bundled, vendor or generic guidance.

Local repository truth overrides conflicting vendor recommendations.

## Canonical structure

Every repository skill defines:

- exact triggers and exclusions;
- required local context;
- a decision tree for fast, subsystem and full paths;
- domain invariants owned by that skill;
- stop/confirmation conditions;
- targeted and escalated verification;
- evidence required in the handoff.

Skills link to shared policy instead of copying long lists of type, scope, risk,
diff or completion rules.

## Workflow

1. Inspect the owner, direct consumers, authoritative contract and closest
   precedent.
2. Reproduce the regression or state the missing contract.
3. Select the smallest verification tier that can falsify the change.
4. Implement the smallest coherent diff.
5. Audit the complete diff and run targeted proof before escalation.
6. Report precedent, contract, data/state flow, protected invariant, rejected
   broader abstraction and residual risk.

## Learning from code

Code should make ownership and data flow visible through names, types and
invariant-focused tests. Comments are reserved for non-obvious domain,
security, library and compatibility constraints. They do not narrate syntax or
serve as production tutorials.

## Maintenance

Review a skill when its dependency family, local contract, referenced command,
inventory status or architecture owner changes. Broken references, stale
commands and conflicts with local source are release-blocking skill defects.
