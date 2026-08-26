import { runScrape } from "./scrape.js";

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005];

for (const year of YEARS) {
  console.log(`\n===== ${year} =====`);
  try {
    await runScrape({ season: year });
  } catch (err) {
    console.error(`  ${year} FAILED: ${err.message}`);
  }
}
console.log("\nAll years done.");
