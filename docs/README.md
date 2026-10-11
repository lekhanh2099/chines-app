# HanziHome documentation

Đối chiếu docs ngày 11/10/2026. Tài liệu hiện hành chia theo owner; không dùng old receipt làm implementation specification.

## Current contracts

- [Current system architecture](architecture/current-system.md)
- [Frontend structure và state ownership](architecture/frontend-structure.md)
- [Locale/interface copy](architecture/i18n.md)
- [Unified Reader và grouped Pinyin](refactors/unified-reader-architecture-2026-08-18.md) — living reference, không là execution plan
- [Reader annotation/cache/offline sync](architecture/reader-annotations-offline-and-sync.md)
- [UI component contracts](ui/component-contracts.md), [inventory](ui/component-inventory.md), [theme](ui/theme-contract.md), [verification](ui/ui-verification.md)
- [Supabase runtime source](adr/0001-supabase-runtime-source.md), [content ownership](adr/0002-content-ownership.md), [UI primitive policy](adr/0003-ui-primitive-policy.md), [lesson resource boundaries](adr/0004-lesson-resource-boundaries.md)

## Operations và contribution

- [AI runtime/BYOK](architecture/ai-runtime-byok.md)
- [AI/Daily Reading operations](architecture/ai-runtime-daily-reading-operations.md)
- [Daily Reading source acquisition](architecture/daily-reading-generation-handoff.md)
- [Memory tips](hanzihome-memory-tips.md)
- [Developer API v1](developer-api.md)
- [Contribution/verification workflow](../CONTRIBUTING.md)
- [Risk/confirmation](agent/risk-confirmation.md), [skill authoring](agent/skill-authoring.md), [skill inventory](agent/skill-inventory.md)

## Quality audit: một queue

- [Master plan](refactors/feature-quality-audit-enhancement-2026-10-04.md) — checkpoints, approvals, completed slices và remaining acceptance
- [Feature/code quality report](audits/FEATURE_CODE_QUALITY_REPORT_2026-10-04.md) — results, measurements và limits
- [Frontend flow coverage](testing/frontend-flow-coverage.md) — executable test owners, CI selection và proof boundaries

CI/publication của completed slices đã pass; whole-feature audit vẫn PARTIAL, PDF deferred theo user. Report/coverage không là plan thứ hai. Checkbox cũ không được cộng completion hoặc dùng để chạy lại việc đã có current proof.

## Retired records

Theo yêu cầu user, 19 old plans/PRDs/receipts đã bỏ khỏi current docs: August UI follow-ups, superseded Reader/local-first/Pinyin/Textbook execution journals, hai historical audit/proposal docs, local-JSON PRDs/index và unused instruction-language template.

Các file này đã được đối chiếu references/owners trước retirement. Unique Reader/Pinyin invariants giữ ở reference; approved contracts và genuine remaining acceptance giữ một lần trong master. Unfinished stale proposals bị retire không được đánh dấu completed và không tự thành current scope.

[Immutable Git snapshot trước cleanup](https://github.com/lekhanh2099/chines-app/tree/bcb6b1333abde304e57167962fc18055e1fd83dc/docs) giữ full historical content/receipts để tra cứu hoặc khôi phục. Không tạo archive folder hoặc một queue khác trong checkout. Current source, migrations và `AGENTS.md` vẫn authoritative khi docs/source khác nhau.
