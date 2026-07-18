# Instruction Language for Agents

Agent instructions work best when they define observable behavior, scope,
evidence and stop conditions.

## 1. Use normative words consistently

- **MUST**: required and verifiable.
- **MUST NOT**: prohibited.
- **SHOULD**: default unless evidence supports deviation.
- **MAY**: optional.
- **STOP AND CONFIRM**: no mutation until a decision is received.
- **REPORT**: disclose evidence; it is not permission.
- **VERIFY**: run or inspect something that can falsify the claim.

Avoid using “prefer” when failure would be unacceptable.

## 2. Replace vague instructions

Bad:

```text
Make the code clean.
Use components properly.
Improve UX.
Follow best practices.
Be careful with risky changes.
```

Good:

```text
Before adding JSX, search `src/components/ui`, `src/components/patterns` and
current feature call sites. Report the chosen primitive or the missing contract.

Feature code MUST NOT import `@base-ui/react` or `radix-ui` directly.

For a toggle Button, expose state with `aria-pressed` or use a dedicated Switch.

Render the changed surface at desktop, iPad portrait and mobile widths. Verify
keyboard open, selection, Escape and focus restoration.

STOP AND CONFIRM before changing a shared component API used outside the target
feature.
```

## 3. Task request template

Use this when asking an agent to implement or review a feature:

```text
Task:
Describe the user-visible behavior.

Scope:
List the route, feature or surface. Do not expand beyond this scope.

Current problem:
Describe the observable failure, not an assumed implementation cause.

Required preflight:
- Read AGENTS.md and the nearest nested AGENTS.md.
- Read the matching skills.
- Inspect existing UI primitives/patterns and direct consumers.
- Trace data and state ownership.
- State root cause or missing contract.
- Classify risk.

Constraints:
List behavior that must remain unchanged.

UI contract:
List relevant loading, empty, error, keyboard, responsive and accessibility
states.

Definition of done:
List executable checks and manual flows.

Confirmation:
Stop only for decisions required by `docs/agent/risk-confirmation.md`.

Output:
Before coding, report:
1. verified current behavior;
2. files and consumers involved;
3. existing component contract;
4. proposed smallest coherent change;
5. risk and confirmation requirement.

After coding, report:
1. files changed;
2. behavior preserved;
3. checks run;
4. UI states verified;
5. residual risks.
```

## 4. Review wording

Ask for evidence, not confidence:

Bad:

```text
Are you sure this is correct?
```

Good:

```text
Show the query key before and after, the consumers affected, the targeted test,
and the browser interaction that verifies the behavior.
```

Bad:

```text
Make it reusable.
```

Good:

```text
Extract only if the same interaction anatomy exists in at least two meaningful
consumers. Otherwise keep it feature-local and document why.
```

Bad:

```text
Use shadcn.
```

Good:

```text
Read `components.json`, run shadcn project info and component docs, inspect the
local source, and use the local API. Do not overwrite a customized primitive
without a diff, consumer inventory and confirmation.
```

## 5. Completion wording

Allowed:

- implemented;
- changed;
- added;
- migrated;
- verified by;
- not verified;
- residual risk.

Restricted unless fully evidenced:

- fixed;
- done;
- final;
- production-ready;
- fully accessible;
- no regressions.
