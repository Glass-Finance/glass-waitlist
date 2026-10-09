# Glass Design System

**Source of truth:** Figma file _Glass Design By AQ_ — `figma.com/design/OzgMHnZ528nzYyElv5LZDd`
**Extracted:** 2026-10-07 via Figma REST API (`GET /v1/files/OzgMHnZ528nzYyElv5LZDd`)
**Re-audited:** 2026-10-09 — full-file pass; typography, icons and the component sheet inventoried (§7–§9)
**Applies to:** `glass-waitlist` (app → app.glasspay.app) and `glass-waitlist-v1` (marketing → glasspay.app)

> This document is normative. When code disagrees with this file, the code is wrong — unless
> §0 says otherwise. Do not "clean up" a value to match a Tailwind default; match this spec.

---

## 0. Read this first — three things that will trip you up

1. **The Figma file has no variables or styles layer.** `GET /files/:key/styles` returns
   `styles: []`, and `POST /files/:key/variables/local` returns 403 (needs the
   `file_variables:read` scope). Everything below was extracted from **node fills, strokes,
   radii and text styles**. Treat single-use values as provisional; treat high-frequency
   values (`#002fa7` at 2,812 nodes) as authoritative.

2. **The Figma MCP connection does not work and cannot be made to work.** Figma's OAuth
   server only accepts clients in a fixed catalog (VS Code, Cursor, Claude Code, Codex,
   Windsurf, Xcode, Zed). `POST https://api.figma.com/v1/oauth/mcp/register` returns **403**.
   Don't retry `opencode mcp auth figma` — it fails with _"OAuth app with client id … doesn't
   exist"_. Use a Figma personal access token (File content → Read-only) and the REST API.

3. **The Figma file is internally inconsistent.** Only `Primary Button + States` (id
   `1:11545`) has real, trustworthy variant props. Several other component sets were never
   cleaned up — their variants are literally named `Variant21`, `Variant8`, `Variant12`.
   Where a set contradicts itself, this document follows `Primary Button + States`.

---

## 1. Colour

### 1.1 Core palette

| Role                  | Hex       | Notes                                                                   |
| --------------------- | --------- | ----------------------------------------------------------------------- |
| **Brand**             | `#002fa7` | The only brand blue. 2,812 nodes. Highest-confidence value in the file. |
| **Danger / Critical** | `#db0000` | 276 nodes. Destructive button + outline-caution label.                  |
| **Focus ring**        | `#0f53ff` | Focus stroke colour. Currently **0 occurrences** in either repo.        |
| **Deep navy text**    | `#001f6e` | 248 nodes. Figma's dark heading/text navy.                              |
| **Purple**            | `#6b2fb5` | 242 nodes. The file's only purple.                                      |

### 1.2 Blue tint ramp

`#ccdaff` (425) · `#6a8ff0` (212) · `#bdd0fe` (131) · `#dbe6ff` (29) · `#ccdbff` (19) · `#94b1fb` (60)

Ordered lightest → darkest: `#ccdaff` · `#bdd0fe` · `#dbe6ff` · `#94b1fb` · `#6a8ff0`.

### 1.3 Neutrals & surfaces

| Hex       | Nodes | Use                                       |
| --------- | ----- | ----------------------------------------- |
| `#ffffff` | 3,810 | Page/cards; also tonal button fill at 60% |
| `#f9f9fb` | 300   | Page background                           |
| `#f3f4f6` | 338   | Subtle surface / stacked                  |
| `#f2f2f2` | 20    | Hairline surface                          |
| `#d7d8db` | 54    | Divider                                   |
| `#e0e0eb` | 8     | Hairline border                           |
| `#ccd1dc` | 5     | Border                                    |

### 1.4 Text ramp

`#000000` · `#000000 @60%` · `#000000 @32%` · `#000000 @20%` · `#808080` · `#848484` ·
`#a1a1aa` · `#797d86` · `#6a6e86` · `#5c5f7d`

### 1.5 Radius scale

**4 · 8 · 12 · 16.** Observed node counts: 4 → 1,792 · 12 → 441 · 8 → 357 · 16 → 56.
Four values. Anything else (`rounded-md` 6, `rounded-2xl` 16, arbitrary `[10px]`/`[20px]`/`[46px]`) is off-system.

> **Pill exception (confirmed 2026-10-09):** `rounded-full` is legal on **toggle tracks**
> (Figma r=100), **frequency badges** (r=24/999) and **status chips** — the file uses pills
> there deliberately. It stays banned on buttons, cards, inputs and modals.

> Note: an earlier version of `design-audit.md` claimed a `6` in the scale. There is no 6.
> One `Dialog` node carries r=24, outside the scale — provisional, see §9.3.

### 1.6 Banned values

These appear in the code and are **not** in Figma. Do not introduce them; retire them.

| Value                                                                       | Where it leaked from                                                                                                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `#2547d0`                                                                   | 19 occurrences across both repos. Not a Figma colour. Competes with `#002fa7`.                                                                                                 |
| `#2535c3`                                                                   | 4 occurrences. `ui/Button.jsx:7` has a comment naming this as the exact bug the component was written to prevent — and it still exists in `auth/SignUp/EmailPhoneStep.jsx:93`. |
| `#dc2626`                                                                   | Tailwind `red-600`. Figma danger is `#db0000`.                                                                                                                                 |
| `#e11d48`                                                                   | Tailwind `rose-500`.                                                                                                                                                           |
| `#0f1d6e`, `#1c2b8a`, `#0b0f2e`, `#0d1a6e`, `#0c1020`, `#0d1022`, `#0f1640` | Six near-identical "brand navy" hexes. Figma has one: `#001f6e`.                                                                                                               |
| `#4f46e5`, `#7c3aed`                                                        | Tailwind indigo/violet. Figma purple is `#6b2fb5`.                                                                                                                             |
| `#17a1e5`                                                                   | `--color-primary` in v1. Dead token, wrong blue.                                                                                                                               |
| `#16a34a`, `#059669`                                                        | Success greens. Not in Figma.                                                                                                                                                  |
| `#B0B8D8`, `#E0E0E0`, `#C5C5C5`, `#D4D4D4`                                  | Invented disabled fills.                                                                                                                                                       |
| `#111111`, `#111827`                                                        | Off-palette text. Figma text dark is `#000000`.                                                                                                                                |

---

## 2. Buttons

Six roles. All **Inter**, label weight **500**, border radius **4px at rest**.

### 2.1 Role matrix

| Role         | Fill           | Label                             | Stroke              | Radius              |
| ------------ | -------------- | --------------------------------- | ------------------- | ------------------- |
| **Primary**  | `#002fa7`      | `#ffffff`                         | —                   | **4px, all states** |
| **Outline**  | **none**       | `#002fa7` · `#000000` · `#db0000` | `#000000 @10%`, 1px | 4px                 |
| **Tertiary** | none           | `#002fa7` · `#db0000`             | none                | 4px, height 24      |
| **Critical** | `#db0000`      | `#ffffff`                         | —                   | 4px                 |
| **Tonal**    | `#ffffff @60%` | `#002fa7`                         | `#000000 @10%`, 1px | 4px                 |

> ### ⚠️ Extension: Success and Warning are NOT in Figma
>
> The Figma file defines **no** success or warning button role. These two were added on the
> design owner's instruction, and are marked here as an **extension rather than spec** — if the
> file later grows a real status role, prefer that.
>
> To avoid inventing a palette, both use fills the file **already reaches for elsewhere**:
> `#008000` (its dominant green, 435 nodes) and `#9a6500` (its dominant amber, 91 nodes).
> Washes are `#ccffcc` (183) and `#ffffdb` (56); the danger wash is `#ffcccc` (27). These
> replaced Tailwind's green-600 / amber-700 / emerald-50 / amber-50 / red-50, none of which
> appear anywhere in the file.
>
> `_SUCCESS_` · `_WARNING_` — fill as above, label `#ffffff`, 4px, full state set.
> **Blast radius:** `--color-success` had 192 references and `--color-warning` 74, so adopting
> these values is a visible change across status chips, banners and buttons. Review it.
> | _(focus)_ | — | — | `#0f53ff` | — |

> ### Radius decision: 4px, everywhere
>
> Figma's `Primary Button + States` is internally inconsistent — several _Hover_/_Pressed_
> variants are 8px while their _Default_ is 4px, and the X-large row mixes both. **Per the
> design owner: when the spec is ambiguous, take the smaller value. 4 < 8, so 4px wins.**
>
> This means **4px at every state, on every role** — including hover, pressed, disabled and
> focus. Do not ship an 8px hover radius. `rounded-lg` (8px) is wrong everywhere; use
> `rounded-g-1` (4px).
>
> The four values are available as `--radius-g-1` (4px) · `--radius-g-2` (8px) ·
> `--radius-g-3` (12px) · `--radius-g-4` (16px), added to `src/index.css` `@theme`. The `g-`
> prefix is deliberate: reusing Tailwind's built-in `--radius-sm/md/lg` names would remap
> every existing card and input to larger radii, which is the opposite of this decision.

> **The outline family is one component in three colours.** `Secondary/Outline` (1:11673),
> `Outline Secondary Button` (1:11983) and `Outline Caution Button` (1:11800) are
> _geometrically identical_ — same no-fill, same `#000000 @10%` 1px stroke, same radii and
> heights. They differ **only** in label colour: blue / black / red. They are not broken
> duplicates.

### 2.2 Sizes

| Size    | Padding T/R/B/L | Height | Label |
| ------- | --------------- | ------ | ----- |
| X-small | 8/12/8/12       | 32     | 12px  |
| Small   | 8/16/8/16       | 40     | 14px  |
| Medium  | 12/24/12/24     | 48     | 14px  |
| Large   | 16/32/16/32     | 56     | 16px  |
| X-large | 20/40/20/40     | 64     | 16px  |

Heights are the quick check: **32 · 40 · 48 · 56 · 64.** Tertiary is 24.
Critical's X-large uses `20/24/20/24` (h=64) — narrower horizontally than Primary's
`20/40/20/40`.

### 2.2a Icon-only sizes (extension)

> ### ⚠️ Extension: Figma defines no icon-button role
>
> Every role in §2.1 assumes a text label, so the app's icon-only buttons — hamburger, bell,
> close, chevron, overflow, trash — had nothing to route through. Added on the design owner's
> instruction as **three sizes**, not a new role: they reuse the existing role fills and states
> and differ only in geometry.
>
> | Size      | Box   | Padding | Label |
> | --------- | ----- | ------- | ----- |
> | `icon-sm` | 32×32 | none    | none  |
> | `icon-md` | 40×40 | none    | none  |
> | `icon-lg` | 48×48 | none    | none  |
>
> 24/32/40 squares were all present in the file; 48 is carried over from the button scale
> because 40 is below the 44px touch-target guidance on phones. **No horizontal padding** —
> there is no label to clear — and no text size, since the child is an icon.
>
> `ui/Button` does **not** add an `aria-label` for you. An icon-only button with no accessible
> name is unusable by screen reader and voice control, so pass one explicitly:
>
> ```jsx
> <Button size="icon-md" aria-label="Notifications">
>   <Bell />
> </Button>
> ```

### 2.3 States

| State    | Primary                                             |
| -------- | --------------------------------------------------- |
| Default  | fill `#002fa7`, radius 4px                          |
| Hover    | fill `#002fa7` + `#000000 @6%` overlay, radius 4px  |
| Pressed  | fill `#002fa7` + `#000000 @12%` overlay, radius 4px |
| Focused  | stroke `#0f53ff`, radius 4px                        |
| Disabled | fill **stays `#002fa7`**, radius 4px                |

Black-over-brand overlays resolve to: hover `#002f9b`, pressed `#002b8f`.

Outline/tertiary/tonal all need the same five states. The pressed treatment is a **colour
overlay on the fill**, not a scale transform.

> The hover/pressed overlays are _stacked black fills_, not `opacity` on the element.
> `hover:opacity-90` is **not** the same thing and is not equivalent.

---

## 3. Current compliance

Measured 2026-10-07, re-measured after button sweep batch 1 (2026-10-08).
Full evidence in `design-audit.md`.

> **The button sweep is in progress, one batch per PR.** Batch 1 landed the
> three highest-leverage shared components — `ModalShell` (17 importers),
> `ConfirmDialog` (7), `ConfirmSheet` (3) — which corrects ~54 buttons for
> three file edits. Icon-only buttons (hamburger, bell, close, chevron, trash)
> were deliberately left as raw `<button>` and normalised in place, because Figma
> defined no icon-button role and routing them through `ui/Button` would have meant inventing a
> spec value. **That is no longer true:** §2.2a adds three icon-only sizes, so icon buttons can
> now be migrated like anything else. They are a large share of what remains, so the raw-button
> count will keep outrunning the fixed count for a while — expected, not a stall.

### 3.1 App — `glass-waitlist`

| Metric                                                      | Value                                              |
| ----------------------------------------------------------- | -------------------------------------------------- |
| Raw `<button>` bypassing `ui/Button`                        | 457 (was 450; 141 files) — see note below          |
| `<Button>` component call sites                             | 79 (was 76)                                        |
| Raw buttons matching a Figma role exactly                   | **0**                                              |
| Raw buttons with a `focus-visible` state                    | **6** (was 3) — `ui/Button` sites already pass     |
| Raw buttons with a `:active` colour state                   | **1** shared class string (was 0)                  |
| Raw buttons at the correct 4px resting radius               | **6** (was 2)                                      |
| Buttons matching a Figma size exactly — _(10-07, stale)_    | **0 of 56** filled brand/danger buttons            |
| Raw buttons with no hover despite a fill — _(10-07, stale)_ | 115                                                |
| Raw buttons with no disabled treatment but a fill _(stale)_ | 303                                                |
| Hex literals                                                | 484 occurrences / 229 distinct                     |
| `#db0000` occurrences                                       | **0** — Figma's danger is a token (`bg-danger`)    |
| `#0f53ff` occurrences                                       | **0** — used via `--color-focus` / `outline-focus` |

Rows marked _(stale)_ are carried over from the 10-07 baseline and were
**not** re-measured — they need a per-element fill-and-size sweep rather than
a class count. Every other row was measured after batch 1.

**Read the raw-tag count with care.** It barely moved because the four
hand-rolled buttons `ConfirmDialog` and `ConfirmSheet` gave up became
`ui/Button` call sites rather than disappearing, and one shared class string
(`ModalShell`'s `CLOSE_BTN`) fixed two buttons at once. The honest measure of
batch 1 is **~54 buttons brought into spec from three file edits** — a
leverage ratio the tag count alone cannot show, which is why the radius and
state-class rows below are the ones to watch as the sweep proceeds.

Radius breakdown of raw buttons after batch 1: `rounded-full` 59 (was 61) ·
`rounded-lg` 99 (was 107) · `rounded-xl` 34 (was 45) · `rounded-md` 10 ·
arbitrary `rounded-[10px]` 8 · `rounded-2xl` 5 · `rounded-sm` 2 ·
`rounded-g-1` 1.

Only the first three classes moved in batch 1, and by exactly the six buttons
those three components were rendering by hand.

Counting method: classes within a ±4-line window around each `<button` tag.
JSX attributes are multi-line, so a per-line scan misses most of them — the
same trap that produced the wrong numbers in the original audit.

The single `rounded-g-1` hit is that one shared class string serving two
buttons, and the `active:`/`focus-visible:` counts behave the same way. A
shared constant corrects several buttons per edit — which is the whole reason
batch 1 was sequenced this way, and why later batches will move these numbers
more slowly per file touched than the tag count suggests.

Remaining batches, in order: destructive actions (~30 sites, the highest
visual risk), then `pages/memberApp`, `pages/dashboard`,
`components/dashboard`, `pages/auth` + `pages/onboarding`. Batch 2 is the one
to watch for regressions — it spreads across ~20 files instead of 3, and 12
of them have tests that may assert on the classes being changed.

Each batch carries its own conformance tests, modelled on
`src/__tests__/components/ui/Button.test.jsx`: assert the 4px radius, weight
500 with no 600/700, the five states, and — for a confirm pair — that the
cancel action is the transparent outline role rather than a filled pill.
`ConfirmDialog`, `ConfirmSheet` and `ModalShell` had **no** test coverage
before this sweep, which is how their off-spec buttons survived; those three
now have it. One trap worth recording: `ui/Button` swaps its disabled styling
in at render time instead of carrying a static `disabled:` class, so a
migrated button's disabled state has to be asserted functionally
(`.disabled === true`) rather than by looking for the class.

### 3.2 Marketing — `glass-waitlist-v1`

| Metric                                        | Value                                                     |
| --------------------------------------------- | --------------------------------------------------------- |
| Live `<button>`                               | 30 (no button component exists)                           |
| `<a>`/`<Link>` styled as CTA                  | 4                                                         |
| Buttons matching a Figma size exactly         | **0 of 30**                                               |
| Buttons with `rounded-full`                   | 26 of 34 (76%)                                            |
| Buttons with a focus-visible state            | 1 of 30                                                   |
| Buttons with a `:active` state                | 0 of 30                                                   |
| Buttons with a disabled state                 | 3 of 30                                                   |
| Colour literals                               | 676 occurrences / 225 distinct; **375 (55%) off-palette** |
| `#db0000` / `#0f53ff` / `#001f6e` / `#6b2fb5` | **0 occurrences each**                                    |

Worst file: `organizations/ProblemSection.jsx` — 133 off-spec literals of 157.

---

## 4. Offenders

### 4.1 Critical — wrong colour

| Issue                                                           | Sites                                                                                                                                                                                                                                              |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary CTA inverted to `bg-white` + off-palette navy label     | v1: `Navbar.jsx` ×4, `organizations/Hero.jsx:122`, `members/MembersHero.jsx:154,228`, `common/CTASection.jsx:302,341`, `Footer.jsx:79` — **9 CTAs**                                                                                                |
| Danger rendered with 5 different reds, none `#db0000`           | `bg-danger` `#dc2626` (15 sites), `bg-danger-bright` `#e11d48` (`UsersSection.jsx:58,147`), `bg-[#7f1d1d]` (`UsersSection.jsx:197,397`), `bg-red-600` (`PaystackAccount.jsx:131`), `text-red-500` (`HomeSections.jsx:163`, `Transactions.jsx:190`) |
| `#2547d0` used as a brand blue                                  | v1 `PhoneHeroDemo.jsx` ×8, `MembersProblem.jsx:194` — **19 total both repos**                                                                                                                                                                      |
| `#2535c3`                                                       | `auth/SignUp/EmailPhoneStep.jsx:93` — the exact hex `ui/Button.jsx:7` says it prevents                                                                                                                                                             |
| Scroll-progress gradient spans two banned colours on every page | v1 `Navbar.jsx:101` — `#002FA7 → #4f46e5 → #7c3aed`                                                                                                                                                                                                |
| Red focus ring                                                  | app `memberApp/SideDrawer.jsx:104` — `focus-visible:outline-[#D32F2F]`                                                                                                                                                                             |
| Global focus ring is `#002fa7`, should be `#0f53ff`             | app `src/index.css:282`                                                                                                                                                                                                                            |
| Green button role not in Figma at all                           | app `memberApp/JoinApprovedModal.jsx:17` — `bg-success-strong`                                                                                                                                                                                     |

### 4.2 Critical — wrong radius

`rounded-full` (9999px) on **61 app + 26 marketing** buttons. Figma specifies a 4px rectangle.
The 13 marketing hero/nav CTAs are the most visible: the site's primary action renders as a
stadium. `rounded-xl` (12px, 3× spec) appears on 45 app buttons including every destructive
action — `TwoFactorAuth.jsx:246`, `MyCommunities.jsx:67`, `UsersSection.jsx:58,147`.

### 4.3 Critical — role collapse

**Secondary/outline is implemented as a filled grey pill.** 27 app sites, all of them the
Cancel button next to a primary: `ConfirmDialog.jsx:35` · `AccountsSection.jsx:247` ·
`CommunitiesSection.jsx:101,175,341` · `NotificationsSection.jsx:97,234` ·
`UsersSection.jsx:51,85,140,190` · `SystemConfig.jsx:177` · plus `bg-stacked-container`
copies in `ReconciliationSection.jsx:236`, `ProfileSections.jsx:58,94`,
`CommunityProfile.jsx:328` and `ui/Button.jsx:42`. Spec: transparent + `#000000 @10%` 1px.

Also wrong:

- `UseCases.jsx:405` (v1) — outline with a **white fill at rest** that fills solid blue on
  hover. Backwards, and it inverts to a fill in a state the spec keeps transparent.
- `Security.jsx:155` (v1) — outline that inverts to a solid fill via JS `onMouseEnter`,
  which makes it **unreachable by keyboard** (no focus/pressed counterpart).
- Tertiary role: **0 uses** in either repo.
- Tonal role: **0 uses** in v1. App's `--color-surface-container` (`rgb(255 255 255 / 0.6)`)
  is the only token that matches a Figma role.

**Resolved in sweep batch 1.** `ConfirmDialog`'s Cancel (7 importers) was the
canonical instance of the grey-pill collapse: `rounded-xl` / `bg-gray-100` /
`font-semibold`, sitting beside a confirm button that had already been moved
to `ui/Button`. Both are on `ui/Button` now (`outline-neutral` / `critical`).
`ConfirmSheet`'s pair had the same problem with no states at all. The remaining
grey-pill and `bg-stacked-container` copies listed above are batch 2+ work —
`ReconciliationSection`, `ProfileSections`, `CommunityProfile`, and the
`UsersSection` rows are the biggest clusters left.

### 4.4 Critical — a11y

| Issue                                                                               | Site                                                                                           |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 5 timeline steps clickable by mouse only — no `role`, no `tabIndex`, no `onKeyDown` | v1 `organizations/ProblemSection.jsx:517-524`                                                  |
| 6 dead focusable buttons in a decorative product mock, radius 7px                   | v1 `dashboard-overlay/{MembersScreen:151,175,244, DashboardScreen:88,101, PaymentsScreen:152}` |
| 31 legal-prose links with no hover and no focus                                     | v1 `src/index.css:250-253`                                                                     |

### 4.5 Moderate — sizes and states

- **0 of 56** app filled buttons and **0 of 30** marketing buttons match a Figma size.
  Figma heights are 32/40/48/56/64; the code clusters at 36, 44, 45, 56.
- **Pressed state absent everywhere.** Figma defines it for all six roles.
- Disabled done five inconsistent ways (`opacity-50/40/60/70/10`) plus three invented fills.
- Label sizes outside the 12/14/16px set: `13.5px`, `15px`, `13px`, `10.5px`, `11px`,
  `[clamp(12px,3.5vw,15px)]` — the clamp yields fractional sizes, which no Figma size permits.
- Weight 600/700 on 161 app buttons (`font-semibold` 152, `font-bold` 10) and 9 marketing
  buttons. Spec: **500**. 177 app buttons have no weight class at all.
- `!important` escapes fighting the shared component, 11 occurrences — including a
  **malformed** `!h-` (no value) at `CommunityProfile.jsx:240`, which silently emits nothing.
- v1 `tailwing.config.js` — misspelled, unreferenced, dead, and holds a violet scale that
  matches **0 of 12** Figma colours. `#7c3aed` reached production via copy-paste from it.
  Delete it.

---

## 5. Doing it right

Prefer the shared component over hand-rolled classes:

```jsx
import { Button } from "~/components/ui/Button";

<Button variant="primary" size="md">Pay now</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="critical" size="md" disabled>Delete</Button>
```

Hand-rolled equivalent — the shape to match when a `<button>` genuinely can't go through the
component:

```jsx
<button
  className="h-12 rounded-g-1 bg-brand px-6 text-sm font-medium text-white
             hover:bg-[#002f9b] active:bg-[#002b8f]
             focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f53ff]
             disabled:bg-brand disabled:opacity-60"
>
```

- Radius: `rounded-g-1` (4px). **Always.** Never `rounded-lg`, `rounded-xl`, `rounded-full`.
- Height: `h-8` / `h-10` / `h-12` / `h-14` / `h-16` for 32/40/48/56/64.
- Colour: `bg-brand` / `text-white` / `bg-danger`. Never a raw hex.
- Weight: `font-medium` (500). Never `font-semibold` or `font-bold`.
- Label: 12/14/16px only.
- Every button needs hover, pressed, focus and disabled.
- Focus ring is `#0f53ff`, on the element, with an offset.
- `fullWidth` defaults to **true**. Only pass `fullWidth={false}` when the button is sized
  by its parent — e.g. a `flex-1` sibling in a shared row. Getting this backwards silently
  narrows a stacked action. `ConfirmDialog` and `ConfirmSheet` are the reference pair for
  the two cases: side-by-side in a `flex gap-3` row (`fullWidth={false}` + `flex-1`), and
  stacked in a `flex-col` (default).
- A migrated button's **disabled** state cannot be asserted by looking for a `disabled:`
  class — `ui/Button` swaps the whole variant class at render time. Test it functionally
  (`.disabled === true`). See the note in §3.1.

**Do not** add `active:scale-*` as the pressed state. Do not use `opacity` to fake a hover
overlay. Do not add a new hex without checking §1.5 and §1.6 first.

### Icon-only buttons

A raw `<button>` with an `aria-label` and no text child is acceptable when Figma defines no
matching role (§6.7) — but it still owes everything else in §2: `rounded-g-1`, hover, an
`active:` state, and the `#0f53ff` focus ring. `ModalShell`'s close button is the reference
example: one shared `CLOSE_BTN` class string so both of its variants cannot drift, and both
are given an `aria-label` so neither is an unnamed button.

---

## 6. Open questions for the design owner

1. ~~**Radius 4 vs 8.**~~ **Resolved:** take the smaller value → **4px everywhere**, no 8px
   hover radius. Recorded in §2.1.
2. **`#0f53ff` at 6 uses.** Too low-frequency to treat as a confident token. Applied as the
   global focus ring per §2.1, but confirm it's the intended focus colour and not a one-off.
3. ~~**No success/warning role.**~~ **Resolved as an extension:** `success` and `warning` roles
   added in §2.1 using the file's own dominant green `#008000` and amber `#9a6500`, replacing
   the off-palette `#16a34a`/`#b45309`. Flagged as an extension, not spec.
4. **Success/status palette.** Figma has `#008000`, `#1d6b40`, `#9a6500`, `#ffffdb` in use but
   no coherent scale. Is there a status ramp somewhere else?
5. ~~**Icons and other components.**~~ **Inventoried 2026-10-09:** typography in §7, icons in
   §8, the full component sheet in §9. Still open: the decorative `dashboard-overlay/` mocks
   (inline styles, radius 7) remain exempt — confirm they never need to conform.
6. **Six near-identical navies.** `#0f1d6e`, `#1c2b8a`, `#0b0f2e`, `#0d1a6e`, `#0c1020`,
   `#0d1022`, `#0f1640` all collapse to `#001f6e`. Confirm, since `--color-brand-deep` and
   `--color-brand-night` currently carry extra meaning in dark sections.
7. ~~**No icon-button role exists.**~~ **Resolved as an extension:** three icon-only sizes
   (`icon-sm` 32, `icon-md` 40, `icon-lg` 48) added in §2.2a — square, no horizontal padding,
   full state set, reusing the existing role fills. They are _sizes_ rather than a role, so
   `ui/Button` keeps a single variant axis. The sweep can now migrate every remaining raw
   `<button>`, icon ones included.
8. **Icon glyph scale is provisional (§8.4).** Figma's icon components don't serialize width/
   height via the REST API, so the 16/20/24/32/40 glyph scale is derived from the icon-button
   boxes, not measured. Confirm — especially the normalisation of the app's `w-9` (36px, 60
   sites) and `w-7` (28px, 35 sites).
9. **Dialog radius.** The Figma `Dialog` node carries r=24 — outside the 4/8/12/16 scale and on
   a single node. Code uses 16 (`rounded-2xl`) + 20px sheets. Keeping the code values until
   the owner rules; if 24 is real, §1.5 grows a fifth step.
10. **Marketing display type has no spec.** The Figma file contains app screens only; its
    largest text is 24px. Marketing heroes run `clamp(26px…62px)` and `font-extrabold` (800,
    which §7 bans as above the file's max weight of 700). Sizes stay unruled until the owner
    exports marketing frames; weights should come down to ≤700 now.

---

## 7. Typography

Full-file pass 2026-10-09 — 587 text nodes.

**The file is single-font: Inter.** Every product text node is Inter. The only exception is
one stray `Urbanist` label on the "Color Tonals" annotation — design-sheet chrome, not
product UI.

### 7.1 Scale (product UI)

| Size | Weight | Line-height | Where                               | Freq |
| ---- | ------ | ----------- | ----------------------------------- | ---- |
| 12   | 500    | 14.5–24     | small buttons, chips                | 59   |
| 14   | 400    | 20          | table cells, meta text              | 31   |
| 14   | 500    | 20 / 24     | buttons (small/medium), labels      | 33   |
| 16   | 400    | 24          | body, table cell text               | 77   |
| 16   | 500    | 24          | buttons (large), inputs, prefixes   | 190  |
| 18   | 500    | 21.8–24     | card titles, settings rows          | 16   |
| 22   | 500    | 28          | table titles, dialog titles, values | 11   |
| 24   | 500    | 29          | rare                                | 2    |

Weights present: **400, 500, 600** (2 nodes), **700** (names/emails in mock data + one C2
chip). **500 is the default.** 400 for body/table text. 600/700 appear only in mock data and
annotations — do not promote them to product headings without the owner saying so.

Letter-spacing: body is 0; the 12/14px button labels carry ~1% (Figma stores 0.012–0.014 px
at those sizes). `ui/Button` applies none today — provisional, do not invent tracking
elsewhere.

### 7.2 Code verdicts

| Item                                       | Verdict                                                                                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inter via `--font-sans`                    | **Fine.** Both repos, loaded via `@fontsource` in `main.jsx` (never CSS `@import`).                                                                                       |
| `--font-dm` (DM Sans) + `.font-dm`         | **Change: delete.** Zero Figma use. Declared in both `index.css`; used by nothing.                                                                                        |
| `--font-playfair` + `.font-playfair`       | **Change: delete.** Same.                                                                                                                                                 |
| `--font-urbanist` + `.font-urbanist`       | **Change (1 site).** `WhyGlass.jsx:81` in both repos wraps a landing section in `font-urbanist`. Figma has no Urbanist product text. Switch to Inter — visible but small. |
| Marketing display sizes `clamp(26px…62px)` | **Not banned — out of file.** See open question §6.10.                                                                                                                    |
| `font-extrabold` (800), 3 sites in v1      | **Change: use 700.** 800 exceeds the file's max weight.                                                                                                                   |
| Buttons 12/14/16px @ weight 500            | **Fine** — §2.2 already enforces this.                                                                                                                                    |

---

## 8. Icons

### 8.1 Library: lucide-react — keep it

The code's icon library is **`lucide-react`** (122 files in the app, 7 in v1). Keep it. The
Figma Icons section (`1:4232`, ~58 components) is a grab bag of iconify sets —
`material-symbols-light`, `lets-icons`, `iconamoon`, `vuesax`, `fluent`, `tdesign`, `weui` —
plus hand-drawn vectors. Rebuilding on those sets would mean adding seven icon dependencies
and restyling every surface. The spec is the **shape**, not the source: match the mapping
below.

### 8.2 Mapping — Figma name → lucide

| Figma                                   | lucide          | Notes                      |
| --------------------------------------- | --------------- | -------------------------- |
| `Icon/Add`                              | `Plus`          |                            |
| `Icon/Remove`                           | `Minus`         |                            |
| `Icon/Dropdown`, `formField/Dropdown`   | `ChevronDown`   |                            |
| `Icon/Back`, `Mobile Back Button`       | `ChevronLeft`   |                            |
| `Icon/Arrow`                            | `ArrowRight`    |                            |
| `Icon/Cancel`                           | `X`             |                            |
| `Icon/Menu`                             | `Menu`          |                            |
| `Icon/Copy`                             | `Copy`          |                            |
| `Icon/Download`, `Icon/Download2`       | `Download`      |                            |
| `Icon/Email`                            | `Mail`          |                            |
| `Icon/Call`                             | `Phone`         |                            |
| `Icon/Notification`                     | `Bell`          |                            |
| `Icon/Filter`                           | `Filter`        |                            |
| `Icon/SendReminder`                     | `Send`          |                            |
| `InputField/Search`                     | `Search`        |                            |
| `formField/Calender`                    | `Calendar`      |                            |
| `formField/showPassword`                | `Eye`           |                            |
| `formField/hidePassword`                | `EyeOff`        |                            |
| `formField/Verified`, `SmallVerified`   | `BadgeCheck`    |                            |
| `dropdownMenuIcon/Delete`               | `Trash2`        |                            |
| `dropdownMenuIcon/Edit`                 | `Pencil`        |                            |
| `dropdownMenuIcon/Pause`                | `Pause`         |                            |
| `dropdownMenuIcon/time`                 | `Clock`         |                            |
| `dropdownMenuIcon/memberList`           | `Users`         |                            |
| `navMenuIcons/Category`                 | `LayoutGrid`    |                            |
| `navMenuIcons/Members`, `Users`         | `Users`         |                            |
| `navMenuIcons/User`                     | `User`          |                            |
| `navMenuIcons/Payments`                 | `CreditCard`    |                            |
| `navMenuIcons/Autopay`                  | `RefreshCw`     |                            |
| `navMenuIcons/PayoutAccount`            | `Wallet`        |                            |
| `navMenuIcons/Role`                     | `UserCog`       |                            |
| `navMenuIcons/Security`                 | `Shield`        |                            |
| `navMenuIcons/Community`                | `Building2`     | confirm per surface        |
| `navMenuIcons/Settings`                 | `Settings`      |                            |
| `PopUpIcon/Caution`                     | `AlertTriangle` |                            |
| `PopUpIcon/Info`, material-symbols info | `Info`          |                            |
| `StatusIcon/Checkmark`                  | `CheckCircle2`  | see §8.3 for illustrations |

### 8.3 Status & selection icons are illustrations, not glyphs

`StatusIcon/*` (Checkmark, AddUser, Plans, Amount, failedPayments, Time, InactiveUser,
Users), `SelectionCard/*` (Recurring, Persons, Memberadd, NonPaying, PayingMember, Flash),
`FeedbackIcon/Success` and `PopUpIcon/*` are **multicolour filled illustrations**, not line
glyphs. `common/SuccessBadge.jsx` is already the reference implementation of
`FeedbackIcon/Success` — it was measured off the design asset (seal bbox, check polyline,
accent positions); keep it in sync if that asset ever changes. For the rest, use a coloured
lucide glyph inside a status-wash circle (`bg-<wash>` + `text-<status>`, palette §2.1
extension note and §9.1) until the owner exports real assets. **Do not hand-trace vectors.**

### 8.4 Sizes

Glyph boxes do not serialize in the REST payload (width/height null on all 58 icon
components), so this scale is **provisional** (open question §6.8), derived from the
icon-button boxes (§2.2a) and the button label scale:

| Step      | Glyph | Tailwind |
| --------- | ----- | -------- |
| `icon-xs` | 16    | `w-4`    |
| `icon-sm` | 20    | `w-5`    |
| `icon-md` | 24    | `w-6`    |
| `icon-lg` | 32    | `w-8`    |
| `icon-xl` | 40    | `w-10`   |

Glyph inside a §2.2a icon-only button: box − 16px padding budget → 16 / 24 / 32 for
`icon-sm`/`icon-md`/`icon-lg` buttons.

Observed in the app: `w-9` (36px) ×60 and `w-7` (28px) ×35 — both off-scale. **Change to the
nearest step** (36 → 32 or 40; 28 → 24 or 32) when the file is already open for other work.
`w-4`/`w-5`/`w-6`/`w-8`/`w-10` are fine. Icons on touch targets keep the 44px minimum
(§2.2a rationale).

---

## 9. Components

Full inventory of the Components section (`1:12168`), 2026-10-09. Verdicts: **fine** (exists,
conforms) · **change** (exists but diverges — action named) · **missing** (no shared
counterpart; values below are the spec when it gets built) · **n/a** (asset or exempt).

### 9.1 Badges — the palette is the spec

| Badge                         | Fill                | Label     | Radius | Code verdict                                     |
| ----------------------------- | ------------------- | --------- | ------ | ------------------------------------------------ |
| Status = Paid                 | `#ccffcc`           | `#008000` | 4      | **missing** — ad-hoc spans, no shared chip       |
| Status = Unpaid               | `#ffcccc`           | `#db0000` | 4      | **missing**                                      |
| Status = Pending              | `#ffffdb`           | `#9a6500` | 4      | **missing**                                      |
| Role = Member                 | `#ffffdb`           | `#9a6500` | 4      | **missing** — yes, Member is amber, like Pending |
| Role = Admin                  | `#e4d7f4`           | `#6b2fb5` | 4      | **missing**                                      |
| Freq = Weekly                 | `#ccdaff`           | `#002fa7` | pill   | **missing**                                      |
| Freq = Monthly                | `#ffffdb`           | `#9a6500` | pill   | **missing**                                      |
| Freq = One-time               | `#e4d7f4`           | `#6b2fb5` | pill   | **missing**                                      |
| Mobile payment Success/Failed | same as Paid/Unpaid | —         | 4      | **missing**                                      |

Pills are legal here (§1.5 carve-out). Frequency-badge text is 14/500; status chips 16/500.

### 9.2 Inputs & controls

| Component                 | Figma                                                                          | Code                                            | Verdict                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Input fields              | r=4; fill white@60% **or** outline `#000000@20%`; placeholder 16/500 black@60% | `ui/TextInput` — `rounded-lg` (8px)             | **change**: radius → `rounded-g-1` (4px). Keep the border-colour focus rule (AGENTS.md) — do not add a ring. |
| Input + Label             | 5 types × L/S; active stroke `#002fa7`                                         | TextInput + inline labels                       | **fine** — `focus:border-brand` already matches                                                              |
| DIgital input Field (OTP) | digit cells                                                                    | `common/OtpBoxes` + `otpBoxesRenderer`          | **fine**                                                                                                     |
| Toggle + State / + Size   | track pill r=100; on `#002fa7`, off `#000000@10%`; knob white                  | `common/Toggle` — on brand ✓, off `bg-gray-300` | **change**: off track → `bg-black/10`                                                                        |
| Segmented Control         | r=4; active white@60%, inactive transparent; text black@60% / black            | dashboard tabs ad-hoc                           | **missing** — build on first dashboard-tab touch                                                             |
| Checkbox                  | box + checked/unchecked/cancel states                                          | none shared                                     | **missing**                                                                                                  |
| Selection Card            | selected/default                                                               | member-add flows hand-roll                      | **missing**                                                                                                  |
| Checkmark set             | checked / unchecked / cancel                                                   | lucide `Check` / `Minus`                        | **fine** via §8 mapping                                                                                      |

### 9.3 Overlays & menus

| Component              | Figma                                                         | Code                                                                    | Verdict                                                                                           |
| ---------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Dialog                 | r=**24**, fill white@60% + `#000000@10%` stroke; title 22/500 | `ModalShell`/`GlassModal`: `rounded-2xl` (16), sheet `rounded-t-[20px]` | **keep code for now** — 24 is outside the §1.5 scale and appears on one node (open question §6.9) |
| Input Modal            | form dialog                                                   | `GlassModal`                                                            | **fine**                                                                                          |
| Dropdown Menu + Labels | default / critical rows                                       | dashboard overflow menus ad-hoc                                         | **missing**; critical row = `text-danger`                                                         |
| Mobile Back Button     | chevron-in-circle                                             | member app back (`goBackInApp`)                                         | **fine**                                                                                          |

### 9.4 Feedback & status

| Component              | Figma                                                | Code                           | Verdict                                        |
| ---------------------- | ---------------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| Banner/Feedback        | fill `#ccdaff`, stroke `#002fa7@20%`, r=4            | app banners ad-hoc             | **missing**                                    |
| Banner/Action          | same family, action variant                          | ad-hoc                         | **missing**                                    |
| Notifications row      | unread `#f3f4f6` r=8; read outline `#000000@10%` r=8 | `dashboard/NotificationsPanel` | **change**: align unread/read states per Figma |
| status Icons (L/S)     | coloured illustrations                               | lucide + wash (§8.3)           | **fine** per §8.3                              |
| Helper Texts with Icon | check icon + helper line                             | TextInput error state only     | **change**: add optional helper line           |

### 9.5 Structure

| Component                     | Figma                                                                         | Code                          | Verdict                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------- |
| Navigation Menu/Header        | sidebar nav + topbar                                                          | `dashboard/Sidebar`, `Topbar` | **fine** — adopt §8 mapping for `navMenuIcons/*`                        |
| Table Header / Cells          | payment status / period / text cells                                          | dashboard tables ad-hoc       | **missing** — build on first table touch                                |
| Settings Card                 | r=4, white@60% + `#000000@10%`, chevron                                       | settings rows ad-hoc          | **change**: shared card on next settings pass                           |
| Drop-In Box / Upload Link Bar | states: dropping/on-drop/default/dropped; default/disabled/uploading/uploaded | KYC upload flows hand-roll    | **missing**                                                             |
| Community Logos               | asset set                                                                     | `src/assets`                  | **n/a** (assets)                                                        |
| Social Button (Google)        | r=8, white@60% + `#000000@10%`, label 16/500                                  | SignUp Google button          | **change**: verify radius/fill (r=8 is legal — Social is not a §2 role) |

### 9.6 Exempt

The `dashboard-overlay/` product mocks (inline styles, radius 7) stay **exempt** — decorative
reference renders, not conformance targets (§6.5).
