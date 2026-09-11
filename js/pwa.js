// PWA Service Worker Registration & Installation Prompt Handler

export const PWAHandler = {
  deferredPrompt: null,

  init() {
    // Pick up early prompt captured in index.html <head>
    if (window.deferredPWAPrompt) {
      this.deferredPrompt = window.deferredPWAPrompt;
    }
    this.registerServiceWorker();
    this.setupInstallPrompt();
  },

  registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    const doRegister = () => {
      navigator.serviceWorker.register("./sw.js?v=20260912_v26")
        .then((reg) => {
          console.log("[PWA] ServiceWorker registered with scope:", reg.scope);
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn("[PWA] ServiceWorker registration failed:", err);
        });
    };

    // Register immediately if document is already ready (avoids missing window 'load' in deferred ES modules)
    if (document.readyState === "complete" || document.readyState === "interactive") {
      doRegister();
    } else {
      window.addEventListener("DOMContentLoaded", doRegister, { once: true });
      window.addEventListener("load", doRegister, { once: true });
    }
  },

  setupInstallPrompt() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    const installBtn = document.getElementById("btn-pwa-install");
    if (installBtn && !isStandalone) {
      installBtn.style.display = "inline-flex";
    }

    const handlePrompt = (e) => {
      if (!e) return;
      this.deferredPrompt = e;
      window.deferredPWAPrompt = e;
      console.log("⚡ [PWA] 1-Click native install prompt ready.");
      if (installBtn && !isStandalone) {
        installBtn.style.display = "inline-flex";
      }
    };

    if (window.deferredPWAPrompt) {
      handlePrompt(window.deferredPWAPrompt);
    }

    window.addEventListener("pwa-prompt-ready", (e) => {
      handlePrompt(e.detail || window.deferredPWAPrompt);
    });

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      handlePrompt(e);
    });

    window.addEventListener("appinstalled", () => {
      this.deferredPrompt = null;
      window.deferredPWAPrompt = null;
      console.log("[PWA] App installed successfully.");
      const currentSlug = new URLSearchParams(window.location.search).get("v") || window.OmniApp?.currentVendorSlug;
      if (currentSlug) {
        try {
          localStorage.setItem(`vcard_installed_${currentSlug}`, "true");
          const installed = JSON.parse(localStorage.getItem("pwa_installed_cards") || "[]");
          if (!installed.includes(currentSlug)) {
            installed.push(currentSlug);
            localStorage.setItem("pwa_installed_cards", JSON.stringify(installed));
          }
        } catch (e) {}
      }
      try {
        localStorage.setItem("omnicard_installed", "true");
      } catch (e) {}
      window.OmniApp?.showToast("App installed to your phone home screen! 🎉");
      // Hide all install buttons and banners immediately
      document.querySelectorAll("#btn-vcard-top-install, #vcard-pwa-install-banner, .vcard-top-install-btn, #btn-pwa-install").forEach((el) => {
        el.style.display = "none";
      });
      // Remove any open install modals
      document.getElementById("modal-vcard-install-popup")?.remove();
      document.getElementById("modal-pwa-install-sheet")?.remove();
      document.body.classList.remove("has-modal-open");
    });
  },

  // Generates a sleek, high-resolution circular app icon SVG data URL matching the vendor's branding
  generateCircularAppIcon(emoji = "🏢", primaryColor = "#D4FF00", bgColor = "#07090E") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <defs>
        <radialGradient id="circGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1E293B"/>
          <stop offset="75%" stop-color="${bgColor}"/>
          <stop offset="100%" stop-color="#020408"/>
        </radialGradient>
        <filter id="circGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="${primaryColor}" flood-opacity="0.45"/>
        </filter>
      </defs>
      <rect width="512" height="512" rx="128" fill="${bgColor}"/>
      <circle cx="256" cy="256" r="226" fill="url(#circGrad)" stroke="${primaryColor}" stroke-width="16" filter="url(#circGlow)"/>
      <circle cx="256" cy="256" r="198" fill="none" stroke="${primaryColor}" stroke-width="3" stroke-opacity="0.4" stroke-dasharray="10 10"/>
      <text x="256" y="295" font-size="210" text-anchor="middle" dominant-baseline="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${emoji}</text>
    </svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  },

  // Check if a specific vendor's card is installed
  isVendorInstalled(vendorSlug) {
    if (!vendorSlug) return false;
    const urlParams = new URLSearchParams(window.location.search);
    // 1. True installed PWA app opened via home screen shortcut with ?pwa=1
    if (urlParams.get("pwa") === "1") return true;

    // 2. Persistent storage indicators for THIS specific vendor
    try {
      if (localStorage.getItem(`vcard_installed_${vendorSlug}`) === "true") return true;
      const installed = JSON.parse(localStorage.getItem("pwa_installed_cards") || "[]");
      if (installed.includes(vendorSlug)) return true;
    } catch (e) {}

    return false;
  },

  isAppInstalled(vendorSlug) {
    return this.isVendorInstalled(vendorSlug);
  },

  // Dynamically update document title and icons matching the vendor's branding
  // Keeps link[rel="manifest"] static to ensure Chrome fires beforeinstallprompt reliably
  updateManifestForVendor(vendor) {
    if (!vendor) return;
    try {
      const bizName = vendor.branding?.businessName || "Smart vCard";
      const vendorSlug = vendor.slug || vendor.id;

      // Save last active vCard so standalone app launches always open this vendor
      try {
        localStorage.setItem("omnicard_last_active_vcard", vendorSlug);
      } catch (e) {}

      // Update document title and mobile web app meta tags
      document.title = `${bizName} - Smart Business vCard`;

      let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appleMeta) {
        appleMeta.content = bizName.length > 14 ? bizName.substring(0, 14) : bizName;
      }
      let appNameMeta = document.querySelector('meta[name="application-name"]');
      if (appNameMeta) {
        appNameMeta.content = bizName;
      }

      // Update Apple touch icon with vendor branding
      const primaryColor = vendor.branding?.colors?.primary || "#D4FF00";
      const bgColor = vendor.branding?.colors?.background || "#07090E";
      const emoji = vendor.branding?.avatarEmoji || "💼";
      const circularIconDataUrl = this.generateCircularAppIcon(emoji, primaryColor, bgColor);

      let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
      if (!appleIcon) {
        appleIcon = document.createElement("link");
        appleIcon.rel = "apple-touch-icon";
        document.head.appendChild(appleIcon);
      }
      appleIcon.href = circularIconDataUrl;
    } catch (e) {
      console.warn("Could not update manifest for vendor:", e);
    }
  },

  showFirstVisitInstallPopup(vendor) {
    if (!vendor) return;
    const vendorSlug = vendor.slug || vendor.id;
    if (!vendorSlug) return;
    if (vendor.features?.pwaInstall === false) return;

    // 1. Once installed, never popup again!
    if (this.isVendorInstalled(vendorSlug)) return;

    // 2. Session check: if dismissed or chose "Continue in browser", do not re-prompt in this session
    const dismissKey = `pwa_popup_dismissed_${vendorSlug}`;
    if (sessionStorage.getItem(dismissKey)) return;

    // Remove any previous instance if exists
    const existing = document.getElementById("modal-vcard-install-popup");
    if (existing) existing.remove();

    const bizName = vendor.branding?.businessName || "Business";
    const emoji = vendor.branding?.avatarEmoji || "📲";
    const primaryColor = vendor.branding?.colors?.primary || "#D4FF00";

    // Show popup smoothly after 450ms for seamless entrance
    setTimeout(() => {
      if (this.isVendorInstalled(vendorSlug)) return;
      if (sessionStorage.getItem(dismissKey)) return;
      if (document.getElementById("modal-vcard-install-popup")) return;

      const modalEl = document.createElement("div");
      modalEl.id = "modal-vcard-install-popup";
      modalEl.className = "modal-overlay pwa-install-overlay";
      modalEl.innerHTML = `
        <div class="modal-card pwa-install-modal-card">
          <button type="button" class="pwa-popup-close" id="btn-popup-close-x" aria-label="Close">✕</button>
          
          <div class="pwa-popup-avatar-wrap">
            <div class="pwa-popup-avatar-ring" style="--ring-color: ${primaryColor};">
              <span class="pwa-popup-avatar">${emoji}</span>
            </div>
            <div class="pwa-popup-status-chip">
              <span class="pwa-pulse-dot" style="background: ${primaryColor};"></span>
              <span>Official Web App</span>
            </div>
          </div>

          <h3 class="pwa-popup-title">Install ${bizName}</h3>
          <p class="pwa-popup-desc">
            Install this Web App on your phone or laptop for fast 1-tap access and offline viewing.
          </p>

          <div class="pwa-popup-perks">
            <div class="pwa-perk-item">
              <span class="pwa-perk-icon">⚡</span>
              <span>Instant 1-Tap Home Screen Access</span>
            </div>
            <div class="pwa-perk-item">
              <span class="pwa-perk-icon">📴</span>
              <span>Works Offline & Loads Faster</span>
            </div>
            <div class="pwa-perk-item">
              <span class="pwa-perk-icon">✨</span>
              <span>Full-Screen Native App Experience</span>
            </div>
          </div>

          <div class="pwa-popup-actions">
            <button type="button" class="btn-submit-primary pwa-btn-install" id="btn-initial-popup-install">
              <span>📲 Install App</span>
            </button>
            <button type="button" class="btn-pill pwa-btn-cancel" id="btn-initial-popup-cancel">
              <span>✕ Browse Web Version</span>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modalEl);
      document.body.classList.add("has-modal-open");

      // Smooth entrance
      requestAnimationFrame(() => {
        modalEl.classList.add("active");
      });

      const dismissPopup = () => {
        sessionStorage.setItem(dismissKey, "1");
        modalEl.classList.remove("active");
        modalEl.style.opacity = "0";
        modalEl.style.pointerEvents = "none";
        setTimeout(() => {
          if (modalEl.parentNode) modalEl.remove();
          if (!document.querySelector(".modal-overlay.active:not(#modal-vcard-install-popup)")) {
            document.body.classList.remove("has-modal-open");
          }
        }, 250);
      };

      // Cancel button & close X: continue in browser
      modalEl.querySelector("#btn-initial-popup-cancel")?.addEventListener("click", (e) => {
        e.stopPropagation();
        dismissPopup();
      });
      modalEl.querySelector("#btn-popup-close-x")?.addEventListener("click", (e) => {
        e.stopPropagation();
        dismissPopup();
      });

      // Install button: trigger install flow
      modalEl.querySelector("#btn-initial-popup-install")?.addEventListener("click", (e) => {
        e.stopPropagation();
        dismissPopup();
        this.promptInstall(bizName, vendor);
      });

      // Tap backdrop to dismiss / continue in browser
      modalEl.addEventListener("click", (e) => {
        if (e.target === modalEl) dismissPopup();
      });
    }, 800);
  },

  autoPromptInstallIfEligible(vendor) {
    this.showFirstVisitInstallPopup(vendor);
  },

  async waitForInstallPrompt(timeoutMs = 2500) {
    if (this.deferredPrompt || window.deferredPWAPrompt) {
      return this.deferredPrompt || window.deferredPWAPrompt;
    }
    return new Promise((resolve) => {
      let resolved = false;
      const onReady = (e) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(e.detail || window.deferredPWAPrompt || this.deferredPrompt);
        }
      };
      const onBeforeInstall = (e) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(e);
        }
      };
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(this.deferredPrompt || window.deferredPWAPrompt || null);
        }
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timer);
        window.removeEventListener("pwa-prompt-ready", onReady);
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      };

      window.addEventListener("pwa-prompt-ready", onReady, { once: true });
      window.addEventListener("beforeinstallprompt", onBeforeInstall, { once: true });
    });
  },

  async promptInstall(vendorName = "Smart vCard", vendor = null) {
    const v = vendor || {};
    const bizName = vendorName || v.branding?.businessName || "Smart vCard";
    const vendorSlug = v.slug || v.id || new URLSearchParams(window.location.search).get("v") || "";

    const ua = navigator.userAgent || "";
    const isInAppBrowser = /FBAN|FBAV|Instagram|WhatsApp|Line|MicroMessenger|Snapchat|BytedanceWebview/i.test(ua);
    const isAndroid = /Android/i.test(ua) || (ua.includes("Linux") && navigator.maxTouchPoints > 0);

    // 1. If inside WhatsApp / in-app browser on Android: automatically open in Google Chrome for 1-tap install!
    if (isInAppBrowser && isAndroid) {
      window.OmniApp?.showToast("Opening Google Chrome for 1-Tap App Install... 🚀");
      const chromeIntentUrl = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`;
      try {
        window.location.href = chromeIntentUrl;
      } catch (e) {
        window.open(chromeIntentUrl, "_system");
      }
      return;
    }

    // 2. Direct 1-Tap native prompt on Android Chrome, Edge, Desktop Chrome
    const prompt = this.deferredPrompt || window.deferredPWAPrompt;
    if (prompt) {
      try {
        prompt.prompt();
        if (prompt.userChoice && typeof prompt.userChoice.then === "function") {
          prompt.userChoice.then((choiceResult) => {
            if (choiceResult && choiceResult.outcome === "accepted") {
              const currentSlug = vendorSlug || new URLSearchParams(window.location.search).get("v") || window.OmniApp?.currentVendorSlug;
              if (currentSlug) {
                try {
                  localStorage.setItem(`vcard_installed_${currentSlug}`, "true");
                  const installed = JSON.parse(localStorage.getItem("pwa_installed_cards") || "[]");
                  if (!installed.includes(currentSlug)) {
                    installed.push(currentSlug);
                    localStorage.setItem("pwa_installed_cards", JSON.stringify(installed));
                  }
                } catch (e) {}
              }
              window.OmniApp?.showToast(`${bizName} added to your home screen! 🎉`);
              document.querySelectorAll("#btn-vcard-top-install, #vcard-pwa-install-banner, .vcard-top-install-btn, #btn-pwa-install").forEach((el) => {
                el.style.display = "none";
              });
            }
            this.deferredPrompt = null;
            window.deferredPWAPrompt = null;
          }).catch(() => {});
        }
        return;
      } catch (err) {
        console.warn("[PWA] Prompt trigger error:", err);
      }
    }

    // 3. If native prompt not ready (iOS Safari, in-app browser, or desktop): show the guide sheet!
    this.showInstallModal(vendorName, vendor);
  },

  showInstallGuideModal(vendorName = "Smart vCard", vendor = null) {
    this.showInstallModal(vendorName, vendor);
  },

  showInstallModal(vendorName = "Smart vCard", vendor = null) {
    const v = vendor || {};
    const bizName = vendorName || v.branding?.businessName || "Smart vCard";
    const vendorSlug = v.slug || v.id || new URLSearchParams(window.location.search).get("v") || "";
    const avatar = v.branding?.avatarEmoji || "📲";
    const primaryColor = v.branding?.colors?.primary || "#D4FF00";

    // Sync prompt references
    if (!this.deferredPrompt && window.deferredPWAPrompt) {
      this.deferredPrompt = window.deferredPWAPrompt;
    }

    // Always attach modal directly to document.body to prevent clipping inside shell
    const targetParent = document.body;
    let modalEl = document.getElementById("modal-pwa-install-sheet");
    if (modalEl) {
      modalEl.remove();
    }
    modalEl = document.createElement("div");
    modalEl.id = "modal-pwa-install-sheet";
    modalEl.className = "modal-overlay active";
    modalEl.style.cssText = "position: fixed; inset: 0; z-index: 9999999; display: flex; align-items: flex-end; justify-content: center; background: rgba(0, 0, 0, 0.85); opacity: 1; pointer-events: auto; visibility: visible;";
    targetParent.appendChild(modalEl);

    const ua = navigator.userAgent || "";
    const isInAppBrowser = /FBAN|FBAV|Instagram|WhatsApp|Line|MicroMessenger|Snapchat|BytedanceWebview/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua) || (ua.includes("Linux") && navigator.maxTouchPoints > 0);
    const hasNativePrompt = !!(this.deferredPrompt || window.deferredPWAPrompt);

    const currentUrl = window.location.href;
    const chromeIntentUrl = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`;

    modalEl.innerHTML = `
      <div class="modal-card" style="max-width: 440px; width: 100%; text-align: center; padding: 22px 20px calc(24px + env(safe-area-inset-bottom, 16px)); border-radius: 24px 24px 0 0; background: #0F131C; border: 1px solid var(--theme-border-highlight); box-shadow: 0 -12px 40px rgba(0,0,0,0.95); transform: translateY(0); transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
        <!-- Top Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 12px; text-align: left;">
            <span style="font-size: 2rem; background: rgba(255,255,255,0.06); border-radius: 14px; width: 48px; height: 48px; display: inline-flex; align-items: center; justify-content: center;">${avatar}</span>
            <div>
              <div style="font-weight: 800; color: #FFF; font-size: 1.05rem; line-height: 1.2;">Install ${bizName}</div>
              <div style="font-size: 0.74rem; color: ${primaryColor}; font-weight: 700;">Fast 1-Tap Home Screen App</div>
            </div>
          </div>
          <button type="button" class="btn-modal-close" id="btn-close-pwa-sheet" style="font-size: 1.6rem; padding: 4px 10px; color: var(--theme-text-muted); cursor: pointer; background: transparent; border: none; line-height: 1;">×</button>
        </div>

        <p style="font-size: 0.8rem; color: var(--theme-text-muted); line-height: 1.45; text-align: left; margin-bottom: 16px;">
          Add to your phone home screen for full-screen view, faster 1-tap bookings, and instant offline access without typing web links.
        </p>

        <!-- Contextual Content -->
        ${isInAppBrowser ? `
          <div style="background: rgba(255,183,3,0.08); border: 1px solid rgba(255,183,3,0.3); border-radius: 14px; padding: 14px; text-align: left; margin-bottom: 16px;">
            <div style="font-weight: 800; color: #FFB703; font-size: 0.85rem; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>⚠️</span> WhatsApp / In-App Browser Detected
            </div>
            <p style="font-size: 0.76rem; color: #E2E8F0; margin-bottom: 12px; line-height: 1.4;">
              In-app browsers block direct app installation. Open in Google Chrome for 1-tap install:
            </p>
            ${isAndroid ? `
              <a href="${chromeIntentUrl}" class="btn-submit-primary" style="display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; padding: 12px; font-size: 0.88rem; font-weight: 800; margin-bottom: 10px; width: 100%;">
                <span>🚀 Open in Chrome App</span>
              </a>
            ` : ""}
            <div style="font-size: 0.74rem; color: var(--theme-text-muted); line-height: 1.4;">
              Or tap the <strong>three dots ( ⋮ )</strong> or <strong>Share ( ⎋ )</strong> at the corner and choose <strong>"Open in Chrome"</strong> or <strong>"Open in Safari"</strong>.
            </div>
          </div>
        ` : isIOS ? `
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 16px; text-align: left; margin-bottom: 16px;">
            <div style="font-weight: 800; color: var(--theme-primary, #D4FF00); font-size: 0.85rem; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              <span>🍏</span> iPhone & iPad Quick Install:
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.82rem; color: #F1F5F9;">
              <div style="display: flex; gap: 10px; align-items: center;">
                <span style="background: var(--theme-primary, #D4FF00); color: #000; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 800; flex-shrink: 0;">1</span>
                <span>Tap <strong>Share</strong> ( <span style="color: #00E5FF; font-size: 1.1rem; font-weight: 800;">⎋</span> ) at the bottom of Safari.</span>
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <span style="background: var(--theme-primary, #D4FF00); color: #000; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 800; flex-shrink: 0;">2</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong> ( <strong>⊞</strong> ).</span>
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <span style="background: var(--theme-primary, #D4FF00); color: #000; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 800; flex-shrink: 0;">3</span>
                <span>Tap <strong>Add</strong> in the top right to complete!</span>
              </div>
            </div>
          </div>
        ` : hasNativePrompt ? `
          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
            <button type="button" class="btn-submit-primary" id="btn-trigger-native-pwa" style="width: 100%; padding: 13px; font-size: 0.94rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span>📲 Install App (1-Click)</span>
            </button>
          </div>
        ` : `
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 16px; text-align: left; margin-bottom: 16px;">
            <div style="font-weight: 800; color: var(--theme-primary, #D4FF00); font-size: 0.85rem; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              <span>🤖</span> Android / Browser Quick Install:
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.82rem; color: #F1F5F9;">
              <div style="display: flex; gap: 10px; align-items: center;">
                <span style="background: var(--theme-primary, #D4FF00); color: #000; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 800; flex-shrink: 0;">1</span>
                <span>Tap <strong>Menu ( ⋮ )</strong> in your browser top bar.</span>
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <span style="background: var(--theme-primary, #D4FF00); color: #000; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 800; flex-shrink: 0;">2</span>
                <span>Tap <strong>Install App</strong> or <strong>Add to Home screen</strong>.</span>
              </div>
            </div>
            <div style="margin-top: 12px;">
              <button type="button" class="btn-submit-primary" id="btn-trigger-native-pwa" style="width: 100%; padding: 11px; font-size: 0.85rem; font-weight: 800;">
                <span>📲 Tap to Install Now</span>
              </button>
            </div>
          </div>
        `}

        <!-- Action Buttons -->
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn-submit-primary" id="btn-sheet-copy-link" style="flex: 1; padding: 10px 14px; font-size: 0.8rem; background: rgba(255,255,255,0.08); color: #FFF; border: 1px solid rgba(255,255,255,0.12);">
            <span>📋 Copy Link</span>
          </button>
          <button type="button" class="btn-pill" id="btn-sheet-dismiss" style="flex: 1; justify-content: center; padding: 10px 14px; font-size: 0.8rem; border-color: transparent; color: var(--theme-text-muted);">
            <span>Close</span>
          </button>
        </div>
      </div>
    `;

    document.body.classList.add("has-modal-open");

    const closeModal = () => {
      modalEl.classList.remove("active");
      modalEl.style.opacity = "0";
      modalEl.style.pointerEvents = "none";
      setTimeout(() => {
        if (modalEl.parentNode) modalEl.remove();
      }, 250);
      if (!document.querySelector(".modal-overlay.active:not(#modal-pwa-install-sheet)")) {
        document.body.classList.remove("has-modal-open");
      }
    };

    modalEl.querySelector("#btn-close-pwa-sheet")?.addEventListener("click", closeModal);
    modalEl.querySelector("#btn-sheet-dismiss")?.addEventListener("click", () => {
      closeModal();
      if (vendorSlug) {
        try {
          sessionStorage.setItem(`pwa_dismissed_${vendorSlug}`, "1");
        } catch (e) {}
      }
    });

    modalEl.querySelector("#btn-trigger-native-pwa")?.addEventListener("click", () => {
      const prompt = this.deferredPrompt || window.deferredPWAPrompt;
      if (prompt) {
        try {
          const promptPromise = prompt.prompt();
          if (promptPromise && typeof promptPromise.catch === "function") {
            promptPromise.catch((err) => console.warn("[PWA] Prompt outcome error:", err));
          }
          if (prompt.userChoice && typeof prompt.userChoice.then === "function") {
            prompt.userChoice.then((choiceResult) => {
              if (choiceResult && choiceResult.outcome === "accepted") {
                const currentSlug = vendorSlug || new URLSearchParams(window.location.search).get("v") || window.OmniApp?.currentVendorSlug;
                if (currentSlug) {
                  try {
                    localStorage.setItem(`vcard_installed_${currentSlug}`, "true");
                    const installed = JSON.parse(localStorage.getItem("pwa_installed_cards") || "[]");
                    if (!installed.includes(currentSlug)) {
                      installed.push(currentSlug);
                      localStorage.setItem("pwa_installed_cards", JSON.stringify(installed));
                    }
                  } catch (e) {}
                }
                window.OmniApp?.showToast(`${bizName} added to your home screen! 🎉`);
                document.querySelectorAll("#btn-vcard-top-install, #vcard-pwa-install-banner, .vcard-top-install-btn, #btn-pwa-install").forEach((el) => {
                  el.style.display = "none";
                });
              }
              this.deferredPrompt = null;
              window.deferredPWAPrompt = null;
            }).catch((err) => {
              console.warn("[PWA] Prompt outcome error:", err);
            });
          }
        } catch (e) {
          console.warn("[PWA] Prompt trigger error:", e);
        }
        closeModal();
      } else {
        window.OmniApp?.showToast("Tap browser menu (⋮) -> 'Install App' or 'Add to Home screen'");
      }
    });

    modalEl.querySelector("#btn-sheet-copy-link")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(currentUrl);
        window.OmniApp?.showToast("vCard link copied to clipboard!");
      } catch (e) {
        window.OmniApp?.showToast(currentUrl);
      }
      closeModal();
    });

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) closeModal();
    });
  }
};

// Global delegated click listener for any PWA install trigger across all vCards and views
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("#btn-vcard-top-install, #btn-vcard-install-pwa, #vcard-pwa-install-banner, #btn-pwa-install, [data-action='pwa-install']");
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      const currentSlug = new URLSearchParams(window.location.search).get("v") || window.OmniApp?.currentVendorSlug;
      const vendor = currentSlug && window.OmniApp?.db ? window.OmniApp.db.getVendor(currentSlug) : null;
      PWAHandler.promptInstall(vendor?.branding?.businessName, vendor);
    }
  });
}

// Global window exposure
if (typeof window !== "undefined") {
  window.PWAHandler = PWAHandler;
}
