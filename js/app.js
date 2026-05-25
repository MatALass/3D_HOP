/* =============================================================================
   app.js — Collection Petite Plaisance / Musée Maritime
   Visualiseur 3D basé sur 3DHOP 4.3.7 + Nexus (NXZ)

   Phase 2 :
   - Configuration externalisée dans assets/data/projects.json
   - NXZ chargés en local (assets/models/)
   - Polices Inter en local (voir css/app.css)
   - Gestion d'erreur visible à l'écran
   ============================================================================= */

/* État courant de l'application */
let PROJECTS = {};            // Rempli après chargement de projects.json
let currentProjectId = null;

/* -----------------------------------------------------------------------------
   1. Chargement de la configuration projets
   ----------------------------------------------------------------------------- */

async function loadConfig() {
  try {
    const res = await fetch("assets/data/projects.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status} sur projects.json`);
    const data = await res.json();
    if (!data || !Array.isArray(data.projects)) {
      throw new Error("Format invalide : projects.json doit contenir un tableau 'projects'.");
    }
    // Indexer par ID pour accès O(1)
    const indexed = {};
    for (const p of data.projects) {
      if (p.id == null) throw new Error("Un projet n'a pas d'ID.");
      indexed[p.id] = p;
    }
    return indexed;
  } catch (err) {
    showFatalError(
      "Impossible de charger la configuration",
      `Le fichier 'assets/data/projects.json' est introuvable ou invalide.\n\nDétail technique : ${err.message}`
    );
    throw err;
  }
}

/* -----------------------------------------------------------------------------
   2. Helpers canvas
   ----------------------------------------------------------------------------- */

function resizeCanvasToDisplaySize() {
  const canvas = document.getElementById("draw-canvas");
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));

  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;

    if (window.presenter && typeof window.presenter.resizeCanvas === "function") {
      window.presenter.resizeCanvas(w, h);
    }
  }
}

function kickRender() {
  const p = window.presenter;
  if (!p) return;
  if (p.ui?.postDrawEvent) p.ui.postDrawEvent();
  if (typeof p.repaint === "function") p.repaint();
  if (typeof p.draw === "function") p.draw();
}

/* -----------------------------------------------------------------------------
   3. Layout & UI
   ----------------------------------------------------------------------------- */

function setToolbarLayout(toolbarMode) {
  const tb = document.getElementById("toolbar");
  if (!tb) return;
  tb.classList.remove("vertical");
  if (toolbarMode === "left-vertical") tb.classList.add("vertical");
}

/**
 * Génère dynamiquement les miniatures depuis PROJECTS.
 */
function buildThumbnails() {
  const container = document.getElementById("thumbs");
  if (!container) return;
  container.innerHTML = "";

  // Itération ordonnée par ID croissant pour stabilité visuelle
  const ids = Object.keys(PROJECTS).map(Number).sort((a, b) => a - b);

  for (const id of ids) {
    const proj = PROJECTS[id];
    const btn = document.createElement("button");
    btn.className = "proj-btn";
    btn.id = `btn-p${id}`;
    btn.type = "button";
    btn.title = proj.topTitle;
    btn.setAttribute("aria-current", "false");
    btn.setAttribute("aria-label", `Voir ${proj.topTitle} — ${proj.topSubtitle}`);

    const img = document.createElement("img");
    img.src = proj.thumbnail;
    img.alt = "";          // décoratif, le titre est dans aria-label
    img.draggable = false;
    btn.appendChild(img);

    btn.addEventListener("click", () => loadProject(id));
    container.appendChild(btn);
  }
}

function updateActiveThumbnail(activeId) {
  document.querySelectorAll(".proj-btn").forEach(btn => {
    const isActive = btn.id === `btn-p${activeId}`;
    btn.setAttribute("aria-current", isActive ? "true" : "false");
  });
}

/* -----------------------------------------------------------------------------
   4. Chargement de scène Nexus (NXZ)
   ----------------------------------------------------------------------------- */

function setNXZScene(nxzPath) {
  const p = window.presenter;
  if (!p) return;

  const nxzUrl = new URL(nxzPath, window.location.href).href;
  console.log("[scene] loading NXZ:", nxzUrl);

  p.setScene({
    meshes:         { n1: { url: nxzUrl, mType: "nexus" } },
    modelInstances: { m1: { mesh: "n1" } },
    trackball: {
      type: TurnTableTrackball,
      trackOptions: {
        startPhi:      0,
        startTheta:    20,
        startDistance: 2
      }
    }
  });

  // Polling de l'état "scene ready" (Nexus n'expose pas de promesse)
  // 50ms × 240 = 12s max
  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    const ready = (typeof p._isSceneReady === "function") ? p._isSceneReady() : false;
    if (ready || tries > 240) {
      clearInterval(timer);
      resizeCanvasToDisplaySize();
      if (typeof p.resetTrackball === "function") p.resetTrackball();
      kickRender();
      hideLoadingOverlay();
      if (!ready) {
        console.warn("[scene] timeout: scene never reached ready state");
        showLoadingError();
      }
    }
  }, 50);
}

/* -----------------------------------------------------------------------------
   5. Chargement d'un projet (UI + scène 3D)
   ----------------------------------------------------------------------------- */

function loadProject(id) {
  const proj = PROJECTS[id];
  if (!proj) {
    console.error(`[loadProject] unknown project id: ${id}`);
    return;
  }
  if (currentProjectId === id) return;
  currentProjectId = id;

  showLoadingOverlay();

  // --- UI texte ---
  document.getElementById("topTitle").textContent = proj.topTitle || "";

  const planEl = document.getElementById("projectPlan");
  if (planEl) { planEl.src = proj.plan; planEl.alt = `Plan — ${proj.topTitle}`; }

  // Le sous-titre est TOUJOURS rendu (avec un caractère invisible si vide)
  // pour garder une hauteur uniforme du header entre les 6 bateaux.
  // Sans ça, les bateaux sans sous-titre auraient leur titre principal qui
  // "remonte" et créerait une incohérence visuelle.
  const subtitleEl = document.getElementById("topSubtitle");
  if (subtitleEl) {
    if (proj.topSubtitle) {
      subtitleEl.textContent = proj.topSubtitle;
      subtitleEl.style.visibility = "";
    } else {
      // Caractère invisible (espace insécable) pour garder la hauteur de ligne
      subtitleEl.textContent = "\u00A0";
      subtitleEl.style.visibility = "hidden";
    }
  }

  const textEl = document.getElementById("projectText");
  if (textEl) textEl.innerHTML = proj.text || "";

  const footEl = document.getElementById("viewer-footnote");
  if (footEl) footEl.textContent = proj.footnote || "";

  // --- Background ---
  const bgEl = document.getElementById("viewer-bg");
  if (bgEl) bgEl.style.backgroundImage = `url('${proj.bg}')`;

  // --- Toolbar position ---
  setToolbarLayout(proj.toolbar);

  // --- Miniatures actives ---
  updateActiveThumbnail(id);

  // --- Scène 3D ---
  setNXZScene(proj.nxz);
}

/* -----------------------------------------------------------------------------
   6. Toolbar actions (home / zoomin / zoomout)
   ----------------------------------------------------------------------------- */

function actionsToolbar(action) {
  const p = window.presenter;
  if (!p) return;

  switch (action) {
    case "home":    if (typeof p.resetTrackball === "function") p.resetTrackball(); break;
    case "zoomin":  if (typeof p.zoomIn === "function")         p.zoomIn();         break;
    case "zoomout": if (typeof p.zoomOut === "function")        p.zoomOut();        break;
  }
  kickRender();
}

function bindToolbar() {
  const buttons = document.querySelectorAll("#toolbar img");
  let pressInterval = null;

  buttons.forEach(img => {
    const start = () => {
      actionsToolbar(img.id);
      if (img.id === "zoomin" || img.id === "zoomout") {
        clearInterval(pressInterval);
        pressInterval = setInterval(() => actionsToolbar(img.id), 150);
      }
    };
    const stop = () => clearInterval(pressInterval);

    img.addEventListener("mousedown",  start);
    img.addEventListener("touchstart", start, { passive: true });
    img.addEventListener("mouseup",    stop);
    img.addEventListener("mouseleave", stop);
    img.addEventListener("touchend",   stop);
    img.addEventListener("touchcancel",stop);

    img.addEventListener("dragstart", e => e.preventDefault());
  });
}

/* -----------------------------------------------------------------------------
   7. Loading overlay & gestion d'erreurs visibles
   ----------------------------------------------------------------------------- */

function showLoadingOverlay() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.add("visible");
}

function hideLoadingOverlay() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.remove("visible");
}

function showLoadingError() {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;
  overlay.classList.add("visible", "error");
  const msg = overlay.querySelector(".loading-msg");
  if (msg) msg.textContent = "Modèle 3D indisponible. Essayez un autre bateau.";
}

function showFatalError(title, detail) {
  const overlay = document.getElementById("fatal-error");
  if (!overlay) {
    // Fallback : si l'overlay n'existe pas dans le DOM
    document.body.innerHTML =
      `<div style="padding:40px;font-family:sans-serif;">
         <h1>${title}</h1>
         <pre style="white-space:pre-wrap;">${detail}</pre>
       </div>`;
    return;
  }
  overlay.querySelector(".fatal-title").textContent  = title;
  overlay.querySelector(".fatal-detail").textContent = detail;
  overlay.classList.add("visible");
}

/* -----------------------------------------------------------------------------
   8. Initialisation
   ----------------------------------------------------------------------------- */

async function initApp() {
  const canvas = document.getElementById("draw-canvas");
  if (!canvas) {
    console.error("[init] #draw-canvas introuvable");
    return;
  }
  canvas.width  = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  try {
    window.presenter = new Presenter("draw-canvas");
    window.presenter._resizable = true;
  } catch (e) {
    console.error("[init] Impossible de créer Presenter:", e);
    showFatalError("WebGL non disponible",
      "Ce navigateur ne supporte pas WebGL ou l'accélération matérielle est désactivée.");
    return;
  }

  // Charger la config AVANT de construire l'UI
  PROJECTS = await loadConfig();
  if (Object.keys(PROJECTS).length === 0) {
    showFatalError("Aucun projet configuré", "Le fichier projects.json est vide.");
    return;
  }

  // Exposer pour le module kiosk.js (qui en a besoin pour l'auto-reset)
  window.PROJECTS = PROJECTS;

  buildThumbnails();
  bindToolbar();

  canvas.addEventListener("contextmenu", e => e.preventDefault());

  // Désactiver le drag & drop sur tout le document (sécurité kiosque)
  document.addEventListener("dragover", e => e.preventDefault());
  document.addEventListener("drop", e => e.preventDefault());

  requestAnimationFrame(() => {
    resizeCanvasToDisplaySize();
    const firstId = Math.min(...Object.keys(PROJECTS).map(Number));
    loadProject(firstId);
  });

  // Resize debouncé via rAF — gère window resize + orientation change (rotation tablette)
  let resizeRaf = null;
  const triggerResize = () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      resizeCanvasToDisplaySize();
      kickRender();
    });
  };
  window.addEventListener("resize", triggerResize);
  window.addEventListener("orientationchange", triggerResize);

  // ResizeObserver sur le canvas : détecte les changements de taille du
  // conteneur même quand window resize n'est pas déclenché (ex: changement
  // de bateau avec toolbar verticale qui modifie le layout CSS).
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => triggerResize());
    ro.observe(canvas);
  }
}

/* Point d'entrée */
document.addEventListener("DOMContentLoaded", initApp);

/* Exposition globale (debug + fallback) */
window.actionsToolbar = actionsToolbar;
window.loadProject    = loadProject;
