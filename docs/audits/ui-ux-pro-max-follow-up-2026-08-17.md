# UI/UX audit follow-up — 2026-08-17

Repository: `lekhanh2099/chines-app`

Branch: `audit/ui-ux-pro-max-full-2026-08-16`

This follow-up continues the 2026-08-16 full audit after the user requested the remaining UI work to be finished while explicitly excluding Playwright and GitHub Actions from the completion criteria for this pass.

## Scope completed

### Global Sidebar

Commit: `409c9e0a5cf1535b3e6edbcbede70f93dbf13dd2`

- Replaced repeated destination icons with route-specific semantic icons across Học, Luyện, Năng lực and Cá nhân.
- Kept the existing four-group information architecture and route ownership.
- Removed the large boxed collapse control from the brand header.
- Added a single left/right chevron control on the Sidebar boundary.
- The edge control remains a 44px Button target while its visible affordance is only the chevron.
- Added `aria-expanded`, `aria-controls`, an accessible action label and title.
- Preserved direct route access and accessible names in the collapsed rail.
- Preserved the brand mark in collapsed mode instead of leaving an empty header.
- Kept the navigation scroll owner inside the clipped Sidebar content while allowing only the edge control to cross the Sidebar boundary.

### Reader landing information architecture

Commit: `c0c20f575bf6d66970b18120a5f914af546f54b3`

The P3 Reader landing finding from `ui-ux-pro-max-full-audit-final-2026-08-16.md` is now source-remediated.

Before, `/reader` primarily acted as a dashboard/card launcher containing large destination cards, decorative Hanzi glyphs and utility shortcuts that duplicated global navigation.

After:

- `/reader` leads with study continuation when available.
- The main default action is the core U3–U5 reading course.
- Other reading sources are presented as compact semantic navigation rows inside one secondary surface.
- Inspector and TTS utility launchers were removed from the Reader landing because global navigation already owns those destinations.
- Decorative oversized background Hanzi and the three-column launcher-card grid were removed from the landing.
- The finite Reader collection switcher now wraps instead of depending on horizontal discovery.
- The document grid delays the third column until `xl`, avoiding a three-column layout at the same breakpoint where the persistent desktop Sidebar first appears.
- `ReaderResumePanel` no longer derives the initial rendered due-state from `Date.now()` during hydration; current time is captured after mount and the initial server/client render stays deterministic.

## Remaining classifications

No additional source-level P1/P2 UI implementation finding from the 2026-08-16 audit is intentionally left open by this follow-up.

The following remain outside this source-only follow-up rather than being hidden as completed:

- authenticated rendered-coverage gap;
- public/auth interaction contract decision for protected APIs exposed from signed-out surfaces;
- noisy runtime long-task samples that require repeatable profiling before changing product code;
- Playwright/GitHub Actions verification for the new follow-up commits, explicitly excluded from this pass by user request.

No merge to `main` and no production deployment are part of this follow-up.
