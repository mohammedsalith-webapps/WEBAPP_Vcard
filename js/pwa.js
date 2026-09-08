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
      navigator.serviceWorker.register("./sw.js")
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
    const handlePrompt = (e) => {
      if (!e) return;
      this.deferredPrompt = e;
      window.deferredPWAPrompt = e;
      console.log("⚡ [PWA] 1-Click native install prompt ready.");
      const installBtn = document.getElementById("btn-pwa-install");
      if (installBtn) {
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
      const currentSlug = new URLSearchParams(window.location.search).get("v");
      if (currentSlug) {
        try {
          const installed = JSON.parse(localStorage.getItem("pwa_installed_cards") || "[]");
          if (!installed.includes(currentSlug)) {
            installed.push(currentSlug);
            localStorage.setItem("pwa_installed_cards", JSON.stringify(installed));
          }
        } catch (e) {}
      }
      window.OmniApp?.showToast("App installed to your phone home screen! 🎉");
      const installBtn = document.getElementById("btn-pwa-install");
      if (installBtn) {
        installBtn.style.display = "none";
      }
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
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    const urlParams = new URLSearchParams(window.location.search);
    const currentSlug = urlParams.get("v");
    // If currently running in standalone mode AND on this vendor's page
    if (isStandalone && currentSlug === vendorSlug) {
      return true;
    }
    try {
      const installed = JSON.parse(localStorage.getItem("pwa_installed_cards") || "[]");
      return installed.includes(vendorSlug);
    } catch (e) {
      return false;
    }
  },

  // Dynamically update manifest URL and meta tags so installed app opens THIS vendor's vCard directly
  // NEVER use blob: or data: URLs which Chrome Android WebAPK builders reject
  updateManifestForVendor(vendor) {
    if (!vendor) return;
    try {
      const bizName = vendor.branding?.businessName || "Smart vCard";
      const vendorSlug = vendor.slug || vendor.id;

      // Save last active vCard so standalone app launches always open this vendor
      try {
        localStorage.setItem("omnicard_last_active_vcard", vendorSlug);
      } catch (e) {}

      // Update manifest href to real HTTPS same-origin URL with query params
      let manifestLink = document.querySelector('link[rel="manifest"]') || document.getElementById("app-manifest-link");
      if (!manifestLink) {
        manifestLink = document.createElement("link");
        manifestLink.rel = "manifest";
        manifestLink.id = "app-manifest-link";
        document.head.appendChild(manifestLink);
      }
      const targetHref = `manifest.webmanifest?v=${encodeURIComponent(vendorSlug)}&name=${encodeURIComponent(bizName)}`;
      if (manifestLink.getAttribute("href") !== targetHref) {
        manifestLink.setAttribute("href", targetHref);
      }

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

  autoPromptInstallIfEligible(vendor) {
    if (!vendor) return;
    const vendorSlug = vendor.slug || vendor.id;

    // Once THIS SPECIFIC vendor is installed, NEVER ask again
    if (this.isVendorInstalled(vendorSlug)) {
      return;
    }
    if (vendor && vendor.features?.pwaInstall === false) {
      return;
    }

    // Delay 1.2s after page load for smooth entry
    setTimeout(() => {
      // Re-verify not already installed for this vendor
      if (this.isVendorInstalled(vendorSlug)) return;
      if (document.querySelector(".modal-overlay.active")) return;

      const bizName = vendor?.branding?.businessName || "Smart App";
      const avatar = vendor?.branding?.avatarEmoji || "📲";
      const modalsRoot = document.getElementById("app-modals-root") || document.body;

      let promptEl = document.getElementById("modal-pwa-autoprompt");
      if (!promptEl) {
        promptEl = document.createElement("div");
        promptEl.id = "modal-pwa-autoprompt";
        promptEl.className = "modal-overlay";
        modalsRoot.appendChild(promptEl);
      }

      promptEl.innerHTML = `
        <div class="modal-card" style="max-width: 440px; text-align: center; padding: 22px 20px; border-radius: 24px 24px 0 0; background: #0F131C; border: 1px solid var(--theme-border-highlight); box-shadow: 0 -12px 40px rgba(0,0,0,0.9);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.8rem;">${avatar}</span>
              <div style="text-align: left;">
                <div style="font-weight: 800; color: #FFF; font-size: 1rem; line-height: 1.2;">Install ${bizName}</div>
                <div style="font-size: 0.72rem; color: var(--theme-primary, #D4FF00); font-weight: 600;">Fast 1-Tap Home Screen App</div>
              </div>
            </div>
            <button type="button" class="btn-modal-close" id="btn-close-pwa-autoprompt" style="font-size: 1.2rem; padding: 4px 8px; color: var(--theme-text-muted);">×</button>
          </div>

          <p style="font-size: 0.78rem; color: var(--theme-text-muted); line-height: 1.4; text-align: left; margin-bottom: 16px;">
            Add to your phone home screen for full-screen view, faster 1-tap booking, and instant offline access without typing links.
          </p>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button type="button" class="btn-submit-primary" id="btn-confirm-pwa-autoprompt" style="width: 100%; padding: 12px; font-size: 0.9rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span>📲 Install App (1-Click)</span>
            </button>
            <button type="button" class="btn-pill" id="btn-dismiss-pwa-autoprompt" style="width: 100%; justify-content: center; padding: 8px; font-size: 0.76rem; border-color: transparent; color: var(--theme-text-muted);">
              Continue in Browser
            </button>
          </div>
        </div>
      `;

      promptEl.classList.add("active");
      document.body.classList.add("has-modal-open");

      const closeAutoPrompt = () => {
        promptEl.classList.remove("active");
        if (!document.querySelector(".modal-overlay.active")) {
          document.body.classList.remove("has-modal-open");
        }
      };

      promptEl.querySelector("#btn-close-pwa-autoprompt")?.addEventListener("click", closeAutoPrompt);
      promptEl.querySelector("#btn-dismiss-pwa-autoprompt")?.addEventListener("click", closeAutoPrompt);
      promptEl.addEventListener("click", (e) => {
        if (e.target === promptEl) closeAutoPrompt();
      });

      promptEl.querySelector("#btn-confirm-pwa-autoprompt")?.addEventListener("click", () => {
        closeAutoPrompt();
        this.promptInstall(bizName, vendor);
      });
    }, 1200);
  },

  async promptInstall(vendorName = "Smart vCard", vendor = null) {
    const vendorSlug = vendor ? (vendor.slug || vendor.id) : null;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;

    if (isStandalone) {
      window.OmniApp?.showToast(`${vendorName} is already running as an installed app! 🎉`);
      return;
    }

    // Refresh prompt reference if available on window
    if (!this.deferredPrompt && window.deferredPWAPrompt) {
      this.deferredPrompt = window.deferredPWAPrompt;
    }

    // If prompt is not yet ready, give it a quick 350ms window before falling back
    if (!this.deferredPrompt && !(/iPad|iPhone|iPod/.test(navigator.userAgent))) {
      await new Promise(resolve => setTimeout(resolve, 350));
      if (window.deferredPWAPrompt) {
        this.deferredPrompt = window.deferredPWAPrompt;
      }
    }

    // 1. Android Chrome / Chromium 1-Click Native Installation
    if (this.deferredPrompt) {
      try {
        this.deferredPrompt.prompt();
        this.deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult && choiceResult.outcome === "accepted") {
            if (vendorSlug) {
              try {
                const installed = JSON.parse(localStorage.getItem("pwa_installed_cards") || "[]");
                if (!installed.includes(vendorSlug)) {
                  installed.push(vendorSlug);
                  localStorage.setItem("pwa_installed_cards", JSON.stringify(installed));
                }
              } catch (e) {}
            }
            window.OmniApp?.showToast(`${vendorName} added to your home screen! 🎉`);
          }
          this.deferredPrompt = null;
          window.deferredPWAPrompt = null;
        }).catch((err) => {
          console.warn("[PWA] Prompt outcome error:", err);
          this.showInstallGuide(vendorName, vendor);
        });
        return;
      } catch (err) {
        console.warn("[PWA] Prompt trigger error:", err);
      }
    }

    // 2. Browser without automated prompt (iOS Safari, In-App browser, or fallback):
    this.showInstallGuide(vendorName, vendor);
  },

  showInstallGuide(vendorName = "Smart vCard", vendor = null) {
    const modalsRoot = document.getElementById("app-modals-root") || document.body;
    let guideModal = document.getElementById("modal-pwa-guide");
    if (!guideModal) {
      guideModal = document.createElement("div");
      guideModal.id = "modal-pwa-guide";
      guideModal.className = "modal-overlay";
      modalsRoot.appendChild(guideModal);
    }

    const ua = navigator.userAgent || "";
    // Check if running inside WhatsApp, Instagram, FB, or other in-app webview
    const isInAppBrowser = /FBAN|FBAV|Instagram|WhatsApp|Line|MicroMessenger|Snapchat|BytedanceWebview/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua) || (ua.includes("Linux") && navigator.maxTouchPoints > 0);
    const isTouchDevice = navigator.maxTouchPoints > 0 || window.innerWidth <= 900;
    const v = vendor || {};
    const avatar = v.branding?.avatarEmoji || "📲";

    // Build current clean URL
    const currentUrl = window.location.href;
    // Android Chrome Intent URL to break out of in-app browsers directly into real Google Chrome
    const chromeIntentUrl = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`;

    guideModal.innerHTML = `
      <div class="modal-card" style="max-width: 440px; text-align: center; padding: 22px 18px;">
        <div style="font-size: 2.2rem; margin-bottom: 6px;">${avatar}</div>
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #FFF; margin-bottom: 4px;">
          Install ${vendorName} App
        </h3>
        <p style="font-size: 0.78rem; color: var(--theme-text-muted); line-height: 1.4; margin-bottom: 16px;">
          Save directly to your phone home screen for instant 1-tap access and offline viewing.
        </p>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 16px; text-align: left; margin-bottom: 16px;">
          ${isInAppBrowser ? `
            <div style="font-weight: 800; color: #FFB703; font-size: 0.85rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <span>⚠️</span> In-App Browser Detected
            </div>
            <p style="font-size: 0.76rem; color: var(--theme-text-muted); margin-bottom: 12px; line-height: 1.35;">
              WhatsApp & Social App browsers do not support direct app installation. Open in Google Chrome for 1-tap install:
            </p>
            ${isAndroid ? `
              <a href="${chromeIntentUrl}" class="btn-submit-primary" style="display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; padding: 10px; font-size: 0.82rem; font-weight: 800; margin-bottom: 10px; width: 100%;">
                <span>🚀 Open in Chrome App</span>
              </a>
            ` : ""}
            <div style="font-size: 0.76rem; color: #F1F5F9; line-height: 1.4;">
              Or tap the <strong>three dots ( ⋮ )</strong> or <strong>Share ( ⎋ )</strong> at the top/bottom corner and choose <strong>"Open in Chrome"</strong> or <strong>"Open in Safari"</strong>.
            </div>
          ` : isIOS ? `
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
          ` : (isAndroid || isTouchDevice) ? `
            <div style="font-weight: 800; color: var(--theme-primary, #D4FF00); font-size: 0.85rem; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              <span>🤖</span> Android Phone 1-Tap Install:
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.82rem; color: #F1F5F9;">
              <div style="display: flex; gap: 10px; align-items: center;">
                <span style="background: var(--theme-primary, #D4FF00); color: #000; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 800; flex-shrink: 0;">1</span>
                <span>Tap <strong>Menu</strong> ( <strong style="color: #00E5FF; font-size: 1.1rem;">⋮</strong> ) in your browser top bar.</span>
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <span style="background: var(--theme-primary, #D4FF00); color: #000; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 800; flex-shrink: 0;">2</span>
                <span>Tap <strong>Install App</strong> or <strong>Add to Home screen</strong>.</span>
              </div>
            </div>
            <div style="margin-top: 12px; text-align: center;">
              <button type="button" class="btn-pill" id="btn-retry-pwa-prompt" style="font-size: 0.74rem; padding: 6px 14px; width: 100%; justify-content: center; border-color: var(--theme-primary, #D4FF00); color: var(--theme-primary, #D4FF00);">
                <span>🔄 Try 1-Tap Install Now</span>
              </button>
            </div>
          ` : `
            <div style="font-weight: 800; color: var(--theme-primary, #D4FF00); font-size: 0.85rem; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              <span>💻</span> Desktop / Chrome Install:
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem; color: #F1F5F9;">
              <span>Click the <strong>Install Icon ( ⊕ )</strong> in your Chrome address bar to install as a standalone desktop app.</span>
            </div>
          `}
        </div>

        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn-submit-primary" id="btn-copy-pwa-link" style="flex: 1; padding: 11px 14px; font-size: 0.82rem; background: rgba(255,255,255,0.08); color: #FFF; border: 1px solid rgba(255,255,255,0.12);">
            <span>📋 Copy Link</span>
          </button>
          <button type="button" class="btn-submit-primary" id="btn-close-pwa-guide" style="flex: 1; padding: 11px 14px; font-size: 0.82rem;">
            <span>Got It 👍</span>
          </button>
        </div>
      </div>
    `;

    guideModal.classList.add("active");
    document.body.classList.add("has-modal-open");

    const closeModal = () => {
      guideModal.classList.remove("active");
      if (!document.querySelector(".modal-overlay.active")) {
        document.body.classList.remove("has-modal-open");
      }
    };

    guideModal.querySelector("#btn-close-pwa-guide")?.addEventListener("click", closeModal);
    guideModal.querySelector("#btn-retry-pwa-prompt")?.addEventListener("click", () => {
      closeModal();
      if (window.deferredPWAPrompt || this.deferredPrompt) {
        this.promptInstall(vendorName, vendor);
      } else {
        window.OmniApp?.showToast("Tap browser menu (⋮) -> 'Install App'");
      }
    });

    guideModal.querySelector("#btn-copy-pwa-link")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(currentUrl);
        window.OmniApp?.showToast("vCard link copied to clipboard!");
      } catch (e) {
        window.OmniApp?.showToast(currentUrl);
      }
      closeModal();
    });

    guideModal.addEventListener("click", (e) => {
      if (e.target === guideModal) closeModal();
    });
  }
};
