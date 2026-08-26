export function initScrapeButton() {
  const btn = document.getElementById("scrape-btn");
  if (!btn) return;

  const label = btn.querySelector(".scrape-label");
  const icon = btn.querySelector(".scrape-icon");

  btn.addEventListener("click", async () => {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.classList.add("scraping");
    label.textContent = "Scraping…";
    icon.textContent = "⟳";

    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        label.textContent = "Done ✓";
        setTimeout(() => { label.textContent = "Refresh Stats"; btn.disabled = false; btn.classList.remove("scraping"); }, 2000);
      } else {
        label.textContent = "Failed";
        console.error("Scrape failed:", data.error, data.log);
        setTimeout(() => { label.textContent = "Refresh Stats"; btn.disabled = false; btn.classList.remove("scraping"); }, 2000);
      }
    } catch (err) {
      label.textContent = "Offline";
      console.error("Scrape request failed:", err);
      setTimeout(() => { label.textContent = "Refresh Stats"; btn.disabled = false; btn.classList.remove("scraping"); }, 2000);
    }
  });
}
