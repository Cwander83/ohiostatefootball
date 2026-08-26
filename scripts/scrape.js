import { writeFile, mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const TEAM_ID = "194"; // Ohio State
const CURRENT_SEASON = 2026;
const BASE = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function scrapeSchedule(season) {
  const d = await get(`${BASE}/teams/${TEAM_ID}/schedule?season=${season}`);
  const games = [];
  for (const e of d.events || []) {
    const comp = e.competitions?.[0];
    if (!comp) continue;
    const osu = comp.competitors.find((c) => c.id === TEAM_ID);
    const opp = comp.competitors.find((c) => c.id !== TEAM_ID);
    const score = (c) => (c?.score?.value != null ? Number(c.score.value) : null);
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
      osuScore: score(osu),
      oppScore: score(opp),
      status: comp.status?.type?.completed ? "final" : "upcoming",
      boxscoreAvailable: comp.boxscoreAvailable ?? false,
    });
  }
  return games;
}

async function scrapeRoster() {
  const d = await get(`${BASE}/teams/${TEAM_ID}/roster`);
  const players = [];
  for (const group of d.athletes || []) {
    for (const a of group.items || []) {
      players.push({
        id: a.id,
        name: a.displayName,
        position: a.position?.abbreviation ?? null,
        positionGroup: group.position ?? null,
        jersey: a.jersey ?? null,
        height: a.displayHeight ?? null,
        weight: a.displayWeight ?? null,
        class: a.experience?.abbreviation ?? a.experience?.displayName ?? null,
        hometown: a.hometown ?? null,
        headshot: a.headshot?.href ?? null,
      });
    }
  }
  return players;
}

async function scrapeTeamStats(season) {
  const d = await get(`${BASE}/teams/${TEAM_ID}/statistics?season=${season}`);
  const cats = {};
  for (const cat of d.results?.stats?.categories || []) {
    const stats = {};
    for (const s of cat.stats || []) {
      stats[s.name] = {
        value: s.value,
        display: s.displayValue,
        perGame: s.perGameDisplayValue ?? null,
      };
    }
    cats[cat.name] = stats;
  }
  return cats;
}

async function scrapeBoxscore(eventId) {
  const d = await get(`${BASE}/summary?event=${eventId}`);
  const bs = d.boxscore;
  if (!bs) return null;
  const osu = bs.teams?.find((t) => t.team?.id === TEAM_ID);
  const opp = bs.teams?.find((t) => t.team?.id !== TEAM_ID);
  const teamStats = (t) => {
    const out = {};
    for (const cat of t?.statistics || []) {
      out[cat.name] = {};
      for (const s of cat.stats || []) out[cat.name][s.name] = s.displayValue;
    }
    return out;
  };
  const playerStats = (teamId) => {
    const team = (bs.players || []).find((t) => t.team?.id === teamId);
    const out = {};
    for (const grp of team?.statistics || []) {
      const rows = [];
      for (const a of grp.athletes || []) {
        rows.push({
          id: a.athlete?.id ?? null,
          name: a.athlete?.displayName ?? null,
          position: a.athlete?.position?.abbreviation ?? null,
          jersey: a.athlete?.jersey ?? null,
          stats: a.stats ?? [],
        });
      }
      out[grp.name] = { labels: grp.labels ?? [], rows };
    }
    return out;
  };
  const leaders = () => {
    // leaders is per-team; pick the Ohio State entry.
    const teamLeaders = (d.leaders || []).find((t) => t.team?.id === TEAM_ID)?.leaders || [];
    const out = {};
    for (const cat of teamLeaders) {
      const top = cat.leaders?.[0];
      if (!top) continue;
      const a = top.athlete || {};
      out[cat.name] = {
        name: a.displayName ?? a.fullName ?? null,
        id: a.id ?? null,
        position: a.position?.abbreviation ?? null,
        jersey: a.jersey ?? null,
        displayValue: top.displayValue ?? null,
        value: top.value ?? null,
      };
    }
    return out;
  };
  const scoringPlays = () =>
    (d.scoringPlays || []).map((p) => ({
      type: p.type?.text ?? null,
      text: p.text ?? null,
      awayScore: p.awayScore ?? null,
      homeScore: p.homeScore ?? null,
      period: p.period?.number ?? null,
      clock: p.clock?.displayValue ?? null,
    }));
  const scoringDrives = () => {
    const prev = d.drives?.previous || {};
    return Object.values(prev)
      .filter((dr) => dr.isScore)
      .map((dr) => ({
        team: dr.team?.displayName ?? null,
        teamAbbr: dr.team?.abbreviation ?? null,
        description: dr.description ?? null,
        result: dr.shortDisplayResult ?? dr.displayResult ?? dr.result ?? null,
        plays: (dr.plays || []).map((p) => ({
          text: p.text ?? null,
          awayScore: p.awayScore ?? null,
          homeScore: p.homeScore ?? null,
          period: p.period?.number ?? null,
          clock: p.clock?.displayValue ?? null,
        })),
      }));
  };
  const winprobability = () =>
    (d.winprobability || []).map((w) => ({
      homeWinPercentage: w.homeWinPercentage ?? null,
      playId: w.playId ?? null,
    }));
  const odds = () => {
    const line = (d.odds || [])[0] || {};
    const spread = (d.againstTheSpread || [])
      .map((r) => r.records || [])
      .flat()
      .filter(Boolean)
      .slice(0, 2)
      .map((r) => ({ team: r.team?.abbreviation ?? null, spread: r.spread ?? null, overUnder: r.overUnder ?? null }));
    return { details: line.details ?? null, overUnder: line.overUnder ?? null, spread, winner: line.winner ?? null };
  };
  return {
    eventId,
    osuTeam: teamStats(osu),
    oppTeam: teamStats(opp),
    osuPlayers: playerStats(TEAM_ID),
    oppPlayers: playerStats(opp?.team?.id),
    leaders: leaders(),
    scoringPlays: scoringPlays(),
    scoringDrives: scoringDrives(),
    winProbability: winprobability(),
    attendance: d.gameInfo?.attendance ?? null,
    broadcast: (d.broadcasts || []).map((b) => b.market ?? b.names ?? []).flat() ?? [],
    odds: odds(),
  };
}

async function readIndex() {
  try {
    const raw = await readFile(join(DATA_DIR, "index.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return { years: [], current: CURRENT_SEASON };
  }
}

async function writeIndex(years) {
  const index = { years: [...new Set(years)].sort((a, b) => b - a), current: CURRENT_SEASON };
  await writeFile(join(DATA_DIR, "index.json"), JSON.stringify(index, null, 2));
  return index;
}

export async function runScrape({ season = CURRENT_SEASON, log = console.log } = {}) {
  await mkdir(DATA_DIR, { recursive: true });
  const yearDir = join(DATA_DIR, String(season));
  await mkdir(yearDir, { recursive: true });

  log(`Scraping ${season} schedule...`);
  const schedule = await scrapeSchedule(season);
  await writeFile(join(yearDir, "schedule.json"), JSON.stringify(schedule, null, 2));
  log(`  ${schedule.length} games`);

  log(`Scraping ${season} team season stats...`);
  let teamStats = {};
  try {
    teamStats = await scrapeTeamStats(season);
    await writeFile(join(yearDir, "team-stats.json"), JSON.stringify(teamStats, null, 2));
  } catch (err) {
    log(`  team stats unavailable (${err.message})`);
  }

  log(`Scraping ${season} per-game boxscores...`);
  const boxscores = {};
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
      log(`FAILED: ${err.message}`);
    }
    await sleep(300);
  }
  await writeFile(join(yearDir, "boxscores.json"), JSON.stringify(boxscores, null, 2));
  log(`  ${Object.keys(boxscores).length} boxscores saved`);

  // Roster is only available for the current season.
  if (season === CURRENT_SEASON) {
    log("Scraping current roster...");
    const roster = await scrapeRoster();
    await writeFile(join(yearDir, "roster.json"), JSON.stringify(roster, null, 2));
    log(`  ${roster.length} players`);
  }

  const index = await writeIndex([...((await readIndex()).years || []), season]);
  log(`Available years: ${index.years.join(", ")}`);
  log("Done.");
  return { season, schedule: schedule.length, boxscores: Object.keys(boxscores).length };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const arg = process.argv[2];
  const season = arg ? Number(arg) : CURRENT_SEASON;
  runScrape({ season }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
