import { loadIndex } from "./data.js";

export async function initYearSelect() {
  const sel = document.getElementById("year-select");
  const sub = document.getElementById("season-sub");
  if (!sel) return;

  const index = await loadIndex();
  const years = index.years || [];
  const current = index.current;

  for (const y of years) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = `${y} Season`;
    sel.appendChild(opt);
  }

  // Determine selected year from URL ?year= or default to current.
  const params = new URLSearchParams(location.search);
  const selected = params.get("year") ? Number(params.get("year")) : current;
  if (years.includes(selected)) sel.value = selected;
  else if (years.length) sel.value = years[0];

  if (sub) sub.textContent = `${sel.value} Season`;

  sel.addEventListener("change", () => {
    const url = new URL(location.href);
    url.searchParams.set("year", sel.value);
    location.href = url.toString();
  });
}
