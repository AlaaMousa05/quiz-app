# UI: Screen Inventory, Wireframes & Design System

Source material: `spec.md`, `traceability.md`, `docs/brief.md`. This document describes screens and visual structure only — **no code**. API endpoints below are illustrative (naming/shape to guide the data each screen needs); the actual API contract is finalized in `plan.md`.

**How to read the wireframes**: boxes are drawn at a 375px mobile viewport, one character ≈ one visual unit, not a literal pixel grid. Per the task, only the Student **Taking Quiz** and **My Quizzes** screens are wireframed in both English (LTR) and Arabic (RTL); every other screen has one (English) wireframe plus a prose note on what changes in RTL. Arabic strings in wireframes are illustrative placeholders, not final copy — real copy is written by a native speaker during implementation. Per FR-036, embedded numbers/times keep Western digits and LTR order even inside RTL text; that's shown deliberately in the Arabic wireframes below.

---

## 1. Design System

### 1.1 Color

Neutral scale (backgrounds, text, borders):

| Token | Hex | Use |
|---|---|---|
| `neutral-0` | `#FFFFFF` | Page/card background |
| `neutral-50` | `#F7F8FA` | App background, subtle fills |
| `neutral-100` | `#EEF0F3` | Dividers, disabled fills |
| `neutral-300` | `#C9CED6` | Borders |
| `neutral-500` | `#6B7280` | Secondary text (4.6:1 on white — AA for normal text) |
| `neutral-700` | `#374151` | Body text (9.7:1 on white) |
| `neutral-900` | `#111318` | Headings, primary text (17.9:1 on white) |

Accent (brand/interactive):

| Token | Hex | Use | Contrast on white |
|---|---|---|---|
| `accent-600` | `#3454D1` | Primary buttons, links, active tab, focus ring | 5.1:1 (AA for text) |
| `accent-700` | `#28409C` | Hover/pressed state | 7.0:1 |
| `accent-100` | `#E3E9FB` | Selected/active background fill | — (background only) |

Semantic:

| Token | Hex | Use | Contrast on white |
|---|---|---|---|
| `success-700` | `#15803D` | Success text/icon (submitted, imported OK) | 5.2:1 |
| `success-100` | `#DCFCE7` | Success background fill | — |
| `warning-700` | `#B45309` | Warning text/icon (timer under 2 min, archived) | 5.4:1 |
| `warning-100` | `#FEF3C7` | Warning background fill | — |
| `danger-700` | `#B91C1C` | Error text/icon, destructive actions, timer under 30s | 6.1:1 |
| `danger-100` | `#FEE2E2` | Error background fill | — |

Rule: any text/icon on a colored background is checked against **that background**, not just white — e.g., `danger-700` on `danger-100` (≈4.9:1) still clears AA; white text is used on solid `accent-600`/`danger-700`/`success-700` fills (all ≥4.5:1). All pairs above target WCAG AA (4.5:1 normal text, 3:1 large text/icons/UI components) — verify with a contrast checker once real assets exist, since terminal-computed ratios here are close approximations.

### 1.2 Type scale

One scale serves both scripts; Arabic gets slightly taller line-height to clear diacritics and descenders.

| Token | Size | Line-height (Latin) | Line-height (Arabic) | Use |
|---|---|---|---|---|
| `text-xs` | 12px | 1.4 | 1.6 | Meta text, timestamps, badges |
| `text-sm` | 14px | 1.5 | 1.7 | Secondary text, form hints |
| `text-base` | 16px | 1.5 | 1.7 | Body text, form inputs (16px avoids iOS auto-zoom) |
| `text-lg` | 18px | 1.5 | 1.7 | Card titles, question text |
| `text-xl` | 20px | 1.4 | 1.6 | Section headings |
| `text-2xl` | 24px | 1.3 | 1.5 | Screen titles |
| `text-3xl` | 30px | 1.25 | 1.45 | Score display |

Weight: 400 body, 500 emphasis/labels, 600 headings/buttons. Avoid weights below 400 for Arabic — thin Arabic weights lose legibility at small sizes.

### 1.3 Spacing

4px base unit: `space-1`=4, `space-2`=8, `space-3`=12, `space-4`=16, `space-6`=24, `space-8`=32, `space-12`=48, `space-16`=64. Screen padding: 16px mobile, 32px desktop. Card internal padding: 16px. Stack gap between cards: 12px.

### 1.4 Font

**Noto Sans Arabic** (Arabic text) + **Noto Sans** (Latin text) as a single self-hosted family pair, loaded via `@fontsource/noto-sans-arabic` and `@fontsource/noto-sans` (no external font CDN — keeps the app usable offline-of-fonts and avoids a third-party network dependency). Font stack: `"Noto Sans Arabic", "Noto Sans", system-ui, sans-serif` — the browser picks the right subset per character run automatically, so mixed Arabic/Latin text (a name, a bilingual label) renders correctly without manual `<span>` splitting. `font-display: swap` to avoid invisible text during load. Numerals always render via the Latin/Western digit glyphs in both languages (see §1.9).

### 1.5 Buttons

| Variant | Fill | Text | Border | Use |
|---|---|---|---|---|
| Primary | `accent-600` | white | none | Start, Submit, Save, Publish, Import |
| Secondary | `neutral-0` | `neutral-700` | 1px `neutral-300` | Cancel, Prev, secondary actions |
| Destructive | `neutral-0` | `danger-700` | 1px `danger-700` | Deactivate, Delete, Archive |
| Disabled | `neutral-100` | `neutral-500` | none | Any of the above while invalid/loading |

All buttons: min-height 44px, min-width 44px for icon-only buttons, 8px horizontal padding minimum beyond text, 8px border-radius, 8px gap between icon and label. Loading state replaces label with a spinner at the same footprint (no layout shift).

### 1.6 Cards

White (`neutral-0`) background, 1px `neutral-100` border, 8–12px radius, 16px padding, subtle shadow (`0 1px 2px rgba(17,19,24,0.06)`). Used for quiz list items, question rows, result rows on mobile, dashboard summary tiles.

### 1.7 Form fields

Label always **above** the input (block stacking) — this is deliberate: it sidesteps left/right label-placement questions entirely between LTR and RTL, so the same markup works in both directions with only `text-align: start` needed. Input: 44px min-height, 1px `neutral-300` border, 8px radius, 12px horizontal padding, `text-base` (16px). Focus: 2px `accent-600` ring, no color-only indication (also gets the ring shape, for colorblind/contrast users). Error: 1px `danger-700` border + `text-sm` message in `danger-700` below the field, marked with an icon (not color alone).

### 1.8 Tables → cards on mobile

Below 640px width, any data table (results, class roster, import preview, user list) restructures into a stack of cards: one card per row, each field shown as a `label: value` line, primary identifier (name) as the card title, primary action as a full-width button at the card's bottom. At ≥640px, the same data renders as a conventional table with sortable column headers. This is one responsive component, not two separate screens to maintain.

### 1.9 RTL rules

- **Logical properties only.** Use `margin-inline-start/end`, `padding-inline-start/end`, `inset-inline-start/end`, `text-align: start/end`, `border-inline-start/end`. Never `margin-left/right`, `float: left/right`, or `text-align: left/right` — these silently break the moment `dir="rtl"` is set on `<html>`.
- **Mirror directional icons**: back/forward chevrons and arrows, breadcrumb separators, the Prev/Next pagination arrows on the quiz-taking screen, disclosure carets that imply "toward more content in reading order." In RTL, "forward" points left, "back" points right — the opposite of LTR.
- **Do not mirror**: icons with a fixed real-world or universal meaning — clock/timer, search (magnifying glass), settings gear, print, download, checkmarks, the save/autosave indicator, warning/error triangles. Mirroring these makes them harder to recognize, not more localized.
- **Numerals stay Western digits, LTR order, in both languages** (a deliberate scope decision — see DECISIONS.md) — a date like "25/09/2026" or a timer "14:32" is wrapped so its internal digit order never reverses inside a right-to-left paragraph (in practice: rendered as its own inline run so the browser's bidi algorithm doesn't reorder the digits).
- **`dir="auto"` on all user-generated content** (names, quiz questions/options) so a single field correctly self-detects direction per FR-036, independent of the surrounding UI's `dir`.
- **Tab/step order still follows visual order**: in RTL, keyboard tab order and swipe gestures (question grid, carousel-like navigation) move right-to-left to match reading direction, not the LTR order carried over unchanged.

### 1.10 Tap targets

Every interactive control — buttons, tab strip items, table/card row actions, the question-grid jump buttons, the language toggle, checkboxes/radios' clickable area (not just the visible dot) — has a minimum 44×44px hit area, even when the visible glyph is smaller. Adjacent tap targets keep at least 8px of clear space between them (per FR-021, and the constitution's mobile-first principle).

### 1.11 Timer states

The countdown (sticky on the Taking Quiz screen) has three visual states, escalating by both color and icon — never color alone:

| State | Threshold | Fill/text | Icon | Behavior |
|---|---|---|---|---|
| Normal | > 2 min remaining | `neutral-700` text on `neutral-50` | ⏱ static | Ticks down silently |
| Warning | ≤ 2 min remaining | `warning-700` text on `warning-100` | ⏱ with a subtle pulse | No sound by default (avoids disrupting a quiet classroom); ARIA-live polite announcement once on entering this state |
| Danger | ≤ 30 sec remaining | `danger-700` text on `danger-100`, bold | ⚠ replaces ⏱ | ARIA-live assertive announcement once on entering this state; timer area gains a 1px `danger-700` border |

At 0:00 the timer freezes at "0:00" (never negative, never blank) and the screen transitions to the auto-submit flow per FR-008/FR-009.

---

## 2. Navigation Maps

### 2.1 Student

```
Login ──(auth ok)──> My Quizzes ──(tap quiz card, status=Open)──> Quiz Intro
                          │                                            │
                          │                                    (tap Start)
                          │                                            ▼
                          │                                     Taking Quiz
                          │                                            │
                          │                              (tap Submit, confirm)
                          │                                            ▼
                          │                                 Submit Confirmation
                          │                                            │
                          │                                    (confirm submit)
                          │                                            ▼
                          │<──────────────────────────────────────  Result
                          │
                          └──(tap quiz card, status=Done, quiz closed)──> Review
                          └──(tap quiz card, status=Done, quiz still open)──> Result
Header (every screen): language toggle + logout, always visible.
```

### 2.2 Teacher

```
Login ──> My Quizzes ──(New Quiz)──> Create/Edit Quiz Settings ──(Next)──> Questions Editor ──(Publish)──> My Quizzes
             │                                                                     ▲
             ├──(Import from spreadsheet)──> Import Quiz ──(confirm import)────────┘  (lands in Questions Editor to review before publish)
             │
             └──(tap existing quiz's Results)──> Quiz Results ──(Export)──> (CSV download)
My Quizzes ──(tap existing quiz card)──> Create/Edit Quiz Settings (locked fields if attempts exist, per FR-024) ──(Questions tab)──> Questions Editor
```

### 2.3 Admin

```
Login ──> Dashboard ──> Classes ──(tap class)──> Class Detail ──(Move student)──> (student moved, stays on Class Detail)
             │
             ├──> Users ──(Import)──> Import Users ──(confirm)──> Users (now showing Print action on new rows, per FR-031b)
             │        └──(Create single user)──> Users (new row added)
             │        └──(Reset password / Deactivate on a row)──> Users (row updated)
             │
             ├──> All Quizzes ──(tap quiz)──> Quiz Results (admin-scoped, same screen as Teacher's)
             │
             └──> All Results ──(pick a quiz)──> Quiz Results (admin-scoped)
Header (every screen, all roles): language toggle + logout, always visible.
```

---

## 3. Student Screens

### S1 — Login

**Purpose**: Authenticate any role; entry point for the whole app. **Route**: `/login`. **FRs**: FR-001, FR-034. **Data**: `POST /api/auth/login { username, password } → { token, role }`.

```
┌─────────────────────────────────────┐ 375px
│                            🌐 EN|AR  │
│                                       │
│              QuizApp                 │
│                                       │
│   Username                           │
│  ┌─────────────────────────────────┐ │
│  │ S10A07                          │ │
│  └─────────────────────────────────┘ │
│   Password                           │
│  ┌─────────────────────────────────┐ │
│  │ ••••••••                        │ │
│  └─────────────────────────────────┘ │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │           Log In                │ │
│  └─────────────────────────────────┘ │
│                                       │
│  Forgot your password? Ask your      │
│  teacher or admin.                   │
└─────────────────────────────────────┘
```

**Desktop**: form centered in a fixed ~400px card on the page; no other layout change. **States**: loading (button shows spinner, fields disabled), error (banner above form: "Incorrect username or password" — never confirms which field was wrong), empty (n/a — static form). **RTL**: language toggle stays in the header's "end" corner (visually swaps to top-left); form fields, labels, and button keep the same block-stacked layout, just right-aligned text; the language toggle itself is the first thing a non-Arabic-reading new user needs to find, so its position is fixed (top corner) regardless of direction rather than moving into flow.

---

### S2 — My Quizzes

**Purpose**: Student's home screen — quizzes grouped by Open / Upcoming / Done. **Route**: `/quizzes`. **FRs**: FR-006. **Data**: `GET /api/quizzes` (server returns only quizzes assigned to the student's class, per FR-006, already split into the three buckets).

**English (LTR), mobile 375px:**

```
┌─────────────────────────────────────┐ 375px
│ QuizApp                🌐EN  Sami ▾  │
├─────────────────────────────────────┤
│ My Quizzes                           │
│ ┌───────┬───────────┬─────────────┐ │
│ │ Open  │ Upcoming  │    Done     │ │
│ └───────┴───────────┴─────────────┘ │
│  (Open tab active — accent underline)│
│ ┌───────────────────────────────────┐│
│ │ Algebra Quiz 3           ⏱ 20 min ││
│ │ 10A · Math                        ││
│ │ Open until: Sep 25, 6:00 PM       ││
│ │                     [ Start → ]   ││
│ └───────────────────────────────────┘│
│ ┌───────────────────────────────────┐│
│ │ Arabic Grammar Quiz      ⏱ 20 min ││
│ │ 10A · Arabic                      ││
│ │ Open until: Sep 26, 11:59 PM      ││
│ │                     [ Start → ]   ││
│ └───────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Arabic (RTL), mobile 375px:**

```
┌─────────────────────────────────────┐ 375px
│  ▾ سامي  EN🌐               QuizApp │
├─────────────────────────────────────┤
│                          اختباراتي   │
│ ┌─────────────┬───────────┬───────┐ │
│ │   منتهية    │   قادمة   │ مفتوحة │ │
│ └─────────────┴───────────┴───────┘ │
│  (تبويب "مفتوحة" نشط — خط سفلي)      │
│┌───────────────────────────────────┐ │
││ دقيقة 20 ⏱           اختبار الجبر 3││
││                       رياضيات · 10A││
││       6:00 م ،25 Sep :مفتوح حتى   ││
││                    [ ← ابدأ ]      ││
│└───────────────────────────────────┘ │
│┌───────────────────────────────────┐ │
││ دقيقة 20 ⏱      اختبار قواعد اللغة││
││                       عربي · 10A  ││
││ 11:59 م ،26 Sep :مفتوح حتى        ││
││                    [ ← ابدأ ]      ││
│└───────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Notes on the mirroring shown above: header items swap sides (user menu now at the visual left, app name at the visual right — both are really just "start"/"end" unchanged in markup); tab order is preserved in reading order so "مفتوحة" (Open) is still the first/active tab a right-to-left reader reaches first, which puts it visually rightmost; the "Start" button's arrow flips to point left (`←`), matching "forward" in RTL; card body text right-aligns; the date/time numerals stay in Western LTR order embedded in the RTL sentence, per §1.9.

**Desktop (both languages)**: tabs plus a 2–3 column card grid instead of a single column; otherwise identical structure. **States**: loading (3 skeleton cards), empty per-tab ("No open quizzes right now" / "Nothing upcoming" / "You haven't completed any quizzes yet" — each with a simple line-art icon, no error tone), error (retry banner: "Couldn't load your quizzes — Retry"), domain states are the three tabs themselves (Open/Upcoming/Done) plus a per-card "already attempted" indicator on Done-tab cards linking to Result or Review depending on whether the quiz has closed.

---

### S3 — Quiz Intro

**Purpose**: Show quiz rules before commitment; the one-attempt warning lives here. **Route**: `/quizzes/:quizId`. **FRs**: FR-004 (title/time limit/points shown), FR-007 (one-attempt warning), FR-032 (negative-marking copy). **Data**: `GET /api/quizzes/:quizId` → title, time limit, total points, negative-marking config, class, open/close window, whether the student already has an attempt.

```
┌─────────────────────────────────────┐ 375px
│ ‹ Back                  🌐EN  Sami ▾ │
├─────────────────────────────────────┤
│                                       │
│  Algebra Quiz 3                      │
│  10A · Math                          │
│                                       │
│  ⏱  Time limit: 20 minutes           │
│  Σ  Total points: 45                 │
│  ✎  15 questions                     │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │ Wrong answer: −25% of that      │ │
│  │ question's points.               │ │
│  │ Unanswered: 0.                   │ │
│  └─────────────────────────────────┘ │
│                                       │
│  ⚠ You only get ONE attempt. Once    │
│    you start, the timer cannot be    │
│    paused.                           │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │            Start                │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Desktop**: same content in a centered ~480px card; no structural change. **States**: loading (skeleton), error (quiz failed to load — retry), domain states — quiz not open yet (Start button replaced with disabled state + "Opens Sep 24, 9:00 AM"), quiz open (as shown), already submitted (Start button replaced with "View Result" or "View Review" depending on close date), quiz closed without an attempt (message: "This quiz's window has closed" — no Start action). **RTL**: the warning and negative-marking boxes keep their icon-left-of-text layout with the icon logically at "start" (so it sits on the right in RTL, still first-read); numerals (20, 45, 15, −25%) stay Western/LTR per §1.9.

---

### S4 — Taking Quiz

**Purpose**: The core loop — one question per screen, sticky timer, autosave, jump grid. **Route**: `/quizzes/:quizId/attempt`. **FRs**: FR-005, FR-007, FR-008, FR-008a, FR-009, FR-010. **Data**: `GET /api/attempts/:attemptId` (resume state: remaining time, all saved answers, current question), `PATCH /api/attempts/:attemptId/answers { questionId, optionId }` (autosave, fired on every selection), `POST /api/attempts/:attemptId/submit`.

This screen intentionally drops the normal app header (no app name, no user menu, no nav links) — just the timer, progress, and autosave indicator — so nothing invites the student away from an in-progress, timed attempt.

**English (LTR), mobile 375px — main view:**

```
┌─────────────────────────────────────┐ 375px
│ ⏱ 14:32     Question 6 of 15  💾Saved│
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░  6/15 │
├─────────────────────────────────────┤
│                                       │
│  Q6. What is the value of x in       │
│      2x + 4 = 10?               5 pts│
│                                       │
│  ○  A.  2                            │
│  ●  B.  3                            │
│  ○  C.  4                            │
│  ○  D.  5                            │
│                                       │
│                                       │
│                                       │
├─────────────────────────────────────┤
│ [‹ Prev]     [ ⊞ Grid ]     [Next ›] │
└─────────────────────────────────────┘
```

**English — question grid (bottom sheet, opened via "⊞ Grid"):**

```
┌─────────────────────────────────────┐
│  Jump to question             [ ✕ ]  │
├─────────────────────────────────────┤
│  [1] [2] [3] [4] [5]                 │
│  [6] [7] [8] [9] [10]                │
│  [11][12][13][14][15]                │
│                                       │
│  ■ Answered   □ Unanswered  ▶ Current│
│                                       │
│  ┌─────────────────────────────────┐ │
│  │          Submit Quiz            │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Arabic (RTL), mobile 375px — main view:**

```
┌─────────────────────────────────────┐ 375px
│محفوظ💾  15 من 6 السؤال      32:14 ⏱│
│ 15/6  ░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓ │
├─────────────────────────────────────┤
│                                       │
│نقطة 5              10 = 4 + x2 :٦.س  │
│                          ما قيمة x في │
│                                       │
│                              2  .أ  ○ │
│                              3  .ب  ● │
│                              4  .ج  ○ │
│                              5  .د  ○ │
│                                       │
│                                       │
├─────────────────────────────────────┤
│ [التالي ‹]     [ ⊞ الشبكة ]  [› السابق]│
└─────────────────────────────────────┘
```

**Arabic — question grid (bottom sheet):**

```
┌─────────────────────────────────────┐
│  [ ✕ ]              الانتقال إلى سؤال│
├─────────────────────────────────────┤
│                 [5] [4] [3] [2] [1]  │
│               [10] [9] [8] [7] [6]   │
│                [15][14][13][12][11]  │
│                                       │
│الحالي ◀  غير مجاب □   مجاب عليه ■    │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │            تسليم الاختبار         │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Notes on the mirroring shown above: timer stays at the visual right in RTL (it's logically "end" of the header row, which is the left in LTR and the right in RTL — wait, timer is drawn at the *start* in both, i.e., first-read position: leftmost in LTR, rightmost in RTL — that's why it moved from the left edge to the right edge); progress bar direction and fill both flip so it still visually "fills toward completion" reading with the text; the grid's numeral order flips right-to-left (1 starts at the right) to match RTL reading/scanning order, while each individual number keeps normal LTR digit shape (e.g., "10" is not written "01"); Prev/Next swap sides and arrow direction exactly as described in §1.9 (Next points left "‹" and sits on the left; Prev points right "›" and sits on the right); the answered/unanswered/current legend keeps the same three symbols, just reordered to read right-to-left.

**Desktop (both languages)**: the question grid is not a bottom sheet — it's an always-visible side panel (240px wide, placed at the layout's "end" side, so right of the question on desktop-LTR and left of the question on desktop-RTL), letting the student see progress and jump without leaving the question view; the Prev/Next/Submit row moves to sit directly under the question card rather than pinned to the viewport bottom.

**States**: loading (full-screen spinner before first question loads — attempt is being created or resumed server-side), error (network error banner: "Couldn't save your answer — retrying…", non-blocking, does not stop the timer), domain states — quiz already open and in progress (as shown), resuming an existing attempt (identical view, pre-filled from server state, no "welcome back" interstitial needed since it should feel seamless), time expired (screen automatically transitions to a brief "Time's up — submitting your answers…" interstitial then to Result), offline while saving (autosave indicator changes from "💾 Saved" to "⚠ Saving…" then retries in the background; if offline persists past the grace period, a non-dismissible banner reads "You're offline. Reconnect before time runs out — your answers so far are safe." since answers already acknowledged by the server remain safe, only the very latest unsent selection is at risk).

---

### S5 — Submit Confirmation

**Purpose**: Last checkpoint before an irreversible submit; surfaces the unanswered count. **Route**: presented as a full-screen step/modal over `/quizzes/:quizId/attempt` (not a separate persisted route, since it only makes sense mid-attempt). **FRs**: FR-007, FR-009. **Data**: computed client-side from already-loaded attempt state (no extra fetch); submit action calls `POST /api/attempts/:attemptId/submit`.

```
┌─────────────────────────────────────┐ 375px
│                                       │
│         Submit this quiz?            │
│                                       │
│   You've answered 13 of 15           │
│   questions.                         │
│                                       │
│   ⚠ 2 questions are unanswered       │
│     (Q6, Q11) — they'll score 0.     │
│                                       │
│   This cannot be undone. You only    │
│   get one attempt.                   │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │         Submit Quiz             │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │    Go Back and Review           │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Desktop**: centered modal dialog (~440px) over a dimmed backdrop, same content. **States**: loading (Submit button spinner while the request is in flight), error (submission failed — "Couldn't submit, check your connection and try again"; answers already autosaved are not at risk), domain states — all answered (the unanswered warning box simply doesn't render), zero answered (warning still shows, doesn't block submission — a student can submit an all-blank attempt, it just scores 0). **RTL**: unanswered question numbers list stays in Western digit order (Q6, Q11) rather than reversing; buttons stack in the same vertical order, just right-aligned text.

---

### S6 — Result

**Purpose**: Shows the score immediately after submission, before the quiz closes (no correctness breakdown yet, per FR-010). **Route**: `/quizzes/:quizId/result`. **FRs**: FR-010, FR-012b, FR-013. **Data**: `GET /api/attempts/:attemptId/result` → total score, max points, submission time.

```
┌─────────────────────────────────────┐ 375px
│ ‹ My Quizzes            🌐EN  Sami ▾ │
├─────────────────────────────────────┤
│                                       │
│         Algebra Quiz 3               │
│                                       │
│            32.5 / 45                 │
│           (your score)               │
│                                       │
│   Submitted: Sep 24, 4:12 PM         │
│                                       │
│   Answer review will be available    │
│   after this quiz closes on          │
│   Sep 25, 6:00 PM.                   │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │        Back to My Quizzes       │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Desktop**: same content centered in a card, no structural change. **States**: loading (skeleton), error (couldn't load — retry), domain state — this screen only exists post-submission and pre-close; once the quiz closes, the same route (or the card in My Quizzes) redirects to S7 Review instead. **RTL**: score numerals stay Western/LTR per §1.9; everything else right-aligns.

---

### S7 — Review

**Purpose**: Full per-question correctness breakdown, available only after the quiz closes. **Route**: `/quizzes/:quizId/review`. **FRs**: FR-010 (post-close reveal). **Data**: `GET /api/attempts/:attemptId/review` → per-question: the student's selected option, the correct option, points earned/lost. Server rejects this request with 403 if the quiz hasn't closed yet, regardless of URL guessing.

```
┌─────────────────────────────────────┐ 375px
│ ‹ My Quizzes            🌐EN  Sami ▾ │
├─────────────────────────────────────┤
│  Algebra Quiz 3 — Review             │
│  Final score: 32.5 / 45              │
├─────────────────────────────────────┤
│ ┌───────────────────────────────────┐│
│ │ Q1. 2x + 4 = 10          ✓ +5 pts ││
│ │ Your answer: B. 3 (correct)       ││
│ └───────────────────────────────────┘│
│ ┌───────────────────────────────────┐│
│ │ Q2. ...                  ✗ −0.75  ││
│ │ Your answer: A. 12 (incorrect)    ││
│ │ Correct answer: C. 15             ││
│ └───────────────────────────────────┘│
│ ┌───────────────────────────────────┐│
│ │ Q3. ...                    0 pts  ││
│ │ Not answered                      ││
│ └───────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Desktop**: same cards in a single wider column (reading order matters more than density here); no multi-column layout. **States**: loading (skeleton list), error (retry), domain states — quiz not yet closed (this route isn't reachable yet; My Quizzes links to S6 Result instead), no attempt exists (shouldn't be reachable via UI, server 403s defensively). **RTL**: per-question cards right-align; the ✓/✗/points-delta badge stays at the visual "end" (right in LTR, left in RTL) since it's a summary marker read after the question, consistent with how a scanning reader would expect to find the outcome.

---

## 4. Teacher Screens

### T1 — My Quizzes

**Purpose**: Teacher's home — their own quizzes only, with status and quick links to edit/results. **Route**: `/teacher/quizzes`. **FRs**: FR-014. **Data**: `GET /api/teacher/quizzes` → title, status (draft/published/closed), class(es), attempt count.

```
┌─────────────────────────────────────┐ 375px
│ QuizApp            🌐EN  Ms. Amal ▾  │
├─────────────────────────────────────┤
│ My Quizzes         [ + New Quiz ]    │
│                     [ ⇪ Import ]     │
│ ┌───────────────────────────────────┐│
│ │ Algebra Quiz 3        ● Published ││
│ │ 10A · 18/20 attempted             ││
│ │        [ Edit ]  [ Results ]      ││
│ └───────────────────────────────────┘│
│ ┌───────────────────────────────────┐│
│ │ Geometry Basics          ○ Draft  ││
│ │ 10A, 10B · not published yet      ││
│ │        [ Edit ]                   ││
│ └───────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Desktop**: 2–3 column card grid; "+ New Quiz" / "Import" as buttons in a fixed toolbar row instead of stacked. **States**: loading (skeleton cards), empty ("You haven't created any quizzes yet — Create your first quiz" with the New Quiz button emphasized), error (retry banner). **RTL**: status dot + label keep the dot at "start" (right in RTL) as a leading marker; action buttons row stays in the same relative order (Edit before Results, reading-order first-to-second), just right-to-left flow.

---

### T2 — Create/Edit Quiz Settings

**Purpose**: Configure a quiz's title, classes, dates, time limit, and negative marking (not questions yet). **Route**: `/teacher/quizzes/new` or `/teacher/quizzes/:quizId/settings`. **FRs**: FR-004, FR-012, FR-012a, FR-024. **Data**: `POST /api/teacher/quizzes` (create draft) / `PATCH /api/teacher/quizzes/:quizId` (update); `GET` pre-fills from the teacher's profile default for negative marking (FR-012a).

```
┌─────────────────────────────────────┐ 375px
│ ‹ My Quizzes            🌐EN  Amal ▾ │
├─────────────────────────────────────┤
│ Quiz Settings                        │
│                                       │
│ Title                                │
│ ┌─────────────────────────────────┐ │
│ │ Algebra Quiz 3                  │ │
│ └─────────────────────────────────┘ │
│ Classes                              │
│ ☑ 10A   ☐ 10B   ☐ 11A                │
│                                       │
│ Opens          Closes                │
│ ┌─────────────┐ ┌─────────────────┐ │
│ │ Sep 24 09:00│ │ Sep 25 18:00    │ │
│ └─────────────┘ └─────────────────┘ │
│ Time limit (minutes)                 │
│ ┌─────────────────────────────────┐ │
│ │ 20                              │ │
│ └─────────────────────────────────┘ │
│                                       │
│ ☑ Negative marking                   │
│   Penalty: [ 25 ]% of question points│
│                                       │
│  ┌─────────────────────────────────┐ │
│  │      Next: Add Questions →      │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Desktop**: two-column form (label+field pairs side by side) instead of full-width stacked fields; otherwise identical. **States**: loading (fields disabled while fetching an existing quiz), error (validation errors inline per field — e.g., "Closes must be after Opens"), domain state — **locked mode**: once the quiz has any attempt (FR-024), every field except Opens/Closes renders read-only with a banner: "This quiz has attempts — only dates can still be changed." **RTL**: checkboxes for classes keep their check-box-before-label order logically (start-anchored), so it visually reads label-before-box in RTL rather than staying box-first; the two-field Opens/Closes row keeps Opens first in reading order (rightmost in RTL).

---

### T3 — Questions Editor

**Purpose**: Add/edit/reorder the quiz's questions; publish when ready. **Route**: `/teacher/quizzes/:quizId/questions`. **FRs**: FR-005, FR-023, FR-024. **Data**: `GET/POST/PATCH/DELETE /api/teacher/quizzes/:quizId/questions`; `POST /api/teacher/quizzes/:quizId/publish`.

```
┌─────────────────────────────────────┐ 375px
│ ‹ Settings              🌐EN  Amal ▾ │
├─────────────────────────────────────┤
│ Questions (15)      [ + Add Question]│
│ ┌───────────────────────────────────┐│
│ │ Q1. What is the value of x in... ││
│ │ 4 options · correct: B · 5 pts   ││
│ │              [ Edit ]  [ Delete ]││
│ └───────────────────────────────────┘│
│ ┌───────────────────────────────────┐│
│ │ Q2. ...                           ││
│ │              [ Edit ]  [ Delete ]││
│ └───────────────────────────────────┘│
│  ...                                 │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │            Publish               │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Editing/adding a question opens a form (question text, 4 option fields, a radio to mark the correct one, a points field) — shown as a full-screen step on mobile, a modal on desktop; not drawn separately here since it reuses the Design System's form-field pattern (§1.7) directly.

**Desktop**: question list as a single wide column (reordering via drag handle becomes practical with a mouse); Add/Publish buttons in a fixed toolbar. **States**: loading (skeleton rows), empty ("No questions yet — Add your first question," Publish disabled), error (per-question validation, e.g., "Exactly one option must be marked correct"), domain state — **locked mode** identical trigger to T2 (attempts exist): Edit/Delete/Add/reorder all disabled, banner explains why, Publish button hidden (a quiz with attempts is already published). **RTL**: the "4 options · correct: B · 5 pts" meta line keeps its Latin option letters (A/B/C/D) unmirrored — they're identifiers, not directional icons; edit/delete action pair order stays reading-order-first-to-second (Edit before Delete) as in T1.

---

### T4 — Import Quiz from Spreadsheet

**Purpose**: Upload a quiz spreadsheet, preview, fix/confirm, land in the Questions Editor as a draft. **Route**: `/teacher/quizzes/import`. **FRs**: FR-018, FR-019, FR-019a, FR-020a. **Data**: `POST /api/imports/quiz/preview` (returns parsed rows + per-row errors, does not save), `POST /api/imports/quiz/confirm` (saves as a draft quiz per FR-004, requires choosing classes/dates/time limit/negative marking first if not already set on this screen).

```
┌─────────────────────────────────────┐ 375px
│ ‹ My Quizzes            🌐EN  Amal ▾ │
├─────────────────────────────────────┤
│ Import Quiz from Spreadsheet         │
│                                       │
│ ┌─────────────────────────────────┐ │
│ │   Drop file or tap to choose     │ │
│ │      (.xlsx or .csv, UTF-8)      │ │
│ └─────────────────────────────────┘ │
│                                       │
│ Preview: quiz-week4.xlsx (15 rows)   │
│ ┌───────────────────────────────────┐│
│ │ ✓ Row 1  Q: "2x+4=10..."  5 pts  ││
│ │ ✓ Row 2  Q: "..."         5 pts  ││
│ │ ✗ Row 3  Missing correct option  ││
│ │ ✓ Row 4  Q: "..."         3 pts  ││
│ │  ... (11 more)                    ││
│ └───────────────────────────────────┘│
│ 14 of 15 rows will import; 1 error   │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │   Import 14 Questions →         │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Desktop**: preview table (not stacked cards) with a status column, since a teacher reviewing 15 rows benefits from a real table at this width. **States**: loading (parsing spinner after file selected, before preview renders), empty (no file chosen yet — shown above), error — **file-level**: wrong encoding rejected before any row preview, per FR-019a: "Save as CSV UTF-8 or upload XLSX"; **row-level**: per-row errors shown inline as above (✗ rows), which do not block the ✓ rows from being confirmed. **RTL**: the ✓/✗ status marker moves to the visual "end" of each row (right in LTR, left in RTL) as a trailing status flag, consistent with Review (S7)'s badge placement rule.

---

### T5 — Quiz Results

**Purpose**: Per-student status/score, class average, per-question % correct, CSV export. **Route**: `/teacher/quizzes/:quizId/results`. **FRs**: FR-014, FR-026, FR-027. **Data**: `GET /api/teacher/quizzes/:quizId/results` → per-student rows + aggregate stats; `GET /api/teacher/quizzes/:quizId/results/export.csv`.

```
┌─────────────────────────────────────┐ 375px
│ ‹ My Quizzes            🌐EN  Amal ▾ │
├─────────────────────────────────────┤
│ Algebra Quiz 3 — Results             │
│ Class average: 34.2 / 45  [Export ⇩] │
│                                       │
│ Per-question % correct:              │
│ Q1 95% Q2 80% Q3 60% ... (scroll →)  │
│                                       │
│ ┌───────────────────────────────────┐│
│ │ سارة أحمد               41 / 45   ││
│ │ Submitted · Sep 24, 3:50 PM       ││
│ └───────────────────────────────────┘│
│ ┌───────────────────────────────────┐│
│ │ Omar Khalil              — / 45   ││
│ │ Not started                      ││
│ └───────────────────────────────────┘│
│ ┌───────────────────────────────────┐│
│ │ Lina Haddad          in progress  ││
│ │ Started · 12 min remaining       ││
│ └───────────────────────────────────┘│
└─────────────────────────────────────┘
```

Note: the student name row ("سارة أحمد") is content, not UI chrome, so it uses `dir="auto"` (§1.9) and right-aligns itself within an otherwise LTR-UI table row — this is exactly the "mixed direction" case FR-036 covers.

**Desktop**: full table (Name | Status | Score | Submitted at), sortable by column, with the per-question % correct as a horizontally scrollable strip of small bar indicators above it, or a compact heatmap row; class average pinned in a summary tile above the table. **States**: loading (skeleton rows + summary), empty ("No students enrolled in this quiz's class yet" — shouldn't normally occur since enrollment drives visibility), error (retry), domain states per-row (not started / in progress / submitted, as shown) plus a quiz-level state for "quiz still open" (live, numbers may change) vs. "quiz closed" (final). **RTL**: table/card columns reorder so Name is still first-read (rightmost header in RTL), Score/Status trail it; the horizontally-scrollable per-question strip scrolls right-to-left to start.

---

## 5. Admin Screens

### A1 — Dashboard

**Purpose**: Landing page after admin login; at-a-glance counts and shortcuts. **Route**: `/admin`. **FRs**: FR-031c (implicitly, as the entry point to unrestricted views). **Data**: `GET /api/admin/dashboard/summary` → counts (classes, students, teachers, quizzes, quizzes needing attention e.g. drafts).

```
┌─────────────────────────────────────┐ 375px
│ QuizApp                🌐EN  Nour ▾  │
├─────────────────────────────────────┤
│ Dashboard                            │
│ ┌───────────┐ ┌───────────┐          │
│ │ Classes   │ │ Students  │          │
│ │    3      │ │    58     │          │
│ └───────────┘ └───────────┘          │
│ ┌───────────┐ ┌───────────┐          │
│ │ Teachers  │ │ Quizzes   │          │
│ │    4      │ │    6      │          │
│ └───────────┘ └───────────┘          │
│                                       │
│ [ Classes ] [ Users ]                │
│ [ All Quizzes ] [ All Results ]      │
└─────────────────────────────────────┘
```

**Desktop**: summary tiles in a single row of four instead of a 2×2 grid; shortcut buttons become a persistent left/start-side sidebar nav instead of inline buttons (also used across all other Admin screens on desktop). **States**: loading (skeleton tiles), error (retry), empty (n/a — counts show 0 rather than an empty state). **RTL**: tile grid order stays reading-order (Classes first/top-right, matching LTR's top-left); sidebar (desktop) moves to the visual right.

---

### A2 — Classes

**Purpose**: List, create, rename, archive classes. **Route**: `/admin/classes`. **FRs**: FR-028, FR-031d. **Data**: `GET /api/admin/classes`, `POST /api/admin/classes`, `PATCH /api/admin/classes/:id` (rename/archive).

```
┌─────────────────────────────────────┐ 375px
│ ‹ Dashboard             🌐EN  Nour ▾ │
├─────────────────────────────────────┤
│ Classes            [ + New Class ]   │
│ ┌───────────────────────────────────┐│
│ │ 10A                    20 students││
│ │ 2 quizzes         [ Open ]        ││
│ └───────────────────────────────────┘│
│ ┌───────────────────────────────────┐│
│ │ 10B                    19 students││
│ │ 1 quiz            [ Open ]        ││
│ └───────────────────────────────────┘│
│ ┌───────────────────────────────────┐│
│ │ 11A ⛔ Archived        20 students││
│ │ 3 quizzes         [ Open ]        ││
│ └───────────────────────────────────┘│
└─────────────────────────────────────┘
```

Tapping "Open" navigates to A3 Class Detail, where rename/archive/delete live (kept off the list row to avoid destructive actions being one accidental tap away).

**Desktop**: table instead of cards (Name | Students | Quizzes | Status | action), "+ New Class" as a toolbar button. **States**: loading (skeleton), empty ("No classes yet — Create your first class"; shouldn't occur once seeded per FR-031d), error (retry), domain state — archived classes show a muted "⛔ Archived" badge but remain in the list (not hidden), per FR-029 leaving existing data visible. **RTL**: the archived badge and student/quiz counts trail the class name (visual end), same pattern as elsewhere.

---

### A3 — Class Detail

**Purpose**: View a class's roster, move a student out, rename/archive/delete this class. **Route**: `/admin/classes/:classId`. **FRs**: FR-028, FR-029, FR-030. **Data**: `GET /api/admin/classes/:id/students`, `POST /api/admin/classes/:id/students/:studentId/move { toClassId }`, `PATCH /api/admin/classes/:id` (rename/archive), `DELETE /api/admin/classes/:id` (only if empty).

```
┌─────────────────────────────────────┐ 375px
│ ‹ Classes               🌐EN  Nour ▾ │
├─────────────────────────────────────┤
│ 10A                [ Rename ] [ ⋯ ]  │
│  (⋯ menu: Archive / Delete)          │
│ 20 students                          │
│ ┌───────────────────────────────────┐│
│ │ سارة أحمد          S10A01         ││
│ │                  [ Move to... ▾ ] ││
│ └───────────────────────────────────┘│
│ ┌───────────────────────────────────┐│
│ │ Omar Khalil        S10A02         ││
│ │                  [ Move to... ▾ ] ││
│ └───────────────────────────────────┘│
│  ...                                 │
└─────────────────────────────────────┘
```

Tapping "Delete" in the ⋯ menu is disabled (grayed, with a tooltip/hint "Class has students or quizzes — archive instead") whenever the class isn't empty, per FR-028 — the refusal is communicated by disabling the action, not by letting the user attempt it and fail. "Move to…" opens a small picker of the other active classes.

**Desktop**: roster as a table (Name | Student ID | action), rest identical. **States**: loading (skeleton), empty ("No students in this class yet"), error (retry), domain states — archived class (banner: "This class is archived — no new students or quizzes can be added," Move-to picker for its students still works so they can be relocated out), a move in flight (row shows a brief "Moving…" state), move affecting a student with an attempt in progress (confirmation dialog: "This student has a quiz in progress — it will finish under its original rules. Continue?", per FR-030). **RTL**: student name (content, `dir="auto"`) and student-ID (Latin-form identifier, stays LTR) sit at opposite logical ends of the row; the "Move to…" control trails at visual end.

---

### A4 — Users

**Purpose**: List all users, create one directly, reset a password, deactivate. **Route**: `/admin/users`. **FRs**: FR-001a, FR-001b, FR-031, FR-031a. **Data**: `GET /api/admin/users`, `POST /api/admin/users` (single create), `POST /api/admin/users/:id/reset-password`, `POST /api/admin/users/:id/deactivate`.

```
┌─────────────────────────────────────┐ 375px
│ ‹ Dashboard             🌐EN  Nour ▾ │
├─────────────────────────────────────┤
│ Users     [ + New User ] [⇪ Import]  │
│ ┌───────────────────────────────────┐│
│ │ سارة أحمد   S10A01   Student  10A ││
│ │      [ Reset Pass ] [ Deactivate ]││
│ └───────────────────────────────────┘│
│ ┌───────────────────────────────────┐│
│ │ Ms. Amal Nasser  t-amal  Teacher  ││
│ │      [ Reset Pass ] [ Deactivate ]││
│ └───────────────────────────────────┘│
│ ┌───────────────────────────────────┐│
│ │ Omar Khalil  S10A02  Student  10A ││
│ │  ⛔ Deactivated                    ││
│ │      [ Reset Pass ] [ Reactivate ]││
│ └───────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Desktop**: table (Name | Username | Role | Class | Status | actions), toolbar buttons for New User / Import. **States**: loading (skeleton), empty (shouldn't occur once seeded), error (retry), domain state — deactivated users shown with a muted badge and their action swaps to "Reactivate" rather than being hidden, per FR-031a's "historical data remains intact and visible." Resetting a password opens a small confirmation ("Generate a new password for Omar Khalil?") then shows the new password once in a dismissible banner with a Print action — same visual pattern as the post-import credentials table below. **RTL**: role/class/status trailing badges sit at visual end; action buttons keep reading-order (Reset before Deactivate).

---

### A5 — Import Users (Students/Teachers)

**Purpose**: Bulk-create students or teachers from a spreadsheet, preview first, print resulting credentials. **Route**: `/admin/users/import`. **FRs**: FR-016, FR-017, FR-019, FR-019a, FR-020, FR-020a, FR-001a, FR-031b. **Data**: `POST /api/imports/students/preview` / `POST /api/imports/teachers/preview`, then `.../confirm`.

```
┌─────────────────────────────────────┐ 375px
│ ‹ Users                 🌐EN  Nour ▾ │
├─────────────────────────────────────┤
│ Import Students                      │
│ ┌─────────────────────────────────┐ │
│ │   Drop file or tap to choose     │ │
│ │      (.xlsx or .csv, UTF-8)      │ │
│ └─────────────────────────────────┘ │
│                                       │
│ Preview: students.xlsx (22 rows)     │
│ ┌───────────────────────────────────┐│
│ │ ✓ سارة أحمد   10A   S10A01(file) ││
│ │ ✓ Omar Khalil 10A   auto: S10A02 ││
│ │ ✓ Lina Haddad 10C   new class!   ││
│ │ ✗ Row 8  Missing class            ││
│ │  ... (18 more)                    ││
│ └───────────────────────────────────┘│
│ 21 of 22 rows will import; 1 error;  │
│ 1 new class (10C) will be created    │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │   Import 21 Students →          │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**After confirming**, the screen shows the resulting accounts as the printable credentials view (per FR-031b — same table, not a new screen):

```
┌─────────────────────────────────────┐ 375px
│ ‹ Users              🌐EN  🖨 Print  │
├─────────────────────────────────────┤
│ 21 students imported into 10A/10C    │
│ ┌───────────────────────────────────┐│
│ │ سارة أحمد   S10A01   Pw: xJ4-92q ││
│ │ Omar Khalil S10A02   Pw: qT7-14z ││
│ │ Lina Haddad S10C01   Pw: m2N-88w ││
│ │  ... (18 more)                    ││
│ └───────────────────────────────────┘│
│  ┌─────────────────────────────────┐ │
│  │            Done                 │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Desktop**: preview and credentials both render as real tables; a language toggle for import target ("Import Students" / "Import Teachers") sits as tabs above the drop zone rather than being a separate route per role. **States**: loading (parsing spinner), error — file-level (encoding rejection message per FR-019a) and row-level (✗ rows, non-blocking, as shown), domain states — a row flagged "new class!" (informational, not an error, per FR-020a), a row flagged as a duplicate (skipped, shown as "already exists — skipped" rather than ✗, since it's not a failure). The credentials view has no loading/error state of its own beyond the import call that produced it; its only action is Print (browser print dialog) and Done (returns to Users). **RTL**: preview/credentials table columns keep name first-read (right in RTL); the Print button in the header stays at a fixed corner like the language toggle, since it's a persistent utility action, not flow content.

---

### A6 — All Quizzes

**Purpose**: Every quiz across every teacher, unfiltered. **Route**: `/admin/quizzes`. **FRs**: FR-031c. **Data**: `GET /api/admin/quizzes` — same shape as T1's `GET /api/teacher/quizzes`, without the ownership filter, plus an Owner column/field.

Same layout as **T1 — My Quizzes**, with one addition: each card/row shows the owning teacher's name (since, unlike T1, cards here span multiple teachers), and there is no "+ New Quiz"/"Import" action (admin browses and drills into results here; creating quizzes stays a teacher action per FR-004's "teacher create" wording — admin can still act on a teacher's behalf via T4 Import Quiz, reached from here or from A1's shortcuts). Tapping a card leads to **T5 — Quiz Results**, admin-scoped (no ownership filter applied when checking access, per FR-031c). States and RTL behavior are identical to T1, plus the Owner field following the same "trailing meta" placement as other secondary fields in this document.

---

### A7 — All Results

**Purpose**: Entry point to any quiz's results, browsable by class or teacher rather than needing to go through a specific quiz card. **Route**: `/admin/results`. **FRs**: FR-031c, FR-026, FR-027. **Data**: `GET /api/admin/quizzes?groupBy=class` or `?groupBy=teacher` (view toggle) — same underlying quiz list as A6, grouped for browsing.

```
┌─────────────────────────────────────┐ 375px
│ ‹ Dashboard             🌐EN  Nour ▾ │
├─────────────────────────────────────┤
│ All Results                          │
│ Group by: [ Class ▾ ]                │
│                                       │
│ 10A                                   │
│ ┌───────────────────────────────────┐│
│ │ Algebra Quiz 3      (Ms. Amal)    ││
│ │ avg 34.2/45           [ View → ] ││
│ └───────────────────────────────────┘│
│ 10B                                   │
│ ┌───────────────────────────────────┐│
│ │ Geometry Basics    (Mr. Fadi)     ││
│ │ avg 28.0/40           [ View → ] ││
│ └───────────────────────────────────┘│
└─────────────────────────────────────┘
```

Tapping "View" leads into the same **T5 — Quiz Results** screen (admin-scoped), which is where the actual per-student table, class average, per-question %, and CSV export live — this screen is purely a browsing/grouping index on top of it, per FR-031c's "same screens... without the ownership filter" (there is exactly one Quiz Results screen component, reused by teacher and admin alike; A6 and A7 are just two different ways for the admin to arrive at it).

**Desktop**: grouped sections as a table with a group-header row instead of stacked section headers; group-by toggle as a segmented control. **States**: loading (skeleton), empty ("No quizzes with results yet" — no attempts have been submitted anywhere), error (retry). **RTL**: group-by dropdown and section headers follow the same trailing/leading conventions as elsewhere; "View →" arrow mirrors to "← عرض" per §1.9's icon-mirroring rule.

---

## 6. Screens ↔ Design System cross-reference

Every screen above uses: the button variants (§1.5) for its primary/secondary/destructive actions; the card pattern (§1.6) for list items on mobile, collapsing per §1.8 into tables on desktop where a screen shows tabular data (T5, A2 roster view, A4, A5); the form-field pattern (§1.7) for every input (S1, T2, T3's question form, A2 rename, A5 create-user); the timer states (§1.11) only on S4; the RTL rules (§1.9) and tap-target minimum (§1.10) apply uniformly to all nineteen screens without exception.
