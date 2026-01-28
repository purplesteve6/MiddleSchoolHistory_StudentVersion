(() => {
  const band = document.getElementById("dropdownBand");
  const arrow = document.getElementById("dropdownArrow");
  const navItems = document.querySelectorAll(".nav-item");
  const panels = document.querySelectorAll(".dropdown-panel");

  // The arrow is positioned inside dropdown-inner (which is position: relative in CSS)
  const inner = band ? band.querySelector(".dropdown-inner") : null;

  let activeKey = null;
  let closeTimer = null;

  function showPanel(key, anchorEl) {
    // Only open band for dropdown-enabled items
    const panel = document.querySelector(`.dropdown-panel[data-panel="${key}"]`);
    if (!panel) return;

    // Close any previously visible panel
    panels.forEach(p => p.classList.remove("is-visible"));
    panel.classList.add("is-visible");

    // Mark active nav item
    navItems.forEach(li => li.classList.remove("is-active"));
    const item = document.querySelector(`.nav-item[data-menu="${key}"]`);
    if (item) item.classList.add("is-active");

    // Open the band
    band.classList.add("is-open");
    band.setAttribute("aria-hidden", "false");

    // ---- Arrow positioning (centered under icon + label) ----
    // IMPORTANT: arrow is absolutely positioned inside .dropdown-inner,
    // so we compute left relative to .dropdown-inner’s bounding box.
    if (anchorEl && inner && arrow) {
      const rect = anchorEl.getBoundingClientRect();       // hovered nav-link
      const innerRect = inner.getBoundingClientRect();     // positioning context

      const arrowHalf = 10; // matches your CSS arrow (20px wide base)
      const centerX = rect.left + rect.width / 2;

      // Convert viewport X to inner-relative X
      let left = centerX - innerRect.left - arrowHalf;

      // Clamp so it stays within the inner padding area
      const minLeft = 18; // matches dropdown-inner padding in CSS
      const maxLeft = innerRect.width - 18 - (arrowHalf * 2);
      left = Math.max(minLeft, Math.min(left, maxLeft));

      arrow.style.left = `${left}px`;
    }
    // ---------------------------------------------

    activeKey = key;
  }

  function hideBand() {
    band.classList.remove("is-open");
    band.setAttribute("aria-hidden", "true");
    panels.forEach(p => p.classList.remove("is-visible"));
    navItems.forEach(li => li.classList.remove("is-active"));
    activeKey = null;
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(hideBand, 140);
  }

  // Hover behavior like NatGeo:
  // - hover nav item opens band
  // - moving into band keeps it open
  navItems.forEach(item => {
    const key = item.getAttribute("data-menu");
    const isDropdown = item.classList.contains("has-dropdown");

    item.addEventListener("mouseenter", () => {
      clearTimeout(closeTimer);

      if (!isDropdown) {
        hideBand();
        return;
      }

      // Anchor to the nav-link so arrow centers under icon+text (not the whole LI)
      const link = item.querySelector(".nav-link");
      showPanel(key, link);
    });

    item.addEventListener("mouseleave", () => {
      scheduleClose();
    });
  });

  band.addEventListener("mouseenter", () => {
    clearTimeout(closeTimer);
  });

  band.addEventListener("mouseleave", () => {
    scheduleClose();
  });

  // Accessibility: ESC closes dropdown
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideBand();
  });
})();
