// Main Application Bootstrap & Master View Orchestrator
import { db } from "./db.js";
import { VCardController } from "./vcard.js";
import { VendorConsoleController } from "./vendor.js";
import { AdminConsoleController } from "./admin.js";
import { HomeController } from "./home.js";
import { PWAHandler } from "./pwa.js";

class OmniAppManager {
  constructor() {
    this.currentView = "home"; // home, card, vendor, admin
    this.currentVendorSlug = "elite-catering";
    this.isFullWidth = false;

    // Sub-controllers
    this.homeCtrl = null;
    this.vcardCtrl = null;
    this.vendorCtrl = null;
    this.adminCtrl = null;
  }

  async init() {
    // 1. Initialize Database
    await db.init();

    // 2. Initialize PWA Service Worker & Install Listener
    PWAHandler.init();

    // 3. Setup Controllers
    const rootEl = document.getElementById("app-content-root");
    this.homeCtrl = new HomeController(rootEl);
    this.vcardCtrl = new VCardController(rootEl);
    this.vendorCtrl = new VendorConsoleController(rootEl);
    this.adminCtrl = new AdminConsoleController(rootEl);

    // 4. Bind Topbar Event Listeners
    this.bindTopbarEvents();

    // 5. Handle Initial Route
    this.handleRoute();

    // 6. Listen for browser back/forward buttons
    window.addEventListener("popstate", () => {
      this.handleRoute();
    });
  }

  bindTopbarEvents() {
    // Brand Logo click -> navigate to home packages & features
    document.getElementById("brand-home-trigger")?.addEventListener("click", () => {
      this.navigate("home");
    });

    // Home / Packages button
    document.getElementById("btn-portal-home")?.addEventListener("click", () => {
      this.navigate("home");
    });

    // Super Admin button
    document.getElementById("btn-portal-admin")?.addEventListener("click", () => {
      this.navigate("admin");
    });

    // PWA Install Button
    document.getElementById("btn-pwa-install")?.addEventListener("click", () => {
      PWAHandler.promptInstall();
    });
  }

  handleRoute() {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view");
    const vendorParam = params.get("v");

    if (viewParam === "vendor") {
      this.setView("vendor", vendorParam);
    } else if (viewParam === "admin") {
      this.setView("admin");
    } else if (viewParam === "card") {
      const slug = vendorParam || this.currentVendorSlug || "elite-catering";
      this.currentVendorSlug = slug;
      this.setView("card", slug);
    } else if (vendorParam) {
      // Direct vendor card link, e.g. ?v=elite-catering
      this.currentVendorSlug = vendorParam;
      this.setView("card", vendorParam);
    } else {
      // Default: Business Landing Home Page with All Packages & Features
      this.setView("home");
    }
  }

  navigate(view, vendorSlug = null) {
    const params = new URLSearchParams();
    if (view === "vendor") {
      params.set("view", "vendor");
      if (vendorSlug) params.set("v", vendorSlug);
    } else if (view === "admin") {
      params.set("view", "admin");
    } else if (view === "home") {
      params.set("view", "home");
    } else {
      params.set("v", vendorSlug || this.currentVendorSlug || "elite-catering");
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", newUrl);
    this.handleRoute();
  }

  setView(viewName, vendorSlug = null) {
    this.currentView = viewName;
    const stageContainer = document.getElementById("main-stage");
    const dockRoot = document.getElementById("app-dock-root");
    const topbar = document.getElementById("app-topbar");

    // Only show the platform topbar on the public SaaS home page; hide completely on customer vCards, vendor console, and admin
    if (topbar) {
      topbar.style.display = (viewName === "home") ? "flex" : "none";
    }

    if (viewName === "home") {
      // In Home mode: fullwidth modern bento showcase
      if (dockRoot) dockRoot.style.display = "none";
      stageContainer.classList.add("view-fullwidth");
      this.homeCtrl.init();

    } else if (viewName === "card") {
      // In Card mode: clean mobile webapp canvas with bottom dock (no admin or phone buttons)
      if (dockRoot) dockRoot.style.display = "block";
      stageContainer.classList.remove("view-fullwidth");

      const slug = vendorSlug || this.currentVendorSlug || "elite-catering";
      this.currentVendorSlug = slug;
      this.vcardCtrl.loadVendor(slug);

    } else if (viewName === "vendor") {
      // In Vendor mode: fullwidth clean dashboard
      if (dockRoot) dockRoot.style.display = "none";
      stageContainer.classList.add("view-fullwidth");
      this.vendorCtrl.init();

    } else if (viewName === "admin") {
      // In Admin mode: fullwidth clean admin dashboard
      if (dockRoot) dockRoot.style.display = "none";
      stageContainer.classList.add("view-fullwidth");
      this.adminCtrl.init();
    }
  }

  // Admin Impersonation: Direct 1-Click login as a specific vendor
  adminManageVendor(vendorId) {
    this.setView("vendor", vendorId);
    this.vendorCtrl.loginVendorDirect(vendorId);
    const v = db.getVendor(vendorId);
    this.showToast(`Managing as ${v ? v.branding.businessName : 'Vendor'}`);
  }

  openVendorPortal() {
    this.navigate("vendor");
  }

  showToast(message) {
    const root = document.getElementById("toast-root");
    if (!root) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    root.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// Global App Instance
window.OmniApp = new OmniAppManager();
window.addEventListener("DOMContentLoaded", () => {
  window.OmniApp.init();
});
