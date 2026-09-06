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

    // 4. Update Clock in iOS status bar
    this.startNotchClock();

    // 5. Populate Vendor Selector in Topbar
    this.populateVendorDropdown();

    // 6. Bind Topbar Event Listeners
    this.bindTopbarEvents();

    // 7. Subscribe to DB live changes
    db.subscribe(() => {
      this.populateVendorDropdown();
    });

    // 8. Handle Initial Route
    this.handleRoute();

    // 9. Listen for browser back/forward buttons
    window.addEventListener("popstate", () => {
      this.handleRoute();
    });
  }

  startNotchClock() {
    const clockEl = document.getElementById("notch-clock");
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      if (hours > 12) hours -= 12;
      if (hours === 0) hours = 12;
      if (clockEl) clockEl.textContent = `${hours}:${minutes}`;
    };
    updateTime();
    setInterval(updateTime, 30000);
  }

  populateVendorDropdown() {
    const select = document.getElementById("topbar-vendor-select");
    if (!select) return;

    const vendors = db.getVendors();
    select.innerHTML = vendors.map(v => `
      <option value="${v.slug || v.id}" ${v.slug === this.currentVendorSlug ? 'selected' : ''}>
        ${v.branding.avatarEmoji || '🏢'} ${v.branding.businessName}
      </option>
    `).join("");
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

    // Demo Card selector dropdown
    const select = document.getElementById("topbar-vendor-select");
    if (select) {
      select.addEventListener("change", (e) => {
        const slug = e.target.value;
        if (slug) {
          this.navigate("card", slug);
        }
      });
    }

    // Device Shell Toggle (Phone mockup vs expanded)
    const toggleBtn = document.getElementById("btn-toggle-frame");
    const stageContainer = document.getElementById("main-stage");
    const toggleIcon = document.getElementById("frame-toggle-icon");
    const toggleLabel = document.getElementById("frame-toggle-label");

    if (toggleBtn && stageContainer) {
      toggleBtn.addEventListener("click", () => {
        this.isFullWidth = !this.isFullWidth;
        stageContainer.classList.toggle("view-fullwidth", this.isFullWidth);
        if (this.isFullWidth) {
          toggleIcon.textContent = "💻";
          toggleLabel.textContent = "Expanded";
        } else {
          toggleIcon.textContent = "📱";
          toggleLabel.textContent = "Phone View";
        }
      });
    }

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
    const toggleBtn = document.getElementById("btn-toggle-frame");
    const dockRoot = document.getElementById("app-dock-root");
    const topTitle = document.getElementById("topbar-title");

    // Update active topbar buttons
    const btnHome = document.getElementById("btn-portal-home");
    const btnAdmin = document.getElementById("btn-portal-admin");

    if (btnHome) btnHome.classList.toggle("active", viewName === "home");
    if (btnAdmin) btnAdmin.classList.toggle("active", viewName === "admin");

    if (viewName === "home") {
      // In Home mode: fullwidth modern bento showcase
      if (dockRoot) dockRoot.style.display = "none";
      stageContainer.classList.add("view-fullwidth");
      if (toggleBtn) toggleBtn.style.display = "none";
      if (topTitle) topTitle.textContent = "OmniCard OS • Packages & Features";
      this.homeCtrl.init();

    } else if (viewName === "card") {
      // In Card mode: phone frame by default
      if (dockRoot) dockRoot.style.display = "block";
      stageContainer.classList.toggle("view-fullwidth", this.isFullWidth);
      if (toggleBtn) toggleBtn.style.display = "inline-flex";

      const slug = vendorSlug || this.currentVendorSlug || "elite-catering";
      this.currentVendorSlug = slug;
      const v = db.getVendor(slug);
      if (topTitle && v) {
        topTitle.textContent = v.branding.businessName;
      }
      this.vcardCtrl.loadVendor(slug);

    } else if (viewName === "vendor") {
      // In Vendor mode: fullwidth expanded view for optimal management
      if (dockRoot) dockRoot.style.display = "none";
      stageContainer.classList.add("view-fullwidth");
      if (toggleBtn) toggleBtn.style.display = "none";
      if (topTitle) topTitle.textContent = "Vendor Operating Console";
      this.vendorCtrl.init();

    } else if (viewName === "admin") {
      // In Admin mode: fullwidth expanded view
      if (dockRoot) dockRoot.style.display = "none";
      stageContainer.classList.add("view-fullwidth");
      if (toggleBtn) toggleBtn.style.display = "none";
      if (topTitle) topTitle.textContent = "Super Admin Console";
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
