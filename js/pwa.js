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

  promptInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        }
        this.deferredPrompt = null;
      });
    } else {
      window.OmniApp?.showToast("To install on iOS: Tap Share ➔ Add to Home Screen");
    }
  }
};
