# HanziHome documentation

Đối chiếu ngày 11/10/2026. Chỉ giữ docs cho flow hiện hành; đọc đúng owner của phần đang sửa.

## Flow chính

- **Course → lesson → học/chỉnh content:** [current architecture](architecture/current-system.md), [Reader/Pinyin](refactors/unified-reader-architecture-2026-08-18.md), [content ownership](adr/0002-content-ownership.md), [lesson resources](adr/0004-lesson-resource-boundaries.md). Contract Memory Tips nằm trong current architecture.
- **Reader → notes → offline/sync:** [annotation/cache/offline contract](architecture/reader-annotations-offline-and-sync.md).
- **AI/BYOK và Daily Reading:** [runtime/task routing](architecture/ai-runtime-byok.md), [operations](architecture/ai-runtime-daily-reading-operations.md), [source acquisition](architecture/daily-reading-generation-handoff.md).
- **UI và locale:** [component contracts](ui/component-contracts.md), [component inventory](ui/component-inventory.md), [theme](ui/theme-contract.md), [rendered verification](ui/ui-verification.md), [locale/interface copy](architecture/i18n.md), [primitive policy](adr/0003-ui-primitive-policy.md).
- **API integration:** [Developer API v1](developer-api.md), tài liệu app đang dẫn người dùng tới.

## Development và verification

- [Frontend structure/state ownership](architecture/frontend-structure.md), [Supabase runtime source](adr/0001-supabase-runtime-source.md).
- [Contribution/commands](../CONTRIBUTING.md), [risk/confirmation](agent/risk-confirmation.md).
- [AGENTS.md](../AGENTS.md) là owner routing của năm core skills: architecture/state, UI, content editing, test review và Supabase. Hướng dẫn bảo trì skills cũng nằm tại đó; không giữ inventory/scorecard riêng.
- [Frontend flow coverage](testing/frontend-flow-coverage.md) giữ checklist test canonical, test owners, affected CI selection và proof boundaries. Skill Test Review dẫn tới đây, không giữ matrix riêng.
- `.agents/skills` giữ trigger và quy trình truy vết cho agent; docs và nearest `AGENTS.md` giữ contracts/checklists. Migration review dùng [Supabase instructions](../supabase/AGENTS.md), content editing dùng [HanziHome contract](../src/features/hanzihome/AGENTS.md).
- [Master plan](refactors/feature-quality-audit-enhancement-2026-10-04.md) giữ duy nhất acceptance còn mở, completed slices và approvals. Whole-feature audit vẫn PARTIAL, PDF deferred; không chạy lại fix đã có proof chỉ vì checklist cũ chưa đóng parent.

## Lịch sử và khôi phục

Report lịch sử, old plans/PRDs/receipts và các skill phụ không nằm trong bộ docs hiện hành. Bỏ tài liệu không có nghĩa feature đã hoàn tất; source, migrations và các quyết định chưa đóng trong master vẫn giữ nguyên.

[Snapshot trước lượt dọn skills/docs này](https://github.com/lekhanh2099/chines-app/tree/ab61e2631a689019ab49318d103e4fb10037de74) giữ report và ba vendor/secondary skills; [snapshot trước cleanup đầu](https://github.com/lekhanh2099/chines-app/tree/bcb6b1333abde304e57167962fc18055e1fd83dc/docs) giữ các plan cũ. Khôi phục từ Git khi cần, không tạo archive folder hoặc một queue khác trong checkout. Current source, migrations và `AGENTS.md` authoritative khi docs/source khác nhau.
