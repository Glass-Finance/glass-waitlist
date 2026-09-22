# Handoff: Glasspay "Phone in Hand" Auto-Playing App Demo

## Overview

A marketing hero for glasspay.app: a photo of a hand holding an iPhone, with the member app rendered **live inside the phone screen**. The screen auto-plays a looping ~57s tour of the member workflow — scrolling the home page, opening screens, showing tap indicators — as if a real user were using the app.

## About the Design Files

The files in this bundle are **design references created in HTML** — a working prototype showing intended look and behavior, not production code to copy directly. Recreate this in the target codebase's environment (e.g. a React component on the glasspay.app landing page) using its established patterns. `Glasspay Phone Hero.dc.html` is the reference implementation; its `<x-dc>` template body is plain HTML with inline styles and its logic class is plain React-style JS — both port directly to a React component.

## Fidelity

**High-fidelity.** The home screen is a pixel-accurate recreation of the app's Home page; all other screens are real app exports (PNGs in `assets/`). Timings, easings, and coordinates below are final.

## How It Works (core technique)

1. **Base image**: `assets/iphone.png` (876×791, transparent PNG) rendered at natural size, bottom-anchored, centered.
2. **Live screen overlay**: a `div` of logical size **393×852** (iPhone screen), `transform-origin: 0 0`, `border-radius: 56px`, `overflow: hidden`, mapped onto the photo's tilted screen with a CSS `matrix3d` **homography** computed from four corner points (in image pixel coords):
   - top-left (628, 29), top-right (856, 5), bottom-left (476, 566), bottom-right (703, 560)
   - The `homography(w, h, corners)` function in the reference file computes the matrix3d string (standard 4-point projective mapping: basisToPoints / adjugate method). Port it verbatim.
3. **Scenes**: inside the screen div, the home page is the base layer; every other screen is an absolutely-positioned full-size `<img>` of a real app export that slides in/out with `transform: translateX(105%) ↔ 0`, `transition: transform 480ms cubic-bezier(0.32,0.72,0.3,1)`, `box-shadow: -24px 0 48px rgba(0,0,0,0.14)` (iOS push feel). The drawer slides from the left (`translateX(-105%)`) with a scrim (`rgba(10,12,30,0.35)`, 420ms opacity fade). The receipt slides up from the bottom (`translateY(105%) ↔ 0`, 520ms) as a sheet on an `#E9EBF2` backdrop, receipt image 361px wide, radius 12px.
4. **Home scroll**: the home content wrapper animates `translateY` between 0 and `-(scrollHeight − 852)` with `transition: transform 2.2s cubic-bezier(0.45,0,0.2,1)`.
5. **Tap indicator**: a 44px circle (`rgba(28,43,138,0.30)`, 2px `rgba(255,255,255,0.75)` border) shown at each tap point for 650ms with a scale 0.4→1→1.15 + fade keyframe (600ms).
6. **Status bar**: fixed on top of everything — black dynamic-island pill 125×37 at top:11px centered (radius 20), "9:41" at (42, 20) 15px/600, battery glyph top-right. `pointer-events: none`.
7. **Notification tabs**: the notification center is one sliding container holding three stacked screen images (payments/community/invites) crossfaded via `opacity`, 220ms.

## Timeline (one loop, ms — see `loop()` in the reference file for exact code)

| t           | action                                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1000–7750   | tap bell (355,78) → notifications in; tab to Community (196,136) at 3200; tab to Invites (318,136) at 5000; back (40,68) → out                                                  |
| 8500        | home scrolls to bottom                                                                                                                                                          |
| 11600–18850 | tap history row (196,620) → Transaction Details; tap Share Receipt (196,708) → receipt sheet up (2.8s) → down; back → details out                                               |
| 19400       | home scrolls back to top                                                                                                                                                        |
| 21900–32050 | tap Pay Now (196,430) → Payment Summary; tap Make Payment (196,545) → Success; tap Share Receipt (196,776) → receipt sheet; tap Back to Home (196,706) → success + summary out  |
| 33200–38550 | tap menu (30,78) → drawer in; tap Manage Payments (100,180) → drawer out, Manage Payments in; back → out                                                                        |
| 39600–56050 | tap menu → drawer; tap Settings (72,236) → Settings in; tap Profile (196,233) → in/back; tap My Communities (196,784) → in/back; tap Auto-Pay (196,612) → in/back; settings out |
| 57300       | loop restarts                                                                                                                                                                   |

All tap coordinates are in the 393×852 screen space. Implement as a `setTimeout` chain rebuilt each loop (clear all timers on unmount).

## Home Screen Spec (the only hand-built screen)

- Page bg `#F7F8FC`; font Helvetica/Arial. Top padding 64px (status bar clearance).
- **Top bar**: hamburger (3 bars, 24px wide, 2.5px, `#222`); community pill: 28px square radius-6 `#1C2B8A` with "K", name 14px/500 `#111`, chevron; bell in 38px white circle, shadow `0 1px 4px rgba(0,0,0,0.1)`, red badge `#EF4444` 15px, count "2".
- **Greeting**: "Hi David," 24px/500 `#111`; "Here's Your Community At A Glance" 13px `#888`.
- **Hero card**: white, radius 16, border `#ECEDF3`, shadow `0 1px 6px rgba(0,0,0,0.05)`; top half has 1.5px `#2547D0` border on top/left/right only; "Recurring" pill with 6px `#7C3AED` dot; "Next Payment Due" 13px `#6B7280`; **₦15,000** 42px/700 `#111827`, letter-spacing −1px; "Alumni Contribution" badge `#D7E2FF`/`#2547D0` 12px radius 8; clock + "Due: June 1, 2025" 12px `#9CA3AF`; full-width Pay Now button `#2547D0`, 14px pad, radius 6, 15px/600 white.
- **Upcoming Payments card**: bg `#F1F2F7`, radius 16; header 14px/600 + count badge `#E4E7F9`/`#1C2B8A`; white rows radius 8, amount 17px/700, name 13px `#333`, due 12px `#999`; badges: Recurring `#E8ECF8`/`#1C2B8A`, One-time `#F3E5F5`/`#9C27B0`; outline Pay Now button 1.5px `#2547D0`. "View All" 13px/600 `#1C2B8A` centered.
- **Payment History card**: same container; rows 13px vertical padding, divider `#E4E5EC`; description 14px/500, date 12px `#999`, amount 14px/700, "Success" badge `#ECFDF5`/`#059669`.
- Data rows: Upcoming — ₦2,500/month Infrastructure Development (Recurring), ₦8,000 School Fees Support (One-time), ₦5,000/month Sports Complex Levy (Recurring). History — Alumni Contribution ₦15,000 (May 1), Infrastructure Development ₦2,500 (Apr 15), Alumni Contribution ₦15,000 (Apr 1), Infrastructure Development ₦2,500 (Mar 15).

## Design Tokens

- Brand blue `#2547D0`; deep blue `#1C2B8A`; badge blue bg `#D7E2FF` / `#E4E7F9` / `#E8ECF8`
- Danger `#EF4444`; success `#059669` on `#ECFDF5`; purple `#7C3AED` / `#9C27B0` on `#F3E5F5`
- Text: `#111`/`#111827` primary, `#333`, `#6B7280`, `#888`/`#999`/`#9CA3AF` muted
- Surfaces: `#F7F8FC` page, `#F1F2F7` card, `#fff` rows, borders `#ECEDF3`/`#E4E5EC`
- Radii: 16 cards, 8 rows/badges, 6 buttons, 999 pills, 56 screen corners

## Assets (all in `assets/`)

`iphone.png` (hand photo), `screen-transaction-details.png`, `screen-payment-summary.png`, `screen-success.png`, `screen-settings.png`, `screen-autopay.png`, `screen-manage-payments.png`, `screen-profile.png`, `screen-my-communities.png`, `drawer.png` (334px wide, left-anchored), `receipt.png`, `notifications-payments.png`, `notifications-community.png`, `notifications-invites.png`. All screen exports render at `width/height: 100%; object-fit: cover; object-position: top center` inside the 393×852 screen.

## State Management

- `homeScroll: number` — home page translateY
- `ov: { details, summary, success, settings, autopay, drawer, manage, receipt, profile, communities, notif }` — booleans, one per overlay
- `notifTab: 'payments' | 'community' | 'invites'`
- `tap: {x, y} | null` — cleared 650ms after set
- Timer array for the loop; clear on unmount. No data fetching.

## Files

- `Glasspay Phone Hero.dc.html` — reference implementation (template between `<x-dc>` tags + `Component` logic class; ignore the `support.js` include, it's the prototype runtime)
- `assets/` — all images
