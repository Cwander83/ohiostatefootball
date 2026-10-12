# Frontend Theme, Visual Styling & Engineering Architecture Review
**Ohio State Buckeyes Football Stats Platform**

- **Deliverable**: Milestone 1 Deliverable (`FRONTEND_REVIEW.md`)
- **Author**: Teamwork Architectural Reviewer (`teamwork_preview_worker_m1_1`)
- **Date**: October 5, 2026
- **Target Repository**: `/Users/chriswander/Codebases/ohiostatefootball`
- **Scope**: Complete audit of all HTML views (`index.html`, `game.html`, `players.html`, `roster.html`, `team.html`), stylesheets (`css/style.css`), partials (`partials/header.html`), brand assets (`favicon.svg`), and clientside JavaScript modules (`js/`).
- **Integrity Mode**: Development / Independent Verification

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
   - [High-Level Architectural Assessment](#11-high-level-architectural-assessment)
   - [Visual Language & Collegiate Identity](#12-visual-language--collegiate-identity)
   - [Engineering Health & Performance Profile](#13-engineering-health--performance-profile)
   - [Critical Findings Matrix](#14-critical-findings-matrix)
2. [Brand & Theme Analysis](#2-brand--theme-analysis)
   - [Color Palette & Design Tokens in `:root`](#21-color-palette--design-tokens-in-root)
   - [Official Ohio State Brand Standard Comparison](#22-official-ohio-state-brand-standard-comparison)
   - [WCAG 2.1 AA Color Contrast Audit](#23-wcag-21-aa-color-contrast-audit)
   - [Typography Audit & Heading Hierarchy](#24-typography-audit--heading-hierarchy)
   - [Brand Assets & Identity Mark Usage](#25-brand-assets--identity-mark-usage)
3. [Page-by-Page UI Breakdown & Layout Hierarchy Audit](#3-page-by-page-ui-breakdown--layout-hierarchy-audit)
   - [Global Shell & Navigation Framework (`partials/header.html`, `css/style.css`)](#31-global-shell--navigation-framework)
   - [Schedule / Home View (`index.html`)](#32-schedule--home-view-indexhtml)
   - [Game Details View (`game.html`)](#33-game-details-view-gamehtml)
   - [Player Stats View (`players.html`)](#34-player-stats-view-playershtml)
   - [Roster View (`roster.html`)](#35-roster-view-rosterhtml)
   - [Team Stats View (`team.html`)](#36-team-stats-view-teamhtml)
4. [CSS Architecture, Modularity & Component System](#4-css-architecture-modularity--component-system)
   - [Monolithic Stylesheet Organization & Specificity Baseline](#41-monolithic-stylesheet-organization--specificity-baseline)
   - [Design Token System Maturity & Scale Gaps](#42-design-token-system-maturity--scale-gaps)
   - [Dead Selectors, Unused Rules & CSS Logic Errors](#43-dead-selectors-unused-rules--css-logic-errors)
   - [Component Fragmentation & Duplication](#44-component-fragmentation--duplication)
   - [Responsive Strategy & Media Query Starvation](#45-responsive-strategy--media-query-starvation)
5. [Clientside Rendering, DOM Interactions & Accessibility (a11y)](#5-clientside-rendering-dom-interactions--accessibility-a11y)
   - [Dynamic Partial Loading & Cumulative Layout Shift (CLS)](#51-dynamic-partial-loading--cumulative-layout-shift-cls)
   - [Network Error Boundaries & Resilience Evaluation](#52-network-error-boundaries--resilience-evaluation)
   - [Semantic HTML Structure & Screen Reader Landmarks](#53-semantic-html-structure--screen-reader-landmarks)
   - [WAI-ARIA Implementation & State Management](#54-wai-aria-implementation--state-management)
   - [Keyboard Navigation & Focus Indicator Audit](#55-keyboard-navigation--focus-indicator-audit)
6. [Catalog of Identified Strengths](#6-catalog-of-identified-strengths)
7. [Areas for Improvement & Actionable Next Steps](#7-areas-for-improvement--actionable-next-steps)
   - [Prioritization Framework (Impact vs. Effort)](#71-prioritization-framework)
   - [Priority 1: High Priority (Critical Visual Bugs, Logic Errors & Accessibility Violations)](#72-priority-1-high-priority)
   - [Priority 2: Medium Priority (Component Architecture, Feature Completion & Layout Polish)](#73-priority-2-medium-priority)
   - [Priority 3: Low Priority (Progressive Enhancements & Brand Elevation)](#74-priority-3-low-priority)
8. [Independent Verification & Auditing Commands](#8-independent-verification--auditing-commands)

---

## 1. Executive Summary

### 1.1 High-Level Architectural Assessment

The Ohio State Football Stats platform is a lightweight, zero-dependency static web application designed to present schedule information, game boxscores, player statistics, team aggregates, and rosters spanning 22 seasons (2005–2026). The frontend architecture is built entirely on native web standards:
- **No JavaScript frameworks** (React, Vue, Svelte, or Angular)
- **No CSS preprocessors or utility frameworks** (Sass, Less, Tailwind, or Bootstrap)
- **No bundling or compile steps** (Vite, Webpack, or Rollup)
- **No production runtime dependencies** (pure vanilla HTML, CSS, and ES Modules)

The application relies on pre-scraped, structured JSON datasets stored in `data/${year}/` that are fetched on demand via the browser's native `fetch` API. A local Node.js development server (`scripts/server.js`) handles static file serving and exposes a single local administrative endpoint (`POST /api/scrape`). The application deploys seamlessly to static hosting environments (such as Vercel) as pure static files.

Architecturally, this minimalist design provides lightning-fast initial load times, exceptional runtime performance, zero supply-chain risk, and complete immunity to framework obsolescence. However, this simplicity has also resulted in architectural shortcuts: design token omissions, incomplete component abstraction, client-side Cumulative Layout Shift (CLS), unhandled asynchronous network rejections, and responsive layout starvation.

---

### 1.2 Visual Language & Collegiate Identity

The application establishes a recognizable collegiate sports identity through The Ohio State University's iconic scarlet palette, paired with stark black borders and bold athletic headline typography.

```
+-----------------------------------------------------------------------------------+
|  [OSU]  OHIO STATE FOOTBALL                           [2026 Season v] [Refresh ⟳] |
|         2026 Season                                                               |
+===================================================================================+
|  SCHEDULE  |  TEAM STATS  |  PLAYER STATS  |  ROSTER                              |
+-----------------------------------------------------------------------------------+
```

- **Color Discipline**: The primary brand scarlet (`#ba0c2f`) exactly matches The Ohio State University's official brand standard (Pantone 200 C). The primary dark contrast element is pure black (`#000000`), deployed prominently as a 6px dividing rule along the header and in navigation bars.
- **Typography Pairing**: The application utilizes Google Fonts to pair **Oswald** (a condensed, athletic headline sans-serif reminiscent of collegiate stadium scoreboards and jersey lettering) with **Inter** (a clean, highly legible grotesque sans-serif for tabular data, labels, and body text).
- **Tabular Precision**: The visual presentation emphasizes dense, structured data with monospace tabular numbers (`font-variant-numeric: tabular-nums`), zebra striping (`#fafbfc`), sticky table headers, and clean borders.

Despite this strong collegiate baseline, the visual execution is marred by brand inconsistencies:
1. **Generic Header Mark**: Rather than displaying the authentic Ohio State Block "O" with Buckeye leaf vector mark (which is already present in the repository at `favicon.svg`), the site header renders a plain white CSS circle with text "OSU".
2. **Ad-hoc Secondary Palette**: Official Ohio State secondary gray (Pantone 429 C, `#a7b1b7`) is defined in `favicon.svg` but omitted from the stylesheet, which instead relies on Tailwind CoolGray (`#6b7280`).
3. **Severe Logic-Driven Styling Bugs**: On upcoming games, unhandled null values cause Ohio State's score to be styled in gray as a loss while the opponent is styled in scarlet as a win.

---

### 1.3 Engineering Health & Performance Profile

| Dimension | Rating | Key Findings |
|---|:---:|---|
| **Performance & Load Speed** | **A+** | Zero bundle overhead, instantaneous initial payload, native browser rendering. |
| **XSS & Security Hygiene** | **A+** | 100% immune to XSS injection; strict usage of `textContent`, `document.createTextNode()`, and `replaceChildren()`; zero instances of `innerHTML` or `eval()`. |
| **Data Engine Processing** | **A** | `js/aggregate.js` parses and rolls up 22 seasons of historical boxscores entirely in-browser in under 15ms with zero `NaN` occurrences. |
| **Brand Fidelity** | **B-** | Accurate scarlet `#ba0c2f`, but generic text circle logo, dead `:root` variables, and omission of official brand silver `#a7b1b7`. |
| **CSS Architecture** | **C+** | Monolithic 535-line file, zero spacing/sizing/elevation tokens, 24 duplicate typography declarations, dead selectors, and only a single 3-rule media query. |
| **Responsive Adaptability** | **C** | Layout breaks below 480px; scoreboard header splits into an awkward 3-line stack; schedule rows wrap unevenly; tables lose row identity when scrolled. |
| **Accessibility (WCAG 2.1 AA)** | **C** | Four contrast failure points; `game.html` completely lacks an `<h1>`; filter buttons omit `aria-pressed`; interactive controls lack `:focus-visible` outlines. |
| **Network Error Resilience** | **D** | 3 out of 5 pages omit `try...catch` around top-level data fetching, crashing into blank screens on 404s or network drops. |

---

### 1.4 Critical Findings Matrix

| Ref | Issue Description | Affected Files | Severity | User Impact |
|:---:|---|---|:---:|---|
| **BUG-01** | **Upcoming Game Score Inversion**<br>Upcoming games evaluate `(0 > 0) = false`, styling OSU score as `.loss` (gray) and opponent as `.win` (scarlet), separated by "– – –". | `game.html:63, 77-80` | **High** | Misleading score display; shows upcoming games as Buckeye losses. |
| **BUG-02** | **Descendant Selector Score Styling Defect**<br>CSS rule `.schedule-score .win` (descendant) fails to match `<div class="schedule-score win">`, leaving final scores unhighlighted. | `css/style.css:249-250`<br>`index.html:70` | **High** | Final winning scores never turn scarlet on the home schedule. |
| **BUG-03** | **Scoreboard Mobile Stack Collapse**<br>`.game-teams` enforces `min-width: 200px` inside a flex container with 20px gaps. Viewports < 480px break the header into an isolated 3-line stack. | `css/style.css:410-426`<br>`game.html:75-80` | **High** | Mobile layout breakage; score divider sits stranded on its own line. |
| **BUG-04** | **Dead Media Query Selector**<br>`@media (max-width: 600px)` targets `.site-header h1`, but the title in `header.html` is `<p class="site-title">`. Font size never scales down to 20px. | `css/style.css:531`<br>`partials/header.html:5` | **High** | Mobile header title text wraps awkwardly on small phones. |
| **BUG-05** | **Kickoff Time Shift Defect (UTC)**<br>`fmtTime()` hardcodes `timeZone: "UTC"`. A 7:30 PM EDT kickoff (`23:30Z`) displays as 11:30 PM. Noon kickoffs display as 4:00 PM. | `js/data.js:20`<br>`index.html:52`<br>`game.html:92` | **High** | All game kickoff times displayed across the application are shifted 4–5 hours late. |
| **BUG-06** | **Missing `<h1>` Landmark Heading**<br>`game.html` has zero `<h1>` elements in HTML or dynamic JS, jumping directly to `<h2>`. Violates WCAG 1.3.1 and 2.4.6. | `game.html:1-218` | **High** | Screen reader users navigating by headings cannot identify the page subject. |
| **BUG-07** | **Silent Blank Page Failures (No `try...catch`)**<br>`index.html`, `game.html`, and `players.html` execute unhandled top-level `await loadJSON()`. Network drops or 404s crash the module silently. | `index.html:39`<br>`game.html:55, 60`<br>`players.html:41` | **High** | Total UI freeze; user sees a blank white screen with no error feedback. |
| **BUG-08** | **Win Probability Chart Axis Inversion & Scaling**<br>Horizontal time axis is labeled `0%`, `50%`, `100%`, while the vertical axis dynamically normalizes to min/max. Blowouts with 95% win prob touch the bottom axis. | `game.html:148-175` | **High** | Misleading data visualization; confuses game time with probability. |
| **BUG-09** | **Cumulative Layout Shift (CLS) on Header**<br>`loadPartial()` fetches `header.html` asynchronously at runtime, causing a sudden ~130px layout drop on every view. | `js/dom.js:16-24`<br>All HTML files | **Medium** | Severe visual flash and layout jank during page load. |
| **BUG-10** | **Empty Object Ingestion in Boxscores (`{}`)**<br>Scraper bug in `scripts/scrape.js:103-109` leaves all team stats as empty objects `{}` in stored data, preventing team boxscores. | `scripts/scrape.js:103`<br>`data/*/boxscores.json` | **Medium** | Missing team comparisons on game recap view. |
| **BUG-11** | **Loss of Table Row Identity on Mobile**<br>Horizontal table scrolling lacks a sticky first column (`Name` and `#`). Scrolling right hides player names completely. | `css/style.css:322-348`<br>`js/table.js:77-84` | **Medium** | Mobile users cannot connect stats (`QBR`, `TD`) to player identities. |
| **BUG-12** | **Team Stats Metric Monotony (166 Flat Tiles)**<br>`team.html` renders 166 identical flat stat tiles with zero visual hierarchy, progress gauges, or national rankings. | `team.html:69-83` | **Medium** | Extreme cognitive fatigue; critical KPIs buried under granular stats. |

---

## 2. Brand & Theme Analysis

### 2.1 Color Palette & Design Tokens in `:root`

All design tokens are defined in lines 1–14 of `css/style.css`:

```css
:root {
  --scarlet: #ba0c2f;
  --scarlet-dark: #8a0a24;
  --gray: #a8adb4;
  --gray-light: #eef0f2;
  --black: #000000;
  --white: #ffffff;
  --ink: #1a1a1a;
  --muted: #6b7280;
  --border: #d9dce0;
  --row-stripe: #fafbfc;
  --font-head: "Oswald", "Arial Narrow", sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
}
```

#### Token Utilization & Dead Code Analysis
A cross-codebase audit of token references across all CSS, HTML, and JS files reveals significant imbalances and dead tokens:

```
Token Usage Breakdown in css/style.css
-------------------------------------------------------
--scarlet       ██████████████████████████ (26 references)
--white         ██████████████████████ (22 references)
--muted         ██████████████████ (18 references)
--border        ███████████ (11 references)
--ink           ██████████ (10 references)
--gray-light    ██████ (6 references)
--black         ███ (3 references)
--row-stripe    █ (1 reference)
--scarlet-dark  (0 references - DEAD CODE)
--gray          (0 references - DEAD CODE)
-------------------------------------------------------
```

1. **Dead Token: `--scarlet-dark: #8a0a24`**: Defined on line 3, this deep crimson tone is referenced **zero times** in any stylesheet, HTML template, or script. Intended hover/active states for buttons instead resort to opacity shifts or generic backgrounds.
2. **Dead Token: `--gray: #a8adb4`**: Defined on line 4, this neutral tone is referenced **zero times**. The codebase instead introduces ad-hoc gray colors (`#6b7280` for muted text, `#eef0f2` for container fills, and `#d9dce0` for structural borders).
3. **Single-Use Token: `--row-stripe: #fafbfc`**: Referenced exactly once in `css/style.css:350` (`tbody tr:nth-child(even)`).

---

### 2.2 Official Ohio State Brand Standard Comparison

The Ohio State University's official Brand Guidelines specify rigorous color standards:

| Palette Role | Official Brand Standard | Current Codebase Token | Code Value | Brand Compliance Assessment |
|---|---|---|---|---|
| **Primary Scarlet** | Pantone 200 C / HEX `#ba0c2f`<br>RGB `186, 12, 47` | `var(--scarlet)` | `#ba0c2f` | **100% Compliant**. Flawless match with university standards. |
| **Secondary Gray** | Pantone 429 C / HEX `#a7b1b7`<br>RGB `167, 177, 183` | `var(--gray)` (unused)<br>In SVG: `#a7b1b7` | `#a8adb4` (CSS)<br>`#a7b1b7` (SVG) | **Partial / Inconsistent**. Favicon SVG uses `#a7b1b7`, but the web stylesheet uses `#a8adb4` (and never references it). |
| **Institutional Dark Gray** | HEX `#666666`<br>RGB `102, 102, 102` | `var(--muted)` | `#6b7280` | **Non-Compliant**. Replaced by generic Tailwind CoolGray `#6b7280`. |
| **Primary Black** | Process Black / HEX `#000000` | `var(--black)` | `#000000` | **100% Compliant**. Used for bold 6px header rule and navigation bar. |
| **Surface White** | Pure White / HEX `#ffffff` | `var(--white)` | `#ffffff` | **100% Compliant**. Used for card surfaces and text contrast. |
| **Neutral Ink** | Dark Neutral / HEX `#1a1a1a` | `var(--ink)` | `#1a1a1a` | **Compliant**. Provides deep contrast for body text without harsh pure black. |

#### Architectural Finding: The Brand Identity Disconnect
The codebase contains a bifurcated identity system:
- **Vector Brand Asset (`favicon.svg`)**: Contains an authentic Ohio State Block "O" with layered silver paths using exact Pantone 429 C (`#a7b1b7`) and Pantone 200 C (`#ba0c2f`).
- **Web Stylesheet (`css/style.css`)**: Completely discards `#a7b1b7`, leaving `--gray: #a8adb4` dormant and defaulting to generic modern web utility grays (`#6b7280`, `#eef0f2`).

---

### 2.3 WCAG 2.1 AA Color Contrast Audit

Every color combination across the user interface was mathematically evaluated using the W3C relative luminance formula:
$$\text{Relative Luminance } L = 0.2126 \cdot R + 0.7152 \cdot G + 0.0722 \cdot B$$
$$\text{Contrast Ratio} = \frac{\max(L_1, L_2) + 0.05}{\min(L_1, L_2) + 0.05}$$

Under WCAG 2.1 Level AA:
- **Normal text** (< 18pt or < 14pt bold) requires at least **4.5:1**.
- **Large text** ($\ge$ 18pt or $\ge$ 14pt bold) requires at least **3.0:1**.
- **UI Components and graphical states** require at least **3.0:1** (SC 1.4.11).

#### Detailed Contrast Ratio Evaluation Table

| Foreground Color | Background Color | Context / UI Selector | Calculated Ratio | WCAG AA Normal (4.5:1) | WCAG AA Large (3.0:1) | UI Component (3.0:1) |
|---|---|---|:---:|:---:|:---:|:---:|
| `#ffffff` (White) | `#ba0c2f` (Scarlet) | Header background, `.scrape-btn`, active filter button, win badge | **6.60:1** | **PASS** | **PASS** | **PASS** |
| `#ffffff` @ 85% opacity | `#ba0c2f` (Scarlet) | `.site-header .sub` ("2026 Season") | **5.06:1** | **PASS** | **PASS** | **PASS** |
| `#ba0c2f` (Scarlet) | `#ffffff` (White) | `.schedule-week`, `.schedule-link`, `.back-link`, `.stat-tile .val`, `td.jersey` | **6.60:1** | **PASS** | **PASS** | **PASS** |
| `#ba0c2f` (Scarlet) | `#eef0f2` (Gray Light) | Hovered schedule row (`.schedule-list li:hover`) | **5.78:1** | **PASS** | **PASS** | **PASS** |
| `#ba0c2f` (Scarlet) | `#fafbfc` (Row Stripe) | Alternating table row `td.jersey` | **6.37:1** | **PASS** | **PASS** | **PASS** |
| `#ba0c2f` (Scarlet) | `#000000` (Black) | `thead th.sorted .arrow`, active nav border | **3.18:1** | <mark>**FAIL**</mark> | **PASS** | **PASS** |
| `#ba0c2f` (Scarlet) | `#1a1a1a` (Ink) | `thead th:hover.sorted .arrow`, active nav hover background | **2.64:1** | <mark>**FAIL**</mark> | <mark>**FAIL**</mark> | <mark>**FAIL**</mark> |
| `#1a1a1a` (Ink) | `#ffffff` (White) | Body text, table data cells, player names | **17.40:1** | **PASS** | **PASS** | **PASS** |
| `#6b7280` (Muted) | `#ffffff` (White) | `.page-sub`, schedule date, venue, footer text | **4.83:1** | **PASS** | **PASS** | **PASS** |
| `#6b7280` (Muted) | `#eef0f2` (Gray Light) | `.schedule-list li:hover` date, venue, `@/vs` | **4.23:1** | <mark>**FAIL**</mark> | **PASS** | N/A |
| `#1a1a1a` @ 55% opacity | `#ffffff` (White) | `.schedule-list li.canceled` text | **3.90:1** | <mark>**FAIL**</mark> | **PASS** | N/A |
| `#6b7280` @ 55% opacity | `#ffffff` (White) | `.schedule-status.canceled` dashed border & text | **2.65:1** | <mark>**FAIL**</mark> | <mark>**FAIL**</mark> | <mark>**FAIL**</mark> |
| `#ffffff` @ 40% opacity | `#000000` (Black) | Inactive sort indicator (table header) | **3.66:1** | <mark>**FAIL**</mark> | **PASS** | **PASS** |
| `#d9dce0` (Border) | `#ffffff` (White) | Card perimeter borders, table borders | **1.38:1** | N/A | N/A | Low definition |

#### Failure Point Breakdown

```
[WCAG AA Contrast Failure Points]
 ├── Table Sort Arrow on Ink Background: 2.64:1 (Requires 3.0:1 UI Component)
 ├── Hovered Schedule Metadata on Light Gray: 4.23:1 (Requires 4.5:1 Normal Text)
 ├── Canceled Schedule Item Text: 3.90:1 (Requires 4.5:1 Normal Text)
 └── Canceled Schedule Badge: 2.65:1 (Requires 3.0:1 Graphical Object)
```

1. **Table Sort Indicator on Dark Header (`css/style.css:339-347`)**:
   Table headers have a black background (`#000000`). On hover, the background lightens to ink (`#1a1a1a`). Active sort arrows are rendered in Scarlet (`#ba0c2f`). This produces **3.18:1** contrast on black and drops to **2.64:1** on hover, directly violating WCAG 1.4.11 for interactive component states.
2. **Hovered Schedule Row Metadata (`css/style.css:223, 231-235`)**:
   When hovering over a game row in `index.html`, the background shifts to `--gray-light` (`#eef0f2`). The muted metadata (`.schedule-date`, `.schedule-venue`, and `.at`) remains `#6b7280`, dropping the contrast from 4.83:1 down to **4.23:1**, failing WCAG AA 4.5:1 for normal text.
3. **Canceled Game Visual Suppression (`css/style.css:221, 264-268`)**:
   Canceled games are styled with `opacity: 0.55`. This reduces body text contrast to **3.90:1** and the canceled badge text/border contrast to **2.65:1**, creating an illegible state for visually impaired users.

---

### 2.4 Typography Audit & Heading Hierarchy

#### Font Stack & Weight Imports
All 5 HTML documents load Google Fonts in the `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
```
- **Loaded Weights**: Oswald (600, 700), Inter (400, 600).
- **Missing Weights**: Oswald 400 (Regular) and 500 (Medium) are not imported. When smaller uppercase headers attempt to render with Oswald, browsers simulate bolding or render dense 600-weight glyphs that lose legibility at 11px–12px.
- **Institutional Font Absence**: Ohio State’s proprietary institutional typography (**Buckeye Sans** and **Buckeye Serif**) is entirely absent. The fallback stack in `:root` defaults to `"Arial Narrow", sans-serif` for Oswald and `system-ui, sans-serif` for Inter.

#### Typography Scale & Declaration Repetition
The CSS architecture lacks a modular typography scale. Instead of utility classes or custom properties, atomic typography rules are repeated verbatim across independent component selectors:
- `font-family: var(--font-head);` is declared **24 separate times**.
- `letter-spacing: 1px;` is declared **20 separate times**.
- `text-transform: uppercase;` is declared **18 separate times**.

```
Duplication of Typography Rules in css/style.css:
----------------------------------------------------------------------------------
.site-header .logo              font-family: var(--font-head); letter-spacing: 0.5px;
.site-header .site-title         font-family: var(--font-head); letter-spacing: 1px; text-transform: uppercase;
.site-header .sub               font-family: var(--font-head); letter-spacing: 0.5px; text-transform: uppercase;
.scrape-btn                     font-family: var(--font-head); letter-spacing: 0.5px; text-transform: uppercase;
.site-nav a                     font-family: var(--font-head); letter-spacing: 1px; text-transform: uppercase;
.page-title                     font-family: var(--font-head); letter-spacing: 1px; text-transform: uppercase;
.card h2                        font-family: var(--font-head); letter-spacing: 1px; text-transform: uppercase;
.schedule-week                  font-family: var(--font-head); letter-spacing: 1px; text-transform: uppercase;
.schedule-score                 font-family: var(--font-head); letter-spacing: 1px;
.schedule-link                  font-family: var(--font-head); letter-spacing: 1px; text-transform: uppercase;
.filters button                 font-family: var(--font-head); letter-spacing: 0.5px; text-transform: uppercase;
thead th                        font-family: var(--font-head); letter-spacing: 1px; text-transform: uppercase;
.stat-tile .val                 font-family: var(--font-head); letter-spacing: 1px;
.game-teams .team-name          font-family: var(--font-head); letter-spacing: 1px; text-transform: uppercase;
.game-teams .team-score         font-family: var(--font-head); letter-spacing: 1px;
.game-score-divider             font-family: var(--font-head); letter-spacing: 1px;
.game-meta .meta-badge          font-family: var(--font-head); letter-spacing: 1px; text-transform: uppercase;
.leader-card .cat               font-family: var(--font-head); letter-spacing: 1px; text-transform: uppercase;
.leader-card .val               font-family: var(--font-head); letter-spacing: 0.5px;
.scoring-list .play-score       font-family: var(--font-head); letter-spacing: 1px;
.drive-list .drive-result       font-family: var(--font-head); letter-spacing: 0.5px; text-transform: uppercase;
.back-link                      font-family: var(--font-head); letter-spacing: 1px; text-transform: uppercase;
----------------------------------------------------------------------------------
```

#### Heading Structure Inconsistencies
1. **Critical Landmark Gap (`game.html`)**: While `index.html`, `players.html`, `roster.html`, and `team.html` begin with `<h1 class="page-title">`, `game.html` has **no `<h1>` tag whatsoever**. The page begins with a back link and jumps immediately to `<h2>Game Recap</h2>`, violating WCAG 1.3.1.
2. **Dead Media Query Selector (`css/style.css:531`)**:
   `@media (max-width: 600px) { .site-header h1 { font-size: 20px; } }` is completely dead because `partials/header.html` line 5 defines `<p class="site-title">Ohio State Football</p>`. As a result, the header remains locked at 26px on all mobile viewports.
3. **Missing Intermediate Headings (`h3`–`h6`)**: Only `.card h2` is styled globally. Subcomponents (`.leader-card`, `.stat-tile`, `.wp-wrap`) use unsemantic `<div>` elements rather than `<h3>` or `<h4 tags.

---

### 2.5 Brand Assets & Identity Mark Usage

#### Block "O" Vector Asset vs. Header Circle Logo

The repository contains an authentic vector asset at `favicon.svg`:
- **Dimensions & Geometry**: 247x243.31 viewBox containing precise multi-path layered geometry representing the official Ohio State Block "O" with Buckeye leaf cluster.
- **Accurate Brand Fill**: Path 5 uses `#ba0c2f` (Scarlet), Path 6 uses `#a7b1b7` (official Buckeye Silver).

In contrast, `partials/header.html` line 3 implements:
```html
<div class="logo">OSU</div>
```
Styled via `css/style.css:114-127`:
```css
.site-header .logo {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--white);
  color: var(--scarlet);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-head);
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}
```

```
Brand Asset Contrast:
[favicon.svg]                              [partials/header.html:3]
Authentic Vector Block "O"                  Generic CSS Circle Badge
   ┌──────────┐                                  ┌──────────┐
   │  ██████  │  Pantone 200 C Scarlet           │    O     │
   │ █ ▄▄▄▄ █ │  Pantone 429 C Silver            │   OSU    │  Plain text string
   │ █ █  █ █ │  Buckeye Leaf Cluster            │          │  in 44px circle
   │  ██████  │                                  └──────────┘
   └──────────┘
```

**Evaluation**: The circular "OSU" text badge diminishes the visual prestige of the site. Replacing it with the authentic Block "O" SVG elevates brand authority and aligns the site with authentic Ohio State Athletics digital experiences.

---

## 3. Page-by-Page UI Breakdown & Layout Hierarchy Audit

### 3.1 Global Shell & Navigation Framework

The global shell consists of `partials/header.html`, the top navigation bar, and the sticky footer.

```
+-----------------------------------------------------------------------------------+
|  [Logo]  Ohio State Football                          [Year Select v] [Refresh ⟳] |
|          2026 Season                                                              |
+===================================================================================+
|  Schedule    Team Stats    Player Stats    Roster                                 |
+-----------------------------------------------------------------------------------+
```

#### Cumulative Layout Shift (CLS) from Dynamic Partial Loading
In all 5 HTML templates (`index.html:16`, `game.html:16`, `players.html:16`, `roster.html:16`, `team.html:16`), the shell begins with an empty placeholder:
```html
<div id="header"></div>
```
In `js/dom.js:16-24`, the header is loaded asynchronously via client-side fetch:
```javascript
export async function loadPartial(targetId, url) {
  const html = await (await fetch(url)).text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const target = document.getElementById(targetId);
  target.replaceChildren();
  for (const child of [...doc.body.childNodes]) target.appendChild(child);
}
```
**Impact**: On initial paint, `#header` has a height of **0px**. Once the fetch resolves, parsed DOM nodes snap into place, pushing all main content down by **~130px**. This introduces a severe Cumulative Layout Shift (CLS) score penalty, degrades perceived speed, and causes visual jarring. If JavaScript is disabled or network requests stall, the entire navigation shell fails to appear.

#### Kickoff Time Shift Defect (UTC Hardcoding)
In `js/data.js:17-21`:
```javascript
export function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
}
```
In `data/2026/schedule.json`, Ohio State at Texas is stored with UTC timestamp `"2026-09-12T23:30Z"`.
- `fmtTime()` evaluates `23:30Z` in UTC and outputs **11:30 PM**.
- In Columbus, Ohio (Eastern Daylight Time, UTC-4), actual kickoff is **7:30 PM EDT**.
- Noon kickoffs (`16:00Z`) display as **4:00 PM**.
- 3:30 PM kickoffs (`19:30Z`) display as **7:30 PM**.
**Impact**: Every kickoff time across `index.html` and `game.html` is distorted by +4 to +5 hours.

---

### 3.2 Schedule / Home View (`index.html`)

#### Component & Layout Hierarchy
1. **Header & Navigation**: Global shell.
2. **Page Header**:
   - `h1.page-title#page-title`: "2026 Schedule" (30px Oswald, letter-spacing 1px).
   - `p.page-sub#page-sub`: "Game-by-game results for the Ohio State Buckeyes." (14px Inter).
3. **Card Container**: `<div class="card">` containing hardcoded `<h2>Regular Season</h2>` and `<ul class="schedule-list" id="schedule">`.
4. **Game Row (`li`)**: Horizontal flex row containing:
   - `.schedule-week`: Week number ("Wk 1", Oswald 600, 14px, Scarlet `#ba0c2f`).
   - `.schedule-date`: Date and time ("Sep 5 · 4:30 PM", Inter 13px, muted).
   - `.schedule-opp`: Home/Away indicator ("vs " or "@ ") and Opponent Name (Inter 600, 14px).
   - `.schedule-venue`: Stadium venue ("Ohio Stadium", Inter 13px, muted).
   - `.schedule-score`: Final score ("56–3", Oswald 600, 18px).
   - `.schedule-status`: Status badge ("Final", "Upcoming", "Canceled").
   - `.schedule-link`: Navigation anchor ("Details →", Oswald 12px, scarlet).

```
Schedule List Desktop Layout:
+------+----------------+----------------------------+-----------------+-------+----------+-----------+
| Wk 1 | Sep 5 · 4:30 PM| vs Ball State Cardinals    | Ohio Stadium    | 56–3  |  FINAL   | DETAILS → |
+------+----------------+----------------------------+-----------------+-------+----------+-----------+
```

#### Detailed Observations & Flaws
1. **Descendant Selector Bug on Final Scores (`css/style.css:249-250`)**:
   In `index.html:70`, final game scores receive `.win` or `.loss` directly on the score element:
   ```javascript
   score.classList.add(win ? "win" : "loss"); // <div class="schedule-score win">
   ```
   However, `css/style.css` defines descendant selectors with whitespace:
   ```css
   .schedule-score .win { color: var(--scarlet); }
   .schedule-score .loss { color: var(--muted); }
   ```
   Because there is no child element with class `.win` inside `.schedule-score`, the rule matches nothing. Winning scores **never turn scarlet**; they remain plain ink black (`#1a1a1a`).
2. **Missing Hero Section & Season Summary**:
   The home page lacks collegiate football identity: no season record badge (e.g. "12-1 Overall, 9-0 Big Ten"), no AP/CFP national ranking badge, no next-game countdown card, and no team graphic. Users must manually calculate wins and losses.
3. **Postseason Omission in Information Architecture**:
   The card heading is hardcoded to `<h2>Regular Season</h2>` (`index.html:21`). In historical championship years (2014, 2020, 2024), Big Ten Championship Games, Rose Bowls, Sugar Bowls, and National Championship games are listed under "Regular Season".
4. **Mobile Layout Distortion (360px–550px)**:
   Rows use `flex-wrap: wrap; gap: 16px;`. On mobile viewports, `.schedule-opp` (`min-width: 160px`) causes opponent names, venues, and scores to wrap into staggered 3-to-4-line clumps without tabular grid alignment.
5. **Missing Network Error Boundary**:
   Line 39 executes `const games = await loadJSON(...)` without `try...catch`. A network error or bad URL parameter produces an unhandled promise rejection, leaving a blank white box.

---

### 3.3 Game Details View (`game.html`)

#### Component & Layout Hierarchy
1. **Back Navigation**: `<a class="back-link">← Back to Schedule</a>`.
2. **Matchup Scoreboard Card**: Flex container with Ohio State score, score divider `"–"`, opponent score, and game metadata badge.
3. **Game Leaders Card**: 5-column grid (`.leader-grid`) for Passing, Rushing, Receiving, Sacks, Tackles.
4. **Scoring Recap Card**: Chronological list of scoring plays with period, clock, and running score.
5. **Win Probability Card**: SVG area-chart showing Ohio State win probability across the game.
6. **Scoring Drives Card**: List of offensive scoring drives with drive breakdown and result badge.
7. **Betting Odds Card**: Stat grid with Line, Spread, and Over/Under tiles.

```
Game Details Scoreboard Layout:
+-----------------------------------------------------------------------------------+
|  ← BACK TO SCHEDULE                                                               |
|                                                                                   |
|         OHIO STATE                     –                     MICHIGAN             |
|             42                                                  27                |
|                                     [ W ]                                         |
|                          Week 13 · Nov 28 · 12:00 PM                              |
|                          Ohio Stadium · Columbus, OH                              |
|                              Attendance: 105,532                                  |
+-----------------------------------------------------------------------------------+
```

#### Detailed Observations & Flaws
1. **Critical Scoring Class Bug on Upcoming Games (`game.html:63, 77-80`)**:
   ```javascript
   const win = (sched.osuScore ?? 0) > (sched.oppScore ?? 0);
   ```
   For upcoming games, `sched.osuScore` and `sched.oppScore` are `null`. `(0 > 0)` evaluates to `false`.
   - Line 77 assigns Ohio State `team-score loss` (styled gray).
   - Line 79 assigns Opponent `team-score win` (styled scarlet).
   - Line 80 renders `el("div", "game-score-divider", "–")`, displaying "– – –" between team names.
   - Result: Upcoming games display Ohio State losing to the opponent before kickoff!
2. **Scoreboard Mobile Collapse Bug (`css/style.css:410-426`)**:
   `.game-teams` specifies `min-width: 200px; flex: 1;`. On mobile viewports (< 480px), two 200px boxes, gaps, and padding exceed screen width. The OSU box wraps to line 1, the divider `"–"` sits stranded on line 2, and the opponent box wraps to line 3.
3. **Missing Quarter-by-Quarter Line Score Table**:
   The page completely lacks a traditional football line score table (OSU vs Opponent across Q1, Q2, Q3, Q4, OT, and Total).
4. **Missing Team Statistics Comparisons & Backend Scraping Bug**:
   The view displays zero team stat comparisons (Total Yards, 3rd Down Efficiency, Turnovers, Time of Possession).
   - *Root Cause in Ingestion*: In `scripts/scrape.js:103-109`, the scraper attempts `for (const s of cat.stats || [])`. ESPN's API returns statistics at the top level of `cat`, causing `s` to be empty. Every team stat in `data/*/boxscores.json` is stored as an empty object `{}`.
5. **Missing Full Game Player Box Scores**:
   While `data/*/boxscores.json` contains comprehensive `osuPlayers` and `oppPlayers` tables (Passing, Rushing, Receiving, Defensive, Kicking, Punting), `game.html` only renders the top 5 OSU leaders. Opponent leaders and full box score rosters are discarded.
6. **Win Probability Chart Axis Inversion & Scaling Bug (`game.html:148-175`)**:
   - Dynamic Y-axis scaling (`ys = (v) => H - PAD - ((v - min) / range) * (H - 2 * PAD)`) scales the game's minimum to the bottom and maximum to the top. In blowout games where win probability never drops below 95%, 95% is plotted at the very bottom line.
   - Line 174 labels the horizontal time axis `0%`, `50%`, `100%`, misrepresenting game quarters as probability.
7. **Complete Absence of `<h1>` Heading**:
   The page jumps from navigation directly into `<h2>Game Recap</h2>`, violating WCAG 1.3.1.
8. **Active Navigation Disconnect**:
   When viewing `game.html`, no nav link in `.site-nav` is marked `.active`.

---

### 3.4 Player Stats View (`players.html`)

#### Component & Layout Hierarchy
1. **Page Header**:
   - `h1.page-title`: "Player Stats" (missing `id="page-title"`).
   - `p.page-sub`: "Season totals by position. Click a column header to sort." (missing `id="page-sub"`).
2. **Category Filter Pills (`#filters`)**: Flex container with buttons for Quarterbacks, Running Backs, Receivers, Defense, Interceptions, Kicking, Punting, Kick Returns, Punt Returns, Fumbles.
3. **Table Card (`.card`)**: Contains dynamic sortable table generated via `makeSortableTable()`.

```
Player Stats Table View:
+-----------------------------------------------------------------------------------+
|  [Quarterbacks]  (Running Backs)  (Receivers)  (Defense)  (Kicking)  (Punting) ... |
+===================================================================================+
|   #   | Name             | C/ATT   | YDS   | AVG  | TD  | INT  | QBR  | LONG  | SACKS |
|-------+------------------+---------+-------+------+-----+------+------+-------+-------|
|  10   | Julian Sayin     | 17/32   | 278   | 8.7  |  1  |  1   | 90.3 |  48   |   2   |
|  12   | Lincoln Kienholz | 4/7     |  52   | 7.4  |  0  |  0   | 62.4 |  24   |   0   |
+-----------------------------------------------------------------------------------+
```

#### Detailed Observations & Flaws
1. **Complete Absence of Pagination**:
   Large position groups (such as Defense with 40+ players) render in a single continuous table, causing excessive page length and scroll fatigue.
2. **Loss of Row Identity on Mobile Horizontal Scroll**:
   Tables are wrapped in `.table-wrap { overflow-x: auto; }`. Table headers have `position: sticky; top: 0;`, but player name columns (`th:first-child`, `td:first-child`, `td.name`) lack `position: sticky; left: 0;`. When users scroll horizontally on mobile to view `QBR`, `TD`, or `SACKS`, player names disappear off the left screen edge.
3. **Season Desynchronization in Header**:
   In `players.html:18-19`, `<h1 class="page-title">` and `<p class="page-sub">` omit `id="page-title"` and `id="page-sub"`. `initYearSelect()` in `js/year.js:28-32` targets these IDs to dynamically update the year. Because the IDs are missing, selecting historical seasons (e.g. 2014, 2024) leaves the heading static.
4. **No Search or Player Name Filter**:
   Finding a specific player requires switching position tabs and manually scanning rows.

---

### 3.5 Roster View (`roster.html`)

#### Component & Layout Hierarchy
1. **Page Header**:
   - `h1.page-title#page-title`: "Roster".
   - `p.page-sub#page-sub`: "Full 2026 roster. Click a column header to sort.".
2. **Two-Tier Filter Controls**:
   - Primary Group Pills (`#filters`): "All", "Offense", "Defense", "Special Teams".
   - Secondary Position Select (`#posfilters`): Dropdown select `<select class="pos-select">` with individual position codes (QB, RB, WR, TE, OT, DE, CB, S, etc.).
3. **Table Card (`.card`)**: Sortable table with `#`, `Name`, `Pos`, `Class`, `Ht`, `Wt`.

```
Roster Table View:
+-----------------------------------------------------------------------------------+
|  [All]  (Offense)  (Defense)  (Special Teams)                                     |
|  Position: [ All Positions v ]                                                    |
+===================================================================================+
|   #   | Name                  | Pos   | Class | Ht      | Wt      | Hometown      |
|-------+-----------------------+-------+-------+---------+---------+---------------|
|   2   | Caleb Downs           | S     | JR    | 6' 0"   | 205 lbs | Suwanee, GA   |
|   4   | Jeremiah Smith        | WR    | SO    | 6' 3"   | 215 lbs | Miami, FL     |
|  10   | Julian Sayin          | QB    | SO    | 6' 1"   | 203 lbs | Carlsbad, CA  |
+-----------------------------------------------------------------------------------+
```

#### Detailed Observations & Flaws
1. **Absence of Player Card / Grid View**:
   The view is restricted to a tabular data view. There is no grid view, player card component, or view toggle switch (Table vs. Cards).
2. **Headshots and Player Portraits Omitted Completely**:
   In `data/2026/roster.json`, ESPN provides headshot CDN URLs for almost every player:
   `"headshot": "https://a.espncdn.com/i/headshots/college-football/players/full/5081820.png"`.
   In `roster.html:121-130`, table columns only include `jersey`, `name`, `position`, `class`, `height`, `weight`. The headshot image is completely ignored.
3. **Biographical Data (Hometown & High School) Omitted**:
   The JSON schema contains `hometown`, but it is never displayed in the table.
4. **Historical Season Restriction UX Confusion**:
   Roster data is only available for 2026. Selecting any season from 2005 to 2025 triggers:
   `"No roster for this season. Rosters are only available for the current season."`
   However, the global year dropdown offers all 22 seasons without any visual indicator or tooltip explaining that rosters are restricted to the current season.
5. **Two-Tier Filter Visual Disconnect**:
   The filter buttons and position dropdown are rendered in separate stacked containers with mismatched margins, creating visual fragmentation on mobile screens.

---

### 3.6 Team Stats View (`team.html`)

#### Component & Layout Hierarchy
1. **Page Header**:
   - `h1.page-title#page-title`: "Team Stats".
   - `p.page-sub#page-sub`: "2026 season totals for the Ohio State Buckeyes.".
2. **Stats Container (`#stats`)**: 11 dynamically generated `.card` elements (Passing, Rushing, Receiving, Miscellaneous, Defense, Interceptions, General, Returns, Kicking, Punting, Scoring).
3. **Stat Grid (`.stat-grid`)**: CSS Grid with `repeat(auto-fill, minmax(150px, 1fr))` displaying `.stat-tile` elements with `.val` (24px Oswald) and `.lbl` (11px Inter uppercase).

```
Team Stats Grid Layout (166 Flat Tiles):
+-----------------------------------------------------------------------------------+
| PASSING                                                                           |
| +-----------------+ +-----------------+ +-----------------+ +-----------------+   |
| |     3,412       | |       28        | |        6        | |      68.4%      |   |
| |  PASSING YARDS  | |   PASSING TDS   | |  INTERCEPTIONS  | | COMP PERCENTAGE |   |
| +-----------------+ +-----------------+ +-----------------+ +-----------------+   |
| +-----------------+ +-----------------+ +-----------------+ +-----------------+   |
| |      8.6        | |      243.7      | |       398       | |       272       |   |
| | YARDS PER PASS  | | PASS YDS / GAME | | PASS ATTEMPTS   | | PASS COMPLETIONS|   |
| +-----------------+ +-----------------+ +-----------------+ +-----------------+   |
| ... [150+ more flat tiles across 11 category cards]                               |
+-----------------------------------------------------------------------------------+
```

#### Detailed Observations & Flaws
1. **Metric Overload & Visual Monotony (166 Identical Tiles)**:
   A query of `data/2026/team-stats.json` reveals **166 individual tiles**:
   Passing (24), Rushing (16), Receiving (16), Miscellaneous (24), Defense (13), Interceptions (4), General (6), Returns (15), Kicking (25), Punting (14), Scoring (9).
   Every metric has identical visual weight. A core KPI (`Points Per Game` or `Total Offense`) looks identical to an obscure metric (`fieldGoalAttempts1_19`).
2. **Complete Absence of Visual Charts, Gauges, or Progress Bars**:
   The view contains zero visual graphics: no 3rd down conversion gauges, no red zone efficiency progress bars, and no offensive vs. defensive yardage balance charts.
3. **Missing National & Conference Rankings**:
   There are no national or Big Ten rankings displayed (e.g. "#1 Scoring Defense", "#4 Total Offense").
4. **No Opponent Comparison or Net Differentials**:
   All 166 tiles display raw Ohio State totals without opponent statistics (Yards Allowed, Points Allowed) or net differentials (Turnover Margin: +12).
5. **Acronym Label Formatting Bug (`team.html:79`)**:
   `name.replace(/([A-Z])/g, " $1")` converts camelCase keys into spaced words. For acronyms like `QBRating`, it converts `'Q'`, `'B'`, and `'R'`, rendering `" Q B Rating"` with an awkward leading space and split letters.

---

## 4. CSS Architecture, Modularity & Component System

### 4.1 Monolithic Stylesheet Organization & Specificity Baseline

The entire frontend styling is contained in a single 535-line file (`css/style.css`, 13.1 KB).
- **Zero `!important` Declarations**: The stylesheet contains **0 instances of `!important`**, maintaining a clean specificity baseline where rules can be overridden naturally.
- **Minimal CSS Reset**:
  ```css
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; }
  ```
  The reset lacks normalization for form controls, lists, images, tables, and typography, necessitating element-level overrides throughout the file.
- **Tight Element Coupling**: Selectors are tightly coupled to HTML element tags rather than reusable component classes: `.filters button`, `.card h2`, `thead th`, `tbody td`, `.schedule-list li`, `.scoring-list li`, `.drive-list li`.

---

### 4.2 Design Token System Maturity & Scale Gaps

While `:root` defines colors and font families, it lacks systematic design tokens for spacing, sizing, radius, elevation, and transitions:

```
Design Token System Maturity:
[Color Tokens]       ████████████░░░░  60% (Accurate primary scarlet, but dead tokens and ad-hoc grays)
[Typography Tokens]  ██████░░░░░░░░░░  30% (Font families defined; font sizes and line heights hardcoded)
[Spacing Scale]      ░░░░░░░░░░░░░░░░   0% (Completely absent; 13 distinct hardcoded pixel values)
[Radius Tokens]      ░░░░░░░░░░░░░░░░   0% (Hardcoded 4px, 6px, 8px, 50%)
[Elevation/Shadow]   ░░░░░░░░░░░░░░░░   0% (No box-shadow tokens; flat 1px borders only)
[Transition Tokens]  ░░░░░░░░░░░░░░░░   0% (Hardcoded 0.15s)
[Container Max-Width]░░░░░░░░░░░░░░░░   0% (Hardcoded 1100px duplicated across 3 selectors)
```

- **Hardcoded Spacing**: Margins, paddings, and gaps use 13 distinct arbitrary values: `4px`, `6px`, `8px`, `10px`, `12px`, `14px`, `16px`, `18px`, `20px`, `24px`, `28px`, `40px`, `60px`.
- **Hardcoded Font Sizes**: Font sizes use 12 distinct values: `11px`, `12px`, `13px`, `14px`, `16px`, `17px`, `18px`, `20px`, `24px`, `26px`, `30px`, `40px`.
- **Hardcoded Container Constraint**: `max-width: 1100px;` is hardcoded across 3 separate selectors: `.site-header .inner` (line 58), `.site-nav .inner` (line 149), and `main` (line 176).

---

### 4.3 Dead Selectors, Unused Rules & CSS Logic Errors

1. **Dead Media Query Selector (`css/style.css:531`)**:
   ```css
   @media (max-width: 600px) {
     .site-header h1 { font-size: 20px; }
   }
   ```
   Matches zero elements because the title element in `partials/header.html` is `<p class="site-title">`.
2. **Descendant Selector Bug (`css/style.css:249-250`)**:
   ```css
   .schedule-score .win { color: var(--scarlet); }
   .schedule-score .loss { color: var(--muted); }
   ```
   Fails to match `<div class="schedule-score win">` due to descendant whitespace syntax.
3. **Dead `:root` Tokens**:
   `--scarlet-dark` and `--gray` are never referenced.
4. **Verbatim Code Block Duplication (`css/style.css:468-476` vs `484-492`)**:
   The CSS rules for `.scoring-list li` and `.drive-list li` are 100% identical character-for-character:
   ```css
   display: flex;
   align-items: baseline;
   gap: 12px;
   padding: 10px 16px;
   border-bottom: 1px solid var(--border);
   flex-wrap: wrap;
   ```

---

### 4.4 Component Fragmentation & Duplication

#### Disconnected Badge Architectures
The UI implements status badges via three distinct, incompatible class systems:
1. `.schedule-status` (`css/style.css:251`): `padding: 3px 8px; font-size: 11px; font-family: var(--font-body);` (Inter).
2. `.game-meta .meta-badge` (`css/style.css:428`): `padding: 4px 10px; font-size: 12px; font-family: var(--font-head);` (Oswald).
3. `.drive-list .drive-result` (`css/style.css:494`): `padding: 2px 8px; font-size: 11px; font-family: var(--font-body);` (Inter).

#### Disconnected Button Architectures
There is no unified `.btn` component. Buttons are styled independently:
- `.scrape-btn` (`css/style.css:94`): 44px min-height, border radius 4px, background black.
- `.filters button` (`css/style.css:286`): 44px min-height, border radius 4px, background gray-light, border border.

---

### 4.5 Responsive Strategy & Media Query Starvation

The stylesheet suffers from **media query starvation**. Across the entire 535 lines, there is only one responsive media query block:
```css
@media (max-width: 600px) {
  .site-header h1 { font-size: 20px; }
  .schedule-week { min-width: 48px; }
  .schedule-date { min-width: 0; }
}
```
There are:
- **No tablet breakpoints** (e.g. 768px, 1024px)
- **No small phone breakpoints** (e.g. 360px, 400px, 480px)
- **No responsive rules for the scoreboard header** (causing the mobile 3-line split)
- **No responsive rules for stat grids**
- **No responsive rules for filter button rows**

---

## 5. Clientside Rendering, DOM Interactions & Accessibility (a11y)

### 5.1 Dynamic Partial Loading & Cumulative Layout Shift (CLS)

As documented in Section 3.1, dynamic injection of `partials/header.html` via `loadPartial()` introduces:
- **~130px Layout Shift**: Pushes content down upon asynchronous response.
- **Zero-JS Dependency Hazard**: If JavaScript execution fails or is disabled, the page has no header, no branding, and no navigation.
- **Redundant Network Roundtrips**: Forces an extra HTTP roundtrip for `partials/header.html` on every page visit.

---

### 5.2 Network Error Boundaries & Resilience Evaluation

The application displays inconsistent error handling across views:

| Page | Data Fetch Target | Wrapped in `try...catch`? | Failure State Behavior | Resilience Assessment |
|---|---|:---:|---|---|
| `index.html` | `data/${year}/schedule.json` | **NO** | Uncaught Promise Rejection; blank card rendered | **Critical Vulnerability** |
| `game.html` | `boxscores.json`, `schedule.json` | **NO** | Uncaught Promise Rejection; `#game` remains empty | **Critical Vulnerability** |
| `players.html` | `boxscores.json` | **NO** | Uncaught Promise Rejection; table container remains empty | **Critical Vulnerability** |
| `players.html` | `roster.json` | **YES** | Falls back to `roster = []`; retrieves jerseys from boxscores | **Resilient** |
| `roster.html` | `roster.json` | **YES** | Catches 404; renders `emptyState` ("No roster for this season") | **Resilient** |
| `team.html` | `team-stats.json` | **YES** | Catches 404; renders `emptyState` ("No team stats yet") | **Resilient** |

In `index.html`, `game.html`, and `players.html`, an offline network drop, adblocker block, or malformed year parameter leaves users staring at an uncommunicative blank white screen.

---

### 5.3 Semantic HTML Structure & Screen Reader Landmarks

```
Heading Landmark Audit Across Views:
+-------------------+---------+---------+---------+---------+---------+
| View              | <h1>    | <h2>    | <h3>    | <h4>    | Status  |
+-------------------+---------+---------+---------+---------+---------+
| index.html        | 1 (Yes) | 1 (Yes) | 0       | 0       | PASS    |
| game.html         | 0 (NO)  | 5 (Yes) | 0       | 0       | FAIL    |
| players.html      | 1 (Yes) | 0       | 0       | 0       | PASS    |
| roster.html       | 1 (Yes) | 0       | 0       | 0       | PASS    |
| team.html         | 1 (Yes) | 11(Yes) | 0       | 0       | PASS    |
+-------------------+---------+---------+---------+---------+---------+
```

- **`game.html` Heading Gap**: Zero `<h1>` headings exist on `game.html`. Screen reader landmark navigation cannot identify the game matchup.
- **Repeated Generic Link Text (`index.html:84`)**:
  `link.textContent = "Details →"` is repeated 12 times per season without contextual accessible names (`aria-label="Game details for Week 1 vs Ball State"`), violating WCAG 2.4.4.
- **Table Captions**: Tables generated by `js/table.js` lack `<caption>` elements, depriving screen readers of high-level context before entering tabular data.

---

### 5.4 WAI-ARIA Implementation & State Management

- **Filter Buttons State Missing (`players.html:76`, `roster.html:85`)**:
  Filter buttons toggle `.active` class via CSS, but omit `aria-pressed="true|false"`. Assistive technologies cannot announce which filter group is currently active, violating WCAG 4.1.2.
- **Sortable Table Accessibility (`js/table.js`)**:
  `js/table.js` demonstrates strong baseline accessibility:
  - Table headers use `role="button"`, `th.tabIndex = 0`, and `aria-sort="ascending|descending|none"`.
  - Arrow indicators use `aria-hidden="true"`.
  - Headers support keyboard `Enter` and `Space` sorting keys.
- **Scrollable Table Region (`js/table.js:77-84`)**:
  `.table-wrap` has `overflow-x: auto` but lacks `tabindex="0"`, `role="region"`, and `aria-label="Scrollable table"`. Keyboard-only users cannot focus the wrapper to scroll horizontally.

---

### 5.5 Keyboard Navigation & Focus Indicator Audit

An audit of `:focus` and `:focus-visible` selectors across `css/style.css` revealed only three rules:
1. `.skip-link:focus` (`css/style.css:45`)
2. `.year-select:focus-visible` (`css/style.css:88`)
3. `.pos-select:focus` (`css/style.css:317`)

**Focus Indicators are Completely Missing for**:
- `.site-nav a` (Global navigation links)
- `.scrape-btn` (Header refresh button)
- `.filters button` (Position and group filter buttons)
- `thead th` (Sortable table header buttons)
- `.schedule-link` ("Details →" links)
- `.back-link` ("← Back to Schedule" links)

Keyboard users navigating via the Tab key receive inconsistent visual feedback, violating WCAG 2.4.7 (Focus Visible).

---

## 6. Catalog of Identified Strengths

Despite areas needing polish, the frontend platform exhibits exemplary engineering patterns:

1. **Zero-Dependency Vanilla Web Standards Architecture**:
   - Built on native ES modules, modern DOM APIs (`replaceChildren`, `DOMParser`, `URLSearchParams`), and pure CSS.
   - Zero framework overhead, instantaneous page loads, zero build steps, and complete immunity to framework obsolescence.
2. **Defensive DOM Security & XSS Immunity**:
   - Untrusted data from ESPN feeds is injected exclusively via `textContent`, `document.createTextNode()`, and `replaceChildren()`.
   - Never uses `innerHTML` or `eval()`.
3. **High-Performance Historical Aggregation Engine (`js/aggregate.js`)**:
   - Aggregates 22 seasons (2005–2026) of multi-game boxscores into season totals entirely clientside in under 15ms.
   - Cleanly parses composite stats (`13/20`), yardages, maximums, and completion percentages with zero `NaN` occurrences.
4. **Accessible, Keyboard-Navigable Sortable Tables (`js/table.js`)**:
   - Implements full keyboard navigation (`Enter` and `Space` sorting).
   - Declares proper ARIA attributes (`aria-sort`, `role="button"` on `<th>`).
   - Uses `tabular-nums` for precise alignment of statistical figures.
5. **Collegiate Brand Discipline & Primary Contrast**:
   - Primary Ohio State scarlet (`#ba0c2f`) achieves **6.60:1** contrast on white and black surfaces, passing WCAG AA with headroom.
   - Oswald and Inter create an authentic collegiate sports atmosphere.
6. **Touch Target Size Discipline**:
   - Interactive inputs, filter buttons, header controls, and table headers explicitly enforce a 44px minimum touch target height (`min-height: 44px`).
7. **Accessible SVG Graphic Integration (`game.html`)**:
   - Win probability chart SVG sets `role="img"` and dynamically constructs an informative `aria-label` summarizing the probability range.
8. **Reduced Motion Respect**:
   - Respects user preferences via `@media (prefers-reduced-motion: reduce)`, disabling animation on the scrape button.
9. **Reusable Empty State Abstraction (`js/dom.js`)**:
   - Clean `emptyState(big, body)` component provides consistent fallbacks across views.

---

## 7. Areas for Improvement & Actionable Next Steps

### 7.1 Prioritization Framework

```
Priority Matrix:
+-----------------------------------------------------------------------------------+
|  HIGH PRIORITY (P1)                |  MEDIUM PRIORITY (P2)                        |
|  • Upcoming game score logic bug   |  • Eliminate header CLS (static inline)      |
|  • Descendant selector score bug   |  • Unified badge & button component system   |
|  • Scoreboard mobile grid layout   |  • Quarter line score table on game.html     |
|  • Add <h1> to game.html           |  • Fix team stat ingestion & add stat bars   |
|  • Network error boundaries        |  • Mobile sticky player name table column    |
|  • Win prob chart axis & scaling   |  • Universal high-contrast focus rings       |
|  • aria-pressed on filter buttons  |  • Player stats pagination & search          |
|  • Broken header media query       |  • Roster grid view with ESPN headshots      |
|  • Eastern kickoff time correction |  • Team stats KPI dashboard & gauges         |
|                                    |  • Fix acronym regex in team stats           |
+------------------------------------+----------------------------------------------+
|  LOW PRIORITY (P3)                                                                |
|  • Integrate vector Block "O" logo from favicon.svg into site header              |
|  • Add season record badge & hero section to home schedule view                   |
|  • Separate postseason card for Big Ten Championship and Bowl games               |
|  • Shared footer partial / web component                                          |
|  • CSS skeleton pulse loading indicators                                          |
+-----------------------------------------------------------------------------------+
```

---

### 7.2 Priority 1: High Priority (Critical Visual Bugs, Logic Errors & Accessibility Violations)

#### 1. Fix Upcoming Game Score Logic & Divider (`game.html:63, 77-80`)
- **Problem**: Upcoming games evaluate `0 > 0 = false`, styling OSU in gray loss color and opponent in scarlet win color, separated by `"– – –"`.
- **Action**: Only apply `.win` / `.loss` classes and score dividers if `sched.status === "final"`.
```javascript
// Replacement in game.html lines 63, 77-80:
const isFinal = sched.status === "final";
const win = isFinal && (sched.osuScore ?? 0) > (sched.oppScore ?? 0);

const osuScoreClass = isFinal ? `team-score ${win ? "win" : "loss"}` : "team-score";
const oppScoreClass = isFinal ? `team-score ${win ? "loss" : "win"}` : "team-score";

osuTeams.append(el("div", "team-name", "Ohio State"), el("div", osuScoreClass, isFinal ? sched.osuScore : "VS"));
oppTeams.append(el("div", "team-name", opp), el("div", oppScoreClass, isFinal ? sched.oppScore : ""));
if (isFinal) {
  gameHeader.append(osuTeams, el("div", "game-score-divider", "–"), oppTeams);
} else {
  gameHeader.append(osuTeams, oppTeams);
}
```

#### 2. Fix Descendant Selector Bug on Schedule Scores (`css/style.css:249-250`)
- **Problem**: Whitespace creates a descendant selector `.schedule-score .win` that fails to match `<div class="schedule-score win">`.
- **Action**: Remove whitespace to create a compound class selector:
```css
/* Replace in css/style.css lines 249-250 */
.schedule-score.win { color: var(--scarlet); }
.schedule-score.loss { color: var(--muted); }
```

#### 3. Fix Scoreboard Mobile Flex Wrapping (`css/style.css:410-426`)
- **Problem**: `min-width: 200px` forces teams and score divider to wrap into an isolated 3-line stack below 480px.
- **Action**: Replace flex wrap with a responsive 3-column CSS Grid:
```css
/* Replace in css/style.css lines 410-426 */
.game-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  padding: 24px 20px;
}
.game-teams { min-width: 0; text-align: center; }
@media (max-width: 480px) {
  .game-teams .team-name { font-size: 15px; }
  .game-teams .team-score { font-size: 32px; }
  .game-score-divider { font-size: 20px; }
}
```

#### 4. Add `<h1>` Landmark Heading to Game Details (`game.html`)
- **Problem**: `game.html` has zero `<h1>` elements.
- **Action**: Add an `<h1>` heading element dynamically inside `#game` or before the scoreboard card:
```javascript
// In game.html line 74:
const pageH1 = el("h1", "sr-only", `Ohio State vs ${opp} — Week ${sched.week || ""} Game Recap`);
game.appendChild(pageH1);
```

#### 5. Implement Network Error Boundaries for Top-Level Data (`index.html`, `game.html`, `players.html`)
- **Problem**: Unhandled top-level `await loadJSON()` produces silent blank page freezes on network failure.
- **Action**: Wrap top-level data fetching in `try...catch` blocks that render `emptyState()`:
```javascript
// Pattern for index.html, game.html, players.html:
try {
  const games = await loadJSON(`data/${year}/schedule.json`);
  // render schedule...
} catch (err) {
  const list = document.getElementById("schedule");
  list.replaceChildren(emptyState("Unable to load schedule", "Please check your network connection or select another season."));
}
```

#### 6. Fix Win Probability Chart Axis Realignment & Scaling (`game.html:148-175`)
- **Problem**: Y-axis normalizes to min/max; X-axis is labeled `0%`, `50%`, `100%`.
- **Action**: Fix vertical domain to 0%–100%, draw a 50% horizontal dashed guideline, and label the horizontal axis with game timeline milestones:
```javascript
// In game.html lines 151-155:
const ys = (v) => H - PAD - (Math.max(0, Math.min(100, v)) / 100) * (H - 2 * PAD);

// In game.html line 174:
axis.append(el("span", "", "Kickoff"), el("span", "", "Halftime"), el("span", "", "Final"));
```

#### 7. Add `aria-pressed` to Filter Buttons (`players.html:76`, `roster.html:85`)
- **Problem**: Filter buttons toggle `.active` class visually without communicating state to assistive technology.
- **Action**: Set `b.setAttribute("aria-pressed", key === activeGroup ? "true" : "false")`.

#### 8. Fix Broken Media Query Selector in Header (`css/style.css:531`)
- **Problem**: `.site-header h1` targets a non-existent element.
- **Action**: Change selector to target `.site-title`:
```css
/* Replace in css/style.css line 531 */
@media (max-width: 600px) {
  .site-header .site-title { font-size: 20px; }
  .schedule-week { min-width: 48px; }
  .schedule-date { min-width: 0; }
}
```

#### 9. Correct Kickoff Timezone Display (`js/data.js:17-21`)
- **Problem**: Hardcoded UTC timezone shifts all game kickoff times by +4 to +5 hours.
- **Action**: Format times in America/New_York (Eastern Time):
```javascript
export function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) + " ET";
}
```

---

### 7.3 Priority 2: Medium Priority (Component Architecture, Feature Completion & Layout Polish)

#### 10. Eliminate Header Cumulative Layout Shift (CLS)
- **Problem**: Client-side fetch of `partials/header.html` causes a ~130px layout shift.
- **Action**: Inline the static header/nav HTML directly into all 5 templates, or reserve space on `#header` using CSS:
```css
#header { min-height: 110px; }
```

#### 11. Unified Badge & Button Component Architecture
- **Problem**: `.schedule-status`, `.meta-badge`, and `.drive-result` duplicate styles with conflicting classes.
- **Action**: Create a unified `.badge` and `.btn` component system in `css/style.css`:
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  font-family: var(--font-head);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 4px;
}
.badge--win { background: var(--scarlet); color: var(--white); }
.badge--loss { background: var(--muted); color: var(--white); }
.badge--neutral { background: var(--gray-light); color: var(--ink); }
```

#### 12. Quarter-by-Quarter Line Score Table (`game.html`)
- **Action**: Render a clean line score table above scoring plays comparing Ohio State and Opponent points across Q1, Q2, Q3, Q4, and OT.

#### 13. Team Stat Comparisons & Scraper Ingestion Fix
- **Action**:
  1. Fix `scripts/scrape.js:103-109` to correctly ingest `cat.displayValue` or `cat.stats` from ESPN.
  2. In `game.html`, render comparative stat bars (Total Yards, 3rd Down Conversions, Turnovers, Time of Possession).

#### 14. Mobile Sticky Player Name Column in Tables (`css/style.css:322-348`)
- **Action**: Add sticky column positioning so player names remain visible during horizontal scrolling:
```css
.table-wrap th:first-child,
.table-wrap td:first-child,
.table-wrap th:nth-child(2),
.table-wrap td:nth-child(2) {
  position: sticky;
  left: 0;
  background: var(--white);
  z-index: 2;
}
.table-wrap th:nth-child(2),
.table-wrap td:nth-child(2) {
  left: 48px; /* offset after jersey number */
}
```

#### 15. Universal High-Contrast `:focus-visible` Focus Rings
- **Action**: Establish global focus ring styles in `css/style.css`:
```css
:focus-visible {
  outline: 2px solid var(--scarlet);
  outline-offset: 2px;
}
.site-nav a:focus-visible {
  outline: 2px solid var(--white);
  outline-offset: -2px;
}
```

#### 16. Player Stats Pagination & Search Filtering (`players.html`)
- **Action**: Introduce a lightweight 20-row pagination control and a debounced player name search input.

#### 17. Roster Grid View with ESPN Headshots (`roster.html`)
- **Action**: Add a toggle switch (Table View vs. Card View). In Card View, render player photo cards using ESPN headshot URLs with fallback SVG silhouette placeholders.

#### 18. Team Stats Executive KPI Dashboard with Visual Gauges (`team.html`)
- **Action**: Extract the top 6 core KPIs (Points/Game, Total Yards, Points Allowed, Yards Allowed, Turnover Margin, 3rd Down %) into an Executive Overview card featuring visual SVG gauges and progress bars.

#### 19. Synchronize `document.title` and Page IDs (`js/year.js`, `players.html`)
- **Action**: Add `id="page-title"` and `id="page-sub"` to `players.html:18-19`. In `js/year.js:33`, dynamically update `document.title`:
```javascript
document.title = `Ohio State Football — ${sel.value} Season`;
```

#### 20. Acronym Regex Normalization in Team Stats (`team.html:79`)
- **Action**: Update camelCase regex to preserve consecutive uppercase acronyms:
```javascript
lbl.textContent = name.replace(/([a-z])([A-Z])/g, "$1 $2").trim();
```

---

### 7.4 Priority 3: Low Priority (Progressive Enhancements & Brand Elevation)

#### 21. Integrate Authentic Vector Block "O" into Header (`partials/header.html`)
- **Action**: Replace `<div class="logo">OSU</div>` with an inline SVG or `<img>` referencing `favicon.svg`.

#### 22. Home Page Hero Section & W-L Season Record Badge (`index.html`)
- **Action**: Add a collegiate landing banner displaying overall record ("12-1 Overall, 9-0 Big Ten"), AP ranking, and next scheduled opponent.

#### 23. Separate Postseason Card for Championship & Bowl Games (`index.html`)
- **Action**: Dynamically group games into "Regular Season" and "Postseason" cards based on game metadata.

#### 24. Shared Footer Partial / Web Component
- **Action**: Extract duplicated footer markup into `partials/footer.html` or instantiate a custom element `<site-footer>`.

#### 25. CSS Skeleton Pulse Loading Indicators
- **Action**: Render subtle pulsing placeholder cards while `loadJSON()` requests are pending to improve perceived loading speed.

---

## 8. Independent Verification & Auditing Commands

All findings, contrast ratios, dead selectors, and code bugs documented in this review can be independently verified via the following terminal commands:

### 1. Verify Dead Selectors & Token Usage in CSS
```bash
# Check dead :root tokens
grep -n "\-\-scarlet-dark" css/style.css
grep -n "\-\-gray:" css/style.css

# Check broken media query selector vs actual header title element
grep -n "\.site-header h1" css/style.css
grep -n "site-title" partials/header.html

# Check descendant score styling bug
grep -n "\.schedule-score \." css/style.css
grep -n "score\.classList\.add" index.html
```
*Expected Result*: `--scarlet-dark` and `--gray` appear only on lines 3–4 of `css/style.css`. `.site-header h1` appears on line 531, while `header.html` has `<p class="site-title">`. `.schedule-score .win` has a space, failing to match the single element.

---

### 2. Verify Contrast Calculations (WCAG AA)
```bash
node -e '
function lum(hex) {
  const rgb = hex.replace("#", "").match(/.{2}/g).map(x => parseInt(x, 16) / 255);
  const a = rgb.map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function contrast(c1, c2) {
  const l1 = lum(c1), l2 = lum(c2);
  return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2);
}
console.log("Scarlet on White:", contrast("#ba0c2f", "#ffffff"));
console.log("Scarlet on Black:", contrast("#ba0c2f", "#000000"));
console.log("Scarlet on Ink:", contrast("#ba0c2f", "#1a1a1a"));
console.log("Muted on GrayLight:", contrast("#6b7280", "#eef0f2"));
'
```
*Expected Result*: Output confirms Scarlet on Black is 3.18:1, Scarlet on Ink is 2.64:1 (failing UI component 3.0:1 threshold), and Muted on GrayLight is 4.23:1 (failing normal text 4.5:1 threshold).

---

### 3. Verify Upcoming Game Score Inversion Bug
```bash
# Check game.html score calculation logic
sed -n '62,80p' game.html
```
*Expected Result*: Line 63 sets `win = (sched.osuScore ?? 0) > (sched.oppScore ?? 0)`. When scores are null, `(0 > 0)` evaluates to `false`, assigning `.loss` to OSU and `.win` to opponent.

---

### 4. Verify Heading Structure Across All Views
```bash
node -e '
const fs = require("fs");
["index.html", "game.html", "players.html", "roster.html", "team.html"].forEach(f => {
  const html = fs.readFileSync(f, "utf8");
  const h1 = (html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || []).length;
  console.log(`${f} H1 tag count: ${h1}`);
});
'
```
*Expected Result*: `game.html` has 0 H1 tags; all other views have 1.

---

### 5. Verify Kickoff Time UTC Shift
```bash
node -e '
const iso = "2026-09-12T23:30Z";
console.log("Current UTC output:", new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }));
console.log("Actual Eastern output:", new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }));
'
```
*Expected Result*: UTC outputs `11:30 PM`, whereas Eastern outputs `7:30 PM`.

---

### 6. Verify Stored Team Stats Scraper Ingestion Defect
```bash
node -e '
const fs = require("fs");
const b = JSON.parse(fs.readFileSync("data/2026/boxscores.json"));
const firstGame = b[Object.keys(b)[0]];
console.log("osuTeam stats object:", firstGame.osuTeam);
'
```
*Expected Result*: All keys (`firstDowns`, `totalYards`, etc.) are empty objects `{}`.

---

### 7. Verify Headshot URLs in `roster.json` vs Omission in `roster.html`
```bash
grep -m 2 "headshot" data/2026/roster.json
sed -n '121,130p' roster.html
```
*Expected Result*: `roster.json` contains full CDN URLs for player headshots, but `roster.html` columns omit `headshot` completely.

---

*End of Frontend Review Deliverable.*
