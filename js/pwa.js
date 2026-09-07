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
            console.log("ServiceWorker registered successfully with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("ServiceWorker registration failed:", err);
          });
      });
    }
  },

  setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const installBtn = document.getElementById("btn-pwa-install");
      if (installBtn) {
        installBtn.style.display = "inline-flex";
      }
    });

    window.addEventListener("appinstalled", () => {
      this.deferredPrompt = null;
      console.log("OmniCard PWA installed successfully.");
      const installBtn = document.getElementById("btn-pwa-install");
      if (installBtn) {
        installBtn.style.display = "none";
      }
    });
  },

  promptInstall(vendorName = "Smart vCard") {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          window.OmniApp?.showToast("App installed to your home screen! 🎉");
        }
        this.deferredPrompt = null;
      });
    } else {
      this.showInstallGuide(vendorName);
    }
  },

  showInstallGuide(vendorName = "Smart vCard") {
    let guideModal = document.getElementById("modal-pwa-guide");
    if (!guideModal) {
      guideModal = document.createElement("div");
      guideModal.id = "modal-pwa-guide";
      guideModal.className = "modal-overlay";
      document.body.appendChild(guideModal);
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);

    guideModal.innerHTML = `
      <div class="modal-card" style="max-width: 440px; text-align: center; padding: 24px 20px;">
        <div style="font-size: 2.4rem; margin-bottom: 8px;">📲</div>
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #FFF; margin-bottom: 6px;">
          Install ${vendorName} Web App
        </h3>
        <p style="font-size: 0.8rem; color: var(--theme-text-muted); line-height: 1.45; margin-bottom: 20px;">
          Add this card to your mobile phone home screen for 1-tap instant access, offline availability, and full-screen app experience.
        </p>

        <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--theme-border); border-radius: 12px; padding: 14px; text-align: left; margin-bottom: 20px; font-size: 0.82rem; color: #E2E8F0; line-height: 1.6;">
          ${isIOS ? `
            <div style="font-weight: 700; color: var(--theme-primary); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <span>🍏</span> iPhone / iPad Instructions:
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <span style="background: var(--theme-primary); color: #000; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">1</span>
                <span>Tap the <strong>Share</strong> button ( <span style="color: #00E5FF; font-size: 1.1rem; vertical-align: middle;">⎋</span> ) at the bottom of your Safari browser.</span>
              </div>
              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <span style="background: var(--theme-primary); color: #000; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">2</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong> ( <strong>⊞</strong> ).</span>
              </div>
              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <span style="background: var(--theme-primary); color: #000; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">3</span>
                <span>Tap <strong>"Add"</strong> in the top-right corner. All set!</span>
              </div>
            </div>
          ` : isAndroid ? `
            <div style="font-weight: 700; color: var(--theme-primary); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <span>🤖</span> Android / Chrome Instructions:
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <span style="background: var(--theme-primary); color: #000; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">1</span>
                <span>Tap the <strong>Three Dots</strong> ( <strong style="color: #00E5FF;">⋮</strong> ) in the top right of Chrome.</span>
              </div>
              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <span style="background: var(--theme-primary); color: #000; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">2</span>
                <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
              </div>
              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <span style="background: var(--theme-primary); color: #000; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">3</span>
                <span>Confirm <strong>"Install"</strong> to save to your home screen!</span>
              </div>
            </div>
          ` : `
            <div style="font-weight: 700; color: var(--theme-primary); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <span>💻</span> Desktop / Browser Instructions:
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <span style="background: var(--theme-primary); color: #000; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">1</span>
                <span>Click the <strong>Install Icon</strong> ( <strong>⊕</strong> or <strong>💻</strong> ) in your browser address bar.</span>
              </div>
              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <span style="background: var(--theme-primary); color: #000; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">2</span>
                <span>Click <strong>Install</strong> to launch as a standalone desktop web app.</span>
              </div>
            </div>
          `}
        </div>

        <button type="button" class="btn-submit-primary" id="btn-close-pwa-guide" style="padding: 10px 16px; font-size: 0.85rem;">
          <span>Got It, Thanks! 👍</span>
        </button>
      </div>
    `;

    guideModal.classList.add("active");
    guideModal.querySelector("#btn-close-pwa-guide")?.addEventListener("click", () => {
      guideModal.classList.remove("active");
    });
  }
};
