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
  // CURSOR SPOTLIGHT — radial highlight follows cursor on cards
  // ============================================================
  const spotlightSelector = ".feature, .sector, .compliance-badge, .trust-badge, .step, .value";
  document.querySelectorAll(spotlightSelector).forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mx", x + "%");
      card.style.setProperty("--my", y + "%");
    }, { passive: true });
  });

  // ============================================================
  // SUBTLE 3D TILT on key cards
  // ============================================================
  const tiltSelector = ".value, .step, .cs-card, .compliance-badge";
  document.querySelectorAll(tiltSelector).forEach((card) => {
    let raf = null;
    card.addEventListener("mousemove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(1000px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-4px)`;
        raf = null;
      });
    }, { passive: true });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });

  // ============================================================
  // LIVE PRODUCT DEMO — make mockups feel interactive
  // ============================================================
  document.querySelectorAll(".product-shot").forEach((shot) => {
    const cats = shot.querySelectorAll(".ps-cat");
    const apps = shot.querySelectorAll(".ps-app-card");
    const search = shot.querySelector("[data-search]");
    const searchText = shot.querySelector("[data-search-text]");
    const toast = shot.querySelector("[data-toast]");
    const chart = shot.querySelector(".ps-chart");
    const navItems = shot.querySelectorAll("[data-view]");
    const views = shot.querySelectorAll("[data-view-panel]");
    const frameUrl = shot.querySelector("[data-frame-url]");
    const homeCards = shot.querySelectorAll("[data-go]");

    // State: pause auto-cycle once user interacts
    let userInteracted = false;
    let autoCycleTimer = null;
    let autoAppTimer = null;

    // === VIEW SWITCHER ===
    function showView(name) {
      views.forEach(v => v.classList.toggle("active", v.dataset.viewPanel === name));
      navItems.forEach(n => n.classList.toggle("active", n.dataset.view === name));
      if (frameUrl) {
        const urls = {
          home: "achievedxp.com",
          library: "achievedxp.com / library",
          records: "achievedxp.com / learner-records",
          toolset: "achievedxp.com / investigative-toolset",
          messenger: "achievedxp.com / messenger",
          users: "achievedxp.com / users-and-groups",
          settings: "achievedxp.com / account-settings",
        };
        frameUrl.textContent = urls[name] || "achievedxp.com";
      }
    }

    navItems.forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        userInteracted = true;
        if (autoCycleTimer) clearInterval(autoCycleTimer);
        if (autoAppTimer) clearInterval(autoAppTimer);
        apps.forEach(a => a.classList.remove("live-active"));
        // Close iframe overlay if open
        const ov = shot.querySelector("[data-iframe-overlay]");
        if (ov) ov.classList.remove("open");
        showView(item.dataset.view);
      });
    });

    homeCards.forEach(card => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        userInteracted = true;
        if (autoCycleTimer) clearInterval(autoCycleTimer);
        if (autoAppTimer) clearInterval(autoAppTimer);
        apps.forEach(a => a.classList.remove("live-active"));
        showView(card.dataset.go);
      });
    });

    // === IFRAME OVERLAY: clicking an app card opens its site ===
    const overlay = shot.querySelector("[data-iframe-overlay]");
    const iframeEl = shot.querySelector("[data-iframe-el]");
    const loader = shot.querySelector("[data-iframe-loader]");
    const blocked = shot.querySelector("[data-iframe-blocked]");
    const backBtn = shot.querySelector("[data-iframe-back]");
    const externalLink = shot.querySelector("[data-iframe-external]");
    const blockedLink = shot.querySelector("[data-iframe-blocked-link]");
    const iframeLogo = shot.querySelector("[data-iframe-logo]");
    const iframeName = shot.querySelector("[data-iframe-name]");
    const loaderName = shot.querySelector("[data-iframe-loader-name]");
    const blockedLogo = shot.querySelector("[data-iframe-blocked-logo]");
    const blockedName = shot.querySelector("[data-iframe-blocked-name]");
    const blockedName2 = shot.querySelector("[data-iframe-blocked-name2]");

    function openApp(url, name, logo) {
      if (!overlay) return;
      userInteracted = true;
      if (autoCycleTimer) clearInterval(autoCycleTimer);
      if (autoAppTimer) clearInterval(autoAppTimer);

      // Reset states
      iframeEl.classList.remove("loaded");
      if (blocked) blocked.classList.remove("show");
      if (loader) loader.classList.remove("hide");

      // Set chrome
      if (iframeName) iframeName.textContent = name;
      if (loaderName) loaderName.textContent = name;
      if (blockedName) blockedName.textContent = name;
      if (blockedName2) blockedName2.textContent = name;
      if (iframeLogo) {
        if (logo) {
          iframeLogo.src = logo;
          iframeLogo.style.display = "";
        } else {
          iframeLogo.style.display = "none";
        }
      }
      if (blockedLogo) {
        if (logo) {
          blockedLogo.src = logo;
          blockedLogo.style.display = "";
        } else {
          blockedLogo.style.display = "none";
        }
      }
      if (externalLink) externalLink.href = url || "#";
      if (blockedLink) blockedLink.href = url || "#";

      overlay.classList.add("open");

      // Try to load the iframe
      let loaded = false;
      let blockedTimer = null;

      function showBlocked() {
        if (loaded) return;
        if (loader) loader.classList.add("hide");
        if (blocked) blocked.classList.add("show");
      }

      iframeEl.onload = () => {
        loaded = true;
        if (blockedTimer) clearTimeout(blockedTimer);
        if (loader) loader.classList.add("hide");
        iframeEl.classList.add("loaded");
      };
      iframeEl.onerror = showBlocked;

      // After 4 seconds, if iframe hasn't loaded, assume blocked
      blockedTimer = setTimeout(showBlocked, 4500);

      iframeEl.src = url || "about:blank";
    }

    function closeOverlay() {
      if (!overlay) return;
      overlay.classList.remove("open");
      iframeEl.src = "about:blank";
      iframeEl.classList.remove("loaded");
      if (loader) loader.classList.remove("hide");
      if (blocked) blocked.classList.remove("show");
    }

    if (backBtn) backBtn.addEventListener("click", closeOverlay);

    apps.forEach(card => {
      card.addEventListener("click", (e) => {
        const url = card.dataset.url;
        const name = card.dataset.name || "App";
        const logo = card.dataset.logo || "";
        if (!url) return;
        openApp(url, name, logo);
      });
    });

    // === CATEGORY FILTER ===
    function applyFilter(filter) {
      apps.forEach(card => {
        const cardCats = (card.dataset.cat || "").split(/\s+/);
        const visible = filter === "all" || cardCats.includes(filter);
        card.classList.toggle("hidden", !visible);
      });
    }

    cats.forEach(c => {
      c.addEventListener("click", () => {
        userInteracted = true;
        if (autoCycleTimer) clearInterval(autoCycleTimer);
        if (autoAppTimer) clearInterval(autoAppTimer);
        apps.forEach(a => a.classList.remove("live-active"));
        cats.forEach(x => x.classList.remove("active"));
        c.classList.add("active");
        applyFilter(c.dataset.catFilter || "all");
      });
    });

    // Initial filter (show all)
    applyFilter("all");

    // Auto-cycle disabled — mockup stays static until user interacts.
    // (Reasons: cycling between categories/apps was distracting and looked broken
    //  when categories had different app counts.)

    // Search field typing animation
    if (search && searchText) {
      const phrases = ["coursera", "GED math prep", "HVAC certification", "JSTOR", "reentry skills", "Khan Academy"];
      let pi = 0, ci = 0, deleting = false;

      function tick() {
        const phrase = phrases[pi];
        if (!deleting) {
          if (ci < phrase.length) {
            searchText.textContent = phrase.slice(0, ci + 1);
            ci++;
            search.classList.add("live-typing");
            setTimeout(tick, 70 + Math.random() * 60);
          } else {
            setTimeout(() => { deleting = true; tick(); }, 1400);
          }
        } else {
          if (ci > 0) {
            searchText.textContent = phrase.slice(0, ci - 1);
            ci--;
            setTimeout(tick, 35);
          } else {
            deleting = false;
            pi = (pi + 1) % phrases.length;
            search.classList.remove("live-typing");
            searchText.textContent = "Search";
            setTimeout(() => { searchText.textContent = ""; tick(); }, 900);
          }
        }
      }
      // Start when shot enters viewport
      const obs = new IntersectionObserver((ents) => {
        ents.forEach(e => {
          if (e.isIntersecting) {
            setTimeout(tick, 800);
            obs.unobserve(shot);
          }
        });
      }, { threshold: 0.3 });
      obs.observe(shot);
    }

    // Toast notifications — cycle through messages
    if (toast) {
      const titleEl = toast.querySelector("[data-toast-title]");
      const textEl = toast.querySelector("[data-toast-text]");
      const msgs = [
        ["HVAC Module 4 complete", "Marcus J. earned the credential just now."],
        ["GED Math passing score", "Sarah W. crossed the threshold."],
        ["Coursera quiz submitted", "Mike R. scored 92% on Customer Service."],
        ["Honest Jobs match", "3 fair-chance roles matched to recent graduates."],
        ["Canvas course assigned", "Pre-release cohort enrolled in Networking I."],
      ];
      let mi = 0;
      function showToast() {
        const [t, x] = msgs[mi];
        titleEl.textContent = t;
        textEl.textContent = x;
        toast.classList.add("show");
        setTimeout(() => {
          toast.classList.remove("show");
          mi = (mi + 1) % msgs.length;
          setTimeout(showToast, 1100);
        }, 3200);
      }
      const obs2 = new IntersectionObserver((ents) => {
        ents.forEach(e => {
          if (e.isIntersecting) {
            setTimeout(showToast, 1400);
            obs2.unobserve(shot);
          }
        });
      }, { threshold: 0.4 });
      obs2.observe(shot);
    }

    // Animate chart bars when chart enters viewport
    if (chart) {
      const obs3 = new IntersectionObserver((ents) => {
        ents.forEach(e => {
          if (e.isIntersecting) {
            const bars = chart.querySelectorAll(".bs");
            bars.forEach((b, i) => {
              b.style.animationDelay = `${i * 25}ms`;
            });
            chart.classList.add("live-animate");
            obs3.unobserve(chart);
          }
        });
      }, { threshold: 0.3 });
      obs3.observe(chart);
    }
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
