// Module 1: Public Digital Business Card (vCard) Controller
import { db } from "./db.js";
import { WhatsAppEngine } from "./whatsapp.js";

export class VCardController {
  constructor(containerEl) {
    this.container = containerEl;
    this.vendor = null;
    this.activeTab = "home";
    this.selectedServices = new Set();
    this.cart = {}; // { productId: quantity }
    this.selectedDate = new Date();
    this.selectedSlot = "11:00 AM";
    this.selectedReviewRating = 5;
    this.selectedReviewTags = new Set();
    this.serviceFilter = "All";
  }

  async loadVendor(idOrSlug) {
    const v = db.getVendor(idOrSlug);
    if (!v) {
      this.container.innerHTML = `
        <div style="padding: 60px 20px; text-align: center;">
          <h2 style="font-size: 1.5rem; margin-bottom: 12px; color: #EF4444;">Vendor Not Found</h2>
          <p style="color: var(--theme-text-muted); font-size: 0.9rem; margin-bottom: 20px;">
            The requested business card does not exist or has been removed.
          </p>
          <button class="btn-pill active" onclick="location.search='?v=elite-catering'">View Demo Card</button>
        </div>
      `;
      return;
    }
    this.vendor = v;
    this.selectedServices.clear();
    this.cart = {};
    this.applyTheme();
    this.render();
  }

  applyTheme() {
    if (!this.vendor?.branding) return;
    const b = this.vendor.branding;
    document.body.setAttribute("data-theme", b.theme || "Sunset Dark");

    if (b.colors) {
      if (b.colors.primary) document.documentElement.style.setProperty("--theme-primary", b.colors.primary);
      if (b.colors.secondary) document.documentElement.style.setProperty("--theme-secondary", b.colors.secondary);
      if (b.colors.background) document.documentElement.style.setProperty("--theme-bg", b.colors.background);
      if (b.colors.cardBg) document.documentElement.style.setProperty("--theme-card-bg", b.colors.cardBg);
    }
  }

  // Calculate review metrics
  getReviewStats() {
    const reviews = this.vendor?.reviews || [];
    if (reviews.length === 0) return { avg: "5.0", count: 0 };
    const total = reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    return {
      avg: (total / reviews.length).toFixed(1),
      count: reviews.length
    };
  }

  // Check if expiring within 24 hours
  isNearingExpiry() {
    if (!this.vendor?.expiresAt) return false;
    const expiry = new Date(this.vendor.expiresAt).getTime();
    const now = Date.now();
    const diffHours = (expiry - now) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= (this.vendor.notices?.expiryNoticeHoursThreshold || 24);
  }

  render() {
    const v = this.vendor;
    const stats = this.getReviewStats();
    const currency = db.getPlatformSettings()?.currencySymbol || "₹";

    const isExpiring = this.isNearingExpiry();

    this.container.innerHTML = `
      <div class="vcard-app">
        ${v.notices?.marquee ? `
          <div class="notice-marquee">
            <div class="marquee-content">
              📢 ${v.notices.marquee}
            </div>
          </div>
        ` : ""}

        <!-- Tab 1: Profile & About Pane -->
        <div class="tab-pane ${this.activeTab === 'home' ? 'active' : ''}" id="pane-home">
          
          <!-- Top Navigation Header inside vCard -->
          <div class="vcard-top-nav">
            <a href="?view=home" class="vcard-circle-btn" title="Back to Packages">
              <span>←</span>
            </a>
            <div style="display: flex; gap: 8px;">
              <button class="vcard-circle-btn" id="btn-vcard-settings" title="Vendor Management Console">
                <span>⚙️</span>
              </button>
              <button class="vcard-circle-btn" id="btn-vcard-share" title="Share Business Card">
                <span>📤</span>
              </button>
            </div>
          </div>

          <!-- Centered Glowing Avatar Ring -->
          <div class="avatar-ring-wrapper" id="vcard-avatar-wrapper" title="Hold 1.5s for Vendor Console">
            <div class="avatar-glowing-ring" id="vcard-avatar-ring">
              ${v.branding.avatarEmoji || (v.branding.businessName ? v.branding.businessName.substring(0, 2).toUpperCase() : "💼")}
            </div>
          </div>

          <!-- Dual Badges: Category + Verified Partner -->
          <div class="vcard-badges-row">
            <span class="vcard-tier-pill">👑 ${v.branding.category.toUpperCase()}</span>
            <span class="vcard-verified-pill">🛡️ VERIFIED</span>
          </div>

          <!-- Business Titles -->
          <h1 class="vcard-hero-name">${v.branding.businessName}</h1>
          <div class="vcard-hero-subtitle">${v.branding.ownerName} · ${v.branding.category}</div>
          <div class="vcard-hero-location">
            <span style="color: #FFA500;">📍</span>
            <span>${v.contacts.location}</span>
          </div>

          <!-- Status Pills (Open Now + Reviews) -->
          <div class="vcard-badges-row" style="margin-bottom: 20px;">
            <div class="status-pill ${v.isOpen ? 'open' : 'closed'}">
              <span class="status-dot"></span>
              <span>${v.isOpen ? 'OPEN NOW' : 'CLOSED'}</span>
            </div>
            <div class="rating-pill">
              <span>★</span>
              <span>${stats.avg} (${stats.count} REVIEWS)</span>
            </div>
          </div>

          <!-- About Our Business Card -->
          <div class="about-business-card">
            <div class="about-icon-box">
              <span>${v.branding.avatarEmoji || "🍽️"}</span>
            </div>
            <div style="flex: 1;">
              <div class="about-text-title">
                <span>👤</span>
                <span>About Our Business</span>
              </div>
              <div class="about-text-desc">
                ${v.about?.description || v.branding.tagline || 'Excellence in service and customer satisfaction.'}
              </div>
            </div>
          </div>

          <!-- 4 Circular Floating Contact Buttons in a Row -->
          <div class="contact-circles-row">
            <button class="contact-circle-btn btn-wa" id="btn-quick-whatsapp" title="WhatsApp Chat">
              <span>💬</span>
            </button>
            <a href="tel:${v.contacts.phone}" class="contact-circle-btn" title="Phone Call">
              <span>📞</span>
            </a>
            <a href="mailto:${v.contacts.email}" class="contact-circle-btn" title="Send Email">
              <span>✉️</span>
            </a>
            <a href="${v.contacts.mapUrl || '#'}" target="_blank" rel="noopener" class="contact-circle-btn" title="Get Directions">
              <span>📍</span>
            </a>
          </div>

          <!-- Promotional Offer Banner (if enabled) -->
          ${v.features.promoBanner && v.promo?.enabled ? `
            <div class="promo-card" style="margin: 0 16px 18px;">
              <span class="promo-badge">${v.promo.badge || "SPECIAL OFFER"}</span>
              <h3 class="promo-title">${v.promo.title}</h3>
              <p class="promo-desc">${v.promo.discount}</p>
              <button class="btn-claim-offer" id="btn-claim-promo">
                <span>Claim Offer</span>
                <span>⚡</span>
              </button>
            </div>
          ` : ""}

          <!-- BUSINESS INFORMATION Section Card -->
          <div class="biz-info-card">
            <div class="biz-info-header">BUSINESS INFORMATION</div>
            
            <div class="biz-info-item">
              <span class="biz-info-icon">📞</span>
              <div>
                <div class="biz-info-val">${v.contacts.phone}</div>
                <div class="biz-info-lbl">Phone</div>
              </div>
            </div>

            <div class="biz-info-item">
              <span class="biz-info-icon">✉️</span>
              <div>
                <div class="biz-info-val">${v.contacts.email}</div>
                <div class="biz-info-lbl">Email Address</div>
              </div>
            </div>

            <div class="biz-info-item">
              <span class="biz-info-icon">📍</span>
              <div>
                <div class="biz-info-val">${v.contacts.location}</div>
                <div class="biz-info-lbl">Address</div>
              </div>
            </div>

            ${v.openHours ? `
              <div class="biz-info-item">
                <span class="biz-info-icon">⏰</span>
                <div>
                  <div class="biz-info-val">${v.openHours}</div>
                  <div class="biz-info-lbl">Working Hours</div>
                </div>
              </div>
            ` : ""}

            ${v.contacts.mapUrl ? `
              <a href="${v.contacts.mapUrl}" target="_blank" rel="noopener" class="btn-pill" style="width: 100%; justify-content: center; margin-top: 14px; text-decoration: none; padding: 10px; font-weight: 700; font-size: 0.82rem;">
                <span>Open in Google Maps</span>
                <span>↗</span>
              </a>
            ` : ""}
          </div>

        </div>

        <!-- Tab 2: Services Catalog & Quote Request Builder (Clean Dedicated Page) -->
        <div class="tab-pane ${this.activeTab === 'services' ? 'active' : ''}" id="pane-services">
          <div class="vcard-tab-topbar">
            <div class="tab-topbar-left">
              <div class="tab-topbar-avatar" data-tab-avatar="true" title="Hold for Owner">${v.branding.avatarEmoji || "📋"}</div>
              <div>
                <div class="tab-topbar-title">Services & Quote Request</div>
                <div class="tab-topbar-subtitle">Select services to receive an itemized quote on WhatsApp</div>
              </div>
            </div>
          </div>

          <!-- Category filter chips -->
          <div class="services-filter-bar" id="services-filter-container">
            ${this.renderServiceCategoryChips()}
          </div>

          <!-- Services List -->
          <div id="services-list-container">
            ${this.renderServicesList()}
          </div>

          <!-- Inline Quote Request Preview (Replaces overlapping popup) -->
          <div id="quote-preview-container">
            ${this.renderQuotePreviewCard()}
          </div>
        </div>

        <!-- Tab 3: Shop / Product Catalog (Clean Dedicated Page) -->
        <div class="tab-pane ${this.activeTab === 'shop' ? 'active' : ''}" id="pane-shop">
          <div class="vcard-tab-topbar">
            <div class="tab-topbar-left">
              <div class="tab-topbar-avatar" data-tab-avatar="true" title="Hold for Owner">${v.branding.avatarEmoji || "🛍️"}</div>
              <div>
                <div class="tab-topbar-title">Shop Products</div>
                <div class="tab-topbar-subtitle">Order items directly via WhatsApp</div>
              </div>
            </div>
          </div>

          <!-- Products Listing Stack -->
          <div class="products-listing-stack" id="products-list-container">
            ${this.renderProductsList(currency)}
          </div>

          <!-- Inline Cart Preview & Order (Replaces overlapping popup) -->
          <div id="cart-preview-container">
            ${this.renderCartPreviewCard(currency)}
          </div>
        </div>

        <!-- Tab 4: Appointment & Booking Calendar (Clean Dedicated Page) -->
        <div class="tab-pane ${this.activeTab === 'calendar' ? 'active' : ''}" id="pane-calendar">
          <div class="vcard-tab-topbar">
            <div class="tab-topbar-left">
              <div class="tab-topbar-avatar" data-tab-avatar="true" title="Hold for Owner">${v.branding.avatarEmoji || "📅"}</div>
              <div>
                <div class="tab-topbar-title">Book an Appointment</div>
                <div class="tab-topbar-subtitle">Select date & preferred time slot</div>
              </div>
            </div>
          </div>

          <!-- Calendar Widget -->
          <div class="calendar-widget">
            <div class="calendar-nav-bar">
              <button class="btn-cal-arrow" id="btn-cal-prev">‹</button>
              <div class="calendar-month-title" id="cal-month-title"></div>
              <button class="btn-cal-arrow" id="btn-cal-next">›</button>
            </div>
            <div class="calendar-grid-header">
              <span>SU</span><span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span>
            </div>
            <div class="calendar-days-grid" id="cal-days-grid"></div>
          </div>

          <!-- Available Slots -->
          <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--theme-text-muted); margin-bottom: 6px;">
            Available Time Slots
          </div>
          <div class="slot-selector-grid" id="slots-grid">
            ${["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"].map(s => `
              <button class="slot-btn ${this.selectedSlot === s ? 'selected' : ''}" data-slot="${s}">
                ${s}
              </button>
            `).join("")}
          </div>

          <!-- Booking Details Form -->
          <div class="bento-card">
            <div class="form-group">
              <label class="form-label">Select Service / Purpose</label>
              <select class="form-select" id="booking-service-select">
                ${v.services.filter(s => s.visible).map(s => `
                  <option value="${s.name}">${s.name} (${currency}${s.price})</option>
                `).join("")}
                <option value="General Consultation">General Consultation (${currency}${v.about.consultationFee || 0})</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Your Full Name</label>
              <input type="text" class="form-input" id="booking-client-name" placeholder="e.g. Ramesh Chandra" required />
            </div>

            <div class="form-group">
              <label class="form-label">WhatsApp Mobile Number</label>
              <input type="tel" class="form-input" id="booking-client-phone" placeholder="e.g. 9876543210" required />
            </div>

            <div class="form-group">
              <label class="form-label">Special Notes / Requirements (Optional)</label>
              <textarea class="form-textarea" id="booking-client-notes" rows="2" placeholder="Mention guest count, dietary preference, or specific concerns..."></textarea>
            </div>

            <button class="btn-submit-primary" id="btn-submit-booking">
              <span>Confirm & Send on WhatsApp</span>
              <span>📅</span>
            </button>
          </div>
        </div>

        <!-- Tab 5: Ratings & Customer Reviews (Clean Dedicated Page) -->
        <div class="tab-pane ${this.activeTab === 'reviews' ? 'active' : ''}" id="pane-reviews">
          <div class="vcard-tab-topbar">
            <div class="tab-topbar-left">
              <div class="tab-topbar-avatar" data-tab-avatar="true" title="Hold for Owner">${v.branding.avatarEmoji || "★"}</div>
              <div>
                <div class="tab-topbar-title">Customer Reviews</div>
                <div class="tab-topbar-subtitle">Verified feedback from genuine clients</div>
              </div>
            </div>
            <button class="btn-pill active" id="btn-open-review-modal" style="font-size: 0.74rem; padding: 4px 10px;">
              <span>Write Review</span>
              <span>★</span>
            </button>
          </div>

          <!-- Rating Overview -->
          <div class="rating-overview-card">
            <div>
              <div class="rating-big-score">${stats.avg}</div>
              <div class="rating-stars-row">★★★★★</div>
              <div style="font-size: 0.75rem; color: var(--theme-text-muted);">Based on ${stats.count} ratings</div>
            </div>
            <div style="flex: 1; font-size: 0.8rem; color: var(--theme-text-muted); border-left: 1px solid var(--theme-border); padding-left: 16px;">
              <p style="color: #FFF; font-weight: 600; margin-bottom: 4px;">Top Client Compliments</p>
              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                ${(v.reviewTags || []).slice(0, 4).map(t => `<span class="review-tag-chip">✓ ${t}</span>`).join("")}
              </div>
            </div>
          </div>

          <!-- Reviews List -->
          <div id="reviews-list-container">
            ${this.renderReviewsList()}
          </div>
        </div>
      </div>

      <!-- Modals Container -->
      ${this.renderModals(currency)}
    `;

    this.renderBottomDock();
    this.bindEvents();
    this.renderCalendar();
  }

  renderBottomDock() {
    const dockRoot = document.getElementById("app-dock-root");
    if (!dockRoot) return;
    const v = this.vendor;
    dockRoot.style.display = "block";
    dockRoot.innerHTML = `
      <div class="bottom-dock">
        <button class="dock-item ${this.activeTab === 'home' ? 'active' : ''}" data-tab="home">
          <span class="dock-icon">🏠</span>
          <span class="dock-label">Home</span>
        </button>
        <button class="dock-item ${this.activeTab === 'services' ? 'active' : ''}" data-tab="services">
          <span class="dock-icon">📋</span>
          <span class="dock-label">Services</span>
        </button>
        ${v.features.ecommerceShop ? `
          <button class="dock-item ${this.activeTab === 'shop' ? 'active' : ''}" data-tab="shop">
            <span class="dock-icon">🛍️</span>
            <span class="dock-label">Shop</span>
            ${this.getCartTotalItems() > 0 ? `<span class="badge-cart-count">${this.getCartTotalItems()}</span>` : ""}
          </button>
        ` : ""}
        <button class="dock-item ${this.activeTab === 'calendar' ? 'active' : ''}" data-tab="calendar">
          <span class="dock-icon">📅</span>
          <span class="dock-label">Book</span>
        </button>
        <button class="dock-item ${this.activeTab === 'reviews' ? 'active' : ''}" data-tab="reviews">
          <span class="dock-icon">★</span>
          <span class="dock-label">Reviews</span>
        </button>
      </div>
    `;

    // Bind dock events
    dockRoot.querySelectorAll(".dock-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        this.switchTab(tab);
      });
    });
  }

  renderServiceCategoryChips() {
    const services = this.vendor?.services || [];
    const categories = ["All", ...new Set(services.map(s => s.category).filter(Boolean))];
    return categories.map(cat => `
      <button class="filter-chip ${this.serviceFilter === cat ? 'active' : ''}" data-category="${cat}">
        ${cat}
      </button>
    `).join("");
  }

  renderServicesList() {
    const services = (this.vendor?.services || []).filter(s => {
      if (!s.visible) return false;
      if (this.serviceFilter === "All") return true;
      return s.category === this.serviceFilter;
    });

    if (services.length === 0) {
      return `<div style="text-align: center; padding: 24px; color: var(--theme-text-muted);">No services available in this category.</div>`;
    }

    return services.map(s => {
      const isChecked = this.selectedServices.has(s.id);
      return `
        <div class="service-card ${isChecked ? 'selected' : ''}" data-service-id="${s.id}">
          <input type="checkbox" class="service-checkbox" ${isChecked ? 'checked' : ''} />
          <div class="service-body">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
              <div class="service-name" style="margin-bottom: 0;">${s.name}</div>
              <span class="pill-status-pending" style="font-size: 0.68rem; padding: 2px 7px; color: var(--theme-primary); border-color: rgba(212,255,0,0.25); white-space: nowrap;">Quote on Request</span>
            </div>
            <div class="service-desc">${s.description || 'Custom tailored service delivery based on your specifications.'}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  renderProductsList(currency) {
    const products = (this.vendor?.products || []).filter(p => p.visible);
    if (products.length === 0) {
      return `<div style="text-align: center; padding: 24px; color: var(--theme-text-muted);">No products currently in catalog.</div>`;
    }

    return products.map(p => {
      const qty = this.cart[p.id] || 0;
      return `
        <div class="product-list-item">
          <div class="prod-thumb-badge">${p.emoji || "🛍️"}</div>
          <div class="prod-info-col">
            <div class="prod-name-row">
              <span class="prod-title">${p.name}</span>
              <span class="prod-unit-tag">${p.unit || 'unit'}</span>
            </div>
            <div class="prod-desc-text">${p.description}</div>
            <div class="prod-price-text">${currency}${Number(p.price).toLocaleString()}</div>
          </div>
          <div class="prod-action-col">
            <div class="qty-counter">
              <button class="qty-btn" data-cart-action="dec" data-prod-id="${p.id}" title="Decrease">−</button>
              <span class="qty-val">${qty}</span>
              <button class="qty-btn" data-cart-action="inc" data-prod-id="${p.id}" title="Increase">+</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  renderReviewsList() {
    const reviews = this.vendor?.reviews || [];
    if (reviews.length === 0) {
      return `<div style="text-align: center; padding: 24px; color: var(--theme-text-muted);">Be the first client to leave a review!</div>`;
    }

    return reviews.map(r => `
      <div class="review-item-card">
        <div class="review-author-row">
          <div class="review-author-name">${r.author}</div>
          <div class="review-date">${r.date}</div>
        </div>
        <div style="color: #F59E0B; font-size: 0.82rem; margin-bottom: 4px;">
          ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}
        </div>
        ${r.tags?.length ? `
          <div class="review-tags-cluster">
            ${r.tags.map(t => `<span class="review-tag-chip">${t}</span>`).join("")}
          </div>
        ` : ""}
        <div class="review-content">${r.content}</div>
      </div>
    `).join("");
  }

  renderQuotePreviewCard() {
    const v = this.vendor;
    const selectedList = (v.services || []).filter(s => this.selectedServices.has(s.id));
    const count = selectedList.length;

    return `
      <div class="quote-preview-card" id="quote-preview-card">
        <div class="quote-preview-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(212,255,0,0.15); color: var(--theme-primary); display: flex; align-items: center; justify-content: center; font-size: 1.15rem;">📋</div>
            <div>
              <div style="font-size: 0.95rem; font-weight: 700; color: #FFFFFF;">Selected Services Preview</div>
              <div style="font-size: 0.74rem; color: var(--theme-text-muted);">
                ${count > 0 ? `${count} service(s) selected for inquiry` : "Select services from the catalog above"}
              </div>
            </div>
          </div>
          ${count > 0 ? `<span class="pill-status-active" style="font-size: 0.68rem; padding: 2px 8px;">${count} Selected</span>` : ''}
        </div>

        ${count === 0 ? `
          <div class="preview-empty-notice">
            No services selected yet. Tap any service card above to add it to your custom quote inquiry.
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px;">
            ${selectedList.map(s => `
              <div class="quote-preview-item">
                <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                  <span style="color: var(--theme-primary); font-size: 0.9rem;">✓</span>
                  <div style="min-width: 0;">
                    <div style="font-size: 0.85rem; font-weight: 700; color: #FFFFFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.name}</div>
                    <div style="font-size: 0.68rem; color: var(--theme-text-muted);">${s.category || 'Service'} · Quote on Request</div>
                  </div>
                </div>
                <button type="button" class="cart-preview-remove-btn" data-remove-service="${s.id}" title="Remove Service">✕</button>
              </div>
            `).join("")}
          </div>

          <div style="background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); padding: 12px; margin-bottom: 12px;">
            <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--theme-text-muted); margin-bottom: 8px;">
              Customer Inquiry Details for WhatsApp:
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.68rem;">Your Name *</label>
                <input type="text" class="form-input" id="quote-inline-name" placeholder="e.g. Priya Sharma" style="padding: 7px 10px; font-size: 0.8rem;" />
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.68rem;">WhatsApp Number *</label>
                <input type="tel" class="form-input" id="quote-inline-phone" placeholder="e.g. 9811223344" style="padding: 7px 10px; font-size: 0.8rem;" />
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.68rem;">Timeline / Event Date</label>
                <input type="date" class="form-input" id="quote-inline-date" style="padding: 6px 10px; font-size: 0.8rem;" />
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.68rem;">Special Requirements</label>
                <input type="text" class="form-input" id="quote-inline-notes" placeholder="e.g. Budget, location" style="padding: 7px 10px; font-size: 0.8rem;" />
              </div>
            </div>
          </div>

          <button type="button" class="btn-submit-primary" id="btn-submit-inline-quote" style="width: 100%; justify-content: center; padding: 11px;">
            <span>Submit Quote Request to ${v.branding.businessName}</span>
            <span>💬 ↗</span>
          </button>
        `}
      </div>
    `;
  }

  renderCartPreviewCard(currency) {
    const v = this.vendor;
    const totalItems = this.getCartTotalItems();
    const subtotal = this.getCartSubtotal();
    const cartEntries = Object.entries(this.cart).filter(([_, qty]) => qty > 0);

    return `
      <div class="cart-preview-card" id="cart-preview-card">
        <div class="cart-preview-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(16,185,129,0.15); color: #10B981; display: flex; align-items: center; justify-content: center; font-size: 1.15rem;">🛒</div>
            <div>
              <div style="font-size: 0.95rem; font-weight: 700; color: #FFFFFF;">Cart Preview & Order</div>
              <div style="font-size: 0.74rem; color: var(--theme-text-muted);">
                ${totalItems > 0 ? `${totalItems} item(s) selected in your order` : "Add items above to preview order"}
              </div>
            </div>
          </div>
          ${totalItems > 0 ? `
            <div style="text-align: right;">
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--theme-primary);">
                ${currency}${subtotal.toLocaleString()}
              </div>
            </div>
          ` : ''}
        </div>

        ${totalItems === 0 ? `
          <div class="preview-empty-notice">
            Your cart is currently empty. Tap <b>+</b> on any product above to preview your order and submit to ${v.branding.businessName}.
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
            ${cartEntries.map(([id, qty]) => {
              const p = (v.products || []).find(prod => prod.id === id);
              if (!p) return "";
              const lineTotal = p.price * qty;
              return `
                <div class="cart-preview-item">
                  <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
                    <span style="font-size: 1.3rem;">${p.emoji || '🛍️'}</span>
                    <div style="min-width: 0; flex: 1;">
                      <div style="font-size: 0.85rem; font-weight: 700; color: #FFFFFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</div>
                      <div style="font-size: 0.72rem; color: var(--theme-text-muted);">
                        ${currency}${p.price.toLocaleString()} / ${p.unit || 'unit'}
                      </div>
                    </div>
                  </div>

                  <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                    <div class="qty-counter">
                      <button class="qty-btn" data-cart-action="dec" data-prod-id="${p.id}">−</button>
                      <span class="qty-val">${qty}</span>
                      <button class="qty-btn" data-cart-action="inc" data-prod-id="${p.id}">+</button>
                    </div>
                    <div style="font-size: 0.88rem; font-weight: 700; color: var(--theme-primary); min-width: 54px; text-align: right;">
                      ${currency}${lineTotal.toLocaleString()}
                    </div>
                    <button type="button" class="cart-preview-remove-btn" data-cart-remove="${p.id}" title="Remove item">🗑️</button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>

          <div style="background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); padding: 12px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; font-weight: 800; color: #FFF; padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.08);">
              <span>Total Payable:</span>
              <span style="color: var(--theme-primary); font-size: 1.2rem;">${currency}${subtotal.toLocaleString()}</span>
            </div>

            <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--theme-text-muted); margin-bottom: 8px;">
              Customer Order Details for WhatsApp:
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.68rem;">Your Name *</label>
                <input type="text" class="form-input" id="cart-inline-name" placeholder="e.g. Anish Gupta" style="padding: 7px 10px; font-size: 0.8rem;" />
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.68rem;">WhatsApp Number *</label>
                <input type="tel" class="form-input" id="cart-inline-phone" placeholder="e.g. 9822334455" style="padding: 7px 10px; font-size: 0.8rem;" />
              </div>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.68rem;">Delivery Address or Table Number *</label>
              <textarea class="form-textarea" id="cart-inline-address" rows="2" placeholder="e.g. Flat 302, Green Valley Apartments or Table 4" style="padding: 7px 10px; font-size: 0.8rem;"></textarea>
            </div>
          </div>

          <button type="button" class="btn-submit-primary" id="btn-submit-inline-cart" style="width: 100%; justify-content: center; padding: 11px;">
            <span>Submit Order to ${v.branding.businessName}</span>
            <span>🛍️ ↗</span>
          </button>
        `}
      </div>
    `;
  }

  renderModals(currency) {
    const v = this.vendor;
    return `

      <!-- Modal: Write a Review -->
      <div class="modal-overlay" id="modal-review">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title"><span>★</span> Rate & Review</h3>
            <button class="btn-modal-close" data-close-modal="modal-review">×</button>
          </div>

          <div class="interactive-stars" id="review-stars-selector">
            <span data-star="1" class="active">★</span>
            <span data-star="2" class="active">★</span>
            <span data-star="3" class="active">★</span>
            <span data-star="4" class="active">★</span>
            <span data-star="5" class="active">★</span>
          </div>

          <div class="form-group">
            <label class="form-label">Quick Feedback Tags</label>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;" id="review-tags-picker">
              ${(v.reviewTags || []).map(tag => `
                <button type="button" class="filter-chip" data-review-tag="${tag}">${tag}</button>
              `).join("")}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Your Name</label>
            <input type="text" class="form-input" id="review-client-name" placeholder="e.g. Divya Malhotra" required />
          </div>

          <div class="form-group">
            <label class="form-label">Your Review Comment</label>
            <textarea class="form-textarea" id="review-client-text" rows="3" placeholder="Describe your experience with our team and services..." required></textarea>
          </div>

          <button class="btn-submit-primary" id="btn-submit-review">
            <span>Publish Review</span>
            <span>🚀</span>
          </button>
        </div>
      </div>

      <!-- Modal: Secret Vendor Owner Authentication (Activated via Logo Long-Press) -->
      <div class="modal-overlay" id="modal-owner-pin">
        <div class="modal-card" style="max-width: 380px; text-align: center;">
          <div class="modal-header">
            <h3 class="modal-title"><span>🔐</span> Owner Access</h3>
            <button class="btn-modal-close" data-close-modal="modal-owner-pin">×</button>
          </div>
          <p style="font-size: 0.82rem; color: var(--theme-text-muted); margin-bottom: 16px;">
            Enter vendor password for <b>${v.branding.businessName}</b> (provided by Admin) to unlock your management console.
          </p>
          <form id="form-secret-owner-pin">
            <div class="form-group">
              <input type="password" class="form-input" id="input-owner-secret-pin" placeholder="Enter owner password" required style="font-size: 1.1rem; text-align: center; letter-spacing: 2px; padding: 12px;" />
            </div>
            <button type="submit" class="btn-submit-primary">
              <span>Verify Password & Open Console</span>
              <span>→</span>
            </button>
          </form>
          <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-top: 12px;">
            🔒 Confidential Owner Login. Customers cannot access this panel.
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const v = this.vendor;

    // Bottom Navigation Dock Tabs
    this.container.querySelectorAll(".dock-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        this.switchTab(tab);
      });
    });

    // Settings Gear -> Open Owner Login
    const settingsBtn = this.container.querySelector("#btn-vcard-settings");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        const modal = this.container.querySelector("#modal-owner-pin");
        if (modal) modal.classList.add("active");
      });
    }

    // Share Card -> Native share or copy link
    const shareBtn = this.container.querySelector("#btn-vcard-share");
    if (shareBtn) {
      shareBtn.addEventListener("click", async () => {
        const shareData = {
          title: v.branding.businessName,
          text: `Check out ${v.branding.businessName} smart digital vCard!`,
          url: window.location.href
        };
        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            // share cancelled or unsupported
          }
        } else {
          try {
            await navigator.clipboard.writeText(window.location.href);
            window.OmniApp.showToast("vCard link copied to clipboard!");
          } catch (e) {
            window.OmniApp.showToast("Link: " + window.location.href);
          }
        }
      });
    }

    // Quick WhatsApp contact
    const quickWa = this.container.querySelector("#btn-quick-whatsapp");
    if (quickWa) {
      quickWa.addEventListener("click", () => {
        WhatsAppEngine.openChat(
          v.contacts.whatsapp,
          `Hello *${v.branding.businessName}*, I found your smart card and would like to inquire about your services!`
        );
      });
    }

    // Claim promo deal
    const claimBtn = this.container.querySelector("#btn-claim-promo");
    if (claimBtn) {
      claimBtn.addEventListener("click", () => {
        const text = WhatsAppEngine.buildClaimOfferMessage(v, v.promo);
        WhatsAppEngine.openChat(v.contacts.whatsapp, text);
      });
    }

    // Category filter chips
    this.container.querySelectorAll(".filter-chip[data-category]").forEach(chip => {
      chip.addEventListener("click", () => {
        this.serviceFilter = chip.getAttribute("data-category");
        this.container.querySelector("#services-filter-container").innerHTML = this.renderServiceCategoryChips();
        this.container.querySelector("#services-list-container").innerHTML = this.renderServicesList();
        this.bindCategoryEvents();
        this.bindServiceCheckboxEvents();
      });
    });

    this.bindServiceCheckboxEvents();
    this.bindCartEvents();
    this.bindCalendarEvents();
    this.bindModalEvents();
    this.bindAvatarLongPress();
  }

  bindCategoryEvents() {
    this.container.querySelectorAll(".filter-chip[data-category]").forEach(chip => {
      chip.addEventListener("click", () => {
        this.serviceFilter = chip.getAttribute("data-category");
        this.container.querySelector("#services-filter-container").innerHTML = this.renderServiceCategoryChips();
        this.container.querySelector("#services-list-container").innerHTML = this.renderServicesList();
        this.bindCategoryEvents();
        this.bindServiceCheckboxEvents();
      });
    });
  }

  bindServiceCheckboxEvents() {
    this.container.querySelectorAll(".service-card").forEach(card => {
      card.addEventListener("click", (e) => {
        const serviceId = card.getAttribute("data-service-id");
        if (this.selectedServices.has(serviceId)) {
          this.selectedServices.delete(serviceId);
          card.classList.remove("selected");
          const cb = card.querySelector(".service-checkbox");
          if (cb) cb.checked = false;
        } else {
          this.selectedServices.add(serviceId);
          card.classList.add("selected");
          const cb = card.querySelector(".service-checkbox");
          if (cb) cb.checked = true;
        }

        this.updateQuotePreview();
      });
    });

    this.bindInlineQuoteEvents();
  }

  updateQuotePreview() {
    const container = this.container.querySelector("#quote-preview-container");
    if (container) {
      // Preserve customer inputs if already typed
      const prevName = this.container.querySelector("#quote-inline-name")?.value;
      const prevPhone = this.container.querySelector("#quote-inline-phone")?.value;
      const prevDate = this.container.querySelector("#quote-inline-date")?.value;
      const prevNotes = this.container.querySelector("#quote-inline-notes")?.value;

      container.innerHTML = this.renderQuotePreviewCard();

      if (prevName) {
        const nameInput = this.container.querySelector("#quote-inline-name");
        if (nameInput) nameInput.value = prevName;
      }
      if (prevPhone) {
        const phoneInput = this.container.querySelector("#quote-inline-phone");
        if (phoneInput) phoneInput.value = prevPhone;
      }
      if (prevDate) {
        const dateInput = this.container.querySelector("#quote-inline-date");
        if (dateInput) dateInput.value = prevDate;
      }
      if (prevNotes) {
        const notesInput = this.container.querySelector("#quote-inline-notes");
        if (notesInput) notesInput.value = prevNotes;
      }

      this.bindInlineQuoteEvents();
    }
  }

  bindInlineQuoteEvents() {
    const v = this.vendor;

    // Remove service button inside quote preview
    this.container.querySelectorAll("[data-remove-service]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const sId = btn.getAttribute("data-remove-service");
        this.selectedServices.delete(sId);

        // Synchronize service card in catalog above
        const sCard = this.container.querySelector(`.service-card[data-service-id="${sId}"]`);
        if (sCard) {
          sCard.classList.remove("selected");
          const cb = sCard.querySelector(".service-checkbox");
          if (cb) cb.checked = false;
        }

        this.updateQuotePreview();
      });
    });

    // Submit Quote Request to WhatsApp
    const submitBtn = this.container.querySelector("#btn-submit-inline-quote");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        const name = this.container.querySelector("#quote-inline-name")?.value.trim();
        const phone = this.container.querySelector("#quote-inline-phone")?.value.trim();
        const eventDate = this.container.querySelector("#quote-inline-date")?.value;
        const notes = this.container.querySelector("#quote-inline-notes")?.value.trim();

        if (!name || !phone) {
          window.OmniApp.showToast("Please enter your name and WhatsApp number.");
          return;
        }

        const selectedList = (v.services || []).filter(s => this.selectedServices.has(s.id));
        if (selectedList.length === 0) {
          window.OmniApp.showToast("Please select at least one service.");
          return;
        }

        const msg = WhatsAppEngine.buildQuoteMessage(v, selectedList, { name, phone, eventDate, notes });
        WhatsAppEngine.openChat(v.contacts.whatsapp, msg);
        window.OmniApp.showToast("Quote inquiry prepared for WhatsApp!");
      });
    }
  }

  bindCartEvents() {
    const currency = db.getPlatformSettings()?.currencySymbol || "₹";
    const v = this.vendor;

    // Quantity increment / decrement buttons (both on catalog items and in preview card)
    this.container.querySelectorAll("[data-cart-action]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.getAttribute("data-cart-action");
        const prodId = btn.getAttribute("data-prod-id");

        let cur = this.cart[prodId] || 0;
        if (action === "inc") {
          cur += 1;
        } else if (action === "dec") {
          cur = Math.max(0, cur - 1);
        }

        if (cur === 0) {
          delete this.cart[prodId];
        } else {
          this.cart[prodId] = cur;
        }

        this.updateCartState(currency);
      });
    });

    // Remove single item completely from cart
    this.container.querySelectorAll("[data-cart-remove]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const prodId = btn.getAttribute("data-cart-remove");
        delete this.cart[prodId];
        this.updateCartState(currency);
      });
    });

    // Submit Order to WhatsApp
    const submitCartBtn = this.container.querySelector("#btn-submit-inline-cart");
    if (submitCartBtn) {
      submitCartBtn.addEventListener("click", () => {
        const name = this.container.querySelector("#cart-inline-name")?.value.trim();
        const phone = this.container.querySelector("#cart-inline-phone")?.value.trim();
        const address = this.container.querySelector("#cart-inline-address")?.value.trim();

        if (!name || !phone || !address) {
          window.OmniApp.showToast("Please provide your name, WhatsApp phone, and delivery/table address.");
          return;
        }

        const cartItems = Object.entries(this.cart).map(([id, qty]) => {
          const prod = (v.products || []).find(p => p.id === id);
          return { ...prod, quantity: qty };
        }).filter(item => item && item.quantity > 0);

        if (cartItems.length === 0) {
          window.OmniApp.showToast("Your cart is empty. Add products before submitting.");
          return;
        }

        const msg = WhatsAppEngine.buildOrderMessage(v, cartItems, { name, phone, address });
        WhatsAppEngine.openChat(v.contacts.whatsapp, msg);
        window.OmniApp.showToast("Order prepared for WhatsApp!");
      });
    }
  }

  updateCartState(currency) {
    const totalItems = this.getCartTotalItems();

    // 1. Synchronize all product list item counters in catalog above
    this.container.querySelectorAll(".product-list-item").forEach(item => {
      const incBtn = item.querySelector("[data-cart-action='inc']");
      if (incBtn) {
        const pId = incBtn.getAttribute("data-prod-id");
        const qtyVal = item.querySelector(".qty-val");
        if (qtyVal) qtyVal.textContent = this.cart[pId] || 0;
      }
    });

    // 2. Update Dock Cart Badge
    const dockRoot = document.getElementById("app-dock-root");
    const dockShop = dockRoot?.querySelector(".dock-item[data-tab='shop']");
    if (dockShop) {
      let badge = dockShop.querySelector(".badge-cart-count");
      if (totalItems > 0) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "badge-cart-count";
          dockShop.appendChild(badge);
        }
        badge.textContent = totalItems;
      } else if (badge) {
        badge.remove();
      }
    }

    // 3. Re-render Cart Preview Card
    const cartContainer = this.container.querySelector("#cart-preview-container");
    if (cartContainer) {
      // Preserve customer inputs if already typed
      const prevName = this.container.querySelector("#cart-inline-name")?.value;
      const prevPhone = this.container.querySelector("#cart-inline-phone")?.value;
      const prevAddr = this.container.querySelector("#cart-inline-address")?.value;

      cartContainer.innerHTML = this.renderCartPreviewCard(currency);

      if (prevName) {
        const nameInput = this.container.querySelector("#cart-inline-name");
        if (nameInput) nameInput.value = prevName;
      }
      if (prevPhone) {
        const phoneInput = this.container.querySelector("#cart-inline-phone");
        if (phoneInput) phoneInput.value = prevPhone;
      }
      if (prevAddr) {
        const addrInput = this.container.querySelector("#cart-inline-address");
        if (addrInput) addrInput.value = prevAddr;
      }

      this.bindCartEvents();
    }
  }

  bindCalendarEvents() {
    const prev = this.container.querySelector("#btn-cal-prev");
    const next = this.container.querySelector("#btn-cal-next");

    if (prev) {
      prev.addEventListener("click", () => {
        this.selectedDate.setMonth(this.selectedDate.getMonth() - 1);
        this.renderCalendar();
      });
    }

    if (next) {
      next.addEventListener("click", () => {
        this.selectedDate.setMonth(this.selectedDate.getMonth() + 1);
        this.renderCalendar();
      });
    }

    // Slot selector
    this.container.querySelectorAll(".slot-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.container.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        this.selectedSlot = btn.getAttribute("data-slot");
      });
    });

    // Booking Submission
    const submitBooking = this.container.querySelector("#btn-submit-booking");
    if (submitBooking) {
      submitBooking.addEventListener("click", async () => {
        const clientName = this.container.querySelector("#booking-client-name")?.value.trim();
        const clientPhone = this.container.querySelector("#booking-client-phone")?.value.trim();
        const service = this.container.querySelector("#booking-service-select")?.value;
        const notes = this.container.querySelector("#booking-client-notes")?.value.trim();

        if (!clientName || !clientPhone) {
          window.OmniApp.showToast("Please enter your name and phone number.");
          return;
        }

        const dateStr = this.selectedDate.toISOString().split("T")[0];
        const bookingData = {
          clientName,
          clientPhone,
          service,
          date: dateStr,
          timeSlot: this.selectedSlot,
          notes
        };

        // 1. Save to DB
        await db.addBooking(this.vendor.id, bookingData);
        window.OmniApp.showToast("Appointment booked successfully!");

        // 2. Open WhatsApp Confirmation
        const msg = WhatsAppEngine.buildBookingMessage(this.vendor, bookingData);
        WhatsAppEngine.openChat(this.vendor.contacts.whatsapp, msg);

        // Reset form
        this.container.querySelector("#booking-client-name").value = "";
        this.container.querySelector("#booking-client-phone").value = "";
        this.container.querySelector("#booking-client-notes").value = "";
      });
    }
  }

  renderCalendar() {
    const monthTitle = this.container.querySelector("#cal-month-title");
    const daysGrid = this.container.querySelector("#cal-days-grid");
    if (!monthTitle || !daysGrid) return;

    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthTitle.textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    let html = "";
    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      const isSelected = this.selectedDate.getDate() === day;
      html += `
        <button class="cal-day-btn ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-day="${day}">
          ${day}
        </button>
      `;
    }

    daysGrid.innerHTML = html;

    // Bind Day clicks
    daysGrid.querySelectorAll(".cal-day-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        daysGrid.querySelectorAll(".cal-day-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        this.selectedDate.setDate(Number(btn.getAttribute("data-day")));
      });
    });
  }

  bindModalEvents() {
    const v = this.vendor;
    const currency = db.getPlatformSettings()?.currencySymbol || "₹";

    // Close buttons
    this.container.querySelectorAll("[data-close-modal]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-close-modal");
        this.container.querySelector(`#${id}`)?.classList.remove("active");
      });
    });

    // Close on clicking backdrop
    this.container.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.classList.remove("active");
      });
    });

    // Open Review Modal
    const reviewBtn = this.container.querySelector("#btn-open-review-modal");
    if (reviewBtn) {
      reviewBtn.addEventListener("click", () => {
        this.container.querySelector("#modal-review")?.classList.add("active");
      });
    }

    // Star rating picker in modal
    const starSpans = this.container.querySelectorAll("#review-stars-selector span");
    starSpans.forEach(span => {
      span.addEventListener("click", () => {
        const rating = Number(span.getAttribute("data-star"));
        this.selectedReviewRating = rating;
        starSpans.forEach((s, idx) => {
          if (idx < rating) s.classList.add("active");
          else s.classList.remove("active");
        });
      });
    });

    // Review tag chips picker
    this.container.querySelectorAll("[data-review-tag]").forEach(chip => {
      chip.addEventListener("click", () => {
        const tag = chip.getAttribute("data-review-tag");
        if (this.selectedReviewTags.has(tag)) {
          this.selectedReviewTags.delete(tag);
          chip.classList.remove("active");
        } else {
          this.selectedReviewTags.add(tag);
          chip.classList.add("active");
        }
      });
    });

    // Submit Review
    const submitReview = this.container.querySelector("#btn-submit-review");
    if (submitReview) {
      submitReview.addEventListener("click", async () => {
        const author = this.container.querySelector("#review-client-name")?.value.trim();
        const content = this.container.querySelector("#review-client-text")?.value.trim();

        if (!author || !content) {
          window.OmniApp.showToast("Please enter your name and review feedback.");
          return;
        }

        await db.addReview(v.id, {
          author,
          rating: this.selectedReviewRating,
          tags: Array.from(this.selectedReviewTags),
          content
        });

        this.container.querySelector("#modal-review")?.classList.remove("active");
        window.OmniApp.showToast("Thank you! Review published.");

        // Refresh reviews list & stats
        this.container.querySelector("#reviews-list-container").innerHTML = this.renderReviewsList();
        const newStats = this.getReviewStats();
        const ratingPill = this.container.querySelector(".rating-pill");
        if (ratingPill) ratingPill.innerHTML = `<span>★</span><span>${newStats.avg} (${newStats.count} reviews)</span>`;
      });
    }
  }

  // Long-press detection on Avatar logo to trigger secret vendor owner login
  bindAvatarLongPress() {
    const avatars = this.container.querySelectorAll("#vcard-avatar-wrapper, [data-tab-avatar='true']");
    if (avatars.length === 0) return;

    let pressTimer = null;
    let activeAvatar = null;

    const startPress = (el) => {
      activeAvatar = el;
      el.classList.add("avatar-holding");
      pressTimer = setTimeout(() => {
        el.classList.remove("avatar-holding");
        // Open secret owner PIN modal
        const modal = this.container.querySelector("#modal-owner-pin");
        if (modal) {
          modal.classList.add("active");
          const pinInput = modal.querySelector("#input-owner-secret-pin");
          if (pinInput) {
            pinInput.value = "";
            setTimeout(() => pinInput.focus(), 150);
          }
        }
      }, 1500); // 1.5 seconds hold
    };

    const cancelPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      if (activeAvatar) {
        activeAvatar.classList.remove("avatar-holding");
        activeAvatar = null;
      }
    };

    avatars.forEach(avatar => {
      // Mobile touch events
      avatar.addEventListener("touchstart", () => startPress(avatar), { passive: true });
      avatar.addEventListener("touchend", cancelPress);
      avatar.addEventListener("touchcancel", cancelPress);

      // Desktop mouse events
      avatar.addEventListener("mousedown", () => startPress(avatar));
      avatar.addEventListener("mouseup", cancelPress);
      avatar.addEventListener("mouseleave", cancelPress);
    });

    // Form submission for secret owner Password / PIN
    const pinForm = this.container.querySelector("#form-secret-owner-pin");
    if (pinForm) {
      pinForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const enteredPin = this.container.querySelector("#input-owner-secret-pin")?.value.trim();
        const validPassword = this.vendor.password || this.vendor.pin || "2026";
        if (enteredPin === validPassword || enteredPin === this.vendor.pin) {
          this.container.querySelector("#modal-owner-pin")?.classList.remove("active");
          window.OmniApp.showToast(`Owner Verified: Welcome ${this.vendor.branding.businessName}`);
          window.OmniApp.adminManageVendor(this.vendor.id);
        } else {
          window.OmniApp.showToast("Access Denied: Incorrect Password.");
          const pinInput = this.container.querySelector("#input-owner-secret-pin");
          if (pinInput) {
            pinInput.value = "";
            pinInput.focus();
          }
        }
      });
    }
  }

  renderCartModalItems(currency) {
    const listEl = this.container.querySelector("#cart-modal-items-list");
    const totalEl = this.container.querySelector("#cart-modal-total-amount");
    if (!listEl) return;

    const items = Object.entries(this.cart).map(([id, qty]) => {
      const prod = this.vendor.products.find(p => p.id === id);
      return { ...prod, quantity: qty };
    });

    if (items.length === 0) {
      listEl.innerHTML = `<div style="color: var(--theme-text-muted); font-size: 0.85rem;">Your cart is empty.</div>`;
      if (totalEl) totalEl.textContent = `${currency}0`;
      return;
    }

    let subtotal = 0;
    listEl.innerHTML = items.map(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 0.82rem; border-bottom: 1px solid rgba(255,255,255,0.04);">
          <div>
            <span style="font-weight: 600;">${item.emoji || ''} ${item.name}</span>
            <div style="color: var(--theme-text-muted); font-size: 0.72rem;">${item.quantity} × ${currency}${item.price}</div>
          </div>
          <div style="font-weight: 700;">${currency}${itemTotal.toLocaleString()}</div>
        </div>
      `;
    }).join("");

    if (totalEl) totalEl.textContent = `${currency}${subtotal.toLocaleString()}`;
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    const dockRoot = document.getElementById("app-dock-root");
    if (dockRoot) {
      dockRoot.querySelectorAll(".dock-item").forEach(item => {
        item.classList.toggle("active", item.getAttribute("data-tab") === tabName);
      });
    }
    this.container.querySelectorAll(".tab-pane").forEach(pane => {
      pane.classList.toggle("active", pane.id === `pane-${tabName}`);
    });
    this.container.scrollTop = 0;
  }

  calculateSelectedTotal() {
    let sum = 0;
    const services = this.vendor?.services || [];
    for (const id of this.selectedServices) {
      const s = services.find(x => x.id === id);
      if (s) sum += Number(s.price || 0);
    }
    return sum;
  }

  getCartTotalItems() {
    return Object.values(this.cart).reduce((sum, qty) => sum + qty, 0);
  }

  getCartSubtotal() {
    let subtotal = 0;
    const products = this.vendor?.products || [];
    for (const [id, qty] of Object.entries(this.cart)) {
      const p = products.find(x => x.id === id);
      if (p) subtotal += (Number(p.price || 0) * qty);
    }
    return subtotal;
  }
}
