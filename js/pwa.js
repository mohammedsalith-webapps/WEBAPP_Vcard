// PWA Service Worker Registration & Installation Prompt Handler

export const PWAHandler = {
  deferredPrompt: null,

  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
  },

  registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
          .then((reg) => {
            console.log("ServiceWorker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("ServiceWorker registration failed:", err);
          });
      });
    }
  },

  setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      // Stash event for 1-click trigger
      this.deferredPrompt = e;
      console.log("PWA beforeinstallprompt captured ready for 1-click install.");
      const installBtn = document.getElementById("btn-pwa-install");
      if (installBtn) {
        installBtn.style.display = "inline-flex";
      }
    });

    window.addEventListener("appinstalled", () => {
      this.deferredPrompt = null;
      console.log("OmniCard PWA installed successfully.");
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
      window.OmniApp?.showToast("App installed to your home screen! 🎉");
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

  // Dynamically update manifest so installed app opens THIS vendor's vCard directly with unique ID
  updateManifestForVendor(vendor) {
    if (!vendor) return;
    try {
      const bizName = vendor.branding?.businessName || "Smart vCard";
      const vendorSlug = vendor.slug || vendor.id;
      const startUrl = `./?v=${vendorSlug}&pwa=1`;
      const primaryColor = vendor.branding?.colors?.primary || "#D4FF00";
      const bgColor = vendor.branding?.colors?.background || "#07090E";
      const emoji = vendor.branding?.avatarEmoji || "💼";
      const circularIconDataUrl = this.generateCircularAppIcon(emoji, primaryColor, bgColor);

      const dynamicManifest = {
        id: `vcard-app-${vendorSlug}`,
        name: bizName,
        short_name: bizName.length > 14 ? bizName.substring(0, 14) : bizName,
        description: vendor.about?.description || vendor.branding?.tagline || `${bizName} Smart Business vCard`,
        start_url: startUrl,
        scope: `./?v=${vendorSlug}`,
        display: "standalone",
        background_color: bgColor,
        theme_color: bgColor,
        icons: [
          {
            src: circularIconDataUrl,
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable"
          },
          {
            src: "./assets/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          }
        ]
      };

      const blob = new Blob([JSON.stringify(dynamicManifest)], { type: "application/manifest+json" });
      const manifestUrl = URL.createObjectURL(blob);
      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) {
        manifestLink = document.createElement("link");
        manifestLink.rel = "manifest";
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = manifestUrl;

      // Update apple touch icon & title
      let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appleMeta) {
        appleMeta.content = bizName;
      }
      let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
      if (!appleIcon) {
        appleIcon = document.createElement("link");
        appleIcon.rel = "apple-touch-icon";
        document.head.appendChild(appleIcon);
      }
      appleIcon.href = circularIconDataUrl;

      document.title = `${bizName} - Smart Business vCard`;
    } catch (e) {
      console.warn("Could not set dynamic manifest:", e);
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

  promptInstall(vendorName = "Smart vCard", vendor = null) {
    const vendorSlug = vendor ? (vendor.slug || vendor.id) : null;
    if (vendorSlug && this.isVendorInstalled(vendorSlug)) {
      window.OmniApp?.showToast(`${vendorName} App is already installed! 🎉`);
      return;
    }

    // 1. Android Chrome / Chromium 1-Click Native Installation
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
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
      });
      return;
    }

    // 2. iOS Safari or browser without automated prompt
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

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const v = vendor || {};
    const avatar = v.branding?.avatarEmoji || "📲";

    guideModal.innerHTML = `
      <div class="modal-card" style="max-width: 440px; text-align: center; padding: 22px 18px;">
        <div style="font-size: 2.2rem; margin-bottom: 6px;">${avatar}</div>
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #FFF; margin-bottom: 4px;">
          Install ${vendorName} App
        </h3>
        <p style="font-size: 0.78rem; color: var(--theme-text-muted); line-height: 1.4; margin-bottom: 16px;">
          Save to your phone home screen for 1-tap instant access, full-screen mode, and offline loading.
        </p>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 16px; text-align: left; margin-bottom: 16px;">
          ${isIOS ? `
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
            </div>
          ` : isAndroid ? `
            <div style="font-weight: 800; color: var(--theme-primary, #D4FF00); font-size: 0.85rem; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              <span>🤖</span> Android Quick Install:
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
          ` : `
            <div style="font-weight: 800; color: var(--theme-primary, #D4FF00); font-size: 0.85rem; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              <span>💻</span> Desktop / Chrome Install:
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem; color: #F1F5F9;">
              <span>Click the <strong>Install Icon ( ⊕ )</strong> in your browser address bar to install as a standalone app.</span>
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
    guideModal.querySelector("#btn-copy-pwa-link")?.addEventListener("click", async () => {
      const url = window.location.href;
      try {
        await navigator.clipboard.writeText(url);
        window.OmniApp?.showToast("vCard link copied to clipboard!");
      } catch (e) {
        window.OmniApp?.showToast(url);
      }
      closeModal();
    });

    guideModal.addEventListener("click", (e) => {
      if (e.target === guideModal) closeModal();
    });
  }
};
