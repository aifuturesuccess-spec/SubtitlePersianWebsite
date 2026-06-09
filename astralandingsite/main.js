/* ============================================================
   ASTRA · LANDING PAGE BEHAVIOR
   1. Backdrop — canvas-drawn cinematic starfield behind each
      video, so a section never goes black if its footage can't
      load or play. Seeded PRNG keeps the sky identical on every
      visit. Swap for real stills/frames when available.
   2. FadingVideo — looping background videos with a pure
      requestAnimationFrame crossfade (NO CSS transitions).
      The native loop attribute is OFF: looping is manual so the
      fade-out/fade-in straddles the seam invisibly.
   3. In-view triggers — BlurText headline (10% visibility) and
      capability cards (20% visibility), once each.
   ============================================================ */
(function () {
  "use strict";

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var BACKDROPS = {
    // Hero footage is top-anchored, so its haze sits at the top of frame.
    hero: { seed: 7, glowX: 0.5, glowY: -0.15, glowR: 1.0 },
    capabilities: { seed: 13, glowX: 0.5, glowY: 0.45, glowR: 0.85 },
  };

  function drawBackdrop(canvas) {
    var conf = BACKDROPS[canvas.dataset.backdrop] || BACKDROPS.hero;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // Deep-space base — cool, near-black, monochrome.
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#0b0f17");
    sky.addColorStop(0.6, "#05070c");
    sky.addColorStop(1, "#030407");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Soft atmospheric glow.
    var gr = Math.max(w, h) * conf.glowR;
    var glow = ctx.createRadialGradient(
      w * conf.glowX, h * conf.glowY, 0,
      w * conf.glowX, h * conf.glowY, gr
    );
    glow.addColorStop(0, "rgba(255,255,255,0.10)");
    glow.addColorStop(0.4, "rgba(210,220,235,0.04)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Star field.
    var rand = mulberry32(conf.seed);
    var count = Math.round((w * h) / 2200);
    for (var i = 0; i < count; i++) {
      var x = rand() * w;
      var y = rand() * h;
      var r = 0.3 + rand() * (rand() < 0.06 ? 1.6 : 0.8);
      ctx.globalAlpha = 0.15 + rand() * 0.8;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var backdrops = document.querySelectorAll("canvas[data-backdrop]");
  function drawAllBackdrops() {
    backdrops.forEach(drawBackdrop);
  }
  drawAllBackdrops();
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawAllBackdrops, 150);
  });

  var FADE_MS = 500;
  var FADE_OUT_LEAD = 0.55; // seconds before end to begin fading out

  function setupFadingVideo(video) {
    var rafId = null;
    var fadingOut = false;

    // Reads the current inline opacity so each new fade resumes from
    // wherever the last one left off — interruptions stay smooth.
    function fadeTo(target, duration) {
      if (rafId) cancelAnimationFrame(rafId);
      var start = parseFloat(video.style.opacity || "0");
      var delta = target - start;
      var t0 = performance.now();
      function step(now) {
        var p = Math.min((now - t0) / duration, 1);
        video.style.opacity = String(start + delta * p);
        if (p < 1) rafId = requestAnimationFrame(step);
      }
      rafId = requestAnimationFrame(step);
    }

    function fadeIn() {
      video.style.opacity = "0";
      var playing = video.play();
      if (playing && playing.catch) playing.catch(function () {});
      fadeTo(1, FADE_MS);
    }

    video.addEventListener("loadeddata", fadeIn);

    video.addEventListener("timeupdate", function () {
      var remaining = video.duration - video.currentTime;
      if (!fadingOut && remaining <= FADE_OUT_LEAD && remaining > 0) {
        fadingOut = true;
        fadeTo(0, FADE_MS);
      }
    });

    video.addEventListener("ended", function () {
      video.style.opacity = "0";
      setTimeout(function () {
        video.currentTime = 0;
        var playing = video.play();
        if (playing && playing.catch) playing.catch(function () {});
        fadingOut = false;
        fadeTo(1, FADE_MS);
      }, 100);
    });

    // The script is deferred, so a cached video may have fired
    // loadeddata before the listener attached.
    if (video.readyState >= 2) fadeIn();
  }

  document.querySelectorAll("video[data-fading-video]").forEach(setupFadingVideo);

  function observeOnce(elements, threshold) {
    if (!("IntersectionObserver" in window)) {
      elements.forEach(function (el) {
        el.classList.add("in-view");
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: threshold }
    );
    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // Hero headline is always in view on load — trigger immediately, no observer lag.
  document.querySelectorAll("[data-blur-text]").forEach(function(el){
    el.classList.add("in-view");
  });
  observeOnce(document.querySelectorAll(".anim-view"), 0.2);
})();
