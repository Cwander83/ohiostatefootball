// Small DOM helpers used across pages.

export function emptyState(big, body) {
  const wrap = document.createElement("div");
  wrap.className = "empty";
  const title = document.createElement("div");
  title.className = "big";
  title.textContent = big;
  wrap.appendChild(title);
  if (body) {
    wrap.appendChild(document.createTextNode(body));
  }
  return wrap;
}

export async function loadPartial(targetId, url) {
  const html = await (await fetch(url)).text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const target = document.getElementById(targetId);
  target.replaceChildren();
  for (const child of [...doc.body.childNodes]) {
    target.appendChild(child);
  }
}
