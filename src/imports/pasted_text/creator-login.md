# Figma Make — Prompt 03: Joviqo Creator Studio — DESKTOP LOGIN

> Paste **Prompt 00 (Design System)** first, then this block underneath it.
> Surface: content creator dashboard, desktop web (1440 × 1024), with a 1024px tablet breakpoint.

---

**BUILD: Joviqo Creator Studio — desktop web dashboard, cinematic dark UI**

Build a fully clickable desktop dashboard for **Joviqo Creator Studio**, where individual creators in South Africa upload videos, build learning paths and quizzes for kids, track performance and manage earnings. Apply the cinematic dark design system: Void `#0B0B0F` page, Charcoal `#14141B` panels, Slate `#1E1E28` raised cards, with the brand gradient reserved for primary actions, active navigation and key metrics. This is a work tool — denser than the consumer app, but it must still read as Joviqo: Baloo 2 headings, rounded pills, gradient accents, warm brand color coding.

**Shell:** collapsible left sidebar (260px) on Charcoal, top bar over the content area with channel switcher, global search, notifications bell and creator avatar. Content max-width 1320px.

**Sidebar:** Dashboard · Content · Learning Paths · Upload · Comments · Analytics · Earnings · Channel · Policy & Strikes · Settings

## Screens to build

### Auth & onboarding
1. **Creator log in** — split screen: left is a full-height panel of darkened creator-content artwork with the Joviqo logo and the line "Create. Teach. Earn."; right is the form on the Void base — email or mobile plus password, "Use a one-time code instead", forgot password, and a link to become a creator.
2. **Two-factor step** — 6-box code entry with a trust-this-device checkbox.
3. **Become a creator (onboarding)** — four-step stepper with a gradient progress bar: (1) Channel basics — name, handle, category, description, banner upload; (2) Verify identity — South African ID or passport field, document upload placeholder, selfie placeholder, status chip "Pending review"; (3) Payout details — bank name, account number, branch code, SARS tax reference (optional); (4) Kids-safety guidelines — a checklist of rules with an acceptance checkbox and a short quiz-style confirmation.

### Core
4. **Dashboard home** — greeting with channel name and avatar; four KPI cards (Views, Watch time in hours, Subscribers, Earnings this month in R) each with a gradient sparkline and a change chip; a "In review" panel showing videos and paths awaiting moderation with status timelines; a "Latest comments" panel; a "Learning path performance" panel; and a right column with announcements and a gradient *Upload* button.
5. **Upload — step 1: Select file** — large dashed drag-and-drop zone on the dark base with Jovi holding a film reel, supported-format note, and a resumable upload progress bar filling with the brand gradient (show a 34% mid-upload state with pause and cancel).
6. **Upload — step 2: Details** — title, description, tags, category, language (English, isiZulu, isiXhosa, Afrikaans, Sesotho), thumbnail picker showing three auto-generated frames plus a custom upload tile, and captions upload (SRT/VTT).
7. **Upload — step 3: Audience (mandatory)** — three large selectable cards: **Made for Kids** (with a notice that it requires human review before publishing), **General audience**, **18+ restricted**. An FPB rating dropdown (A, PG, 7–9PG, 10–12PG, 13, 16, 18) and a kids age-band selector (Preschool / Younger / Older) appear only when Made for Kids is selected.
8. **Upload — step 4: Visibility & publish** — Public / Unlisted / Private / Schedule with a date-time picker, a review summary panel, and *Submit for review*.
9. **Processing & review status** — horizontal timeline: Uploaded → Processing → Automated safety check → Human review → Published. Build two variants: one stalled at "Human review (kids content)" with an expected-time note, one Published.
10. **Content library** — dark data table: thumbnail and title, audience badge, status chip (Draft / Processing / In review / Published / Age-restricted / Rejected), visibility, views, watch time, likes, comments, date. Filters, bulk-select toolbar, and a row action menu (Edit, Analytics, Change visibility, Delete).
11. **Video detail / edit** — tabs: Details, Thumbnail, Captions, Comments, Analytics. Include a rejected variant with a red-outlined policy notice stating the reason and an *Appeal* button.

### Learning content
12. **Learning Paths list** — cards showing cover artwork, title, subject, age band, lesson count, enrolled learners, average quiz score and status chip.
13. **Path builder** — two columns: left is a drag-to-reorder list of lesson nodes rendered as a mini journey map matching the kids app; right is the editor for the selected lesson — attach an uploaded video via a picker, learning objective, estimated duration, XP value.
14. **Quiz builder** — question list with an *Add question* menu (Multiple choice, True/false, Picture match). Editor shows question text, answer options with a correct-answer radio, optional image slots, the explanation shown to a child on a wrong answer, and a pass-mark slider. A live preview panel renders the question exactly as a child sees it — speech-bubble chips on the dark base with Jovi feedback.
15. **Path review submission** — summary listing every lesson and quiz with a completeness checklist and *Submit path for kids review*.

### Engagement & performance
16. **Comments manager** — tabs: Published, Held for review, Blocked words. Rows with commenter, comment, video, date and actions (Reply, Heart, Pin, Remove, Block user). A persistent banner on kids content: "Comments are permanently disabled on Made for Kids videos."
17. **Analytics overview** — date-range picker; views and watch-time line chart with gradient fill; audience retention curve for a selected video; traffic-sources donut; top-videos table; device and province breakdown for South Africa.
18. **Learning analytics** — per-path funnel (started → lessons completed → quiz passed → path completed), average score per lesson with a drop-off point highlighted, and a learners-by-age-band chart.

### Money & governance
19. **Earnings** — balance card showing available and pending amounts in Rand, revenue breakdown by source (Channel memberships, Tips, Pay-per-view share, Ad share), monthly earnings bar chart, and a transactions table.
20. **Payout request** — modal with available balance, R500 minimum threshold, destination bank account, standard payout (free, monthly) versus instant payout (fee), and a confirmation step.
21. **Monetization eligibility** — checklist with gradient progress rings: 500 subscribers, 3 000 watch hours, identity verified, no active strikes, kids-safety training complete. Build both the "not yet eligible" and "apply now" states.
22. **Policy & strikes** — strike status card (0 of 3), history list with the policy cited, consequence and date, and an *Appeal* modal with a text area and a 72-hour response note.
23. **Channel customization** — banner and avatar upload, description, links, featured video picker, with a live preview of the public channel page in the cinematic browse style.
24. **Settings** — upload defaults, notification preferences, language, connected devices, account security.

## Interaction requirements
- Fully walkable: log in → two-factor → dashboard → upload through all four steps → watch it enter human review → build a learning path and quiz → submit for review → analytics → request a payout.
- Include loading skeletons with gradient shimmer, empty states with Jovi illustrations, toast confirmations, and confirm modals on destructive actions.
- Placeholder data is original and South African: channel names, video titles, view counts formatted with spaces (12 480), Rand amounts, provinces (Gauteng, Western Cape, KwaZulu-Natal).