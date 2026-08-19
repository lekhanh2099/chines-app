# HanziHome Memory Tips

## Purpose

Global lightweight recall tips for grammar/vocab/formula reminders.

## Boundaries

- Do not attach memory tips to catalog.
- Do not fetch lesson detail for global tips.
- Route change should rotate from client cache only.
- Do not refetch tips on manual "Đổi câu".
- System tips are read-only.
- User tips are CRUD via Supabase RLS.

## Data flow

GET /api/hanzihome/memory-tips
→ React Query cache
→ useRouteMemoryTip randomizes from cache
→ GlobalMemoryTipCard renders selected tip

## Known pitfall

Do not pass a newly-created array into useRouteMemoryTip every render.
Memoize filtered tips, otherwise useEffect can loop and UI will jump.
