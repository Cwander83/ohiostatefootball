// Aggregates per-game boxscore player stats into season totals.
// Handles per-column semantics: sum, average, max, and composite (e.g. "13/20").

function parseNum(v) {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// Split a composite like "13/20" into [num, den].
function parseComposite(v) {
  const m = String(v).split("/");
  if (m.length !== 2) return null;
  const a = parseNum(m[0]);
  const b = parseNum(m[1]);
  if (a == null || b == null) return null;
  return [a, b];
}

// Determine the "count" column (attempts/carries/receptions/returns) for a group.
// The count is always the first stats column for these groups.
function countColumn(labels) {
  return 0;
}

// Determine the "primary" (yards) column for AVG computation.
function primaryColumn(labels) {
  const idx = labels.indexOf("YDS");
  return idx >= 0 ? idx : null;
}

export function aggregateBoxscores(boxscores) {
  const groups = {};

  for (const bs of Object.values(boxscores)) {
    for (const [group, data] of Object.entries(bs.osuPlayers)) {
      if (!groups[group]) groups[group] = { labels: data.labels, players: new Map() };
      const labels = data.labels;
      const countIdx = countColumn(labels);
      const primIdx = primaryColumn(labels);

      for (const row of data.rows) {
        if (!row.id) continue;
        if (!groups[group].players.has(row.id)) {
          groups[group].players.set(row.id, {
            id: row.id,
            name: row.name,
            position: row.position,
            jersey: row.jersey,
            sums: labels.map(() => 0),
            counts: labels.map(() => 0),
            maxes: labels.map(() => null),
            comps: labels.map(() => [0, 0]),
            games: 0,
          });
        }
        const p = groups[group].players.get(row.id);
        p.games++;

        row.stats.forEach((v, i) => {
          const label = labels[i];
          if (label === "C/ATT" || label === "FG" || label === "XP") {
            const c = parseComposite(v);
            if (c) { p.comps[i][0] += c[0]; p.comps[i][1] += c[1]; }
            return;
          }
          const n = parseNum(v);
          if (n == null) return;
          p.sums[i] += n;
          if (label === "LONG" || label === "QBR") {
            p.maxes[i] = p.maxes[i] == null ? n : Math.max(p.maxes[i], n);
          }
        });
      }
    }
  }

  // Convert accumulated values into final display values per column.
  for (const g of Object.values(groups)) {
    const labels = g.labels;
    const countIdx = countColumn(labels);
    const primIdx = primaryColumn(labels);
    for (const p of g.players.values()) {
      const row = {};
      labels.forEach((label, i) => {
        if (label === "C/ATT" || label === "FG" || label === "XP") {
          row[label] = `${p.comps[i][0]}/${p.comps[i][1]}`;
        } else if (label === "LONG" || label === "QBR") {
          row[label] = p.maxes[i] ?? 0;
        } else if (label === "AVG" || label === "PCT") {
          // AVG = primary / count ; PCT = made / attempted (composite)
          if (label === "PCT" && p.comps[0]) {
            const [made, att] = p.comps[0];
            row[label] = att ? Math.round((made / att) * 1000) / 10 : 0;
          } else if (primIdx != null) {
            // Count is the C/ATT denominator (attempts) or the first column sum.
            let denom;
            if (labels[countIdx] === "C/ATT") denom = p.comps[countIdx][1];
            else denom = p.sums[countIdx];
            row[label] = denom ? Math.round((p.sums[primIdx] / denom) * 10) / 10 : 0;
          } else {
            row[label] = 0;
          }
        } else {
          row[label] = p.sums[i];
        }
      });
      p.row = row;
    }
  }

  return groups;
}
