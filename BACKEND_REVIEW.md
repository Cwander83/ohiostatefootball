# Ohio State Football Stats: Comprehensive Backend & Ingestion Architecture Review

**Document:** `BACKEND_REVIEW.md`  
**Scope:** Backend data ingestion pipelines (`scripts/scrape.js`, `scripts/scrape-all.js`), development web server (`scripts/server.js`), local data storage schemas (`data/`), client data transport (`js/data.js`, `js/aggregate.js`, `js/scrape.js`), and static deployment architecture.  
**Auditor:** Teamwork Architecture Review Team (`teamwork_preview_worker_m2_1`)  
**Evaluation Range:** 22 Historical & Current Seasons (2005–2026)  
**Status:** Complete Architectural Audit & Remediation Blueprint  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Analysis](#2-architecture-analysis)
   - [2.1 Scraping Scripts Architecture](#21-scraping-scripts-architecture)
   - [2.2 Dev Server Architecture](#22-dev-server-architecture)
   - [2.3 Dynamic `/api/scrape` Endpoint Behavior](#23-dynamic-apiscrape-endpoint-behavior)
   - [2.4 Data Processing Flow: Raw ESPN JSON to Disk](#24-data-processing-flow-raw-espn-json-to-disk)
3. [Data Pipeline & Resilience Evaluation](#3-data-pipeline--resilience-evaluation)
   - [3.1 ESPN API Rate Limiting, Throttling & Network Resilience](#31-espn-api-rate-limiting-throttling--network-resilience)
   - [3.2 Error Recovery & Partial Scrape Failure Vulnerability](#32-error-recovery--partial-scrape-failure-vulnerability)
   - [3.3 Critical Data Omission: Postseason (`seasonType=3`) & 22 Years of Lost Records](#33-critical-data-omission-postseason-seasontype3--22-years-of-lost-records)
   - [3.4 Multi-Season Data Integrity Across 2005–2026](#34-multi-season-data-integrity-across-20052026)
4. [Data Storage & Schema Structure](#4-data-storage--schema-structure)
   - [4.1 Directory Hierarchy & Storage Footprint](#41-directory-hierarchy--storage-footprint)
   - [4.2 JSON Schema Specifications](#42-json-schema-specifications)
   - [4.3 Monolithic vs. Modular Storage Architectural Evaluation](#43-monolithic-vs-modular-storage-architectural-evaluation)
5. [Static vs. Dynamic Deployment Handling](#5-static-vs-dynamic-deployment-handling)
   - [5.1 Static Hosting Constraints vs. Local Development Server](#51-static-hosting-constraints-vs-local-development-server)
   - [5.2 Automated Ingestion Deficit & GitHub Actions Strategy](#52-automated-ingestion-deficit--github-actions-strategy)
6. [Identified Strengths](#6-identified-strengths)
7. [Vulnerabilities, Reliability Risks & Bottlenecks](#7-vulnerabilities-reliability-risks--bottlenecks)
8. [Prioritized Recommendations & Actionable Next Steps](#8-prioritized-recommendations--actionable-next-steps)
   - [Priority 0: Critical Security & Historical Integrity Remediations](#priority-0-critical-security--historical-integrity-remediations)
   - [Priority 1: High Reliability, Mutex Deadlock & Concurrency Hardening](#priority-1-high-reliability-mutex-deadlock--concurrency-hardening)
   - [Priority 2: Performance, Data Granularity & Network Optimization](#priority-2-performance-data-granularity--network-optimization)
   - [Priority 3: Operational Automation & UX Polish](#priority-3-operational-automation--ux-polish)

---

## 1. Executive Summary

The backend data ingestion and serving subsystem of the **Ohio State Football Stats** application provides historical game archives, boxscore analytics, rosters, and season statistics spanning 22 seasons (2005 through 2026). The project implements a minimalist, zero-dependency architecture that exclusively leverages native Node.js ECMAScript modules (`node:http`, `node:fs/promises`, and global `fetch`). Data is ingested from ESPN's public, undocumented College Football API (`site.api.espn.com`) and committed as structured flat JSON files in the `data/` directory.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ARCHITECTURE OVERVIEW                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   [ESPN Public API]                                                             │
│   site.api.espn.com                                                             │
│          │                                                                      │
│          ▼                                                                      │
│   [Scraper Engine] ───────────────► [Local Disk Store] ◄──────── [Dev Server]   │
│   scripts/scrape.js                 data/                        scripts/       │
│   scripts/scrape-all.js             ├── index.json               server.js      │
│          ▲                          ├── 2026/                    (Port 4173)    │
│          │                          │   ├── schedule.json             │         │
│          │                          │   ├── boxscores.json            │         │
│          │                          │   ├── team-stats.json           │         │
│          │                          │   └── roster.json               ▼         │
│          │                          └── 2005..2025/             [Client App]    │
│          │                                                      Vanilla JS/HTML │
│   [POST /api/scrape] ─────────────────────────────────────────── "Refresh" Btn  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### High-Level Architectural Assessment

1. **Elegance of Zero Dependencies**: By avoiding runtime dependencies (no Express, Fastify, Axios, or Lodash), the application eliminates supply-chain vulnerabilities, minimizes cold-start execution latency, and guarantees extreme operational longevity.
2. **Static Flat-File Architecture**: Decoupling ingestion from serving allows the site to be hosted as a completely static web application on CDNs (Vercel, Cloudflare Pages, GitHub Pages) with near-instant client load times and negligible hosting costs.
3. **Severe Historical Data Blind Spot**: A fundamental omission in API parameter construction (`seasonType=3` is omitted) causes the ingestion pipeline to ignore all postseason games across all 22 seasons. Major historical bowl games and National Championship victories—including the 2014 College Football Playoff National Championship over Oregon and Sugar Bowl over Alabama—are completely absent from the database.
4. **Catastrophic Failure Modes in Data Ingestion**: The scraper initializes an empty in-memory accumulator during boxscore scraping and overwrites existing disk files unconditionally. If a network glitch occurs during a season refresh, the failed game is permanently deleted from disk. Furthermore, missing timeout guards on native `fetch` can deadlock the dev server's in-memory mutex indefinitely.
5. **Critical Security Vulnerabilities in the Dev Server**: `scripts/server.js` contains a path traversal vulnerability in the `/api/scrape` endpoint allowing arbitrary directory creation and file overwrites outside the repository root, alongside repository metadata leakage (`.git/HEAD`, `.vercel/project.json`) through the static file handler.
6. **Deployment Disconnect**: The frontend features a prominent "Refresh Stats" button wired to a local dev server endpoint (`/api/scrape`). On static hosting environments, this endpoint does not exist, causing the UI to degrade into an unhelpful "Offline" state without background automation.

---

## 2. Architecture Analysis

### 2.1 Scraping Scripts Architecture

The scraping engine consists of two Node.js scripts:
- `scripts/scrape.js`: Ingests an individual season or the current active season (default: `2026`). Exposes the exportable function `runScrape({ season, log })` and a CLI execution block.
- `scripts/scrape-all.js`: Ingestion orchestrator that sequentially iterates through an array of 22 seasons (`[2026, 2025, ..., 2005]`).

#### Endpoints Queried and Parameter Structures

The scraper targets Ohio State (ESPN Team ID `194`) using the public base URL:
`https://site.api.espn.com/apis/site/v2/sports/football/college-football`

| Ingestion Routine | ESPN API Target Endpoint | Parameters Sent | Parameters Omitted | Impact of Omission |
|---|---|---|---|---|
| `scrapeSchedule(season)` | `/teams/194/schedule` | `?season=${season}` | `seasonType`, `week` | Defaults to regular season (`seasonType=2`); **all postseason, bowl, and CFP games omitted**. |
| `scrapeRoster()` | `/teams/194/roster` | None | N/A (endpoint ignores query params) | ESPN only returns current-season athletes; historical rosters cannot be queried here. |
| `scrapeTeamStats(season)` | `/teams/194/statistics` | `?season=${season}` | None | Returns aggregated team totals across all 11 statistical categories for the entire year. |
| `scrapeBoxscore(eventId)` | `/summary` | `?event=${eventId}` | None | Returns consolidated game summary: boxscore, player stats, scoring drives, win probability, attendance, odds. |

#### Analysis of `scripts/scrape-all.js`
`scripts/scrape-all.js` (lines 3–12) coordinates the multi-season ingestion:
```javascript
const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005];

for (const year of YEARS) {
  console.log(`\n===== ${year} =====`);
  try {
    await runScrape({ season: year });
  } catch (err) {
    console.error(`  ${year} FAILED: ${err.message}`);
  }
}
```
- **Strengths**: Isolates season-level failures using `try/catch`, ensuring that a crash in season $N$ does not abort ingestion for seasons $N-1$.
- **Weaknesses**: Executes with **zero delay between seasons**. While individual boxscores have a 300ms sleep, the transition from year $N$ to year $N-1$ executes immediately. Across 22 seasons, this generates ~350 HTTP requests in under 2.5 minutes, creating a high-risk profile for IP-level rate-limiting by ESPN's edge network (Akamai).

---

### 2.2 Dev Server Architecture

The local development server (`scripts/server.js`) is an 88-line HTTP server built on Node.js `node:http`.

#### HTTP Handling, Port Binding & Network Exposure
- **Port Assignment**: `const PORT = process.env.PORT || 4173;` (line 10).
- **Socket Binding**: Line 85 invokes `server.listen(PORT, () => ...)`. Because no host string is supplied (e.g., `"127.0.0.1"`), Node binds to `INADDR_ANY` (`0.0.0.0` or `::`). On shared local networks or public Wi-Fi, the dev server is exposed to external inbound connections on port 4173.
- **HTTP Methods**: Handles `POST` for `/api/scrape`. For all other routes, it reads and returns static files regardless of the HTTP method used (e.g., `POST /index.html` or `DELETE /data/index.json` returns HTTP 200 with the file body).

#### Routing and Clean URLs
- **Root Mapping**: Lines 56–57 map `GET /` to `/index.html`.
- **Directory Index Fallback**: Line 66 checks `st.isDirectory()`; if true, maps to `<dir>/index.html`.
- **Clean URL Resolution**: Lines 71–79 handle extensionless paths (e.g., `/team` or `/players`). If a file is not found and has no extension, the server appends `.html`, returning the corresponding HTML document.
- **Trailing Slash Anomaly**: A request for `/players/` normalizes to `.../players/`, fails file stat, has an empty extension, and attempts to read `/players/.html`, resulting in an unexpected 404 Not Found instead of redirecting or serving `players.html`.

#### Security Headers and CORS Audit
- **Security Headers**: **Completely Absent**. The server outputs only `Content-Type`. Crucial web security headers are omitted:
  - `Content-Security-Policy`: Missing (permits inline scripts and unrestricted network egress).
  - `X-Content-Type-Options: nosniff`: Missing (permits MIME-type sniffing).
  - `X-Frame-Options: DENY`: Missing (permits clickjacking in iframes).
  - `Referrer-Policy: strict-origin-when-cross-origin`: Missing.
- **CORS Handling**: **Completely Absent**. No `Access-Control-Allow-Origin` headers are set, and no `OPTIONS` preflight routing is implemented.

---

### 2.3 Dynamic `/api/scrape` Endpoint Behavior

The `/api/scrape` endpoint in `scripts/server.js` (lines 27–54) bridges the browser UI with the local Node.js scraper.

#### Synchronous Blocking Execution Model
When the browser sends `POST /api/scrape`, the server does not spawn a decoupled background worker or return a 202 Accepted job token. Instead, it executes `await runScrape({ season, log })` directly within the HTTP request lifecycle:
1. The client HTTP socket is held open for 5 to 15 seconds while 12–15 network calls to ESPN complete.
2. In-memory logs are accumulated into an array (`lines.push(m)`).
3. Upon completion, the server flushes a single JSON payload: `{ ok: true, result, log: lines }`.
4. If an upstream network glitch or unhandled exception occurs, the server flushes HTTP 500: `{ ok: false, error: err.message, log: lines }`.

#### Mutex Locking & Server Deadlock Vulnerability
A single boolean variable guards execution concurrency:
```javascript
let scraping = false; // Line 22

if (url.pathname === "/api/scrape" && req.method === "POST") {
  if (scraping) {
    res.writeHead(409, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Scrape already in progress" }));
    return;
  }
  scraping = true;
  ...
  try {
    const result = await runScrape(...);
  } finally {
    scraping = false; // Line 51
  }
}
```
While this correctly blocks overlapping web requests with HTTP 409 Conflict, it introduces a severe reliability failure:
- **Process Isolation**: The mutex is strictly process-local memory. If an operator runs `npm run scrape` in the terminal while a browser triggers `/api/scrape`, two scraper instances execute simultaneously, triggering race conditions on disk writes.
- **Deadlock on Hanging Upstream Sockets**: The `fetch()` implementation in `scripts/scrape.js` contains **no timeout configuration**. If ESPN's public gateway drops TCP packets or hangs, `await fetch(...)` never settles. Consequently, `runScrape` never completes, the `finally` block is never executed, and `scraping` remains `true` forever. All future `/api/scrape` requests are permanently rejected with HTTP 409 until the server process is killed.

#### Input Validation Deficit & Path Traversal Vulnerability
Lines 35–42 parse the incoming JSON body:
```javascript
for await (const chunk of req) body += chunk;
let season;
try {
  season = body ? JSON.parse(body).season : undefined;
} catch {
  season = undefined;
}
```
The parameter `season` is passed directly to `runScrape({ season })`. In `scripts/scrape.js:223–224`:
```javascript
const yearDir = join(DATA_DIR, String(season));
await mkdir(yearDir, { recursive: true });
```
Because `season` is neither sanitized nor verified as an integer, supplying a payload such as `{"season": "../../evil"}` causes `yearDir` to resolve to `/Users/chriswander/Codebases/evil`. The scraper executes `mkdir` and writes `schedule.json`, `boxscores.json`, and `team-stats.json` outside the repository tree, creating an arbitrary directory creation and file overwrite vulnerability.

#### Denial of Service (DoS) Vectors
- **Unbounded Request Body Buffer**: `for await (const chunk of req) body += chunk;` streams raw TCP buffers into a string without size verification. An attacker or malfunctioning client sending a multi-gigabyte continuous POST stream will exhaust V8 heap memory and trigger an Out-Of-Memory (OOM) process crash.

---

### 2.4 Data Processing Flow: Raw ESPN JSON to Disk Storage

```
[ESPN Public API]
       │
       ├─► GET /teams/194/schedule?season={year}
       │   └── Parsing: extracts eventId, week, date, homeAway, opponent, venue, neutralSite, status, score.
       │       Filter: sanitizes STATUS_CANCELED / STATUS_POSTPONED to null scores.
       │       Disk Output ──► data/{year}/schedule.json
       │
       ├─► GET /teams/194/statistics?season={year}
       │   └── Parsing: iterates results.stats.categories, normalizes value, display, perGame.
       │       Disk Output ──► data/{year}/team-stats.json
       │
       ├─► Loop games where boxscoreAvailable === true:
       │   └── GET /summary?event={id} (with 300ms sleep)
       │       Deconstructs single summary JSON into 10 layers:
       │       1. osuTeam (15 cumulative stats)
       │       2. oppTeam (15 cumulative stats)
       │       3. osuPlayers (passing, rushing, receiving, fumbles, defense, returns, kicking)
       │       4. oppPlayers (opponent player stats)
       │       5. leaders (passing, rushing, receiving, sacks, tackles)
       │       6. scoringPlays (period, clock, text, running scores)
       │       7. scoringDrives (drive description, nested plays)
       │       8. winProbability (play-by-play time series percentages)
       │       9. attendance (headcount integer)
       │      10. odds & broadcast (betting line, market)
       │       Disk Output ──► data/{year}/boxscores.json (monolithic dictionary)
       │
       ├─► IF season === 2026:
       │   └── GET /teams/194/roster
       │       Parsing: iterates athletes, groups into offense/defense/ST, extracts physicals.
       │       Disk Output ──► data/2026/roster.json
       │
       └─► Catalog Update:
           └── Reads data/index.json, appends season, sorts descending.
               Disk Output ──► data/index.json
```

---

## 3. Data Pipeline & Resilience Evaluation

### 3.1 ESPN API Rate Limiting, Throttling & Network Resilience

The network transport layer is isolated in `scripts/scrape.js:13–23`:
```javascript
async function get(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}
```

#### Deficiencies in Network Transport:
1. **Missing Timeout Guards**: The `fetch` call provides no `signal: AbortSignal.timeout(ms)`. In Node.js 18+, native `fetch` inherits the default socket behavior, which will wait indefinitely if an upstream gateway establishes a TCP handshake but stops transmitting bytes.
2. **Zero Retry Logic**: If ESPN returns HTTP 429 (Too Many Requests), HTTP 503 (Service Unavailable), or a transient TCP reset (`ECONNRESET`), `get(url)` immediately throws. The scraper has no exponential backoff, jitter, or retry mechanism.
3. **Hardcoded User-Agent**: The user-agent is pinned to desktop Chrome 126 on macOS 10.15.7. While functional, long-term pinning of an aging Chrome version risks blacklisting by Akamai bot detection rules.
4. **Asymmetric Rate Limiting**: The 300ms delay (`sleep(300)`) applies exclusively between individual game boxscore requests. There is zero pause between the schedule request, the team stats request, and the first boxscore, and zero delay between consecutive seasons in `scrape-all.js`.

---

### 3.2 Error Recovery & Partial Scrape Failure Vulnerability

Lines 241–258 of `scripts/scrape.js` contain the most severe data-integrity defect in the ingestion engine:
```javascript
const boxscores = {}; // Line 241: In-memory dictionary initialized empty
for (const g of schedule) {
  if (!g.boxscoreAvailable) continue;
  process.stdout.write(`  game ${g.id} (${g.opponent})... `);
  try {
    const bs = await scrapeBoxscore(g.id);
    if (bs) {
      boxscores[g.id] = bs;
      log("ok");
    } else {
      log("no boxscore");
    }
  } catch (err) {
    log(`FAILED: ${err.message}`); // Line 254: Catches error, but fails to populate boxscores[g.id]
  }
  await sleep(300);
}
// Line 258: Unconditionally overwrites disk with whatever is in memory
await writeFile(join(yearDir, "boxscores.json"), JSON.stringify(boxscores, null, 2));
```

#### Catastrophic Data Loss Scenario
1. Suppose season `2024` is already completely scraped on disk with 12 complete game boxscores (~686 KB).
2. The operator runs `npm run scrape 2024` to refresh stats.
3. Games 1 through 5 scrape successfully and populate `boxscores`.
4. On Game 6 (e.g., vs. Oregon), ESPN's API experiences a transient 500 error or network blip.
5. Line 254 traps the error, logs `FAILED: HTTP 500`, and proceeds to Game 7.
6. The loop finishes with 11 games in `boxscores`. Game 6 is missing from the JavaScript object.
7. Line 258 executes `writeFile` directly onto `data/2024/boxscores.json`.
8. **Result**: Game 6's boxscore is permanently erased from disk. An operation intended to refresh stats destroys previously healthy historical data.

#### Non-Atomic File Writes
All file writes across `scripts/scrape.js` (lines 228, 235, 258, 265, 217) execute via `fs/promises.writeFile` without temporary files or atomic renaming:
- POSIX `writeFile` truncates the existing file to 0 bytes immediately upon open.
- If the Node process is killed (SIGINT, SIGTERM, power cut, or server crash) while writing an 800 KB `boxscores.json`, the file remains on disk as a corrupted, partial, or 0-byte file.
- Any frontend user browsing the site during an active scrape will encounter `SyntaxError: Unexpected end of JSON input` when reading the partially-written file.

---

### 3.3 Critical Data Omission: Postseason (`seasonType=3`) & 22 Years of Lost Records

The schedule ingestion function (`scripts/scrape.js:25–56`) queries ESPN via:
```javascript
const d = await get(`${BASE}/teams/${TEAM_ID}/schedule?season=${season}`);
```

#### Technical Root Cause
In ESPN's College Football API, the schedule endpoint partitions schedules by `seasonType`:
- `seasonType=1`: Preseason (rarely used in CFB).
- `seasonType=2`: Regular Season (including Conference Championship games).
- `seasonType=3`: Postseason (Bowl Games and the College Football Playoff).

When the `seasonType` query parameter is omitted, ESPN defaults to `seasonType=2`. Consequently, the API response terminates at the conclusion of the regular season / conference title game, completely truncating all bowl games and College Football Playoff matchups.

#### Historical Impact Across 2005–2026
This single parameter omission discards the crowning achievements in Ohio State's football history across the entire 22-year archive:

| Season | Games in Database | Actual Games Played | Missing Postseason Games (Completely Absent from Codebase) | Historical Consequence |
|---|---|---|---|---|
| **2014** | 13 | 15 | **Sugar Bowl** (CFP Semifinal vs. #1 Alabama, W 42-35)<br>**CFP National Championship** (vs. #2 Oregon, W 42-20) | **National Championship season has no championship games.** Archive cuts off after Wisconsin (59-0). |
| **2005** | 11 | 12 | **Fiesta Bowl** (vs. #5 Notre Dame, W 34-20) | Top-5 marquee bowl victory missing. |
| **2006** | 12 | 13 | **BCS National Championship** (vs. #2 Florida, L 14-41) | Undefeated regular season has no postseason record. |
| **2007** | 12 | 13 | **BCS National Championship** (vs. #2 LSU, L 24-38) | National championship appearance missing. |
| **2009** | 12 | 13 | **Rose Bowl** (vs. #7 Oregon, W 26-17) | Rose Bowl victory missing. |
| **2010** | 12 | 13 | **Sugar Bowl** (vs. #8 Arkansas, W 31-26) | Sugar Bowl victory missing. |
| **2015** | 12 | 13 | **Fiesta Bowl** (vs. #8 Notre Dame, W 44-28) | Postseason bowl victory missing. |
| **2016** | 12 | 13 | **Fiesta Bowl** (CFP Semifinal vs. #2 Clemson, L 0-31) | CFP semifinal appearance missing. |
| **2017** | 13 | 14 | **Cotton Bowl** (vs. #8 USC, W 24-7) | New Year's Six bowl victory missing. |
| **2018** | 13 | 14 | **Rose Bowl** (vs. #9 Washington, W 28-23) | Urban Meyer's final game as head coach missing. |
| **2019** | 13 | 14 | **Fiesta Bowl** (CFP Semifinal vs. #3 Clemson, L 23-29) | CFP semifinal classic missing. |
| **2020** | 9 (6 played) | 8 played | **Sugar Bowl** (CFP Semifinal vs. #2 Clemson, W 49-28)<br>**CFP National Championship** (vs. #1 Alabama, L 24-52) | Historic Sugar Bowl revenge victory & title game missing. |
| **2021** | 12 | 13 | **Rose Bowl** (vs. #11 Utah, W 48-45) | Historic 48-45 Rose Bowl shootout missing. |
| **2022** | 12 | 13 | **Peach Bowl** (CFP Semifinal vs. #1 Georgia, L 41-42) | CFP semifinal thriller missing. |
| **2023** | 12 | 13 | **Cotton Bowl** (vs. #9 Missouri, L 3-14) | Cotton Bowl missing. |
| **2024** | 12 | 14+ | **Inaugural 12-Team CFP Playoff Games** (Tennessee, etc.) | Entire expanded playoff run missing. |

#### Empirical Data Conflict in Committed Files
The severity of this defect is proven by comparing `data/2014/schedule.json` against `data/2014/team-stats.json`:
- `data/2014/schedule.json`: Contains exactly 13 games.
- `data/2014/team-stats.json`: Under `passing.teamGamesPlayed`, the value is **15**.
ESPN's team statistics endpoint aggregated all 15 games (including the Sugar Bowl and National Championship), but the schedule and boxscores omit them. Consequently:
- Ezekiel Elliott's 230 rushing yards against Alabama and 246 rushing yards against Oregon (476 total championship yards) are missing from `data/2014/boxscores.json`.
- On `players.html`, client-side aggregation calculates Ezekiel Elliott's 2014 season total as 1,402 yards instead of his actual 1,878 yards.

---

### 3.4 Multi-Season Data Integrity Across 2005–2026

Detailed audit across all 256 games and 22 seasons reveals three distinct eras of schema completeness:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                           HISTORICAL SCHEMA ERAS                              │
├─────────────────────┬───────────────────────────────┬─────────────────────────┤
│    2005 – 2015      │         2016 – 2022           │       2023 – 2026       │
│    (Legacy Era)     │        (Modern Era)           │      (Current Era)      │
├─────────────────────┼───────────────────────────────┼─────────────────────────┤
│ • winProb: 0%       │ • winProb: 100%               │ • winProb: 95%          │
│ • Defense: 0%       │ • Defense: 7.4% (sporadic)    │ • Defense: 90%          │
│ • Jerseys: 0%       │ • Jerseys: 97% populated      │ • Jerseys: 98.5%        │
│ • Positions: 0%     │ • Positions: 0%               │ • Positions: 0%         │
│ • Rosters: 0%       │ • Rosters: 0%                 │ • Rosters: 2026 only    │
└─────────────────────┴───────────────────────────────┴─────────────────────────┘
```

#### Detailed Breakdown of Multi-Season Anomalies:
1. **The Win Probability Cliff**:
   - `data/2005/boxscores.json` through `data/2015/boxscores.json`: `winProbability` is an empty array `[]` for 100% of games (132 games). ESPN did not generate win probability models prior to 2016.
   - Starting in 2016, ESPN introduced high-frequency play-by-play probability models, causing `boxscores.json` file sizes to surge from ~380 KB to ~685–800 KB per season.
2. **Defensive Player Stats Disappearance**:
   - `2005–2015`: Zero defensive stats exist in `osuPlayers.defensive` for all 132 games.
   - `2016–2022`: Defensive stats appear sporadically (only 6 out of 81 games, or 7.4%). In seasons like 2018, defensive stats exist for only one game.
   - **Frontend Impact**: `players.html` relies on `js/aggregate.js` to compute totals dynamically from boxscores. Because defense is missing or sporadic, historical defensive legends (James Laurinaitis, Malcolm Jenkins, Joey Bosa, Chase Young) show either 0 tackles or absurdly distorted totals (e.g., 3 tackles for an entire season).
3. **The 100% Null Position Defect**:
   - In `scripts/scrape.js:120`: `position: a.athlete?.position?.abbreviation ?? null`.
   - In ESPN's game summary API, athlete entries inside `boxscore.players` omit the `position` object. Across all 256 games from 2005 to 2026, **100% of player rows have `position: null`**.
4. **The Jersey Null Eras**:
   - In `2005–2013`: 100% of player rows have `jersey: null`. On `players.html`, historical players render with `" — "` in the jersey column.
   - Starting in `2014`: Jerseys are populated for ~98% of player records.
5. **Dead Schema Fields**:
   - `odds`: Across all 256 games in the database, `odds.details`, `odds.overUnder`, and `odds.winner` are `null`, and `odds.spread` is empty `[]`. ESPN's summary endpoint does not archive historical odds for past games.
   - `broadcast`: In `scripts/scrape.js:201`, `(d.broadcasts || []).map((b) => b.market ?? b.names ?? []).flat()`. In practice, this extracts generic market identifiers (e.g. `[ { "id": "1", "type": "National" } ]`) rather than human-readable network names (e.g., "FOX", "ABC", "ESPN").
6. **The Empty Team Stats Bug & README Inaccuracy**:
   - `README.md:44` claims: *"team season stats to 2015+"*.
   - **Empirical Reality**: Our audit confirmed that `data/<year>/team-stats.json` is **fully populated with valid data for all 22 seasons back to 2005**. The README claim is false.
   - However, in `team.html:36–46`, if a season's stats cannot be found, `cats` defaults to `{}`. The page checks `if (!Object.keys(cats).length)`, appends an empty-state message, but does not return. If `team-stats.json` contains category keys with empty sub-objects, `team.html` renders empty card containers without stat tiles.

---

## 4. Data Storage & Schema Structure

### 4.1 Directory Hierarchy & Storage Footprint

The repository stores all ingested data within a flat JSON directory tree:
```
data/
├── index.json                     (258 B)  - Master year registry
├── 2026/
│   ├── schedule.json              (4.6 KB) - 12 games (5 final, 7 upcoming)
│   ├── boxscores.json             (379 KB) - 5 game recaps
│   ├── team-stats.json            (16.1 KB)- 11 categories
│   └── roster.json                (31.6 KB)- 100 current athletes
├── 2025/
│   ├── schedule.json              (4.5 KB)
│   ├── boxscores.json             (799 KB)
│   └── team-stats.json            (16.3 KB)
└── 2005..2024/                    (3 files per season: schedule, boxscores, team-stats)
```

- **Total File Count**: Exactly 68 files.
- **Total Storage Footprint**: 12.53 MB uncompressed (~1.4 MB gzipped).
- **File Distribution**:
  - `schedule.json`: 3.4 KB to 4.9 KB per season (average ~4.2 KB).
  - `team-stats.json`: ~15.9 KB to ~16.4 KB per season across all 22 seasons.
  - `boxscores.json`: 344 KB (2020) to 799 KB (2025). 2005–2015 averages ~420 KB; 2016–2025 averages ~720 KB.
  - `roster.json`: Present **only** in `data/2026/` (100 players, 31.6 KB). Absent in 2005–2025.

---

### 4.2 JSON Schema Specifications

#### Schema 1: Master Catalog (`data/index.json`)
```json
{
  "years": [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005],
  "current": 2026
}
```

#### Schema 2: Season Schedule (`data/<year>/schedule.json`)
Array of normalized game objects:
```json
[
  {
    "id": "401628455",
    "week": 1,
    "date": "2024-08-31T19:30Z",
    "name": "Akron Zips at Ohio State Buckeyes",
    "homeAway": "home",
    "opponent": "Akron Zips",
    "opponentAbbr": "AKR",
    "venue": "Ohio Stadium",
    "neutralSite": false,
    "osuScore": 52,
    "oppScore": 6,
    "status": "final",
    "boxscoreAvailable": true
  }
]
```
- `id` (string, required): ESPN event identifier.
- `week` (number | null): Regular season week number. Null in certain neutral site / non-standard games.
- `date` (string, ISO 8601 UTC): Scheduled kickoff timestamp.
- `homeAway` (string): `"home"` or `"away"`.
- `venue` (string | null): Stadium name (4 nulls across 266 games: 2005 @ MINN, 2007 @ MINN, 2009 vs TOL, 2013 vs MSU).
- `osuScore` / `oppScore` (number | null): Null for canceled (3 games in 2020) or upcoming (7 games in 2026) games.
- `status` (string): `"final"`, `"canceled"`, or `"upcoming"`.
- `boxscoreAvailable` (boolean): `true` if ESPN generated a statistical boxscore.

#### Schema 3: Monolithic Season Boxscores (`data/<year>/boxscores.json`)
Dictionary keyed by `eventId`:
```json
{
  "401628455": {
    "eventId": "401628455",
    "osuTeam": {
      "firstDowns": { "firstDowns": "24" },
      "totalYards": { "totalYards": "404" },
      "possessionTime": { "possessionTime": "28:54" }
    },
    "oppTeam": { /* mirror of osuTeam */ },
    "osuPlayers": {
      "passing": {
        "labels": ["C/ATT", "YDS", "AVG", "TD", "INT", "QBR"],
        "rows": [
          {
            "id": "4433970",
            "name": "Will Howard",
            "position": null,
            "jersey": "18",
            "stats": ["17/26", "228", "8.8", "3", "0", "83.9"]
          }
        ]
      },
      "rushing": { "labels": ["CAR", "YDS", "AVG", "TD", "LONG"], "rows": [] },
      "receiving": { "labels": ["REC", "YDS", "AVG", "TD", "LONG"], "rows": [] },
      "defensive": { "labels": ["TOT", "SOLO", "SACKS", "TFL", "PD", "QB HUR", "TD"], "rows": [] }
    },
    "oppPlayers": { /* mirror of osuPlayers */ },
    "leaders": {
      "passingYards": {
        "name": "Will Howard",
        "id": "4433970",
        "position": "QB",
        "jersey": "18",
        "displayValue": "228 YDS, 3 TD",
        "value": 228
      }
    },
    "scoringPlays": [
      {
        "type": "Passing Touchdown",
        "text": "Will Howard pass to Jeremiah Smith for 16 yds...",
        "awayScore": 3,
        "homeScore": 7,
        "period": 1,
        "clock": "2:44"
      }
    ],
    "scoringDrives": [
      {
        "team": "Ohio State Buckeyes",
        "teamAbbr": "OSU",
        "description": "14 plays, 75 yards, 6:15",
        "result": "Touchdown",
        "plays": []
      }
    ],
    "winProbability": [
      { "homeWinPercentage": 0.985, "playId": "401628455101" }
    ],
    "attendance": 102011,
    "broadcast": [ { "id": "1", "type": "National" } ],
    "odds": { "details": null, "overUnder": null, "spread": [], "winner": null }
  }
}
```

#### Schema 4: Team Season Statistics (`data/<year>/team-stats.json`)
Hierarchical dictionary containing 11 standardized categories:
- Categories: `passing`, `rushing`, `receiving`, `miscellaneous`, `defensive`, `defensiveInterceptions`, `general`, `returning`, `kicking`, `punting`, `scoring`.
```json
{
  "passing": {
    "passingYards": { "value": 3765, "display": "3,765", "perGame": "289.6" },
    "completionAttempts": { "value": null, "display": "278-406", "perGame": null }
  }
}
```

#### Schema 5: Current Roster (`data/2026/roster.json`)
Array of athlete records (only present for 2026):
```json
[
  {
    "id": "5081820",
    "name": "David Adolph",
    "position": "WR",
    "positionGroup": "offense",
    "jersey": "82",
    "height": "6' 5\"",
    "weight": "210 lbs",
    "class": "SR",
    "hometown": null,
    "headshot": "https://a.espncdn.com/i/headshots/college-football/players/full/5081820.png"
  }
]
```

---

### 4.3 Monolithic vs. Modular Storage Architectural Evaluation

The decision to bundle an entire season's boxscores into a single monolithic file (`boxscores.json`) creates a major architectural tradeoff:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       STORAGE ARCHITECTURE TRADEOFF                             │
├───────────────────────────────────────┬─────────────────────────────────────────┤
│    CURRENT MONOLITHIC MODEL           │      PROPOSED MODULAR MODEL             │
│    data/{year}/boxscores.json         │      data/{year}/games/{id}.json        │
│    (380 KB – 800 KB per season)       │      (30 KB – 65 KB per game)           │
├───────────────────────────────────────┼─────────────────────────────────────────┤
│ Pros:                                 │ Pros:                                   │
│ • Single file write per season.       │ • game.html downloads only 45 KB.       │
│ • Simple flat directory structure.    │ • Single game updates touch 1 file.     │
│                                       │ • Zero risk of multi-game corruption.   │
│ Cons:                                 │ Cons:                                   │
│ • game.html downloads 800 KB for 1 gm │ • 12–15 individual files per season.    │
│ • Partial scrape wipes whole file.    │ • players.html needs precompiled stats. │
│ • Waterfall load penalty on mobile.   │                                         │
└───────────────────────────────────────┴─────────────────────────────────────────┘
```

#### The "Worst of Both Worlds" Dilemma in Current Code
1. **Network Overhead on Single-Game View**: When a user visits `game.html?year=2024&event=401628455`, the browser must download all 686 KB of `boxscores.json` containing 11 other games that are never rendered.
2. **Missing Metadata Normalization**: Despite downloading 686 KB, `boxscores.json` records **do not contain the opponent's name, game date, or final score**. As a result, `game.html` (lines 55 and 60) must execute a *second waterfall HTTP request* for `schedule.json` (4.5 KB) simply to display the game header.
3. **Client-Side Aggregation Bottleneck**: When visiting `players.html`, the browser downloads the 800 KB monolithic file and executes CPU-intensive JavaScript aggregation (`js/aggregate.js`) across thousands of row strings. If the backend instead pre-compiled a `player-stats.json` file during scraping, the payload would drop to ~15 KB, reducing page load latency by over 90%.

---

## 5. Static vs. Dynamic Deployment Handling

### 5.1 Static Hosting Constraints vs. Local Development Server

The application is structured with dual deployment targets:
1. **Local Development Server (`npm run serve`)**: Runs `scripts/server.js` on Node.js, providing static file serving and the active `POST /api/scrape` endpoint.
2. **Static Production Hosting (Vercel, GitHub Pages)**: Serves committed static files directly from the edge CDN. `README.md:70–78` designates Vercel as the deployment target.

#### Critical Friction Points in Static Deployment:
- **The "Refresh Stats" UI Failure**:
  - In `partials/header.html`, every page includes a "Refresh Stats" button.
  - In `js/scrape.js:16`, clicking this button triggers `fetch("/api/scrape", { method: "POST" })`.
  - On Vercel or GitHub Pages, `POST /api/scrape` does not exist. The platform returns a 404 HTML error page.
  - In `js/scrape.js:17`, `res.json()` fails with a JSON parse error on the 404 HTML body, triggering the `catch` block which sets the button text to `"Offline"` (line 27).
  - **User Impact**: Visitors to the public site see a prominent button that immediately turns into a broken "Offline" badge, creating an impression of system degradation.
- **Subpath Deployment Path Resolution Bug**:
  - `js/scrape.js:16` executes `fetch("/api/scrape", ...)`.
  - If deployed to GitHub Pages under a project subpath (e.g. `https://username.github.io/ohiostatefootball/`), the leading slash routes the request to the domain root (`https://username.github.io/api/scrape`), bypassing the repository entirely.
- **Missing Frontend Error Boundaries**:
  - `index.html:39`: `const schedule = await loadJSON(...)` executes without a `try/catch` block. If `schedule.json` fails to load (e.g., during CDN cache invalidation or 404), the script crashes unhandled, leaving a completely blank page.
  - `players.html:41` and `game.html:55, 60`: Top-level `await loadJSON(...)` calls lack error boundaries.
  - Only `team.html:37` and `roster.html:42` wrap `loadJSON` in `try/catch` and display graceful empty states.

---

### 5.2 Automated Ingestion Deficit & GitHub Actions Strategy

The repository contains **zero CI/CD automation** (no `.github/` directory exists).

#### Current Operational Burden
Currently, updating the site during the active 2026 season requires:
1. A developer must clone the repository locally.
2. Run `npm run scrape` on their local machine.
3. Commit modified JSON files to git.
4. Push to GitHub to trigger Vercel CDN redeployment.

Without automated background ingestion, the production website remains static and frozen until manual intervention occurs.

#### Recommended Automated Architecture
Implement a scheduled GitHub Actions workflow (`.github/workflows/scrape-and-deploy.yml`):
- Run on a cron schedule during the college football season (e.g., every Saturday evening and Sunday morning at 02:00, 06:00, and 12:00 UTC).
- Execute `node scripts/scrape.js`.
- If Git working tree detects changes in `data/`, commit and push directly to `main` with `[skip ci]` tags, triggering automated edge deployment on Vercel.

---

## 6. Identified Strengths

The backend implementation exhibits several exceptional engineering qualities:

1. **Zero External Runtime Dependencies**:
   - `package.json` contains no third-party packages. Everything runs on standard Node.js built-ins (`node:http`, `node:fs/promises`, and global `fetch`).
   - Guarantees zero npm supply-chain vulnerabilities, zero dependency deprecation breakage, and instant execution.
2. **Consolidated Boxscore Ingestion Efficiency**:
   - Rather than making separate network calls for game boxscores, player stats, team stats, play-by-play, scoring drives, and leaders, `scrapeBoxscore(eventId)` extracts **10 analytical datasets from a single ESPN `/summary` HTTP request**.
   - This architectural choice eliminates over 120 redundant network requests per season.
3. **Resilient Game Status Sanitization**:
   - `scripts/scrape.js:37–38, 49–51` gracefully handles `STATUS_CANCELED` and `STATUS_POSTPONED`. During the 2020 COVID season, ESPN reported canceled games (vs. Maryland, Illinois, Michigan) as 0–0 finals. The scraper identifies the status name, nulls out the scores, and sets `status: "canceled"`, preventing false 0–0 scores from polluting the records.
4. **Broad Historical Ingestion Coverage**:
   - Populated across 22 full seasons (2005 through 2026) encompassing 266 games and 256 complete game boxscores.
   - Team statistics (`team-stats.json`) are populated with 11 categories across all 22 seasons, far exceeding the documented availability in the project README.
5. **Pure Static CDN Distribution Model**:
   - Outputting flat JSON into predictable season directories (`data/<year>/`) enables cheap, infinitely scalable static hosting on global CDNs with zero database maintenance overhead.
6. **In-Memory Concurrency Protection**:
   - `scripts/server.js` implements a mutex flag (`let scraping = false`) that rejects overlapping scraping requests with HTTP 409 Conflict, preventing server CPU saturation.

---

## 7. Vulnerabilities, Reliability Risks & Bottlenecks

### Summary Risk Matrix

| ID | Category | Severity | Title | Impact |
|---|---|---|---|---|
| **V-01** | Security | **P0 - Critical** | Path Traversal in `/api/scrape` | Arbitrary directory creation and file writing outside `data/`. |
| **V-02** | Security | **P0 - Critical** | Sensitive Repository Disclosure | Static file server exposes `.git/HEAD` and `.vercel/project.json`. |
| **V-03** | Data Integrity | **P0 - Critical** | Missing Postseason Games (`seasonType=3`) | 22 years of Bowl and CFP Championship games completely missing. |
| **V-04** | Data Integrity | **P1 - High** | Destructive Overwrite on Partial Scrape | Single game network blip permanently wipes that game from disk. |
| **V-05** | Reliability | **P1 - High** | Non-Atomic File Writes | Interrupted scrape truncates files to 0 bytes; corrupted client reads. |
| **V-06** | Availability | **P1 - High** | Stalled Socket Server Mutex Deadlock | Missing fetch timeouts permanently locks `/api/scrape` in 409 status. |
| **V-07** | Availability | **P1 - High** | Unbounded Buffer Memory Exhaustion DoS | Huge POST chunk streaming causes V8 Out-Of-Memory server crash. |
| **V-08** | Performance | **P2 - Medium** | Monolithic Payload Waterfall Bottleneck | `game.html` forces 800 KB download + schedule waterfall for single game. |
| **V-09** | Data Quality | **P2 - Medium** | Distorted Client Stat Aggregation (QBR / Defense) | QBR reflects single-game peak; defense missing or undercounted. |
| **V-10** | Resilience | **P2 - Medium** | Burst Rate-Limiting Risk in `scrape-all.js` | 350 requests in <3 mins with 0ms inter-season delay risks IP ban. |
| **V-11** | Data Quality | **P2 - Medium** | UTC Date Shift Bug | Saturday night games render on Sunday due to UTC string formatting. |
| **V-12** | UX / Deploy | **P3 - Low** | Misleading "Offline" UI on Static Hosts | "Refresh Stats" fails on Vercel/GitHub Pages; lacks CI/CD automation. |
| **V-13** | Architecture | **P3 - Low** | Hardcoded Current Season Coupling | `CURRENT_SEASON = 2026` hardcoded across scripts and HTML files. |

---

## 8. Prioritized Recommendations & Actionable Next Steps

### Priority 0: Critical Security & Historical Integrity Remediations

#### P0.1 Fix Path Traversal in `/api/scrape`
**Vulnerability**: An unvalidated `season` string in `POST /api/scrape` allows directory creation and file overwrites outside `data/`.  
**Remediation**: Enforce strict numeric integer validation in `scripts/server.js` and path boundary confinement in `scripts/scrape.js`.

In `scripts/server.js` (lines 37–42):
```javascript
// REPLACE lines 37-42 with:
let season;
try {
  const parsed = body ? JSON.parse(body).season : undefined;
  if (parsed !== undefined) {
    const num = Number(parsed);
    if (!Number.isInteger(num) || num < 2000 || num > 2050) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Invalid season parameter. Must be an integer between 2000 and 2050." }));
      return;
    }
    season = num;
  }
} catch {
  season = undefined;
}
```

In `scripts/scrape.js` (lines 221–224):
```javascript
export async function runScrape({ season = CURRENT_SEASON, log = console.log } = {}) {
  const safeSeason = Number(season);
  if (!Number.isInteger(safeSeason) || safeSeason < 2000 || safeSeason > 2050) {
    throw new Error(`Invalid season: ${season}. Must be an integer between 2000 and 2050.`);
  }
  await mkdir(DATA_DIR, { recursive: true });
  const yearDir = join(DATA_DIR, String(safeSeason));
  if (!yearDir.startsWith(DATA_DIR)) {
    throw new Error("Path traversal violation");
  }
  await mkdir(yearDir, { recursive: true });
  ...
```

---

#### P0.2 Block Sensitive Repository File Disclosure in Dev Server
**Vulnerability**: Sibling directory prefix matching and lack of hidden file filtering expose `.git/HEAD`, `.vercel/project.json`, and `package.json`.  
**Remediation**: Enforce trailing slash jailing and block dotfiles and sensitive metadata.

In `scripts/server.js` (lines 56–63):
```javascript
// REPLACE lines 56-63 with:
let path = url.pathname === "/" ? "/index.html" : url.pathname;

// 1. Block dotfiles, hidden directories, and sensitive repository configuration
const segments = path.split("/");
if (
  segments.some((seg) => seg.startsWith(".")) ||
  path.toLowerCase().includes("package.json") ||
  path.toLowerCase().includes("readme.md")
) {
  res.writeHead(403, { "Content-Type": "text/plain" });
  res.end("Forbidden");
  return;
}

// 2. Strict root jail confinement (require ROOT + path separator)
let filePath = normalize(join(ROOT, path));
if (!filePath.startsWith(ROOT + "/") && filePath !== ROOT) {
  res.writeHead(403, { "Content-Type": "text/plain" });
  res.end("Forbidden");
  return;
}
```

---

#### P0.3 Ingest Postseason Games (`seasonType=3`) to Capture 22 Years of Bowls & CFP Matchups
**Vulnerability**: Omitting `seasonType=3` drops all Bowl games and College Football Playoff games across 2005–2026.  
**Remediation**: In `scripts/scrape.js:scrapeSchedule(season)`, query both `seasonType=2` (regular season) and `seasonType=3` (postseason), merge the events, deduplicate by event ID, and sort chronologically by kickoff date.

In `scripts/scrape.js` (replace lines 25–56):
```javascript
async function scrapeSchedule(season) {
  // Query both regular season (seasonType=2) and postseason (seasonType=3)
  const [regData, postData] = await Promise.all([
    get(`${BASE}/teams/${TEAM_ID}/schedule?season=${season}&seasonType=2`).catch(() => ({ events: [] })),
    get(`${BASE}/teams/${TEAM_ID}/schedule?season=${season}&seasonType=3`).catch(() => ({ events: [] })),
  ]);

  const rawEvents = [...(regData.events || []), ...(postData.events || [])];
  
  // Deduplicate events by id
  const seenIds = new Set();
  const uniqueEvents = [];
  for (const e of rawEvents) {
    if (e.id && !seenIds.has(e.id)) {
      seenIds.add(e.id);
      uniqueEvents.push(e);
    }
  }

  // Sort chronologically by date
  uniqueEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  const games = [];
  for (const e of uniqueEvents) {
    const comp = e.competitions?.[0];
    if (!comp) continue;
    const osu = comp.competitors?.find((c) => c.id === TEAM_ID);
    const opp = comp.competitors?.find((c) => c.id !== TEAM_ID);
    const score = (c) => (c?.score?.value != null ? Number(c.score.value) : null);
    const statusType = comp.status?.type;
    const unplayed =
      statusType?.name === "STATUS_CANCELED" || statusType?.name === "STATUS_POSTPONED";

    games.push({
      id: e.id,
      week: e.week?.number ?? null,
      date: e.date,
      name: e.name,
      homeAway: osu?.homeAway ?? null,
      opponent: opp?.team?.displayName ?? null,
      opponentAbbr: opp?.team?.abbreviation ?? null,
      venue: comp.venue?.fullName ?? null,
      neutralSite: comp.neutralSite ?? false,
      osuScore: unplayed ? null : score(osu),
      oppScore: unplayed ? null : score(opp),
      status: statusType?.completed ? "final" : unplayed ? "canceled" : "upcoming",
      boxscoreAvailable: comp.boxscoreAvailable ?? false,
    });
  }
  return games;
}
```

---

### Priority 1: High Reliability, Mutex Deadlock & Concurrency Hardening

#### P1.1 Implement Safe Cache Merging in `scrape.js`
**Vulnerability**: A network failure on an individual game during a re-scrape erases that game's boxscore from disk.  
**Remediation**: Load existing `boxscores.json` from disk before scraping and merge newly fetched boxscores into the existing dictionary. Only overwrite if the fetch succeeds.

In `scripts/scrape.js` (lines 240–260):
```javascript
  log(`Scraping ${season} per-game boxscores...`);
  const boxscoresPath = join(yearDir, "boxscores.json");
  
  // 1. Load pre-existing boxscores from disk to prevent data loss on partial failure
  let boxscores = {};
  try {
    const existingRaw = await readFile(boxscoresPath, "utf8");
    boxscores = JSON.parse(existingRaw);
  } catch {
    boxscores = {};
  }

  let updatedCount = 0;
  for (const g of schedule) {
    if (!g.boxscoreAvailable) continue;
    
    // Incremental optimization: Skip completed historical games already in cache
    if (boxscores[g.id] && g.status === "final" && season !== CURRENT_SEASON) {
      continue;
    }

    process.stdout.write(`  game ${g.id} (${g.opponent})... `);
    try {
      const bs = await scrapeBoxscore(g.id);
      if (bs) {
        boxscores[g.id] = bs;
        updatedCount++;
        log("ok");
      } else {
        log("no boxscore");
      }
    } catch (err) {
      log(`FAILED: ${err.message} (preserved existing cached record)`);
    }
    await sleep(300);
  }
  
  await atomicWriteJSON(boxscoresPath, boxscores);
  log(`  ${Object.keys(boxscores).length} total boxscores (${updatedCount} updated)`);
```

---

#### P1.2 Implement Atomic File Writes
**Vulnerability**: `fs.writeFile` truncates files on open, risking corrupted 0-byte files upon process interruption.  
**Remediation**: Write data to a unique temporary file (`.tmp`) and perform an atomic `fs.rename`.

Add helper to `scripts/scrape.js`:
```javascript
import { writeFile, mkdir, readFile, rename } from "node:fs/promises";

async function atomicWriteJSON(targetPath, data) {
  const tmpPath = `${targetPath}.tmp.${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
  await rename(tmpPath, targetPath);
}
```
Replace all direct `writeFile` calls in `scripts/scrape.js` with `atomicWriteJSON`.

---

#### P1.3 Add Timeout Guards & Exponential Backoff to Network Requests
**Vulnerability**: Hung fetch sockets permanently deadlock `/api/scrape` in 409 status. Transient errors fail immediately.  
**Remediation**: Implement `AbortSignal.timeout(10000)` and a 3-attempt exponential backoff retry loop for 429 and 5xx responses.

In `scripts/scrape.js` (lines 13–23):
```javascript
async function get(url, retries = 3, backoffMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000), // 10-second timeout guard
      });

      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        if (attempt === retries) throw new Error(`HTTP ${res.status} for ${url}`);
        const delay = backoffMs * Math.pow(2, attempt - 1) + Math.random() * 500;
        await sleep(delay);
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(backoffMs * attempt);
    }
  }
}
```

---

#### P1.4 Enforce Maximum Request Body Limits on POST Endpoints
**Vulnerability**: Unbounded streaming of request body causes memory exhaustion (OOM).  
**Remediation**: Track byte count during chunk accumulation and terminate stream if body exceeds 10 KB.

In `scripts/server.js` (lines 35–37):
```javascript
    let body = "";
    let bodyLength = 0;
    const MAX_BODY_BYTES = 10 * 1024; // 10 KB limit is ample for {"season": 2026}

    for await (const chunk of req) {
      bodyLength += chunk.length;
      if (bodyLength > MAX_BODY_BYTES) {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Payload Too Large" }));
        req.destroy();
        return;
      }
      body += chunk;
    }
```

---

### Priority 2: Performance, Data Granularity & Network Optimization

#### P2.1 Pre-Compile `player-stats.json` & Modularize Game Boxscores
1. **Pre-Compile Season Player Statistics**:
   - In `scripts/scrape.js`, invoke the aggregation logic during scraping and write `data/<year>/player-stats.json` (~15 KB).
   - In `players.html`, download `player-stats.json` directly instead of downloading 800 KB of raw boxscores and parsing strings in the client.
2. **Modularize Game Boxscores**:
   - Write individual game recaps to `data/<year>/games/<eventId>.json` (30–60 KB each).
   - Embed essential game metadata (`opponent`, `date`, `osuScore`, `oppScore`) directly within the game JSON, eliminating the waterfall request for `schedule.json` in `game.html`.

#### P2.2 Insert Delays in `scrape-all.js`
In `scripts/scrape-all.js`:
```javascript
for (const year of YEARS) {
  console.log(`\n===== ${year} =====`);
  try {
    await runScrape({ season: year });
  } catch (err) {
    console.error(`  ${year} FAILED: ${err.message}`);
  }
  await sleep(1500); // 1.5-second pause between seasons to respect ESPN rate limits
}
```

#### P2.3 Fix UTC Timezone Offset Bug in Client Date Formatting
**Bug**: Games kicking off at 8:00 PM EDT (00:00 UTC Sunday) render on Sunday instead of Saturday because `fmtDate` enforces `timeZone: "UTC"`.  
**Remediation**: In `js/data.js`, format game dates in Ohio local time (`America/New_York`):
```javascript
export function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

export function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}
```

#### P2.4 Fix QBR Math in Aggregation & Synthesize Historical Rosters
1. **QBR Aggregation**: In `js/aggregate.js`, compute a pass-attempt-weighted season Total QBR instead of taking `Math.max(p.maxes[i], n)` (which records a player's single-game high).
2. **Synthesize Historical Rosters (2005–2025)**: While ESPN's roster endpoint only supports the active season, `scripts/scrape.js` can synthesize historical rosters by aggregating unique athlete records from each season's boxscores, generating `data/<year>/roster.json` archives for all 22 seasons.

---

### Priority 3: Operational Automation & UX Polish

#### P3.1 Automated GitHub Actions Scraper Workflow
Create `.github/workflows/scrape-and-deploy.yml`:
```yaml
name: Automated Season Scraper

on:
  schedule:
    # Run at 04:00 and 12:00 UTC every Sunday during football season (Sept - Jan)
    - cron: '0 4,12 * 9-12,1 0'
  workflow_dispatch: # Enable manual one-click trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run Current Season Scraper
        run: node scripts/scrape.js

      - name: Commit and Push Changes
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git add data/
          if git diff --staged --quiet; then
            echo "No data changes detected."
          else
            git commit -m "chore(data): automated ESPN stats ingestion [skip ci]"
            git push origin main
          fi
```

#### P3.2 Production UI Graceful Handling for "Refresh Stats"
In `js/scrape.js`, test whether the `/api/scrape` endpoint exists on initial page load with a lightweight `HEAD` request. If running on a static host (Vercel/GitHub Pages), hide the "Refresh Stats" button or render a tooltip: *"Stats automatically updated via daily scheduled ingestion"*.

#### P3.3 Centralize Dynamic Season Configuration
Eliminate hardcoded `2026` across HTML templates. Read `data/index.json` once, populate year dropdowns dynamically, and default to `index.current` rather than hardcoding `"2026"`.

---

## 9. Conclusion

The Ohio State Football Stats backend achieves high efficiency, zero-dependency simplicity, and low-cost static CDN distribution. However, the discovery that **22 years of postseason and championship records are completely absent** due to an omitted API parameter, coupled with **silent data loss on network glitches** and **arbitrary file writing vulnerabilities**, necessitates immediate implementation of the Priority 0 and Priority 1 remediations outlined in this review. Adopting atomic writes, cache merging, postseason API parameters, and automated GitHub Actions ingestion will transform this codebase into an enterprise-grade, resilient historical sports archive.
