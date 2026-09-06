// Module 3: Super Admin Management Console Controller
import { db } from "./db.js";

export class AdminConsoleController {
  constructor(containerEl) {
    this.container = containerEl;
    this.isAuthenticated = false;
    this.activeTab = "overview"; // overview, vendors, create, plans, settings
    this.vendorFilterQuery = "";
    this.vendorFilterStatus = "all";
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
          <h2 style="font-size: 1.45rem; margin-bottom: 6px;">Super Admin Portal</h2>
          <p style="font-size: 0.82rem; color: var(--theme-text-muted); margin-bottom: 24px;">
            Enter your 4-digit Master Security PIN to manage vendors and platform configuration.
          </p>

          <form id="form-admin-login">
            <div class="form-group" style="text-align: left;">
              <label class="form-label">Security PIN (Default: 1234)</label>
              <input type="password" maxlength="4" class="form-input" id="admin-pin-input" placeholder="••••" value="1234" required style="font-size: 1.2rem; text-align: center; letter-spacing: 6px;" />
            </div>

            <button type="submit" class="btn-submit-primary" style="margin-top: 14px;">
              <span>Unlock Admin Console</span>
              <span>→</span>
            </button>
          </form>
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
        this.renderDashboard();
      } else {
        window.OmniApp.showToast("Invalid Security PIN.");
      }
    });
  }

  calculateMetrics() {
    const vendors = db.getVendors();
    const plans = db.getSubscriptionPlans();
    const totalCards = vendors.length;
    const activeCards = vendors.filter(v => v.status === "active").length;

    // Calculate revenue from vendors based on their plan
    let totalRevenue = 0;
    vendors.forEach(v => {
      const p = plans.find(plan => plan.id === v.planId);
      if (p) totalRevenue += Number(p.price || 0);
    });

    const activeSubs = vendors.filter(v => v.status === "active" && new Date(v.expiresAt) > new Date()).length;

    return { totalCards, activeCards, totalRevenue, activeSubs };
  }

  renderDashboard() {
    const settings = db.getPlatformSettings();
    const currency = settings.currencySymbol || "₹";
    const metrics = this.calculateMetrics();

    this.container.innerHTML = `
      <div class="portal-container">
        <!-- Admin Header -->
        <div class="portal-header">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.6rem;">🛡️</span>
              <div>
                <h2 style="font-size: 1.2rem; margin: 0;">${settings.platformName} Admin</h2>
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-pill" id="btn-admin-logout">Sign Out</button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="portal-nav-tabs">
          <button class="portal-tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" data-atab="overview">
            📊 Stats
          </button>
          <button class="portal-tab-btn ${this.activeTab === 'vendors' ? 'active' : ''}" data-atab="vendors">
            👥 Vendors
          </button>
          <button class="portal-tab-btn ${this.activeTab === 'create' ? 'active' : ''}" data-atab="create">
            ＋ New Card
          </button>
          <button class="portal-tab-btn ${this.activeTab === 'plans' ? 'active' : ''}" data-atab="plans">
            💎 Plans
          </button>
          <button class="portal-tab-btn ${this.activeTab === 'settings' ? 'active' : ''}" data-atab="settings">
            ⚙️ Settings
          </button>
        </div>

        <!-- 1. Overview Pane -->
        <div class="portal-pane ${this.activeTab === 'overview' ? 'active' : ''}" id="apane-overview">
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-title">Total Digital Cards</div>
              <div class="kpi-number" style="color: var(--theme-secondary);">${metrics.totalCards}</div>
              <div style="font-size: 0.75rem; color: var(--theme-text-muted); margin-top: 4px;">Registered on platform</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-title">Active Live Cards</div>
              <div class="kpi-number" style="color: #10B981;">${metrics.activeCards}</div>
              <div style="font-size: 0.75rem; color: var(--theme-text-muted); margin-top: 4px;">Publicly accessible</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-title">Gross SaaS Revenue</div>
              <div class="kpi-number" style="color: var(--theme-primary);">${currency}${metrics.totalRevenue.toLocaleString()}</div>
              <div style="font-size: 0.75rem; color: var(--theme-text-muted); margin-top: 4px;">From subscription plans</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-title">Active Subscriptions</div>
              <div class="kpi-number" style="color: #F59E0B;">${metrics.activeSubs}</div>
              <div style="font-size: 0.75rem; color: var(--theme-text-muted); margin-top: 4px;">Unexpired accounts</div>
            </div>
          </div>

          <div class="bento-grid bento-grid-2">
            <div class="bento-card">
              <h3 style="font-size: 1rem; margin-bottom: 12px;">Recent Vendor Activity</h3>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${db.getVendors().slice(0, 4).map(v => `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--theme-border);">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span>${v.branding.avatarEmoji || '🏢'}</span>
                      <div>
                        <div style="font-weight: 700; font-size: 0.85rem;">${v.branding.businessName}</div>
                        <div style="font-size: 0.72rem; color: var(--theme-text-muted);">${v.branding.category}</div>
                      </div>
                    </div>
                    <a href="?v=${v.slug}" target="_blank" class="btn-pill" style="font-size: 0.72rem; padding: 2px 8px;">Open ↗</a>
                  </div>
                `).join("")}
              </div>
            </div>

            <div class="bento-card">
              <h3 style="font-size: 1rem; margin-bottom: 12px;">Platform Health & Sync</h3>
              <div style="font-size: 0.85rem; line-height: 1.6; color: var(--theme-text-muted);">
                <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                  <span>LocalStorage Engine:</span>
                  <span style="color: #10B981; font-weight: 700;">Operational</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                  <span>Cloud Database:</span>
                  <span style="color: ${db.isFirebaseReady ? '#10B981' : 'var(--theme-text-muted)'}; font-weight: 700;">
                    ${db.isFirebaseReady ? 'Firebase Connected' : 'Local Fallback Mode'}
                  </span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                  <span>PWA Service Worker:</span>
                  <span style="color: #10B981; font-weight: 700;">Active & Caching</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Vendors Management Pane -->
        <div class="portal-pane ${this.activeTab === 'vendors' ? 'active' : ''}" id="apane-vendors">
          <div class="bento-card" style="margin-bottom: 16px;">
            <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; align-items: center;">
              <div style="display: flex; gap: 8px; flex: 1; min-width: 260px;">
                <input type="text" class="form-input" id="admin-vendor-search" placeholder="Search by name, owner, or category..." value="${this.vendorFilterQuery}" />
              </div>
              <div style="display: flex; gap: 6px;">
                ${["all", "active", "suspended", "expired"].map(st => `
                  <button class="filter-chip ${this.vendorFilterStatus === st ? 'active' : ''}" data-admin-status-filter="${st}">
                    ${st.toUpperCase()}
                  </button>
                `).join("")}
              </div>
            </div>
          </div>

          <div class="data-table-card">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Business / Owner</th>
                    <th>Plan & Expiry</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="admin-vendors-tbody">
                  ${this.renderVendorTableRows()}
                </tbody>
              </table>
            </div>
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
                  <div style="font-size: 0.75rem; font-weight: 700; color: var(--theme-text-muted); margin-bottom: 10px; text-transform: uppercase;">
                    Module Feature Permissions:
                  </div>

                  <div style="display: flex; flex-direction: column; gap: 10px;">
                    <label class="switch-label">
                      <input type="checkbox" class="switch-input" id="toggle-feat-quote" checked />
                      <span class="switch-slider"></span>
                      <span>Enable Quote Builder (Multi-Select)</span>
                    </label>

                    <label class="switch-label">
                      <input type="checkbox" class="switch-input" id="toggle-feat-shop" checked />
                      <span class="switch-slider"></span>
                      <span>Enable E-Commerce Shop & Cart</span>
                    </label>

                    <label class="switch-label">
                      <input type="checkbox" class="switch-input" id="toggle-feat-booking" checked />
                      <span class="switch-slider"></span>
                      <span>Enable Calendar Booking</span>
                    </label>

                    <label class="switch-label">
                      <input type="checkbox" class="switch-input" id="toggle-feat-reviews" checked />
                      <span class="switch-slider"></span>
                      <span>Enable Customer Reviews</span>
                    </label>

                    <label class="switch-label">
                      <input type="checkbox" class="switch-input" id="toggle-feat-promo" checked />
                      <span class="switch-slider"></span>
                      <span>Enable Promo Offer Banner</span>
                    </label>

                    <label class="switch-label">
                      <input type="checkbox" class="switch-input" id="toggle-feat-pwa" checked />
                      <span class="switch-slider"></span>
                      <span>Enable PWA App Installation</span>
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
            ${db.getSubscriptionPlans().map(plan => `
              <div class="bento-card" style="${plan.id === 'plan-demo' ? 'border-color: rgba(212,255,0,0.4); background: rgba(212,255,0,0.02);' : ''}">
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
                  <div style="padding: 2px 0;">${plan.features?.quoteBuilder !== false ? '✓' : '✗'} Quote Builder</div>
                  <div style="padding: 2px 0;">${plan.features?.ecommerceShop !== false ? '✓' : '✗'} E-Commerce Shop</div>
                  <div style="padding: 2px 0;">${plan.features?.calendarBooking !== false ? '✓' : '✗'} Calendar Booking</div>
                  <div style="padding: 2px 0;">${plan.features?.customerReviews !== false ? '✓' : '✗'} Customer Reviews</div>
                  <div style="padding: 2px 0;">${plan.features?.promoBanner !== false ? '✓' : '✗'} Promo Offer Banner</div>
                  <div style="padding: 2px 0;">${plan.features?.pwaInstall !== false ? '✓' : '✗'} PWA App Install</div>
                </div>

                <div style="display: flex; gap: 8px;">
                  <button class="btn-pill active" style="padding: 4px 10px; font-size: 0.75rem;" data-edit-plan="${plan.id}">✏️ Edit Package</button>
                  ${plan.id !== 'plan-demo' ? `<button class="btn-pill" style="padding: 4px 8px; font-size: 0.72rem; color: #EF4444;" data-del-plan="${plan.id}">Delete</button>` : ''}
                </div>
              </div>
            `).join("")}
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
                <span class="${db.isFirebaseReady ? 'pill-status-active' : 'pill-status-pending'}" style="font-size: 0.75rem; padding: 4px 10px;">
                  ${db.isFirebaseReady ? '🟢 Cloud Connected' : '🟡 Offline (LocalStorage Only)'}
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
              <h5 style="font-size: 0.88rem; color: var(--theme-primary); margin-bottom: 10px;">Add Service for this Vendor (Quote on Request)</h5>
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
              <div class="form-group">
                <label class="form-label">Scope & Description</label>
                <input type="text" class="form-input" id="admin-new-srv-desc" placeholder="Details of deliverables for custom client quoting" />
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
                  <label class="form-label">Unit Type</label>
                  <input type="text" class="form-input" id="admin-new-prod-unit" placeholder="e.g. pack, box, kg, plate" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <input type="text" class="form-input" id="admin-new-prod-desc" placeholder="Brief product description" />
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
              <label class="form-label" style="margin-bottom: 8px;">Included Feature Modules</label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <label class="switch-label" style="font-size: 0.78rem;">
                  <input type="checkbox" class="switch-input" id="plan-feat-quote" checked />
                  <span class="switch-slider"></span>
                  <span>Quote Builder</span>
                </label>
                <label class="switch-label" style="font-size: 0.78rem;">
                  <input type="checkbox" class="switch-input" id="plan-feat-shop" checked />
                  <span class="switch-slider"></span>
                  <span>E-Commerce Shop</span>
                </label>
                <label class="switch-label" style="font-size: 0.78rem;">
                  <input type="checkbox" class="switch-input" id="plan-feat-cal" checked />
                  <span class="switch-slider"></span>
                  <span>Booking Calendar</span>
                </label>
                <label class="switch-label" style="font-size: 0.78rem;">
                  <input type="checkbox" class="switch-input" id="plan-feat-review" checked />
                  <span class="switch-slider"></span>
                  <span>Customer Reviews</span>
                </label>
                <label class="switch-label" style="font-size: 0.78rem;">
                  <input type="checkbox" class="switch-input" id="plan-feat-promo" checked />
                  <span class="switch-slider"></span>
                  <span>Promo Banner</span>
                </label>
                <label class="switch-label" style="font-size: 0.78rem;">
                  <input type="checkbox" class="switch-input" id="plan-feat-pwa" checked />
                  <span class="switch-slider"></span>
                  <span>PWA App Install</span>
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
    `;

    this.bindDashboardEvents();
  }

  renderVendorTableRows() {
    const currency = db.getPlatformSettings()?.currencySymbol || "₹";
    let vendors = db.getVendors();

    if (this.vendorFilterStatus !== "all") {
      vendors = vendors.filter(v => v.status === this.vendorFilterStatus);
    }

    if (this.vendorFilterQuery) {
      const q = this.vendorFilterQuery.toLowerCase();
      vendors = vendors.filter(v => 
        v.branding.businessName.toLowerCase().includes(q) ||
        v.branding.ownerName.toLowerCase().includes(q) ||
        v.branding.category.toLowerCase().includes(q)
      );
    }

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
            <span class="${v.status === 'active' ? 'pill-status-active' : 'pill-status-suspended'}">
              ${v.status.toUpperCase()}
            </span>
          </td>
          <td>
            <div class="vendor-action-cluster">
              <a href="?v=${v.slug}" target="_blank" class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem;">Preview ↗</a>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: var(--theme-secondary);" data-edit-vendor="${v.id}">⚙️ Edit Card</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: var(--theme-primary);" data-manage-services="${v.id}">📋 Services (${v.services?.length || 0})</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: #10B981;" data-manage-products="${v.id}">🛍️ Products (${v.products?.length || 0})</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: #00E5FF;" data-manage-bookings="${v.id}">📅 Bookings (${v.bookings?.length || 0})</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: #F59E0B;" data-manage-reviews="${v.id}">★ Reviews (${v.reviews?.length || 0})</button>
              <button class="btn-pill active" style="padding: 3px 8px; font-size: 0.72rem;" data-manage-vendor="${v.id}">🔐 Manage Console</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: var(--theme-primary); border-color: rgba(212,255,0,0.3);" data-assign-demo="${v.id}" title="Assign 3-Day Free Demo (Sets expiry to +3 days from today)">🎁 3d Demo</button>
              <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem;" data-toggle-suspend="${v.id}">
                ${v.status === 'active' ? 'Suspend' : 'Activate'}
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

    // Filter status
    this.container.querySelectorAll("[data-admin-status-filter]").forEach(chip => {
      chip.addEventListener("click", () => {
        this.vendorFilterStatus = chip.getAttribute("data-admin-status-filter");
        this.renderDashboard();
      });
    });

    // Search
    const searchInput = this.container.querySelector("#admin-vendor-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.vendorFilterQuery = e.target.value.trim();
        const tbody = this.container.querySelector("#admin-vendors-tbody");
        if (tbody) tbody.innerHTML = this.renderVendorTableRows();
        this.bindVendorActionButtons();
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
            pwaInstall: this.container.querySelector("#toggle-feat-pwa").checked
          },
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
        window.OmniApp.showToast("New smart card created successfully!");
        this.activeTab = "vendors";
        this.renderDashboard();
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
          supportWhatsApp: this.container.querySelector("#set-supportWa").value.trim()
        });
        window.OmniApp.showToast("Platform settings saved!");
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

        await db.saveVendor(v);
        this.container.querySelector("#modal-admin-edit-vendor")?.classList.remove("active");
        window.OmniApp.showToast(`Updated '${v.branding.businessName}' & all card texts successfully!`);
        this.renderDashboard();
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
        const desc = this.container.querySelector("#admin-new-srv-desc").value.trim();

        if (!name) {
          window.OmniApp.showToast("Please enter a service name.");
          return;
        }

        await db.addService(vId, { name, category: cat, description: desc, visible: true });
        window.OmniApp.showToast("New service added for vendor!");
        this.container.querySelector("#admin-new-srv-name").value = "";
        this.container.querySelector("#admin-new-srv-desc").value = "";
        this.container.querySelector("#admin-add-srv-panel").style.display = "none";
        this.renderAdminServicesList(vId);
        const tbody = this.container.querySelector("#admin-vendors-tbody");
        if (tbody) tbody.innerHTML = this.renderVendorTableRows();
        this.bindVendorActionButtons();
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
        const desc = this.container.querySelector("#admin-new-prod-desc").value.trim();

        if (!name) {
          window.OmniApp.showToast("Please enter a product name.");
          return;
        }

        await db.addProduct(vId, { name, emoji, price, unit, description: desc, visible: true });
        window.OmniApp.showToast("New product added for vendor!");
        this.container.querySelector("#admin-new-prod-name").value = "";
        this.container.querySelector("#admin-new-prod-price").value = "";
        this.container.querySelector("#admin-new-prod-unit").value = "";
        this.container.querySelector("#admin-new-prod-desc").value = "";
        this.container.querySelector("#admin-add-prod-panel").style.display = "none";
        this.renderAdminProductsList(vId);
        const tbody = this.container.querySelector("#admin-vendors-tbody");
        if (tbody) tbody.innerHTML = this.renderVendorTableRows();
        this.bindVendorActionButtons();
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

        if (!author || !content) {
          window.OmniApp.showToast("Please provide author name and review feedback.");
          return;
        }

        await db.addReview(vId, { author, rating, content });
        window.OmniApp.showToast("New testimonial review added for vendor!");
        this.container.querySelector("#admin-new-rev-author").value = "";
        this.container.querySelector("#admin-new-rev-content").value = "";
        this.container.querySelector("#admin-add-rev-panel").style.display = "none";
        this.renderAdminReviewsList(vId);
        const tbody = this.container.querySelector("#admin-vendors-tbody");
        if (tbody) tbody.innerHTML = this.renderVendorTableRows();
        this.bindVendorActionButtons();
      });
    }

    // Quick select demo on Create Vendor Form
    const quickDemoBtn = this.container.querySelector("#btn-quick-demo-plan");
    if (quickDemoBtn) {
      quickDemoBtn.addEventListener("click", () => {
        const planSelect = this.container.querySelector("#new-v-plan");
        if (planSelect) {
          planSelect.value = "plan-demo";
          window.OmniApp.showToast("Selected 3-Day Free Demo Package for new vendor.");
        }
      });
    }

    // Assign 3-Day Demo in Edit Vendor Modal
    const assignDemoBtn = this.container.querySelector("#btn-edit-assign-demo");
    if (assignDemoBtn) {
      assignDemoBtn.addEventListener("click", () => {
        const planSel = this.container.querySelector("#edit-v-plan");
        if (planSel) planSel.value = "plan-demo";
        const demoPlan = db.getSubscriptionPlans().find(p => p.id === "plan-demo");
        const days = demoPlan ? demoPlan.durationDays : 3;
        const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        const expiryInput = this.container.querySelector("#edit-v-expiry");
        if (expiryInput) {
          expiryInput.value = targetDate.toISOString().substring(0, 10);
        }
        const statusSelect = this.container.querySelector("#edit-v-status");
        if (statusSelect) statusSelect.value = "active";
        window.OmniApp.showToast(`Applied ${demoPlan?.name || "3-Day Free Demo"}! Expiry set to ${targetDate.toLocaleDateString()}.`);
      });
    }

    // Auto-update expiry date when changing plan in Edit Vendor Modal
    const editPlanSelect = this.container.querySelector("#edit-v-plan");
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
          pwaInstall: this.container.querySelector("#plan-feat-pwa").checked
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
        this.container.querySelector(`#${id}`)?.classList.remove("active");
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
          modal.classList.add("active");
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

    // Quick 1-Click Assign 3-Day Free Demo Package
    this.container.querySelectorAll("[data-assign-demo]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-assign-demo");
        const v = db.getVendor(id);
        if (v) {
          const demoPlan = db.getSubscriptionPlans().find(p => p.id === "plan-demo");
          const days = demoPlan ? demoPlan.durationDays : 3;
          v.planId = "plan-demo";
          v.status = "active";
          v.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
          await db.saveVendor(v);
          window.OmniApp.showToast(`Assigned ${demoPlan?.name || "3-Day Free Demo"} to '${v.branding.businessName}'! Expiry set to ${days} days from now.`);
          this.renderDashboard();
        }
      });
    });

    // Suspend / Activate
    this.container.querySelectorAll("[data-toggle-suspend]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-toggle-suspend");
        const v = db.getVendor(id);
        if (v) {
          v.status = v.status === "active" ? "suspended" : "active";
          await db.saveVendor(v);
          window.OmniApp.showToast(`Vendor ${v.branding.businessName} marked as ${v.status}.`);
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
  }

  renderAdminServicesList(vendorId) {
    const v = db.getVendor(vendorId);
    const container = this.container.querySelector("#admin-services-list-container");
    if (!v || !container) return;

    const currency = db.getPlatformSettings()?.currencySymbol || "₹";
    const services = v.services || [];

    if (services.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--theme-text-muted); padding: 20px; font-size: 0.85rem;">No services listed yet for this vendor. Click "+ Add Service" above to create one.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${services.map(s => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid var(--theme-border); border-radius: 8px; padding: 10px 12px; gap: 10px;">
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 700; color: #FFF; font-size: 0.88rem;">${s.name}</span>
                <span class="pill-status-pending" style="font-size: 0.65rem; padding: 1px 6px;">${s.category || 'General'}</span>
                <span class="${s.visible ? 'pill-status-active' : 'pill-status-suspended'}" style="font-size: 0.65rem; padding: 1px 6px;">
                  ${s.visible ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-top: 2px;">
                ${s.description || 'No description'}
              </div>
            </div>
            <div style="font-size: 0.78rem; color: var(--theme-primary); font-weight: 700; white-space: nowrap;">
              💬 Quote on Request
            </div>
            <div style="display: flex; gap: 5px; flex-shrink: 0;">
              <button class="btn-pill" style="padding: 2px 7px; font-size: 0.7rem; color: var(--theme-secondary);" data-admin-edit-srv="${s.id}">Edit</button>
              <button class="btn-pill" style="padding: 2px 7px; font-size: 0.7rem;" data-admin-toggle-srv="${s.id}">Toggle</button>
              <button class="btn-pill" style="padding: 2px 7px; font-size: 0.7rem; color: #EF4444;" data-admin-del-srv="${s.id}">Delete</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    // Bind item actions
    container.querySelectorAll("[data-admin-toggle-srv]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const sId = btn.getAttribute("data-admin-toggle-srv");
        await db.toggleService(vendorId, sId);
        this.renderAdminServicesList(vendorId);
        const tbody = this.container.querySelector("#admin-vendors-tbody");
        if (tbody) tbody.innerHTML = this.renderVendorTableRows();
        this.bindVendorActionButtons();
      });
    });

    container.querySelectorAll("[data-admin-del-srv]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const sId = btn.getAttribute("data-admin-del-srv");
        if (confirm("Delete this service for the vendor?")) {
          await db.deleteService(vendorId, sId);
          window.OmniApp.showToast("Service deleted.");
          this.renderAdminServicesList(vendorId);
          const tbody = this.container.querySelector("#admin-vendors-tbody");
          if (tbody) tbody.innerHTML = this.renderVendorTableRows();
          this.bindVendorActionButtons();
        }
      });
    });

    container.querySelectorAll("[data-admin-edit-srv]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const sId = btn.getAttribute("data-admin-edit-srv");
        const s = (v.services || []).find(x => x.id === sId);
        if (!s) return;
        const newName = prompt("Service Name:", s.name);
        if (newName === null) return;
        const newCat = prompt("Category:", s.category || "General");
        if (newCat === null) return;
        const newDesc = prompt("Scope & Description:", s.description || "");
        if (newDesc === null) return;

        await db.updateService(vendorId, sId, {
          name: newName.trim(),
          category: newCat.trim(),
          description: newDesc.trim()
        });
        window.OmniApp.showToast("Service updated!");
        this.renderAdminServicesList(vendorId);
        const tbody = this.container.querySelector("#admin-vendors-tbody");
        if (tbody) tbody.innerHTML = this.renderVendorTableRows();
        this.bindVendorActionButtons();
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
      container.innerHTML = `<div style="text-align: center; color: var(--theme-text-muted); padding: 20px; font-size: 0.85rem;">No products listed yet for this vendor. Click "+ Add Product" above to create one.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${products.map(p => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid var(--theme-border); border-radius: 8px; padding: 10px 12px; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
              <span style="font-size: 1.5rem;">${p.emoji || '🛍️'}</span>
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-weight: 700; color: #FFF; font-size: 0.88rem;">${p.name}</span>
                  <span class="pill-status-pending" style="font-size: 0.65rem; padding: 1px 6px;">${p.unit || 'unit'}</span>
                  <span class="${p.visible !== false ? 'pill-status-active' : 'pill-status-suspended'}" style="font-size: 0.65rem; padding: 1px 6px;">
                    ${p.visible !== false ? 'In Stock' : 'Hidden'}
                  </span>
                </div>
                <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-top: 2px;">
                  ${p.description || 'No description'}
                </div>
              </div>
            </div>
            <div style="font-weight: 800; color: #10B981; font-size: 0.95rem; white-space: nowrap;">
              ${currency}${Number(p.price).toLocaleString()}
            </div>
            <div style="display: flex; gap: 5px; flex-shrink: 0;">
              <button class="btn-pill" style="padding: 2px 7px; font-size: 0.7rem; color: var(--theme-secondary);" data-admin-edit-prod="${p.id}">Edit</button>
              <button class="btn-pill" style="padding: 2px 7px; font-size: 0.7rem;" data-admin-toggle-prod="${p.id}">Toggle</button>
              <button class="btn-pill" style="padding: 2px 7px; font-size: 0.7rem; color: #EF4444;" data-admin-del-prod="${p.id}">Delete</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    // Bind item actions
    container.querySelectorAll("[data-admin-toggle-prod]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const pId = btn.getAttribute("data-admin-toggle-prod");
        await db.toggleProduct(vendorId, pId);
        this.renderAdminProductsList(vendorId);
        const tbody = this.container.querySelector("#admin-vendors-tbody");
        if (tbody) tbody.innerHTML = this.renderVendorTableRows();
        this.bindVendorActionButtons();
      });
    });

    container.querySelectorAll("[data-admin-del-prod]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const pId = btn.getAttribute("data-admin-del-prod");
        if (confirm("Delete this product permanently?")) {
          await db.deleteProduct(vendorId, pId);
          window.OmniApp.showToast("Product deleted.");
          this.renderAdminProductsList(vendorId);
          const tbody = this.container.querySelector("#admin-vendors-tbody");
          if (tbody) tbody.innerHTML = this.renderVendorTableRows();
          this.bindVendorActionButtons();
        }
      });
    });

    container.querySelectorAll("[data-admin-edit-prod]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const pId = btn.getAttribute("data-admin-edit-prod");
        const prod = (v.products || []).find(x => x.id === pId);
        if (!prod) return;
        const newName = prompt("Product Name:", prod.name);
        if (newName === null) return;
        const newEmoji = prompt("Emoji / Icon:", prod.emoji || "🛍️");
        if (newEmoji === null) return;
        const newPrice = prompt(`Price (${currency}):`, prod.price);
        if (newPrice === null) return;
        const newUnit = prompt("Unit Type (pack, box, kg, etc.):", prod.unit || "unit");
        if (newUnit === null) return;
        const newDesc = prompt("Description:", prod.description || "");
        if (newDesc === null) return;

        await db.updateProduct(vendorId, pId, {
          name: newName.trim(),
          emoji: newEmoji.trim() || "🛍️",
          price: Number(newPrice || 0),
          unit: newUnit.trim() || "unit",
          description: newDesc.trim()
        });
        window.OmniApp.showToast("Product updated!");
        this.renderAdminProductsList(vendorId);
        const tbody = this.container.querySelector("#admin-vendors-tbody");
        if (tbody) tbody.innerHTML = this.renderVendorTableRows();
        this.bindVendorActionButtons();
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
          const tbody = this.container.querySelector("#admin-vendors-tbody");
          if (tbody) tbody.innerHTML = this.renderVendorTableRows();
          this.bindVendorActionButtons();
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
        const tbody = this.container.querySelector("#admin-vendors-tbody");
        if (tbody) tbody.innerHTML = this.renderVendorTableRows();
        this.bindVendorActionButtons();
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
                <span style="font-size: 0.68rem; color: var(--theme-text-muted);">${r.date || ''}</span>
              </div>
              <div style="font-size: 0.75rem; color: var(--theme-text-muted); margin-top: 3px; font-style: italic;">
                "${r.content}"
              </div>
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
          const tbody = this.container.querySelector("#admin-vendors-tbody");
          if (tbody) tbody.innerHTML = this.renderVendorTableRows();
          this.bindVendorActionButtons();
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
        const tbody = this.container.querySelector("#admin-vendors-tbody");
        if (tbody) tbody.innerHTML = this.renderVendorTableRows();
        this.bindVendorActionButtons();
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
