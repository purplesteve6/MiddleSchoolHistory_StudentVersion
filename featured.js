(async () => {
  const linkEl = document.getElementById("featuredLink");
  const mediaEl = document.getElementById("featuredMedia");
  const titleEl = document.getElementById("featuredTitle");
  const descEl  = document.getElementById("featuredDesc");
  const badgeEl = document.getElementById("featuredBadge");

  try {
    const res = await fetch("/data/topics.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`topics.json fetch failed: ${res.status}`);
    const topics = await res.json();

    const valid = topics.filter(t => t && t.title && t.url && t.image);
    if (!valid.length) throw new Error("No valid topics found in topics.json");

    const pick = valid[Math.floor(Math.random() * valid.length)];

    linkEl.href = pick.url;
    mediaEl.style.backgroundImage = `url("${pick.image}")`;

    titleEl.textContent = pick.title;
    descEl.textContent = pick.description || "";
    badgeEl.textContent = `Featured Content • Grade ${pick.grade ?? ""}`.trim();
  } catch (err) {
    // Fallback (site still looks fine)
    titleEl.textContent = "Featured Content";
    descEl.textContent = "Add topics in /data/topics.json to enable random featured content.";
    badgeEl.textContent = "Featured Content";
    console.error(err);
  }
})();
