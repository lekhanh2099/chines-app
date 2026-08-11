# UI/UX tablet, mobile and reader-font follow-up — 2026-08-11

Branch: `refactor/ui-system-ux-architecture`

This pass follows direct visual feedback and the responsive verification contract. It focuses on reader-font portability and source-proven tablet/mobile layout issues; it does not treat build status as visual proof.

## Reader font portability

### Root cause

The `kaiti` reader option relied on local operating-system font names and then fell back to `LXGW_WenKai_Mono_TC`. That produced two problems:

- local Kaiti availability is platform-dependent, so a phone without that local font does not render the same face as desktop;
- the bundled fallback was a Traditional-Chinese font while the product reader is `zh-CN` / Mainland-oriented.

### Remediation

- Removed `LXGW_WenKai_Mono_TC` from the root font payload and Kaiti stack.
- `kaiti` now prefers local Kaiti faces when available, then falls back to bundled `Noto Serif SC`.
- `system` is again a true system/sans stack rather than an alias of Kaiti.
- Pinyin/FangSong stacks also receive a Simplified-Chinese-capable Noto Serif fallback.
- Updated reader-font tests to lock the cross-platform fallback contract.

### Remaining exact-style limitation

This makes unsupported phones deterministic and regionally correct, but it does not magically ship the exact Kaiti face to every Android/iOS device. Exact cross-platform Kaiti requires a licensed Simplified-Chinese Kaiti/WenKai asset owned by the app and loaded through a local web-font path such as `next/font/local`.

## iPad portrait shell

### Finding

At approximately 820px, the old `md` breakpoint showed the full 256px desktop Sidebar. That left a narrow content viewport even though the UI verification contract explicitly treats iPad portrait as a priority tablet surface.

### Remediation

- Persistent Sidebar now starts at `lg`.
- Below `lg`, the bottom quick navigation remains active.
- Added a `Thêm` destination that opens a bottom Sheet with the complete global sitemap, so switching away from the desktop Sidebar does not make Năng lực, secondary Luyện or personal/developer routes undiscoverable.
- The mobile/tablet quick bar now uses canonical Button semantics for all five destinations.

## Home responsive composition

- Home primary-work + attention-rail composition now begins at `md`, where each column still has an explicit readable minimum.
- iPad portrait therefore uses its width for continuation and learning attention instead of creating a long single-column page.
- Recent notes/activity remain single-column inside the primary rail until very wide screens to preserve reading width.
- Loading skeleton follows the same breakpoints.

## Reading Settings responsive composition

- Controls + live preview now become two columns at `md` instead of waiting for `xl`.
- Preview becomes sticky at the same tablet breakpoint.
- Font-choice tiles use the 44px touch density because they are standalone preferences, not command-bar actions.
- Mobile remains one-column; segmented choices keep horizontal overflow behavior through the canonical `SegmentedControl`.

## Shared mobile header behavior

- `PageHeader` action groups now take the available mobile row and wrap within `max-width: 100%` before returning to auto width at `sm`.
- This prevents multi-action headers such as Library, Dictionary and review pages from becoming an intrinsic-width overflow source on narrow screens.
- The change stays in the shared owner rather than adding route-specific mobile width repairs.

## Source-audit notes

Reviewed current responsive composition for:

- App Shell / Header / Sidebar / bottom navigation;
- Home;
- HanziHome lesson module frame and command-bar navigation;
- HanziHome Library and course grids;
- Reading Settings;
- Notes workspace;
- Dictionary/SRS list and dictionary detail;
- Notebook list/compare surfaces;
- Aggregate library filter composition.

No source-proven change was made merely because a breakpoint looked different from desktop. Changes above are limited to cases where the current breakpoint removed useful space, reduced touch quality, risked horizontal overflow, or made global routes unreachable.

## Skill contract

Updated `.agents/skills/frontend-ui-system/SKILL.md` to v3.3 with explicit rules for:

- iPad portrait as tablet rather than squeezed desktop;
- complete sitemap access below the persistent-Sidebar breakpoint;
- meaningful `md` two-column layouts with minimum-width evidence;
- touch density for standalone settings choices;
- Simplified-Chinese reader-font fallbacks and the requirement to self-host the correct asset when an exact named face is required across platforms.

## Verification status

This pass is source-audited against the repository responsive contract. No authenticated browser session was available in the agent environment, so the exact iOS/Android font rendering and viewport screenshots are not claimed as rendered proof. The next direct visual check should focus on approximately 820×1180 and 390×844 with the user's real authenticated data.
