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
    const vendors = db.getVendors();
    const urlParams = new URLSearchParams(window.location.search);
    const targetSlug = urlParams.get("v");
    const prefillVendor = targetSlug ? db.getVendor(targetSlug) : null;
    const defaultPhone = prefillVendor?.contacts?.whatsapp || prefillVendor?.contacts?.phone || "";

    this.container.innerHTML = `
      <div class="portal-container" style="max-width: 440px;">
        <div class="bento-card" style="padding: 32px 24px; text-align: center;">
          <div style="font-size: 2.6rem; margin-bottom: 12px;">🏪</div>
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
      const phone = this.container.querySelector("#vendor-login-phone").value.trim().replace(/[^\d]/g, "");
      const pin = this.container.querySelector("#vendor-login-pin").value.trim();

      const matched = vendors.find(v => {
        const vPhone = (v.contacts.whatsapp || v.contacts.phone || "").replace(/[^\d]/g, "");
        const vPass = v.password || v.pin || "2026";
        return (vPhone.includes(phone) || phone.includes(vPhone)) && (vPass === pin || v.pin === pin);
      });

      if (matched) {
        this.currentVendor = matched;
        this.renderDashboard();
      } else {
        window.OmniApp.showToast("Invalid WhatsApp number or password.");
      }
    });
  }

  // Admin Direct Login Helper (Allows Admin to manage any vendor from the Super Admin Console)
  loginVendorDirect(vendorId) {
    const v = db.getVendor(vendorId);
    if (v) {
      this.currentVendor = v;
      this.renderDashboard();
    }
  }

  // Logged-in Vendor Dashboard
  renderDashboard() {
    const v = this.currentVendor;
    const settings = db.getPlatformSettings();
    const currency = settings?.currencySymbol || "₹";
    const supportWa = (settings?.supportWhatsApp || "+919876543210").replace(/[^\d]/g, "");
    const waMsg = encodeURIComponent(`Hello Admin, I need assistance regarding my vendor account: ${v.branding.businessName} (${v.id}).`);
    const adminWhatsAppLink = `https://wa.me/${supportWa}?text=${waMsg}`;

    // Ensure activeTab is valid for granted features
    const isTabAvailable = (tab) => {
      if (tab === "profile") return true;
      if (tab === "services") return v.features?.quoteBuilder !== false;
      if (tab === "shop") return v.features?.ecommerceShop !== false;
      if (tab === "bookings") return v.features?.calendarBooking !== false;
      if (tab === "reviews") return v.features?.customerReviews !== false;
      return true;
    };
    if (!isTabAvailable(this.activeTab)) {
      this.activeTab = "profile";
    }

    this.container.innerHTML = `
      <div class="portal-container">
        <!-- Vendor Header Bar -->
        <div class="portal-header">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.8rem;">${v.branding.avatarEmoji || '🏪'}</span>
              <div>
                <h2 style="font-size: 1.3rem;">${v.branding.businessName}</h2>
                <div style="font-size: 0.78rem; color: var(--theme-text-muted);">
                  ${v.branding.category} • Status: <span style="color: #10B981; font-weight: 700;">${v.status.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
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

        <!-- Portal Tabs Navigation -->
        <div class="portal-nav-tabs">
          <button class="portal-tab-btn ${this.activeTab === 'profile' ? 'active' : ''}" data-vtab="profile">
            🎨 Profile
          </button>
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
                  <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Official WhatsApp Number</span>
                    <span style="font-size: 0.7rem; color: #EF4444; background: rgba(239, 68, 68, 0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.2);">🔒 Admin Managed</span>
                  </label>
                  <input type="text" class="form-input" id="v-whatsapp" value="${v.contacts.whatsapp || ''}" disabled readonly style="opacity: 0.65; cursor: not-allowed; background: rgba(255,255,255,0.03);" />
                  <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-top: 4px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                    <span>🔒 Official order receiving number is secured.</span>
                    <a href="${adminWhatsAppLink}" target="_blank" rel="noopener" style="color: var(--theme-primary); text-decoration: underline; font-weight: 600;">Contact Admin to change ↗</a>
                  </div>
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
                        <span class="pill-status-pending" style="color: var(--theme-primary); border-color: rgba(212,255,0,0.25);">
                          💬 Quote on Request
                        </span>
                      </td>
                      <td>
                        <span class="${s.visible ? 'pill-status-active' : 'pill-status-suspended'}">
                          ${s.visible ? 'Visible' : 'Hidden'}
                        </span>
                      </td>
                      <td>
                        <div style="display: flex; gap: 6px;">
                          <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: var(--theme-secondary);" data-edit-srv="${s.id}">Edit</button>
                          <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem;" data-toggle-srv="${s.id}">Toggle</button>
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
                        <span class="${p.visible ? 'pill-status-active' : 'pill-status-suspended'}">
                          ${p.visible ? 'In Stock' : 'Hidden'}
                        </span>
                      </td>
                      <td>
                        <div style="display: flex; gap: 6px;">
                          <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem; color: var(--theme-secondary);" data-edit-prod="${p.id}">Edit</button>
                          <button class="btn-pill" style="padding: 3px 8px; font-size: 0.72rem;" data-toggle-prod="${p.id}">Toggle</button>
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
                    <div style="font-size: 0.8rem; color: #E2E8F0; margin-bottom: 8px; line-height: 1.4;">${r.content}</div>
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
      </div>

      <!-- Modal: Add Service -->
      <div class="modal-overlay" id="modal-add-service">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Add New Service (Quote on Request)</h3>
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
            <h3 class="modal-title">Edit Service (Quote on Request)</h3>
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
              <label class="form-label">Review Content</label>
              <textarea class="form-textarea" id="edit-rev-content" rows="3" required></textarea>
            </div>
            <button type="submit" class="btn-submit-primary">Save Review Changes</button>
          </form>
        </div>
      </div>
    `;

    this.bindDashboardEvents();
  }

  bindDashboardEvents() {
    const v = this.currentVendor;

    // Logout
    const logoutBtn = this.container.querySelector("#btn-vendor-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this.currentVendor = null;
        this.renderLoginForm();
      });
    }

    // Tab switching
    this.container.querySelectorAll(".portal-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-vtab");
        this.activeTab = tab;
        this.renderDashboard();
      });
    });

    // Profile Save
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
        // WhatsApp number is protected and ONLY modifiable by Super Admin:
        // v.contacts.whatsapp remains preserved
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
        this.container.querySelector("#modal-add-service")?.classList.remove("active");
        window.OmniApp.showToast("New service added!");
        this.renderDashboard();
      });
    }

    // Edit Service Modal Trigger & Populate
    this.container.querySelectorAll("[data-edit-srv]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit-srv");
        const s = v.services?.find(x => x.id === id);
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
        this.container.querySelector("#modal-edit-service")?.classList.remove("active");
        window.OmniApp.showToast("Service updated successfully!");
        this.renderDashboard();
      });
    }

    // Toggle & Delete Services
    this.container.querySelectorAll("[data-toggle-srv]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-toggle-srv");
        await db.toggleService(v.id, id);
        this.renderDashboard();
      });
    });

    this.container.querySelectorAll("[data-del-srv]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del-srv");
        if (confirm("Are you sure you want to remove this service?")) {
          await db.deleteService(v.id, id);
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
        this.container.querySelector("#modal-add-product")?.classList.remove("active");
        window.OmniApp.showToast("Product added to catalog!");
        this.renderDashboard();
      });
    }

    // Edit Product Modal Opener
    this.container.querySelectorAll("[data-edit-prod]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit-prod");
        const p = (v.products || []).find(x => x.id === id);
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
        this.container.querySelector("#modal-edit-product")?.classList.remove("active");
        window.OmniApp.showToast(`Updated product '${name}' successfully!`);
        this.renderDashboard();
      });
    }

    // Toggle & Delete Product
    this.container.querySelectorAll("[data-toggle-prod]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-toggle-prod");
        await db.toggleProduct(v.id, id);
        this.renderDashboard();
      });
    });

    this.container.querySelectorAll("[data-del-prod]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del-prod");
        if (confirm("Delete this product permanently from your catalog?")) {
          await db.deleteProduct(v.id, id);
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
        window.OmniApp.showToast("Booking status updated to " + select.value);
      });
    });

    // Open Edit Booking Modal
    this.container.querySelectorAll("[data-edit-bkg]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit-bkg");
        const b = (v.bookings || []).find(x => x.id === id);
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
        const r = (v.reviews || []).find(x => x.id === id);
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
  }
}


