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

## Feature Roadmap (Philosophy-Driven)

### Implemented
- Weekly volume tracking per muscle (MV/MEV/MAV/MRV bars)
- Muscle detail page (`/volume/[muscle]`) — 12-week history, zone advice, exercise breakdown
- Progressive overload tracking (sparklines, PRs, trends)
- Recovery body map with muscle fatigue status

### In Progress
- **Post-session feedback UI** — Collect pump/soreness/performance after each session (backend exists, needs UI)
- **RIR/RPE logging per set** — Effort field during session timer, factors into volume quality
- **Badge unlocking logic** — Connect 67+ badges to session events, PRs, streaks
- **Real pedometer (iOS)** — Replace mock steps with HealthKit data

### Next Up
- **Frequency insights** — Show how many times each muscle was hit this week, suggest splits
- **Progressive overload alerts** — "You've done 80kg bench 3 weeks in a row — try 82.5kg or add a rep"
- **Volume auto-adjustment** — After several weeks of data, suggest personalized MEV/MAV/MRV

## Development Approach

- **Budget**: $200 Claude Code — take time to implement carefully and fully
- **No rushing** — each feature should respect the app philosophy, design system, and audit findings
- **Quality over speed** — craft each screen with the same care as existing ones

## Technical Notes

- Default language: **French**
- Stack: Expo 54, React Native, TypeScript, Zustand, Expo Router
- Design: Dark theme (#0C0C0C), glass cards, ambient orbs, Plus Jakarta Sans
- RP volume landmarks in `constants/volumeLandmarks.ts`
- Muscle mapping in `lib/muscleMapping.ts` (exports `TARGET_TO_MUSCLE`, `MUSCLE_LABELS_FR`)
- Volume helpers in `lib/weeklyVolume.ts` and `lib/muscleDetail.ts`
- Progressive overload helpers in `lib/progressiveOverload.ts`
