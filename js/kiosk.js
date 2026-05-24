/* =============================================================================
   kiosk.js — Module de robustesse kiosque
   Collection Petite Plaisance / Musée Maritime

   Ce module gère tout ce qui rend la borne robuste en exposition continue :
   - Auto-reset après inactivité (5 minutes)
   - Désactivation des raccourcis navigateur dangereux
   - Watchdog WebGL (détection context lost)
   - Watchdog général (vérifications périodiques de santé)
   - Suppression des messages techniques visibles
   - Raccourcis admin discrets (Ctrl+Shift+Q/R/D)

   ============================================================================= */

(function() {
  "use strict";

  /* ---------------------------------------------------------------------------
     Configuration
     --------------------------------------------------------------------------- */
  const CONFIG = {
    // Auto-reset après inactivité
    inactivityTimeoutMs: 5 * 60 * 1000,    // 5 minutes

    // Watchdog général
    watchdogIntervalMs: 30 * 1000,         // vérif santé toutes les 30s

    // Reload programmé quotidien (anti memory-leak long terme)
    dailyReloadEnabled: true,
    dailyReloadHour: 4,                    // 04h00
    dailyReloadMinute: 0,

    // Action sur context lost WebGL
    onContextLost: "reload",               // "reload" ou "rebuild"

    // Raccourcis admin
    enableAdminShortcuts: true,
  };

  /* ---------------------------------------------------------------------------
     Désactiver console.* en production (anti-fuite d'infos techniques)
     Garde un canal "kiosk-log" pour le diagnostic admin.
     --------------------------------------------------------------------------- */
  const _origConsole = {
    log:   console.log.bind(console),
    warn:  console.warn.bind(console),
    error: console.error.bind(console),
    info:  console.info.bind(console),
  };

  // Buffer circulaire des derniers logs pour le mode diagnostic
  const logBuffer = [];
  const LOG_BUFFER_MAX = 200;

  function bufferedLog(level, args) {
    const entry = {
      t: new Date().toISOString(),
      level,
      msg: args.map(a => {
        try { return typeof a === "object" ? JSON.stringify(a) : String(a); }
        catch (e) { return String(a); }
      }).join(" ")
    };
    logBuffer.push(entry);
    if (logBuffer.length > LOG_BUFFER_MAX) logBuffer.shift();
  }

  // On garde les erreurs réelles (utiles si bug catastrophe)
  // mais on supprime les logs informatifs en production.
  console.log   = function(...args) { bufferedLog("log", args); };
  console.info  = function(...args) { bufferedLog("info", args); };
  console.warn  = function(...args) { bufferedLog("warn", args); _origConsole.warn(...args); };
  console.error = function(...args) { bufferedLog("error", args); _origConsole.error(...args); };

  // Empêcher les erreurs JS d'apparaître dans une popup native du navigateur
  window.addEventListener("error", (e) => {
    bufferedLog("error", [`[uncaught] ${e.message} @ ${e.filename}:${e.lineno}`]);
    // Ne pas faire e.preventDefault() — on laisse Chrome remonter mais sans popup visible
  });
  window.addEventListener("unhandledrejection", (e) => {
    bufferedLog("error", [`[promise] ${e.reason}`]);
  });

  /* ---------------------------------------------------------------------------
     Auto-reset après inactivité
     --------------------------------------------------------------------------- */
  let inactivityTimer = null;

  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(onInactivityTimeout, CONFIG.inactivityTimeoutMs);
  }

  function onInactivityTimeout() {
    bufferedLog("info", ["[kiosk] inactivity timeout → reset"]);

    // 1. Revenir au premier projet
    try {
      if (typeof window.loadProject === "function" && window.PROJECTS) {
        const ids = Object.keys(window.PROJECTS).map(Number);
        if (ids.length > 0) {
          const firstId = Math.min(...ids);
          window.loadProject(firstId);
        }
      }
    } catch (e) {
      bufferedLog("error", ["[kiosk] reset loadProject failed:", e.message]);
    }

    // 2. Reset position caméra
    try {
      if (window.presenter && typeof window.presenter.resetTrackball === "function") {
        window.presenter.resetTrackball();
      }
    } catch (e) {
      bufferedLog("error", ["[kiosk] reset trackball failed:", e.message]);
    }

    // 3. Reset scroll du panneau texte
    const textEl = document.getElementById("textPanel");
    if (textEl) textEl.scrollTop = 0;

    // Réamorcer le timer
    resetInactivityTimer();
  }

  // Events qui réinitialisent le timer d'inactivité
  const ACTIVITY_EVENTS = [
    "mousedown", "mousemove", "wheel",
    "touchstart", "touchmove", "touchend",
    "keydown"
  ];
  ACTIVITY_EVENTS.forEach(ev => {
    window.addEventListener(ev, resetInactivityTimer, { passive: true, capture: true });
  });

  /* ---------------------------------------------------------------------------
     Désactivations clavier (anti-curieux + sécurité)
     --------------------------------------------------------------------------- */
  document.addEventListener("keydown", (e) => {
    const k = e.key;
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;

    // Raccourcis admin réservés — laisser passer
    if (CONFIG.enableAdminShortcuts && ctrl && shift) {
      if (k === "Q" || k === "q") { onAdminQuit();   e.preventDefault(); return; }
      if (k === "R" || k === "r") { onAdminReload(); e.preventDefault(); return; }
      if (k === "D" || k === "d") { onAdminDiag();   e.preventDefault(); return; }
    }

    // Bloquer F12 (DevTools)
    if (k === "F12") { e.preventDefault(); return; }

    // Bloquer Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools alt)
    if (ctrl && shift && (k === "I" || k === "J" || k === "C")) {
      e.preventDefault(); return;
    }

    // Bloquer Ctrl+P (imprimer), Ctrl+S (sauver), Ctrl+U (source)
    if (ctrl && (k === "p" || k === "P" || k === "s" || k === "S" || k === "u" || k === "U")) {
      e.preventDefault(); return;
    }

    // Bloquer F5 / Ctrl+R (reload) en kiosque — sauf admin
    if (k === "F5" || (ctrl && (k === "r" || k === "R"))) {
      e.preventDefault(); return;
    }

    // Bloquer Ctrl+W / Ctrl+T / Ctrl+N (gestion onglets/fenêtres)
    if (ctrl && (k === "w" || k === "W" || k === "t" || k === "T" || k === "n" || k === "N")) {
      e.preventDefault(); return;
    }

    // Bloquer Ctrl + +/- (zoom navigateur)
    if (ctrl && (k === "+" || k === "-" || k === "=" || k === "0")) {
      e.preventDefault(); return;
    }
  }, true);   // capture: true → intercepte avant tout autre listener

  /* ---------------------------------------------------------------------------
     Désactivation gestures tactiles natifs (anti pinch-zoom page, etc.)
     --------------------------------------------------------------------------- */
  // Empêche le pinch-zoom de la page (le viewer 3D garde son pinch-zoom propre)
  document.addEventListener("gesturestart",  e => e.preventDefault());
  document.addEventListener("gesturechange", e => e.preventDefault());
  document.addEventListener("gestureend",    e => e.preventDefault());

  // Empêche le double-tap zoom de Safari/iOS
  let lastTouchEnd = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouchEnd < 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  // Empêche le long-press menu contextuel
  document.addEventListener("contextmenu", e => e.preventDefault());

  /* ---------------------------------------------------------------------------
     Watchdog WebGL — détection context lost
     --------------------------------------------------------------------------- */
  function setupWebGLWatchdog() {
    const canvas = document.getElementById("draw-canvas");
    if (!canvas) {
      bufferedLog("warn", ["[kiosk] canvas introuvable pour watchdog WebGL"]);
      return;
    }

    canvas.addEventListener("webglcontextlost", (e) => {
      bufferedLog("error", ["[kiosk] WebGL context lost"]);
      e.preventDefault();   // permet la restauration

      if (CONFIG.onContextLost === "reload") {
        // Reload total après 2s (laisser le temps à un éventuel restore)
        setTimeout(() => {
          bufferedLog("error", ["[kiosk] reload after context lost"]);
          window.location.reload();
        }, 2000);
      }
      // (mode "rebuild" : on essaie de relancer Presenter sans reload page
      //  — plus rapide mais plus fragile, voir option 2 du questionnaire)
    });

    canvas.addEventListener("webglcontextrestored", () => {
      bufferedLog("info", ["[kiosk] WebGL context restored"]);
      // Recharger le projet courant pour reconstruire la scène
      if (window.PROJECTS && typeof window.loadProject === "function") {
        const ids = Object.keys(window.PROJECTS).map(Number);
        if (ids.length > 0) window.loadProject(Math.min(...ids));
      }
    });
  }

  /* ---------------------------------------------------------------------------
     Watchdog général — vérifications périodiques de santé
     --------------------------------------------------------------------------- */
  let watchdogTimer = null;

  function startWatchdog() {
    watchdogTimer = setInterval(() => {
      try {
        // 1. Le presenter existe-t-il toujours ?
        if (!window.presenter) {
          bufferedLog("error", ["[watchdog] presenter manquant → reload"]);
          window.location.reload();
          return;
        }

        // 2. Le canvas est-il toujours dimensionné ?
        const canvas = document.getElementById("draw-canvas");
        if (!canvas || canvas.width === 0 || canvas.height === 0) {
          bufferedLog("warn", ["[watchdog] canvas mal dimensionné, tentative resize"]);
          window.dispatchEvent(new Event("resize"));
        }

        // 3. Le fatal-error overlay est-il visible ? Si oui depuis trop longtemps, reload.
        const fatal = document.getElementById("fatal-error");
        if (fatal && fatal.classList.contains("visible")) {
          if (!fatal._visibleSince) fatal._visibleSince = Date.now();
          else if (Date.now() - fatal._visibleSince > 60000) {
            bufferedLog("error", ["[watchdog] fatal-error visible >60s → reload"]);
            window.location.reload();
          }
        } else if (fatal) {
          fatal._visibleSince = null;
        }

        // 4. Loading overlay bloqué ?
        const loading = document.getElementById("loading-overlay");
        if (loading && loading.classList.contains("visible") && !loading.classList.contains("error")) {
          if (!loading._visibleSince) loading._visibleSince = Date.now();
          else if (Date.now() - loading._visibleSince > 30000) {
            bufferedLog("warn", ["[watchdog] loading bloqué >30s → afficher erreur"]);
            loading.classList.add("error");
            const msg = loading.querySelector(".loading-msg");
            if (msg) msg.textContent = "Modèle indisponible. Essayez un autre bateau.";
          }
        } else if (loading) {
          loading._visibleSince = null;
        }
      } catch (e) {
        bufferedLog("error", ["[watchdog] erreur interne:", e.message]);
      }
    }, CONFIG.watchdogIntervalMs);
  }

  /* ---------------------------------------------------------------------------
     Reload programmé quotidien
     --------------------------------------------------------------------------- */
  function scheduleDailyReload() {
    if (!CONFIG.dailyReloadEnabled) return;

    const now = new Date();
    const next = new Date();
    next.setHours(CONFIG.dailyReloadHour, CONFIG.dailyReloadMinute, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);

    const msUntil = next.getTime() - now.getTime();
    bufferedLog("info", [`[kiosk] reload programmé dans ${Math.round(msUntil/60000)} min`]);

    setTimeout(() => {
      bufferedLog("info", ["[kiosk] reload quotidien programmé"]);
      window.location.reload();
    }, msUntil);
  }

  /* ---------------------------------------------------------------------------
     Raccourcis admin
     --------------------------------------------------------------------------- */
  function onAdminQuit() {
    // Tente de fermer la fenêtre. Sur Chrome --kiosk, marche.
    bufferedLog("info", ["[admin] quit demandé"]);
    window.close();
    // Fallback si window.close ne marche pas (Chrome restreint sur les fenêtres
    // non ouvertes par script) : afficher un message d'instructions
    setTimeout(() => {
      alert("Pour quitter la borne, lancer stop.bat depuis l'explorateur,\nou Alt+F4.");
    }, 200);
  }

  function onAdminReload() {
    bufferedLog("info", ["[admin] reload demandé"]);
    window.location.reload();
  }

  function onAdminDiag() {
    bufferedLog("info", ["[admin] diagnostic demandé"]);
    showDiagnosticOverlay();
  }

  function showDiagnosticOverlay() {
    // Supprime si déjà présent
    const existing = document.getElementById("diag-overlay");
    if (existing) { existing.remove(); return; }

    const overlay = document.createElement("div");
    overlay.id = "diag-overlay";
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.92); color: #0f0;
      font-family: "Courier New", monospace; font-size: 12px;
      padding: 24px; overflow: auto;
    `;

    const info = collectDiagnostic();
    overlay.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2 style="color:#0f0; margin:0; font-size:18px;">DIAGNOSTIC — Borne 3D</h2>
        <button onclick="document.getElementById('diag-overlay').remove()"
                style="background:#0f0; color:#000; border:none; padding:6px 14px; cursor:pointer;
                       font-family:monospace; font-weight:bold;">FERMER (Ctrl+Shift+D)</button>
      </div>
      <pre style="white-space: pre-wrap; word-break: break-word; line-height: 1.5;">${info}</pre>
    `;
    document.body.appendChild(overlay);
  }

  function collectDiagnostic() {
    const lines = [];
    lines.push(`=== ÉTAT ===`);
    lines.push(`Date            : ${new Date().toISOString()}`);
    lines.push(`Uptime          : ${formatDuration(performance.now())}`);
    lines.push(`URL             : ${window.location.href}`);
    lines.push(`Viewport        : ${window.innerWidth} × ${window.innerHeight}`);
    lines.push(`Device pixel    : ${window.devicePixelRatio}x`);
    lines.push(`User-agent      : ${navigator.userAgent}`);
    lines.push("");

    lines.push(`=== APP ===`);
    lines.push(`Presenter       : ${window.presenter ? "OK" : "MISSING"}`);
    lines.push(`PROJECTS        : ${window.PROJECTS ? Object.keys(window.PROJECTS).length + " projet(s)" : "MISSING"}`);
    const canvas = document.getElementById("draw-canvas");
    lines.push(`Canvas size     : ${canvas ? canvas.width + "×" + canvas.height : "MISSING"}`);

    if (window.performance && performance.memory) {
      const m = performance.memory;
      lines.push(`JS Heap         : ${(m.usedJSHeapSize/1048576).toFixed(1)} / ${(m.totalJSHeapSize/1048576).toFixed(1)} Mo`);
    }
    lines.push("");

    lines.push(`=== CONFIG ===`);
    lines.push(`Inactivity      : ${CONFIG.inactivityTimeoutMs / 60000} min`);
    lines.push(`Daily reload    : ${CONFIG.dailyReloadEnabled ? CONFIG.dailyReloadHour + "h" + String(CONFIG.dailyReloadMinute).padStart(2,"0") : "OFF"}`);
    lines.push(`Watchdog        : ${CONFIG.watchdogIntervalMs / 1000}s`);
    lines.push("");

    lines.push(`=== LOGS RÉCENTS (${logBuffer.length}) ===`);
    const recent = logBuffer.slice(-30);
    for (const e of recent) {
      lines.push(`[${e.t.substring(11,19)}] ${e.level.toUpperCase().padEnd(5)} ${e.msg}`);
    }

    return lines.join("\n");
  }

  function formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}min ${sec}s`;
    if (m > 0) return `${m}min ${sec}s`;
    return `${sec}s`;
  }

  /* ---------------------------------------------------------------------------
     Initialisation
     --------------------------------------------------------------------------- */
  function init() {
    bufferedLog("info", ["[kiosk] initialisation robustesse"]);
    resetInactivityTimer();
    startWatchdog();
    scheduleDailyReload();
    setupWebGLWatchdog();
    bufferedLog("info", ["[kiosk] prêt"]);
  }

  // Démarrer après DOMContentLoaded ET après app.js (qui crée presenter)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      // Petit délai pour que app.js initialise d'abord
      setTimeout(init, 500);
    });
  } else {
    setTimeout(init, 500);
  }

  // Exposition globale pour debug (utilisable dans la console)
  window.kioskDiag = collectDiagnostic;
  window.kioskShowDiag = showDiagnosticOverlay;

})();
