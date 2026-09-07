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
      window.OmniApp?.showToast("App installed to your home screen! 🎉");
      const installBtn = document.getElementById("btn-pwa-install");
      if (installBtn) {
        installBtn.style.display = "none";
      }
    });
  },

  // Dynamically update manifest so installed app opens THIS vendor's vCard directly
  updateManifestForVendor(vendor) {
    if (!vendor) return;
    try {
      const bizName = vendor.branding?.businessName || "Smart vCard";
      const startUrl = `./?v=${vendor.slug || vendor.id}`;
      const dynamicManifest = {
        name: bizName,
        short_name: bizName.length > 14 ? bizName.substring(0, 14) : bizName,
        description: vendor.about?.description || vendor.branding?.tagline || `${bizName} Smart Business vCard`,
        start_url: startUrl,
        scope: "./",
        display: "standalone",
        background_color: vendor.branding?.colors?.background || "#07090E",
        theme_color: vendor.branding?.colors?.background || "#07090E",
        icons: [
          {
            src: "./assets/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "./assets/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "./assets/icons/icon.svg",
            sizes: "192x192 512x512",
            type: "image/svg+xml",
            purpose: "any maskable"
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

      // Update apple touch title and document title
      let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appleMeta) {
        appleMeta.content = bizName;
      }
      document.title = `${bizName} - Smart Business vCard`;
    } catch (e) {
      console.warn("Could not set dynamic manifest:", e);
    }
  },

  promptInstall(vendorName = "Smart vCard", vendor = null) {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    if (isStandalone) {
      window.OmniApp?.showToast(`${vendorName} App is already running as an installed app! 🎉`);
      return;
    }

    // 1. Android Chrome / Chromium 1-Click Native Installation
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
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
