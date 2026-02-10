# Onset Fitness — CLAUDE.md

## App Philosophy: Modern Hypertrophy Science

This app is built around **modern musculation science** (Renaissance Periodization, Schoenfeld, Israetel, etc.). Every screen, feature, and recommendation should guide users — even total beginners — toward science-based training through **visuals and intuitive UX**, not walls of text.

### Core Principles to Embed Everywhere

1. **Volume-Centric Training** — Weekly sets per muscle is THE primary metric. Everything revolves around MV/MEV/MAV/MRV zones. The user should always know where they stand for each muscle.

2. **Progressive Overload** — The app must track and encourage doing *a little more* over time: more weight, more reps, more sets, or harder variations. Show trends, sparklines, PRs. If the user isn't progressing, the app should nudge them.

3. **Proximity to Failure (RIR/RPE)** — Sets only "count" if they're hard enough (~1-3 RIR / RPE 7-9). The app should eventually let users log effort per set and factor it into volume quality.

4. **Frequency** — Hitting each muscle 2+ times/week is generally better than 1x at equal volume. The app should surface this (e.g. "Pecs trained only 1x this week — consider splitting volume across 2 sessions").

5. **Fatigue Management & Deload** — If a muscle stays above MRV or the user's performance drops, suggest a deload week (back to MV). Recovery screen already tracks this — connect it to smart recommendations.

6. **Individualization** — MEV/MAV/MRV are starting points, not gospel. Over time, the app should learn from the user's response (performance trends, recovery) and adjust recommendations.

### UX Philosophy

- **Visuals over text** — Color-coded bars, zones, sparklines, body maps. A beginner should understand their training status at a glance without knowing what "MEV" means.
- **Micro-pedagogy** — Teach concepts in context: tooltips on zone labels, advice cards on detail pages, not a separate tutorial. Drip-feed knowledge.
- **Smart nudges** — Contextual French advice based on zone, trend, and history. Keep it one line, actionable.
- **The user becomes a beast by just following the visuals** — That's the north star.
- **NO PILLS / NO BORDERED CHIPS** — Never use bordered pill/chip components for selectors or filters. They create visual noise and redundancy. Instead, design each selector according to its page context: plain text tabs for small option sets (equipment, duration), grouped tappable rows for lists (muscles), inline steppers for values. Every interaction pattern should feel unique to its context, not a generic pill grid.

## Research & Inspiration

When building new features, **search the web** for:
- Latest sports science on the topic (PubMed, RP articles, Stronger by Science)
- What competitor apps do (RP Hypertrophy, Dr. Muscle, Juggernaut AI, Strong, Hevy)
- Best UX patterns for fitness data visualization

Don't hesitate to look things up — accuracy matters, we're building on real science.

## NO PLACEHOLDERS — PRODUCTION QUALITY ONLY

- **This is NOT a POC / prototype.** Every feature must show real, accurate data from the store.
- **No mock data, no hardcoded numbers, no placeholder text** — if a value is displayed, it must come from real user data (workout history, pedometer, program state, etc.)
- **Data consistency across screens** — The volume shown on the home screen MUST match the volume on the Volume Hebdo page. Recovery score on home MUST match the recovery screen. Stats MUST reflect real history. If two screens show the same metric, they must use the same source function.
- **Data refresh** — UI must update after every workout session ends. All screens that depend on workout history should read from the Zustand store (which auto-updates). Screens opened from navigation should always compute fresh data from `useWorkoutStore().history`.
- **No dead features** — Every button must work, every card must navigate somewhere, every metric must be computed from real data. If a feature isn't ready, don't show it at all rather than showing a placeholder.

## Icons Design System — MANDATORY

- **ALL icons must be custom Lucide React Native icons** — no regular emojis, no emoji Unicode characters, no system emoji anywhere in the app
- Every icon must feel intentionally chosen for the Onset brand: stroke-based, consistent weight (2-2.5 strokeWidth), monochrome or tinted to match context
- Body part icons: `BODY_ICONS` in `ActiveProgramCard.tsx` (Flame=chest, Mountain=back, Zap=legs, Dumbbell=arms, Target=shoulders, Diamond=core)
- Category icons: `constants/icons.ts` for exercise types
- If a new icon is needed, pick from Lucide's library — never fall back to emoji

## Internationalization (i18n) — MANDATORY

**ALL user-visible text MUST go through the translation system.** No exceptions.

- Translation files: `lib/translations/fr.ts` (French, default) and `lib/translations/en.ts` (English)
- Access via: `i18n.t('section.key')` with `import i18n from '@/lib/i18n'`
- **Never hardcode** user-facing strings (labels, units, messages, abbreviations, placeholders)
- This includes: "kg", "min", "reps", "séries", "exos", "RIR", button labels, section headers, error messages, etc.
- Common units live in `common.*` (e.g., `common.sets`, `common.reps`, `common.minAbbr`, `common.kgUnit`)
- **When adding ANY new text**: add the key to BOTH `fr.ts` and `en.ts` simultaneously
- The app will support English, Spanish, German, etc. — every string must be translation-ready
- Console logs and developer-only messages are exempt

## Coding Standards

- **No duplicated code** — Extract shared logic into helpers/hooks. If the same computation exists in two places, unify it.
- **No duplicated screens** — Each route serves one purpose. Avoid copy-pasting screens with slight variations.
- **Single source of truth** — One function computes each metric (volume, recovery, streak, etc.). All screens call that same function.
- **DRY principle** — Constants, color values, magic numbers should live in `constants/` not scattered across files.
- **Clean imports** — Remove unused imports. Keep import blocks organized.
- **TypeScript strict** — Proper types, no `any` unless truly unavoidable. Use the types from `types/` directory.

## Development Approach

- **Budget**: $200 Claude Code subscription — take time to implement carefully and fully
- **No rushing** — each feature should respect the app philosophy, design system, and audit findings
- **Quality over speed** — craft each screen with the same care as existing ones
- **Be creative** — no feature is too hard. Push boundaries on design and intelligence.
- **Unified intelligence** — The RP hypertrophy philosophy must be consistently applied across ALL screens, cards, and features. Volume zones, progressive overload, frequency, recovery — the same science, the same algorithms, everywhere.

## Feature Roadmap (Philosophy-Driven)

### Implemented
- Weekly volume tracking per muscle (MV/MEV/MAV/MRV bars)
- Muscle detail page (`/volume/[muscle]`) — 12-week history, zone advice, exercise breakdown
- Progressive overload tracking (sparklines, PRs, trends)
- Recovery body map with muscle fatigue status
- Post-session feedback (spectrum track UI)
- RIR/RPE logging per set
- Badge unlocking logic (67+ badges)
- Real pedometer (iOS Core Motion)
- Deload detection & warnings
- Smart workout generator

### Next Up
- **Frequency insights** — Show how many times each muscle was hit this week, suggest splits
- **Progressive overload alerts** — "You've done 80kg bench 3 weeks in a row — try 82.5kg or add a rep"
- **Volume auto-adjustment** — After several weeks of data, suggest personalized MEV/MAV/MRV

## Technical Notes

- Default language: **French**
- Stack: Expo 54, React Native, TypeScript, Zustand, Expo Router
- Design: Dark theme (#0C0C0C), glass cards, ambient orbs, Plus Jakarta Sans
- RP volume landmarks in `constants/volumeLandmarks.ts`
- Muscle mapping in `lib/muscleMapping.ts` (exports `TARGET_TO_MUSCLE`, `MUSCLE_LABELS_FR`)
- Volume helpers in `lib/weeklyVolume.ts` and `lib/muscleDetail.ts`
- Progressive overload helpers in `lib/progressiveOverload.ts`
