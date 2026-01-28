(function(){
  function initRomanTimeline() {
    const mount = document.getElementById("timelineMount");
    if (!mount) return;

    // Per-page highlight (set this in the page): window.TIMELINE_ACTIVE_ID = "augustus";
    const activeId = (window.TIMELINE_ACTIVE_ID || "augustus").toString();

    // Inject only the timeline + controls (no headings/extra identifiers)
    mount.innerHTML = `
      <div class="timeline-head">
        <div class="timeline-controls">
          <div class="controlPill" title="Zoom changes how many pixels each year takes">
            <label for="zoom">Zoom</label>
            <input id="zoom" type="range" min="3" max="10" step="1" value="6" />
            <span class="tiny" id="zoomVal">6 px/yr</span>
          </div>

          <div class="controlPill" title="Jump the timeline to an emperor">
            <label for="centerSelect">Center on:</label>
            <select id="centerSelect" aria-label="Center timeline on an emperor"></select>
          </div>
        </div>
      </div>

      <div class="timelineViewport" id="viewport" tabindex="0" aria-label="Timeline viewport (scroll horizontally)">
        <div class="timelineCanvas" id="canvas"></div>
      </div>

      <div class="scrubber" aria-label="Timeline mini map scrubber">
        <div class="tiny"><b>Mini-map:</b> drag the gold window to jump through time</div>
        <div class="miniTrack" id="miniTrack">
          <div class="miniWindow" id="miniWindow" title="Drag to jump"></div>
        </div>
        <div class="tiny" id="yearReadout">Year: —</div>
      </div>
    `;

    // Now that markup exists, run the original timeline code (slightly adapted).
/* Red + gold alternating bars */
    const timelineColors = ["#FFD84A","#B3122A","#F2C94C","#7B0B1D","#E9B949","#9E0F26"];

    const range = { startYear: -60, endYear: 476 }; // 60 BCE → 476 CE

    const emperors = [
      { id:"augustus", name:"Augustus", startYear:-27, endYear:14, displayYears:"27 BCE–14 CE", colorIndex:0, image:"../images/Augustus_timeline.jpg", page:"./augustus.html" },
      { id:"tiberius", name:"Tiberius", startYear:14, endYear:37, displayYears:"14–37 CE", colorIndex:1, image:"../images/Tiberius_timeline.jpg", page:"./tiberius.html" },
      { id:"caligula", name:"Caligula", startYear:37, endYear:41, displayYears:"37–41 CE", colorIndex:2, image:"../images/Caligula_timeline.jpg", page:"./caligula.html" },
      { id:"claudius", name:"Claudius", startYear:41, endYear:54, displayYears:"41–54 CE", colorIndex:3, image:"../images/Claudius_timeline.jpg", page:"./claudius.html" },
      { id:"nero", name:"Nero", startYear:54, endYear:68, displayYears:"54–68 CE", colorIndex:4, image:"../images/Nero_timeline.jpg", page:"./nero.html" },
      { id:"trajan", name:"Trajan", startYear:98, endYear:117, displayYears:"98–117 CE", colorIndex:5, image:"../images/Trajan_timeline.jpg", page:"./trajan.html" },
      { id:"hadrian", name:"Hadrian", startYear:117, endYear:138, displayYears:"117–138 CE", colorIndex:0, image:"../images/Hadrian_timeline.jpg", page:"./hadrian.html" },
      { id:"marcus_aurelius", name:"Marcus Aurelius", startYear:161, endYear:180, displayYears:"161–180 CE", colorIndex:1, image:"../images/MarcusAurelius_timeline.jpg", page:"./marcus-aurelius.html" },
      { id:"diocletian", name:"Diocletian", startYear:284, endYear:305, displayYears:"284–305 CE", colorIndex:2, image:"../images/Diocletian_timeline.jpg", page:"./diocletian.html" },
      { id:"constantine", name:"Constantine", startYear:306, endYear:337, displayYears:"306–337 CE", colorIndex:3, image:"../images/Constantine_timeline.jpg", page:"./constantine.html" },
      { id:"theodosius", name:"Theodosius I", startYear:379, endYear:395, displayYears:"379–395 CE", colorIndex:4, image:"../images/TheodosiusI_timeline.jpg", page:"./theodosius.html" },
      { id:"romulus_augustulus", name:"Romulus Augustulus", startYear:475, endYear:476, displayYears:"475–476 CE", colorIndex:5, image:"../images/RomulusAugustulus_timeline.jpg", page:"./romulus-augustulus.html" }
    ];

    const specialEvents = [
      {
        type:"caesar",
        id:"caesar_assassinated",
        year:-44,
        line1:"Julius Caesar",
        line2:"assassinated",
        line3:"44 BCE",
        image:"../images/JuliusCaesar_timeline.jpg",
        page:"../events/caesar-assassination.html"
      },
      { type:"bubble", id:"empire_begins", year:-27, top:"27 BCE", bottom:"Empire Begins" },
      { type:"bubble", id:"west_falls", year:476, top:"476 CE", bottom:"Western Empire Falls" },
      { type:"bubble", id:"byzantine_established", year:330, top:"330 CE", bottom:"Byzantine Empire Established" }
    ];

    const viewport = document.getElementById("viewport");
    const canvas = document.getElementById("canvas");
    const zoom = document.getElementById("zoom");
    const zoomVal = document.getElementById("zoomVal");
    const yearReadout = document.getElementById("yearReadout");
    const miniTrack = document.getElementById("miniTrack");
    const miniWindow = document.getElementById("miniWindow");
    const centerSelect = document.getElementById("centerSelect");

    let pxPerYear = parseInt(zoom.value, 10);

    function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }

    function formatYear(y){
      if (y === 0) return "";
      return (y < 0) ? `${Math.abs(y)} BCE` : `${y} CE`;
    }

    function isBigTick(y){
      if (y === 0) return false;
      return (y % 50 === 0);
    }

    function makeTickYears(){
      const years = [];
      for (let y = range.startYear; y <= range.endYear; y += 10){
        if (y === 0) continue;
        years.push(y);
      }
      return years;
    }

    function yearToX(year){
      const adjusted = (year >= 1) ? (year - 1) : year; // skip year 0
      return (adjusted - range.startYear) * pxPerYear;
    }

    function totalWidth(){
      const totalYearsWithoutZero = (range.endYear - range.startYear) - 1;
      return totalYearsWithoutZero * pxPerYear;
    }

    function clearCanvas(){ while (canvas.firstChild) canvas.removeChild(canvas.firstChild); }

    function populateDropdown(){
      const current = centerSelect.value;
      centerSelect.innerHTML = "";
      for (const e of emperors){
        const opt = document.createElement("option");
        opt.value = e.id;
        opt.textContent = `${e.name} (${e.displayYears})`;
        centerSelect.appendChild(opt);
      }
      centerSelect.value = current || "augustus";
    }

    function centerOnEmperor(id){
      const e = emperors.find(x => x.id === id);
      if (!e) return;

      const left = yearToX(e.startYear);
      const right = yearToX(e.endYear);
      const w = Math.max(6, right - left);
      const centerX = left + (w / 2);

      viewport.scrollLeft = clamp(centerX - (viewport.clientWidth / 2), 0, viewport.scrollWidth);
      syncMiniWindow();
    }

    function getBarCenterY(){
      const cs = getComputedStyle(document.documentElement);
      const barsTop = parseFloat(cs.getPropertyValue("--barsTop"));
      const barTopInBars = parseFloat(cs.getPropertyValue("--barTopInBars"));
      const barH = parseFloat(cs.getPropertyValue("--barH"));
      return barsTop + barTopInBars + (barH/2);
    }

    function render(){
      clearCanvas();
      zoomVal.textContent = `${pxPerYear} px/yr`;
      canvas.style.width = totalWidth() + "px";

      const ticks = document.createElement("div");
      ticks.className = "ticks";
      canvas.appendChild(ticks);

      for (const y of makeTickYears()){
        const x = yearToX(y);

        const t = document.createElement("div");
        t.className = "tick " + (isBigTick(y) ? "big" : "small");
        t.style.left = x + "px";
        ticks.appendChild(t);

        if (isBigTick(y)){
          const lbl = document.createElement("div");
          lbl.className = "tickLabel";
          lbl.style.left = x + "px";
          lbl.textContent = formatYear(y);
          ticks.appendChild(lbl);
        }
      }

      const bars = document.createElement("div");
      bars.className = "bars";
      canvas.appendChild(bars);

      const line = document.createElement("div");
      line.className = "timelineLine";
      line.style.top = (getBarCenterY()) + "px";
      canvas.appendChild(line);

      for (const s of specialEvents){
        const x = yearToX(s.year);
        const m = document.createElement("div");
        m.className = "marker";
        m.style.left = x + "px";
        canvas.appendChild(m);
      }

      const bubbles = specialEvents.filter(s => s.type === "bubble")
        .map(s => ({...s, x: yearToX(s.year)}))
        .sort((a,b) => a.x - b.x);

      const rows = [[], [], []];
      for (const b of bubbles){
        let placedRow = 0;
        for (let r = 0; r < rows.length; r++){
          const last = rows[r][rows[r].length - 1];
          if (!last || Math.abs(b.x - last.x) > 230){
            placedRow = r;
            rows[r].push(b);
            break;
          }
          placedRow = r;
        }

        const note = document.createElement("div");
        note.className = "markerNote " + (placedRow === 1 ? "row2" : placedRow === 2 ? "row3" : "");
        note.style.left = b.x + "px";

        const bubble = document.createElement("div");
        bubble.className = "markerBubble";
        bubble.innerHTML = `<span class="t1">${b.top}</span><span class="t2">${b.bottom}</span>`;

        note.appendChild(bubble);
        canvas.appendChild(note);
      }

      const caesar = specialEvents.find(s => s.type === "caesar");
      if (caesar){
        const x = yearToX(caesar.year);

        const card = document.createElement("a");
        card.className = "emperor laneAbove eventCard";
        card.href = caesar.page;
        card.style.left = x + "px";
        card.title = "Julius Caesar assassinated (44 BCE)";
        card.setAttribute("aria-label", "Open event page: Julius Caesar assassinated 44 BCE");

        const stack = document.createElement("div");
        stack.className = "stack";

        const avatarWrap = document.createElement("div");
        avatarWrap.className = "avatarWrap";

        const img = document.createElement("img");
        img.alt = "Julius Caesar (timeline portrait)";
        img.src = caesar.image;
        img.onerror = () => { avatarWrap.innerHTML = `<div class="ph">Image<br/>Missing</div>`; };
        avatarWrap.appendChild(img);

        const text = document.createElement("div");
        text.className = "eventText";
        text.innerHTML = `
          <span>${caesar.line1}</span>
          <span>${caesar.line2}</span>
          <span>${caesar.line3}</span>
        `;

        const connector = document.createElement("div");
        connector.className = "connector";

        stack.appendChild(avatarWrap);
        stack.appendChild(text);
        card.appendChild(stack);
        card.appendChild(connector);
        canvas.appendChild(card);
      }

      emperors.forEach((e, idx) => {
        const left = yearToX(e.startYear);
        const right = yearToX(e.endYear);
        const w = Math.max(6, right - left);
        const cx = left + (w/2);

        const bar = document.createElement("a");
        bar.className = "bar";
        bar.href = e.page;
        bar.style.left = left + "px";
        bar.style.width = w + "px";
        bar.style.background = timelineColors[e.colorIndex % timelineColors.length];
        bar.title = `${e.name} (${e.displayYears})`;
        bar.setAttribute("aria-label", `Open page for ${e.name}`);
        bars.appendChild(bar);

        const laneClass = (idx % 2 === 0) ? "laneAbove" : "laneBelow";

        const emp = document.createElement("a");
        emp.className = `emperor ${laneClass}`;
        emp.href = e.page;
        emp.style.left = cx + "px";
        emp.title = `Open page for ${e.name}`;
        emp.setAttribute("aria-label", `Open page for ${e.name}`);

        const stack = document.createElement("div");
        stack.className = "stack";

        const meta = document.createElement("div");
        meta.className = "meta";

        const nm = document.createElement("div");
        nm.className = "empName";
        nm.textContent = e.name;

        const yrs = document.createElement("div");
        yrs.className = "empYears";
        yrs.textContent = `(${e.displayYears})`;

        meta.appendChild(nm);
        meta.appendChild(yrs);

        const avatarWrap = document.createElement("div");
        avatarWrap.className = "avatarWrap";

        const img = document.createElement("img");
        img.alt = `Portrait of ${e.name} (timeline portrait)`;
        img.src = e.image;
        img.onerror = () => { avatarWrap.innerHTML = `<div class="ph">Image<br/>Missing</div>`; };
        avatarWrap.appendChild(img);

        if (laneClass === "laneAbove"){
          stack.appendChild(avatarWrap);
          stack.appendChild(meta);
        } else {
          stack.appendChild(meta);
          stack.appendChild(avatarWrap);
        }

        const connector = document.createElement("div");
        connector.className = "connector";

        emp.appendChild(stack);
        emp.appendChild(connector);
        canvas.appendChild(emp);

        if (e.id === activeId){
          bar.style.boxShadow = "0 0 0 4px rgba(255,216,74,.20), 0 14px 30px rgba(0,0,0,.45)";
          bar.style.borderColor = "rgba(255,216,74,.55)";
          avatarWrap.style.boxShadow = "0 0 0 4px rgba(255,216,74,.14), 0 16px 34px rgba(0,0,0,.45)";
          nm.style.textDecoration = "underline";
        }
      });

      requestAnimationFrame(() => {
        positionLanesSymmetrically();
        adjustConnectors();
        syncMiniWindow();
      });
    }

    function positionLanesSymmetrically(){
      const cs = getComputedStyle(document.documentElement);
      const gap = parseFloat(cs.getPropertyValue("--gapToPortraitEdge"));
      const avatarH = parseFloat(cs.getPropertyValue("--avatar"));
      const barCenterY = getBarCenterY();

      const sampleAbove = canvas.querySelector(".emperor.laneAbove .avatarWrap");
      const sampleBelow = canvas.querySelector(".emperor.laneBelow .avatarWrap");

      let aboveAvatarOffsetTop = 0;
      let belowAvatarOffsetTop = 0;

      if (sampleAbove) aboveAvatarOffsetTop = sampleAbove.offsetTop;
      if (sampleBelow) belowAvatarOffsetTop = sampleBelow.offsetTop;

      const aboveLaneTop = (barCenterY - gap) - (aboveAvatarOffsetTop + avatarH);
      const belowLaneTop = (barCenterY + gap) - (belowAvatarOffsetTop);

      canvas.querySelectorAll(".emperor.laneAbove").forEach(el => el.style.top = aboveLaneTop + "px");
      canvas.querySelectorAll(".emperor.laneBelow").forEach(el => el.style.top = belowLaneTop + "px");
    }

    function adjustConnectors(){
      const barCenterY = getBarCenterY();
      const cards = canvas.querySelectorAll(".emperor");

      cards.forEach(card => {
        const avatar = card.querySelector(".avatarWrap");
        const connector = card.querySelector(".connector");
        if (!avatar || !connector) return;

        const cardTop = card.offsetTop;
        const avatarTop = cardTop + avatar.offsetTop;
        const avatarBottom = avatarTop + avatar.offsetHeight;

        const isAbove = card.classList.contains("laneAbove");
        const portraitEdgeY = isAbove ? avatarBottom : avatarTop;

        const minY = Math.min(portraitEdgeY, barCenterY);
        const maxY = Math.max(portraitEdgeY, barCenterY);
        const height = Math.max(0, maxY - minY);

        connector.style.left = "50%";
        connector.style.top = (minY - cardTop) + "px";
        connector.style.height = height + "px";

        connector.classList.toggle("dotTop", barCenterY === minY);
      });

      const line = canvas.querySelector(".timelineLine");
      if (line) line.style.top = barCenterY + "px";
    }

    viewport.addEventListener("wheel", (e) => {
      if (viewport.scrollWidth > viewport.clientWidth){
        e.preventDefault();
        viewport.scrollLeft += (e.deltaY + e.deltaX);
        syncMiniWindow();
      }
    }, { passive:false });

    viewport.addEventListener("mousemove", (e) => {
      const rect = viewport.getBoundingClientRect();
      const xInViewport = e.clientX - rect.left;
      const xOnCanvas = viewport.scrollLeft + xInViewport;

      const adjustedYear = Math.round((xOnCanvas / pxPerYear) + range.startYear);
      let realYear = adjustedYear;
      if (adjustedYear >= 0) realYear = adjustedYear + 1;

      yearReadout.textContent = `Year: ${formatYear(realYear) || "—"}`;
    });
    viewport.addEventListener("mouseleave", () => { yearReadout.textContent = "Year: —"; });

    zoom.addEventListener("input", () => {
      const oldPx = pxPerYear;
      const newPx = parseInt(zoom.value, 10);

      const centerCanvasX = viewport.scrollLeft + (viewport.clientWidth/2);
      const centerAdjusted = (centerCanvasX / oldPx) + range.startYear;

      pxPerYear = newPx;
      render();

      const newCenterCanvasX = (centerAdjusted - range.startYear) * pxPerYear;
      viewport.scrollLeft = clamp(newCenterCanvasX - (viewport.clientWidth/2), 0, viewport.scrollWidth);

      syncMiniWindow();
      requestAnimationFrame(adjustConnectors);
    });

    centerSelect.addEventListener("change", () => centerOnEmperor(centerSelect.value));

    function syncMiniWindow(){
      const total = viewport.scrollWidth;
      const view = viewport.clientWidth;
      if (!total || total <= 0) return;

      const trackW = miniTrack.clientWidth;
      const ratio = trackW / total;

      const winW = Math.max(28, view * ratio);
      const winL = viewport.scrollLeft * ratio;

      miniWindow.style.width = winW + "px";
      miniWindow.style.left = winL + "px";
    }

    let dragging = false;
    let dragOffset = 0;

    miniWindow.addEventListener("mousedown", (e) => {
      dragging = true;
      dragOffset = e.clientX - miniWindow.getBoundingClientRect().left;
      e.preventDefault();
    });
    window.addEventListener("mouseup", () => dragging = false);
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;

      const trackRect = miniTrack.getBoundingClientRect();
      const trackW = trackRect.width;
      const total = viewport.scrollWidth;
      const view = viewport.clientWidth;

      const ratio = trackW / total;
      const winW = Math.max(28, view * ratio);

      let newLeft = (e.clientX - trackRect.left) - dragOffset;
      newLeft = clamp(newLeft, 0, trackW - winW);

      miniWindow.style.left = newLeft + "px";
      viewport.scrollLeft = newLeft / ratio;

      syncMiniWindow();
    });

    miniTrack.addEventListener("mousedown", (e) => {
      if (e.target === miniWindow) return;

      const trackRect = miniTrack.getBoundingClientRect();
      const clickX = e.clientX - trackRect.left;

      const total = viewport.scrollWidth;
      const view = viewport.clientWidth;
      const trackW = trackRect.width;
      const ratio = trackW / total;

      const winW = Math.max(28, view * ratio);
      const targetLeft = clamp(clickX - winW/2, 0, trackW - winW);

      viewport.scrollLeft = targetLeft / ratio;
      syncMiniWindow();
    });

    window.addEventListener("resize", () => {
      syncMiniWindow();
      requestAnimationFrame(() => { positionLanesSymmetrically(); adjustConnectors(); });
    });

    populateDropdown();
    render();

    requestAnimationFrame(() => {
      centerSelect.value = activeId;
      centerOnEmperor(activeId);
      adjustConnectors();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRomanTimeline);
  } else {
    initRomanTimeline();
  }
})();
