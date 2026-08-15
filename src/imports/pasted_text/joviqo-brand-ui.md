# Figma Make — Prompt 00: Joviqo Design System "Cinema Rainbow"
### Paste this block at the TOP of every other prompt (01–04)

> Shared brand + UI foundation. Do not run alone. Copy this whole block above whichever surface prompt you are running so all screens stay consistent.

---

**BRAND & UI FOUNDATION — JOVIQO**

Joviqo is a kids-first video + learning platform for South Africa. Tagline: **Play · Learn · Win · Connect**. The interface follows the **modern cinematic streaming-app pattern** — a dark, immersive, poster-led browse experience with a full-bleed hero billboard and horizontally scrolling content rows. Think premium streaming service, rebuilt for children and learning, carrying Joviqo's rainbow brand identity instead of a single flat accent color.

**Do not copy any existing streaming service's logo, wordmark, typeface, red brand color, or any of its titles, artwork or characters.** Use only the Joviqo palette and original placeholder content described below.

**Colors**
- Cinematic base: Void `#0B0B0F` (page), Charcoal `#14141B` (surface), Slate `#1E1E28` (raised card), Hairline `#2A2A36` (borders)
- Text: Snow `#FFFFFF`, Silver `#B3B3BE` (secondary), Grey `#6E6E7A` (muted)
- Brand colors (from the Joviqo logo): Joy Orange `#FF8A00` · Sun Yellow `#FFC20E` · Leaf Green `#56B44A` · Deep Green `#2E8B3A` · Sky Blue `#1E88C7` · Berry Red `#E63E54` · Magenta `#E5399B`
- **Brand gradient** (the signature accent, replacing any single-color accent): Orange → Yellow → Green → Blue. Used for: primary buttons, active nav underline, progress bars, video scrubbers, XP fills, streak flame, focus rings, and celebration states.
- Kids Mode uses the same dark cinematic base but with **higher color saturation**: brand-colored tile borders, vivid illustrated artwork, and glow accents so it reads as playful rather than adult.
- Semantic: Success `#56B44A` · Warning `#FFC20E` · Danger `#E63E54`

**Typography**
- Headings & titles: **Baloo 2**, 700 — rounded and friendly, keeps the kid brand personality against the dark cinematic canvas
- Body & UI: **Nunito**, 400/600/700
- Scale: 56 (hero title) / 40 / 32 / 24 / 20 / 16 / 14 / 12. Tight leading on hero titles. Tabular figures for stats.

**Cinematic browse patterns (apply everywhere content is listed)**
- **Hero billboard:** full-bleed 16:9 artwork at the top of every browse page with a bottom-to-top dark gradient scrim (`#0B0B0F` at 95% fading to transparent), title treatment, one-line synopsis, metadata chips (age band, subject, duration), and two buttons: gradient-filled **Play** and glass **More info**.
- **Content rows:** horizontally scrolling rows with a row title above, arrow controls appearing on hover at each edge, and partial cards bleeding off the right edge to signal scroll.
- **Card hover expand (desktop):** on hover a tile scales to about 1.35×, lifts with a soft shadow, plays a silent preview loop, and reveals a control bar (Play, Add to My List, Like, More info) plus title, match/suitability chip, and tag line. Neighbouring cards slide aside. Include the collapsed and expanded states as separate components.
- **Detail modal:** clicking a tile opens a large centered modal — hero video area at the top, then title, description, cast/creator, subject tags, episode or lesson list, and a "More like this" grid.
- **Top nav:** transparent over the hero, transitioning to solid `#0B0B0F` on scroll. Left: Joviqo logo. Center: nav links. Right: search, notifications, profile avatar with dropdown.
- **Profile gate:** a dark full-screen "Who's watching?" grid of large square avatars with rounded corners, name beneath, plus a Manage Profiles button.

**Shape, elevation, motion**
- Radius: 4–8px on media tiles (cinematic, near-square), 12–16px on panels and modals, pill buttons, 999px on kids-mode play controls
- Elevation: deep soft black shadows `0 12px 40px rgba(0,0,0,0.6)`, plus a subtle brand-gradient glow on focused/active elements
- Motion: 200ms ease-out for hover expand, 320ms for modal open, gradient shimmer skeletons while loading, confetti and sparkle bursts on achievements

**Mascot — "Jovi"**
A rounded TV / speech-bubble character with a single antenna topped by a yellow ball, one winking eye, a wide smile, drawn with a rainbow gradient outline that glows against the dark background. Poses: happy, winking, celebrating with confetti, thinking, sleeping, gently encouraging. Jovi appears in onboarding, empty states, quiz feedback, level-ups, bedtime lock and error screens.

**Signature Joviqo details (so it is not a generic streaming clone)**
- Rainbow gradient replaces the usual single accent color everywhere
- Progress on any partially watched tile shows as a gradient bar across the tile's bottom edge
- Achievement sparkles derived from the logo's antenna tick marks
- Kids tiles carry a small green **Reviewed** shield badge indicating human moderation
- Learning content tiles show a gradient completion ring in the top-right corner instead of a runtime badge

**Accessibility**
WCAG AA contrast on the dark base; body text minimum 16px (20px in kids screens); tap targets minimum 48px (56px kids); visible gradient focus rings; full keyboard navigation; `prefers-reduced-motion` disables hover-expand previews and confetti.

**Global rules**
Do not use shadcn, Material, Bootstrap or Ant defaults. All currency in South African Rand (R). Dates DD/MM/YYYY. Numbers formatted with spaces (12 480).