export function makeSortableTable(container, { columns, rows, initialSort, initialDir = "desc" }) {
  let sortKey = initialSort;
  let sortDir = initialDir;

  function render() {
    const sorted = [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    const thead = document.createElement("thead");
    const tr = document.createElement("tr");
    for (const col of columns) {
      const th = document.createElement("th");
      th.textContent = col.label;
      th.dataset.key = col.key;
      if (col.key === sortKey) {
        th.classList.add("sorted");
        th.querySelector(".arrow")?.remove();
        const arrow = document.createElement("span");
        arrow.className = "arrow";
        arrow.textContent = sortDir === "asc" ? "▲" : "▼";
        th.appendChild(arrow);
      }
      th.addEventListener("click", () => {
        if (col.key === sortKey) {
          sortDir = sortDir === "asc" ? "desc" : "asc";
        } else {
          sortKey = col.key;
          sortDir = col.defaultDir || "desc";
        }
        render();
      });
      tr.appendChild(th);
    }
    thead.appendChild(tr);

    const tbody = document.createElement("tbody");
    for (const row of sorted) {
      const r = document.createElement("tr");
      for (const col of columns) {
        const td = document.createElement("td");
        const val = row[col.key];
        if (col.render) {
          td.appendChild(col.render(val, row));
        } else {
          td.textContent = val ?? "—";
        }
        if (col.class) td.classList.add(col.class);
        if (typeof val === "number") td.classList.add("num");
        r.appendChild(td);
      }
      tbody.appendChild(r);
    }

    container.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    const table = document.createElement("table");
    table.appendChild(thead);
    table.appendChild(tbody);
    wrap.appendChild(table);
    container.appendChild(wrap);
  }

  render();
  return { setRows: (r) => { rows = r; render(); } };
}
