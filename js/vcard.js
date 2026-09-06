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

        <!-- Tab 1: Profile & About Pane (Exclusively includes contacts & offers) -->
        <div class="tab-pane ${this.activeTab === 'home' ? 'active' : ''}" id="pane-home">
          <!-- Profile Header & Branding -->
          <div class="profile-header-card" style="margin: -0px -16px 14px -16px; border-radius: 0;">
            <div class="avatar-ring-wrapper" id="vcard-avatar-wrapper" title="Business Logo">
              <div class="avatar-ring" id="vcard-avatar-ring">
                ${v.branding.avatarEmoji || "💼"}
              </div>
              ${v.verified ? `<div class="avatar-crown-pill" title="Verified Partner">👑</div>` : ""}
            </div>

            <div class="category-pill">
              <span>${v.branding.category}</span>
            </div>

            <h1 class="business-title">${v.branding.businessName}</h1>
            <div class="owner-title">${v.branding.ownerName}</div>

            <div class="badge-cluster">
              <div class="status-pill ${v.isOpen ? 'open' : 'closed'}">
                <span class="status-dot"></span>
                <span>${v.isOpen ? 'Open Now' : 'Closed'}</span>
              </div>

              <div class="rating-pill">
                <span>★</span>
                <span>${stats.avg} (${stats.count} reviews)</span>
              </div>
            </div>
          </div>

          <!-- Quick Contact Launcher Bar (Exclusive to Home) -->
          <div class="quick-launcher-bar" style="padding: 0 0 16px 0;">
            <a href="tel:${v.contacts.phone}" class="launcher-btn" title="Call Us">
              <span class="btn-icon">📞</span>
              <span class="btn-label">Call</span>
            </a>
            <button class="launcher-btn whatsapp-accent" id="btn-quick-whatsapp" title="WhatsApp Chat">
              <span class="btn-icon">💬</span>
              <span class="btn-label">WhatsApp</span>
            </button>
            <a href="mailto:${v.contacts.email}" class="launcher-btn" title="Send Email">
              <span class="btn-icon">✉️</span>
              <span class="btn-label">Email</span>
            </a>
            <a href="${v.contacts.mapUrl || '#'}" target="_blank" rel="noopener" class="launcher-btn" title="Get Directions">
              <span class="btn-icon">📍</span>
              <span class="btn-label">Location</span>
            </a>
            <a href="${v.contacts.website || '#'}" target="_blank" rel="noopener" class="launcher-btn" title="Visit Website">
              <span class="btn-icon">🌐</span>
              <span class="btn-label">Website</span>
            </a>
          </div>

          <!-- Promotional Offer Banner (Exclusive to Home) -->
          ${v.features.promoBanner && v.promo?.enabled ? `
            <div class="promo-card" style="margin: 0 0 16px 0;">
              <span class="promo-badge">${v.promo.badge || "SPECIAL OFFER"}</span>
              <h3 class="promo-title">${v.promo.title}</h3>
              <p class="promo-desc">${v.promo.discount}</p>
              <button class="btn-claim-offer" id="btn-claim-promo">
                <span>Claim Offer</span>
                <span>⚡</span>
              </button>
            </div>
          ` : ""}

          <!-- About Business Section -->
          <div class="bento-card" style="margin-bottom: 12px;">
            <div class="section-header" style="margin-top: 0;">
              <h3 class="section-title">About Business</h3>
              <span class="section-subtitle">Est. ${v.about.establishedYear || 2020}</span>
            </div>
            <p style="font-size: 0.88rem; font-weight: 600; color: var(--theme-secondary); margin-bottom: 6px;">
              "${v.about.tagline || v.branding.tagline}"
            </p>
            <p style="font-size: 0.82rem; color: var(--theme-text-muted); line-height: 1.5; margin-bottom: 14px;">
              ${v.about.description}
            </p>

            ${v.about.highlightStats?.length ? `
              <div class="stats-bento">
                ${v.about.highlightStats.map(s => `
                  <div class="stat-box">
                    <div class="stat-value">${s.value}</div>
                    <div class="stat-label">${s.label}</div>
                  </div>
                `).join("")}
              </div>
            ` : ""}

            <div class="location-card">
              <div class="location-header">
                <span>📍</span>
                <div>
                  <div style="font-weight: 600; color: #FFF; font-size: 0.88rem;">${v.contacts.location}</div>
                  <div style="font-size: 0.76rem; color: var(--theme-primary); margin-top: 2px;">⏰ ${v.openHours}</div>
                </div>
              </div>
              ${v.contacts.mapUrl ? `
                <a href="${v.contacts.mapUrl}" target="_blank" rel="noopener" class="btn-pill" style="width: 100%; justify-content: center; margin-top: 6px;">
                  Open Directions ↗
                </a>
              ` : ""}
            </div>
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

          <!-- Sticky Quote Bar -->
          <div class="sticky-quote-bar" id="sticky-quote-bar" style="${this.selectedServices.size === 0 ? 'display: none;' : ''}">
            <div class="sticky-bar-info">
              <span class="sticky-bar-count">${this.selectedServices.size} Service(s) Selected</span>
              <span class="sticky-bar-total" style="font-size: 0.92rem; color: var(--theme-primary); font-weight: 700;">Custom Quote Request</span>
            </div>
            <button class="btn-sticky-action" id="btn-open-quote-modal">
              <span>Request Quote</span>
              <span>📋</span>
            </button>
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

          <!-- Sticky Cart Bar -->
          <div class="sticky-cart-bar" id="sticky-cart-bar" style="${this.getCartTotalItems() === 0 ? 'display: none;' : ''}">
            <div class="sticky-bar-info">
              <span class="sticky-bar-count">${this.getCartTotalItems()} Item(s) in Cart</span>
              <span class="sticky-bar-total">${currency}${this.getCartSubtotal().toLocaleString()}</span>
            </div>
            <button class="btn-sticky-action" id="btn-open-cart-modal">
              <span>Review Cart</span>
              <span>🛒</span>
            </button>
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

  renderModals(currency) {
    const v = this.vendor;
    return `
      <!-- Modal: Quote Request -->
      <div class="modal-overlay" id="modal-quote">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title"><span>📋</span> Request Custom Service Quote</h3>
            <button class="btn-modal-close" data-close-modal="modal-quote">×</button>
          </div>
          <p id="quote-modal-desc" style="font-size: 0.8rem; color: var(--theme-text-muted); margin-bottom: 12px;">
            Your selected service(s) will be formatted into a custom inquiry sent directly to ${v.branding.businessName} on WhatsApp.
          </p>

          <div id="quote-selected-services-preview" style="max-height: 140px; overflow-y: auto; margin-bottom: 14px;">
            <!-- Selected services preview rendered dynamically -->
          </div>

          <div class="form-group">
            <label class="form-label">Your Name</label>
            <input type="text" class="form-input" id="quote-client-name" placeholder="e.g. Priya Sharma" required />
          </div>

          <div class="form-group">
            <label class="form-label">Your Phone / WhatsApp</label>
            <input type="tel" class="form-input" id="quote-client-phone" placeholder="e.g. 9811223344" required />
          </div>

          <div class="form-group">
            <label class="form-label">Event Date / Expected Timeline</label>
            <input type="date" class="form-input" id="quote-client-date" />
          </div>

          <div class="form-group">
            <label class="form-label">Additional Requirements or Questions</label>
            <textarea class="form-textarea" id="quote-client-notes" rows="2" placeholder="Guest count, venue location, budget preferences..."></textarea>
          </div>

          <button class="btn-submit-primary" id="btn-submit-quote-whatsapp">
            <span>Send Quote to WhatsApp</span>
            <span>💬</span>
          </button>
        </div>
      </div>

      <!-- Modal: Cart Review & Checkout -->
      <div class="modal-overlay" id="modal-cart">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title"><span>🛒</span> Order Review & Checkout</h3>
            <button class="btn-modal-close" data-close-modal="modal-cart">×</button>
          </div>

          <div id="cart-modal-items-list" style="margin-bottom: 14px; max-height: 180px; overflow-y: auto;">
            <!-- Rendered dynamically -->
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-top: 1px solid var(--theme-border); border-bottom: 1px solid var(--theme-border); margin-bottom: 14px;">
            <span style="font-weight: 700;">Total Payable:</span>
            <span style="font-weight: 800; font-size: 1.15rem; color: var(--theme-primary);" id="cart-modal-total-amount">₹0</span>
          </div>

          <div class="form-group">
            <label class="form-label">Your Name</label>
            <input type="text" class="form-input" id="cart-client-name" placeholder="e.g. Anish Gupta" required />
          </div>

          <div class="form-group">
            <label class="form-label">WhatsApp Phone Number</label>
            <input type="tel" class="form-input" id="cart-client-phone" placeholder="e.g. 9822334455" required />
          </div>

          <div class="form-group">
            <label class="form-label">Delivery Address or Table Number</label>
            <textarea class="form-textarea" id="cart-client-address" rows="2" placeholder="Apartment / Flat, Street, Landmark or Table 4" required></textarea>
          </div>

          <button class="btn-submit-primary" id="btn-submit-cart-whatsapp">
            <span>Route Order to WhatsApp</span>
            <span>🛍️</span>
          </button>
        </div>
      </div>

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
    const currency = db.getPlatformSettings()?.currencySymbol || "₹";
    this.container.querySelectorAll(".service-card").forEach(card => {
      card.addEventListener("click", (e) => {
        const serviceId = card.getAttribute("data-service-id");
        if (this.selectedServices.has(serviceId)) {
          this.selectedServices.delete(serviceId);
          card.classList.remove("selected");
          card.querySelector(".service-checkbox").checked = false;
        } else {
          this.selectedServices.add(serviceId);
          card.classList.add("selected");
          card.querySelector(".service-checkbox").checked = true;
        }

        // Update Sticky Quote Bar
        const bar = this.container.querySelector("#sticky-quote-bar");
        if (this.selectedServices.size > 0) {
          bar.style.display = "flex";
          bar.querySelector(".sticky-bar-count").textContent = `${this.selectedServices.size} Service(s) Selected`;
          const totalLabel = bar.querySelector(".sticky-bar-total");
          if (totalLabel) totalLabel.textContent = "Custom Quote Request";
        } else {
          bar.style.display = "none";
        }
      });
    });
  }

  bindCartEvents() {
    const currency = db.getPlatformSettings()?.currencySymbol || "₹";

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

        // Update UI
        const counter = btn.parentElement.querySelector(".qty-val");
        if (counter) counter.textContent = cur;

        // Update Sticky Cart Bar
        const cartBar = this.container.querySelector("#sticky-cart-bar");
        const totalItems = this.getCartTotalItems();
        if (totalItems > 0) {
          cartBar.style.display = "flex";
          cartBar.querySelector(".sticky-bar-count").textContent = `${totalItems} Item(s) in Cart`;
          cartBar.querySelector(".sticky-bar-total").textContent = `${currency}${this.getCartSubtotal().toLocaleString()}`;
        } else {
          cartBar.style.display = "none";
        }

        // Update Dock Cart Badge
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
      });
    });
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

    // Open Quote Modal
    const quoteBtn = this.container.querySelector("#btn-open-quote-modal");
    if (quoteBtn) {
      quoteBtn.addEventListener("click", () => {
        const modal = this.container.querySelector("#modal-quote");
        if (modal) {
          const countDesc = modal.querySelector("#quote-modal-desc");
          if (countDesc) {
            countDesc.textContent = `Your ${this.selectedServices.size} selected service(s) will be formatted into a custom inquiry sent directly to ${v.branding.businessName} on WhatsApp.`;
          }
          const itemsBox = modal.querySelector("#quote-selected-services-preview");
          if (itemsBox) {
            const selectedList = (v.services || []).filter(s => this.selectedServices.has(s.id));
            itemsBox.innerHTML = selectedList.map(s => `
              <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid var(--theme-border); border-radius: 6px; padding: 6px 10px; margin-bottom: 6px; font-size: 0.78rem;">
                <span style="font-weight: 600; color: #FFF;">${s.name}</span>
                <span style="font-size: 0.68rem; color: var(--theme-primary);">${s.category || 'Service'}</span>
              </div>
            `).join("");
          }
          modal.classList.add("active");
        }
      });
    }

    // Submit Quote to WhatsApp
    const submitQuote = this.container.querySelector("#btn-submit-quote-whatsapp");
    if (submitQuote) {
      submitQuote.addEventListener("click", () => {
        const name = this.container.querySelector("#quote-client-name")?.value.trim();
        const phone = this.container.querySelector("#quote-client-phone")?.value.trim();
        const eventDate = this.container.querySelector("#quote-client-date")?.value;
        const notes = this.container.querySelector("#quote-client-notes")?.value.trim();

        if (!name || !phone) {
          window.OmniApp.showToast("Please enter your name and phone number.");
          return;
        }

        const selectedList = v.services.filter(s => this.selectedServices.has(s.id));
        const msg = WhatsAppEngine.buildQuoteMessage(v, selectedList, { name, phone, eventDate, notes });
        WhatsAppEngine.openChat(v.contacts.whatsapp, msg);

        this.container.querySelector("#modal-quote")?.classList.remove("active");
        window.OmniApp.showToast("Quote formatted for WhatsApp!");
      });
    }

    // Open Cart Modal
    const cartBtn = this.container.querySelector("#btn-open-cart-modal");
    if (cartBtn) {
      cartBtn.addEventListener("click", () => {
        this.renderCartModalItems(currency);
        this.container.querySelector("#modal-cart")?.classList.add("active");
      });
    }

    // Submit Cart Order to WhatsApp
    const submitCart = this.container.querySelector("#btn-submit-cart-whatsapp");
    if (submitCart) {
      submitCart.addEventListener("click", () => {
        const name = this.container.querySelector("#cart-client-name")?.value.trim();
        const phone = this.container.querySelector("#cart-client-phone")?.value.trim();
        const address = this.container.querySelector("#cart-client-address")?.value.trim();

        if (!name || !phone || !address) {
          window.OmniApp.showToast("Please provide your name, phone, and delivery/table address.");
          return;
        }

        const cartItems = Object.entries(this.cart).map(([id, qty]) => {
          const prod = v.products.find(p => p.id === id);
          return { ...prod, quantity: qty };
        });

        const msg = WhatsAppEngine.buildOrderMessage(v, cartItems, { name, phone, address });
        WhatsAppEngine.openChat(v.contacts.whatsapp, msg);

        this.container.querySelector("#modal-cart")?.classList.remove("active");
        window.OmniApp.showToast("Order directed to WhatsApp!");
      });
    }

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
