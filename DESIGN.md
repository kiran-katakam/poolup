---
name: PoolUp
description: An auto-rickshaw fare meter as an app; find a pool, watch the per-head fare drop as batchmates join.
colors:
  auto-yellow: "#ffc928"
  meter-ink: "#141414"
  cool-ground: "#ececec"
  warm-line: "#dedad0"
  field-stroke: "#77725f"
  muted-ink: "#4a4a4a"
  seat-go: "#1e6f3e"
  fault-red: "#a3221a"
  card-white: "#ffffff"
  ink-hover: "#2b2b2b"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.05
  route:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.1
  button:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    letterSpacing: "0.06em"
  meter:
    fontFamily: "Roboto Mono, ui-monospace, monospace"
    fontSize: "28px"
    fontWeight: 700
  time:
    fontFamily: "Roboto Mono, ui-monospace, monospace"
    fontSize: "13px"
    letterSpacing: "-0.03em"
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  meta:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 600
rounded:
  field: "6px"
  button: "8px"
  card: "10px"
  seat: "3px 3px 6px 6px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  tap: "44px"
  control: "48px"
components:
  button-primary:
    backgroundColor: "{colors.meter-ink}"
    textColor: "{colors.auto-yellow}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    height: "48px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-outline:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.meter-ink}"
    rounded: "{rounded.button}"
    height: "48px"
  button-outline-hover:
    backgroundColor: "{colors.auto-yellow}"
  field:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.meter-ink}"
    rounded: "{rounded.field}"
    height: "48px"
    padding: "0 12px"
  pool-card:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.card}"
    padding: "12px"
  meter-panel:
    backgroundColor: "{colors.meter-ink}"
    textColor: "{colors.auto-yellow}"
    typography: "{typography.meter}"
    width: "112px"
  header-bar:
    backgroundColor: "{colors.auto-yellow}"
    textColor: "{colors.meter-ink}"
---

# Design System: PoolUp

## Overview

**Creative North Star: "The Auto Fare Meter"**

The app is the auto itself. Every pool carries its own fare meter: a black panel with yellow monospace digits showing the rupees each person pays right now. The chrome borrows the vehicle's body: an auto-yellow header over a black "hood" band, a cool grey ground like tarmac, white cards like paper receipts, and seat pips shaped like the back bench. It is built phone-first (390px, a 480px column on anything wider) for use outdoors, so contrast and tap size outrank decoration.

The mood is utilitarian and batchmate-casual: high contrast, flat, no ornament that does not carry information. Yellow and black do the identifying; green appears only to say seats remain; red only to say something failed.

**Key Characteristics:**
- Flat: no shadows anywhere; depth is a 1px warm border and the black meter block.
- Yellow-on-black is the signature pairing (header, primary button, meter digits, selected states).
- Condensed display face for routes and buttons, mono for money, times and codes, system sans for prose.
- One motion: the fare figure steps down once when someone joins.
- 44px minimum tap targets, 48px controls, visible 3px ink focus ring.

## Colors

A two-tone vehicle palette (yellow, black) on a cool grey ground, with two functional signals.

### Primary
- **Auto Yellow** (`auto-yellow`): header bar, text selection, outline-button hover, the meter digits, the pressed segment of choice controls. Never body-text colour on light surfaces.

### Neutral
- **Meter Ink** (`meter-ink`): all text, primary buttons, the hood band, the meter panel, the focus ring and filled seat pips.
- **Cool Ground** (`cool-ground`): page background; deliberately cool grey, never cream.
- **Card White** (`card-white`): cards, fields, outline buttons.
- **Warm Line** (`warm-line`): the thin card border; the only warm tone, kept hairline.
- **Field Stroke** (`field-stroke`): input borders, darker than Warm Line so fields meet non-text contrast.
- **Muted Ink** (`muted-ink`): secondary text (times, creator, helper copy, "Full").
- **Ink Hover** (`ink-hover`): primary button hover.

### Functional
- **Seat Go** (`seat-go`): only the "N seats left" text.
- **Fault Red** (`fault-red`): error and failure messages, bold.

### Named Rules
**The Two-Signal Rule.** Green means seats are left; red means something is wrong. Neither decorates, neither styles a button.
**The Yellow-On-Ink Rule.** Yellow text only sits on ink (buttons, meter, selected segments). On white or grey, yellow is a fill, never a text colour.

## Typography

**Display Font:** Barlow Condensed 600/700 (fallback Arial Narrow, sans-serif)
**Body Font:** system sans stack (system-ui, Segoe UI, Roboto)
**Mono Font:** Roboto Mono (fallback ui-monospace)

**Character:** a roadside-signage condensed face for places and actions, a taxi-meter mono for every number that matters, and an unadorned system face so prose stays quick and local.

### Hierarchy
- **Display** (700, 34-40px, 1.05, balanced wrap): page and landing headlines.
- **Title** (700, 24-28px): section heads, wordmark (28px, 0.04em tracking, uppercase "POOLUP").
- **Route** (700, 21px, 1.1): "Place -> Place" on pool cards.
- **Button** (700, 20px, 0.06em, uppercase): all buttons.
- **Meter** (mono 700, 28px on cards up to 56px in the pool-detail meter block, tabular figures): the fare.
- **Time / code** (mono, 13-15px; invite-style codes at 20px with 0.3em tracking): windows, codes.
- **Body** (15px, up to 17px for intro copy, 1.625 leading on prose): general copy.
- **Meta** (13-14px, 600 for status): creator, seats-left line, helper text.
- **Meter caption** (11-12px, 0.12-0.14em tracking, uppercase, "EACH NOW"): the label attached to the meter figure only.

### Named Rules
**The Mono-For-Money Rule.** Any rupee amount, time window or code is Roboto Mono with tabular figures; routes and buttons are Barlow; nothing else is.

## Layout

Single column, centred, `max-width: 480px`, 16px side padding, 24px top and bottom. Vertical rhythm moves on a 4/6/12/16/24px scale. Pool cards are one per row: a flexible left column (route, time, creator, seat pips, seats-left) and a fixed 112px meter column on the right. The main call to action is fixed to the bottom edge of the viewport over a ground-to-transparent fade. Controls are 48px tall; links and nav items are at least 44px. The header is a yellow bar with a 10px ink band beneath it on every page.

## Elevation & Depth

Flat. There are no shadows. Depth comes from the 1px Warm Line border on white cards (border darkens to ink on card hover), the solid black meter column, and the yellow/black header stack. A bottom fade behind the fixed action keeps content from colliding with it; it is not a surface.

### Named Rules
**The No-Shadow Rule.** Separation is border, colour block or spacing; never blur.

## Shapes

Softly squared, never pill. Cards 10px, buttons 8px, fields 6px. Cards clip their children so the black meter column meets the card edge. Seat pips are 22x14px with a 3px top / 6px bottom radius (a back-bench seat), 2px border: outlined = free, filled = taken (ink on cards, yellow on ink panels). Segmented choice controls are ink-bordered with 2px dividers and fill ink with yellow text when selected.

## Components

### Buttons
- **Shape:** 8px radius, full width, 48px tall, 0 16px padding.
- **Primary:** ink fill, yellow Barlow uppercase text 20px/0.06em. Hover lightens to `#2b2b2b`. Disabled: 60% opacity, wait cursor.
- **Outline:** white fill, 2px ink border, ink text; hover fills Auto Yellow.
- **Focus:** global 3px ink outline, 2px offset.

### Pool card
White, 10px radius, hairline border, two-column grid (flexible, 112px). Left: route, mono window, creator ("Your pool" / "Name's pool"), seat pips, seats-left in green or muted "Full". Right: ink meter panel with yellow mono fare and white "EACH NOW" caption. Whole card is a link; hover turns the border ink.

### Fare meter
Yellow mono bold figure on ink. When the value falls, the new figure drops in from 0.45em above in 200ms with `cubic-bezier(0.16, 1, 0.3, 1)`; it plays once and is disabled under reduced motion. Seat pips animate fill colour over 200ms.

### Inputs / Fields
White, 1px Field Stroke border, 6px radius, 48px min height, 16px text, ink caret. Focus: border turns ink with the ink outline flush (0 offset). Selects replace the native arrow with an ink chevron. Code entry fields are mono, 20px, 0.3em tracking.

### Navigation
Yellow bar, 480px inner column. Left: "POOLUP" wordmark linking to /pools when signed in, / otherwise. Right: Pools link (hidden on /pools), first name, a dot, Log out; or Log in when signed out. Links 15px/600, underline on hover with 4px offset. Same on mobile and desktop.

### Links
Bold 600, underlined with 2px thickness and 3px offset.

## Do's and Don'ts

### Do:
- **Do** show money as Roboto Mono ₹ figures, in the ink meter panel wherever a per-head fare is the point.
- **Do** keep seats as back-bench pips (outlined free, filled taken) rather than a count alone.
- **Do** keep tap targets at 44px or more and controls at 48px.
- **Do** put yellow text only on ink; use yellow as a fill elsewhere.
- **Do** confine motion to the single 200ms fare step-down and the pip fill, both disabled under reduced motion.

### Don't:
- **Don't** use shadows, gradients as surfaces, pill buttons, or a green "Join" button; green is only for seats left.
- **Don't** use cream or warm backgrounds; the ground is cool grey.
- **Don't** set body prose in Barlow or Roboto Mono.
- **Don't** add a second accent colour.

### Not canonized (defects or one-offs in the build)
- The fixed bottom action's ground fade is a one-off gradient, not a rule for new surfaces.
