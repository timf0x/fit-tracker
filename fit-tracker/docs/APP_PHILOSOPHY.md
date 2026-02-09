# Onset Fitness — Science & Philosophy

> **The app IS the philosophy. Every screen, every number, every nudge is a direct translation of evidence-based hypertrophy science into visual, intuitive UX. The user doesn't need to read a single paper — they just follow the interface and become a beast.**

---

## Table of Contents

1. [The Six Pillars](#the-six-pillars)
2. [Pillar 1: Volume-Centric Training](#pillar-1-volume-centric-training)
3. [Pillar 2: Progressive Overload](#pillar-2-progressive-overload)
4. [Pillar 3: Proximity to Failure (RIR/RPE)](#pillar-3-proximity-to-failure-rirrpe)
5. [Pillar 4: Training Frequency](#pillar-4-training-frequency)
6. [Pillar 5: Fatigue Management & Deload](#pillar-5-fatigue-management--deload)
7. [Pillar 6: Individualization](#pillar-6-individualization)
8. [The Theoretical Engine: Fitness-Fatigue Model](#the-theoretical-engine-fitness-fatigue-model)
9. [How It All Connects in the App](#how-it-all-connects-in-the-app)
10. [Scientific References](#scientific-references)

---

## The Six Pillars

Onset Fitness is built on six interconnected principles drawn from Renaissance Periodization (Dr. Mike Israetel), Brad Schoenfeld's meta-analyses, and the broader sports science literature. These aren't optional features — they are the architecture itself.

| Pillar | Core Idea | Primary Metric |
|--------|-----------|----------------|
| Volume | Weekly sets per muscle drive growth | Sets/muscle/week vs. MV/MEV/MAV/MRV |
| Progressive Overload | Do a little more over time | Weight, reps, or sets trending up |
| Proximity to Failure | Sets only count if hard enough | RIR 1-3 (RPE 7-9) |
| Frequency | Hit each muscle 2+x/week | Sessions per muscle per week |
| Fatigue Management | Know when to pull back | Weeks above MRV, performance trends |
| Individualization | Landmarks are starting points | Personalized zones from user data |

---

## Pillar 1: Volume-Centric Training

### The Science

**Weekly training volume (counted in hard sets per muscle group) is the single strongest predictor of muscle hypertrophy.** This is supported by multiple meta-analyses:

**Schoenfeld, Ogborn & Krieger (2017)** — *"Dose-response relationship between weekly resistance training volume and increases in muscle mass"* (Journal of Sports Sciences, 15 studies, 34 treatment groups):
- Graded dose-response relationship confirmed (P = 0.002)
- Each additional weekly set associated with ~0.37% greater muscle gain
- 10+ sets/week produced significantly more growth than <5 sets/week

**Schoenfeld et al. (2019)** — *"Resistance Training Volume Enhances Muscle Hypertrophy but Not Strength in Trained Men"* (Medicine & Science in Sports & Exercise):
- Even extreme volumes (30-45 sets/muscle/week) continued producing more hypertrophy
- Mid-thigh: 3.4% growth (low volume) vs. 12.5% (high volume)
- Strength gains did NOT scale with volume beyond a minimal threshold

**Pelland et al. (2024/2025)** — *"The Resistance Training Dose Response"* (Sports Medicine, 67 studies, 2,058 participants):
- 100% posterior probability that hypertrophy increases with volume
- Diminishing returns follow a square root function
- Each additional set at ~12 sets/week adds ~0.24% hypertrophy

### The RP Volume Landmarks Framework

Dr. Mike Israetel formalized the relationship between volume and adaptation into four landmarks:

| Landmark | Definition | What Happens |
|----------|-----------|--------------|
| **MV** (Maintenance Volume) | Minimum sets to preserve muscle mass | Below this = muscle loss over time |
| **MEV** (Minimum Effective Volume) | Lowest volume that produces growth | The growth threshold |
| **MAV** (Maximum Adaptive Volume) | Optimal growth zone (best stimulus-to-fatigue ratio) | Where most training should live |
| **MRV** (Maximum Recoverable Volume) | Upper ceiling before recovery fails | Exceeding this = accumulated fatigue, regression |

**Representative values (sets/muscle/week):**

| Muscle Group | MV | MEV | MAV | MRV |
|---|---|---|---|---|
| Chest | 4 | 6 | 12-20 | 22+ |
| Back | 8 | 10 | 14-22 | 25+ |
| Quads | 6 | 8 | 12-18 | 20+ |
| Hamstrings | 4 | 6 | 10-16 | 20+ |
| Shoulders (side/rear) | 0 | 8 | 16-22 | 26+ |
| Biceps | 5 | 8 | 14-20 | 26+ |
| Triceps | 4 | 6 | 10-14 | 18+ |
| Calves | 6 | 8 | 12-16 | 20+ |
| Abs | 0 | 0 | 16-20 | 25+ |
| Glutes | 0 | 0 | 4-12 | 16+ |

### How It's Built Into Onset

**Volume is the backbone of the entire app.** It's not a feature — it's the lens through which everything is presented.

- **Volume Hebdo screen** (`/volume`) — Shows all 14 muscle groups with color-coded zone bars. At a glance, the user sees: green (MAV zone, optimal), blue (MEV, growing but could do more), amber (approaching MRV), red (above MRV, danger). No text explanation needed — the colors teach.

- **Muscle Detail** (`/volume/[muscle]`) — 12-week volume chart per muscle, exercise breakdown showing which exercises contributed sets, zone advice in French ("Tu es dans la zone optimale" / "Volume insuffisant — ajoute 2-3 series").

- **Smart Suggestion Card** — The "What to train today" hero card on the Workouts tab recommends which muscles to train based on recovery status (hours since last training per muscle). The algorithm (`lib/smartWorkout.ts` + `lib/recoveryHelpers.ts`) classifies each muscle as fresh, fatigued, or undertrained using per-muscle recovery thresholds, then annotates the recommendation with volume zone data (current sets vs. MV/MEV/MAV/MRV).

- **Session Insights** — Before starting any session, a collapsible panel shows the projected volume impact: "This session will push chest from 14 to 18 sets (MAV zone)." Each muscle shows its current zone, the projected zone after the session, and a visual bar.

- **Program Generator** — The mesocycle engine (`lib/programGenerator.ts`) distributes volume across weeks following RP's accumulation model, adjusted by experience level: beginners ramp from MEV to low MAV, intermediates from mid-MEV/MAV to mid-MAV, advanced from MAV low to MAV high. Priority muscles get +2 bonus sets (capped at MRV). Volume increases linearly across training weeks, then the final week deloads to MV.

**Implementation:** `constants/volumeLandmarks.ts` stores the RP landmarks. `lib/weeklyVolume.ts` computes `getSetsForWeek()` by scanning completed sessions. `lib/muscleMapping.ts` maps exercise targets to the 14 canonical muscle groups.

---

## Pillar 2: Progressive Overload

### The Science

**Progressive overload — systematically increasing training demands over time — is the fundamental driver of continued adaptation.** Without it, the body has no reason to grow.

**Plotkin et al. (2022)** — *"Progressive overload without progressing load?"* (PeerJ, 43 trained participants, 8-week RCT):
- Both adding weight (LOAD group) and adding reps (REPS group) produced **equivalent hypertrophy and strength gains**
- Practical takeaway: Progressive overload does NOT require adding weight every session. Adding reps at the same weight is equally valid.

**Chaves, Libardi et al. (2024)** — *"Overload Progression Protocols"* (International Journal of Sports Medicine, 39 untrained adults):
- Load progression and repetition progression produced **identical increases** in both 1RM and muscle cross-sectional area
- Confirms: the TYPE of overload matters less than the fact that SOME form of progressive challenge is applied

**Schoenfeld et al. (2017, 2019)** — Volume itself is a form of progressive overload. Adding sets across a mesocycle (MEV → MRV) is volume-based progressive overload.

### The Three Overload Vectors

| Vector | How It Works | When to Use |
|--------|-------------|-------------|
| **Weight** | Add 2.5kg (barbell) or 2kg (dumbbell) | When target reps are consistently hit |
| **Reps** | Add 1-2 reps at the same weight | When weight jump is too large |
| **Sets** | Add 1 set per muscle per week | Across mesocycle weeks (volume overload) |

### How It's Built Into Onset

**Progressive overload is not a feature the user activates — it happens automatically at every entry point.**

- **Dynamic Weight Recalculation** — Every time the user opens a workout (custom or program day), the app analyzes their last session for each exercise using `getProgressiveWeight()` in `lib/weightEstimation.ts`:
  - **80%+ of target reps completed** → BUMP: increase weight (+2.5kg barbell/cable/machine, +2kg dumbbell/kettlebell)
  - **40-80% completed** → HOLD: same weight, focus on adding reps
  - **<40% completed** → DROP: reduce weight, consolidate form
  - Generated workouts use a complementary system: `overloadTips` from `sessionInsights` detect stale weights (same weight across 2+ sessions) and suggest bumps.

- **Visual Overload Badges** — On exercise rows in custom workout detail and program day screens:
  - Green ↑ badge = "Charge augmentee" (weight bumped up)
  - Amber ↓ badge = "Charge reduite" (weight dropped)
  - Generated workout review shows text-based overload tips instead (stale-weight detection)

- **Inline Overload Context** — When editing an exercise in the program day editor, contextual French messages appear:
  - Bump: "Progression : charge augmentee a 62.5kg" (green)
  - Drop: "Charge reduite — consolide avant de progresser" (amber)
  - Hold: "Meme charge — continue de progresser en reps" (orange)
  - Custom workout editor shows bump and drop context (no hold message)

- **Session Timer Integration** — During the actual workout, below the current exercise info:
  - "↑ Charge augmentee" (green) — reminds the user they're lifting more today
  - "↓ Charge reduite" (amber) — reassures them the drop is intentional

- **Cold Start Estimation** — For exercises with no history, `getEstimatedWeight()` estimates a starting weight from the user's body weight, sex, experience level, and equipment type. This ensures even new exercises start at a reasonable load.

**Implementation:** `lib/weightEstimation.ts` contains `getProgressiveWeight()` (history analysis) and `getEstimatedWeight()` (BW-ratio estimation). The overload action (`'bump' | 'hold' | 'drop' | 'none'`) flows through: `workout/[id].tsx` (custom) → `workout/session.tsx` (timer), and `program/day.tsx` (program) → `lib/programSession.ts` → `workout/session.tsx`. Generated workouts (`workout/generate.tsx`) use a separate stale-weight detection system via `sessionInsights`. `lib/programSession.ts` bridges program data to session params via `buildProgramExercisesParam(day, weightOverrides?)`.

---

## Pillar 3: Proximity to Failure (RIR/RPE)

### The Science

**Not all sets are created equal.** A set stopped 6 reps short of failure provides drastically less hypertrophic stimulus than one taken to 1-2 reps from failure.

**Robinson, Zourdos et al. (2024)** — *"Proximity-to-Failure Dose-Response Meta-Regressions"* (Sports Medicine, 214 studies):
- Muscle size gains **increased as sets were terminated closer to failure** (dose-dependent relationship)
- Strength gains showed negligible relationship with proximity to failure
- Critical finding: hypertrophy and strength respond differently to effort

**Refalo, Helms et al. (2023)** — *"Proximity-to-Failure and Hypertrophy"* (Sports Medicine, 15 studies):
- **No evidence that absolute failure is superior** to stopping 1-2 reps short
- Non-linear relationship: the biggest drop-off occurs when stopping very far from failure (5+ RIR)
- The difference between 0 RIR (failure) and 2 RIR is much smaller than between 2 RIR and 6 RIR

**Refalo et al. (2024)** — *"Failure vs. RIR in Trained Individuals"* (Journal of Sports Sciences):
- Quadriceps growth was **identical** between failure training and 1-2 RIR training
- Confirms: you don't need to hit failure, but you need to get close

**The RIR-Based RPE Scale** (validated by Zourdos et al., 2016; formalized by Helms et al., 2016):

| RPE | RIR | Effort Level |
|-----|-----|-------------|
| 10 | 0 | Absolute failure |
| 9 | 1 | Could do 1 more |
| 8 | 2 | Could do 2 more |
| 7 | 3 | Could do 3 more — minimum for hypertrophy |
| 5-6 | 4-6 | Moderate — "junk volume" territory |

**The hypertrophy sweet spot is RPE 7-9 (1-3 RIR).** Sets below RPE 7 provide minimal growth stimulus. Sets at RPE 10 (failure) every session accumulate excessive fatigue.

### How It's Built Into Onset

- **Week-Level RIR Targets** — The program generator assigns RIR targets per week via linear interpolation from RIR 4 down to RIR 0 across training weeks (`lib/exerciseClassification.ts: getTargetRir()`). The exact values depend on mesocycle length: a 5-week intermediate meso progresses RIR 4→3→1→0→4(deload). This is displayed as a blue badge on the program day screen ("RIR 2") next to the compound/isolation section headers.

- **RIR Progression Across Mesocycle** — Following RP's recommendation: start further from failure (less fatigue per set, allowing volume to accumulate), end close to failure (maximum stimulus before deload). Deload weeks reset to RIR 4.

- **Visual Effort Cues** — The RIR badge appears consistently on every program day. Early weeks show higher RIR (less intense), later weeks show lower RIR (more intense). The blue pill styling (`rgba(59,130,246,0.1)`) keeps it subtle but always visible.

- **Future: Per-Set RIR Logging** — Planned feature: during session, a simple slider or picker to log actual RIR per set. This will enable:
  - Volume quality scoring (sets at RPE 7-9 = "effective sets")
  - Fatigue detection (RPE creeping up at same weight = recovery issue)
  - Personalized MRV estimation (performance drops = approaching individual MRV)

---

## Pillar 4: Training Frequency

### The Science

**Schoenfeld, Ogborn & Krieger (2016)** — *"Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy"* (Sports Medicine):
- Training a muscle **2x/week produced superior hypertrophy** compared to 1x/week (effect size: 0.49 vs. 0.30, P = 0.002)
- Conclusion: "Major muscle groups should be trained at least twice a week to maximize muscle growth"

**Schoenfeld, Grgic & Krieger (2019)** — *"How many times per week should a muscle be trained?"* (Journal of Sports Sciences, 25 studies):
- When **volume is equated**, 2x and 3x per week produce **identical hypertrophy**
- Higher frequency is beneficial mainly because it allows **better volume distribution** across sessions (less fatigue per session, higher set quality)
- Practical conclusion: frequency is a vehicle for distributing volume effectively, not a magic variable

**Pelland et al. (2024/2025)** — Meta-regression:
- Frequency had **negligible impact on hypertrophy** when volume was equated
- Frequency improved strength (but with steep diminishing returns)

### The Key Insight

**Frequency doesn't directly grow muscle — volume does.** But higher frequency ENABLES more volume by distributing the workload. Training chest with 20 sets in one session creates far more fatigue than 10 sets across two sessions, even though total volume is identical. The second scenario allows better set quality (closer to failure without excessive fatigue).

### How It's Built Into Onset

- **Program Structure** — The program generator creates splits that hit each muscle 2-3x/week (Push/Pull/Legs, Upper/Lower, or Full Body depending on available days). This is baked into the split templates in `constants/programTemplates.ts`.

- **Smart Suggestion Algorithm** — When recommending "What to train today," the algorithm classifies each muscle as fresh, fatigued, or undertrained based on per-muscle recovery thresholds (hours since last training vs. muscle-specific recovery windows in `constants/recovery.ts`). Fresh and undertrained muscles get priority.

- **Muscle Target Pills** — On every program day, horizontal scrollable pills show which muscles this session targets. Each pill links to the volume detail page for that muscle, creating a natural feedback loop.

- **Future: Frequency Insights** — Planned feature: a weekly frequency breakdown showing "Chest: 2x this week, Biceps: 3x, Calves: 0x — consider adding calf work."

---

## Pillar 5: Fatigue Management & Deload

### The Science

**Bell et al. (2023)** — *"Integrating Deloading into Strength and Physique Sports Training Programmes"* (Sports Medicine - Open, 26-expert Delphi consensus):
- Deloading defined as "a period of reduced training stress designed to mitigate fatigue, promote recovery, and enhance preparedness"
- Consensus: decrease volume (sets per session, reps per set, training days)
- Can be pre-planned, autoregulatory, or both

**Bell et al. (2024)** — *"Deloading Practices Survey"* (Sports Medicine - Open):
- Athletes deload every **5.6 +/- 2.3 weeks**, duration **6.4 +/- 1.7 days**
- 78.9% decrease weekly sets; 83.7% decrease load; 84.9% decrease proximity to failure
- Primary triggers: decrease fatigue (92.3%), scheduled (65.4%), feeling beat up (62.6%), performance stalls (54.1%)

**Sillvan et al. (2024)** — *"Effects of a one-week deload period"* (PeerJ):
- Complete training cessation during deload **hurt strength gains** and increased soreness upon return
- Active deloads (reduced volume, maintained frequency) are superior to complete rest

### The RP Mesocycle Model

The standard RP approach structures training in 4-6 week mesocycles:

| Week | Volume | RIR | Phase |
|------|--------|-----|-------|
| 1 | MEV (~10 sets) | 4 | Accumulation |
| 2 | Low MAV (~13 sets) | 3 | Accumulation |
| 3 | Mid MAV (~16 sets) | 1 | Accumulation |
| 4 | High MAV (~19 sets) | 0 | Accumulation |
| 5 | MV (~6 sets) | 4 | Deload |

*Note: Onset uses linear RIR interpolation that varies by mesocycle length. Beginners (4-week meso) progress faster (RIR 4→2→0); advanced (6-week) progress more gradually.*

This wave-loading pattern is the practical application of the Banister Fitness-Fatigue model (see below).

### How It's Built Into Onset

- **Deload Detection Engine** (`lib/deloadDetection.ts`) — Analyzes the last 4 weeks of training volume per muscle group against RP MRV landmarks:
  - **3 consecutive weeks above MRV** → Warning (amber): "Pecs au-dessus du MRV depuis 3 semaines. Pense a un deload."
  - **4+ consecutive weeks above MRV** → Urgent (red): "Fatigue accumulee sur Pecs. Deload recommande cette semaine."

- **Deload Banners** — Warning/urgent banners appear in two places:
  - **Home screen** (ActiveProgramCard) — The user sees the alert before even opening their program
  - **Program day screen** — Before the exercise list, a contextual banner warns about accumulated fatigue

- **Program Deload Weeks** — The program generator includes built-in deload weeks with reduced volume (MV level) and a blue informational note: "Semaine de deload : volume reduit pour favoriser la recuperation et la supercompensation."

- **Quick MRV Check** — `getMusclesAboveMrv()` provides a lightweight single-week scan used for real-time display, without the heavier 4-week consecutive analysis.

---

## Pillar 6: Individualization

### The Science

Israetel emphasizes that MV/MEV/MAV/MRV values are **population averages and starting points**. Individual MRV can vary dramatically based on:

- **Training experience** — Advanced lifters tolerate and need more volume (higher MEV, higher MRV)
- **Sleep quality and duration** — Poor sleep can reduce MRV by 20-30%
- **Nutritional status** — Caloric surplus supports higher MRV; deficit reduces it significantly
- **Life stress** — Work, relationships, financial stress all reduce recovery capacity
- **Genetics** — Muscle fiber composition, hormonal profile, recovery capacity
- **Training phase** — Cutting vs. bulking dramatically shifts all landmarks

The recommendation: **reassess personal landmarks every 3-6 months** by tracking performance and recovery markers.

### How It's Built Into Onset

- **Body Weight-Based Starting Weights** — `getEstimatedWeight()` uses the user's sex, body weight, and experience level to estimate reasonable starting loads for every exercise. No more guessing "how much should I bench?"

- **History-Driven Progression** — `getProgressiveWeight()` doesn't use fixed percentages. It analyzes the user's **actual performance** from their last session. If they hit 80%+ of target reps, they're ready to bump. If they struggled (<40%), the weight drops. The app learns from the individual, not from a formula.

- **User Profile** — Sex, body weight, experience level, and available equipment are captured during onboarding and used throughout: weight estimation, exercise selection (no barbell exercises if user only has dumbbells), and volume recommendations.

- **Readiness Check** — Before every session, an optional readiness assessment captures sleep quality, energy level, and soreness (1-5 scale each). This data is stored per session (`workoutStore.saveSessionReadiness()`) and per program state (`programStore.saveReadiness()`) for future use in adjusting recommendations.

- **Feedback-Driven Volume Adaptation** — After each session, the user rates pump (1-3), soreness (1-3), performance (1-3), and flags joint pain. `lib/feedbackAdaptation.ts` aggregates weekly feedback and computes automatic volume adjustments: high soreness + declining performance → -1 to -2 sets/muscle; low pump + good performance → +1 set/muscle. These adjustments are applied to the next mesocycle week via `programStore.applyFeedbackToNextWeek()`. This is RP's individualization principle in action — the app learns from the user's actual response.

- **Future: Adaptive Volume Zones** — After accumulating several mesocycles of data, the app will suggest personalized MEV/MAV/MRV per muscle based on the user's actual response patterns (performance trends + recovery signals).

---

## The Theoretical Engine: Fitness-Fatigue Model

### The Banister Two-Factor Model (1975)

Everything above connects through a single theoretical framework proposed by **Eric Banister** and refined over decades.

**The core insight:** Every training session simultaneously produces two effects:
1. **Fitness** — The positive adaptation (muscle growth, strength gain, neural efficiency)
2. **Fatigue** — The negative cost (muscle damage, CNS fatigue, joint stress, systemic stress)

**The critical asymmetry:**
- Fatigue magnitude per session is **larger** than fitness magnitude (kf > ka)
- But fitness **persists much longer** than fatigue (tau_a >> tau_f)
- Fitness half-life: ~45-50 days
- Fatigue half-life: ~11 days

**What this means in practice:**

```
Preparedness = Fitness - Fatigue
```

During a hard training block (mesocycle weeks 1-4):
- Both fitness and fatigue rise
- Fatigue rises FASTER → preparedness drops → you feel weaker even though you're getting stronger underneath

During a deload (week 5):
- No new fatigue added
- Fatigue decays rapidly (half-life 11 days) → drops ~50% in one week
- Fitness barely decays (half-life 45 days) → almost unchanged
- **Result: preparedness surges** → you feel strong, recovered, and ready

**This is why deloads work.** Not because muscles "heal" — because rapid fatigue dissipation unmasks weeks of accumulated fitness adaptations.

### How the Model Maps to Onset

| Banister Concept | Onset Implementation |
|---|---|
| Fitness accumulation | Volume tracking (sets/muscle/week in MAV zone) |
| Fatigue accumulation | Weeks above MRV counter, deload detection |
| Preparedness = Fitness - Fatigue | Recovery screen score, readiness check |
| Taper/Deload | Programmed deload weeks, deload warning banners |
| Individual decay rates | Future: personalized MRV from performance trends |

---

## How It All Connects in the App

The six pillars don't exist in isolation — they form a feedback loop that the user experiences naturally:

```
                    ┌──────────────────────┐
                    │   USER OPENS APP     │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │    HOME SCREEN        │
                    │  - Active program     │
                    │  - Deload warnings    │◄──── Pillar 5: Fatigue Management
                    │  - Recovery score     │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                 │
    ┌─────────▼──────┐  ┌─────▼──────┐  ┌──────▼─────────┐
    │ PROGRAM DAY    │  │ CUSTOM     │  │ SMART GENERATE │
    │ Progressive ↑↓ │  │ WORKOUT    │  │ Volume gaps    │◄── Pillar 1: Volume
    │ RIR targets    │  │ Progressive│  │ Recovery-based │◄── Pillar 4: Frequency
    │ Deload banner  │  │ ↑↓ badges  │  │ Muscle priority│
    └───────┬────────┘  └─────┬──────┘  └───────┬────────┘
            │                 │                  │
            └────────────┬────┘──────────────────┘
                         │
              ┌──────────▼───────────┐
              │   SESSION TIMER      │
              │  - Overload tips     │◄──── Pillar 2: Progressive Overload
              │  - RIR guidance      │◄──── Pillar 3: Proximity to Failure
              │  - Set logging       │
              └──────────┬───────────┘
                         │
              ┌──────────▼───────────┐
              │  SESSION COMPLETE    │
              │  - Volume updated    │◄──── Pillar 1: Volume
              │  - History saved     │◄──── Pillar 6: Individualization
              │  - Overload computed │◄──── Pillar 2: Progressive Overload
              │  - Deload checked    │◄──── Pillar 5: Fatigue Management
              └──────────────────────┘
```

### The User Experience Loop

1. **User opens app** → sees their program card with today's session. If fatigued muscles are detected, a deload banner warns them.

2. **User opens a session** (program, custom, or generated) → weights are **automatically recalculated** from their last performance. Green ↑ badges show where they're progressing. Amber ↓ badges show where they need to consolidate.

3. **User starts the session** → the timer shows overload tips ("Charge augmentee") during sets. RIR targets guide effort level.

4. **User completes the session** → volume counters update. The next time they open any workout, `getProgressiveWeight()` will use this new data. If they've been above MRV for 3+ weeks, deload warnings appear.

5. **The cycle repeats** — each session makes the next one smarter. The app learns from the user's actual performance, not from theoretical tables.

### No Dead Ends

Every entry point into a workout has progressive overload built in:
- **Custom workouts** and **program days** use the full BUMP/HOLD/DROP system with visual badges and session timer tips
- **Generated workouts** use stale-weight detection (overload tips from `sessionInsights`) and BW-based estimation for cold starts
- **Deload detection** fires from the home card (ActiveProgramCard) and program day screen

The user cannot accidentally train "dumb" — the science is always applied, just through different mechanisms depending on the entry point.

---

## Scientific References

### Volume & Dose-Response
- Schoenfeld BJ, Ogborn D, Krieger JW. (2017). Dose-response relationship between weekly resistance training volume and increases in muscle mass. *Journal of Sports Sciences*, 35(11):1073-1082. [PubMed](https://pubmed.ncbi.nlm.nih.gov/27433992/)
- Schoenfeld BJ, Contreras B, Krieger J, et al. (2019). Resistance Training Volume Enhances Muscle Hypertrophy but Not Strength in Trained Men. *Medicine & Science in Sports & Exercise*, 51(1):94-103. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC6303131/)
- Pelland JC, Remmert JF, et al. (2024/2025). The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency. *Sports Medicine*. [PubMed](https://pubmed.ncbi.nlm.nih.gov/41343037/)

### Volume Landmarks
- Israetel M, Hoffmann J, Smith CW. Training Volume Landmarks for Muscle Growth. *Renaissance Periodization*. [RP Strength](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth)
- Israetel M. Mesocycle Design for Hypertrophy. *Juggernaut Training Systems*. [JTS](https://www.jtsstrength.com/mesocycle-design-for-hypertrophy/)

### Progressive Overload
- Plotkin DL, et al. (2022). Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations. *PeerJ*, 10:e14142. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9528903/)
- Chaves TS, Libardi CA, et al. (2024). Overload Progression Protocols. *International Journal of Sports Medicine*, 45(7):504-510. [PubMed](https://pubmed.ncbi.nlm.nih.gov/38286426/)

### RPE, RIR & Autoregulation
- Helms ER, Cronin J, Storey A, Zourdos MC. (2016). Application of the Repetitions in Reserve-Based Rating of Perceived Exertion Scale for Resistance Training. *Strength and Conditioning Journal*, 38(4):42-49. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4961270/)
- Zourdos MC, et al. (2016). Novel Resistance Training-Specific Rating of Perceived Exertion Scale. *Journal of Strength and Conditioning Research*. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7810043/)
- Greig L, Swinton P, et al. (2020). Autoregulation in Resistance Training: Addressing the Inconsistencies. *Sports Medicine*. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7575491/)

### Proximity to Failure
- Refalo MC, Helms ER, Trexler ET, Hamilton DL, Fyfe JJ. (2023). Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy. *Sports Medicine*, 53(3):649-665. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9935748/)
- Robinson ZP, Pelland JC, Remmert JF, Refalo MC, Jukic I, Steele J, Zourdos MC. (2024). Exploring the Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy. *Sports Medicine*, 54(9). [PubMed](https://pubmed.ncbi.nlm.nih.gov/38970765/)
- Refalo MC, et al. (2024). Failure vs. RIR in Trained Individuals. *Journal of Sports Sciences*. [Tandfonline](https://www.tandfonline.com/doi/full/10.1080/02640414.2024.2321021)

### Training Frequency
- Schoenfeld BJ, Ogborn D, Krieger JW. (2016). Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy. *Sports Medicine*. [PubMed](https://pubmed.ncbi.nlm.nih.gov/27102172/)
- Schoenfeld BJ, Grgic J, Krieger JW. (2019). How many times per week should a muscle be trained to maximize muscle hypertrophy? *Journal of Sports Sciences*, 37(11):1286-1295. [PubMed](https://pubmed.ncbi.nlm.nih.gov/30558493/)

### Deloading
- Bell L, et al. (2023). Integrating Deloading into Strength and Physique Sports Training Programmes: An International Delphi Consensus Approach. *Sports Medicine - Open*. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10511399/)
- Bell L, et al. (2024). Deloading Practices in Strength and Physique Sports: A Cross-sectional Survey. *Sports Medicine - Open*. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10948666/)
- Sillvan M, et al. (2024). Gaining more from doing less? The effects of a one-week deload period during supervised resistance training on muscular adaptations. *PeerJ*. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10809978/)

### Fitness-Fatigue Model
- Banister EW, Calvert TW, Savage MV, Bach T. (1975). A systems model of training for athletic performance. *Australian Journal of Sports Medicine*, 7:57-61.
- Hellard P, et al. (2006). Assessing the Limitations of the Banister Model in Monitoring Training. *Journal of Sports Sciences*. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC1974899/)

---

*This document was compiled with web-verified scientific sources. All claims are backed by peer-reviewed research or established expert consensus (Renaissance Periodization, Schoenfeld lab, Helms, Zourdos). Last updated: February 2026.*
