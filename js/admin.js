// Module 3: Super Admin Management Console Controller
import { db } from "./db.js";
import { WhatsAppEngine } from "./whatsapp.js";

export class AdminConsoleController {
  constructor(containerEl) {
    this.container = containerEl;
    this.isAuthenticated = false;
    this.activeTab = "overview"; // overview, vendors, create, plans, settings
    this.vendorFilterQuery = "";
    this.vendorFilterStatus = "all";
    this.vendorFilterCategory = "all";
  }

  init() {
    this.render();
  }

  render() {
    if (!this.isAuthenticated) {
      this.renderLoginForm();
    } else {
      this.renderDashboard();
    }
  }

  renderLoginForm() {
    this.container.innerHTML = `
      <div class="portal-container" style="max-width: 440px;">
        <div class="bento-card" style="padding: 32px 24px; text-align: center;">
          <div style="font-size: 2.6rem; margin-bottom: 12px;">🛡️</div>
          <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px; color: #FFFFFF;">Super Admin Access</h2>
          <p style="font-size: 0.8rem; color: var(--theme-text-muted); margin-bottom: 20px;">
            OmniCard Platform Control Plane. Enter master security PIN to continue.
          </p>

          <form id="form-admin-login">
            <div class="form-group" style="margin-bottom: 16px;">
              <input type="password" maxlength="8" class="form-input" id="admin-pin-input" placeholder="••••" required style="font-size: 1.2rem; text-align: center; letter-spacing: 6px;" autocomplete="off" />
            </div>
            <button type="submit" class="btn-submit-primary" style="padding: 12px;">
              <span>Unlock Admin Console</span>
              <span>→</span>
            </button>
          </form>

          <div style="margin-top: 20px; font-size: 0.72rem; color: var(--theme-text-muted);">
            🔒 Restricted Area. Master system governance.
          </div>
        </div>
      </div>
    `;

    const form = this.container.querySelector("#form-admin-login");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const pin = this.container.querySelector("#admin-pin-input").value.trim();
      const actual = db.getPlatformSettings()?.adminPin || "1234";
      if (pin === actual) {
        this.isAuthenticated = true;
        this.render();
        window.OmniApp.showToast("Super Admin Authenticated");
      } else {
        window.OmniApp.showToast("Access Denied: Invalid Security PIN");
      }
    });
  }

  calculateMetrics() {
    const vendors = db.getVendors();
    const plans = db.getSubscriptionPlans();
    const totalCards = vendors.length;
    const now = new Date();
    const activeCards = vendors.filter(v => v.status === "active" && new Date(v.expiresAt) >= now).length;
    const expiredCards = vendors.filter(v => new Date(v.expiresAt) < now || v.status === "expired").length;
    const expiring7d = vendors.filter(v => {
      const diffMs = new Date(v.expiresAt) - now;
      const daysLeft = diffMs / (1000 * 60 * 60 * 24);
      return daysLeft >= 0 && daysLeft <= 7;
    }).length;

    // Calculate revenue from vendors based on their plan
    let totalRevenue = 0;
    vendors.forEach(v => {
      const p = plans.find(plan => plan.id === v.planId);
      if (p) totalRevenue += Number(p.price || 0);
    });

    return { totalCards, activeCards, totalRevenue, expiredCards, expiring7d };
  }

  renderRecentBookingsPreview() {
    const vendors = db.getVendors();
    const allBookings = [];
    vendors.forEach(v => {
      (v.bookings || []).forEach(b => {
        allBookings.push({ ...b, vendorName: v.branding.businessName });
      });
    });
    if (allBookings.length === 0) {
      return `<div style="color: var(--theme-text-muted); font-size: 0.8rem; text-align: center; padding: 14px;">No recent booking requests.</div>`;
    }
    return allBookings.slice(0, 3).map(b => `
      <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; border: 1px solid var(--theme-border); font-size: 0.78rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <b>👤 ${b.clientName}</b>
          <span style="color: #00E5FF;">@ ${b.vendorName}</span>
        </div>
        <div style="color: var(--theme-text-muted);">📅 ${b.date} at ${b.timeSlot || '11:00 AM'} · 📱 ${b.clientPhone}</div>
      </div>
    `).join("");
  }

  renderRecentReviewsPreview() {
    const vendors = db.getVendors();
    const allReviews = [];
    vendors.forEach(v => {
      (v.reviews || []).forEach(r => {
        allReviews.push({ ...r, vendorName: v.branding.businessName });
      });
    });
    if (allReviews.length === 0) {
      return `<div style="color: var(--theme-text-muted); font-size: 0.8rem; text-align: center; padding: 14px;">No recent reviews.</div>`;
    }
    return allReviews.slice(0, 3).map(r => `
      <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; border: 1px solid var(--theme-border); font-size: 0.78rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <b>★ ${r.rating || 5} · ${r.reviewerName || 'Client'}</b>
          <span style="color: #00E5FF;">@ ${r.vendorName}</span>
        </div>
        <div style="color: var(--theme-text-muted); line-height: 1.4;">"${(r.text || '').substring(0, 70)}..."</div>
      </div>
    `).join("");
  }

  renderDashboard() {
    const settings = db.getPlatformSettings();
    const currency = settings.currencySymbol || "₹";
    const metrics = this.calculateMetrics();

    this.container.innerHTML = `
      <div class="portal-container">
        <!-- Admin Header matching Screenshot 2 & 4 -->
        <div class="portal-header" style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--theme-border);">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <a href="?view=home" class="btn-pill" style="font-size: 0.76rem; padding: 4px 10px; text-decoration: none;">
              <span>← Home</span>
            </a>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 1.2rem; color: #D4FF00;">⚡</span>
              <span style="font-weight: 800; font-size: 1.15rem; color: #FFFFFF;">${settings.platformName || 'OmniCard'} Console</span>
              <span class="pill-status-active" style="font-size: 0.65rem; padding: 2px 7px;">LIVE</span>
              <span style="font-size: 0.75rem; color: var(--theme-text-muted);">${metrics.totalCards} vendors</span>
            </div>
          </div>
          <div>
            <button class="btn-pill" id="btn-admin-logout" style="font-size: 0.76rem;">Sign Out</button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="portal-nav-tabs">
          <button class="portal-tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" data-atab="overview">
            📊 Dashboard
          </button>
          <button class="portal-tab-btn ${this.activeTab === 'vendors' ? 'active' : ''}" data-atab="vendors">
            👥 Vendors
          </button>
          <button class="portal-tab-btn ${this.activeTab === 'create' ? 'active' : ''}" data-atab="create">
            ＋ Register New
          </button>
          <button class="portal-tab-btn ${this.activeTab === 'plans' ? 'active' : ''}" data-atab="plans">
            💳 Plans
          </button>
          <button class="portal-tab-btn ${this.activeTab === 'settings' ? 'active' : ''}" data-atab="settings">
            ⚙️ Settings
          </button>
        </div>

        <!-- 1. Overview Pane matching Screenshot 4 -->
        <div class="portal-pane ${this.activeTab === 'overview' ? 'active' : ''}" id="apane-overview">
          <div class="kpi-neon-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
            <div class="kpi-card-neon neon-purple" id="kpi-card-total" style="cursor: pointer;" title="Click to view all vendors">
              <div class="kpi-neon-val">${metrics.totalCards}</div>
              <div class="kpi-neon-lbl">👤 TOTAL VENDORS</div>
            </div>

            <div class="kpi-card-neon neon-green" id="kpi-card-active" style="cursor: pointer;" title="Click to view active vendors">
              <div class="kpi-neon-val">${metrics.activeCards}</div>
              <div class="kpi-neon-lbl">✓ ACTIVE CARDS</div>
            </div>

            <div class="kpi-card-neon neon-amber" id="kpi-card-expiring-7d" style="cursor: pointer;" title="Click to view vendors expiring in 7 days">
              <div class="kpi-neon-val">${metrics.expiring7d || 0}</div>
              <div class="kpi-neon-lbl">⏳ EXPIRING IN 7 DAYS</div>
            </div>

            <div class="kpi-card-neon neon-red" id="kpi-card-expired" style="cursor: pointer;" title="Click to view expired vendors">
              <div class="kpi-neon-val">${metrics.expiredCards || 0}</div>
              <div class="kpi-neon-lbl">🕒 EXPIRED PAGES</div>
            </div>

            <div class="kpi-card-neon neon-gold">
              <div class="kpi-neon-val">${currency}${metrics.totalRevenue.toLocaleString()}</div>
              <div class="kpi-neon-lbl">💳 REVENUE</div>
            </div>
          </div>

          <div class="bento-grid bento-grid-2">
            <div class="bento-card">
              <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 12px; color: #FFFFFF;">📅 Recent Booking Requests</h3>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${this.renderRecentBookingsPreview()}
              </div>
            </div>

            <div class="bento-card">
              <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 12px; color: #FFFFFF;">⭐ Recent Customer Reviews</h3>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${this.renderRecentReviewsPreview()}
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Vendors Management Pane matching Screenshot 2 & 3 -->
        <div class="portal-pane ${this.activeTab === 'vendors' ? 'active' : ''}" id="apane-vendors">
          <div class="bento-card" style="margin-bottom: 16px;">
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <!-- Top Row: Search & Business Category Filter -->
              <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 8px; flex: 1; min-width: 240px;">
                  <input type="text" class="form-input" id="admin-vendor-search" placeholder="Search by name, owner, category, or slug..." value="${this.vendorFilterQuery}" />
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 0.76rem; color: #94A3B8; font-weight: 700; text-transform: uppercase; white-space: nowrap;">🏢 Category:</span>
                  <select class="form-select" id="admin-vendor-category-filter" style="min-width: 200px; font-size: 0.8rem; padding: 7px 10px; background: rgba(0,0,0,0.6); border-color: rgba(255,255,255,0.15); color: #FFF;">
                    <option value="all">All Business Categories (${db.getVendors().length})</option>
                    ${Array.from(new Set(db.getVendors().map(v => v.branding?.category).filter(Boolean))).sort().map(cat => {
                      const count = db.getVendors().filter(v => (v.branding?.category || '').toLowerCase() === cat.toLowerCase()).length;
                      return `<option value="${cat}" ${this.vendorFilterCategory.toLowerCase() === cat.toLowerCase() ? 'selected' : ''}>${cat} (${count})</option>`;
                    }).join('')}
                  </select>
                </div>
              </div>

              <!-- Bottom Row: Lifecycle & Expiry Status Filters with Live Counts -->
              <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                <span style="font-size: 0.76rem; color: #94A3B8; font-weight: 700; text-transform: uppercase; margin-right: 4px;">Status:</span>
                <button class="filter-chip ${this.vendorFilterStatus === 'all' ? 'active' : ''}" data-admin-status-filter="all">
                  ALL (${db.getVendors().length})
                </button>
                <button class="filter-chip ${this.vendorFilterStatus === 'active' ? 'active' : ''}" data-admin-status-filter="active">
                  ACTIVE (${db.getVendors().filter(v => v.status === 'active' && new Date(v.expiresAt) >= new Date()).length})
                </button>
                <button class="filter-chip ${this.vendorFilterStatus === 'expiring-7d' ? 'active' : ''} ${db.getVendors().filter(v => { const d = (new Date(v.expiresAt) - new Date()) / 86400000; return d >= 0 && d <= 7; }).length > 0 ? 'chip-expiring' : ''}" data-admin-status-filter="expiring-7d" title="Subscriptions expiring within 7 days">
                  ⏳ EXPIRING IN 7 DAYS (${db.getVendors().filter(v => { const d = (new Date(v.expiresAt) - new Date()) / 86400000; return d >= 0 && d <= 7; }).length})
                </button>
                <button class="filter-chip ${this.vendorFilterStatus === 'expired' ? 'active' : ''}" data-admin-status-filter="expired">
                  ⚠️ EXPIRED (${db.getVendors().filter(v => new Date(v.expiresAt) < new Date() || v.status === 'expired').length})
                </button>
                <button class="filter-chip ${this.vendorFilterStatus === 'suspended' ? 'active' : ''}" data-admin-status-filter="suspended">
                  ⏸️ SUSPENDED (${db.getVendors().filter(v => v.status === 'suspended').length})
                </button>
              </div>
            </div>
          </div>

          <!-- Vertical Vendor Cards Stack matching Screenshot 2 & 3 -->
          <div id="admin-vendors-card-list">
            ${this.renderVendorCards()}
          </div>
        </div>

        <!-- 3. Create New Vendor Card Pane -->
        <div class="portal-pane ${this.activeTab === 'create' ? 'active' : ''}" id="apane-create">
          <form id="form-create-vendor">
            <div class="bento-grid bento-grid-2" style="margin-bottom: 20px;">
              <div class="bento-card">
                <h3 style="font-size: 1.05rem; margin-bottom: 12px; color: var(--theme-primary);">Template Presets & Core Info</h3>
                
                <div class="form-group">
                  <label class="form-label">Load Template Preset</label>
                  <select class="form-select" id="new-preset-select">
                    <option value="Custom">Custom / Blank Preset</option>
                    <option value="Salon">Salon & Beauty Retreat</option>
                    <option value="Restaurant">Restaurant & Food Studio</option>
                    <option value="Catering">Banquet & Luxury Catering</option>
                    <option value="Doctor">Doctor & Healthcare Clinic</option>
                    <option value="Tutor">Private Tutor / Academy</option>
                    <option value="Grocery">Organic Grocery & Essentials</option>
                    <option value="RealEstate">Luxury Real Estate Agency</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Business Name</label>
                  <input type="text" class="form-input" id="new-v-name" placeholder="e.g. Apex Legal Chamber" required />
                </div>

                <div class="form-group">
                  <label class="form-label">Card URL Slug (Unique ID)</label>
                  <input type="text" class="form-input" id="new-v-slug" placeholder="e.g. apex-legal" required />
                </div>

                <div class="form-group">
                  <label class="form-label">Owner Name</label>
                  <input type="text" class="form-input" id="new-v-owner" placeholder="e.g. Adv. Arvind Mehta" required />
                </div>

                <div class="form-group">
                  <label class="form-label">Category Badge</label>
                  <input type="text" class="form-input" id="new-v-category" placeholder="e.g. CORPORATE LAW" required />
                </div>

                <div class="form-group">
                  <label class="form-label">Business Tagline</label>
                  <input type="text" class="form-input" id="new-v-tagline" placeholder="e.g. Strategic counsel & dispute resolution" />
                </div>

                <div class="form-group">
                  <label class="form-label">Vendor Login Password (for Long-Press Login)</label>
                  <input type="text" class="form-input" id="new-v-password" value="2026" placeholder="e.g. MySecret2026 or 2026" required />
                  <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-top: 3px;">
                    Provide this password to the business owner to unlock their vCard by holding down their logo.
                  </div>
                </div>
              </div>

              <div class="bento-card">
                <h3 style="font-size: 1.05rem; margin-bottom: 12px; color: var(--theme-secondary);">Feature Toggles & Contacts</h3>

                <div class="form-group">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <label class="form-label" style="margin-bottom: 0;">Subscription Plan</label>
                    <button type="button" class="btn-pill" id="btn-quick-demo-plan" style="font-size: 0.7rem; color: var(--theme-primary); border-color: rgba(212,255,0,0.35); padding: 2px 8px;">
                      🎁 Select 3-Day Free Demo
                    </button>
                  </div>
                  <select class="form-select" id="new-v-plan">
                    ${db.getSubscriptionPlans().map(p => `
                      <option value="${p.id}" ${p.id === 'plan-demo' ? 'selected' : ''}>${p.name} (${Number(p.price) === 0 ? 'FREE' : `${currency}${p.price}`} / ${p.durationDays}d)</option>
                    `).join("")}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">WhatsApp Mobile Number</label>
                  <input type="text" class="form-input" id="new-v-whatsapp" placeholder="e.g. 919876543210" required />
                </div>

                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input type="text" class="form-input" id="new-v-phone" placeholder="e.g. +919876543210" />
                </div>

                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-input" id="new-v-email" placeholder="e.g. contact@domain.com" />
                </div>

                <div style="margin-top: 14px; border-top: 1px solid var(--theme-border); padding-top: 12px;">
                  <div style="font-size: 0.75rem; font-weight: 700; color: var(--theme-text-muted); margin-bottom: 6px; text-transform: uppercase;">
                    vCard Tabs & Feature Access Permissions:
                  </div>
                  <div style="font-size: 0.72rem; color: var(--theme-primary); margin-bottom: 10px; line-height: 1.4;">
                    ⚡ Features auto-selected based on chosen package. Admin can freely override any feature below for this business:
                  </div>

                  <div style="display: flex; flex-direction: column; gap: 10px;">
                    <label class="switch-label" style="opacity: 0.85;">
                      <input type="checkbox" class="switch-input" id="toggle-feat-home" checked disabled />
                      <span class="switch-slider"></span>
                      <span><strong>Home Tab</strong> — Default (Always Active)</span>
                    </label>

                    <label class="switch-label">
                      <input type="checkbox" class="switch-input" id="toggle-feat-quote" checked />
                      <span class="switch-slider"></span>
                      <span><strong>Services Tab</strong> (Quote Builder & Selection)</span>
                    </label>

                    <label class="switch-label">
                      <input type="checkbox" class="switch-input" id="toggle-feat-shop" checked />
                      <span class="switch-slider"></span>
                      <span><strong>Shop Tab</strong> (E-Commerce Catalog & Cart)</span>
                    </label>

                    <label class="switch-label">
                      <input type="checkbox" class="switch-input" id="toggle-feat-booking" checked />
                      <span class="switch-slider"></span>
                      <span><strong>Book Appointment Tab</strong> (Calendar Scheduling)</span>
                    </label>

                    <label class="switch-label">
                      <input type="checkbox" class="switch-input" id="toggle-feat-reviews" checked />
                      <span class="switch-slider"></span>
                      <span><strong>Reviews Tab</strong> (Customer Ratings & Testimonials)</span>
                    </label>

                    <label class="switch-label">
                      <input type="checkbox" class="switch-input" id="toggle-feat-promo" checked />
                      <span class="switch-slider"></span>
                      <span>Promo Offer Banner (Home Tab)</span>
                    </label>

                    <label class="switch-label">
                      <input type="checkbox" class="switch-input" id="toggle-feat-pwa" checked />
                      <span class="switch-slider"></span>
                      <span>PWA Web App Installation</span>
                    </label>

                    <label class="switch-label">
                      <input type="checkbox" class="switch-input" id="toggle-feat-leadform" checked />
                      <span class="switch-slider"></span>
                      <span><strong>Lead Form Builder</strong> (Custom Popup & WhatsApp Leads)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" class="btn-submit-primary" style="max-width: 320px;">
              <span>Deploy New Smart Card</span>
              <span>🚀</span>
            </button>
          </form>
        </div>

        <!-- 4. Subscription Plans Pane -->
        <div class="portal-pane ${this.activeTab === 'plans' ? 'active' : ''}" id="apane-plans">
          <div class="bento-card" style="margin-bottom: 16px;">
            <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; align-items: center;">
              <div>
                <h3 style="font-size: 1.05rem;">Manage Subscription Plans & Packages</h3>
                <div style="font-size: 0.78rem; color: var(--theme-text-muted); margin-top: 3px;">
                  Configure package validity duration (e.g. 3-day demo), pricing, and active feature modules.
                </div>
              </div>
              <button class="btn-pill active" id="btn-add-plan">＋ Create Plan</button>
            </div>
          </div>

          <div class="bento-grid bento-grid-3">
            ${db.getSubscriptionPlans().map((plan, idx) => {
              const isPopular = idx === 1 || plan.id === "growth" || plan.id === "pro-30";
              return `
              <div class="bento-card ${isPopular ? 'plan-neon-card' : ''}" style="${plan.id === 'plan-demo' ? 'border-color: rgba(212,255,0,0.4); background: rgba(212,255,0,0.02);' : ''}">
                ${isPopular ? '<div class="plan-ribbon">POPULAR</div>' : ''}
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <div>
                    <h4 style="font-size: 1.05rem; color: #FFF;">${plan.name}</h4>
                    ${plan.id === 'plan-demo' ? '<span class="pill-status-active" style="font-size: 0.65rem; background: rgba(212,255,0,0.15); color: var(--theme-primary); border-color: rgba(212,255,0,0.4); margin-top: 4px; display: inline-block;">🎁 Free Demo Trial</span>' : ''}
                  </div>
                  <span class="btn-pill" style="font-size: 0.7rem; padding: 2px 8px; color: var(--theme-primary);">${plan.durationDays} Days</span>
                </div>
                <div style="font-size: 1.6rem; font-weight: 800; color: var(--theme-primary); margin-bottom: 8px;">
                  ${Number(plan.price) === 0 ? 'FREE' : `${currency}${Number(plan.price).toLocaleString()}`}
                </div>
                <p style="font-size: 0.8rem; color: var(--theme-text-muted); line-height: 1.4; margin-bottom: 14px;">
                  ${plan.description}
                </p>

                <div style="font-size: 0.75rem; color: #FFF; margin-bottom: 14px;">
                  <div style="padding: 2px 0; color: var(--theme-primary); font-weight: 600;">✓ 🏠 Home Tab (Default)</div>
                  <div style="padding: 2px 0;">${plan.features?.quoteBuilder !== false ? '<span style="color: #10B981;">✓</span>' : '<span style="color: #EF4444;">✗</span>'} 📋 Quote Builder (Services)</div>
                  <div style="padding: 2px 0;">${plan.features?.ecommerceShop !== false ? '<span style="color: #10B981;">✓</span>' : '<span style="color: #EF4444;">✗</span>'} 🛍️ E-Commerce Shop (Products)</div>
                  <div style="padding: 2px 0;">${plan.features?.calendarBooking !== false ? '<span style="color: #10B981;">✓</span>' : '<span style="color: #EF4444;">✗</span>'} 📅 Calendar Booking (Appointments)</div>
                  <div style="padding: 2px 0;">${plan.features?.customerReviews !== false ? '<span style="color: #10B981;">✓</span>' : '<span style="color: #EF4444;">✗</span>'} ⭐ Customer Reviews & Rating</div>
                  <div style="padding: 2px 0;">${plan.features?.promoBanner !== false ? '<span style="color: #10B981;">✓</span>' : '<span style="color: #EF4444;">✗</span>'} 🏷️ Promo Offer Banner</div>
                  <div style="padding: 2px 0;">${plan.features?.pwaInstall !== false ? '<span style="color: #10B981;">✓</span>' : '<span style="color: #EF4444;">✗</span>'} 📱 PWA Web App Installation</div>
                  <div style="padding: 2px 0;">${plan.features?.leadForm !== false ? '<span style="color: #10B981;">✓</span>' : '<span style="color: #EF4444;">✗</span>'} 📝 Lead Form Builder</div>
                </div>

                <div style="display: flex; gap: 8px;">
                  <button class="btn-pill active" style="padding: 4px 10px; font-size: 0.75rem;" data-edit-plan="${plan.id}">✏️ Edit Package</button>
                  ${plan.id !== 'plan-demo' ? `<button class="btn-pill" style="padding: 4px 8px; font-size: 0.72rem; color: #EF4444;" data-del-plan="${plan.id}">Delete</button>` : ''}
                </div>
              </div>
            `;}).join("")}
          </div>
        </div>

        <!-- 5. Platform Settings & Backup Pane (Admin Exclusive) -->
        <div class="portal-pane ${this.activeTab === 'settings' ? 'active' : ''}" id="apane-settings">
          <div class="bento-grid bento-grid-2" style="margin-bottom: 20px;">
            <!-- Global Platform Settings -->
            <div class="bento-card">
              <h3 style="font-size: 1.05rem; margin-bottom: 14px; color: var(--theme-primary);">Global Platform Configuration</h3>
              <form id="form-platform-settings">
                <div class="form-group">
                  <label class="form-label">Platform Brand Name</label>
                  <input type="text" class="form-input" id="set-platformName" value="${settings.platformName}" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Currency Symbol</label>
                  <input type="text" class="form-input" id="set-currency" value="${settings.currencySymbol || '₹'}" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Admin Master PIN</label>
                  <input type="text" maxlength="8" class="form-input" id="set-adminPin" value="${settings.adminPin || '1234'}" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Platform Support WhatsApp</label>
                  <input type="text" class="form-input" id="set-supportWa" value="${settings.supportWhatsApp || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Platform Admin UPI ID / Number</label>
                  <input type="text" class="form-input" id="set-adminUpi" value="${settings.adminUpi || '7019601569@ybl'}" placeholder="e.g. 7019601569@ybl or +917019601569" />
                  <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-top: 3px;">
                    Displayed on vCard renewal popup for prepaid subscription renewals.
                  </div>
                </div>
                <button type="submit" class="btn-submit-primary" style="max-width: 240px;">Save Global Settings</button>
              </form>
            </div>

            <!-- LocalStorage Center -->
            <div class="bento-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                <h3 style="font-size: 1.05rem; color: var(--theme-secondary);">LocalStorage Database Monitor</h3>
                <span class="pill-status-active" style="font-size: 0.7rem;">Active Locally</span>
              </div>
              
              <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--theme-border); border-radius: 8px; padding: 12px; margin-bottom: 14px; font-size: 0.78rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="color: var(--theme-text-muted);">Storage Driver:</span>
                  <span style="color: #FFF; font-weight: 600;">HTML5 LocalStorage</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="color: var(--theme-text-muted);">Local Cache Size:</span>
                  <span style="color: var(--theme-primary); font-weight: 700;">${db.getStorageStats().sizeKb} KB</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--theme-text-muted);">Stored Records:</span>
                  <span style="color: #FFF; font-weight: 600;">${db.getVendors().length} Vendors • ${db.getSubscriptionPlans().length} Plans</span>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="btn-pill active" id="btn-export-backup" style="justify-content: center; padding: 8px;">
                  <span>📥 Export Complete Database JSON</span>
                </button>

                <div>
                  <input type="file" id="input-restore-file" accept=".json" style="display: none;" />
                  <button class="btn-pill" id="btn-trigger-restore" style="width: 100%; justify-content: center; padding: 8px;">
                    <span>📤 Restore from Backup JSON File</span>
                  </button>
                </div>

                <div>
                  <button class="btn-pill" id="btn-reset-defaults" style="width: 100%; justify-content: center; padding: 8px; color: #EF4444; border-color: rgba(239,68,68,0.3);">
                    <span>⚠️ Reset to Demo Seed Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Firebase Cloud Realtime Database Configuration (Admin Exclusive) -->
          <div class="bento-card" style="margin-bottom: 20px;">
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 10px;">
              <div>
                <h3 style="font-size: 1.1rem; color: #F59E0B; display: flex; align-items: center; gap: 8px;">
                  <span>🔥</span> Firebase Realtime Database Cloud Sync
                </h3>
                <div style="font-size: 0.78rem; color: var(--theme-text-muted); margin-top: 2px;">
                  Admin Exclusive: Connect Firebase Realtime Database for live cloud syncing alongside LocalStorage persistence.
                </div>
              </div>
              <div>
                <span class="${(db.isFirebaseReady || db.isFirebaseConnected) ? 'pill-status-active' : 'pill-status-pending'}" id="admin-fb-status-pill" style="font-size: 0.75rem; padding: 4px 10px;">
                  ${(db.isFirebaseReady || db.isFirebaseConnected) ? '🟢 Cloud Connected' : '🟡 Offline (LocalStorage Only)'}
                </span>
              </div>
            </div>

            <form id="form-firebase-config">
              <div class="bento-grid bento-grid-2" style="margin-bottom: 14px;">
                <div class="form-group">
                  <label class="form-label">Firebase Database URL</label>
                  <input type="text" class="form-input" id="fb-databaseURL" placeholder="https://your-app-default-rtdb.firebaseio.com" value="${settings.firebaseConfig?.databaseURL || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">API Key</label>
                  <input type="text" class="form-input" id="fb-apiKey" placeholder="AIzaSy..." value="${settings.firebaseConfig?.apiKey || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Project ID</label>
                  <input type="text" class="form-input" id="fb-projectId" placeholder="your-app-id" value="${settings.firebaseConfig?.projectId || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Auth Domain</label>
                  <input type="text" class="form-input" id="fb-authDomain" placeholder="your-app.firebaseapp.com" value="${settings.firebaseConfig?.authDomain || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Storage Bucket</label>
                  <input type="text" class="form-input" id="fb-storageBucket" placeholder="your-app.appspot.com" value="${settings.firebaseConfig?.storageBucket || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Messaging Sender ID</label>
                  <input type="text" class="form-input" id="fb-messagingSenderId" placeholder="1079367774104" value="${settings.firebaseConfig?.messagingSenderId || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">App ID</label>
                  <input type="text" class="form-input" id="fb-appId" placeholder="1:123456789:web:abcdef" value="${settings.firebaseConfig?.appId || ''}" />
                </div>
              </div>

              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <button type="submit" class="btn-submit-primary" style="max-width: 240px;">
                  <span>Save & Connect Firebase</span>
                  <span>🔥</span>
                </button>
                <button type="button" class="btn-pill active" id="btn-test-firebase" style="padding: 8px 14px;">
                  <span>🔄 Sync LocalStorage ⇄ Cloud Now</span>
                </button>
                <button type="button" class="btn-pill" id="btn-disconnect-firebase" style="padding: 8px 14px; color: #EF4444;">
                  <span>🔌 Disconnect Cloud</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modal: Admin Edit Vendor & Security (Full Control Over All vCard Content) -->
      <div class="modal-overlay" id="modal-admin-edit-vendor">
        <div class="modal-card" style="max-width: 680px; max-height: 85vh; overflow-y: auto;">
          <div class="modal-header">
            <h3 class="modal-title">⚙️ Full vCard & Security Editor (Admin Master Control)</h3>
            <button class="btn-modal-close" data-close-modal="modal-admin-edit-vendor">×</button>
          </div>
          <form id="form-admin-edit-vendor">
            <input type="hidden" id="edit-v-id" />

            <!-- 1. Core Branding & Identity -->
            <div style="margin-bottom: 14px;">
              <h4 style="font-size: 0.92rem; color: var(--theme-primary); margin-bottom: 8px;">1. Business Identity & Theme</h4>
              <div class="bento-grid bento-grid-2">
                <div class="form-group">
                  <label class="form-label">Business Name</label>
                  <input type="text" class="form-input" id="edit-v-name" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Owner Name</label>
                  <input type="text" class="form-input" id="edit-v-owner" required />
                </div>
              </div>
              <div class="bento-grid bento-grid-2">
                <div class="form-group">
                  <label class="form-label">Category Badge</label>
                  <input type="text" class="form-input" id="edit-v-category" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Business Tagline</label>
                  <input type="text" class="form-input" id="edit-v-tagline" />
                </div>
              </div>
              <div class="bento-grid bento-grid-2">
                <div class="form-group">
                  <label class="form-label">Avatar Emoji / Icon</label>
                  <input type="text" class="form-input" id="edit-v-emoji" />
                </div>
                <div class="form-group">
                  <label class="form-label">Theme Preset</label>
                  <select class="form-select" id="edit-v-theme">
                    ${["Sunset Dark", "Peach Cream", "Glamour Red", "Emerald Green", "Ocean Blue", "Flipkart Blue", "Custom"].map(t => `
                      <option value="${t}">${t}</option>
                    `).join("")}
                  </select>
                </div>
              </div>
            </div>

            <!-- 2. Security & Official Order Routing (Admin Exclusive) -->
            <div style="background: rgba(212,255,0,0.04); border: 1px solid rgba(212,255,0,0.25); border-radius: 8px; padding: 14px; margin-bottom: 14px;">
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--theme-primary); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                <span>🔒</span> Security & Official Order Routing (Admin Control Only)
              </div>
              <div class="bento-grid bento-grid-2">
                <div class="form-group">
                  <label class="form-label">Official WhatsApp Number (Locked for Vendor)</label>
                  <input type="text" class="form-input" id="edit-v-whatsapp" required style="border-color: rgba(16,185,129,0.5);" />
                  <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-top: 3px;">
                    All customer quotes and orders route to this number.
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Vendor Login Password (for Logo Long-Press)</label>
                  <input type="text" class="form-input" id="edit-v-password" required style="border-color: rgba(212,255,0,0.5);" />
                  <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-top: 3px;">
                    Vendor holds logo for 1.5s and enters this password.
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. Contact & Location Information -->
            <div style="margin-bottom: 14px;">
              <h4 style="font-size: 0.92rem; color: var(--theme-secondary); margin-bottom: 8px;">2. Contact & Location Coordinates</h4>
              <div class="bento-grid bento-grid-2">
                <div class="form-group">
                  <label class="form-label">Direct Phone</label>
                  <input type="text" class="form-input" id="edit-v-phone" />
                </div>
                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-input" id="edit-v-email" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Physical Location Address</label>
                <input type="text" class="form-input" id="edit-v-location" />
              </div>
              <div class="bento-grid bento-grid-2">
                <div class="form-group">
                  <label class="form-label">Google Maps Directions URL</label>
                  <input type="text" class="form-input" id="edit-v-mapUrl" />
                </div>
                <div class="form-group">
                  <label class="form-label">Website URL</label>
                  <input type="text" class="form-input" id="edit-v-website" />
                </div>
              </div>
            </div>

            <!-- 4. About Narrative & Operational Hours -->
            <div style="margin-bottom: 14px;">
              <h4 style="font-size: 0.92rem; color: #FFF; margin-bottom: 8px;">3. About Story & Operating Hours</h4>
              <div class="form-group">
                <label class="form-label">About Tagline / Motto</label>
                <input type="text" class="form-input" id="edit-v-aboutTagline" />
              </div>
              <div class="form-group">
                <label class="form-label">About Story & Detailed Description</label>
                <textarea class="form-textarea" id="edit-v-aboutDesc" rows="3"></textarea>
              </div>
              <div class="bento-grid bento-grid-3">
                <div class="form-group">
                  <label class="form-label">Established Year</label>
                  <input type="number" class="form-input" id="edit-v-aboutYear" />
                </div>
                <div class="form-group">
                  <label class="form-label">Operating Hours</label>
                  <input type="text" class="form-input" id="edit-v-openHours" />
                </div>
                <div class="form-group">
                  <label class="form-label">Base Fee (${currency})</label>
                  <input type="number" class="form-input" id="edit-v-consultationFee" />
                </div>
              </div>
            </div>

            <!-- 5. Announcement & Promotional Banner -->
            <div style="margin-bottom: 14px;">
              <h4 style="font-size: 0.92rem; color: #F59E0B; margin-bottom: 8px;">4. Announcements & Offers</h4>
              <div class="form-group">
                <label class="form-label">Announcement Marquee Ticker</label>
                <textarea class="form-textarea" id="edit-v-marquee" rows="2"></textarea>
              </div>
              <div class="bento-grid bento-grid-2">
                <div class="form-group">
                  <label class="form-label">Promo Title</label>
                  <input type="text" class="form-input" id="edit-v-promoTitle" />
                </div>
                <div class="form-group">
                  <label class="form-label">Promo Badge</label>
                  <input type="text" class="form-input" id="edit-v-promoBadge" />
                </div>
              </div>
              <div class="bento-grid bento-grid-2">
                <div class="form-group">
                  <label class="form-label">Promo Code</label>
                  <input type="text" class="form-input" id="edit-v-promoCode" />
                </div>
                <div class="form-group">
                  <label class="form-label">Discount Text</label>
                  <input type="text" class="form-input" id="edit-v-promoDiscount" />
                </div>
              </div>
              <div class="form-group">
                <label class="switch-label">
                  <input type="checkbox" class="switch-input" id="edit-v-promoEnabled" />
                  <span class="switch-slider"></span>
                  <span>Enable Promo Banner on Home Tab</span>
                </label>
              </div>
            </div>

            <!-- 6. Subscription & Status -->
            <div style="margin-bottom: 14px;">
              <h4 style="font-size: 0.92rem; color: #10B981; margin-bottom: 8px;">5. Account Status & Subscription</h4>
              <div class="bento-grid bento-grid-3">
                <div class="form-group">
                  <label class="form-label">Subscription Plan</label>
                  <select class="form-select" id="edit-v-plan">
                    ${db.getSubscriptionPlans().map(p => `
                      <option value="${p.id}">${p.name} (${Number(p.price) === 0 ? 'FREE' : `${currency}${p.price}`})</option>
                    `).join("")}
                  </select>
                  <button type="button" class="btn-pill" id="btn-edit-assign-demo" style="margin-top: 6px; font-size: 0.72rem; color: var(--theme-primary); border-color: rgba(212,255,0,0.35); width: 100%;">
                    🎁 Assign 3-Day Free Demo
                  </button>
                </div>
                <div class="form-group">
                  <label class="form-label">Expiry Date</label>
                  <input type="date" class="form-input" id="edit-v-expiry" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="edit-v-status">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 6. vCard Tabs & Granted Features -->
            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--theme-border); border-radius: 8px; padding: 14px; margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                <h4 style="font-size: 0.92rem; color: var(--theme-primary); margin: 0; display: flex; align-items: center; gap: 6px;">
                  <span>📑</span> 6. vCard Tabs & Granted Features (Admin Access Control)
                </h4>
                <button type="button" class="btn-pill" id="btn-edit-apply-plan-feats" style="font-size: 0.7rem; color: var(--theme-primary); border-color: rgba(212,255,0,0.35); padding: 2px 8px;">
                  ⚡ Sync from Selected Plan
                </button>
              </div>
              <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-bottom: 10px;">
                Features are granted based on package chosen. Admin can freely override any feature below for this specific business.
              </div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <label class="switch-label" style="opacity: 0.85;">
                  <input type="checkbox" class="switch-input" id="edit-feat-home" checked disabled />
                  <span class="switch-slider"></span>
                  <span><strong>Home Tab</strong> — Default (Always Active)</span>
                </label>

                <label class="switch-label">
                  <input type="checkbox" class="switch-input" id="edit-feat-quote" />
                  <span class="switch-slider"></span>
                  <span><strong>Services Tab</strong> (Quote Builder & Selection)</span>
                </label>

                <label class="switch-label">
                  <input type="checkbox" class="switch-input" id="edit-feat-shop" />
                  <span class="switch-slider"></span>
                  <span><strong>Shop Tab</strong> (E-Commerce Catalog & Cart)</span>
                </label>

                <label class="switch-label">
                  <input type="checkbox" class="switch-input" id="edit-feat-booking" />
                  <span class="switch-slider"></span>
                  <span><strong>Book Appointment Tab</strong> (Calendar Scheduling)</span>
                </label>

                <label class="switch-label">
                  <input type="checkbox" class="switch-input" id="edit-feat-reviews" />
                  <span class="switch-slider"></span>
                  <span><strong>Reviews Tab</strong> (Customer Ratings & Testimonials)</span>
                </label>

                <label class="switch-label">
                  <input type="checkbox" class="switch-input" id="edit-feat-pwa" />
                  <span class="switch-slider"></span>
                  <span><strong>PWA Web App Installation</strong></span>
                </label>

                <label class="switch-label">
                  <input type="checkbox" class="switch-input" id="edit-feat-leadform" />
                  <span class="switch-slider"></span>
                  <span><strong>Lead Form Builder</strong> (Custom Popup & WhatsApp Leads)</span>
                </label>
              </div>
            </div>

            <button type="submit" class="btn-submit-primary" style="margin-top: 10px; padding: 14px;">
              <span>Save Complete vCard Changes</span>
              <span>💾</span>
            </button>
          </form>
        </div>
      </div>

      <!-- Modal: Admin Manage Vendor Services -->
      <div class="modal-overlay" id="modal-admin-services">
        <div class="modal-card" style="max-width: 640px;">
          <div class="modal-header">
            <h3 class="modal-title">📋 Services: <span id="admin-srv-vendor-name" style="color: var(--theme-primary);"></span></h3>
            <button class="btn-modal-close" data-close-modal="modal-admin-services">×</button>
          </div>
          <input type="hidden" id="admin-srv-vendor-id" />
          
          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 0.85rem; color: var(--theme-text-muted);">Admin Service Catalog Editor</span>
              <button class="btn-pill active" id="btn-admin-add-srv-toggle" style="font-size: 0.75rem; padding: 4px 10px;">+ Add Service</button>
            </div>

            <!-- Admin Inline Add Service Form -->
            <div id="admin-add-srv-panel" style="display: none; background: rgba(255,255,255,0.03); border: 1px solid var(--theme-border); border-radius: 8px; padding: 14px; margin-bottom: 14px;">
              <h5 style="font-size: 0.88rem; color: var(--theme-primary); margin-bottom: 10px;">Add New Service for this Business</h5>
              <div class="bento-grid bento-grid-2">
                <div class="form-group">
                  <label class="form-label">Service Name</label>
                  <input type="text" class="form-input" id="admin-new-srv-name" placeholder="e.g. Wedding Reception Full Catering" />
                </div>
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <input type="text" class="form-input" id="admin-new-srv-cat" placeholder="e.g. Buffet / Styling / Consultation" />
                </div>
              </div>
              <button type="button" class="btn-pill active" id="btn-admin-save-new-srv">Save New Service</button>
            </div>

            <!-- Services List Container -->
            <div id="admin-services-list-container" style="max-height: 380px; overflow-y: auto;">
              <!-- Dynamic Rows -->
            </div>
          </div>
        </div>
      </div>

      <!-- Modal: Admin Manage Vendor Products -->
      <div class="modal-overlay" id="modal-admin-products">
        <div class="modal-card" style="max-width: 680px; max-height: 85vh; overflow-y: auto;">
          <div class="modal-header">
            <h3 class="modal-title">🛍️ Products: <span id="admin-prod-vendor-name" style="color: #10B981;"></span></h3>
            <button class="btn-modal-close" data-close-modal="modal-admin-products">×</button>
          </div>
          <input type="hidden" id="admin-prod-vendor-id" />
          
          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 0.85rem; color: var(--theme-text-muted);">Admin Product Catalog & Inventory</span>
              <button class="btn-pill active" id="btn-admin-add-prod-toggle" style="font-size: 0.75rem; padding: 4px 10px;">+ Add Product</button>
            </div>

            <!-- Admin Inline Add Product Form -->
            <div id="admin-add-prod-panel" style="display: none; background: rgba(255,255,255,0.03); border: 1px solid var(--theme-border); border-radius: 8px; padding: 14px; margin-bottom: 14px;">
              <h5 style="font-size: 0.88rem; color: #10B981; margin-bottom: 10px;">Add New Product for this Vendor</h5>
              <div class="bento-grid bento-grid-2">
                <div class="form-group">
                  <label class="form-label">Product Name</label>
                  <input type="text" class="form-input" id="admin-new-prod-name" placeholder="e.g. Royal Dessert Platter" />
                </div>
                <div class="form-group">
                  <label class="form-label">Emoji / Icon</label>
                  <input type="text" class="form-input" id="admin-new-prod-emoji" value="🛍️" />
                </div>
              </div>
              <div class="bento-grid bento-grid-2">
                <div class="form-group">
                  <label class="form-label">Price (${currency})</label>
                  <input type="number" class="form-input" id="admin-new-prod-price" placeholder="250" />
                </div>
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <input type="text" class="form-input" id="admin-new-prod-category" placeholder="e.g. Desserts, Spices, Meals" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Unit Type (e.g. pack, box, kg, plate)</label>
                <input type="text" class="form-input" id="admin-new-prod-unit" placeholder="e.g. pack, box, kg, plate" />
              </div>
              <button type="button" class="btn-pill active" id="btn-admin-save-new-prod">Save Product</button>
            </div>

            <!-- Products List Container -->
            <div id="admin-products-list-container" style="max-height: 380px; overflow-y: auto;">
              <!-- Dynamic Rows -->
            </div>
          </div>
        </div>
      </div>

      <!-- Modal: Admin Manage Vendor Bookings -->
      <div class="modal-overlay" id="modal-admin-bookings">
        <div class="modal-card" style="max-width: 720px; max-height: 85vh; overflow-y: auto;">
          <div class="modal-header">
            <h3 class="modal-title">📅 Bookings: <span id="admin-bkg-vendor-name" style="color: #00E5FF;"></span></h3>
            <button class="btn-modal-close" data-close-modal="modal-admin-bookings">×</button>
          </div>
          <input type="hidden" id="admin-bkg-vendor-id" />
          
          <div style="margin-bottom: 16px;">
            <div style="font-size: 0.85rem; color: var(--theme-text-muted); margin-bottom: 12px;">
              Admin Booking Moderation & Schedule Management
            </div>

            <!-- Bookings List Container -->
            <div id="admin-bookings-list-container" style="max-height: 420px; overflow-y: auto;">
              <!-- Dynamic Rows -->
            </div>
          </div>
        </div>
      </div>

      <!-- Modal: Admin Manage Vendor Reviews -->
      <div class="modal-overlay" id="modal-admin-reviews">
        <div class="modal-card" style="max-width: 680px; max-height: 85vh; overflow-y: auto;">
          <div class="modal-header">
            <h3 class="modal-title">★ Reviews: <span id="admin-rev-vendor-name" style="color: #F59E0B;"></span></h3>
            <button class="btn-modal-close" data-close-modal="modal-admin-reviews">×</button>
          </div>
          <input type="hidden" id="admin-rev-vendor-id" />
          
          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 0.85rem; color: var(--theme-text-muted);">Admin Review Moderation & Testimonials</span>
              <button class="btn-pill active" id="btn-admin-add-rev-toggle" style="font-size: 0.75rem; padding: 4px 10px;">+ Add Testimonial</button>
            </div>

            <!-- Admin Inline Add Review Form -->
            <div id="admin-add-rev-panel" style="display: none; background: rgba(255,255,255,0.03); border: 1px solid var(--theme-border); border-radius: 8px; padding: 14px; margin-bottom: 14px;">
              <h5 style="font-size: 0.88rem; color: #F59E0B; margin-bottom: 10px;">Add Verified Review for this Vendor</h5>
              <div class="bento-grid bento-grid-2">
                <div class="form-group">
                  <label class="form-label">Reviewer Author Name</label>
                  <input type="text" class="form-input" id="admin-new-rev-author" placeholder="e.g. Corporate Client" />
                </div>
                <div class="form-group">
                  <label class="form-label">Star Rating</label>
                  <select class="form-select" id="admin-new-rev-rating">
                    <option value="5">★★★★★ (5 Stars)</option>
                    <option value="4">★★★★☆ (4 Stars)</option>
                    <option value="3">★★★☆☆ (3 Stars)</option>
                    <option value="2">★★☆☆☆ (2 Stars)</option>
                    <option value="1">★☆☆☆☆ (1 Star)</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Review Text</label>
                <textarea class="form-textarea" id="admin-new-rev-content" rows="2" placeholder="Write feedback content"></textarea>
              </div>
              <button type="button" class="btn-pill active" id="btn-admin-save-new-rev">Save Review</button>
            </div>

            <!-- Reviews List Container -->
            <div id="admin-reviews-list-container" style="max-height: 400px; overflow-y: auto;">
              <!-- Dynamic Rows -->
            </div>
          </div>
        </div>
      </div>

      <!-- Modal: Add / Edit Subscription Plan (Admin Package Governance) -->
      <div class="modal-overlay" id="modal-admin-plan">
        <div class="modal-card" style="max-width: 520px; max-height: 85vh; overflow-y: auto;">
          <div class="modal-header">
            <h3 class="modal-title" id="admin-plan-modal-title">Edit Subscription Plan</h3>
            <button class="btn-modal-close" data-close-modal="modal-admin-plan">×</button>
          </div>
          <form id="form-admin-plan">
            <input type="hidden" id="plan-id" />
            <div class="form-group">
              <label class="form-label">Package / Plan Name</label>
              <input type="text" class="form-input" id="plan-name" required placeholder="e.g. 3-Day Free Demo" />
            </div>
            <div class="bento-grid bento-grid-2">
              <div class="form-group">
                <label class="form-label">Price (${currency}) (0 = Free)</label>
                <input type="number" class="form-input" id="plan-price" required min="0" value="0" />
              </div>
              <div class="form-group">
                <label class="form-label">Validity Duration (Days)</label>
                <input type="number" class="form-input" id="plan-days" required min="1" value="3" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Package Description</label>
              <textarea class="form-textarea" id="plan-desc" rows="2" required placeholder="Describe what is included in this package"></textarea>
            </div>
            <div style="margin-top: 10px; margin-bottom: 14px; border-top: 1px solid var(--theme-border); padding-top: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label class="form-label" style="margin-bottom: 0;">Tick Features Included in this Package</label>
              </div>
              <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-bottom: 8px;">
                Cards deployed under this package will inherit these ticked features by default (admin can still override anytime).
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <label class="switch-label" style="font-size: 0.78rem;">
                  <input type="checkbox" class="switch-input" id="plan-feat-quote" checked />
                  <span class="switch-slider"></span>
                  <span>📋 Quote Builder (Services)</span>
                </label>
                <label class="switch-label" style="font-size: 0.78rem;">
                  <input type="checkbox" class="switch-input" id="plan-feat-shop" checked />
                  <span class="switch-slider"></span>
                  <span>🛍️ E-Commerce Shop (Products)</span>
                </label>
                <label class="switch-label" style="font-size: 0.78rem;">
                  <input type="checkbox" class="switch-input" id="plan-feat-cal" checked />
                  <span class="switch-slider"></span>
                  <span>📅 Booking Calendar (Appointments)</span>
                </label>
                <label class="switch-label" style="font-size: 0.78rem;">
                  <input type="checkbox" class="switch-input" id="plan-feat-review" checked />
                  <span class="switch-slider"></span>
                  <span>⭐ Customer Reviews & Rating</span>
                </label>
                <label class="switch-label" style="font-size: 0.78rem;">
                  <input type="checkbox" class="switch-input" id="plan-feat-promo" checked />
                  <span class="switch-slider"></span>
                  <span>🏷️ Promo Banner (Home)</span>
                </label>
                <label class="switch-label" style="font-size: 0.78rem;">
                  <input type="checkbox" class="switch-input" id="plan-feat-pwa" checked />
                  <span class="switch-slider"></span>
                  <span>📱 PWA Web App Installation</span>
                </label>
                <label class="switch-label" style="font-size: 0.78rem;">
                  <input type="checkbox" class="switch-input" id="plan-feat-leadform" checked />
                  <span class="switch-slider"></span>
                  <span>📝 Lead Form Builder</span>
                </label>
              </div>
            </div>
            <button type="submit" class="btn-submit-primary" style="padding: 12px;">
              <span id="btn-plan-submit-text">Save Plan Settings</span>
              <span>💾</span>
            </button>
          </form>
        </div>
      </div>

      <!-- Modal: Share & Bio Link Generator (For Admin to give clean link to business owners & social media) -->
      <div class="modal-overlay" id="modal-admin-share-vcard">
        <div class="modal-card" style="max-width: 520px; padding: 24px 20px;">
          <div class="modal-header">
            <h3 class="modal-title">🔗 Shareable Web App & Bio Link</h3>
            <button class="btn-modal-close" data-close-modal="modal-admin-share-vcard">×</button>
          </div>
          
          <div style="margin-bottom: 16px;">
            <div style="font-size: 0.95rem; font-weight: 700; color: #FFF; margin-bottom: 2px;" id="share-modal-biz-name">Business Name</div>
            <div style="font-size: 0.75rem; color: var(--theme-text-muted);" id="share-modal-owner-info">Owner • Category</div>
          </div>

          <!-- Clean Direct URL -->
          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label">Official Customer Web App URL (Clean Standalone Link)</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" class="form-input" id="share-modal-url" readonly style="font-size: 0.8rem; font-family: monospace; color: var(--theme-primary); background: rgba(0,0,0,0.4);" />
              <button type="button" class="btn-pill active" id="btn-copy-vcard-url" style="white-space: nowrap; padding: 6px 14px; font-weight: 700;">
                📋 Copy
              </button>
            </div>
            <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-top: 4px;">
              Direct link for customers. Clicking Back will never land them in the Admin portal.
            </div>
          </div>

          <!-- Instagram & Social Bio Link Snippet -->
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label">📸 Social Media / Instagram Bio Ready Snippet</label>
            <textarea class="form-textarea" id="share-modal-bio-snippet" rows="2" readonly style="font-size: 0.8rem; background: rgba(0,0,0,0.4);"></textarea>
            <button type="button" class="btn-pill" id="btn-copy-vcard-bio" style="margin-top: 6px; width: 100%; justify-content: center; font-size: 0.78rem; color: #00E5FF; border-color: rgba(0,229,255,0.4);">
              📸 Copy for Instagram Bio
            </button>
          </div>

          <!-- Direct WhatsApp Dispatch to Vendor -->
          <div style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); border-radius: 10px; padding: 14px; margin-bottom: 18px;">
            <div style="font-size: 0.82rem; font-weight: 700; color: #10B981; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>💬</span> Send Live Link to Business Owner via WhatsApp
            </div>
            <p style="font-size: 0.75rem; color: #CBD5E1; line-height: 1.4; margin-bottom: 10px;">
              Send the live vCard Web App link and installation instructions directly to the business owner on their WhatsApp number.
            </p>
            <button type="button" class="btn-submit-primary" id="btn-send-link-whatsapp" style="padding: 10px; font-size: 0.82rem; background: #10B981; color: #000;">
              <span>Send Link to Owner on WhatsApp 💬 ↗</span>
            </button>
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <a href="#" target="_blank" rel="noopener" class="btn-pill" id="btn-share-modal-preview" style="text-decoration: none;">
              Open Web App ↗
            </a>
            <button type="button" class="btn-pill" data-close-modal="modal-admin-share-vcard">
              Done
            </button>
          </div>
        </div>
      </div>

      <!-- Modal: 1-Click Package / Plan Assignment -->
      <div class="modal-overlay" id="modal-admin-assign-plan">
        <div class="modal-card" style="max-width: 560px; max-height: 85vh; overflow-y: auto; padding: 24px 20px;">
          <div class="modal-header">
            <h3 class="modal-title">💳 1-Click Assign Subscription Package</h3>
            <button class="btn-modal-close" data-close-modal="modal-admin-assign-plan">×</button>
          </div>
          
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--theme-border); border-radius: 10px; padding: 12px 14px; margin-bottom: 16px;">
            <div style="font-size: 1rem; font-weight: 800; color: #FFF;" id="assign-plan-modal-biz-name">Business Name</div>
            <div style="font-size: 0.78rem; color: var(--theme-text-muted); margin-top: 2px;" id="assign-plan-modal-details">Owner • Current Plan • Expiry</div>
          </div>

          <div style="font-size: 0.82rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; margin-bottom: 10px;">
            Select Package to Activate Instantly:
          </div>

          <div id="assign-plan-modal-list" style="display: flex; flex-direction: column; gap: 10px;">
            <!-- Rendered dynamically -->
          </div>

          <div style="margin-top: 16px; text-align: right;">
            <button type="button" class="btn-pill" data-close-modal="modal-admin-assign-plan">Cancel</button>
          </div>
        </div>
      </div>
    `;

    this.bindDashboardEvents();
  }

  getFilteredVendors() {
    let vendors = db.getVendors();
    const now = new Date();

    // 1. Lifecycle / Status filter
    if (this.vendorFilterStatus === "active") {
      vendors = vendors.filter(v => v.status === "active" && new Date(v.expiresAt) >= now);
    } else if (this.vendorFilterStatus === "expiring-7d") {
      vendors = vendors.filter(v => {
        const diffMs = new Date(v.expiresAt) - now;
        const daysLeft = diffMs / (1000 * 60 * 60 * 24);
        return daysLeft >= 0 && daysLeft <= 7;
      });
    } else if (this.vendorFilterStatus === "expired") {
      vendors = vendors.filter(v => new Date(v.expiresAt) < now || v.status === "expired");
    } else if (this.vendorFilterStatus === "suspended") {
      vendors = vendors.filter(v => v.status === "suspended");
    }

    // 2. Business Category filter
    if (this.vendorFilterCategory && this.vendorFilterCategory !== "all") {
      vendors = vendors.filter(v => 
        (v.branding?.category || "").toLowerCase() === this.vendorFilterCategory.toLowerCase()
      );
    }

    // 3. Search query filter
    if (this.vendorFilterQuery) {
      const q = this.vendorFilterQuery.toLowerCase();
      vendors = vendors.filter(v => 
        (v.branding?.businessName || "").toLowerCase().includes(q) ||
        (v.branding?.ownerName || "").toLowerCase().includes(q) ||
        (v.branding?.category || "").toLowerCase().includes(q) ||
        (v.slug || "").toLowerCase().includes(q)
      );
    }

    return vendors;
  }

  renderVendorCards() {
    const vendors = this.getFilteredVendors();
    const plans = db.getSubscriptionPlans();
    const currency = db.getPlatformSettings()?.currencySymbol || "₹";

    if (vendors.length === 0) {
      return `<div style="text-align: center; color: var(--theme-text-muted); padding: 32px 16px; background: rgba(255,255,255,0.02); border-radius: 14px; border: 1px dashed var(--theme-border);">No matching vendors found.</div>`;
    }

    return vendors.map((v, idx) => {
      const expiryDate = new Date(v.expiresAt);
      const isExpired = expiryDate < new Date();
      const diffMs = expiryDate - new Date();
      const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const isExpiringSoon = !isExpired && daysLeft <= 7;
      const currentPlan = plans.find(p => p.id === v.planId);

      return `
        <div class="admin-vendor-card ${isExpiringSoon ? 'card-expiring-soon' : ''}" data-vendor-id="${v.id}">
          <div class="vendor-card-header">
            <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
              <div class="vendor-card-avatar ${idx % 2 === 1 ? 'accent-orange' : ''}">
                ${v.branding?.avatarEmoji || '🏢'}
              </div>
              <div class="vendor-card-identity" style="min-width: 0;">
                <div class="vendor-card-name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${v.branding?.businessName}</div>
                <div class="vendor-card-subtitle">${v.branding?.ownerName} • ${v.branding?.category}</div>
                <div class="vendor-card-phone">📱 ${v.contacts?.whatsapp || v.contacts?.phone || 'No Phone'} • 🔑 ${v.password || v.pin || '2026'}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
              ${isExpiringSoon ? `
                <span style="background: rgba(245,158,11,0.2); color: #F59E0B; border: 1px solid rgba(245,158,11,0.4); font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 4px;">
                  ⏳ EXPIRING SOON
                </span>
              ` : ''}
              ${v.status === 'suspended' ? `
                <span class="pill-status-suspended" style="background: rgba(239,68,68,0.2); color: #EF4444; border: 1px solid rgba(239,68,68,0.4); font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 4px;">
                  ⏸️ SUSPENDED
                </span>
              ` : (isExpired ? `
                <span class="pill-status-suspended" style="background: rgba(245,158,11,0.2); color: #F59E0B; border: 1px solid rgba(245,158,11,0.4); font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 4px;">
                  ⚠️ EXPIRED
                </span>
              ` : `
                <span class="pill-status-active" style="font-size: 0.68rem; padding: 2px 8px;">
                  ✓ ACTIVE
                </span>
              `)}
            </div>
          </div>

          <div class="vendor-plan-line" style="margin: 10px 0 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span style="color: #A78BFA; font-weight: 700; font-size: 0.8rem;">
                  💳 Plan: <strong style="color: #FFFFFF;">${currentPlan?.name || v.planId}</strong>
                </span>

                <!-- 1-Click Package Quick-Assign Selector directly on card -->
                <div style="display: inline-flex; align-items: center; gap: 4px;">
                  <span style="font-size: 0.72rem; color: #94A3B8; font-weight: 600;">⚡ Quick Assign:</span>
                  <select class="form-select quick-assign-plan-select" data-assign-plan-vendor="${v.id}" style="padding: 2px 8px; font-size: 0.72rem; width: auto; height: 26px; border-radius: 6px; background: rgba(0,0,0,0.6); border: 1px solid rgba(167, 139, 250, 0.4); color: #A78BFA; font-weight: 600; cursor: pointer;">
                    <option value="" disabled selected>Select Plan ▾</option>
                    ${plans.map(p => `
                      <option value="${p.id}" ${p.id === v.planId ? 'style="font-weight: bold; color: #22C55E;"' : ''}>
                        ${p.name} (${p.durationDays}d • ${p.price > 0 ? `${currency}${p.price}` : 'Free'})${p.id === v.planId ? ' ✓ (Current)' : ''}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div>
                ${isExpired ? `
                  <span style="background: rgba(239,68,68,0.2); color: #EF4444; border: 1px solid rgba(239,68,68,0.4); font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px;">
                    ⚠️ EXPIRED (${expiryDate.toLocaleDateString()})
                  </span>
                ` : isExpiringSoon ? `
                  <span style="background: rgba(245,158,11,0.2); color: #F59E0B; border: 1px solid rgba(245,158,11,0.4); font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px;">
                    ⏳ EXPIRES IN ${daysLeft} DAYS (${expiryDate.toLocaleDateString()})
                  </span>
                ` : `
                  <span style="color: #94A3B8; font-size: 0.72rem;">
                    ⏳ Expires: ${expiryDate.toLocaleDateString()} (${daysLeft}d left)
                  </span>
                `}
              </div>
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--theme-border); border-radius: 8px; padding: 8px 12px; margin: 10px 0;">
            <div style="font-size: 0.72rem; color: #94A3B8; font-weight: 700; margin-bottom: 6px; text-transform: uppercase;">
              vCard Tabs & Granted Features:
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
              <span class="tab-grant-badge locked" title="Home is always active">🏠 Home: Default</span>
              <button type="button" class="tab-grant-badge ${v.features?.quoteBuilder !== false ? 'granted' : 'revoked'}" data-quick-toggle-tab="quoteBuilder" data-v-id="${v.id}" title="Click to Grant/Revoke Services Tab">
                📋 Services: ${v.features?.quoteBuilder !== false ? 'ON' : 'OFF'}
              </button>
              <button type="button" class="tab-grant-badge ${v.features?.ecommerceShop !== false ? 'granted' : 'revoked'}" data-quick-toggle-tab="ecommerceShop" data-v-id="${v.id}" title="Click to Grant/Revoke Shop Tab">
                🛍️ Shop: ${v.features?.ecommerceShop !== false ? 'ON' : 'OFF'}
              </button>
              <button type="button" class="tab-grant-badge ${v.features?.calendarBooking !== false ? 'granted' : 'revoked'}" data-quick-toggle-tab="calendarBooking" data-v-id="${v.id}" title="Click to Grant/Revoke Book Appointment Tab">
                📅 Book: ${v.features?.calendarBooking !== false ? 'ON' : 'OFF'}
              </button>
              <button type="button" class="tab-grant-badge ${v.features?.customerReviews !== false ? 'granted' : 'revoked'}" data-quick-toggle-tab="customerReviews" data-v-id="${v.id}" title="Click to Grant/Revoke Reviews Tab">
                ⭐ Reviews: ${v.features?.customerReviews !== false ? 'ON' : 'OFF'}
              </button>
              <button type="button" class="tab-grant-badge ${v.features?.pwaInstall !== false ? 'granted' : 'revoked'}" data-quick-toggle-tab="pwaInstall" data-v-id="${v.id}" title="Click to Grant/Revoke PWA Web App Installation">
                📱 PWA: ${v.features?.pwaInstall !== false ? 'ON' : 'OFF'}
              </button>
              <button type="button" class="tab-grant-badge ${v.features?.leadForm !== false ? 'granted' : 'revoked'}" data-quick-toggle-tab="leadForm" data-v-id="${v.id}" title="Click to Grant/Revoke Lead Form Builder">
                📝 Lead Form: ${v.features?.leadForm !== false ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div class="vendor-actions-grid">
            <button class="btn-pill active" style="background: rgba(212,255,0,0.15); color: var(--theme-primary); border-color: rgba(212,255,0,0.45); font-weight: 700;" data-share-vendor="${v.id}" title="Copy Clean Link / Instagram Bio Link">🔗 Bio Link</button>
            <a href="?v=${v.slug}" target="_blank" rel="noopener" class="btn-pill" style="text-decoration: none;">Preview ↗</a>
            <button class="btn-pill" style="color: #A78BFA; border-color: rgba(167,139,250,0.4); font-weight: 700;" data-open-plan-modal="${v.id}" title="1-Click Assign Any Package">💳 Assign Plan</button>
            <button class="btn-pill" style="color: var(--theme-secondary);" data-edit-vendor="${v.id}">⚙️ Edit Card</button>
            <button class="btn-pill" style="${v.features?.leadForm !== false ? 'color: #34D399; border-color: rgba(52,211,153,0.4);' : 'color: #64748B; opacity: 0.6; border-color: rgba(100,116,139,0.3);'}" data-manage-leads="${v.id}" title="${v.features?.leadForm !== false ? 'View Leads & Edit Lead Form' : 'Lead Form is turned OFF'}">
              📝 Leads ${v.features?.leadForm !== false ? `(${v.leads?.length || 0})` : '(OFF)'}
            </button>
            <button class="btn-pill" style="${v.features?.quoteBuilder !== false ? 'color: var(--theme-primary);' : 'color: #64748B; opacity: 0.6; border-color: rgba(100,116,139,0.3);'}" data-manage-services="${v.id}" title="${v.features?.quoteBuilder !== false ? 'Manage Services' : 'Services Tab is turned OFF'}">
              📋 Services ${v.features?.quoteBuilder !== false ? `(${v.services?.length || 0})` : '(OFF)'}
            </button>
            <button class="btn-pill" style="${v.features?.ecommerceShop !== false ? 'color: #10B981;' : 'color: #64748B; opacity: 0.6; border-color: rgba(100,116,139,0.3);'}" data-manage-products="${v.id}" title="${v.features?.ecommerceShop !== false ? 'Manage E-Commerce Catalog' : 'Shop Tab is turned OFF'}">
              🛍️ Products ${v.features?.ecommerceShop !== false ? `(${v.products?.length || 0})` : '(OFF)'}
            </button>
            <button class="btn-pill" style="${v.features?.calendarBooking !== false ? 'color: #00E5FF;' : 'color: #64748B; opacity: 0.6; border-color: rgba(100,116,139,0.3);'}" data-manage-bookings="${v.id}" title="${v.features?.calendarBooking !== false ? 'Manage Bookings' : 'Bookings Tab is turned OFF'}">
              📅 Bookings ${v.features?.calendarBooking !== false ? `(${v.bookings?.length || 0})` : '(OFF)'}
            </button>
            <button class="btn-pill" style="${v.features?.customerReviews !== false ? 'color: #F59E0B;' : 'color: #64748B; opacity: 0.6; border-color: rgba(100,116,139,0.3);'}" data-manage-reviews="${v.id}" title="${v.features?.customerReviews !== false ? 'Manage Customer Reviews' : 'Reviews Tab is turned OFF'}">
              ★ Reviews ${v.features?.customerReviews !== false ? `(${v.reviews?.length || 0})` : '(OFF)'}
            </button>
            <button class="btn-pill active" data-manage-vendor="${v.id}">🔐 Console</button>
            <button class="btn-pill" style="color: var(--theme-primary); border-color: rgba(212,255,0,0.3);" data-assign-demo="${v.id}" title="Assign 3-Day Free Demo">🎁 3d Demo</button>
            <button class="btn-pill" style="${v.status === 'suspended' ? 'background: rgba(16,185,129,0.15); color: #10B981; border-color: rgba(16,185,129,0.45); font-weight: 700;' : 'color: #F87171; border-color: rgba(248,113,113,0.4);'}" data-toggle-suspend="${v.id}">${v.status === 'suspended' ? '▶️ Activate' : '⏸️ Suspend'}</button>
            <button class="btn-pill" data-extend-expiry="${v.id}">+30d</button>
            <button class="btn-pill" style="color: #EF4444; border-color: rgba(239,68,68,0.3);" data-del-vendor="${v.id}">🗑️ Delete</button>
          </div>
        </div>
      `;
    }).join("");
  }

  async assignPlanToVendor(vendorId, planId) {
    const v = db.getVendor(vendorId);
    const plan = db.getSubscriptionPlans().find(p => p.id === planId);
    if (!v || !plan) return;

    v.planId = plan.id;
    v.status = "active";
    const days = Number(plan.durationDays) || 30;
    v.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    // Auto-grant feature modules associated with the assigned plan
    if (plan.features) {
      v.features = {
        quoteBuilder: plan.features.quoteBuilder !== false,
        ecommerceShop: plan.features.ecommerceShop !== false,
        calendarBooking: plan.features.calendarBooking !== false,
        customerReviews: plan.features.customerReviews !== false,
        promoBanner: plan.features.promoBanner !== false,
        pwaInstall: plan.features.pwaInstall !== false,
        leadForm: plan.features.leadForm !== false
      };
    }

    await db.saveVendor(v);
    window.OmniApp.showToast(`⚡ Assigned "${plan.name}" (${days}d) to ${v.branding.businessName}! Features updated.`);
    this.renderDashboard();
  }

  openAssignPlanModal(vendorId) {
    const v = db.getVendor(vendorId);
    if (!v) {
      window.OmniApp?.showToast("Vendor not found.");
      return;
    }
    const modal = this.container.querySelector("#modal-admin-assign-plan") || document.getElementById("modal-admin-assign-plan");
    if (!modal) {
      console.error("modal-admin-assign-plan element not found");
      return;
    }

    const currency = db.getPlatformSettings()?.currencySymbol || "₹";
    const plans = db.getSubscriptionPlans();
    const expiryDate = new Date(v.expiresAt);
    const diffMs = expiryDate - new Date();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const isExpired = expiryDate < new Date();

    modal.querySelector("#assign-plan-modal-biz-name").textContent = v.branding?.businessName || v.id;
    modal.querySelector("#assign-plan-modal-details").innerHTML = `
      <span>👤 ${v.branding?.ownerName || 'Owner'}</span> • 
      <span style="color: #A78BFA; font-weight: 700;">Current Plan: ${v.planId}</span> • 
      <span style="color: ${isExpired ? '#EF4444' : '#94A3B8'}; font-weight: 600;">
        ${isExpired ? '⚠️ Expired' : `⏳ ${daysLeft} days left`}
      </span>
    `;

    const listEl = modal.querySelector("#assign-plan-modal-list");
    listEl.innerHTML = plans.map(plan => {
      const isCurrent = plan.id === v.planId;
      const isFree = plan.price === 0 || plan.id === "plan-demo";
      const priceDisplay = isFree ? "FREE TRIAL" : `${currency}${plan.price}`;

      return `
        <div style="background: rgba(255,255,255,0.02); border: 1.5px solid ${isCurrent ? 'var(--theme-primary)' : 'var(--theme-border)'}; border-radius: 10px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.95rem; font-weight: 800; color: #FFF;">${plan.name}</span>
              ${isCurrent ? '<span style="font-size: 0.65rem; background: var(--theme-primary); color: #000; font-weight: 800; padding: 1px 6px; border-radius: 4px;">CURRENT</span>' : ''}
            </div>
            <div style="font-size: 0.8rem; color: #A78BFA; font-weight: 700; margin-top: 2px;">
              ${priceDisplay} • ${plan.durationDays} Days Validity
            </div>
            <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-top: 4px;">
              ${plan.description || ''}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
              ${plan.features?.quoteBuilder !== false ? '<span style="font-size: 0.68rem; color: #10B981;">✓ Services</span>' : ''}
              ${plan.features?.ecommerceShop !== false ? '<span style="font-size: 0.68rem; color: #10B981;">✓ Shop</span>' : ''}
              ${plan.features?.calendarBooking !== false ? '<span style="font-size: 0.68rem; color: #10B981;">✓ Booking</span>' : ''}
              ${plan.features?.customerReviews !== false ? '<span style="font-size: 0.68rem; color: #10B981;">✓ Reviews</span>' : ''}
              ${plan.features?.pwaInstall !== false ? '<span style="font-size: 0.68rem; color: #10B981;">✓ PWA</span>' : ''}
              ${plan.features?.leadForm !== false ? '<span style="font-size: 0.68rem; color: #10B981;">✓ Lead Form</span>' : ''}
            </div>
          </div>
          <div>
            <button type="button" class="btn-submit-primary" data-confirm-assign-plan="${plan.id}" data-confirm-vendor="${v.id}" style="padding: 8px 14px; font-size: 0.8rem; white-space: nowrap;">
              <span>${isCurrent ? '⚡ Re-Activate Plan' : '⚡ 1-Click Activate'}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll("[data-confirm-assign-plan]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const pId = btn.getAttribute("data-confirm-assign-plan");
        const vId = btn.getAttribute("data-confirm-vendor");
        modal.classList.remove("active");
        if (!document.querySelector(".modal-overlay.active")) {
          document.body.classList.remove("has-modal-open");
        }
        await this.assignPlanToVendor(vId, pId);
      });
    });

    modal.classList.add("active");
    document.body.classList.add("has-modal-open");
  }

  refreshVendorsList() {
    const cardList = this.container.querySelector("#admin-vendors-card-list");
    if (cardList) cardList.innerHTML = this.renderVendorCards();
    const tbody = this.container.querySelector("#admin-vendors-tbody");
    if (tbody) tbody.innerHTML = this.renderVendorTableRows();
    this.bindVendorActionButtons();
  }

  renderVendorTableRows() {
    const currency = db.getPlatformSettings()?.currencySymbol || "₹";
    const vendors = this.getFilteredVendors();

    if (vendors.length === 0) {
      return `<tr><td colspan="4" style="text-align: center; color: var(--theme-text-muted);">No matching vendors found.</td></tr>`;
    }

    return vendors.map(v => {
      const expiryDate = new Date(v.expiresAt);
      const isExpired = expiryDate < new Date();
      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.4rem;">${v.branding.avatarEmoji || '🏢'}</span>
              <div>
                <div style="font-weight: 700; color: #FFF;">${v.branding.businessName}</div>
                <div style="font-size: 0.72rem; color: var(--theme-text-muted);">
                  ${v.branding.ownerName} • ${v.branding.category}
                </div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span>Plan: ${v.planId}</span>
              ${v.planId === 'plan-demo' ? '<span class="pill-status-active" style="font-size: 0.65rem; background: rgba(212,255,0,0.15); color: var(--theme-primary); border-color: rgba(212,255,0,0.4); padding: 1px 6px;">🎁 3-Day Demo</span>' : ''}
            </div>
            <div style="font-size: 0.72rem; color: var(--theme-secondary);">🔑 Password: <b>${v.password || v.pin || '2026'}</b></div>
            <div style="font-size: 0.72rem; color: #10B981;">💬 WhatsApp: <b>${v.contacts.whatsapp || 'None'}</b></div>
            <div style="font-size: 0.72rem; color: ${isExpired ? '#EF4444' : 'var(--theme-text-muted)'};">
              Expires: ${expiryDate.toLocaleDateString()} ${isExpired ? '(EXPIRED)' : ''}
            </div>
          </td>
          <td>
            ${v.status === 'suspended' ? `
              <span class="pill-status-suspended" style="background: rgba(239,68,68,0.2); color: #EF4444; border: 1px solid rgba(239,68,68,0.4); font-size: 0.68rem; font-weight: 800; padding: 2px 7px; border-radius: 4px;">
                ⏸️ SUSPENDED
              </span>
            ` : (isExpired ? `
              <span class="pill-status-suspended" style="background: rgba(245,158,11,0.2); color: #F59E0B; border: 1px solid rgba(245,158,11,0.4); font-size: 0.68rem; font-weight: 800; padding: 2px 7px; border-radius: 4px;">
                ⚠️ EXPIRED
              </span>
            ` : `
              <span class="pill-status-active" style="font-size: 0.68rem; padding: 2px 7px;">
                ✓ ACTIVE
              </span>
            `)}
          </td>
          <td>
            <div class="vendor-action-cluster">
              <button class="btn-pill active" style="padding: 3px 8px; font-size: 0.72rem; background: rgba(212,255,0,0.15); color: var(--theme-primary); border-color: rgba(212,255,0,0.45); font-weight: 700;" data-share-vendor="${v.id}" title="Copy Clean Link / Instagram Bio Link">🔗 Bio Link</button>
              <a href="?v=${v.slug}" target="_blank" class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem;">Preview ↗</a>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: #A78BFA; border-color: rgba(167,139,250,0.4); font-weight: 700;" data-open-plan-modal="${v.id}" title="1-Click Assign Any Package">💳 Assign Plan</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: var(--theme-secondary);" data-edit-vendor="${v.id}">⚙️ Edit Card</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; ${v.features?.leadForm !== false ? 'color: #34D399; border-color: rgba(52,211,153,0.4);' : 'color: #64748B; opacity: 0.6; border-color: rgba(100,116,139,0.3);'}" data-manage-leads="${v.id}" title="${v.features?.leadForm !== false ? 'View Leads & Edit Lead Form' : 'Lead Form is turned OFF'}">📝 Leads ${v.features?.leadForm !== false ? `(${v.leads?.length || 0})` : '(OFF)'}</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; ${v.features?.quoteBuilder !== false ? 'color: var(--theme-primary);' : 'color: #64748B; opacity: 0.6; border-color: rgba(100,116,139,0.3);'}" data-manage-services="${v.id}" title="${v.features?.quoteBuilder !== false ? 'Manage Services' : 'Services Tab is turned OFF'}">📋 Services ${v.features?.quoteBuilder !== false ? `(${v.services?.length || 0})` : '(OFF)'}</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; ${v.features?.ecommerceShop !== false ? 'color: #10B981;' : 'color: #64748B; opacity: 0.6; border-color: rgba(100,116,139,0.3);'}" data-manage-products="${v.id}" title="${v.features?.ecommerceShop !== false ? 'Manage E-Commerce Catalog' : 'Shop Tab is turned OFF'}">🛍️ Products ${v.features?.ecommerceShop !== false ? `(${v.products?.length || 0})` : '(OFF)'}</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; ${v.features?.calendarBooking !== false ? 'color: #00E5FF;' : 'color: #64748B; opacity: 0.6; border-color: rgba(100,116,139,0.3);'}" data-manage-bookings="${v.id}" title="${v.features?.calendarBooking !== false ? 'Manage Bookings' : 'Bookings Tab is turned OFF'}">📅 Bookings ${v.features?.calendarBooking !== false ? `(${v.bookings?.length || 0})` : '(OFF)'}</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; ${v.features?.customerReviews !== false ? 'color: #F59E0B;' : 'color: #64748B; opacity: 0.6; border-color: rgba(100,116,139,0.3);'}" data-manage-reviews="${v.id}" title="${v.features?.customerReviews !== false ? 'Manage Customer Reviews' : 'Reviews Tab is turned OFF'}">★ Reviews ${v.features?.customerReviews !== false ? `(${v.reviews?.length || 0})` : '(OFF)'}</button>
              <button class="btn-pill active" style="padding: 3px 8px; font-size: 0.72rem;" data-manage-vendor="${v.id}">🔐 Manage Console</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: var(--theme-primary); border-color: rgba(212,255,0,0.3);" data-assign-demo="${v.id}" title="Assign 3-Day Free Demo (Sets expiry to +3 days from today)">🎁 3d Demo</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; ${v.status === 'suspended' ? 'color: #10B981; border-color: rgba(16,185,129,0.4); font-weight: 700;' : 'color: #F87171; border-color: rgba(248,113,113,0.4);'}" data-toggle-suspend="${v.id}">
                ${v.status === 'suspended' ? '▶️ Activate' : '⏸️ Suspend'}
              </button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem;" data-extend-expiry="${v.id}">+30d</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: #EF4444;" data-del-vendor="${v.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  bindDashboardEvents() {
    // Logout
    this.container.querySelector("#btn-admin-logout")?.addEventListener("click", () => {
      this.isAuthenticated = false;
      this.renderLoginForm();
    });

    // Tab Switching
    this.container.querySelectorAll(".portal-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-atab");
        this.activeTab = tab;
        this.renderDashboard();
      });
    });

    // Lifecycle & Expiry Filter chips
    this.container.querySelectorAll("[data-admin-status-filter]").forEach(chip => {
      chip.addEventListener("click", () => {
        this.vendorFilterStatus = chip.getAttribute("data-admin-status-filter");
        this.renderDashboard();
      });
    });

    // Business Category filter
    const catFilter = this.container.querySelector("#admin-vendor-category-filter");
    if (catFilter) {
      catFilter.addEventListener("change", (e) => {
        this.vendorFilterCategory = e.target.value;
        this.refreshVendorsList();
      });
    }

    // KPI Cards: Click to Filter
    const kpiTotal = this.container.querySelector("#kpi-card-total");
    if (kpiTotal) {
      kpiTotal.addEventListener("click", () => {
        this.activeTab = "vendors";
        this.vendorFilterStatus = "all";
        this.renderDashboard();
      });
    }
    const kpiActive = this.container.querySelector("#kpi-card-active");
    if (kpiActive) {
      kpiActive.addEventListener("click", () => {
        this.activeTab = "vendors";
        this.vendorFilterStatus = "active";
        this.renderDashboard();
      });
    }
    const kpiExpiring = this.container.querySelector("#kpi-card-expiring-7d");
    if (kpiExpiring) {
      kpiExpiring.addEventListener("click", () => {
        this.activeTab = "vendors";
        this.vendorFilterStatus = "expiring-7d";
        this.renderDashboard();
      });
    }
    const kpiExpired = this.container.querySelector("#kpi-card-expired");
    if (kpiExpired) {
      kpiExpired.addEventListener("click", () => {
        this.activeTab = "vendors";
        this.vendorFilterStatus = "expired";
        this.renderDashboard();
      });
    }

    // Search input
    const searchInput = this.container.querySelector("#admin-vendor-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.vendorFilterQuery = e.target.value.trim();
        this.refreshVendorsList();
      });
    }

    this.bindVendorActionButtons();

    // Preset selector for Create New Card
    const presetSelect = this.container.querySelector("#new-preset-select");
    if (presetSelect) {
      presetSelect.addEventListener("change", (e) => {
        this.applyPreset(e.target.value);
      });
    }

    // Auto-update features when changing plan in Create Vendor form
    const newPlanSelect = this.container.querySelector("#new-v-plan");
    if (newPlanSelect) {
      newPlanSelect.addEventListener("change", (e) => {
        const plan = db.getSubscriptionPlans().find(p => p.id === e.target.value);
        if (plan && plan.features) {
          if (this.container.querySelector("#toggle-feat-quote")) this.container.querySelector("#toggle-feat-quote").checked = plan.features.quoteBuilder !== false;
          if (this.container.querySelector("#toggle-feat-shop")) this.container.querySelector("#toggle-feat-shop").checked = plan.features.ecommerceShop !== false;
          if (this.container.querySelector("#toggle-feat-booking")) this.container.querySelector("#toggle-feat-booking").checked = plan.features.calendarBooking !== false;
          if (this.container.querySelector("#toggle-feat-reviews")) this.container.querySelector("#toggle-feat-reviews").checked = plan.features.customerReviews !== false;
          if (this.container.querySelector("#toggle-feat-promo")) this.container.querySelector("#toggle-feat-promo").checked = plan.features.promoBanner !== false;
          if (this.container.querySelector("#toggle-feat-pwa")) this.container.querySelector("#toggle-feat-pwa").checked = plan.features.pwaInstall !== false;
          if (this.container.querySelector("#toggle-feat-leadform")) this.container.querySelector("#toggle-feat-leadform").checked = plan.features.leadForm !== false;
          window.OmniApp.showToast(`Applied features from '${plan.name}' (override anytime below)`);
        }
      });
    }

    const quickDemoBtn = this.container.querySelector("#btn-quick-demo-plan");
    if (quickDemoBtn && newPlanSelect) {
      quickDemoBtn.addEventListener("click", () => {
        newPlanSelect.value = "plan-demo";
        newPlanSelect.dispatchEvent(new Event("change"));
      });
    }

    // Create Vendor Form
    const createForm = this.container.querySelector("#form-create-vendor");
    if (createForm) {
      createForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = this.container.querySelector("#new-v-name").value.trim();
        const slug = this.container.querySelector("#new-v-slug").value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
        const owner = this.container.querySelector("#new-v-owner").value.trim();
        const category = this.container.querySelector("#new-v-category").value.trim();
        const tagline = this.container.querySelector("#new-v-tagline").value.trim();
        const password = this.container.querySelector("#new-v-password")?.value.trim() || this.container.querySelector("#new-v-pin")?.value.trim() || "2026";
        const planId = this.container.querySelector("#new-v-plan").value;
        const whatsapp = this.container.querySelector("#new-v-whatsapp").value.trim();
        const phone = this.container.querySelector("#new-v-phone").value.trim();
        const email = this.container.querySelector("#new-v-email").value.trim();

        const plan = db.getSubscriptionPlans().find(p => p.id === planId);
        const days = plan ? plan.durationDays : 30;
        const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

        const newVendor = {
          id: slug,
          slug: slug,
          pin: password,
          password: password,
          status: "active",
          planId: planId,
          createdAt: new Date().toISOString(),
          expiresAt: expiry,
          verified: true,
          isOpen: true,
          openHours: "09:00 AM - 08:00 PM (Daily)",
          branding: {
            businessName: name,
            ownerName: owner,
            category: category,
            tagline: tagline,
            avatarEmoji: "🏢",
            theme: "Sunset Dark",
            colors: {
              primary: "#D4FF00",
              secondary: "#00E5FF",
              background: "#07090E",
              cardBg: "#0F131C"
            }
          },
          contacts: {
            phone: phone || whatsapp,
            whatsapp: whatsapp,
            email: email,
            location: "Main Street Business Center",
            mapUrl: "https://maps.google.com",
            website: ""
          },
          notices: {
            marquee: `Welcome to ${name}! Connect with us directly via WhatsApp.`,
            expiryNoticeHoursThreshold: 24
          },
          promo: {
            title: "Welcome Inaugural Discount",
            badge: "NEW CLIENT PASS",
            code: "WELCOME2026",
            discount: "Get 15% OFF on your first consultation or order.",
            enabled: true
          },
          about: {
            tagline: tagline,
            description: `${name} provides professional, reliable, and premium quality services tailored to client needs.`,
            consultationFee: 500,
            establishedYear: 2026,
            highlightStats: [
              { label: "Clients Served", value: "250+" },
              { label: "Rating", value: "5.0 ★" },
              { label: "Satisfaction", value: "100%" }
            ]
          },
          features: {
            quoteBuilder: this.container.querySelector("#toggle-feat-quote").checked,
            ecommerceShop: this.container.querySelector("#toggle-feat-shop").checked,
            calendarBooking: this.container.querySelector("#toggle-feat-booking").checked,
            customerReviews: this.container.querySelector("#toggle-feat-reviews").checked,
            promoBanner: this.container.querySelector("#toggle-feat-promo").checked,
            pwaInstall: this.container.querySelector("#toggle-feat-pwa").checked,
            leadForm: this.container.querySelector("#toggle-feat-leadform") ? this.container.querySelector("#toggle-feat-leadform").checked : true
          },
          leadForm: {
            enabled: true,
            title: "Request a Call Back",
            subtitle: "Fill this quick form and our team will get in touch with you right away.",
            buttonText: "Request Call Back",
            submitButtonText: "Request Call Back ⚡",
            buttonIcon: "⚡",
            fields: [
              { id: "fld-1", type: "text", label: "Full Name", placeholder: "Enter your full name", required: true, options: [] },
              { id: "fld-2", type: "phone", label: "Phone / WhatsApp", placeholder: "Your 10-digit number", required: true, options: [] },
              { id: "fld-3", type: "select", label: "Service / Requirement", placeholder: "Choose an option", required: false, options: ["Standard Consultation & Assessment", "Comprehensive Turnkey Package", "General Inquiry"] },
              { id: "fld-4", type: "date", label: "Preferred Date", placeholder: "Select date", required: false, options: [] },
              { id: "fld-5", type: "multiselect", label: "Preferences", placeholder: "Select options", required: false, options: ["Urgent Callback Needed", "Send Quotation First", "On-site Visit"] },
              { id: "fld-6", type: "textarea", label: "Message / Specific Requirements", placeholder: "Tell us more about what you need...", required: false, options: [] }
            ]
          },
          leads: [],
          services: [
            {
              id: "srv-demo-1",
              name: "Standard Consultation & Assessment",
              category: "General",
              description: "Full initial consultation, inquiry evaluation and planning.",
              visible: true
            },
            {
              id: "srv-demo-2",
              name: "Comprehensive Turnkey Package",
              category: "Premium",
              description: "End-to-end full service delivery with dedicated lead specialist.",
              visible: true
            }
          ],
          products: [
            {
              id: "prod-demo-1",
              name: "Starter Care & Supply Kit",
              price: 850,
              unit: "kit",
              emoji: "📦",
              description: "Essential supplies and curated materials.",
              visible: true
            }
          ],
          bookings: [],
          reviewTags: ["Punctual", "Expert Service", "Affordable", "Great Communication"],
          reviews: []
        };

        await db.saveVendor(newVendor);
        window.OmniApp.showToast("New smart card deployed successfully!");
        this.activeTab = "vendors";
        this.renderDashboard();
        this.openShareModal(newVendor.id);
      });
    }

    // Platform settings save
    const settingsForm = this.container.querySelector("#form-platform-settings");
    if (settingsForm) {
      settingsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await db.updatePlatformSettings({
          platformName: this.container.querySelector("#set-platformName").value.trim(),
          currencySymbol: this.container.querySelector("#set-currency").value.trim(),
          adminPin: this.container.querySelector("#set-adminPin").value.trim(),
          supportWhatsApp: this.container.querySelector("#set-supportWa").value.trim(),
          adminUpi: this.container.querySelector("#set-adminUpi")?.value.trim() || "7019601569@ybl"
        });
        window.OmniApp.showToast("Platform settings saved & synced to cloud! 🔥");
        this.renderDashboard();
      });
    }

    // Backup Export
    const exportBtn = this.container.querySelector("#btn-export-backup");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const json = db.exportBackupJson();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `omnicard-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        window.OmniApp.showToast("Backup JSON downloaded!");
      });
    }

    // Backup Restore Trigger
    const restoreTrigger = this.container.querySelector("#btn-trigger-restore");
    const fileInput = this.container.querySelector("#input-restore-file");
    if (restoreTrigger && fileInput) {
      restoreTrigger.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const res = await db.importBackupJson(text);
        if (res.success) {
          window.OmniApp.showToast("Database restored successfully!");
          this.renderDashboard();
        } else {
          window.OmniApp.showToast("Restore failed: " + res.error);
        }
      });
    }

    // Reset to defaults
    const resetBtn = this.container.querySelector("#btn-reset-defaults");
    if (resetBtn) {
      resetBtn.addEventListener("click", async () => {
        if (confirm("Reset entire platform to default demo dataset? All custom additions will be reverted.")) {
          await db.resetToDefaults();
          window.OmniApp.showToast("Platform reset to demo seed state.");
          this.renderDashboard();
        }
      });
    }

    // Add Plan Modal Trigger
    const addPlanBtn = this.container.querySelector("#btn-add-plan");
    if (addPlanBtn) {
      addPlanBtn.addEventListener("click", () => {
        this.container.querySelector("#modal-add-plan")?.classList.add("active");
      });
    }

    const formNewPlan = this.container.querySelector("#form-new-plan");
    if (formNewPlan) {
      formNewPlan.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newPlan = {
          id: "plan-" + Date.now(),
          name: this.container.querySelector("#plan-name").value.trim(),
          price: Number(this.container.querySelector("#plan-price").value || 0),
          durationDays: Number(this.container.querySelector("#plan-days").value || 30),
          description: this.container.querySelector("#plan-desc").value.trim(),
          features: {
            quoteBuilder: true,
            ecommerceShop: true,
            calendarBooking: true,
            customerReviews: true,
            promoBanner: true,
            pwaInstall: true
          }
        };
        await db.saveSubscriptionPlan(newPlan);
        this.container.querySelector("#modal-add-plan")?.classList.remove("active");
        window.OmniApp.showToast("Subscription plan created!");
        this.renderDashboard();
      });
    }

    this.container.querySelectorAll("[data-del-plan]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del-plan");
        await db.deleteSubscriptionPlan(id);
        window.OmniApp.showToast("Plan deleted.");
        this.renderDashboard();
      });
    });

    // Firebase Config Save (Admin Exclusive)
    const fbForm = this.container.querySelector("#form-firebase-config");
    if (fbForm) {
      fbForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const conf = {
          databaseURL: this.container.querySelector("#fb-databaseURL").value.trim(),
          apiKey: this.container.querySelector("#fb-apiKey").value.trim(),
          projectId: this.container.querySelector("#fb-projectId").value.trim(),
          authDomain: this.container.querySelector("#fb-authDomain").value.trim(),
          storageBucket: this.container.querySelector("#fb-storageBucket").value.trim(),
          messagingSenderId: this.container.querySelector("#fb-messagingSenderId")?.value.trim() || "",
          appId: this.container.querySelector("#fb-appId").value.trim()
        };
        const res = await db.updateFirebaseConfig(conf);
        window.OmniApp.showToast(res.message || "Firebase configuration saved.");
        this.renderDashboard();
      });
    }

    // Firebase Test Sync
    const testFbBtn = this.container.querySelector("#btn-test-firebase");
    if (testFbBtn) {
      testFbBtn.addEventListener("click", async () => {
        const res = await db.testFirebaseSync();
        if (res.success) {
          window.OmniApp.showToast(res.message);
        } else {
          window.OmniApp.showToast("Cloud sync failed: " + res.error);
        }
        this.renderDashboard();
      });
    }

    // Firebase Disconnect
    const discFbBtn = this.container.querySelector("#btn-disconnect-firebase");
    if (discFbBtn) {
      discFbBtn.addEventListener("click", () => {
        if (confirm("Disconnect Firebase cloud sync and revert to LocalStorage only?")) {
          db.disconnectFirebase();
          window.OmniApp.showToast("Firebase cloud sync disconnected. Running in LocalStorage mode.");
          this.renderDashboard();
        }
      });
    }

    // Admin Edit Vendor Form (Saves All vCard Content)
    const editVendorForm = this.container.querySelector("#form-admin-edit-vendor");
    if (editVendorForm) {
      editVendorForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const vId = this.container.querySelector("#edit-v-id").value;
        const v = db.getVendor(vId);
        if (!v) return;

        // 1. Branding & Identity
        v.branding.businessName = this.container.querySelector("#edit-v-name").value.trim();
        v.branding.ownerName = this.container.querySelector("#edit-v-owner").value.trim();
        v.branding.category = this.container.querySelector("#edit-v-category").value.trim();
        v.branding.tagline = this.container.querySelector("#edit-v-tagline").value.trim();
        v.branding.avatarEmoji = this.container.querySelector("#edit-v-emoji").value.trim() || "🏢";
        v.branding.theme = this.container.querySelector("#edit-v-theme").value;
        v.status = this.container.querySelector("#edit-v-status").value;
        
        // 2. Admin Security & Official WhatsApp (Exclusive to Admin)
        v.contacts.whatsapp = this.container.querySelector("#edit-v-whatsapp").value.trim();
        const pwd = this.container.querySelector("#edit-v-password").value.trim() || "2026";
        v.password = pwd;
        v.pin = pwd;

        // 3. Contacts & Coordinates
        v.contacts.phone = this.container.querySelector("#edit-v-phone").value.trim();
        v.contacts.email = this.container.querySelector("#edit-v-email").value.trim();
        v.contacts.location = this.container.querySelector("#edit-v-location").value.trim();
        v.contacts.mapUrl = this.container.querySelector("#edit-v-mapUrl").value.trim();
        v.contacts.website = this.container.querySelector("#edit-v-website").value.trim();

        // 4. About Narrative & Hours
        if (!v.about) v.about = {};
        v.about.tagline = this.container.querySelector("#edit-v-aboutTagline").value.trim();
        v.about.description = this.container.querySelector("#edit-v-aboutDesc").value.trim();
        v.about.establishedYear = Number(this.container.querySelector("#edit-v-aboutYear").value || 2020);
        v.about.consultationFee = Number(this.container.querySelector("#edit-v-consultationFee").value || 0);
        v.openHours = this.container.querySelector("#edit-v-openHours").value.trim();

        // 5. Announcements & Promo Offers
        if (!v.notices) v.notices = {};
        v.notices.marquee = this.container.querySelector("#edit-v-marquee").value.trim();
        if (!v.promo) v.promo = {};
        v.promo.title = this.container.querySelector("#edit-v-promoTitle").value.trim();
        v.promo.badge = this.container.querySelector("#edit-v-promoBadge").value.trim();
        v.promo.code = this.container.querySelector("#edit-v-promoCode").value.trim();
        v.promo.discount = this.container.querySelector("#edit-v-promoDiscount").value.trim();
        v.promo.enabled = this.container.querySelector("#edit-v-promoEnabled").checked;

        // 6. Subscription Plan & Expiry
        v.planId = this.container.querySelector("#edit-v-plan").value;
        const expiryVal = this.container.querySelector("#edit-v-expiry").value;
        if (expiryVal) {
          v.expiresAt = new Date(expiryVal + "T23:59:59.000Z").toISOString();
        }
        // 7. vCard Tabs & Feature Access Grants
        if (!v.features) v.features = {};
        v.features.home = true;
        const editQuoteEl = this.container.querySelector("#edit-feat-quote");
        const editShopEl = this.container.querySelector("#edit-feat-shop");
        const editBkgEl = this.container.querySelector("#edit-feat-booking");
        const editRevEl = this.container.querySelector("#edit-feat-reviews");
        const editPwaEl = this.container.querySelector("#edit-feat-pwa");
        const editLeadEl = this.container.querySelector("#edit-feat-leadform");
        if (editQuoteEl) v.features.quoteBuilder = editQuoteEl.checked;
        if (editShopEl) v.features.ecommerceShop = editShopEl.checked;
        if (editBkgEl) v.features.calendarBooking = editBkgEl.checked;
        if (editRevEl) v.features.customerReviews = editRevEl.checked;
        if (editPwaEl) v.features.pwaInstall = editPwaEl.checked;
        if (editLeadEl) v.features.leadForm = editLeadEl.checked;

        await db.saveVendor(v);
        this.container.querySelector("#modal-admin-edit-vendor")?.classList.remove("active");
        window.OmniApp.showToast(`Updated '${v.branding.businessName}' & all card texts successfully!`);
        this.renderDashboard();
      });
    }

    // Sync features from selected plan in Edit Vendor modal
    const editPlanSelect = this.container.querySelector("#edit-v-plan");
    const applyPlanFeatsBtn = this.container.querySelector("#btn-edit-apply-plan-feats");
    if (applyPlanFeatsBtn && editPlanSelect) {
      applyPlanFeatsBtn.addEventListener("click", () => {
        const plan = db.getSubscriptionPlans().find(p => p.id === editPlanSelect.value);
        if (plan && plan.features) {
          if (this.container.querySelector("#edit-feat-quote")) this.container.querySelector("#edit-feat-quote").checked = plan.features.quoteBuilder !== false;
          if (this.container.querySelector("#edit-feat-shop")) this.container.querySelector("#edit-feat-shop").checked = plan.features.ecommerceShop !== false;
          if (this.container.querySelector("#edit-feat-booking")) this.container.querySelector("#edit-feat-booking").checked = plan.features.calendarBooking !== false;
          if (this.container.querySelector("#edit-feat-reviews")) this.container.querySelector("#edit-feat-reviews").checked = plan.features.customerReviews !== false;
          if (this.container.querySelector("#edit-feat-pwa")) this.container.querySelector("#edit-feat-pwa").checked = plan.features.pwaInstall !== false;
          if (this.container.querySelector("#edit-feat-leadform")) this.container.querySelector("#edit-feat-leadform").checked = plan.features.leadForm !== false;
          window.OmniApp.showToast(`Synced feature toggles to '${plan.name}' defaults (custom overrides preserved on save)`);
        }
      });
    }

    const editAssignDemoBtn = this.container.querySelector("#btn-edit-assign-demo");
    if (editAssignDemoBtn && editPlanSelect) {
      editAssignDemoBtn.addEventListener("click", () => {
        editPlanSelect.value = "plan-demo";
        const demoPlan = db.getSubscriptionPlans().find(p => p.id === "plan-demo");
        const days = demoPlan ? demoPlan.durationDays : 3;
        const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        if (this.container.querySelector("#edit-v-expiry")) {
          this.container.querySelector("#edit-v-expiry").value = targetDate.toISOString().substring(0, 10);
        }
        const statusSelect = this.container.querySelector("#edit-v-status");
        if (statusSelect) statusSelect.value = "active";
        applyPlanFeatsBtn?.click();
        window.OmniApp.showToast(`Applied ${demoPlan?.name || "3-Day Free Demo"}! Expiry set to ${targetDate.toLocaleDateString()}.`);
      });
    }

    // Admin Manage Services Toggle Add Panel
    const toggleAddSrvBtn = this.container.querySelector("#btn-admin-add-srv-toggle");
    if (toggleAddSrvBtn) {
      toggleAddSrvBtn.addEventListener("click", () => {
        const panel = this.container.querySelector("#admin-add-srv-panel");
        if (panel) {
          panel.style.display = panel.style.display === "none" ? "block" : "none";
        }
      });
    }

    // Admin Save New Service for Vendor
    const saveNewSrvBtn = this.container.querySelector("#btn-admin-save-new-srv");
    if (saveNewSrvBtn) {
      saveNewSrvBtn.addEventListener("click", async () => {
        const vId = this.container.querySelector("#admin-srv-vendor-id").value;
        const name = this.container.querySelector("#admin-new-srv-name").value.trim();
        const cat = this.container.querySelector("#admin-new-srv-cat").value.trim() || "General";

        if (!name) {
          window.OmniApp.showToast("Please enter a service name.");
          return;
        }

        await db.addService(vId, { name, category: cat, description: "", visible: true });
        window.OmniApp.showToast("New service added for vendor!");
        this.container.querySelector("#admin-new-srv-name").value = "";
        this.container.querySelector("#admin-add-srv-panel").style.display = "none";
        this.renderAdminServicesList(vId);
        this.refreshVendorsList();
      });
    }

    // Admin Manage Products Toggle Add Panel
    const toggleAddProdBtn = this.container.querySelector("#btn-admin-add-prod-toggle");
    if (toggleAddProdBtn) {
      toggleAddProdBtn.addEventListener("click", () => {
        const panel = this.container.querySelector("#admin-add-prod-panel");
        if (panel) {
          panel.style.display = panel.style.display === "none" ? "block" : "none";
        }
      });
    }

    // Admin Save New Product for Vendor
    const saveNewProdBtn = this.container.querySelector("#btn-admin-save-new-prod");
    if (saveNewProdBtn) {
      saveNewProdBtn.addEventListener("click", async () => {
        const vId = this.container.querySelector("#admin-prod-vendor-id").value;
        const name = this.container.querySelector("#admin-new-prod-name").value.trim();
        const emoji = this.container.querySelector("#admin-new-prod-emoji").value.trim() || "🛍️";
        const price = Number(this.container.querySelector("#admin-new-prod-price").value || 0);
        const unit = this.container.querySelector("#admin-new-prod-unit").value.trim() || "unit";
        const category = this.container.querySelector("#admin-new-prod-category") ? this.container.querySelector("#admin-new-prod-category").value.trim() : "General";

        if (!name) {
          window.OmniApp.showToast("Please enter a product name.");
          return;
        }

        await db.addProduct(vId, { name, emoji, price, unit, category: category || "General", description: "", visible: true });
        window.OmniApp.showToast("New product added for vendor!");
        this.container.querySelector("#admin-new-prod-name").value = "";
        this.container.querySelector("#admin-new-prod-price").value = "";
        this.container.querySelector("#admin-new-prod-unit").value = "";
        if (this.container.querySelector("#admin-new-prod-category")) {
          this.container.querySelector("#admin-new-prod-category").value = "";
        }
        this.container.querySelector("#admin-add-prod-panel").style.display = "none";
        this.renderAdminProductsList(vId);
        this.refreshVendorsList();
      });
    }

    // Admin Manage Reviews Toggle Add Panel
    const toggleAddRevBtn = this.container.querySelector("#btn-admin-add-rev-toggle");
    if (toggleAddRevBtn) {
      toggleAddRevBtn.addEventListener("click", () => {
        const panel = this.container.querySelector("#admin-add-rev-panel");
        if (panel) {
          panel.style.display = panel.style.display === "none" ? "block" : "none";
        }
      });
    }

    // Admin Save New Review for Vendor
    const saveNewRevBtn = this.container.querySelector("#btn-admin-save-new-rev");
    if (saveNewRevBtn) {
      saveNewRevBtn.addEventListener("click", async () => {
        const vId = this.container.querySelector("#admin-rev-vendor-id").value;
        const author = this.container.querySelector("#admin-new-rev-author").value.trim();
        const rating = Number(this.container.querySelector("#admin-new-rev-rating").value || 5);
        const content = this.container.querySelector("#admin-new-rev-content").value.trim();

        if (!author) {
          window.OmniApp.showToast("Please provide author / client name.");
          return;
        }

        await db.addReview(vId, { author, rating, content: content || "" });
        window.OmniApp.showToast("New testimonial review added for vendor!");
        this.container.querySelector("#admin-new-rev-author").value = "";
        this.container.querySelector("#admin-new-rev-content").value = "";
        this.container.querySelector("#admin-add-rev-panel").style.display = "none";
        this.renderAdminReviewsList(vId);
        this.refreshVendorsList();
      });
    }


    // Auto-update expiry date when changing plan in Edit Vendor Modal
    if (editPlanSelect) {
      editPlanSelect.addEventListener("change", (e) => {
        const p = db.getSubscriptionPlans().find(plan => plan.id === e.target.value);
        if (p) {
          const targetDate = new Date(Date.now() + p.durationDays * 24 * 60 * 60 * 1000);
          const expiryInput = this.container.querySelector("#edit-v-expiry");
          if (expiryInput) {
            expiryInput.value = targetDate.toISOString().substring(0, 10);
          }
          window.OmniApp.showToast(`Selected ${p.name}: Expiry set to ${targetDate.toLocaleDateString()} (${p.durationDays} days).`);
        }
      });
    }

    // Open Add Plan Modal
    const btnAddPlan = this.container.querySelector("#btn-add-plan");
    if (btnAddPlan) {
      btnAddPlan.addEventListener("click", () => {
        const modal = this.container.querySelector("#modal-admin-plan");
        if (!modal) return;
        modal.querySelector("#admin-plan-modal-title").textContent = "Create New Subscription Plan";
        modal.querySelector("#plan-id").value = "";
        modal.querySelector("#plan-name").value = "";
        modal.querySelector("#plan-price").value = "0";
        modal.querySelector("#plan-days").value = "3";
        modal.querySelector("#plan-desc").value = "";
        modal.querySelector("#plan-feat-quote").checked = true;
        modal.querySelector("#plan-feat-shop").checked = true;
        modal.querySelector("#plan-feat-cal").checked = true;
        modal.querySelector("#plan-feat-review").checked = true;
        modal.querySelector("#plan-feat-promo").checked = true;
        modal.querySelector("#plan-feat-pwa").checked = true;
        if (modal.querySelector("#plan-feat-leadform")) modal.querySelector("#plan-feat-leadform").checked = true;
        modal.querySelector("#btn-plan-submit-text").textContent = "Create Plan";
        modal.classList.add("active");
      });
    }

    // Open Edit Plan Modal for each package
    this.container.querySelectorAll("[data-edit-plan]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit-plan");
        const plan = db.getSubscriptionPlans().find(p => p.id === id);
        if (!plan) return;
        const modal = this.container.querySelector("#modal-admin-plan");
        if (!modal) return;
        modal.querySelector("#admin-plan-modal-title").textContent = `Edit Package: ${plan.name}`;
        modal.querySelector("#plan-id").value = plan.id;
        modal.querySelector("#plan-name").value = plan.name;
        modal.querySelector("#plan-price").value = plan.price;
        modal.querySelector("#plan-days").value = plan.durationDays;
        modal.querySelector("#plan-desc").value = plan.description || "";
        modal.querySelector("#plan-feat-quote").checked = plan.features?.quoteBuilder !== false;
        modal.querySelector("#plan-feat-shop").checked = plan.features?.ecommerceShop !== false;
        modal.querySelector("#plan-feat-cal").checked = plan.features?.calendarBooking !== false;
        modal.querySelector("#plan-feat-review").checked = plan.features?.customerReviews !== false;
        modal.querySelector("#plan-feat-promo").checked = plan.features?.promoBanner !== false;
        modal.querySelector("#plan-feat-pwa").checked = plan.features?.pwaInstall !== false;
        if (modal.querySelector("#plan-feat-leadform")) modal.querySelector("#plan-feat-leadform").checked = plan.features?.leadForm !== false;
        modal.querySelector("#btn-plan-submit-text").textContent = "Save Package Changes";
        modal.classList.add("active");
      });
    });

    // Delete Plan with confirmation
    this.container.querySelectorAll("[data-del-plan]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del-plan");
        if (id === "plan-demo") {
          window.OmniApp.showToast("The default Demo Package cannot be deleted, but you can edit its validity and settings anytime.");
          return;
        }
        if (confirm(`Delete plan '${id}'? This cannot be undone.`)) {
          await db.deleteSubscriptionPlan(id);
          window.OmniApp.showToast("Plan deleted successfully.");
          this.renderDashboard();
        }
      });
    });

    // Submit Handler for Admin Plan Add/Edit
    const planForm = this.container.querySelector("#form-admin-plan");
    if (planForm) {
      planForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = this.container.querySelector("#plan-id").value.trim();
        const name = this.container.querySelector("#plan-name").value.trim();
        const price = Number(this.container.querySelector("#plan-price").value || 0);
        const durationDays = Number(this.container.querySelector("#plan-days").value || 3);
        const description = this.container.querySelector("#plan-desc").value.trim();
        const features = {
          quoteBuilder: this.container.querySelector("#plan-feat-quote").checked,
          ecommerceShop: this.container.querySelector("#plan-feat-shop").checked,
          calendarBooking: this.container.querySelector("#plan-feat-cal").checked,
          customerReviews: this.container.querySelector("#plan-feat-review").checked,
          promoBanner: this.container.querySelector("#plan-feat-promo").checked,
          pwaInstall: this.container.querySelector("#plan-feat-pwa").checked,
          leadForm: this.container.querySelector("#plan-feat-leadform") ? this.container.querySelector("#plan-feat-leadform").checked : true
        };

        const planId = id || `plan-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;
        await db.saveSubscriptionPlan({
          id: planId,
          name,
          price,
          durationDays,
          description,
          features
        });

        this.container.querySelector("#modal-admin-plan")?.classList.remove("active");
        window.OmniApp.showToast(`Saved package '${name}' (${durationDays} Days, ${price === 0 ? 'FREE' : price})!`);
        this.renderDashboard();
      });
    }

    // Close modals
    this.container.querySelectorAll("[data-close-modal]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-close-modal");
        const m = this.container.querySelector(`#${id}`) || document.getElementById(id);
        if (m) m.classList.remove("active");
        if (!document.querySelector(".modal-overlay.active")) {
          document.body.classList.remove("has-modal-open");
        }
      });
    });

    // Close on overlay backdrop click
    this.container.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.classList.remove("active");
          if (!document.querySelector(".modal-overlay.active")) {
            document.body.classList.remove("has-modal-open");
          }
        }
      });
    });
  }

  bindVendorActionButtons() {
    // Edit Vendor Card & Security Modal
    this.container.querySelectorAll("[data-edit-vendor]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit-vendor");
        const v = db.getVendor(id);
        if (!v) return;
        const modal = this.container.querySelector("#modal-admin-edit-vendor");
        if (modal) {
          modal.querySelector("#edit-v-id").value = v.id;
          modal.querySelector("#edit-v-name").value = v.branding.businessName || "";
          modal.querySelector("#edit-v-owner").value = v.branding.ownerName || "";
          modal.querySelector("#edit-v-category").value = v.branding.category || "";
          modal.querySelector("#edit-v-tagline").value = v.branding.tagline || "";
          modal.querySelector("#edit-v-emoji").value = v.branding.avatarEmoji || "🏢";
          modal.querySelector("#edit-v-theme").value = v.branding.theme || "Sunset Dark";
          modal.querySelector("#edit-v-status").value = v.status || "active";
          modal.querySelector("#edit-v-whatsapp").value = v.contacts.whatsapp || "";
          modal.querySelector("#edit-v-password").value = v.password || v.pin || "2026";
          modal.querySelector("#edit-v-plan").value = v.planId || "growth";
          modal.querySelector("#edit-v-expiry").value = v.expiresAt ? v.expiresAt.substring(0, 10) : "";
          modal.querySelector("#edit-v-phone").value = v.contacts.phone || "";
          modal.querySelector("#edit-v-email").value = v.contacts.email || "";
          modal.querySelector("#edit-v-location").value = v.contacts.location || "";
          modal.querySelector("#edit-v-mapUrl").value = v.contacts.mapUrl || "";
          modal.querySelector("#edit-v-website").value = v.contacts.website || "";
          modal.querySelector("#edit-v-aboutTagline").value = v.about?.tagline || "";
          modal.querySelector("#edit-v-aboutDesc").value = v.about?.description || "";
          modal.querySelector("#edit-v-aboutYear").value = v.about?.establishedYear || 2020;
          modal.querySelector("#edit-v-openHours").value = v.openHours || "09:00 AM - 08:00 PM";
          modal.querySelector("#edit-v-consultationFee").value = v.about?.consultationFee || 0;
          modal.querySelector("#edit-v-marquee").value = v.notices?.marquee || "";
          modal.querySelector("#edit-v-promoTitle").value = v.promo?.title || "";
          modal.querySelector("#edit-v-promoBadge").value = v.promo?.badge || "";
          modal.querySelector("#edit-v-promoCode").value = v.promo?.code || "";
          modal.querySelector("#edit-v-promoDiscount").value = v.promo?.discount || "";
          modal.querySelector("#edit-v-promoEnabled").checked = v.promo?.enabled !== false;
          if (!v.features) v.features = {};
          if (modal.querySelector("#edit-feat-quote")) modal.querySelector("#edit-feat-quote").checked = v.features.quoteBuilder !== false;
          if (modal.querySelector("#edit-feat-shop")) modal.querySelector("#edit-feat-shop").checked = v.features.ecommerceShop !== false;
          if (modal.querySelector("#edit-feat-booking")) modal.querySelector("#edit-feat-booking").checked = v.features.calendarBooking !== false;
          if (modal.querySelector("#edit-feat-reviews")) modal.querySelector("#edit-feat-reviews").checked = v.features.customerReviews !== false;
          if (modal.querySelector("#edit-feat-pwa")) modal.querySelector("#edit-feat-pwa").checked = v.features.pwaInstall !== false;
          if (modal.querySelector("#edit-feat-leadform")) modal.querySelector("#edit-feat-leadform").checked = v.features.leadForm !== false;
          modal.classList.add("active");
          document.body.classList.add("has-modal-open");
        }
      });
    });

    // Manage Services Modal for Vendor
    this.container.querySelectorAll("[data-manage-services]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-manage-services");
        const v = db.getVendor(id);
        if (!v) return;
        const modal = this.container.querySelector("#modal-admin-services");
        if (modal) {
          modal.querySelector("#admin-srv-vendor-id").value = v.id;
          modal.querySelector("#admin-srv-vendor-name").textContent = v.branding.businessName;
          modal.querySelector("#admin-add-srv-panel").style.display = "none";
          this.renderAdminServicesList(v.id);
          modal.classList.add("active");
          document.body.classList.add("has-modal-open");
        }
      });
    });

    // Manage Products Modal for Vendor
    this.container.querySelectorAll("[data-manage-products]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-manage-products");
        const v = db.getVendor(id);
        if (!v) return;
        const modal = this.container.querySelector("#modal-admin-products");
        if (modal) {
          modal.querySelector("#admin-prod-vendor-id").value = v.id;
          modal.querySelector("#admin-prod-vendor-name").textContent = v.branding.businessName;
          modal.querySelector("#admin-add-prod-panel").style.display = "none";
          this.renderAdminProductsList(v.id);
          modal.classList.add("active");
          document.body.classList.add("has-modal-open");
        }
      });
    });

    // Manage Bookings Modal for Vendor
    this.container.querySelectorAll("[data-manage-bookings]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-manage-bookings");
        const v = db.getVendor(id);
        if (!v) return;
        const modal = this.container.querySelector("#modal-admin-bookings");
        if (modal) {
          modal.querySelector("#admin-bkg-vendor-id").value = v.id;
          modal.querySelector("#admin-bkg-vendor-name").textContent = v.branding.businessName;
          this.renderAdminBookingsList(v.id);
          modal.classList.add("active");
          document.body.classList.add("has-modal-open");
        }
      });
    });

    // Manage Reviews Modal for Vendor
    this.container.querySelectorAll("[data-manage-reviews]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-manage-reviews");
        const v = db.getVendor(id);
        if (!v) return;
        const modal = this.container.querySelector("#modal-admin-reviews");
        if (modal) {
          modal.querySelector("#admin-rev-vendor-id").value = v.id;
          modal.querySelector("#admin-rev-vendor-name").textContent = v.branding.businessName;
          modal.querySelector("#admin-add-rev-panel").style.display = "none";
          this.renderAdminReviewsList(v.id);
          modal.classList.add("active");
          document.body.classList.add("has-modal-open");
        }
      });
    });

    // Admin Direct Impersonation / Manage as Vendor
    this.container.querySelectorAll("[data-manage-vendor]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-manage-vendor");
        window.OmniApp.adminManageVendor(id);
      });
    });

    // 1-Click Package Quick-Assign Selector directly on card
    this.container.querySelectorAll("[data-assign-plan-vendor]").forEach(sel => {
      sel.addEventListener("change", async (e) => {
        const vId = sel.getAttribute("data-assign-plan-vendor");
        const pId = e.target.value;
        await this.assignPlanToVendor(vId, pId);
      });
    });

    // 1-Click Package Assign Modal Trigger
    this.container.querySelectorAll("[data-open-plan-modal]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-open-plan-modal");
        this.openAssignPlanModal(id);
      });
    });

    // Quick 1-Click Assign 3-Day Free Demo Package
    this.container.querySelectorAll("[data-assign-demo]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-assign-demo");
        await this.assignPlanToVendor(id, "plan-demo");
      });
    });

    // Suspend / Activate
    this.container.querySelectorAll("[data-toggle-suspend]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-toggle-suspend");
        const v = db.getVendor(id);
        if (v) {
          if (v.status === "suspended") {
            v.status = "active";
            // If expiry date has passed, automatically extend validity by 30 days so activating restores the card
            if (v.expiresAt && new Date(v.expiresAt) < new Date()) {
              v.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            }
            window.OmniApp.showToast(`Vendor ${v.branding.businessName} activated successfully.`);
          } else {
            v.status = "suspended";
            window.OmniApp.showToast(`Vendor ${v.branding.businessName} suspended.`);
          }
          await db.saveVendor(v);
          this.renderDashboard();
        }
      });
    });

    // Extend Expiry +30 Days
    this.container.querySelectorAll("[data-extend-expiry]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-extend-expiry");
        const v = db.getVendor(id);
        if (v) {
          const baseDate = new Date(v.expiresAt) > new Date() ? new Date(v.expiresAt) : new Date();
          v.expiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          await db.saveVendor(v);
          window.OmniApp.showToast(`Extended expiry for ${v.branding.businessName} by 30 days.`);
          this.renderDashboard();
        }
      });
    });

    // Delete Vendor
    this.container.querySelectorAll("[data-del-vendor]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del-vendor");
        if (confirm(`Delete vendor card '${id}' permanently?`)) {
          await db.deleteVendor(id);
          window.OmniApp.showToast("Vendor card deleted.");
          this.renderDashboard();
        }
      });
    });

    // Quick-toggle tabs on vendor card
    this.container.querySelectorAll("[data-quick-toggle-tab]").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const vId = btn.getAttribute("data-v-id");
        const tabKey = btn.getAttribute("data-quick-toggle-tab");
        const v = db.getVendor(vId);
        if (!v) return;
        if (!v.features) v.features = {};
        const currentVal = v.features[tabKey] !== false;
        v.features[tabKey] = !currentVal;
        await db.saveVendor(v);
        const tabName = tabKey === 'quoteBuilder' ? 'Services' : tabKey === 'ecommerceShop' ? 'Shop' : tabKey === 'calendarBooking' ? 'Book Appointment' : tabKey === 'customerReviews' ? 'Reviews' : tabKey === 'leadForm' ? 'Lead Form Builder' : 'PWA Web App';
        window.OmniApp.showToast(`${tabName} ${!currentVal ? 'GRANTED' : 'REVOKED'} for ${v.branding.businessName}`);
        this.refreshVendorsList();
      });
    });

    // Manage Leads for Vendor -> 1-Click navigate to vendor console on leadform tab
    this.container.querySelectorAll("[data-manage-leads]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-manage-leads");
        window.OmniApp.setView("vendor", id);
        window.OmniApp.vendorCtrl.loginVendorDirect(id);
        window.OmniApp.vendorCtrl.activeTab = "leadform";
        window.OmniApp.vendorCtrl.render();
      });
    });

    // Bio Link & Share Modal Opener
    this.container.querySelectorAll("[data-share-vendor]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-share-vendor");
        this.openShareModal(id);
      });
    });
  }

  openShareModal(vendorId) {
    const v = db.getVendor(vendorId);
    if (!v) return;
    const modal = this.container.querySelector("#modal-admin-share-vcard");
    if (!modal) return;

    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const cleanUrl = `${origin}${pathname}?v=${v.slug}`;

    modal.querySelector("#share-modal-biz-name").textContent = v.branding.businessName;
    modal.querySelector("#share-modal-owner-info").textContent = `${v.branding.ownerName} • ${v.branding.category} • Plan: ${v.planId}`;
    modal.querySelector("#share-modal-url").value = cleanUrl;
    modal.querySelector("#share-modal-bio-snippet").value = `🔗 Visit our Smart Business Web App: ${cleanUrl} | Contact, Book & Shop Online ✨`;
    modal.querySelector("#btn-share-modal-preview").href = cleanUrl;

    // 1-Click Copy Clean URL
    const copyUrlBtn = modal.querySelector("#btn-copy-vcard-url");
    copyUrlBtn.onclick = () => {
      navigator.clipboard.writeText(cleanUrl).then(() => {
        window.OmniApp.showToast("vCard Web App link copied! Ready to share or use in Instagram Bio. 📋");
      }).catch(() => {
        modal.querySelector("#share-modal-url").select();
        document.execCommand("copy");
        window.OmniApp.showToast("Link copied!");
      });
    };

    // Copy Instagram Bio Snippet
    const copyBioBtn = modal.querySelector("#btn-copy-vcard-bio");
    copyBioBtn.onclick = () => {
      const bioText = modal.querySelector("#share-modal-bio-snippet").value;
      navigator.clipboard.writeText(bioText).then(() => {
        window.OmniApp.showToast("Instagram Bio text copied! 📸");
      }).catch(() => {
        modal.querySelector("#share-modal-bio-snippet").select();
        document.execCommand("copy");
        window.OmniApp.showToast("Bio text copied!");
      });
    };

    // Send on WhatsApp to Vendor Owner
    const sendWaBtn = modal.querySelector("#btn-send-link-whatsapp");
    sendWaBtn.onclick = () => {
      const waNumber = (v.contacts?.whatsapp || v.contacts?.phone || "").replace(/[^0-9]/g, "");
      const msg = `🎉 *Hello ${v.branding.ownerName}!* Your official Smart Business vCard Web App for *${v.branding.businessName}* is now live!\n\n` +
        `🔗 *Your Web App Link:* ${cleanUrl}\n\n` +
        `📱 *How to use:* \n` +
        `1. Paste this link into your *Instagram / Social Media Bio*.\n` +
        `2. Send this link to your clients on WhatsApp.\n` +
        `3. Clients can install it on their phone home screen as a Web App with 1 tap.\n\n` +
        `Enjoy growing your business with your new digital card! 🚀`;
      WhatsAppEngine.openChat(waNumber, msg);
    };

    modal.classList.add("active");
    document.body.classList.add("has-modal-open");
  }

  renderAdminServicesList(vendorId) {
    const v = db.getVendor(vendorId);
    const container = this.container.querySelector("#admin-services-list-container");
    if (!v || !container) return;

    const services = v.services || [];

    if (services.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--theme-text-muted); padding: 24px; font-size: 0.85rem; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px dashed var(--theme-border);">No services listed yet for this vendor. Click "+ Add Service" above to create one.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${services.map(s => `
          <div class="admin-srv-card" style="background: rgba(255,255,255,0.03); border: 1px solid var(--theme-border); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px;">
            <!-- Header Row: Service Name & Category -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 700; color: #FFFFFF; font-size: 0.95rem; line-height: 1.3;">${s.name}</div>
                <div style="margin-top: 6px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <span style="background: rgba(212,255,0,0.12); color: var(--theme-primary); border: 1px solid rgba(212,255,0,0.3); font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; font-weight: 600;">
                    📁 ${s.category || 'General'}
                  </span>
                  <span class="${s.visible !== false ? 'pill-status-active' : 'pill-status-suspended'}" style="font-size: 0.68rem; padding: 2px 7px;">
                    ${s.visible !== false ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>
            </div>

            <!-- Action Controls Row -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; flex-wrap: wrap;">
              <!-- Toggle ON/OFF -->
              <button class="btn-pill" style="font-size: 0.75rem; padding: 5px 12px; font-weight: 700; background: ${s.visible !== false ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.1)'}; color: ${s.visible !== false ? '#10B981' : '#94A3B8'}; border-color: ${s.visible !== false ? 'rgba(16,185,129,0.4)' : 'rgba(148,163,184,0.3)'};" data-admin-toggle-srv="${s.id}">
                ${s.visible !== false ? '🟢 Active (ON)' : '⚪ Hidden (OFF)'}
              </button>

              <div style="display: flex; gap: 6px;">
                <button class="btn-pill" style="font-size: 0.75rem; padding: 5px 12px; color: var(--theme-secondary); border-color: rgba(0,229,255,0.4);" data-admin-edit-toggle-srv="${s.id}">
                  ✏️ Edit
                </button>
                <button class="btn-pill" style="font-size: 0.75rem; padding: 5px 12px; color: #EF4444; border-color: rgba(239,68,68,0.4);" data-admin-del-srv="${s.id}">
                  🗑️ Delete
                </button>
              </div>
            </div>

            <!-- Inline Edit Panel (Accordion) -->
            <div id="admin-srv-edit-form-${s.id}" style="display: none; background: rgba(0,0,0,0.4); border: 1px dashed var(--theme-border); border-radius: 8px; padding: 12px; margin-top: 4px;">
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--theme-secondary); margin-bottom: 8px;">✏️ Edit Service Details:</div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div>
                  <label style="font-size: 0.72rem; color: var(--theme-text-muted); display: block; margin-bottom: 3px;">Service Name</label>
                  <input type="text" class="form-input" id="admin-srv-edit-name-${s.id}" value="${s.name.replace(/"/g, '&quot;')}" style="font-size: 0.85rem;" />
                </div>
                <div>
                  <label style="font-size: 0.72rem; color: var(--theme-text-muted); display: block; margin-bottom: 3px;">Category</label>
                  <input type="text" class="form-input" id="admin-srv-edit-cat-${s.id}" value="${(s.category || 'General').replace(/"/g, '&quot;')}" style="font-size: 0.85rem;" />
                </div>
                <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;">
                  <button type="button" class="btn-pill" style="font-size: 0.75rem; padding: 4px 10px;" data-admin-cancel-edit-srv="${s.id}">Cancel</button>
                  <button type="button" class="btn-pill active" style="font-size: 0.75rem; padding: 4px 14px; font-weight: 700;" data-admin-save-srv="${s.id}">💾 Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    // Bind item actions
    container.querySelectorAll("[data-admin-toggle-srv]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const sId = btn.getAttribute("data-admin-toggle-srv");
        const s = await db.toggleService(vendorId, sId);
        window.OmniApp.showToast(s?.visible !== false ? "Service is now visible." : "Service hidden from clients.");
        this.renderAdminServicesList(vendorId);
        this.refreshVendorsList();
      });
    });

    container.querySelectorAll("[data-admin-del-srv]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const sId = btn.getAttribute("data-admin-del-srv");
        if (confirm("Delete this service permanently?")) {
          await db.deleteService(vendorId, sId);
          window.OmniApp.showToast("Service deleted.");
          this.renderAdminServicesList(vendorId);
          this.refreshVendorsList();
        }
      });
    });

    // Toggle Inline Edit Form
    container.querySelectorAll("[data-admin-edit-toggle-srv]").forEach(btn => {
      btn.addEventListener("click", () => {
        const sId = btn.getAttribute("data-admin-edit-toggle-srv");
        const panel = container.querySelector(`#admin-srv-edit-form-${sId}`);
        if (panel) {
          panel.style.display = panel.style.display === "none" ? "block" : "none";
        }
      });
    });

    // Cancel Edit
    container.querySelectorAll("[data-admin-cancel-edit-srv]").forEach(btn => {
      btn.addEventListener("click", () => {
        const sId = btn.getAttribute("data-admin-cancel-edit-srv");
        const panel = container.querySelector(`#admin-srv-edit-form-${sId}`);
        if (panel) panel.style.display = "none";
      });
    });

    // Save Edit
    container.querySelectorAll("[data-admin-save-srv]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const sId = btn.getAttribute("data-admin-save-srv");
        const nameInput = container.querySelector(`#admin-srv-edit-name-${sId}`);
        const catInput = container.querySelector(`#admin-srv-edit-cat-${sId}`);
        const newName = nameInput ? nameInput.value.trim() : "";
        const newCat = catInput ? catInput.value.trim() : "General";

        if (!newName) {
          window.OmniApp.showToast("Service name cannot be empty!");
          return;
        }

        await db.updateService(vendorId, sId, {
          name: newName,
          category: newCat || "General",
          description: ""
        });
        window.OmniApp.showToast("Service updated successfully! 💾");
        this.renderAdminServicesList(vendorId);
        this.refreshVendorsList();
      });
    });
  }

  renderAdminProductsList(vendorId) {
    const v = db.getVendor(vendorId);
    const container = this.container.querySelector("#admin-products-list-container");
    if (!v || !container) return;

    const currency = db.getPlatformSettings()?.currencySymbol || "₹";
    const products = v.products || [];

    if (products.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--theme-text-muted); padding: 24px; font-size: 0.85rem; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px dashed var(--theme-border);">No products listed yet for this vendor. Click "+ Add Product" above to create one.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${products.map(p => `
          <div class="admin-prod-card" style="background: rgba(255,255,255,0.03); border: 1px solid var(--theme-border); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px;">
            <!-- Top Section: Emoji, Name, Price -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                <span style="font-size: 1.5rem; line-height: 1; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 10px; border: 1px solid var(--theme-border); flex-shrink: 0;">
                  ${p.emoji || '🛍️'}
                </span>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 700; color: #FFFFFF; font-size: 0.95rem; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${p.name}
                  </div>
                  <div style="margin-top: 6px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <span style="background: rgba(0,229,255,0.12); color: #00E5FF; border: 1px solid rgba(0,229,255,0.3); font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; font-weight: 600;">
                      📁 ${p.category || 'General'}
                    </span>
                    <span style="background: rgba(255,255,255,0.05); color: #94A3B8; font-size: 0.72rem; padding: 2px 8px; border-radius: 6px;">
                      ⚖️ ${p.unit || 'unit'}
                    </span>
                  </div>
                </div>
              </div>

              <div style="text-align: right; flex-shrink: 0;">
                <div style="font-weight: 800; color: #10B981; font-size: 1.05rem;">
                  ${currency}${Number(p.price).toLocaleString()}
                </div>
                <span class="${p.visible !== false ? 'pill-status-active' : 'pill-status-suspended'}" style="font-size: 0.65rem; padding: 1px 6px; display: inline-block; margin-top: 4px;">
                  ${p.visible !== false ? 'In Stock' : 'Hidden'}
                </span>
              </div>
            </div>

            <!-- Action Controls Row -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; flex-wrap: wrap;">
              <!-- Toggle ON/OFF -->
              <button class="btn-pill" style="font-size: 0.75rem; padding: 5px 12px; font-weight: 700; background: ${p.visible !== false ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.1)'}; color: ${p.visible !== false ? '#10B981' : '#94A3B8'}; border-color: ${p.visible !== false ? 'rgba(16,185,129,0.4)' : 'rgba(148,163,184,0.3)'};" data-admin-toggle-prod="${p.id}">
                ${p.visible !== false ? '🟢 Active (ON)' : '⚪ Hidden (OFF)'}
              </button>

              <div style="display: flex; gap: 6px;">
                <button class="btn-pill" style="font-size: 0.75rem; padding: 5px 12px; color: var(--theme-secondary); border-color: rgba(0,229,255,0.4);" data-admin-edit-toggle-prod="${p.id}">
                  ✏️ Edit
                </button>
                <button class="btn-pill" style="font-size: 0.75rem; padding: 5px 12px; color: #EF4444; border-color: rgba(239,68,68,0.4);" data-admin-del-prod="${p.id}">
                  🗑️ Delete
                </button>
              </div>
            </div>

            <!-- Inline Edit Panel (Accordion) -->
            <div id="admin-prod-edit-form-${p.id}" style="display: none; background: rgba(0,0,0,0.4); border: 1px dashed var(--theme-border); border-radius: 8px; padding: 12px; margin-top: 4px;">
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--theme-secondary); margin-bottom: 8px;">✏️ Edit Product Details:</div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px;">
                  <div>
                    <label style="font-size: 0.72rem; color: var(--theme-text-muted); display: block; margin-bottom: 3px;">Product Name</label>
                    <input type="text" class="form-input" id="admin-prod-edit-name-${p.id}" value="${p.name.replace(/"/g, '&quot;')}" style="font-size: 0.85rem;" />
                  </div>
                  <div>
                    <label style="font-size: 0.72rem; color: var(--theme-text-muted); display: block; margin-bottom: 3px;">Emoji</label>
                    <input type="text" class="form-input" id="admin-prod-edit-emoji-${p.id}" value="${p.emoji || '🛍️'}" style="font-size: 0.85rem; text-align: center;" />
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  <div>
                    <label style="font-size: 0.72rem; color: var(--theme-text-muted); display: block; margin-bottom: 3px;">Price (${currency})</label>
                    <input type="number" class="form-input" id="admin-prod-edit-price-${p.id}" value="${p.price}" style="font-size: 0.85rem;" />
                  </div>
                  <div>
                    <label style="font-size: 0.72rem; color: var(--theme-text-muted); display: block; margin-bottom: 3px;">Unit (e.g. pack, kg, plate)</label>
                    <input type="text" class="form-input" id="admin-prod-edit-unit-${p.id}" value="${(p.unit || 'unit').replace(/"/g, '&quot;')}" style="font-size: 0.85rem;" />
                  </div>
                </div>
                <div>
                  <label style="font-size: 0.72rem; color: var(--theme-text-muted); display: block; margin-bottom: 3px;">Category</label>
                  <input type="text" class="form-input" id="admin-prod-edit-cat-${p.id}" value="${(p.category || 'General').replace(/"/g, '&quot;')}" style="font-size: 0.85rem;" />
                </div>
                <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;">
                  <button type="button" class="btn-pill" style="font-size: 0.75rem; padding: 4px 10px;" data-admin-cancel-edit-prod="${p.id}">Cancel</button>
                  <button type="button" class="btn-pill active" style="font-size: 0.75rem; padding: 4px 14px; font-weight: 700;" data-admin-save-prod="${p.id}">💾 Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    // Bind item actions
    container.querySelectorAll("[data-admin-toggle-prod]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const pId = btn.getAttribute("data-admin-toggle-prod");
        const p = await db.toggleProduct(vendorId, pId);
        window.OmniApp.showToast(p?.visible !== false ? "Product is now visible in shop." : "Product hidden from shop.");
        this.renderAdminProductsList(vendorId);
        this.refreshVendorsList();
      });
    });

    container.querySelectorAll("[data-admin-del-prod]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const pId = btn.getAttribute("data-admin-del-prod");
        if (confirm("Delete this product permanently?")) {
          await db.deleteProduct(vendorId, pId);
          window.OmniApp.showToast("Product deleted.");
          this.renderAdminProductsList(vendorId);
          this.refreshVendorsList();
        }
      });
    });

    // Toggle Inline Edit Form
    container.querySelectorAll("[data-admin-edit-toggle-prod]").forEach(btn => {
      btn.addEventListener("click", () => {
        const pId = btn.getAttribute("data-admin-edit-toggle-prod");
        const panel = container.querySelector(`#admin-prod-edit-form-${pId}`);
        if (panel) {
          panel.style.display = panel.style.display === "none" ? "block" : "none";
        }
      });
    });

    // Cancel Edit
    container.querySelectorAll("[data-admin-cancel-edit-prod]").forEach(btn => {
      btn.addEventListener("click", () => {
        const pId = btn.getAttribute("data-admin-cancel-edit-prod");
        const panel = container.querySelector(`#admin-prod-edit-form-${pId}`);
        if (panel) panel.style.display = "none";
      });
    });

    // Save Edit
    container.querySelectorAll("[data-admin-save-prod]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const pId = btn.getAttribute("data-admin-save-prod");
        const nameInput = container.querySelector(`#admin-prod-edit-name-${pId}`);
        const emojiInput = container.querySelector(`#admin-prod-edit-emoji-${pId}`);
        const priceInput = container.querySelector(`#admin-prod-edit-price-${pId}`);
        const unitInput = container.querySelector(`#admin-prod-edit-unit-${pId}`);
        const catInput = container.querySelector(`#admin-prod-edit-cat-${pId}`);

        const newName = nameInput ? nameInput.value.trim() : "";
        const newEmoji = emojiInput ? emojiInput.value.trim() || "🛍️" : "🛍️";
        const newPrice = priceInput ? Number(priceInput.value || 0) : 0;
        const newUnit = unitInput ? unitInput.value.trim() || "unit" : "unit";
        const newCat = catInput ? catInput.value.trim() || "General" : "General";

        if (!newName) {
          window.OmniApp.showToast("Product name cannot be empty!");
          return;
        }

        await db.updateProduct(vendorId, pId, {
          name: newName,
          category: newCat,
          emoji: newEmoji,
          price: newPrice,
          unit: newUnit,
          description: ""
        });
        window.OmniApp.showToast("Product updated successfully! 💾");
        this.renderAdminProductsList(vendorId);
        this.refreshVendorsList();
      });
    });
  }

  renderAdminBookingsList(vendorId) {
    const v = db.getVendor(vendorId);
    const container = this.container.querySelector("#admin-bookings-list-container");
    if (!v || !container) return;

    const bookings = v.bookings || [];

    if (bookings.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--theme-text-muted); padding: 20px; font-size: 0.85rem;">No appointments booked yet for this vendor.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${bookings.map(b => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid var(--theme-border); border-radius: 8px; padding: 10px 12px; gap: 10px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 220px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 700; color: #FFF; font-size: 0.88rem;">${b.clientName || 'Client'}</span>
                <span style="font-size: 0.72rem; color: #00E5FF;">📞 ${b.clientPhone || 'No phone'}</span>
              </div>
              <div style="font-size: 0.75rem; color: var(--theme-primary); margin-top: 2px;">
                Service: <b>${b.serviceName || 'General Consultation'}</b>
              </div>
              <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-top: 2px;">
                📅 ${b.date || 'TBD'} • ⏰ ${b.timeSlot || 'Anytime'}
                ${b.notes ? ` • Note: "${b.notes}"` : ''}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <select class="form-select" style="padding: 3px 8px; font-size: 0.72rem; width: auto;" data-admin-bkg-status="${b.id}">
                <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.7rem; color: var(--theme-secondary);" data-admin-edit-bkg="${b.id}">Edit</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.7rem; color: #EF4444;" data-admin-del-bkg="${b.id}">Delete</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    // Bind item actions
    container.querySelectorAll("[data-admin-bkg-status]").forEach(select => {
      select.addEventListener("change", async (e) => {
        const bId = select.getAttribute("data-admin-bkg-status");
        await db.updateBookingStatus(vendorId, bId, e.target.value);
        window.OmniApp.showToast(`Booking marked as ${e.target.value}.`);
        this.renderAdminBookingsList(vendorId);
      });
    });

    container.querySelectorAll("[data-admin-del-bkg]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const bId = btn.getAttribute("data-admin-del-bkg");
        if (confirm("Delete this appointment booking permanently?")) {
          await db.deleteBooking(vendorId, bId);
          window.OmniApp.showToast("Booking deleted.");
          this.renderAdminBookingsList(vendorId);
          this.refreshVendorsList();
        }
      });
    });

    container.querySelectorAll("[data-admin-edit-bkg]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const bId = btn.getAttribute("data-admin-edit-bkg");
        const b = (v.bookings || []).find(x => x.id === bId);
        if (!b) return;
        const newClient = prompt("Client Name:", b.clientName || "");
        if (newClient === null) return;
        const newPhone = prompt("Client Phone:", b.clientPhone || "");
        if (newPhone === null) return;
        const newService = prompt("Service Requested:", b.serviceName || "");
        if (newService === null) return;
        const newDate = prompt("Date (YYYY-MM-DD):", b.date || "");
        if (newDate === null) return;
        const newTime = prompt("Time Slot (e.g. 10:00 AM):", b.timeSlot || "");
        if (newTime === null) return;
        const newNotes = prompt("Notes:", b.notes || "");
        if (newNotes === null) return;

        await db.updateBooking(vendorId, bId, {
          clientName: newClient.trim(),
          clientPhone: newPhone.trim(),
          serviceName: newService.trim(),
          date: newDate.trim(),
          timeSlot: newTime.trim(),
          notes: newNotes.trim()
        });
        window.OmniApp.showToast("Booking updated!");
        this.renderAdminBookingsList(vendorId);
        this.refreshVendorsList();
      });
    });
  }

  renderAdminReviewsList(vendorId) {
    const v = db.getVendor(vendorId);
    const container = this.container.querySelector("#admin-reviews-list-container");
    if (!v || !container) return;

    const reviews = v.reviews || [];

    if (reviews.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--theme-text-muted); padding: 20px; font-size: 0.85rem;">No reviews published yet for this vendor. Click "+ Add Testimonial" above to add one.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${reviews.map(r => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid var(--theme-border); border-radius: 8px; padding: 10px 12px; gap: 10px;">
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 700; color: #FFF; font-size: 0.88rem;">${r.author}</span>
                <span style="color: #F59E0B; font-size: 0.8rem;">${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}</span>
                ${r.date ? `<span style="font-size: 0.68rem; color: var(--theme-text-muted);">${r.date}</span>` : ""}
              </div>
              ${r.content ? `
              <div style="font-size: 0.75rem; color: var(--theme-text-muted); margin-top: 3px; font-style: italic;">
                "${r.content}"
              </div>` : ""}
            </div>
            <div style="display: flex; gap: 5px; flex-shrink: 0;">
              <button class="btn-pill" style="padding: 2px 7px; font-size: 0.7rem; color: var(--theme-secondary);" data-admin-edit-rev="${r.id}">Edit</button>
              <button class="btn-pill" style="padding: 2px 7px; font-size: 0.7rem; color: #EF4444;" data-admin-del-rev="${r.id}">Delete</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    // Bind item actions
    container.querySelectorAll("[data-admin-del-rev]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const rId = btn.getAttribute("data-admin-del-rev");
        if (confirm("Delete this customer review testimonial?")) {
          await db.deleteReview(vendorId, rId);
          window.OmniApp.showToast("Review deleted.");
          this.renderAdminReviewsList(vendorId);
          this.refreshVendorsList();
        }
      });
    });

    container.querySelectorAll("[data-admin-edit-rev]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const rId = btn.getAttribute("data-admin-edit-rev");
        const r = (v.reviews || []).find(x => x.id === rId);
        if (!r) return;
        const newAuthor = prompt("Author / Client Name:", r.author || "");
        if (newAuthor === null) return;
        const newRating = prompt("Star Rating (1 to 5):", r.rating || 5);
        if (newRating === null) return;
        const newContent = prompt("Review Feedback:", r.content || "");
        if (newContent === null) return;

        await db.updateReview(vendorId, rId, {
          author: newAuthor.trim(),
          rating: Number(newRating || 5),
          content: newContent.trim()
        });
        window.OmniApp.showToast("Review updated!");
        this.renderAdminReviewsList(vendorId);
        this.refreshVendorsList();
      });
    });
  }

  applyPreset(presetName) {
    const presets = {
      Salon: {
        name: "Aura Luxe Salon & Spa",
        slug: "aura-salon",
        owner: "Deepika Padukone",
        category: "PREMIUM BEAUTY & SPA",
        tagline: "Organic Balayage, Clinical Facials & Bridal Glamour"
      },
      Restaurant: {
        name: "Zafran Craft Kitchen & Bar",
        slug: "zafran-kitchen",
        owner: "Chef Kabir Sen",
        category: "ARTISANAL RESTAURANT",
        tagline: "Modern Indian & Charcoal Grills"
      },
      Catering: {
        name: "Royal Heritage Banquets & Caterers",
        slug: "royal-banquets",
        owner: "Sanjay Singhal",
        category: "ROYAL WEDDING CATERING",
        tagline: "Regal Buffets & Live Gourmet Stations"
      },
      Doctor: {
        name: "Dr. Nair Health & Cardiology Care",
        slug: "dr-nair-care",
        owner: "Dr. Anirudh Nair, MD",
        category: "CLINIC & CARDIOLOGY",
        tagline: "Preventive Cardiovascular Consultation & Diagnostics"
      },
      Tutor: {
        name: "Zenith STEM & Coding Academy",
        slug: "zenith-academy",
        owner: "Prof. Alok Gupta",
        category: "EDUCATION & MENTORSHIP",
        tagline: "1-on-1 Olympiad & IIT-JEE Physics Coaching"
      },
      Grocery: {
        name: "EarthRoot Organic Farm & Pantry",
        slug: "earthroot-pantry",
        owner: "Radhika Kulkarni",
        category: "ORGANIC FARM & PRODUCE",
        tagline: "Cold-Pressed Oils, Wild Honey & Fresh Organic Harvest"
      },
      RealEstate: {
        name: "PrimeKey Luxury Estates",
        slug: "primekey-estates",
        owner: "Rohan Malhotra",
        category: "LUXURY REAL ESTATE",
        tagline: "Bespoke Penthouses, Sea-Facing Villas & High-Yield Commercials"
      }
    };

    const p = presets[presetName];
    if (p) {
      this.container.querySelector("#new-v-name").value = p.name;
      this.container.querySelector("#new-v-slug").value = p.slug;
      this.container.querySelector("#new-v-owner").value = p.owner;
      this.container.querySelector("#new-v-category").value = p.category;
      this.container.querySelector("#new-v-tagline").value = p.tagline;
    }
  }
}
