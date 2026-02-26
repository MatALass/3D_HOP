/* =========================
   app.js — 3DHOP 4.3.7 (NXZ)
   FIXES:
   - NXZ must be loaded as mesh { url, mType:"nexus" } (Presenter expects meshes/modelInstances)
   - presenter.ui.gl (not presenter.gl)
   ========================= */
const BASE_URL = "https://pub-2429006b138e41bca67d697e016d13b3.r2.dev";

   const PROJECTS = {
    1: {
      nxz: `${BASE_URL}/canoe_sadoux.nxz`,
      topTitle: "LE PINGOIN",
      topSubtitle: "CANOË SADOUX",
      plan: "assets/images/plans/plan_canoe_sadoux.png",
      bg: "assets/images/backgrounds/fond_CC_2b.png",
      toolbar: { mode: "bottom-right" },
      html: `<h3 style="margin:0 0 6px 0;">Zone texte projet 1</h3><p style="margin:0;">Texte HTML…</p>`
    },
    2: {
      nxz: `${BASE_URL}/inti_huatana.nxz`,
      topTitle: "INTI HUATANA",
      topSubtitle: "YOLE D’AVIRON",
      plan: "assets/images/plans/plan_inti_huatana.png",
      bg: "assets/images/backgrounds/fond_CC_4b.png",
      toolbar: { mode: "left-vertical" },
      html: `<h3 style="margin:0 0 6px 0;">Zone texte projet 2</h3><p style="margin:0;">Texte HTML…</p>`
    },
    3: {
      nxz: `${BASE_URL}/dinghy_kirie.nxz`,
      topTitle: "LA JOSETTE",
      topSubtitle: "DINGHY KIRIÉ",
      plan: "assets/images/plans/plan_dinghy_kirie.png",
      bg: "assets/images/backgrounds/fond_CC_2b.png",
      toolbar: { mode: "bottom-right" },
      html: `<h3 style="margin:0 0 6px 0;">Zone texte projet 3</h3><p style="margin:0;">Texte HTML…</p>`
    }
  };
  
  function resizeCanvasToDisplaySize() {
    const canvas = document.getElementById("draw-canvas");
    if (!canvas) return;
  
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
  
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
  
      // Some builds expose resizeCanvas; safe-call
      if (window.presenter && typeof window.presenter.resizeCanvas === "function") {
        window.presenter.resizeCanvas(w, h);
      }
    }
  }
  
  function setToolbarLayout(toolbarCfg) {
    const tb = document.getElementById("toolbar");
    if (!tb) return;
  
    tb.classList.remove("vertical");
    const mode = toolbarCfg?.mode || "bottom-right";
    if (mode === "left-vertical") tb.classList.add("vertical");
  }
  
  function kickRender() {
    const p = window.presenter;
    if (!p) return;
  
    if (p?.ui?.postDrawEvent) p.ui.postDrawEvent();
    if (typeof p?.repaint === "function") p.repaint();
    if (typeof p?.draw === "function") p.draw();
  }
  
  /** ✅ Correct 3DHOP 4.3.7 NXZ scene */
  function setNXZScene(nxzPath) {
    const p = window.presenter;
    if (!p) return;
  
    // ✅ IMPORTANT: Nexus est plus fiable avec une URL absolue (GitHub Pages / sous-dossiers)
    const nxzUrl = new URL(nxzPath, window.location.href).href;
  
    console.log("[debug] setScene NXZ =", nxzUrl);
  
    p.setScene({
      meshes: {
        n1: { url: nxzUrl, mType: "nexus" }
      },
      modelInstances: {
        m1: { mesh: "n1" }
      },
      trackball: {
        type: TurnTableTrackball,
        trackOptions: {
          startPhi: 0,
          startTheta: 20,
          startDistance: 2
        }
      }
    });
  
    // 🔁 Attendre que Nexus ait fini de charger (3DHOP repaint automatiquement à la fin,
    // mais on force un reset/refresh quand _sceneReady devient true)
    let tries = 0;
    const t = setInterval(() => {
      tries++;
  
      // méthode interne mais dispo
      const ready = (typeof p._isSceneReady === "function") ? p._isSceneReady() : false;
  
      // log léger toutes les ~0.5s
      if (tries % 5 === 0) {
        console.log("[debug] scene ready ?", ready, "| tries =", tries);
      }
  
      if (ready || tries > 120) { // ~12s max
        clearInterval(t);
  
        resizeCanvasToDisplaySize();
  
        if (typeof p.resetTrackball === "function") p.resetTrackball();
        if (typeof p.repaint === "function") p.repaint();
        kickRender();
  
        console.log("[debug] scene ready final =", ready);
      }
    }, 100);
  }
  
  async function loadProject(id) {
    const proj = PROJECTS[id];
    if (!proj) return;
  
    // UI
    document.getElementById("topTitle").textContent = proj.topTitle || "";
    document.getElementById("topSubtitle").textContent = proj.topSubtitle || "";
  
    const planEl = document.getElementById("projectPlan");
    if (planEl) planEl.src = proj.plan;
  
    const textEl = document.getElementById("projectText");
    if (textEl) textEl.innerHTML = proj.html || "";
  
    const bgEl = document.getElementById("viewer-bg");
    if (bgEl) bgEl.style.backgroundImage = `url('${proj.bg}')`;
  
    ["btn-p1", "btn-p2", "btn-p3"].forEach((bid, idx) => {
      const btn = document.getElementById(bid);
      if (btn) btn.setAttribute("aria-current", (idx + 1 === id) ? "true" : "false");
    });
  
    setToolbarLayout(proj.toolbar);
  
    // ✅ Check NXZ reachable (et affiche l’URL réelle)
    const nxzUrl = new URL(proj.nxz, window.location.href).href;
    try {
      const res = await fetch(nxzUrl, { cache: "no-store" });
      console.log("[debug] fetch NXZ", nxzUrl, "->", res.status);
      if (!res.ok) return;
    } catch (e) {
      console.error("Erreur fetch NXZ:", nxzUrl, e);
      return;
    }
  
    setNXZScene(proj.nxz);
  }
  
  function actionsToolbar(action) {
    const p = window.presenter;
    if (!p) return;
  
    if (action === "home" && typeof p.resetTrackball === "function") p.resetTrackball();
    else if (action === "zoomin" && typeof p.zoomIn === "function") p.zoomIn();
    else if (action === "zoomout" && typeof p.zoomOut === "function") p.zoomOut();
  
    kickRender();
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    try {
      const canvas = document.getElementById("draw-canvas");
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
  
      window.presenter = new Presenter("draw-canvas");
    } catch (e) {
      console.error("Impossible de créer Presenter:", e);
      return;
    }
  
    if (typeof init3dhop === "function") {
      try { init3dhop(); } catch (e) { console.error("init3dhop() error:", e); }
    }
  
    console.log("[debug] supportsWebGL =", window.presenter?._supportsWebGL);
    console.log("[debug] presenter.ui.gl =", window.presenter?.ui?.gl);
  
    requestAnimationFrame(() => {
      resizeCanvasToDisplaySize();
      loadProject(1);
    });
  
    document.getElementById("btn-p1")?.addEventListener("click", () => loadProject(1));
    document.getElementById("btn-p2")?.addEventListener("click", () => loadProject(2));
    document.getElementById("btn-p3")?.addEventListener("click", () => loadProject(3));
  
    window.addEventListener("resize", () => {
      resizeCanvasToDisplaySize();
      kickRender();
    });
  });
  
  // if init.js calls it
  window.actionsToolbar = actionsToolbar;