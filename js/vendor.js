// Module 2: Vendor Self-Service Console Controller
import { db } from "./db.js";
import { WhatsAppEngine } from "./whatsapp.js";

export class VendorConsoleController {
  constructor(containerEl) {
    this.container = containerEl;
    this.currentVendor = null;
    this.activeTab = "profile"; // profile, services, shop, bookings, reviews
  }

  init() {
    this.render();
  }

  render() {
    if (!this.currentVendor) {
      this.renderLoginForm();
    } else {
      this.renderDashboard();
    }
  }

  // Vendor Authentication View
  renderLoginForm() {
    if (window.OmniApp) window.OmniApp.isAdminManaging = false;
    const vendors = db.getVendors();
    const urlParams = new URLSearchParams(window.location.search);
    const targetSlug = urlParams.get("v");
    const prefillVendor = targetSlug ? db.getVendor(targetSlug) : null;
    const defaultPhone = prefillVendor?.contacts?.whatsapp || prefillVendor?.contacts?.phone || "";

    this.container.innerHTML = `
      <div class="portal-container" style="max-width: 440px;">
        <div class="bento-card" style="padding: 32px 24px; text-align: center;">
          <div style="font-size: 2.6rem; margin-bottom: 8px;">🏪</div>
          <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(0, 229, 255, 0.12); border: 1px solid rgba(0, 229, 255, 0.3); color: #00E5FF; padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px;">
            <span>🏪</span> <span>VENDOR LOGIN PANEL</span>
          </div>
          <h2 style="font-size: 1.45rem; margin-bottom: 6px;">Vendor Console</h2>
          <p style="font-size: 0.82rem; color: var(--theme-text-muted); margin-bottom: 24px;">
            Secure portal for business owners to manage products, quotes, bookings, and card branding.
          </p>

          <form id="form-vendor-login">
            <div class="form-group" style="text-align: left;">
              <label class="form-label">Registered WhatsApp Number</label>
              <input type="tel" class="form-input" id="vendor-login-phone" placeholder="e.g. 9876543210" value="${defaultPhone}" required />
            </div>

            <div class="form-group" style="text-align: left;">
              <label class="form-label">Vendor Password (Provided by Admin)</label>
              <input type="password" class="form-input" id="vendor-login-pin" placeholder="Enter password" required style="font-size: 1.1rem; letter-spacing: 2px;" />
            </div>

            <button type="submit" class="btn-submit-primary" style="margin-top: 16px;">
              <span>Sign In to Dashboard</span>
              <span>→</span>
            </button>
          </form>

          <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--theme-border); font-size: 0.74rem; color: var(--theme-text-muted); line-height: 1.5;">
            🔒 <b>Encrypted Vendor Access</b><br />
            Only authorized account owners can access their digital card management dashboard.
          </div>

          <div style="margin-top: 14px;">
            <a href="https://wa.me/${(db.getPlatformSettings()?.supportWhatsApp || '+919876543210').replace(/[^\d]/g, '')}?text=${encodeURIComponent('Hello Admin, I need assistance logging into my vendor management console.')}" target="_blank" rel="noopener" class="btn-pill" style="background: rgba(37, 211, 102, 0.1); border-color: rgba(37, 211, 102, 0.3); color: #25D366; font-size: 0.78rem; width: 100%; justify-content: center; gap: 6px;">
              <span>💬 Contact Admin Support on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    `;

    // Form submission
    const form = this.container.querySelector("#form-vendor-login");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (window.OmniApp) window.OmniApp.isAdminManaging = false;
      const phone = this.container.querySelector("#vendor-login-phone").value.trim().replace(/[^\d]/g, "");
      const pin = this.container.querySelector("#vendor-login-pin").value.trim();

      const matched = vendors.find(v => {
        const vPhone = (v.contacts.whatsapp || v.contacts.phone || "").replace(/[^\d]/g, "");
        const vPass = v.password || v.pin || "2026";
        return (vPhone.includes(phone) || phone.includes(vPhone)) && (vPass === pin || v.pin === pin);
      });

      if (matched) {
        if (window.OmniApp) window.OmniApp.isAdminManaging = false;
        this.currentVendor = matched;
        this.renderDashboard();
      } else {
        window.OmniApp.showToast("Invalid WhatsApp number or password.");
      }
    });
  }

  // Admin Direct Login Helper (Allows Admin to manage any vendor from the Super Admin Console)
  loginVendorDirect(vendorId, targetTab = "profile") {
    const v = db.getVendor(vendorId);
    if (v) {
      this.currentVendor = v;
      if (targetTab) this.activeTab = targetTab;
      this.renderDashboard();
    }
  }

  // Logged-in Vendor Dashboard
  renderDashboard() {
    if (this.currentVendor?.id) {
      this.currentVendor = db.getVendor(this.currentVendor.id) || this.currentVendor;
    }
    const v = this.currentVendor;
    const settings = db.getPlatformSettings();
    const currency = settings?.currencySymbol || "₹";
    const supportWa = (settings?.supportWhatsApp || "+919876543210").replace(/[^\d]/g, "");
    const waMsg = encodeURIComponent(`Hello Admin, I need assistance regarding my vendor account: ${v.branding.businessName} (${v.id}).`);
    const adminWhatsAppLink = `https://wa.me/${supportWa}?text=${waMsg}`;

    // Admin mode is ONLY active when Super Admin clicked an action from the Admin Console
    const isAdmin = !!(window.OmniApp?.isAdminManaging === true);
    const isTabAvailable = (tab) => {
      if (tab === "profile") return true;
      if (tab === "services") return v.features?.quoteBuilder !== false;
      if (tab === "shop") return v.features?.ecommerceShop !== false;
      if (tab === "bookings") return v.features?.calendarBooking !== false;
      if (tab === "reviews") return v.features?.customerReviews !== false;
      if (tab === "leadform") return v.features?.leadForm !== false;
      return false;
    };
    if (!isTabAvailable(this.activeTab)) {
      this.activeTab = "profile";
    }

    const isSuspended = v.status === "suspended";
    const now = new Date();
    const isExpired = v.status === "expired" || (v.expiresAt && new Date(v.expiresAt) < now);

    this.container.innerHTML = `
      <div class="portal-container">
        <!-- Prominent Vendor Panel Identification Top Bar -->
        <div style="background: ${isAdmin ? 'linear-gradient(90deg, #1E1B4B 0%, #2E1065 100%)' : 'linear-gradient(90deg, #0F172A 0%, #1E293B 100%)'}; border: 1.5px solid ${isAdmin ? 'rgba(212, 255, 0, 0.45)' : 'rgba(0, 229, 255, 0.4)'}; border-radius: 12px; padding: 12px 18px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.35);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 1.7rem;">${isAdmin ? '👑' : '🏪'}</span>
            <div>
              <div style="font-size: 1.05rem; font-weight: 900; color: ${isAdmin ? 'var(--theme-primary, #D4FF00)' : '#00E5FF'}; letter-spacing: 0.8px; text-transform: uppercase; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span>🏪 VENDOR LOGIN PANEL</span>
                ${isAdmin ? `
                  <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; background: rgba(212,255,0,0.18); color: var(--theme-primary); border: 1px solid rgba(212,255,0,0.4); font-weight: 800;">
                    ADMIN INSPECTION MODE
                  </span>
                ` : `
                  <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; background: rgba(0,229,255,0.15); color: #00E5FF; border: 1px solid rgba(0,229,255,0.35); font-weight: 800;">
                    VENDOR ACCESS ONLY
                  </span>
                `}
              </div>
              <div style="font-size: 0.76rem; color: #CBD5E1; margin-top: 3px;">
                ${isAdmin 
                  ? `Super Admin is currently inspecting vendor dashboard for: <strong>${v.branding.businessName}</strong> (${v.branding.category}). Vendor-level edit permissions apply.`
                  : `Logged in as: <strong>${v.branding.businessName}</strong> (${v.branding.category}) • Limited to admin-granted modules`}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${isAdmin ? `
              <button type="button" class="btn-pill" id="btn-top-back-to-admin" style="background: var(--theme-primary); color: #000; font-weight: 800; font-size: 0.78rem; padding: 6px 14px; cursor: pointer; border: none; gap: 6px;" title="Return to Super Admin Dashboard">
                <span>←</span> <span>Return to Super Admin</span>
              </button>
            ` : `
              <button type="button" class="btn-pill" id="btn-top-vendor-logout" style="font-size: 0.78rem; padding: 6px 14px; cursor: pointer;" title="Sign out of vendor panel">
                Sign Out
              </button>
            `}
          </div>
        </div>

        <!-- Vendor Header Bar -->
        <div class="portal-header">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.8rem;">${v.branding.avatarEmoji || '🏪'}</span>
              <div>
                <h2 style="font-size: 1.3rem;">${v.branding.businessName}</h2>
                <div style="font-size: 0.78rem; color: var(--theme-text-muted);">
                  ${v.branding.category} • Status: ${isSuspended ? `
                    <span style="color: #EF4444; font-weight: 800; background: rgba(239,68,68,0.15); padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(239,68,68,0.3);">⏸️ SUSPENDED</span>
                  ` : (isExpired ? `
                    <span style="color: #F59E0B; font-weight: 800; background: rgba(245,158,11,0.15); padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(245,158,11,0.3);">⚠️ EXPIRED</span>
                  ` : `
                    <span style="color: #10B981; font-weight: 700; background: rgba(16,185,129,0.15); padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(16,185,129,0.3);">✓ ACTIVE</span>
                  `)}
                </div>
              </div>
            </div>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
            ${isAdmin ? `
              <button type="button" class="btn-pill" id="btn-back-to-admin" style="background: rgba(212,255,0,0.18); border-color: rgba(212,255,0,0.5); color: var(--theme-primary); font-weight: 800; gap: 6px; cursor: pointer;" title="Return directly to Super Admin Console">
                <span>←</span>
                <span>Back to Super Admin</span>
              </button>
            ` : ""}
            <button type="button" class="btn-pill" id="btn-vendor-header-share" style="background: rgba(0, 229, 255, 0.15); border-color: rgba(0, 229, 255, 0.4); color: #00E5FF; font-weight: 700; gap: 6px; cursor: pointer;" title="Share WebApp & Instagram Bio Link">
              <span>🔗</span>
              <span>Share & Bio Link</span>
            </button>
            <a href="${adminWhatsAppLink}" target="_blank" rel="noopener" class="btn-pill" style="background: rgba(37, 211, 102, 0.15); border-color: rgba(37, 211, 102, 0.4); color: #25D366; font-weight: 700; gap: 6px;" title="Chat directly with Platform Admin on WhatsApp">
              <span>💬</span>
              <span>Admin WhatsApp Support</span>
            </a>
            <a href="?v=${v.slug}" target="_blank" class="btn-pill active" title="Preview Public Card">
              <span>View Public Card</span>
              <span>↗</span>
            </a>
            <button class="btn-pill" id="btn-vendor-logout" title="Sign Out">Logout</button>
          </div>
        </div>

        ${(isSuspended || isExpired) ? `
          <!-- Suspension & Expiry Notice Alert Banner -->
          <div style="background: ${isSuspended ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)'}; border: 1.5px solid ${isSuspended ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}; border-radius: 12px; padding: 14px 16px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.6rem;">${isSuspended ? '⏸️' : '🕒'}</span>
              <div>
                <div style="font-weight: 800; color: #FFFFFF; font-size: 0.95rem;">
                  Your digital webapp is ${isSuspended ? 'SUSPENDED' : 'EXPIRED'}
                </div>
                <div style="font-size: 0.78rem; color: #CBD5E1; margin-top: 2px;">
                  Public visitors cannot access your services, shop, or booking calendar until the webapp is renewed.
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
              <a href="${adminWhatsAppLink}" target="_blank" rel="noopener" class="btn-pill" style="background: rgba(37, 211, 102, 0.2); border-color: rgba(37, 211, 102, 0.5); color: #25D366; font-weight: 800; padding: 7px 14px; text-decoration: none;">
                <span>💬 Chat Admin to Renew ↗</span>
              </a>
              <a href="?v=${v.slug}" target="_blank" class="btn-pill active" style="background: #25D366; color: #000; font-weight: 800; padding: 7px 14px; text-decoration: none; border-color: rgba(255,255,255,0.2);">
                <span>🔄 Open Renewal Popup ↗</span>
              </a>
            </div>
          </div>
        ` : ""}

        <!-- Portal Tabs Navigation (Strictly Based on Admin-Granted Modules) -->
        <div class="portal-nav-tabs">
          <button class="portal-tab-btn ${this.activeTab === 'profile' ? 'active' : ''}" data-vtab="profile">
            🎨 Profile
          </button>
          ${v.features?.leadForm !== false ? `
            <button class="portal-tab-btn ${this.activeTab === 'leadform' ? 'active' : ''}" data-vtab="leadform">
              📝 Lead Form (${v.leads?.length || 0})
            </button>
          ` : ""}
          ${v.features?.quoteBuilder !== false ? `
            <button class="portal-tab-btn ${this.activeTab === 'services' ? 'active' : ''}" data-vtab="services">
              📋 Services (${v.services?.length || 0})
            </button>
          ` : ""}
          ${v.features?.ecommerceShop !== false ? `
            <button class="portal-tab-btn ${this.activeTab === 'shop' ? 'active' : ''}" data-vtab="shop">
              🛍️ Shop (${v.products?.length || 0})
            </button>
          ` : ""}
          ${v.features?.calendarBooking !== false ? `
            <button class="portal-tab-btn ${this.activeTab === 'bookings' ? 'active' : ''}" data-vtab="bookings">
              📅 Bookings (${v.bookings?.length || 0})
            </button>
          ` : ""}
          ${v.features?.customerReviews !== false ? `
            <button class="portal-tab-btn ${this.activeTab === 'reviews' ? 'active' : ''}" data-vtab="reviews">
              ★ Reviews (${v.reviews?.length || 0})
            </button>
          ` : ""}
        </div>

        <!-- 1. Branding & Profile Pane -->
        <div class="portal-pane ${this.activeTab === 'profile' ? 'active' : ''}" id="vpane-profile">
          <form id="form-vendor-profile">

            <div class="bento-grid bento-grid-2" style="margin-bottom: 20px;">
              <div class="bento-card">
                <h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--theme-primary);">General Business Details</h3>
                <div class="form-group">
                  <label class="form-label">Business Name</label>
                  <input type="text" class="form-input" id="v-businessName" value="${v.branding.businessName}" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Owner / Representative Name</label>
                  <input type="text" class="form-input" id="v-ownerName" value="${v.branding.ownerName}" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Business Category Badge</label>
                  <input type="text" class="form-input" id="v-category" value="${v.branding.category}" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Tagline</label>
                  <input type="text" class="form-input" id="v-tagline" value="${v.branding.tagline || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Operating Hours</label>
                  <input type="text" class="form-input" id="v-openHours" value="${v.openHours || '09:00 AM - 08:00 PM'}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Consultation Fee (${currency})</label>
                  <input type="number" class="form-input" id="v-consultationFee" value="${v.about?.consultationFee || 0}" />
                </div>
              </div>

              <div class="bento-card">
                <h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--theme-secondary);">Theme & Visual Styling</h3>
                
                <div class="form-group">
                  <label class="form-label">Theme Preset</label>
                  <select class="form-select" id="v-theme">
                    ${["Sunset Dark", "Peach Cream", "Glamour Red", "Emerald Green", "Ocean Blue", "Flipkart Blue", "Custom"].map(t => `
                      <option value="${t}" ${v.branding.theme === t ? 'selected' : ''}>${t}</option>
                    `).join("")}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Avatar Emoji / Icon</label>
                  <input type="text" class="form-input" id="v-avatarEmoji" value="${v.branding.avatarEmoji || '🏪'}" style="font-size: 1.2rem;" />
                </div>

                <div class="form-group">
                  <label class="form-label">Custom Accent Colors</label>
                  <div class="color-picker-group">
                    <div>
                      <span style="font-size: 0.7rem; color: var(--theme-text-muted);">Primary</span>
                      <input type="color" class="color-swatch-input" id="v-colorPrimary" value="${v.branding.colors?.primary || '#D4FF00'}" />
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: var(--theme-text-muted);">Secondary</span>
                      <input type="color" class="color-swatch-input" id="v-colorSecondary" value="${v.branding.colors?.secondary || '#00E5FF'}" />
                    </div>
                    <div>
                      <span style="font-size: 0.7rem; color: var(--theme-text-muted);">Background</span>
                      <input type="color" class="color-swatch-input" id="v-colorBg" value="${v.branding.colors?.background || '#07090E'}" />
                    </div>
                  </div>
                </div>

                <div class="form-group" style="margin-top: 14px;">
                  <label class="form-label">Announcement Marquee Ticker</label>
                  <textarea class="form-textarea" id="v-marquee" rows="2">${v.notices?.marquee || ''}</textarea>
                </div>
              </div>
            </div>

            <!-- About Story & Narrative (Editable by Vendor) -->
            <div class="bento-card" style="margin-bottom: 20px;">
              <h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--theme-primary);">About Story & Narrative (Visible on vCard)</h3>
              <div class="form-group">
                <label class="form-label">About Tagline / Headline</label>
                <input type="text" class="form-input" id="v-aboutTagline" value="${v.about?.tagline || ''}" placeholder="e.g. Crafting unforgettable gastronomic journeys since 2012" />
              </div>
              <div class="form-group">
                <label class="form-label">About Story & Detailed Description</label>
                <textarea class="form-textarea" id="v-aboutDesc" rows="3" placeholder="Full story and description of your business shown on your vCard...">${v.about?.description || ''}</textarea>
              </div>
              <div class="form-group" style="max-width: 220px;">
                <label class="form-label">Established Year</label>
                <input type="number" class="form-input" id="v-aboutYear" value="${v.about?.establishedYear || 2020}" />
              </div>
            </div>

            <div class="bento-grid bento-grid-2" style="margin-bottom: 20px;">
              <div class="bento-card">
                <h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--theme-primary);">Contact & Location Details</h3>
                <div class="form-group">
                  <label class="form-label">Phone</label>
                  <input type="text" class="form-input" id="v-phone" value="${v.contacts.phone || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label" style="color: ${isAdmin ? '#10B981' : '#EF4444'}; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                    <span>Official WhatsApp Number</span>
                    ${isAdmin ? `
                      <span style="font-size: 0.72rem; color: #10B981; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.4); font-weight: 800;">👑 Super Admin Edit Mode</span>
                    ` : `
                      <span style="font-size: 0.72rem; color: #EF4444; background: rgba(239, 68, 68, 0.12); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.35); font-weight: 800;">🔒 Locked by Admin</span>
                    `}
                  </label>
                  ${isAdmin ? `
                    <input type="text" class="form-input" id="v-whatsapp" value="${v.contacts.whatsapp || ''}" style="color: #10B981; border-color: rgba(16, 185, 129, 0.6); background: rgba(16, 185, 129, 0.08); font-weight: 800;" placeholder="e.g. +919876543210" />
                    <div style="font-size: 0.74rem; color: #10B981; font-weight: 600; margin-top: 5px;">
                      ✓ As Super Admin, you can edit and update this Official WhatsApp order routing number.
                    </div>
                  ` : `
                    <input type="text" class="form-input" id="v-whatsapp" value="${v.contacts.whatsapp || ''}" disabled readonly style="color: #EF4444; border-color: rgba(239, 68, 68, 0.5); background: rgba(239, 68, 68, 0.06); font-weight: 800; cursor: not-allowed;" />
                    <div style="font-size: 0.74rem; color: #EF4444; font-weight: 600; margin-top: 5px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                      <span>🔒 Official WhatsApp is locked by Admin. Vendors cannot edit this number.</span>
                      <a href="${adminWhatsAppLink}" target="_blank" rel="noopener" style="color: #EF4444; text-decoration: underline; font-weight: 700;">Contact Admin to update ↗</a>
                    </div>
                  `}
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <input type="email" class="form-input" id="v-email" value="${v.contacts.email || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Physical Address</label>
                  <input type="text" class="form-input" id="v-location" value="${v.contacts.location || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Google Maps URL</label>
                  <input type="text" class="form-input" id="v-mapUrl" value="${v.contacts.mapUrl || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Website URL</label>
                  <input type="text" class="form-input" id="v-website" value="${v.contacts.website || ''}" />
                </div>
              </div>

              <div class="bento-card">
                <h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--theme-secondary);">Promo Offer Card</h3>
                <div class="form-group">
                  <label class="form-label">Offer Title</label>
                  <input type="text" class="form-input" id="v-promoTitle" value="${v.promo?.title || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Promo Badge (e.g. LIMITED DEAL)</label>
                  <input type="text" class="form-input" id="v-promoBadge" value="${v.promo?.badge || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Offer Code</label>
                  <input type="text" class="form-input" id="v-promoCode" value="${v.promo?.code || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Discount / Offer Description</label>
                  <textarea class="form-textarea" id="v-promoDiscount" rows="2">${v.promo?.discount || ''}</textarea>
                </div>
                <div class="form-group">
                  <label class="switch-label">
                    <input type="checkbox" class="switch-input" id="v-promoEnabled" ${v.promo?.enabled ? 'checked' : ''} />
                    <span class="switch-slider"></span>
                    <span>Enable Promotional Offer Banner</span>
                  </label>
                </div>
              </div>
            </div>

            <button type="submit" class="btn-submit-primary" style="max-width: 280px;">
              <span>Save Profile Changes</span>
              <span>💾</span>
            </button>
          </form>
        </div>

        <!-- 2. Services Catalog Manager Pane -->
        <div class="portal-pane ${this.activeTab === 'services' ? 'active' : ''}" id="vpane-services">
          <div class="bento-card" style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h3 style="font-size: 1.05rem;">Services Catalog</h3>
              <button class="btn-pill active" id="btn-add-service">＋ Add New Service</button>
            </div>
          </div>

          <div class="data-table-card">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Category</th>
                    <th>Quotation Scope</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="vendor-services-tbody">
                  ${(v.services || []).map(s => `
                    <tr data-srv-row="${s.id}">
                      <td>
                        <div style="font-weight: 700; color: #FFF;">${s.name}</div>
                      </td>
                      <td><span class="pill-status-pending">${s.category || 'General'}</span></td>
                      <td>
                        <span class="${s.visible !== false ? 'pill-status-active' : 'pill-status-suspended'}">
                          ${s.visible !== false ? 'Visible' : 'Hidden'}
                        </span>
                      </td>
                      <td>
                        <div style="display: flex; gap: 6px;">
                          <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: var(--theme-secondary);" data-edit-srv="${s.id}">Edit</button>
                          <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; ${s.visible !== false ? 'color: #10B981; border-color: rgba(16,185,129,0.4);' : 'color: #94A3B8; border-color: rgba(148,163,184,0.3);'}" data-toggle-srv="${s.id}" title="Toggle Service Visibility">
                            ${s.visible !== false ? '🟢 Visible' : '⚪ Hidden'}
                          </button>
                          <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: #EF4444;" data-del-srv="${s.id}">Delete</button>
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 3. Shop Products Manager Pane -->
        <div class="portal-pane ${this.activeTab === 'shop' ? 'active' : ''}" id="vpane-shop">
          <div class="bento-card" style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h3 style="font-size: 1.05rem;">E-Commerce Products</h3>
              <button class="btn-pill active" id="btn-add-product">＋ Add New Product</button>
            </div>
          </div>

          <div class="data-table-card">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price / Unit</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="vendor-products-tbody">
                  ${(v.products || []).map(p => `
                    <tr data-prod-row="${p.id}">
                      <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <span style="font-size: 1.5rem;">${p.emoji || '🛍️'}</span>
                          <div>
                            <div style="font-weight: 700; color: #FFF;">${p.name}</div>
                            <div style="font-size: 0.72rem; color: var(--theme-secondary);">${p.category || 'General'}</div>
                          </div>
                        </div>
                      </td>
                      <td style="font-weight: 800; color: var(--theme-primary);">
                        ${currency}${p.price} <span style="font-size: 0.72rem; color: var(--theme-text-muted); font-weight: 500;">/${p.unit || 'unit'}</span>
                      </td>
                      <td>
                        <span class="${p.visible !== false ? 'pill-status-active' : 'pill-status-suspended'}">
                          ${p.visible !== false ? 'In Stock' : 'Hidden'}
                        </span>
                      </td>
                      <td>
                        <div style="display: flex; gap: 6px;">
                          <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: var(--theme-secondary);" data-edit-prod="${p.id}">Edit</button>
                          <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; ${p.visible !== false ? 'color: #10B981; border-color: rgba(16,185,129,0.4);' : 'color: #94A3B8; border-color: rgba(148,163,184,0.3);'}" data-toggle-prod="${p.id}" title="Toggle Product Visibility">
                            ${p.visible !== false ? '🟢 Active' : '⚪ Hidden'}
                          </button>
                          <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: #EF4444;" data-del-prod="${p.id}">Delete</button>
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 4. Bookings Manager Pane -->
        <div class="portal-pane ${this.activeTab === 'bookings' ? 'active' : ''}" id="vpane-bookings">
          <div class="bento-card" style="margin-bottom: 16px;">
            <h3 style="font-size: 1.05rem;">Client Appointments & Bookings</h3>
          </div>

          <div class="data-table-card">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Client Details</th>
                    <th>Service Requested</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${(v.bookings || []).length === 0 ? `
                    <tr><td colspan="5" style="text-align: center; color: var(--theme-text-muted);">No booking appointments received yet.</td></tr>
                  ` : (v.bookings || []).map(b => `
                    <tr>
                      <td>
                        <div style="font-weight: 700; color: #FFF;">${b.date}</div>
                        <div style="font-size: 0.72rem; color: var(--theme-primary);">⏰ ${b.timeSlot}</div>
                      </td>
                      <td>
                        <div style="font-weight: 700;">${b.clientName}</div>
                        <div style="font-size: 0.75rem; color: var(--theme-text-muted);">📞 ${b.clientPhone}</div>
                        ${b.notes ? `<div style="font-size: 0.72rem; color: var(--theme-secondary);">Note: ${b.notes}</div>` : ''}
                      </td>
                      <td>${b.service}</td>
                      <td>
                        <select class="topbar-select" style="padding: 3px 6px; font-size: 0.75rem;" data-booking-status-id="${b.id}">
                          ${["Pending", "Confirmed", "Completed", "Cancelled"].map(st => `
                            <option value="${st}" ${b.status === st ? 'selected' : ''}>${st}</option>
                          `).join("")}
                        </select>
                      </td>
                      <td>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                          <button class="btn-pill active" style="padding: 4px 8px; font-size: 0.72rem;" data-bkg-reply-phone="${b.clientPhone}" data-bkg-client-name="${b.clientName}" title="Reply on WhatsApp">
                            <span>💬 WhatsApp</span>
                          </button>
                          <button class="btn-pill" style="padding: 4px 8px; font-size: 0.72rem; color: var(--theme-secondary);" data-edit-bkg="${b.id}">Edit</button>
                          <button class="btn-pill" style="padding: 4px 8px; font-size: 0.72rem; color: #EF4444;" data-del-bkg="${b.id}">Delete</button>
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 5. Reviews Manager Pane -->
        <div class="portal-pane ${this.activeTab === 'reviews' ? 'active' : ''}" id="vpane-reviews">
          <div class="bento-grid bento-grid-2" style="margin-bottom: 16px;">
            <div class="bento-card">
              <h3 style="font-size: 1rem; margin-bottom: 10px;">Quick-Select Feedback Tags</h3>
              <p style="font-size: 0.75rem; color: var(--theme-text-muted); margin-bottom: 10px;">
                These chips are offered to clients when submitting a review.
              </p>
              <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;" id="vendor-review-tags-list">
                ${(v.reviewTags || []).map(tag => `
                  <span class="btn-pill" style="font-size: 0.75rem;">
                    ${tag}
                    <span style="cursor: pointer; margin-left: 4px; color: #EF4444;" data-remove-tag="${tag}">×</span>
                  </span>
                `).join("")}
              </div>
              <div style="display: flex; gap: 6px;">
                <input type="text" class="form-input" id="input-new-review-tag" placeholder="e.g. Super Fast Delivery" />
                <button class="btn-pill active" id="btn-add-review-tag">Add</button>
              </div>
            </div>

            <div class="bento-card">
              <h3 style="font-size: 1rem; margin-bottom: 10px;">Review Moderation</h3>
              <div style="max-height: 280px; overflow-y: auto;">
                ${(v.reviews || []).map(r => `
                  <div style="padding: 10px 0; border-bottom: 1px solid var(--theme-border);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                      <div>
                        <span style="font-weight: 700; color: #FFF;">${r.author}</span>
                        <span style="font-size: 0.72rem; color: var(--theme-text-muted); margin-left: 6px;">${r.date}</span>
                      </div>
                      <span style="color: #F59E0B;">${"★".repeat(r.rating || 5)}</span>
                    </div>
                    ${r.content ? `<div style="font-size: 0.8rem; color: #E2E8F0; margin-bottom: 8px; line-height: 1.4;">${r.content}</div>` : ""}
                    <div style="display: flex; gap: 6px;">
                      <button class="btn-pill" style="padding: 3px 8px; font-size: 0.7rem; color: var(--theme-secondary);" data-edit-rev="${r.id}">Edit</button>
                      <button class="btn-pill" style="padding: 3px 8px; font-size: 0.7rem; color: #EF4444;" data-del-rev="${r.id}">Delete</button>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>

        <!-- 6. Lead Form Builder & Captured Leads Pane -->
        <div class="portal-pane ${this.activeTab === 'leadform' ? 'active' : ''}" id="vpane-leadform">
          <div class="bento-grid bento-grid-2" style="margin-bottom: 20px;">
            <!-- Form Branding & Settings -->
            <div class="bento-card">
              <h3 style="font-size: 1.05rem; margin-bottom: 12px; color: var(--theme-primary); display: flex; align-items: center; justify-content: space-between;">
                <span>⚙️ Form Settings & Buttons</span>
                <span class="pill-status-active" style="font-size: 0.65rem;">POPUP CONFIG</span>
              </h3>
              <form id="form-vendor-leadform-settings">
                <div class="form-group" style="margin-bottom: 12px;">
                  <label class="form-label">Popup Form Title</label>
                  <input type="text" class="form-input" id="vlead-title" value="${v.leadForm?.title || 'Request a Call Back'}" required />
                </div>
                <div class="form-group" style="margin-bottom: 12px;">
                  <label class="form-label">Popup Subtitle / Instruction</label>
                  <input type="text" class="form-input" id="vlead-subtitle" value="${v.leadForm?.subtitle || ''}" placeholder="e.g. Fill this form and our team will get back to you immediately." />
                </div>
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px; margin-bottom: 12px;">
                  <div class="form-group">
                    <label class="form-label">Home Page Button Name (Custom)</label>
                    <input type="text" class="form-input" id="vlead-btn-text" value="${v.leadForm?.buttonText || 'Request Call Back'}" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Button Icon</label>
                    <input type="text" class="form-input" id="vlead-btn-icon" value="${v.leadForm?.buttonIcon || '⚡'}" style="text-align: center;" />
                  </div>
                </div>
                <div class="form-group" style="margin-bottom: 12px;">
                  <label class="form-label">Submit Button Text (Inside Popup)</label>
                  <input type="text" class="form-input" id="vlead-submit-btn-text" value="${v.leadForm?.submitButtonText || 'Request Call Back ⚡'}" required />
                </div>
                <div class="form-group" style="margin-bottom: 14px;">
                  <label class="form-label">Target WhatsApp Number (Optional override)</label>
                  <input type="text" class="form-input" id="vlead-whatsapp" value="${v.leadForm?.whatsappNumber || ''}" placeholder="Defaults to ${v.contacts.whatsapp || v.contacts.phone}" />
                  <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-top: 4px;">Leads will be routed directly to this WhatsApp number.</div>
                </div>
                <div class="form-group" style="margin-bottom: 16px;">
                  <label class="switch-label">
                    <input type="checkbox" class="switch-input" id="vlead-enabled" ${v.leadForm?.enabled !== false ? 'checked' : ''} />
                    <span class="switch-slider"></span>
                    <span><strong>Enable Lead Form Button on Home Page</strong></span>
                  </label>
                </div>
                <button type="submit" class="btn-submit-primary" style="padding: 11px;">
                  <span>Save Form Settings</span>
                  <span>💾</span>
                </button>
              </form>
            </div>

            <!-- Form Fields Manager -->
            <div class="bento-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                <div>
                  <h3 style="font-size: 1.05rem; color: var(--theme-primary); margin-bottom: 2px;">📋 Custom Form Fields</h3>
                  <div style="font-size: 0.74rem; color: var(--theme-text-muted);">Configure questions for customers in the popup</div>
                </div>
                <button type="button" class="btn-pill active" id="btn-add-lead-field" style="padding: 6px 12px; font-size: 0.76rem;">
                  <span>➕ Add Field</span>
                </button>
              </div>

              <div id="vendor-lead-fields-list">
                ${(v.leadForm?.fields || []).map((f, idx) => `
                  <div class="lead-builder-field-card" data-fld-id="${f.id}">
                    <div class="lead-builder-field-info">
                      <div class="lead-builder-field-title">
                        <span>${f.label}</span>
                        ${f.required ? '<span class="pill-status-active" style="font-size: 0.6rem; padding: 1px 5px; background: rgba(239,68,68,0.2); color: #EF4444; border-color: rgba(239,68,68,0.4);">REQUIRED</span>' : ''}
                      </div>
                      <div class="lead-builder-field-sub">
                        Type: <b style="color: var(--theme-primary);">${f.type.toUpperCase()}</b>
                        ${f.options && f.options.length ? ` • ${f.options.length} options: ${f.options.slice(0, 3).join(', ')}${f.options.length > 3 ? '...' : ''}` : ''}
                      </div>
                    </div>
                    <div class="lead-builder-actions">
                      <button type="button" class="btn-pill" data-move-fld="up" data-fld-idx="${idx}" title="Move Up" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>↑</button>
                      <button type="button" class="btn-pill" data-move-fld="down" data-fld-idx="${idx}" title="Move Down" ${idx === (v.leadForm?.fields || []).length - 1 ? 'disabled style="opacity:0.3;"' : ''}>↓</button>
                      <button type="button" class="btn-pill" data-edit-fld="${f.id}" title="Edit Field">✏️</button>
                      <button type="button" class="btn-pill" style="color: #EF4444; border-color: rgba(239,68,68,0.3);" data-del-fld="${f.id}" title="Delete Field">🗑️</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Captured Leads List / Inbox -->
          <div class="bento-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
              <div>
                <h3 style="font-size: 1.1rem; color: #FFFFFF; margin-bottom: 2px;">📥 Captured WhatsApp Leads (${v.leads?.length || 0})</h3>
                <div style="font-size: 0.74rem; color: var(--theme-text-muted);">Customer inquiries and callback requests submitted via vCard popup</div>
              </div>
            </div>

            <div id="vendor-leads-container">
              ${(!v.leads || v.leads.length === 0) ? `
                <div style="padding: 24px; text-align: center; color: var(--theme-text-muted); font-size: 0.85rem;">
                  No leads received yet. When customers click "${v.leadForm?.buttonText || 'Request Call Back'}" and submit the popup form, their inquiries will appear here and route to WhatsApp!
                </div>
              ` : `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px;">
                  ${v.leads.map(lead => {
                    const cleanPhone = (lead.customerPhone || '').replace(/[^0-9]/g, '');
                    const replyWaUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${lead.customerName || 'there'}, thank you for contacting ${v.branding.businessName}!`)}` : '#';
                    return `
                      <div class="lead-record-card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                          <div>
                            <div style="font-size: 0.95rem; font-weight: 800; color: #FFFFFF;">${lead.customerName || 'Inquiry'}</div>
                            <div style="font-size: 0.75rem; color: var(--theme-primary); font-weight: 600;">
                              ${lead.customerPhone ? `<a href="tel:${lead.customerPhone}" style="color: var(--theme-primary); text-decoration: none;">📞 ${lead.customerPhone}</a>` : 'No Phone'}
                            </div>
                          </div>
                          <div style="display: flex; gap: 6px; align-items: center;">
                            <span class="pill-status-active" style="font-size: 0.65rem; background: ${lead.status === 'Converted' ? 'rgba(16,185,129,0.2)' : (lead.status === 'Contacted' ? 'rgba(0,229,255,0.2)' : 'rgba(255,165,0,0.2)')}; color: ${lead.status === 'Converted' ? '#10B981' : (lead.status === 'Contacted' ? '#00E5FF' : '#FFA500')};">
                              ${lead.status || 'New'}
                            </span>
                            <button type="button" class="btn-pill" style="padding: 2px 6px; font-size: 0.7rem; color: #EF4444;" data-del-lead="${lead.id}" title="Delete Lead">×</button>
                          </div>
                        </div>

                        <div style="font-size: 0.76rem; color: #CBD5E1; margin: 8px 0; background: rgba(0,0,0,0.25); border-radius: 8px; padding: 8px 10px; line-height: 1.5;">
                          ${(lead.fields || []).map(f => `
                            <div><strong style="color: #94A3B8;">${f.label}:</strong> <span style="color: #FFFFFF;">${Array.isArray(f.value) ? f.value.join(', ') : (f.value || 'N/A')}</span></div>
                          `).join('')}
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06);">
                          <span style="font-size: 0.68rem; color: var(--theme-text-muted);">
                            ${new Date(lead.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div style="display: flex; gap: 6px;">
                            <button type="button" class="btn-pill" data-toggle-lead-status="${lead.id}" style="font-size: 0.7rem; padding: 4px 8px;">
                              Status: ${lead.status === 'Converted' ? 'Mark New' : (lead.status === 'Contacted' ? 'Convert' : 'Contacted')}
                            </button>
                            ${cleanPhone ? `
                              <a href="${replyWaUrl}" target="_blank" rel="noopener" class="btn-pill active" style="font-size: 0.7rem; padding: 4px 10px; background: #25D366; color: #000; font-weight: 700; text-decoration: none;">
                                <span>💬 WhatsApp</span>
                              </a>
                            ` : ''}
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>
          </div>
        </div>
      </div>

      <!-- Modal: Add Service -->
      <div class="modal-overlay" id="modal-add-service">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Add New Service</h3>
            <button class="btn-modal-close" data-close-modal="modal-add-service">×</button>
          </div>
          <form id="form-new-service">
            <div class="form-group">
              <label class="form-label">Service Name</label>
              <input type="text" class="form-input" id="new-srv-name" placeholder="e.g. Wedding Reception Full Catering" required />
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <input type="text" class="form-input" id="new-srv-category" placeholder="e.g. Hair Therapy / Buffet / Consultation" required />
            </div>
            <button type="submit" class="btn-submit-primary">Create Service</button>
          </form>
        </div>
      </div>

      <!-- Modal: Edit Existing Service -->
      <div class="modal-overlay" id="modal-edit-service">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Edit Service</h3>
            <button class="btn-modal-close" data-close-modal="modal-edit-service">×</button>
          </div>
          <form id="form-edit-service">
            <input type="hidden" id="edit-srv-id" />
            <div class="form-group">
              <label class="form-label">Service Name</label>
              <input type="text" class="form-input" id="edit-srv-name" required />
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <input type="text" class="form-input" id="edit-srv-category" placeholder="e.g. Hair Therapy / Buffet / Consultation" required />
            </div>
            <div class="form-group">
              <label class="switch-label">
                <input type="checkbox" class="switch-input" id="edit-srv-visible" checked />
                <span class="switch-slider"></span>
                <span>Visible in vCard</span>
              </label>
            </div>
            <button type="submit" class="btn-submit-primary">Save Changes</button>
          </form>
        </div>
      </div>

      <!-- Modal: Add Product -->
      <div class="modal-overlay" id="modal-add-product">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Add New Product</h3>
            <button class="btn-modal-close" data-close-modal="modal-add-product">×</button>
          </div>
          <form id="form-new-product">
            <div class="form-group">
              <label class="form-label">Product Name</label>
              <input type="text" class="form-input" id="new-prod-name" required />
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <input type="text" class="form-input" id="new-prod-category" placeholder="e.g. Starters, Spices, Desserts" required />
            </div>
            <div class="form-group">
              <label class="form-label">Emoji / Icon</label>
              <input type="text" class="form-input" id="new-prod-emoji" value="🛍️" required />
            </div>
            <div class="form-group">
              <label class="form-label">Unit Type</label>
              <input type="text" class="form-input" id="new-prod-unit" placeholder="e.g. pack, bottle, box, kg" required />
            </div>
            <div class="form-group">
              <label class="form-label">Price (${currency})</label>
              <input type="number" class="form-input" id="new-prod-price" required />
            </div>
            <button type="submit" class="btn-submit-primary">Add Product</button>
          </form>
        </div>
      </div>

      <!-- Modal: Edit Existing Product -->
      <div class="modal-overlay" id="modal-edit-product">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Edit Product</h3>
            <button class="btn-modal-close" data-close-modal="modal-edit-product">×</button>
          </div>
          <form id="form-edit-product">
            <input type="hidden" id="edit-prod-id" />
            <div class="form-group">
              <label class="form-label">Product Name</label>
              <input type="text" class="form-input" id="edit-prod-name" required />
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <input type="text" class="form-input" id="edit-prod-category" placeholder="e.g. Starters, Spices, Desserts" required />
            </div>
            <div class="bento-grid bento-grid-2">
              <div class="form-group">
                <label class="form-label">Emoji / Icon</label>
                <input type="text" class="form-input" id="edit-prod-emoji" value="🛍️" required />
              </div>
              <div class="form-group">
                <label class="form-label">Unit Type</label>
                <input type="text" class="form-input" id="edit-prod-unit" placeholder="e.g. pack, bottle, box, kg" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Price (${currency})</label>
              <input type="number" class="form-input" id="edit-prod-price" required />
            </div>
            <div class="form-group">
              <label class="switch-label">
                <input type="checkbox" class="switch-input" id="edit-prod-visible" checked />
                <span class="switch-slider"></span>
                <span>In Stock & Visible on Card</span>
              </label>
            </div>
            <button type="submit" class="btn-submit-primary">Save Product Changes</button>
          </form>
        </div>
      </div>

      <!-- Modal: Edit Booking Appointment -->
      <div class="modal-overlay" id="modal-vendor-booking">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Edit Booking Details</h3>
            <button class="btn-modal-close" data-close-modal="modal-vendor-booking">×</button>
          </div>
          <form id="form-vendor-edit-booking">
            <input type="hidden" id="edit-bkg-id" />
            <div class="bento-grid bento-grid-2">
              <div class="form-group">
                <label class="form-label">Client Name</label>
                <input type="text" class="form-input" id="edit-bkg-name" required />
              </div>
              <div class="form-group">
                <label class="form-label">Client Phone</label>
                <input type="text" class="form-input" id="edit-bkg-phone" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Service Requested</label>
              <input type="text" class="form-input" id="edit-bkg-service" required />
            </div>
            <div class="bento-grid bento-grid-2">
              <div class="form-group">
                <label class="form-label">Booking Date</label>
                <input type="date" class="form-input" id="edit-bkg-date" required />
              </div>
              <div class="form-group">
                <label class="form-label">Time Slot</label>
                <input type="text" class="form-input" id="edit-bkg-time" placeholder="e.g. 10:00 AM - 11:30 AM" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Booking Status</label>
              <select class="form-select" id="edit-bkg-status">
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Client Notes / Requirements</label>
              <textarea class="form-textarea" id="edit-bkg-notes" rows="2"></textarea>
            </div>
            <button type="submit" class="btn-submit-primary">Save Booking Changes</button>
          </form>
        </div>
      </div>

      <!-- Modal: Edit Customer Review -->
      <div class="modal-overlay" id="modal-vendor-review">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Edit Customer Review</h3>
            <button class="btn-modal-close" data-close-modal="modal-vendor-review">×</button>
          </div>
          <form id="form-vendor-edit-review">
            <input type="hidden" id="edit-rev-id" />
            <div class="bento-grid bento-grid-2">
              <div class="form-group">
                <label class="form-label">Reviewer Author Name</label>
                <input type="text" class="form-input" id="edit-rev-author" required />
              </div>
              <div class="form-group">
                <label class="form-label">Star Rating (1 - 5)</label>
                <select class="form-select" id="edit-rev-rating">
                  <option value="5">★★★★★ (5 Stars)</option>
                  <option value="4">★★★★☆ (4 Stars)</option>
                  <option value="3">★★★☆☆ (3 Stars)</option>
                  <option value="2">★★☆☆☆ (2 Stars)</option>
                  <option value="1">★☆☆☆☆ (1 Star)</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Review Date</label>
              <input type="text" class="form-input" id="edit-rev-date" />
            </div>
            <div class="form-group">
              <label class="form-label">Review Content <span style="font-size: 0.75rem; color: var(--theme-text-muted); font-weight: normal;">(Optional)</span></label>
              <textarea class="form-textarea" id="edit-rev-content" rows="3" placeholder="Review content (optional)"></textarea>
            </div>
            <button type="submit" class="btn-submit-primary">Save Review Changes</button>
          </form>
        </div>
      </div>

      <!-- Modal: Add Lead Form Field -->
      <div class="modal-overlay" id="modal-vendor-add-lead-field">
        <div class="modal-card" style="max-width: 440px;">
          <div class="modal-header">
            <h3 class="modal-title">Add Custom Form Field</h3>
            <button class="btn-modal-close" data-close-modal="modal-vendor-add-lead-field">×</button>
          </div>
          <form id="form-vendor-new-lead-field">
            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label">Field Label / Question</label>
              <input type="text" class="form-input" id="new-fld-label" placeholder="e.g. Service Interested In, Event Date, Guest Count" required />
            </div>
            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label">Field Input Type</label>
              <select class="form-select" id="new-fld-type">
                <option value="text">Free Text (Single line)</option>
                <option value="phone">Phone / WhatsApp Number</option>
                <option value="email">Email Address</option>
                <option value="number">Number (Quantity / Budget)</option>
                <option value="textarea">Textarea (Multi-line message)</option>
                <option value="select">Dropdown (Single Selection)</option>
                <option value="date">Calendar (Date Selection)</option>
                <option value="multiselect">Select Multiple Options (Checkboxes)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label">Placeholder / Hint Text</label>
              <input type="text" class="form-input" id="new-fld-placeholder" placeholder="e.g. Choose an option, Enter details..." />
            </div>
            <div class="form-group" id="new-fld-options-group" style="display: none; margin-bottom: 12px;">
              <label class="form-label">Options (Comma separated)</label>
              <textarea class="form-textarea" id="new-fld-options" rows="3" placeholder="Option 1, Option 2, Option 3, Option 4"></textarea>
              <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-top: 4px;">Separate choices by commas. These will display in dropdown or as selectable chips.</div>
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
              <label class="switch-label">
                <input type="checkbox" class="switch-input" id="new-fld-required" checked />
                <span class="switch-slider"></span>
                <span>Required Field (Must be filled by customer)</span>
              </label>
            </div>
            <button type="submit" class="btn-submit-primary">Add Field to Popup Form</button>
          </form>
        </div>
      </div>

      <!-- Modal: Edit Lead Form Field -->
      <div class="modal-overlay" id="modal-vendor-edit-lead-field">
        <div class="modal-card" style="max-width: 440px;">
          <div class="modal-header">
            <h3 class="modal-title">Edit Form Field</h3>
            <button class="btn-modal-close" data-close-modal="modal-vendor-edit-lead-field">×</button>
          </div>
          <form id="form-vendor-edit-lead-field">
            <input type="hidden" id="edit-fld-id" />
            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label">Field Label / Question</label>
              <input type="text" class="form-input" id="edit-fld-label" required />
            </div>
            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label">Field Input Type</label>
              <select class="form-select" id="edit-fld-type">
                <option value="text">Free Text (Single line)</option>
                <option value="phone">Phone / WhatsApp Number</option>
                <option value="email">Email Address</option>
                <option value="number">Number (Quantity / Budget)</option>
                <option value="textarea">Textarea (Multi-line message)</option>
                <option value="select">Dropdown (Single Selection)</option>
                <option value="date">Calendar (Date Selection)</option>
                <option value="multiselect">Select Multiple Options (Checkboxes)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label">Placeholder / Hint Text</label>
              <input type="text" class="form-input" id="edit-fld-placeholder" />
            </div>
            <div class="form-group" id="edit-fld-options-group" style="display: none; margin-bottom: 12px;">
              <label class="form-label">Options (Comma separated)</label>
              <textarea class="form-textarea" id="edit-fld-options" rows="3"></textarea>
              <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-top: 4px;">Separate choices by commas.</div>
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
              <label class="switch-label">
                <input type="checkbox" class="switch-input" id="edit-fld-required" />
                <span class="switch-slider"></span>
                <span>Required Field</span>
              </label>
            </div>
            <button type="submit" class="btn-submit-primary">Save Field Changes</button>
          </form>
        </div>
      </div>

      <!-- Modal: Vendor Share & Bio Link Generator -->
      <div class="modal-overlay" id="modal-vendor-share">
        <div class="modal-card" style="max-width: 440px; text-align: center;">
          <div class="modal-header">
            <h3 class="modal-title" style="display: flex; align-items: center; gap: 8px;">
              <span>🔗</span> <span>Share WebApp & Bio Link</span>
            </h3>
            <button class="btn-modal-close" data-close-modal="modal-vendor-share">×</button>
          </div>

          <!-- Dynamic QR Code Card -->
          <div style="background: #FFFFFF; border-radius: 12px; padding: 14px; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.25);">
            <img id="vendor-share-qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + window.location.pathname + '?v=' + (v.slug || v.id))}" alt="Scan QR Code" style="width: 170px; height: 170px; display: block; border-radius: 6px;" />
            <div style="font-size: 0.68rem; color: #0F172A; font-weight: 700; margin-top: 6px; letter-spacing: 0.5px; text-transform: uppercase;">
              📷 Scan to Open WebApp
            </div>
          </div>

          <!-- 1-Click Copy WebApp Link -->
          <div class="form-group" style="text-align: left; margin-bottom: 12px;">
            <label class="form-label" style="font-size: 0.72rem;">Clean WebApp Link</label>
            <div style="display: flex; gap: 6px;">
              <input type="text" class="form-input" id="input-vendor-share-url" value="${window.location.origin}${window.location.pathname}?v=${v.slug || v.id}" readonly style="font-size: 0.78rem; font-family: monospace; color: var(--theme-primary); background: rgba(0,0,0,0.4); padding: 8px 10px;" />
              <button type="button" class="btn-pill active" id="btn-copy-vendor-share-url" style="padding: 6px 14px; font-weight: 700; font-size: 0.78rem; white-space: nowrap;">
                📋 Copy
              </button>
            </div>
          </div>

          <!-- 1-Click Copy for Instagram Bio -->
          <div class="form-group" style="text-align: left; margin-bottom: 14px;">
            <label class="form-label" style="font-size: 0.72rem;">📸 Instagram & Social Media Bio Snippet</label>
            <textarea class="form-textarea" id="text-vendor-share-bio" rows="2" readonly style="font-size: 0.76rem; background: rgba(0,0,0,0.4); padding: 8px 10px;">🔗 Visit our Smart Business Web App: ${window.location.origin}${window.location.pathname}?v=${v.slug || v.id} | Contact, Book & Shop Online ✨</textarea>
            <button type="button" class="btn-pill" id="btn-copy-vendor-share-bio" style="width: 100%; justify-content: center; font-size: 0.76rem; margin-top: 5px; color: #00E5FF; border-color: rgba(0,229,255,0.4); font-weight: 700;">
              📸 Copy for Instagram Bio
            </button>
          </div>

          <!-- Quick Action Buttons Row -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button type="button" class="btn-pill" id="btn-vendor-share-whatsapp" style="width: 100%; justify-content: center; background: rgba(37, 211, 102, 0.15); border-color: rgba(37, 211, 102, 0.4); color: #25D366; font-weight: 700; padding: 9px; font-size: 0.82rem; gap: 6px;">
              <span>💬 Share to WhatsApp Contacts / Status</span>
            </button>
            <a href="?v=${v.slug || v.id}" target="_blank" class="btn-pill active" style="width: 100%; justify-content: center; padding: 9px; font-size: 0.82rem; gap: 6px; font-weight: 700; text-decoration: none;">
              <span>👁️ View Live WebApp Card ↗</span>
            </a>
          </div>
        </div>
      </div>
    `;

    this.bindDashboardEvents();
  }

  bindDashboardEvents() {
    if (this.currentVendor?.id) {
      this.currentVendor = db.getVendor(this.currentVendor.id) || this.currentVendor;
    }
    const v = this.currentVendor;
    const isAdmin = !!(window.OmniApp?.isAdminManaging === true);

    // Share & Bio-Link Modal Opener
    const vendorShareBtn = this.container.querySelector("#btn-vendor-header-share");
    const vendorShareModal = this.container.querySelector("#modal-vendor-share");
    if (vendorShareBtn && vendorShareModal) {
      vendorShareBtn.addEventListener("click", () => {
        vendorShareModal.classList.add("active");
      });
    }

    // 1-Click Copy Clean WebApp Link
    const copyUrlBtn = this.container.querySelector("#btn-copy-vendor-share-url");
    if (copyUrlBtn) {
      copyUrlBtn.addEventListener("click", () => {
        const urlInput = this.container.querySelector("#input-vendor-share-url");
        if (urlInput) {
          navigator.clipboard.writeText(urlInput.value).then(() => {
            window.OmniApp.showToast("vCard WebApp link copied! Ready to share or use in Instagram Bio. 📋");
          }).catch(() => {
            urlInput.select();
            document.execCommand("copy");
            window.OmniApp.showToast("Link copied!");
          });
        }
      });
    }

    // 1-Click Copy Instagram Bio Snippet
    const copyBioBtn = this.container.querySelector("#btn-copy-vendor-share-bio");
    if (copyBioBtn) {
      copyBioBtn.addEventListener("click", () => {
        const bioText = this.container.querySelector("#text-vendor-share-bio");
        if (bioText) {
          navigator.clipboard.writeText(bioText.value).then(() => {
            window.OmniApp.showToast("Instagram Bio text copied! Ready to paste into profile. 📸");
          }).catch(() => {
            bioText.select();
            document.execCommand("copy");
            window.OmniApp.showToast("Bio text copied!");
          });
        }
      });
    }

    // 1-Click WhatsApp Share to Contacts / Status
    const waShareBtn = this.container.querySelector("#btn-vendor-share-whatsapp");
    if (waShareBtn) {
      waShareBtn.addEventListener("click", () => {
        const cleanUrl = `${window.location.origin}${window.location.pathname}?v=${v.slug || v.id}`;
        const msg = `✨ Check out *${v.branding.businessName}* on our official Smart Business Web App!\n\n` +
          `📱 *Browse Catalog, Quotes & Appointments:* ${cleanUrl}\n\n` +
          `Save to your phone home screen with 1 tap! 🚀`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
      });
    }

    // Logout
    const logoutBtn = this.container.querySelector("#btn-vendor-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (window.OmniApp) window.OmniApp.isAdminManaging = false;
        this.currentVendor = null;
        this.renderLoginForm();
      });
    }

    const topLogoutBtn = this.container.querySelector("#btn-top-vendor-logout");
    if (topLogoutBtn) {
      topLogoutBtn.addEventListener("click", () => {
        if (window.OmniApp) window.OmniApp.isAdminManaging = false;
        this.currentVendor = null;
        this.renderLoginForm();
      });
    }

    // Back to Super Admin Console
    const backBtn = this.container.querySelector("#btn-back-to-admin");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (window.OmniApp) window.OmniApp.isAdminManaging = false;
        window.OmniApp.setView("admin");
      });
    }

    const topBackBtn = this.container.querySelector("#btn-top-back-to-admin");
    if (topBackBtn) {
      topBackBtn.addEventListener("click", () => {
        if (window.OmniApp) window.OmniApp.isAdminManaging = false;
        window.OmniApp.setView("admin");
      });
    }

    // Tab switching (Strictly enforces granted module access)
    this.container.querySelectorAll(".portal-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-vtab");
        const isTabAvailable = (t) => {
          if (t === "profile") return true;
          if (t === "services") return v.features?.quoteBuilder !== false;
          if (t === "shop") return v.features?.ecommerceShop !== false;
          if (t === "bookings") return v.features?.calendarBooking !== false;
          if (t === "reviews") return v.features?.customerReviews !== false;
          if (t === "leadform") return v.features?.leadForm !== false;
          return false;
        };
        if (!isTabAvailable(tab)) return;
        this.activeTab = tab;
        this.renderDashboard();
      });
    });

    // Profile Save (Updates vendor branding & details only - WhatsApp & Admin Master Controls remain locked)
    const profileForm = this.container.querySelector("#form-vendor-profile");
    if (profileForm) {
      profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        v.branding.businessName = this.container.querySelector("#v-businessName").value.trim();
        v.branding.ownerName = this.container.querySelector("#v-ownerName").value.trim();
        v.branding.category = this.container.querySelector("#v-category").value.trim();
        v.branding.tagline = this.container.querySelector("#v-tagline").value.trim();
        v.openHours = this.container.querySelector("#v-openHours").value.trim();
        if (!v.about) v.about = {};
        v.about.consultationFee = Number(this.container.querySelector("#v-consultationFee").value || 0);
        v.about.tagline = this.container.querySelector("#v-aboutTagline")?.value.trim() || "";
        v.about.description = this.container.querySelector("#v-aboutDesc")?.value.trim() || "";
        v.about.establishedYear = Number(this.container.querySelector("#v-aboutYear")?.value || 2020);

        v.branding.theme = this.container.querySelector("#v-theme").value;
        v.branding.avatarEmoji = this.container.querySelector("#v-avatarEmoji").value.trim();
        v.branding.colors = {
          primary: this.container.querySelector("#v-colorPrimary").value,
          secondary: this.container.querySelector("#v-colorSecondary").value,
          background: this.container.querySelector("#v-colorBg").value
        };

        if (!v.notices) v.notices = {};
        v.notices.marquee = this.container.querySelector("#v-marquee").value.trim();

        v.contacts.phone = this.container.querySelector("#v-phone").value.trim();
        if (isAdmin) {
          const waInput = this.container.querySelector("#v-whatsapp");
          if (waInput) {
            v.contacts.whatsapp = waInput.value.trim();
          }
        }
        v.contacts.email = this.container.querySelector("#v-email").value.trim();
        v.contacts.location = this.container.querySelector("#v-location").value.trim();
        v.contacts.mapUrl = this.container.querySelector("#v-mapUrl").value.trim();
        v.contacts.website = this.container.querySelector("#v-website").value.trim();

        if (!v.promo) v.promo = {};
        v.promo.title = this.container.querySelector("#v-promoTitle").value.trim();
        v.promo.badge = this.container.querySelector("#v-promoBadge").value.trim();
        v.promo.code = this.container.querySelector("#v-promoCode").value.trim();
        v.promo.discount = this.container.querySelector("#v-promoDiscount").value.trim();
        v.promo.enabled = this.container.querySelector("#v-promoEnabled").checked;

        await db.saveVendor(v);
        if (isAdmin) await db.recordAdminChange(`Admin updated profile for '${v.branding.businessName}'`);
        window.OmniApp.showToast("Profile & branding updated successfully!");
        this.renderDashboard();
      });
    }

    // Modal triggers & handlers
    this.container.querySelectorAll("[data-close-modal]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-close-modal");
        this.container.querySelector(`#${id}`)?.classList.remove("active");
      });
    });

    // Add Service Modal
    const addSrvBtn = this.container.querySelector("#btn-add-service");
    if (addSrvBtn) {
      addSrvBtn.addEventListener("click", () => {
        this.container.querySelector("#modal-add-service")?.classList.add("active");
      });
    }

    const formNewSrv = this.container.querySelector("#form-new-service");
    if (formNewSrv) {
      formNewSrv.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newSrv = {
          name: this.container.querySelector("#new-srv-name").value.trim(),
          category: this.container.querySelector("#new-srv-category").value.trim(),
          description: "",
          visible: true
        };
        await db.addService(v.id, newSrv);
        if (isAdmin) await db.recordAdminChange(`Admin added service '${newSrv.name}' to '${v.branding.businessName}'`);
        this.currentVendor = db.getVendor(v.id) || this.currentVendor;
        this.container.querySelector("#modal-add-service")?.classList.remove("active");
        window.OmniApp.showToast("New service added!");
        this.renderDashboard();
      });
    }

    // Edit Service Modal Trigger & Populate
    this.container.querySelectorAll("[data-edit-srv]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit-srv");
        const s = v.services?.find(x => String(x.id) === String(id));
        if (!s) return;
        const modal = this.container.querySelector("#modal-edit-service");
        if (modal) {
          modal.querySelector("#edit-srv-id").value = s.id;
          modal.querySelector("#edit-srv-name").value = s.name;
          modal.querySelector("#edit-srv-category").value = s.category || "General";
          modal.querySelector("#edit-srv-visible").checked = s.visible !== false;
          modal.classList.add("active");
        }
      });
    });

    const formEditSrv = this.container.querySelector("#form-edit-service");
    if (formEditSrv) {
      formEditSrv.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = this.container.querySelector("#edit-srv-id").value;
        const name = this.container.querySelector("#edit-srv-name").value.trim();
        const category = this.container.querySelector("#edit-srv-category").value.trim();
        const visible = this.container.querySelector("#edit-srv-visible").checked;

        await db.updateService(v.id, id, { name, category, description: "", visible });
        if (isAdmin) await db.recordAdminChange(`Admin updated service '${name}' for '${v.branding.businessName}'`);
        this.currentVendor = db.getVendor(v.id) || this.currentVendor;
        this.container.querySelector("#modal-edit-service")?.classList.remove("active");
        window.OmniApp.showToast("Service updated successfully!");
        this.renderDashboard();
      });
    }

    // Toggle & Delete Services
    this.container.querySelectorAll("[data-toggle-srv]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-toggle-srv");
        const s = await db.toggleService(v.id, id);
        this.currentVendor = db.getVendor(v.id) || this.currentVendor;
        window.OmniApp.showToast(s?.visible !== false ? "Service is now visible." : "Service hidden from clients.");
        this.renderDashboard();
      });
    });

    this.container.querySelectorAll("[data-del-srv]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del-srv");
        if (confirm("Are you sure you want to remove this service?")) {
          await db.deleteService(v.id, id);
          if (v.services) v.services = v.services.filter(s => String(s.id) !== String(id));
          if (isAdmin) await db.recordAdminChange(`Admin deleted service from '${v.branding.businessName}'`);
          this.currentVendor = db.getVendor(v.id) || this.currentVendor;
          window.OmniApp.showToast("Service deleted.");
          this.renderDashboard();
        }
      });
    });

    // Add Product Modal
    const addProdBtn = this.container.querySelector("#btn-add-product");
    if (addProdBtn) {
      addProdBtn.addEventListener("click", () => {
        this.container.querySelector("#modal-add-product")?.classList.add("active");
      });
    }

    const formNewProd = this.container.querySelector("#form-new-product");
    if (formNewProd) {
      formNewProd.addEventListener("submit", async (e) => {
        e.preventDefault();
        const category = this.container.querySelector("#new-prod-category") ? this.container.querySelector("#new-prod-category").value.trim() : "General";
        const newProd = {
          id: "prod-" + Date.now(),
          name: this.container.querySelector("#new-prod-name").value.trim(),
          category: category || "General",
          emoji: this.container.querySelector("#new-prod-emoji").value.trim(),
          unit: this.container.querySelector("#new-prod-unit").value.trim(),
          price: Number(this.container.querySelector("#new-prod-price").value || 0),
          description: "",
          visible: true
        };
        if (!v.products) v.products = [];
        v.products.push(newProd);
        await db.saveVendor(v);
        if (isAdmin) await db.recordAdminChange(`Admin added product '${newProd.name}' to '${v.branding.businessName}'`);
        this.currentVendor = db.getVendor(v.id) || this.currentVendor;
        this.container.querySelector("#modal-add-product")?.classList.remove("active");
        window.OmniApp.showToast("Product added to catalog!");
        this.renderDashboard();
      });
    }

    // Edit Product Modal Opener
    this.container.querySelectorAll("[data-edit-prod]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit-prod");
        const p = (v.products || []).find(x => String(x.id) === String(id));
        if (!p) return;
        const modal = this.container.querySelector("#modal-edit-product");
        if (modal) {
          modal.querySelector("#edit-prod-id").value = p.id;
          modal.querySelector("#edit-prod-name").value = p.name || "";
          modal.querySelector("#edit-prod-category").value = p.category || "";
          modal.querySelector("#edit-prod-emoji").value = p.emoji || "🛍️";
          modal.querySelector("#edit-prod-unit").value = p.unit || "unit";
          modal.querySelector("#edit-prod-price").value = p.price || 0;
          modal.querySelector("#edit-prod-visible").checked = p.visible !== false;
          modal.classList.add("active");
        }
      });
    });

    // Save Edit Product Form
    const editProdForm = this.container.querySelector("#form-edit-product");
    if (editProdForm) {
      editProdForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = this.container.querySelector("#edit-prod-id").value;
        const name = this.container.querySelector("#edit-prod-name").value.trim();
        const category = this.container.querySelector("#edit-prod-category") ? this.container.querySelector("#edit-prod-category").value.trim() : "General";
        const emoji = this.container.querySelector("#edit-prod-emoji").value.trim() || "🛍️";
        const unit = this.container.querySelector("#edit-prod-unit").value.trim() || "unit";
        const price = Number(this.container.querySelector("#edit-prod-price").value || 0);
        const visible = this.container.querySelector("#edit-prod-visible").checked;

        await db.updateProduct(v.id, id, { name, category: category || "General", emoji, unit, price, description: "", visible });
        if (isAdmin) await db.recordAdminChange(`Admin updated product '${name}' for '${v.branding.businessName}'`);
        this.currentVendor = db.getVendor(v.id) || this.currentVendor;
        this.container.querySelector("#modal-edit-product")?.classList.remove("active");
        window.OmniApp.showToast(`Updated product '${name}' successfully!`);
        this.renderDashboard();
      });
    }

    // Toggle & Delete Product
    this.container.querySelectorAll("[data-toggle-prod]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-toggle-prod");
        const p = await db.toggleProduct(v.id, id);
        this.currentVendor = db.getVendor(v.id) || this.currentVendor;
        window.OmniApp.showToast(p?.visible !== false ? "Product is now visible in shop." : "Product hidden from shop.");
        this.renderDashboard();
      });
    });

    this.container.querySelectorAll("[data-del-prod]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del-prod");
        if (confirm("Delete this product permanently from your catalog?")) {
          await db.deleteProduct(v.id, id);
          if (v.products) v.products = v.products.filter(p => String(p.id) !== String(id));
          if (isAdmin) await db.recordAdminChange(`Admin deleted product from '${v.branding.businessName}'`);
          this.currentVendor = db.getVendor(v.id) || this.currentVendor;
          window.OmniApp.showToast("Product deleted.");
          this.renderDashboard();
        }
      });
    });

    // Booking Status Update
    this.container.querySelectorAll("[data-booking-status-id]").forEach(select => {
      select.addEventListener("change", async () => {
        const bkgId = select.getAttribute("data-booking-status-id");
        await db.updateBookingStatus(v.id, bkgId, select.value);
        this.currentVendor = db.getVendor(v.id) || this.currentVendor;
        window.OmniApp.showToast("Booking status updated to " + select.value);
      });
    });

    // Open Edit Booking Modal
    this.container.querySelectorAll("[data-edit-bkg]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit-bkg");
        const b = (v.bookings || []).find(x => String(x.id) === String(id));
        if (!b) return;
        const modal = this.container.querySelector("#modal-vendor-booking");
        if (modal) {
          modal.querySelector("#edit-bkg-id").value = b.id;
          modal.querySelector("#edit-bkg-name").value = b.clientName || "";
          modal.querySelector("#edit-bkg-phone").value = b.clientPhone || "";
          modal.querySelector("#edit-bkg-service").value = b.service || "";
          modal.querySelector("#edit-bkg-date").value = b.date || "";
          modal.querySelector("#edit-bkg-time").value = b.timeSlot || "";
          modal.querySelector("#edit-bkg-status").value = b.status || "Pending";
          modal.querySelector("#edit-bkg-notes").value = b.notes || "";
          modal.classList.add("active");
        }
      });
    });

    // Save Edit Booking Form
    const editBkgForm = this.container.querySelector("#form-vendor-edit-booking");
    if (editBkgForm) {
      editBkgForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = this.container.querySelector("#edit-bkg-id").value;
        const clientName = this.container.querySelector("#edit-bkg-name").value.trim();
        const clientPhone = this.container.querySelector("#edit-bkg-phone").value.trim();
        const service = this.container.querySelector("#edit-bkg-service").value.trim();
        const date = this.container.querySelector("#edit-bkg-date").value;
        const timeSlot = this.container.querySelector("#edit-bkg-time").value.trim();
        const status = this.container.querySelector("#edit-bkg-status").value;
        const notes = this.container.querySelector("#edit-bkg-notes").value.trim();

        await db.updateBooking(v.id, id, { clientName, clientPhone, service, date, timeSlot, status, notes });
        if (isAdmin) await db.recordAdminChange(`Admin updated booking for '${v.branding.businessName}'`);
        this.currentVendor = db.getVendor(v.id) || this.currentVendor;
        this.container.querySelector("#modal-vendor-booking")?.classList.remove("active");
        window.OmniApp.showToast("Booking details updated successfully!");
        this.renderDashboard();
      });
    }

    // Delete Booking
    this.container.querySelectorAll("[data-del-bkg]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del-bkg");
        if (confirm("Delete this booking record permanently?")) {
          await db.deleteBooking(v.id, id);
          if (v.bookings) v.bookings = v.bookings.filter(b => String(b.id) !== String(id));
          if (isAdmin) await db.recordAdminChange(`Admin deleted booking for '${v.branding.businessName}'`);
          this.currentVendor = db.getVendor(v.id) || this.currentVendor;
          window.OmniApp.showToast("Booking deleted.");
          this.renderDashboard();
        }
      });
    });

    // Direct WhatsApp Reply
    this.container.querySelectorAll("[data-bkg-reply-phone]").forEach(btn => {
      btn.addEventListener("click", () => {
        const phone = btn.getAttribute("data-bkg-reply-phone");
        const client = btn.getAttribute("data-bkg-client-name");
        const msg = `Hello ${client}, this is ${v.branding.businessName}. Thank you for your booking inquiry! We are pleased to connect regarding your appointment.`;
        WhatsAppEngine.openChat(phone, msg);
      });
    });

    // Open Edit Review Modal
    this.container.querySelectorAll("[data-edit-rev]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit-rev");
        const r = (v.reviews || []).find(x => String(x.id) === String(id));
        if (!r) return;
        const modal = this.container.querySelector("#modal-vendor-review");
        if (modal) {
          modal.querySelector("#edit-rev-id").value = r.id;
          modal.querySelector("#edit-rev-author").value = r.author || "";
          modal.querySelector("#edit-rev-rating").value = String(r.rating || 5);
          modal.querySelector("#edit-rev-date").value = r.date || "";
          modal.querySelector("#edit-rev-content").value = r.content || "";
          modal.classList.add("active");
        }
      });
    });

    // Save Edit Review Form
    const editRevForm = this.container.querySelector("#form-vendor-edit-review");
    if (editRevForm) {
      editRevForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = this.container.querySelector("#edit-rev-id").value;
        const author = this.container.querySelector("#edit-rev-author").value.trim();
        const rating = Number(this.container.querySelector("#edit-rev-rating").value || 5);
        const date = this.container.querySelector("#edit-rev-date").value.trim();
        const content = this.container.querySelector("#edit-rev-content").value.trim();

        await db.updateReview(v.id, id, { author, rating, date, content });
        if (isAdmin) await db.recordAdminChange(`Admin updated review for '${v.branding.businessName}'`);
        this.currentVendor = db.getVendor(v.id) || this.currentVendor;
        this.container.querySelector("#modal-vendor-review")?.classList.remove("active");
        window.OmniApp.showToast("Review updated successfully!");
        this.renderDashboard();
      });
    }

    // Delete Review
    this.container.querySelectorAll("[data-del-rev]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del-rev");
        if (confirm("Delete this customer review permanently?")) {
          await db.deleteReview(v.id, id);
          if (v.reviews) v.reviews = v.reviews.filter(r => String(r.id) !== String(id));
          if (isAdmin) await db.recordAdminChange(`Admin deleted review for '${v.branding.businessName}'`);
          this.currentVendor = db.getVendor(v.id) || this.currentVendor;
          window.OmniApp.showToast("Review deleted.");
          this.renderDashboard();
        }
      });
    });

    // Review Tag Chip add/remove
    const addTagBtn = this.container.querySelector("#btn-add-review-tag");
    if (addTagBtn) {
      addTagBtn.addEventListener("click", async () => {
        const input = this.container.querySelector("#input-new-review-tag");
        const tag = input?.value.trim();
        if (tag) {
          if (!v.reviewTags) v.reviewTags = [];
          if (!v.reviewTags.includes(tag)) {
            v.reviewTags.push(tag);
            await db.saveVendor(v);
            this.renderDashboard();
          }
        }
      });
    }

    this.container.querySelectorAll("[data-remove-tag]").forEach(span => {
      span.addEventListener("click", async () => {
        const tag = span.getAttribute("data-remove-tag");
        v.reviewTags = (v.reviewTags || []).filter(t => t !== tag);
        await db.saveVendor(v);
        this.renderDashboard();
      });
    });

    // --- Lead Form & Leads Management Event Handlers ---

    // 1. Save Lead Form Settings
    const leadSettingsForm = this.container.querySelector("#form-vendor-leadform-settings");
    if (leadSettingsForm) {
      leadSettingsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const updatedConfig = {
          title: this.container.querySelector("#vlead-title").value.trim(),
          subtitle: this.container.querySelector("#vlead-subtitle").value.trim(),
          buttonText: this.container.querySelector("#vlead-btn-text").value.trim(),
          buttonIcon: this.container.querySelector("#vlead-btn-icon").value.trim() || "⚡",
          submitButtonText: this.container.querySelector("#vlead-submit-btn-text").value.trim() || "Request Call Back ⚡",
          whatsappNumber: this.container.querySelector("#vlead-whatsapp").value.trim(),
          enabled: this.container.querySelector("#vlead-enabled").checked
        };

        await db.saveLeadFormConfig(v.id, updatedConfig);
        v.leadForm = { ...v.leadForm, ...updatedConfig };
        if (isAdmin) await db.recordAdminChange(`Admin updated lead form settings for '${v.branding.businessName}'`);
        window.OmniApp.showToast("Lead Form settings saved successfully!");
      });
    }

    // 2. Add New Field Modal Opener & Type Dynamic Toggle
    const btnAddLeadField = this.container.querySelector("#btn-add-lead-field");
    const modalAddLeadField = this.container.querySelector("#modal-vendor-add-lead-field");
    const newFldTypeSelect = this.container.querySelector("#new-fld-type");
    const newFldOptionsGroup = this.container.querySelector("#new-fld-options-group");

    if (btnAddLeadField && modalAddLeadField) {
      btnAddLeadField.addEventListener("click", () => {
        modalAddLeadField.classList.add("active");
        document.body.classList.add("has-modal-open");
      });
    }

    if (newFldTypeSelect && newFldOptionsGroup) {
      newFldTypeSelect.addEventListener("change", () => {
        const val = newFldTypeSelect.value;
        newFldOptionsGroup.style.display = (val === "select" || val === "multiselect") ? "block" : "none";
      });
    }

    // 3. Add New Field Form Submit
    const formNewLeadField = this.container.querySelector("#form-vendor-new-lead-field");
    if (formNewLeadField) {
      formNewLeadField.addEventListener("submit", async (e) => {
        e.preventDefault();
        const label = this.container.querySelector("#new-fld-label").value.trim();
        const type = this.container.querySelector("#new-fld-type").value;
        const placeholder = this.container.querySelector("#new-fld-placeholder").value.trim();
        const required = this.container.querySelector("#new-fld-required").checked;
        const rawOptions = this.container.querySelector("#new-fld-options")?.value.trim() || "";

        let options = [];
        if (type === "select" || type === "multiselect") {
          options = rawOptions.split(",").map(o => o.trim()).filter(Boolean);
          if (options.length === 0) {
            window.OmniApp.showToast("Please provide at least 1 option (comma-separated) for dropdown/multiselect.");
            return;
          }
        }

        const newField = {
          id: `fld-${Date.now()}`,
          type,
          label,
          placeholder,
          required,
          options
        };

        if (!v.leadForm) v.leadForm = {};
        if (!Array.isArray(v.leadForm.fields)) v.leadForm.fields = [];
        v.leadForm.fields.push(newField);

        await db.saveLeadFormConfig(v.id, v.leadForm);
        modalAddLeadField?.classList.remove("active");
        if (!document.querySelector(".modal-overlay.active")) {
          document.body.classList.remove("has-modal-open");
        }

        formNewLeadField.reset();
        if (newFldOptionsGroup) newFldOptionsGroup.style.display = "none";
        window.OmniApp.showToast(`Added field "${label}" to popup form!`);
        this.renderDashboard();
      });
    }

    // 4. Edit Field Modal Opener & Dynamic Toggle
    const modalEditLeadField = this.container.querySelector("#modal-vendor-edit-lead-field");
    const editFldTypeSelect = this.container.querySelector("#edit-fld-type");
    const editFldOptionsGroup = this.container.querySelector("#edit-fld-options-group");

    if (editFldTypeSelect && editFldOptionsGroup) {
      editFldTypeSelect.addEventListener("change", () => {
        const val = editFldTypeSelect.value;
        editFldOptionsGroup.style.display = (val === "select" || val === "multiselect") ? "block" : "none";
      });
    }

    this.container.querySelectorAll("[data-edit-fld]").forEach(btn => {
      btn.addEventListener("click", () => {
        const fldId = btn.getAttribute("data-edit-fld");
        const fld = (v.leadForm?.fields || []).find(f => f.id === fldId);
        if (!fld || !modalEditLeadField) return;

        modalEditLeadField.querySelector("#edit-fld-id").value = fld.id;
        modalEditLeadField.querySelector("#edit-fld-label").value = fld.label;
        modalEditLeadField.querySelector("#edit-fld-type").value = fld.type;
        modalEditLeadField.querySelector("#edit-fld-placeholder").value = fld.placeholder || "";
        modalEditLeadField.querySelector("#edit-fld-options").value = (fld.options || []).join(", ");
        modalEditLeadField.querySelector("#edit-fld-required").checked = !!fld.required;

        if (editFldOptionsGroup) {
          editFldOptionsGroup.style.display = (fld.type === "select" || fld.type === "multiselect") ? "block" : "none";
        }

        modalEditLeadField.classList.add("active");
        document.body.classList.add("has-modal-open");
      });
    });

    // 5. Edit Field Form Submit
    const formEditLeadField = this.container.querySelector("#form-vendor-edit-lead-field");
    if (formEditLeadField) {
      formEditLeadField.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fldId = modalEditLeadField.querySelector("#edit-fld-id").value;
        const label = modalEditLeadField.querySelector("#edit-fld-label").value.trim();
        const type = modalEditLeadField.querySelector("#edit-fld-type").value;
        const placeholder = modalEditLeadField.querySelector("#edit-fld-placeholder").value.trim();
        const required = modalEditLeadField.querySelector("#edit-fld-required").checked;
        const rawOptions = modalEditLeadField.querySelector("#edit-fld-options").value.trim();

        let options = [];
        if (type === "select" || type === "multiselect") {
          options = rawOptions.split(",").map(o => o.trim()).filter(Boolean);
        }

        const idx = (v.leadForm?.fields || []).findIndex(f => f.id === fldId);
        if (idx >= 0) {
          v.leadForm.fields[idx] = {
            ...v.leadForm.fields[idx],
            label,
            type,
            placeholder,
            required,
            options
          };

          await db.saveLeadFormConfig(v.id, v.leadForm);
          modalEditLeadField?.classList.remove("active");
          if (!document.querySelector(".modal-overlay.active")) {
            document.body.classList.remove("has-modal-open");
          }

          window.OmniApp.showToast(`Updated field "${label}"!`);
          this.renderDashboard();
        }
      });
    }

    // 6. Delete Field
    this.container.querySelectorAll("[data-del-fld]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const fldId = btn.getAttribute("data-del-fld");
        if (confirm("Delete this question from your popup form?")) {
          v.leadForm.fields = (v.leadForm?.fields || []).filter(f => f.id !== fldId);
          await db.saveLeadFormConfig(v.id, v.leadForm);
          window.OmniApp.showToast("Field removed from popup form.");
          this.renderDashboard();
        }
      });
    });

    // 7. Move Field Up / Down
    this.container.querySelectorAll("[data-move-fld]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const direction = btn.getAttribute("data-move-fld");
        const idx = Number(btn.getAttribute("data-fld-idx"));
        const fields = v.leadForm?.fields || [];

        if (direction === "up" && idx > 0) {
          const temp = fields[idx];
          fields[idx] = fields[idx - 1];
          fields[idx - 1] = temp;
          await db.saveLeadFormConfig(v.id, v.leadForm);
          this.renderDashboard();
        } else if (direction === "down" && idx < fields.length - 1) {
          const temp = fields[idx];
          fields[idx] = fields[idx + 1];
          fields[idx + 1] = temp;
          await db.saveLeadFormConfig(v.id, v.leadForm);
          this.renderDashboard();
        }
      });
    });

    // 8. Toggle Lead Status (New -> Contacted -> Converted -> New)
    this.container.querySelectorAll("[data-toggle-lead-status]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const leadId = btn.getAttribute("data-toggle-lead-status");
        const lead = (v.leads || []).find(l => l.id === leadId);
        if (!lead) return;

        const nextStatus = lead.status === "New" ? "Contacted" : (lead.status === "Contacted" ? "Converted" : "New");
        await db.updateLeadStatus(v.id, leadId, nextStatus);
        lead.status = nextStatus;
        window.OmniApp.showToast(`Lead marked as ${nextStatus}!`);
        this.renderDashboard();
      });
    });

    // 9. Delete Lead
    this.container.querySelectorAll("[data-del-lead]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const leadId = btn.getAttribute("data-del-lead");
        if (confirm("Delete this captured lead record permanently?")) {
          await db.deleteLead(v.id, leadId);
          v.leads = (v.leads || []).filter(l => l.id !== leadId);
          window.OmniApp.showToast("Lead record deleted.");
          this.renderDashboard();
        }
      });
    });
  }
}


