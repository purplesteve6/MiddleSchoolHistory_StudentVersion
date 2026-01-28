async function loadInto(id, url){
  const el = document.getElementById(id);
  if(!el) return;

  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok){
    console.warn(`[include.js] Failed to load ${url} (HTTP ${res.status})`);
    return;
  }
  el.innerHTML = await res.text();
}

function applyConfig(){
  const cfg = window.TOPIC_CONFIG || {};

  document.querySelectorAll("[data-bind]").forEach(el=>{
    const key = el.getAttribute("data-bind");
    if(cfg[key]) el.setAttribute("src", cfg[key]);
  });

  document.querySelectorAll("[data-bind-text]").forEach(el=>{
    const key = el.getAttribute("data-bind-text");
    if(cfg[key]) el.textContent = cfg[key];
  });

  document.querySelectorAll("[data-bind-href]").forEach(el=>{
    const key = el.getAttribute("data-bind-href");
    if(cfg[key]) el.setAttribute("href", cfg[key]);
  });

  const y = document.getElementById("copyright-year");
  if(y) y.textContent = new Date().getFullYear();
}

(async function(){
  // Works for BOTH spellings: /emperors/ and /empeors/
  const inEmperorSubfolder = /\/empe?rors\//i.test(location.pathname);
  const base = inEmperorSubfolder ? ".." : ".";

  await loadInto("siteHeader", "/partials/header.html");
  await loadInto("siteFooter", "/partials/footer.html");


  applyConfig();
})();
