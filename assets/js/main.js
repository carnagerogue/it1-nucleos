(function () {
  "use strict";

  // ============================================================
  // MOBILE NAV
  // ============================================================
  const toggle = document.querySelector("[data-menu-toggle]");
  const panel = document.querySelector("[data-mobile-panel]");
  const closeBtn = document.querySelector("[data-mobile-close]");

  function closeMenu() { if (panel) panel.classList.remove("open"); }
  if (toggle && panel) toggle.addEventListener("click", () => panel.classList.add("open"));
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  if (panel) panel.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));

  // ============================================================
  // REVEAL ON SCROLL — handles .reveal, [data-reveal], [data-stagger]
  // ============================================================
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const delay = parseInt(e.target.dataset.revealDelay || 0, 10);
        if (delay > 0) {
          setTimeout(() => e.target.classList.add("visible"), delay);
        } else {
          e.target.classList.add("visible");
        }
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

  document.querySelectorAll(".reveal, [data-reveal], [data-stagger]").forEach((el) => {
    revealObserver.observe(el);
  });

  // ============================================================
  // COUNT-UP STATS (for [data-count])
  // ============================================================
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    const dur = parseInt(el.dataset.dur || "1400", 10);
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = target * eased;
      const display = target % 1 === 0 ? Math.round(val) : val.toFixed(1);
      el.textContent = prefix + display + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        animateCount(e.target);
        countObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });

  document.querySelectorAll("[data-count]").forEach((el) => countObserver.observe(el));

  // ============================================================
  // PARALLAX SCROLL — applies translateY to [data-parallax]
  // Speed: how fast the element moves relative to scroll
  // Negative = slower, positive = faster
  // ============================================================
  const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
  let ticking = false;
  let lastScroll = 0;

  function updateParallax() {
    const scrollY = window.scrollY;
    const viewportH = window.innerHeight;

    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.2;
      const rect = el.getBoundingClientRect();
      const elTop = rect.top + scrollY;
      const elHeight = rect.height;

      // Only animate when element is in/near viewport
      if (rect.bottom < -200 || rect.top > viewportH + 200) return;

      // Distance from viewport center
      const elCenter = elTop + elHeight / 2;
      const viewCenter = scrollY + viewportH / 2;
      const offset = (elCenter - viewCenter) * speed * -1;

      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    });

    ticking = false;
  }

  function requestParallaxUpdate() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  if (parallaxEls.length > 0) {
    updateParallax();
    window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
    window.addEventListener("resize", requestParallaxUpdate, { passive: true });
  }

  // ============================================================
  // MAGNETIC HOVER (subtle button magnetism)
  // ============================================================
  document.querySelectorAll(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.15}px, ${y * 0.2}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });

  // ============================================================
  // FORM SUCCESS
  // ============================================================
  document.querySelectorAll("[data-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const success = form.querySelector("[data-form-success]");
      const fieldset = form.querySelector("fieldset, .form-fields");
      if (success) success.style.display = "block";
      if (fieldset) fieldset.style.display = "none";
    });
  });

  // ============================================================
  // PARTNER CAROUSEL
  // ============================================================
  document.querySelectorAll(".carousel").forEach((wrap) => {
    const track = wrap.querySelector("[data-carousel]");
    const prev = wrap.querySelector(".cs-prev");
    const next = wrap.querySelector(".cs-next");
    const bar = wrap.querySelector("[data-carousel-bar]");
    if (!track) return;

    function cardStep() {
      const card = track.querySelector(".cs-card");
      if (!card) return 320;
      const cs = window.getComputedStyle(track);
      const gap = parseFloat(cs.gap) || 16;
      return card.getBoundingClientRect().width + gap;
    }

    function visibleCards() {
      return Math.max(1, Math.floor(track.clientWidth / cardStep()));
    }

    function updateState() {
      const max = track.scrollWidth - track.clientWidth;
      const pct = max > 0 ? track.scrollLeft / max : 0;
      // Bar fills proportional to scrolled distance + visible window
      if (bar) {
        const visiblePct = track.clientWidth / track.scrollWidth;
        bar.style.width = (visiblePct * 100) + "%";
        const travel = (1 - visiblePct) * 100;
        bar.style.transform = `translateX(${pct * travel * (track.clientWidth / bar.parentElement.clientWidth)}%)`;
      }
      if (prev) prev.toggleAttribute("disabled", track.scrollLeft <= 4);
      if (next) next.toggleAttribute("disabled", track.scrollLeft >= max - 4);
    }

    if (prev) prev.addEventListener("click", () => {
      track.scrollBy({ left: -cardStep() * Math.max(1, visibleCards() - 1), behavior: "smooth" });
    });
    if (next) next.addEventListener("click", () => {
      track.scrollBy({ left: cardStep() * Math.max(1, visibleCards() - 1), behavior: "smooth" });
    });
    track.addEventListener("scroll", updateState, { passive: true });
    window.addEventListener("resize", updateState, { passive: true });
    updateState();

    // Keyboard support — arrow keys when carousel is focused/in view
    track.tabIndex = 0;
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); next && next.click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev && prev.click(); }
    });
  });

  // ============================================================
  // NAV SHADOW ON SCROLL
  // ============================================================
  const navWrap = document.querySelector(".nav-wrap");
  if (navWrap) {
    function updateNavShadow() {
      if (window.scrollY > 12) {
        navWrap.classList.add("scrolled");
      } else {
        navWrap.classList.remove("scrolled");
      }
    }
    window.addEventListener("scroll", updateNavShadow, { passive: true });
    updateNavShadow();
  }
})();
