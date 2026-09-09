// Module 1: Public Digital Business Card (vCard) Controller
import { db } from "./db.js?v=20260909_v10";
import { WhatsAppEngine } from "./whatsapp.js?v=20260909_v10";
import { PWAHandler } from "./pwa.js?v=20260909_v10";

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
    this.productFilter = "All";
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
          <a href="?v=elite-catering" class="btn-pill active" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">View Demo Card</a>
        </div>
      `;
      return;
    }
    this.vendor = v;
    this.selectedServices.clear();
    this.cart = {};
    this.activeTab = "home";
    this.applyTheme();
    PWAHandler.updateManifestForVendor(v);

    // Check if vCard is Suspended or Expired
    const isSuspended = v.status === "suspended";
    const now = new Date();
    const isExpired = v.status === "expired" || (v.expiresAt && new Date(v.expiresAt) < now);

    if (isSuspended || isExpired) {
      this.renderDisabledVCard(isSuspended, isExpired);
      return;
    }

    // Normal active card: restore body modal status if needed
    document.body.classList.remove("has-modal-open");
    this.render();
    PWAHandler.autoPromptInstallIfEligible(v);
  }

  renderDisabledVCard(isSuspended, isExpired) {
    const v = this.vendor;
    const settings = db.getPlatformSettings() || {};
    const currency = settings.currencySymbol || "₹";
    const adminWhatsApp = settings.supportWhatsApp || "+919876543210";
    const adminPhoneClean = WhatsAppEngine.cleanPhone(adminWhatsApp);
    const adminUpi = settings.adminUpi || (adminPhoneClean ? `${adminPhoneClean}@upi` : "9876543210@upi");

    // Hide bottom dock permanently while suspended or expired
    const dockRoot = document.getElementById("app-dock-root");
    if (dockRoot) {
      dockRoot.innerHTML = "";
      dockRoot.style.display = "none";
    }
    document.body.classList.add("has-modal-open");

    // Render underlying blurred card preview
    this.container.innerHTML = `
      <div class="vcard-app vcard-disabled-backdrop">
        <div class="tab-pane active" id="pane-home" style="pointer-events: none;">
          <div class="avatar-ring-wrapper" style="margin-top: 30px;">
            <div class="avatar-glowing-ring">
              ${v.branding?.avatarEmoji || "💼"}
            </div>
          </div>
          <div class="vcard-badges-row">
            <span class="vcard-tier-pill">👑 ${(v.branding?.category || "BUSINESS").toUpperCase()}</span>
            <span class="vcard-verified-pill" style="background: rgba(239,68,68,0.2); color: #EF4444; border-color: rgba(239,68,68,0.4);">
              ${isSuspended ? "⏸️ SUSPENDED" : "⚠️ EXPIRED"}
            </span>
          </div>
          <h1 class="vcard-hero-name">${v.branding?.businessName || "Business"}</h1>
          <div class="vcard-hero-subtitle">${v.branding?.ownerName || ""} · ${v.branding?.category || ""}</div>
          <div class="about-business-card" style="margin: 20px 16px;">
            <div style="flex: 1;">
              <div class="about-text-desc" style="color: #94A3B8;">
                ${v.about?.description || v.branding?.tagline || "Digital Business Card WebApp"}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Retrieve plans and identify initial selection
    const plans = db.getSubscriptionPlans() || [];
    let selectedPlanId = v.planId && plans.some(p => p.id === v.planId) ? v.planId : (plans.find(p => p.id === "plan-pro")?.id || plans[0]?.id);
    let selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0] || { name: "Growth Plan", price: 2499, durationDays: 90 };

    const statusBadgeHtml = isSuspended ? `
      <div class="renewal-header-badge badge-suspended">
        <span>⏸️</span>
        <span>Account Suspended</span>
      </div>
    ` : `
      <div class="renewal-header-badge badge-expired">
        <span>🕒</span>
        <span>Subscription Expired</span>
      </div>
    `;

    const headlineText = `Your webapp is ${isSuspended ? 'suspended' : 'expired'} please contact admin to renew.`;

    const expiryInfoHtml = isExpired && v.expiresAt ? `
      <div style="font-size: 0.74rem; color: #F59E0B; margin-top: 4px; font-weight: 600;">
        ⚠️ Subscription ended on: ${new Date(v.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </div>
    ` : (isSuspended ? `
      <div style="font-size: 0.74rem; color: #EF4444; margin-top: 4px; font-weight: 600;">
        🔒 Webapp access is currently suspended by system administration.
      </div>
    ` : "");

    const packagesListHtml = plans.map(p => {
      const isSel = p.id === selectedPlanId;
      const priceStr = Number(p.price) === 0 ? "FREE TRIAL" : `${currency}${Number(p.price).toLocaleString()}`;
      return `
        <div class="renewal-pkg-item ${isSel ? 'selected' : ''}" data-renewal-plan-id="${p.id}">
          <div class="renewal-radio-disc"></div>
          <div class="renewal-pkg-info">
            <div class="renewal-pkg-name-row">
              <span class="renewal-pkg-name">${p.name}</span>
              <span class="renewal-pkg-duration">${p.durationDays} Days</span>
            </div>
            <div class="renewal-pkg-features-summary">${p.description || "Quote builder, Shop, Bookings, Reviews, PWA"}</div>
          </div>
          <div class="renewal-pkg-price">${priceStr}</div>
        </div>
      `;
    }).join("");

    const initialPriceDisplay = Number(selectedPlan.price) === 0 ? "FREE TRIAL" : `${currency}${Number(selectedPlan.price).toLocaleString()}`;

    const renewalPopupHtml = `
      <div class="renewal-overlay" id="popup-renewal-overlay">
        <div class="renewal-card ${isExpired ? 'state-expired' : ''}">
          ${statusBadgeHtml}
          <h2 class="renewal-main-title">${headlineText}</h2>
          
          <div class="renewal-meta-info">
            <div style="color: #FFFFFF; font-weight: 700; margin-bottom: 2px;">🏢 ${v.branding?.businessName || "Business"}</div>
            <div>Owner: ${v.branding?.ownerName || "Business Owner"} · Slug: <code>${v.slug || v.id}</code></div>
            ${expiryInfoHtml}
          </div>

          <div class="renewal-packages-title">
            <span>📦 Select Package to Renew:</span>
            <span style="font-size: 0.7rem; color: #94A3B8; font-weight: normal;">1-Tap Choice</span>
          </div>

          <div class="renewal-packages-list" id="renewal-plans-container">
            ${packagesListHtml}
          </div>

          <!-- UPI Details Box -->
          <div class="renewal-upi-card">
            <div class="renewal-upi-header">
              <span>💳 Admin Prepaid Payment Details</span>
              <span style="color: var(--theme-primary, #D4FF00); font-weight: 800;">PREPAID UPI</span>
            </div>
            <div class="renewal-upi-val-row">
              <div>
                <div style="font-size: 0.7rem; color: #94A3B8;">Admin UPI ID:</div>
                <div class="renewal-upi-id" id="val-admin-upi-id">${adminUpi}</div>
              </div>
              <button type="button" class="btn-pill" id="btn-copy-renewal-upi" style="font-size: 0.72rem; padding: 4px 10px;">
                📋 Copy UPI
              </button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 0.72rem; color: #94A3B8;">
              <span>📱 Admin WhatsApp: <b>+${adminPhoneClean}</b></span>
              <span>🔒 100% Verified Support</span>
            </div>
          </div>

          <!-- Mandatory Agreement Condition Box -->
          <div class="renewal-condition-box" id="renewal-condition-box">
            <label class="renewal-checkbox-label">
              <input type="checkbox" class="renewal-checkbox" id="chk-renew-agree-prepay" />
              <span class="renewal-condition-text">
                I <strong class="bold-red-agree">AGREE TO PAY</strong> the prepaid amount of <strong id="renew-price-text" style="color: var(--theme-primary, #D4FF00); font-weight: 800;">${initialPriceDisplay}</strong> via UPI to Admin number (<span id="renew-admin-upi-label">${adminUpi}</span>) to renew our business webapp.
              </span>
            </label>
          </div>

          <!-- Submit to Renew via WhatsApp Button (Disabled / Greyed out by default) -->
          <button type="button" id="btn-submit-renewal-wa" class="btn-submit-renewal is-disabled" disabled>
            <span>💬 Submit to Renew (WhatsApp)</span>
          </button>

          <div class="renewal-sub-actions">
            <a href="tel:${adminWhatsApp}" class="renewal-sub-link">📞 Call Admin Directly</a>
            <button type="button" class="renewal-sub-link" id="btn-renewal-auth-login" style="background: none; border: none; font-size: inherit;">🔐 Owner / Admin Login</button>
          </div>
        </div>
      </div>
    `;

    const modalsRoot = document.getElementById("app-modals-root") || this.container;
    modalsRoot.innerHTML = renewalPopupHtml;

    // Bind Interactive Events for Renewal Modal
    this.bindDisabledVCardEvents(v, plans, selectedPlan, settings);
  }

  bindDisabledVCardEvents(vendor, plans, initialSelectedPlan, settings) {
    let currentPlan = initialSelectedPlan;
    const currency = settings.currencySymbol || "₹";
    const adminWhatsApp = settings.supportWhatsApp || "+919876543210";
    const adminPhoneClean = WhatsAppEngine.cleanPhone(adminWhatsApp);
    const adminUpi = settings.adminUpi || (adminPhoneClean ? `${adminPhoneClean}@upi` : "9876543210@upi");

    const modalsRoot = document.getElementById("app-modals-root") || this.container;
    const conditionBox = modalsRoot.querySelector("#renewal-condition-box");
    const checkbox = modalsRoot.querySelector("#chk-renew-agree-prepay");
    const submitBtn = modalsRoot.querySelector("#btn-submit-renewal-wa");
    const priceText = modalsRoot.querySelector("#renew-price-text");

    // 1. Package Selection
    modalsRoot.querySelectorAll("[data-renewal-plan-id]").forEach(item => {
      item.addEventListener("click", () => {
        const planId = item.getAttribute("data-renewal-plan-id");
        const found = plans.find(p => p.id === planId);
        if (found) {
          currentPlan = found;
          modalsRoot.querySelectorAll("[data-renewal-plan-id]").forEach(el => el.classList.remove("selected"));
          item.classList.add("selected");
          const priceFormatted = Number(currentPlan.price) === 0 ? "FREE TRIAL" : `${currency}${Number(currentPlan.price).toLocaleString()}`;
          if (priceText) priceText.textContent = priceFormatted;
        }
      });
    });

    // 2. Checkbox Ticking enables/greys out submit button
    if (checkbox && submitBtn) {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("is-disabled");
          if (conditionBox) conditionBox.classList.add("checked");
        } else {
          submitBtn.disabled = true;
          submitBtn.classList.add("is-disabled");
          if (conditionBox) conditionBox.classList.remove("checked");
        }
      });
    }

    // 3. Submit to Admin via WhatsApp
    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        if (!checkbox || !checkbox.checked) {
          window.OmniApp?.showToast("⚠️ Please tick the agreement condition before submitting.");
          return;
        }
        const message = WhatsAppEngine.buildRenewalMessage(vendor, currentPlan, settings);
        WhatsAppEngine.openChat(adminWhatsApp, message);
        window.OmniApp?.showToast("Opening WhatsApp to confirm payment number with Admin...");
      });
    }

    // 4. Copy UPI Button
    const copyBtn = modalsRoot.querySelector("#btn-copy-renewal-upi");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(adminUpi).then(() => {
            window.OmniApp?.showToast("Admin UPI copied to clipboard!");
          }).catch(() => {
            window.OmniApp?.showToast(`UPI: ${adminUpi}`);
          });
        } else {
          window.OmniApp?.showToast(`UPI: ${adminUpi}`);
        }
      });
    }

    // 5. Owner / Admin Login Access
    const ownerLoginBtn = modalsRoot.querySelector("#btn-renewal-auth-login");
    if (ownerLoginBtn) {
      ownerLoginBtn.addEventListener("click", () => {
        const entered = prompt(`Enter Owner PIN for ${vendor.branding?.businessName || 'this card'} or Admin Master PIN:`);
        if (!entered) return;
        const validPassword = vendor.password || vendor.pin || "2026";
        const adminPin = settings.adminPin || "1234";
        if (entered.trim() === validPassword || entered.trim() === vendor.pin) {
          window.OmniApp?.showToast("Owner Authenticated");
          window.OmniApp?.adminManageVendor(vendor.id);
        } else if (entered.trim() === adminPin) {
          window.OmniApp?.showToast("Super Admin Authenticated");
          window.OmniApp?.navigate("admin");
        } else {
          window.OmniApp?.showToast("Invalid Security PIN");
        }
      });
    }
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
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    const isInstalled = PWAHandler.isVendorInstalled(v.slug || v.id);

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
          
          <!-- Top Navigation Header inside vCard (Settings icon removed for security, only Share displayed) -->
          <div class="vcard-top-nav">
            ${(document.referrer && (document.referrer.includes("view=home") || document.referrer.includes("view=admin"))) || window.location.search.includes("preview=1") ? `
              <a href="?view=home" class="vcard-circle-btn" title="Back to Packages">
                <span>←</span>
              </a>
            ` : `<div></div>`}
            <div>
              <button class="vcard-circle-btn" id="btn-vcard-share" title="Share Business Card">
                <span>📤</span>
              </button>
            </div>
          </div>

          <!-- Centered Glowing Avatar Ring (Hold 1.5s for Vendor Owner Access) -->
          <div class="avatar-ring-wrapper" id="vcard-avatar-wrapper" style="position: relative;">
            <div class="avatar-glowing-ring" id="vcard-avatar-ring">
              ${v.branding.avatarEmoji || (v.branding.businessName ? v.branding.businessName.substring(0, 2).toUpperCase() : "💼")}
            </div>
            ${isInstalled ? `
              <div class="pwa-installed-circle-badge" style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, var(--theme-primary, #D4FF00), #00E5FF); color: #000; font-size: 0.62rem; font-weight: 800; padding: 2px 9px; border-radius: 12px; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.8); display: flex; align-items: center; gap: 4px; border: 1.5px solid #000; letter-spacing: 0.5px;">
                <span>📲</span>
                <span>INSTALLED APP</span>
              </div>
            ` : ""}
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </button>
            <a href="tel:${v.contacts.phone}" class="contact-circle-btn" title="Phone Call">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </a>
            <a href="mailto:${v.contacts.email}" class="contact-circle-btn" title="Send Email">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="3"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
            </a>
            <a href="${v.contacts.mapUrl || 'https://maps.google.com/?q=' + encodeURIComponent(v.contacts.location || '')}" target="_blank" rel="noopener" class="contact-circle-btn" title="Get Directions">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </a>
          </div>

          <!-- Save Contact to Phonebook (.vcf) Action -->
          <div style="padding: 0 16px; margin-bottom: 18px;">
            <button type="button" class="btn-pill" id="btn-vcard-save-contact" style="width: 100%; justify-content: center; padding: 10px 16px; font-weight: 700; font-size: 0.82rem; gap: 8px; border-color: rgba(255, 255, 255, 0.18); background: rgba(255, 255, 255, 0.05);">
              <span>💾</span>
              <span>Save Contact to Phonebook (.vcf)</span>
            </button>
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

          <!-- PWA Web App Installation Banner (Granted by Admin) -->
          ${!isStandalone && v.features?.pwaInstall !== false ? `
            <div class="vcard-pwa-banner" id="vcard-pwa-install-banner" data-action="pwa-install" style="cursor: pointer;">
              <div class="pwa-banner-content">
                <div class="pwa-banner-icon">📲</div>
                <div class="pwa-banner-text">
                  <div class="pwa-banner-title">Install ${v.branding?.businessName || 'Business'} App</div>
                  <div class="pwa-banner-desc">Save to your home screen for 1-tap fast offline access</div>
                </div>
              </div>
              <button type="button" class="pwa-banner-btn" id="btn-vcard-install-pwa" data-action="pwa-install">
                <span>Install</span>
                <span>⬇</span>
              </button>
            </div>
          ` : ""}

          <!-- BUSINESS INFORMATION Section Card -->
          <div class="biz-info-card">
            <div class="biz-info-header">BUSINESS INFORMATION</div>
            
            <div class="biz-info-item">
              <span class="biz-info-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </span>
              <div style="flex: 1;">
                <div class="biz-info-val"><a href="tel:${v.contacts.phone}">${v.contacts.phone}</a></div>
                <div class="biz-info-lbl">Phone</div>
              </div>
              <a href="tel:${v.contacts.phone}" class="btn-biz-call-action" title="Call Now">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>Call</span>
              </a>
            </div>

            <!-- Customized Lead Form Button - Below Call Button in Business Information Section -->
            ${(v.features?.leadForm !== false && v.leadForm?.enabled !== false) ? `
              <div class="biz-lead-form-action-wrap">
                <button type="button" class="btn-biz-lead-trigger" id="btn-open-lead-form">
                  <div class="btn-lead-left">
                    <span class="btn-lead-icon">${v.leadForm?.buttonIcon || '⚡'}</span>
                    <span class="btn-lead-label">${v.leadForm?.buttonText || 'Request Call Back'}</span>
                  </div>
                  <span class="btn-lead-arrow">→</span>
                </button>
              </div>
            ` : ""}

            <div class="biz-info-item">
              <span class="biz-info-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="3"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
              </span>
              <div>
                <div class="biz-info-val"><a href="mailto:${v.contacts.email}">${v.contacts.email}</a></div>
                <div class="biz-info-lbl">Email Address</div>
              </div>
            </div>

            <div class="biz-info-item">
              <span class="biz-info-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </span>
              <div>
                <div class="biz-info-val"><a href="${v.contacts.mapUrl || 'https://maps.google.com/?q=' + encodeURIComponent(v.contacts.location || '')}" target="_blank" rel="noopener">${v.contacts.location}</a></div>
                <div class="biz-info-lbl">Address</div>
              </div>
            </div>

            ${(v.contacts.whatsapp || v.contacts.phone) ? `
              <div class="biz-info-item">
                <span class="biz-info-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </span>
                <div>
                  <div class="biz-info-val">
                    <a href="https://wa.me/${(v.contacts.whatsapp || v.contacts.phone).replace(/[^0-9]/g, '')}" target="_blank" rel="noopener">
                      ${(v.contacts.whatsapp || v.contacts.phone).startsWith('+') ? (v.contacts.whatsapp || v.contacts.phone) : '+' + (v.contacts.whatsapp || v.contacts.phone)}
                    </a>
                  </div>
                  <div class="biz-info-lbl">WhatsApp</div>
                </div>
              </div>
            ` : ""}

            ${v.openHours ? `
              <div class="biz-info-item">
                <span class="biz-info-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </span>
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
        ${v.features?.quoteBuilder !== false ? `
        <div class="tab-pane ${this.activeTab === 'services' ? 'active' : ''}" id="pane-services">
          <div class="vcard-tab-topbar">
            <div class="tab-topbar-left">
              <div class="tab-topbar-avatar" data-tab-avatar="true">${v.branding.avatarEmoji || "📋"}</div>
              <div>
                <div class="tab-topbar-title">Services & Quote</div>
                <div class="tab-topbar-subtitle">Select services to request a quote</div>
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
        </div>
        ` : ''}

        <!-- Tab 3: Shop / Product Catalog (Clean Dedicated Page) -->
        ${v.features?.ecommerceShop !== false ? `
        <div class="tab-pane ${this.activeTab === 'shop' ? 'active' : ''}" id="pane-shop">
          <div class="vcard-tab-topbar">
            <div class="tab-topbar-left">
              <div class="tab-topbar-avatar" data-tab-avatar="true">${v.branding.avatarEmoji || "🛍️"}</div>
              <div>
                <div class="tab-topbar-title">Shop Products</div>
                <div class="tab-topbar-subtitle">Order items directly via WhatsApp</div>
              </div>
            </div>
          </div>

          <!-- Product Category filter chips -->
          <div class="services-filter-bar" id="products-filter-container">
            ${this.renderProductCategoryChips()}
          </div>

          <!-- Products Listing Stack -->
          <div class="products-listing-stack" id="products-list-container">
            ${this.renderProductsList(currency)}
          </div>
        </div>
        ` : ''}

        <!-- Tab 4: Appointment & Booking Calendar (Clean Dedicated Page) -->
        ${v.features?.calendarBooking !== false ? `
        <div class="tab-pane ${this.activeTab === 'calendar' ? 'active' : ''}" id="pane-calendar">
          <div class="vcard-tab-topbar">
            <div class="tab-topbar-left">
              <div class="tab-topbar-avatar" data-tab-avatar="true">${v.branding.avatarEmoji || "📅"}</div>
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

          <!-- Highlighted Selected Date Indicator -->
          <div id="cal-selected-date-badge" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(212, 255, 0, 0.08); border: 1.5px solid var(--theme-primary, #D4FF00); border-radius: 12px; margin: 12px 0;">
            <span style="font-size: 0.78rem; font-weight: 600; color: #FFF;">Selected Date:</span>
            <span id="cal-selected-date-text" style="font-size: 0.84rem; font-weight: 800; color: var(--theme-primary, #D4FF00);"></span>
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
                ${(v.services || []).filter(s => s.visible).map(s => `
                  <option value="${s.name}">${s.name}</option>
                `).join("")}
                <option value="General Consultation">General Consultation</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Special Notes / Requirements (Optional)</label>
              <input type="text" class="form-input" id="booking-client-notes" placeholder="Mention guest count, timing preference, or concerns..." />
            </div>

            <button class="btn-submit-primary" id="btn-submit-booking">
              <span>Confirm & Book on WhatsApp</span>
              <span>📅</span>
            </button>
          </div>
        </div>
        ` : ''}

        <!-- Tab 5: Ratings & Customer Reviews (Clean Dedicated Page) -->
        ${v.features?.customerReviews !== false ? `
        <div class="tab-pane ${this.activeTab === 'reviews' ? 'active' : ''}" id="pane-reviews">
          <div class="vcard-tab-topbar">
            <div class="tab-topbar-left">
              <div class="tab-topbar-avatar" data-tab-avatar="true">${v.branding.avatarEmoji || "★"}</div>
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
          <div class="rating-overview-card" id="rating-overview-container">
            <div>
              <div class="rating-big-score">${stats.avg}</div>
              <div class="rating-stars-row">★★★★★</div>
              <div class="rating-based-count" style="font-size: 0.75rem; color: var(--theme-text-muted);">Based on ${stats.count} ratings</div>
            </div>
            <div style="flex: 1; font-size: 0.8rem; color: var(--theme-text-muted); border-left: 1px solid var(--theme-border); padding-left: 16px;">
              <p style="color: #FFFFFF; font-weight: 700; margin-bottom: 2px;">Top Client Compliments</p>
              <div style="color: #FFFFFF; font-size: 0.74rem; font-weight: 700; margin-bottom: 6px;">You can use tags to share quick feedback</div>
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
        ` : ''}
      </div>
    `;

    // Render modals into dedicated high-z-index overlay container above dock
    const modalsRoot = document.getElementById("app-modals-root");
    if (modalsRoot) {
      modalsRoot.innerHTML = this.renderModals(currency);
    } else {
      this.container.insertAdjacentHTML("beforeend", this.renderModals(currency));
    }

    this.renderBottomDock();
    this.bindEvents();
    this.renderCalendar();
  }

  renderBottomDock() {
    const dockRoot = document.getElementById("app-dock-root");
    if (!dockRoot) return;
    const v = this.vendor;
    const currency = db.getPlatformSettings()?.currencySymbol || "₹";

    // Tab visibility granted by admin:
    // Home: Default (always granted)
    // Services: Granted by admin with toggle button (quoteBuilder)
    // Shop: Granted by admin with toggle button (ecommerceShop)
    // Book appointment: Granted by admin with toggle button (calendarBooking)
    // Reviews: Granted by admin with toggle button (customerReviews)
    const visibleTabs = [
      { id: "home", icon: "🏠", label: "Home" }
    ];

    if (v.features?.quoteBuilder !== false) {
      visibleTabs.push({
        id: "services",
        icon: "📋",
        label: "Services",
        badge: this.selectedServices.size > 0 ? this.selectedServices.size : null
      });
    }

    if (v.features?.ecommerceShop !== false) {
      visibleTabs.push({
        id: "shop",
        icon: "🛍️",
        label: "Shop",
        badge: this.getCartTotalItems() > 0 ? this.getCartTotalItems() : null
      });
    }

    if (v.features?.calendarBooking !== false) {
      visibleTabs.push({ id: "calendar", icon: "📅", label: "Book" });
    }

    if (v.features?.customerReviews !== false) {
      visibleTabs.push({ id: "reviews", icon: "★", label: "Reviews" });
    }

    // Fallback if current active tab is not visible
    if (!visibleTabs.some(t => t.id === this.activeTab)) {
      this.activeTab = "home";
      this.container.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.toggle("active", pane.id === "pane-home");
      });
    }

    dockRoot.style.display = "block";
    dockRoot.innerHTML = `
      <div id="dock-preview-container">
        ${this.renderDockPreviewBar(currency)}
      </div>
      <div class="bottom-dock" style="grid-template-columns: repeat(${visibleTabs.length}, 1fr);">
        ${visibleTabs.map(tab => `
          <button class="dock-item ${this.activeTab === tab.id ? 'active' : ''}" data-tab="${tab.id}">
            <span class="dock-icon">${tab.icon}</span>
            <span class="dock-label">${tab.label}</span>
            ${tab.badge ? `<span class="badge-cart-count">${tab.badge}</span>` : ""}
          </button>
        `).join("")}
      </div>
    `;

    // Bind dock clicks
    dockRoot.querySelectorAll(".dock-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        this.switchTab(tab);
      });
    });

    this.bindDockPreviewEvents(currency);

    const screen = document.getElementById("app-content-root");
    const canQuote = this.vendor?.features?.quoteBuilder !== false;
    const canShop = this.vendor?.features?.ecommerceShop !== false;
    const hasPreview = (canQuote && this.activeTab === "services" && this.selectedServices.size > 0) ||
                       (canShop && this.activeTab === "shop" && this.getCartTotalItems() > 0);
    if (screen) {
      screen.classList.toggle("has-dock-preview", hasPreview);
    }
  }

  renderDockPreviewBar(currency) {
    const canQuote = this.vendor?.features?.quoteBuilder !== false;
    const canShop = this.vendor?.features?.ecommerceShop !== false;

    if (canQuote && this.activeTab === "services" && this.selectedServices.size > 0) {
      const count = this.selectedServices.size;
      return `
        <div class="dock-preview-bar" id="dock-preview-services">
          <div class="dock-preview-info">
            <span class="dock-preview-subtitle">SELECTED SERVICES</span>
            <span class="dock-preview-title">${count} selected</span>
          </div>
          <button type="button" class="dock-preview-action-btn" id="btn-dock-quote-preview">
            <span>Request Quote 📋</span>
          </button>
        </div>
      `;
    }

    if (canShop && this.activeTab === "shop" && this.getCartTotalItems() > 0) {
      const totalItems = this.getCartTotalItems();
      const subtotal = this.getCartSubtotal();
      return `
        <div class="dock-preview-bar" id="dock-preview-shop">
          <div class="dock-preview-info">
            <span class="dock-preview-subtitle">SELECTED PRODUCTS</span>
            <span class="dock-preview-title">${totalItems} item${totalItems > 1 ? 's' : ''} • ${currency}${subtotal.toLocaleString()}</span>
          </div>
          <button type="button" class="dock-preview-action-btn" id="btn-dock-shop-preview">
            <span>View Cart 🛍️</span>
          </button>
        </div>
      `;
    }

    return "";
  }

  bindDockPreviewEvents(currency) {
    const dockRoot = document.getElementById("app-dock-root");
    if (!dockRoot) return;

    const quoteBtn = dockRoot.querySelector("#btn-dock-quote-preview");
    if (quoteBtn) {
      quoteBtn.addEventListener("click", () => {
        this.openServicesCartModal();
      });
    }

    const shopBtn = dockRoot.querySelector("#btn-dock-shop-preview");
    if (shopBtn) {
      shopBtn.addEventListener("click", () => {
        this.openProductsCartModal(currency);
      });
    }
  }

  updateDockPreviewBar() {
    const dockRoot = document.getElementById("app-dock-root");
    if (!dockRoot) return;
    const previewContainer = dockRoot.querySelector("#dock-preview-container");
    const currency = db.getPlatformSettings()?.currencySymbol || "₹";
    const screen = document.getElementById("app-content-root");

    if (previewContainer) {
      previewContainer.innerHTML = this.renderDockPreviewBar(currency);
      this.bindDockPreviewEvents(currency);

      const canQuote = this.vendor?.features?.quoteBuilder !== false;
      const canShop = this.vendor?.features?.ecommerceShop !== false;
      const hasPreview = (canQuote && this.activeTab === "services" && this.selectedServices.size > 0) ||
                         (canShop && this.activeTab === "shop" && this.getCartTotalItems() > 0);
      if (screen) {
        screen.classList.toggle("has-dock-preview", hasPreview);
      }
    }
  }

  renderProductCategoryChips() {
    const products = this.vendor?.products || [];
    const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];
    return categories.map(cat => `
      <button class="filter-chip ${this.productFilter === cat ? 'active' : ''}" data-prod-category="${cat}">
        ${cat}
      </button>
    `).join("");
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
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <div class="service-name" style="margin-bottom: 0;">${s.name}</div>
              <span class="tab-grant-badge locked" style="font-size: 0.68rem; padding: 1px 7px; color: var(--theme-primary); border-color: rgba(212,255,0,0.3); font-weight: 700; white-space: nowrap;">${s.category || 'Service'}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  renderProductsList(currency) {
    const products = (this.vendor?.products || []).filter(p => {
      if (!p.visible) return false;
      if (this.productFilter === "All") return true;
      return (p.category || "").toLowerCase() === this.productFilter.toLowerCase();
    });

    if (products.length === 0) {
      return `<div style="text-align: center; padding: 24px; color: var(--theme-text-muted);">No products found in this category.</div>`;
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
            ${p.category ? `<div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-bottom: 2px;">${p.category}</div>` : ""}
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
          <div class="review-author-name" style="display: flex; align-items: center; gap: 6px; font-weight: 700;">
            <span style="font-size: 0.95rem;">👤</span>
            <span>${r.author}</span>
            <span style="font-size: 0.65rem; background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.3); padding: 1px 6px; border-radius: 4px; font-weight: 700;">Verified Customer</span>
          </div>
          <div class="review-date">${r.date || 'Recently'}</div>
        </div>
        <div style="color: #F59E0B; font-size: 0.82rem; margin: 4px 0;">
          ${"★".repeat(Math.max(1, Math.min(5, Number(r.rating) || 5)))}${"☆".repeat(Math.max(0, 5 - (Number(r.rating) || 5)))}
        </div>
        ${r.tags?.length ? `
          <div class="review-tags-cluster">
            ${r.tags.map(t => `<span class="review-tag-chip">${t}</span>`).join("")}
          </div>
        ` : ""}
        ${r.content ? `<div class="review-content">${r.content}</div>` : ""}
      </div>
    `).join("");
  }

  renderServicesFloatingBar() {
    const count = this.selectedServices.size;
    if (count === 0) return "";
    return `
      <div class="floating-selection-bar">
        <button type="button" class="btn-floating-action" id="btn-floating-services-cart">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="floating-cart-icon">🛒</span>
            <span>${count} Service${count > 1 ? 's' : ''} Selected</span>
          </div>
          <span style="font-size: 0.8rem; font-weight: 700; opacity: 0.9;">View Quote List →</span>
        </button>
      </div>
    `;
  }

  renderServicesModalContent() {
    const v = this.vendor;
    const selectedList = (v.services || []).filter(s => this.selectedServices.has(s.id));
    const count = selectedList.length;

    if (count === 0) {
      return `
        <div style="text-align: center; padding: 32px 16px; color: var(--theme-text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🛒</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: #FFF; margin-bottom: 4px;">No Services Selected</div>
          <div style="font-size: 0.78rem;">Tap on any service from the catalog to add it to your quote request.</div>
        </div>
      `;
    }

    return `
      <!-- Selected services in clean list format -->
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; max-height: 48vh; overflow-y: auto;">
        ${selectedList.map((s, index) => `
          <div class="quote-preview-item" style="margin-bottom: 0;">
            <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
              <span style="font-weight: 800; color: var(--theme-primary); font-size: 0.88rem; flex-shrink: 0;">${index + 1}.</span>
              <div style="min-width: 0; flex: 1;">
                <div style="font-size: 0.86rem; font-weight: 700; color: #FFFFFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.name}</div>
                <div style="font-size: 0.7rem; color: var(--theme-text-muted);">${s.category || 'Service'}</div>
              </div>
            </div>
            <button type="button" class="cart-preview-remove-btn" data-modal-remove-service="${s.id}" title="Remove Service">✕</button>
          </div>
        `).join("")}
      </div>

      <div style="background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); padding: 10px 12px; margin-bottom: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.68rem; cursor: pointer;" for="quote-modal-date">Timeline / Event Date (Optional)</label>
            <div class="date-input-wrapper" id="quote-modal-date-wrapper" title="Click to pick date">
              <input type="date" class="form-input" id="quote-modal-date" style="padding: 7px 32px 7px 10px; font-size: 0.8rem; width: 100%; cursor: pointer;" />
              <span class="date-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                  <line x1="16" x2="16" y1="2" y2="6"></line>
                  <line x1="8" x2="8" y1="2" y2="6"></line>
                  <line x1="3" x2="21" y1="10" y2="10"></line>
                </svg>
              </span>
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.68rem;">Special Requirements (Optional)</label>
            <input type="text" class="form-input" id="quote-modal-notes" placeholder="e.g. Budget, location" style="padding: 7px 10px; font-size: 0.8rem;" />
          </div>
        </div>
      </div>

      <button type="button" class="btn-whatsapp-submit" id="btn-submit-modal-quote">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        <span>Submit Quote Request via WhatsApp</span>
      </button>
    `;
  }

  renderShopFloatingBar(currency) {
    const count = this.getCartTotalItems();
    if (count === 0) return "";
    const subtotal = this.getCartSubtotal();
    return `
      <div class="floating-selection-bar">
        <button type="button" class="btn-floating-action" id="btn-floating-shop-cart" style="background: #10B981; color: #FFF;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="floating-cart-icon">🛒</span>
            <span>${count} Item${count > 1 ? 's' : ''} · ${currency}${subtotal.toLocaleString()}</span>
          </div>
          <span style="font-size: 0.8rem; font-weight: 700; opacity: 0.9;">View Cart & Order →</span>
        </button>
      </div>
    `;
  }

  renderProductsModalContent(currency) {
    const v = this.vendor;
    const totalItems = this.getCartTotalItems();
    const subtotal = this.getCartSubtotal();
    const cartEntries = Object.entries(this.cart).filter(([_, qty]) => qty > 0);

    if (totalItems === 0) {
      return `
        <div style="text-align: center; padding: 32px 16px; color: var(--theme-text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🛍️</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: #FFF; margin-bottom: 4px;">Your Cart is Empty</div>
          <div style="font-size: 0.78rem;">Add products from the catalog to order directly via WhatsApp.</div>
        </div>
      `;
    }

    return `
      <!-- Selected products in clean list format -->
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; max-height: 48vh; overflow-y: auto;">
        ${cartEntries.map(([id, qty]) => {
          const p = (v.products || []).find(prod => prod.id === id);
          if (!p) return "";
          const lineTotal = p.price * qty;
          return `
            <div class="cart-preview-item" style="margin-bottom: 0;">
              <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
                <span style="font-size: 1.3rem; flex-shrink: 0;">${p.emoji || '🛍️'}</span>
                <div style="min-width: 0; flex: 1;">
                  <div style="font-size: 0.85rem; font-weight: 700; color: #FFFFFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</div>
                  <div style="font-size: 0.72rem; color: var(--theme-text-muted);">
                    ${currency}${p.price.toLocaleString()} / ${p.unit || 'unit'}
                  </div>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                <div class="qty-counter">
                  <button class="qty-btn" data-modal-cart-action="dec" data-prod-id="${p.id}">−</button>
                  <span class="qty-val">${qty}</span>
                  <button class="qty-btn" data-modal-cart-action="inc" data-prod-id="${p.id}">+</button>
                </div>
                <div style="font-size: 0.88rem; font-weight: 700; color: var(--theme-primary); min-width: 50px; text-align: right;">
                  ${currency}${lineTotal.toLocaleString()}
                </div>
                <button type="button" class="cart-preview-remove-btn" data-modal-cart-remove="${p.id}" title="Remove item">🗑️</button>
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

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 0.68rem;">Delivery Address / Table / Note (Optional)</label>
          <input type="text" class="form-input" id="cart-modal-address" placeholder="e.g. Table 4 or Address / special notes" style="padding: 7px 10px; font-size: 0.8rem;" />
        </div>
      </div>

      <button type="button" class="btn-whatsapp-submit" id="btn-submit-modal-cart">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        <span>Submit Order via WhatsApp</span>
      </button>
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
            <label class="form-label" style="font-weight: 700; color: #FFFFFF; margin-bottom: 2px;">Feedback Tags</label>
            <p class="review-tags-instruction" style="color: #FFFFFF; font-size: 0.8rem; font-weight: 700; margin: 0 0 8px 0;">
              You can use tags to highlight your experience
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;" id="review-tags-picker">
              ${(v.reviewTags || []).map(tag => `
                <button type="button" class="filter-chip" data-review-tag="${tag}" style="font-weight: 700;">${tag}</button>
              `).join("")}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Your Name</label>
            <input type="text" class="form-input" id="review-client-name" placeholder="e.g. Divya Malhotra" required />
          </div>

          <div class="form-group">
            <label class="form-label">Your Review Comment <span style="font-size: 0.75rem; color: var(--theme-text-muted); font-weight: normal;">(Optional)</span></label>
            <textarea class="form-textarea" id="review-client-text" rows="3" placeholder="Describe your experience with our team and services (optional)..."></textarea>
          </div>

          <button type="button" class="btn-submit-primary" id="btn-submit-review" style="width: 100%; padding: 13px 18px; font-size: 0.92rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span>Post Customer Review</span>
            <span>★</span>
          </button>
        </div>
      </div>

      <!-- Modal: Selected Services Quote Preview -->
      ${v.features?.quoteBuilder !== false ? `
      <div class="modal-overlay" id="modal-services-cart">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">
              <span>🛒</span>
              <span>Selected Services (<span id="modal-srv-count">${this.selectedServices.size}</span>)</span>
            </h3>
            <button class="btn-modal-close" data-close-modal="modal-services-cart">×</button>
          </div>
          <div id="modal-services-content">
            ${this.renderServicesModalContent()}
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Modal: Products Cart & Order -->
      ${v.features?.ecommerceShop !== false ? `
      <div class="modal-overlay" id="modal-products-cart">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">
              <span>🛒</span>
              <span>Cart & Checkout (<span id="modal-prod-count">${this.getCartTotalItems()}</span>)</span>
            </h3>
            <button class="btn-modal-close" data-close-modal="modal-products-cart">×</button>
          </div>
          <div id="modal-products-content">
            ${this.renderProductsModalContent(currency)}
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Modal: Customized Lead Form Popup -->
      ${(v.features?.leadForm !== false && v.leadForm?.enabled !== false) ? `
      <div class="modal-overlay" id="modal-lead-form">
        <div class="modal-card" style="max-width: 480px;">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">
                <span>${v.leadForm?.buttonIcon || '⚡'}</span>
                <span>${v.leadForm?.title || 'Request a Call Back'}</span>
              </h3>
              ${v.leadForm?.subtitle ? `<p style="font-size: 0.76rem; color: var(--theme-text-muted); margin: 3px 0 0 0;">${v.leadForm.subtitle}</p>` : ''}
            </div>
            <button class="btn-modal-close" data-close-modal="modal-lead-form">×</button>
          </div>

          <form id="form-customer-lead" style="margin-top: 14px;">
            <div id="lead-form-fields-container">
              ${(v.leadForm?.fields && v.leadForm.fields.length > 0 ? v.leadForm.fields : this.getDefaultLeadFields()).map(f => this.renderLeadFormField(f)).join("")}
            </div>

            <button type="submit" class="btn-lead-submit-glowing" id="btn-submit-lead-form">
              <span>${v.leadForm?.submitButtonText || 'Request Call Back ⚡'}</span>
            </button>
          </form>
        </div>
      </div>
      ` : ''}

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

  getDefaultLeadFields() {
    return [
      { id: "fld-name", type: "text", label: "Full Name", placeholder: "Enter your full name", required: true, options: [] },
      { id: "fld-phone", type: "phone", label: "Phone / WhatsApp", placeholder: "Your 10-digit number", required: true, options: [] },
      { id: "fld-notes", type: "textarea", label: "Message / Requirement", placeholder: "Tell us how we can help you...", required: false, options: [] }
    ];
  }

  renderLeadFormField(field) {
    if (!field) return "";
    const reqStar = field.required ? '<span class="required-star">*</span>' : '';
    const reqAttr = field.required ? 'required' : '';

    if (field.type === "select") {
      const options = Array.isArray(field.options) ? field.options : [];
      return `
        <div class="lead-field-group">
          <label class="lead-field-label">
            ${field.label} ${reqStar}
          </label>
          <select class="lead-field-select" data-lead-id="${field.id}" data-lead-type="select" data-lead-label="${field.label}" ${reqAttr}>
            <option value="">${field.placeholder || '-- Select an option --'}</option>
            ${options.map(opt => `<option value="${opt}">${opt}</option>`).join("")}
          </select>
        </div>
      `;
    }

    if (field.type === "date") {
      return `
        <div class="lead-field-group">
          <label class="lead-field-label">
            ${field.label} ${reqStar}
          </label>
          <input
            type="date"
            class="lead-field-date"
            data-lead-id="${field.id}"
            data-lead-type="date"
            data-lead-label="${field.label}"
            ${reqAttr}
          />
        </div>
      `;
    }

    if (field.type === "multiselect") {
      const options = Array.isArray(field.options) ? field.options : [];
      return `
        <div class="lead-field-group">
          <label class="lead-field-label">
            ${field.label} ${reqStar}
            <span style="font-size: 0.72rem; color: var(--theme-text-muted); font-weight: normal; margin-left: 4px;">(Select multiple)</span>
          </label>
          <div class="lead-multiselect-group" data-lead-id="${field.id}" data-lead-type="multiselect" data-lead-label="${field.label}" data-required="${field.required ? 'true' : 'false'}">
            ${options.map(opt => `
              <button type="button" class="lead-choice-chip" data-choice-val="${opt}">
                <span class="chip-check">✓</span>
                <span>${opt}</span>
              </button>
            `).join("")}
          </div>
        </div>
      `;
    }

    if (field.type === "textarea") {
      return `
        <div class="lead-field-group">
          <label class="lead-field-label">
            ${field.label} ${reqStar}
          </label>
          <textarea
            class="lead-field-textarea"
            rows="3"
            data-lead-id="${field.id}"
            data-lead-type="textarea"
            data-lead-label="${field.label}"
            placeholder="${field.placeholder || ''}"
            ${reqAttr}
          ></textarea>
        </div>
      `;
    }

    // Default: text, phone, email, number
    const inputType = field.type === "phone" ? "tel" : (field.type === "number" ? "number" : (field.type === "email" ? "email" : "text"));
    return `
      <div class="lead-field-group">
        <label class="lead-field-label">
          ${field.label} ${reqStar}
        </label>
        <input
          type="${inputType}"
          class="lead-field-input"
          data-lead-id="${field.id}"
          data-lead-type="${field.type}"
          data-lead-label="${field.label}"
          placeholder="${field.placeholder || ''}"
          ${reqAttr}
        />
      </div>
    `;
  }

  bindEvents() {
    const v = this.vendor;

    // Share Card -> Native share or copy clean link
    const shareBtn = this.container.querySelector("#btn-vcard-share");
    if (shareBtn) {
      shareBtn.addEventListener("click", async () => {
        const cleanUrl = `${window.location.origin}${window.location.pathname}?v=${v.slug}`;
        const shareData = {
          title: v.branding.businessName,
          text: `Check out ${v.branding.businessName} smart digital vCard!`,
          url: cleanUrl
        };
        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            // share cancelled or unsupported
          }
        } else {
          try {
            await navigator.clipboard.writeText(cleanUrl);
            window.OmniApp.showToast("vCard link copied to clipboard!");
          } catch (e) {
            window.OmniApp.showToast("Link: " + cleanUrl);
          }
        }
      });
    }

    // Quick WhatsApp contact
    const quickWa = this.container.querySelector("#btn-quick-whatsapp");
    if (quickWa) {
      quickWa.addEventListener("click", () => {
        WhatsAppEngine.openChat(
          v.contacts.whatsapp || v.contacts.phone,
          `Hello *${v.branding.businessName}*, I found your smart card and would like to inquire about your services!`
        );
      });
    }

    // Save contact (.vcf) button
    const saveContactBtn = this.container.querySelector("#btn-vcard-save-contact");
    if (saveContactBtn) {
      saveContactBtn.addEventListener("click", () => {
        this.downloadVCard();
      });
    }

    // Claim promo deal
    const claimBtn = this.container.querySelector("#btn-claim-promo");
    if (claimBtn) {
      claimBtn.addEventListener("click", () => {
        const text = WhatsAppEngine.buildClaimOfferMessage(v, v.promo);
        WhatsAppEngine.openChat(v.contacts.whatsapp || v.contacts.phone, text);
      });
    }

    // PWA Install Web App Button & Banner
    const pwaBtn = this.container.querySelector("#btn-vcard-install-pwa");
    const pwaBanner = this.container.querySelector("#vcard-pwa-install-banner");
    const handleInstallClick = (e) => {
      if (e) e.stopPropagation();
      PWAHandler.promptInstall(v?.branding?.businessName, v);
    };
    if (pwaBtn) pwaBtn.addEventListener("click", handleInstallClick);
    if (pwaBanner) pwaBanner.addEventListener("click", handleInstallClick);

    // Category filter chips
    this.container.querySelectorAll(".filter-chip[data-category]").forEach(chip => {
      chip.addEventListener("click", () => {
        this.serviceFilter = chip.getAttribute("data-category");
        this.container.querySelector("#services-filter-container").innerHTML = this.renderServiceCategoryChips();
        this.container.querySelector("#services-list-container").innerHTML = this.renderServicesList();
        this.bindCategoryEvents();
        this.bindServicesEvents();
      });
    });

    // Product Category filter chips
    this.bindProductCategoryEvents();

    this.bindServicesEvents();
    this.bindCartEvents();
    this.bindCalendarEvents();
    this.bindModalEvents();
    this.bindAvatarLongPress();
  }

  bindProductCategoryEvents() {
    const currency = db.getPlatformSettings()?.currencySymbol || "₹";
    this.container.querySelectorAll(".filter-chip[data-prod-category]").forEach(chip => {
      chip.addEventListener("click", () => {
        this.productFilter = chip.getAttribute("data-prod-category");
        const filterContainer = this.container.querySelector("#products-filter-container");
        if (filterContainer) filterContainer.innerHTML = this.renderProductCategoryChips();
        const listContainer = this.container.querySelector("#products-list-container");
        if (listContainer) listContainer.innerHTML = this.renderProductsList(currency);
        this.bindProductCategoryEvents();
        this.bindCartEvents();
      });
    });
  }

  bindCategoryEvents() {
    this.container.querySelectorAll(".filter-chip[data-category]").forEach(chip => {
      chip.addEventListener("click", () => {
        this.serviceFilter = chip.getAttribute("data-category");
        this.container.querySelector("#services-filter-container").innerHTML = this.renderServiceCategoryChips();
        this.container.querySelector("#services-list-container").innerHTML = this.renderServicesList();
        this.bindCategoryEvents();
        this.bindServicesEvents();
      });
    });
  }

  bindServicesEvents() {
    this.bindServiceCheckboxEvents();
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

        this.updateServicesCartState();
      });
    });
  }

  updateServicesCartState() {
    const count = this.selectedServices.size;

    // 1. Update Services Task Bar Badge (in red)
    const dockRoot = document.getElementById("app-dock-root");
    const dockServices = dockRoot?.querySelector(".dock-item[data-tab='services']");
    if (dockServices) {
      let badge = dockServices.querySelector(".badge-cart-count");
      if (count > 0) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "badge-cart-count";
          dockServices.appendChild(badge);
        }
        badge.textContent = count;
      } else if (badge) {
        badge.remove();
      }
    }

    // 2. Update Sticky Preview Bar
    this.updateDockPreviewBar();

    // 3. If modal is currently active, re-render its content
    const modal = document.getElementById("modal-services-cart");
    if (modal && modal.classList.contains("active")) {
      const countEl = modal.querySelector("#modal-srv-count");
      if (countEl) countEl.textContent = count;
      const contentEl = modal.querySelector("#modal-services-content");
      if (contentEl) {
        contentEl.innerHTML = this.renderServicesModalContent();
        this.bindServicesModalEvents();
      }
    }
  }

  openServicesCartModal() {
    const modal = document.getElementById("modal-services-cart");
    if (!modal) return;
    const countEl = modal.querySelector("#modal-srv-count");
    if (countEl) countEl.textContent = this.selectedServices.size;
    const contentEl = modal.querySelector("#modal-services-content");
    if (contentEl) {
      contentEl.innerHTML = this.renderServicesModalContent();
      this.bindServicesModalEvents();
    }
    modal.classList.add("active");
    document.body.classList.add("has-modal-open");
  }

  bindServicesModalEvents() {
    const v = this.vendor;
    const modal = document.getElementById("modal-services-cart");
    if (!modal) return;

    // Remove single service inside modal
    modal.querySelectorAll("[data-modal-remove-service]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const sId = btn.getAttribute("data-modal-remove-service");
        this.selectedServices.delete(sId);

        // Synchronize service card in catalog above
        const sCard = this.container.querySelector(`.service-card[data-service-id="${sId}"]`);
        if (sCard) {
          sCard.classList.remove("selected");
          const cb = sCard.querySelector(".service-checkbox");
          if (cb) cb.checked = false;
        }

        this.updateServicesCartState();
      });
    });

    // Submit Quote Request to WhatsApp
    const submitBtn = modal.querySelector("#btn-submit-modal-quote");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        const eventDate = modal.querySelector("#quote-modal-date")?.value;
        const notes = modal.querySelector("#quote-modal-notes")?.value.trim();

        const selectedList = (v.services || []).filter(s => this.selectedServices.has(s.id));
        if (selectedList.length === 0) {
          window.OmniApp.showToast("Please select at least one service.");
          return;
        }

        const msg = WhatsAppEngine.buildQuoteMessage(v, selectedList, { eventDate, notes });
        WhatsAppEngine.openChat(v.contacts.whatsapp || v.contacts.phone, msg);
        window.OmniApp.showToast("Quote inquiry opened in WhatsApp!");
        modal.classList.remove("active");
        if (!document.querySelector(".modal-overlay.active")) {
          document.body.classList.remove("has-modal-open");
        }
      });
    }

    // Trigger calendar picker anywhere user clicks on date input or wrapper
    const dateInput = modal.querySelector("#quote-modal-date");
    const dateWrapper = modal.querySelector("#quote-modal-date-wrapper");
    if (dateInput) {
      const openCalendar = () => {
        if (typeof dateInput.showPicker === "function") {
          try {
            dateInput.showPicker();
          } catch (err) {
            dateInput.focus();
          }
        } else {
          dateInput.focus();
        }
      };

      dateInput.addEventListener("click", openCalendar);
      if (dateWrapper) {
        dateWrapper.addEventListener("click", openCalendar);
      }
    }
  }

  bindCartEvents() {
    const currency = db.getPlatformSettings()?.currencySymbol || "₹";

    // Quantity increment / decrement buttons on catalog items
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
  }

  updateCartState(currency) {
    const totalItems = this.getCartTotalItems();

    // 1. Synchronize all product list item counters in catalog
    this.container.querySelectorAll(".product-list-item").forEach(item => {
      const incBtn = item.querySelector("[data-cart-action='inc']");
      if (incBtn) {
        const pId = incBtn.getAttribute("data-prod-id");
        const qtyVal = item.querySelector(".qty-val");
        if (qtyVal) qtyVal.textContent = this.cart[pId] || 0;
      }
    });

    // 2. Update Dock Cart Badge (in red)
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

    // 3. Update Sticky Preview Bar
    this.updateDockPreviewBar();

    // 5. If modal is currently active, re-render content
    const modal = document.getElementById("modal-products-cart");
    if (modal && modal.classList.contains("active")) {
      const countEl = modal.querySelector("#modal-prod-count");
      if (countEl) countEl.textContent = totalItems;
      const contentEl = modal.querySelector("#modal-products-content");
      if (contentEl) {
        contentEl.innerHTML = this.renderProductsModalContent(currency);
        this.bindProductsModalEvents(currency);
      }
    }
  }

  openProductsCartModal(currency) {
    const modal = document.getElementById("modal-products-cart");
    if (!modal) return;
    const countEl = modal.querySelector("#modal-prod-count");
    if (countEl) countEl.textContent = this.getCartTotalItems();
    const contentEl = modal.querySelector("#modal-products-content");
    if (contentEl) {
      contentEl.innerHTML = this.renderProductsModalContent(currency);
      this.bindProductsModalEvents(currency);
    }
    modal.classList.add("active");
    document.body.classList.add("has-modal-open");
  }

  bindProductsModalEvents(currency) {
    const v = this.vendor;
    const modal = document.getElementById("modal-products-cart");
    if (!modal) return;

    // Inc / Dec in modal
    modal.querySelectorAll("[data-modal-cart-action]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.getAttribute("data-modal-cart-action");
        const prodId = btn.getAttribute("data-prod-id");

        let cur = this.cart[prodId] || 0;
        if (action === "inc") cur += 1;
        else if (action === "dec") cur = Math.max(0, cur - 1);

        if (cur === 0) delete this.cart[prodId];
        else this.cart[prodId] = cur;

        this.updateCartState(currency);
      });
    });

    // Remove in modal
    modal.querySelectorAll("[data-modal-cart-remove]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const prodId = btn.getAttribute("data-modal-cart-remove");
        delete this.cart[prodId];
        this.updateCartState(currency);
      });
    });

    // Submit Order in modal
    const submitBtn = modal.querySelector("#btn-submit-modal-cart");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        const address = modal.querySelector("#cart-modal-address")?.value.trim();

        const cartItems = Object.entries(this.cart).map(([id, qty]) => {
          const prod = (v.products || []).find(p => p.id === id);
          return { ...prod, quantity: qty };
        }).filter(item => item && item.quantity > 0);

        if (cartItems.length === 0) {
          window.OmniApp.showToast("Your cart is empty. Add products before submitting.");
          return;
        }

        const msg = WhatsAppEngine.buildOrderMessage(v, cartItems, { address });
        WhatsAppEngine.openChat(v.contacts.whatsapp || v.contacts.phone, msg);
        window.OmniApp.showToast("Order prepared for WhatsApp!");
        modal.classList.remove("active");
        if (!document.querySelector(".modal-overlay.active")) {
          document.body.classList.remove("has-modal-open");
        }
      });
    }
  }

  bindCalendarEvents() {
    const prev = this.container.querySelector("#btn-cal-prev");
    const next = this.container.querySelector("#btn-cal-next");

    if (prev) {
      prev.addEventListener("click", () => {
        if (!this.viewDate) this.viewDate = new Date(this.selectedDate || Date.now());
        this.viewDate.setMonth(this.viewDate.getMonth() - 1);
        this.renderCalendar();
      });
    }

    if (next) {
      next.addEventListener("click", () => {
        if (!this.viewDate) this.viewDate = new Date(this.selectedDate || Date.now());
        this.viewDate.setMonth(this.viewDate.getMonth() + 1);
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
        const service = this.container.querySelector("#booking-service-select")?.value;
        const notes = this.container.querySelector("#booking-client-notes")?.value.trim() || "";

        const yearStr = this.selectedDate.getFullYear();
        const monthStr = String(this.selectedDate.getMonth() + 1).padStart(2, "0");
        const dayStr = String(this.selectedDate.getDate()).padStart(2, "0");
        const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

        const bookingData = {
          clientName: "WhatsApp Client",
          clientPhone: "",
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
        WhatsAppEngine.openChat(this.vendor.contacts.whatsapp || this.vendor.contacts.phone, msg);

        // Reset form
        const notesInput = this.container.querySelector("#booking-client-notes");
        if (notesInput) notesInput.value = "";
      });
    }
  }

  updateSelectedDateDisplay() {
    const badgeText = this.container.querySelector("#cal-selected-date-text");
    if (!badgeText) return;
    if (!this.selectedDate) {
      this.selectedDate = new Date();
    }
    const options = { weekday: "short", day: "numeric", month: "short", year: "numeric" };
    badgeText.textContent = this.selectedDate.toLocaleDateString("en-US", options);
  }

  renderCalendar() {
    const monthTitle = this.container.querySelector("#cal-month-title");
    const daysGrid = this.container.querySelector("#cal-days-grid");
    if (!monthTitle || !daysGrid) return;

    if (!this.selectedDate) {
      this.selectedDate = new Date();
    }
    if (!this.viewDate) {
      this.viewDate = new Date(this.selectedDate);
    }

    const viewYear = this.viewDate.getFullYear();
    const viewMonth = this.viewDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthTitle.textContent = `${monthNames[viewMonth]} ${viewYear}`;

    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const today = new Date();

    let html = "";
    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
      const isSelected = this.selectedDate &&
        this.selectedDate.getFullYear() === viewYear &&
        this.selectedDate.getMonth() === viewMonth &&
        this.selectedDate.getDate() === day;

      html += `
        <button type="button" class="cal-day-btn ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-day="${day}">
          ${day}
        </button>
      `;
    }

    daysGrid.innerHTML = html;

    // Bind Day clicks
    daysGrid.querySelectorAll(".cal-day-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const day = Number(btn.getAttribute("data-day"));
        this.selectedDate = new Date(viewYear, viewMonth, day);
        daysGrid.querySelectorAll(".cal-day-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        this.updateSelectedDateDisplay();
      });
    });

    this.updateSelectedDateDisplay();
  }

  bindModalEvents() {
    const v = this.vendor;
    const currency = db.getPlatformSettings()?.currencySymbol || "₹";
    const modalsRoot = document.getElementById("app-modals-root") || this.container;

    // Close buttons
    modalsRoot.querySelectorAll("[data-close-modal]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-close-modal");
        document.getElementById(id)?.classList.remove("active");
        if (!document.querySelector(".modal-overlay.active")) {
          document.body.classList.remove("has-modal-open");
        }
      });
    });

    // Close on clicking backdrop
    modalsRoot.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.classList.remove("active");
          if (!document.querySelector(".modal-overlay.active")) {
            document.body.classList.remove("has-modal-open");
          }
        }
      });
    });

    // Open Lead Form Popup Modal
    const leadBtn = this.container.querySelector("#btn-open-lead-form");
    if (leadBtn) {
      leadBtn.addEventListener("click", () => {
        document.getElementById("modal-lead-form")?.classList.add("active");
        document.body.classList.add("has-modal-open");
      });
    }

    // Multi-select Choice Chips in Lead Form
    modalsRoot.querySelectorAll("#modal-lead-form .lead-choice-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        chip.classList.toggle("selected");
      });
    });

    // Calendar Picker opener on date input click
    modalsRoot.querySelectorAll("#modal-lead-form input[type='date']").forEach(dateInp => {
      dateInp.addEventListener("click", () => {
        if (typeof dateInp.showPicker === "function") {
          try { dateInp.showPicker(); } catch (err) {}
        }
      });
    });

    // Submit Lead Form
    const leadForm = modalsRoot.querySelector("#form-customer-lead");
    if (leadForm) {
      leadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fieldElements = leadForm.querySelectorAll("[data-lead-id]");
        const collectedFields = [];
        let customerName = "";
        let customerPhone = "";
        let validationError = null;

        fieldElements.forEach(el => {
          if (validationError) return;
          const id = el.getAttribute("data-lead-id");
          const type = el.getAttribute("data-lead-type");
          const label = el.getAttribute("data-lead-label") || "Field";
          const isReq = el.hasAttribute("required") || el.getAttribute("data-required") === "true";

          let value = "";
          if (type === "multiselect") {
            const selectedChips = el.querySelectorAll(".lead-choice-chip.selected");
            value = Array.from(selectedChips).map(c => c.getAttribute("data-choice-val"));
            if (isReq && value.length === 0) {
              validationError = `Please select at least one option for "${label}".`;
              return;
            }
          } else {
            value = (el.value || "").trim();
            if (isReq && !value) {
              validationError = `Please fill out "${label}".`;
              el.focus();
              return;
            }
          }

          if (type === "phone" || label.toLowerCase().includes("phone") || label.toLowerCase().includes("whatsapp") || label.toLowerCase().includes("mobile")) {
            if (!customerPhone && typeof value === "string") customerPhone = value;
          }
          if (type === "text" && (label.toLowerCase().includes("name") || label.toLowerCase().includes("customer") || label.toLowerCase().includes("client"))) {
            if (!customerName && typeof value === "string") customerName = value;
          }

          collectedFields.push({ id, label, type, value });
        });

        if (validationError) {
          window.OmniApp.showToast(validationError);
          return;
        }

        const submitBtn = leadForm.querySelector("#btn-submit-lead-form");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.style.opacity = "0.7";
        }

        try {
          const leadRecord = {
            customerName: customerName || "Prospective Client",
            customerPhone: customerPhone || "",
            fields: collectedFields
          };

          // Format WhatsApp message & trigger WhatsApp immediately to avoid popup blockers
          const waText = WhatsAppEngine.buildLeadMessage(v, leadRecord);
          const targetNumber = v.leadForm?.whatsappNumber || v.contacts?.whatsapp || v.contacts?.phone;
          WhatsAppEngine.openChat(targetNumber, waText);

          // Save to Database
          await db.addLead(v.id, leadRecord);

          // Close modal
          document.getElementById("modal-lead-form")?.classList.remove("active");
          if (!document.querySelector(".modal-overlay.active")) {
            document.body.classList.remove("has-modal-open");
          }

          window.OmniApp.showToast("Callback Request Submitted! Redirecting to WhatsApp...");
          leadForm.reset();
          leadForm.querySelectorAll(".lead-choice-chip.selected").forEach(c => c.classList.remove("selected"));
        } catch (err) {
          console.error("Lead submission error:", err);
          window.OmniApp.showToast("Error submitting request. Please try again.");
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";
          }
        }
      });
    }

    // Open Review Modal
    const reviewBtn = this.container.querySelector("#btn-open-review-modal");
    if (reviewBtn) {
      reviewBtn.addEventListener("click", () => {
        document.getElementById("modal-review")?.classList.add("active");
        document.body.classList.add("has-modal-open");
      });
    }

    // Star rating picker in modal
    const starSpans = modalsRoot.querySelectorAll("#review-stars-selector span");
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
    modalsRoot.querySelectorAll("[data-review-tag]").forEach(chip => {
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
    const submitReview = modalsRoot.querySelector("#btn-submit-review");
    if (submitReview) {
      submitReview.addEventListener("click", async () => {
        const author = modalsRoot.querySelector("#review-client-name")?.value.trim();
        const content = modalsRoot.querySelector("#review-client-text")?.value.trim() || "";

        if (!author) {
          window.OmniApp.showToast("Please enter your name to submit a review.");
          return;
        }

        const reviewData = {
          author,
          rating: this.selectedReviewRating || 5,
          tags: Array.from(this.selectedReviewTags || []),
          content
        };

        await db.addReview(v.id, reviewData);

        // Update in-memory vendor so newly submitted review renders immediately
        this.vendor = db.getVendor(v.id);

        document.getElementById("modal-review")?.classList.remove("active");
        if (!document.querySelector(".modal-overlay.active")) {
          document.body.classList.remove("has-modal-open");
        }

        // Reset form inputs for next time
        if (modalsRoot.querySelector("#review-client-name")) modalsRoot.querySelector("#review-client-name").value = "";
        if (modalsRoot.querySelector("#review-client-text")) modalsRoot.querySelector("#review-client-text").value = "";
        this.selectedReviewTags.clear();
        modalsRoot.querySelectorAll("[data-review-tag]").forEach(chip => chip.classList.remove("active"));

        window.OmniApp.showToast(`Thank you, ${author}! Your review is now live. ★`);

        // Refresh reviews list on page immediately
        const reviewsContainer = this.container.querySelector("#reviews-list-container");
        if (reviewsContainer) {
          reviewsContainer.innerHTML = this.renderReviewsList();
        }

        // Refresh rating overview and stats
        const newStats = this.getReviewStats();
        const overviewEl = this.container.querySelector("#rating-overview-container");
        if (overviewEl) {
          const scoreEl = overviewEl.querySelector(".rating-big-score");
          if (scoreEl) scoreEl.textContent = newStats.avg;
          const countEl = overviewEl.querySelector(".rating-based-count");
          if (countEl) countEl.textContent = `Based on ${newStats.count} ratings`;
        }

        const ratingPill = this.container.querySelector(".rating-pill");
        if (ratingPill) ratingPill.innerHTML = `<span>★</span><span>${newStats.avg} (${newStats.count} reviews)</span>`;
      });
    }
  }

  // Long-press detection on Avatar circle to trigger secret vendor owner login (No visible settings icon)
  bindAvatarLongPress() {
    const avatars = this.container.querySelectorAll("#vcard-avatar-wrapper, #vcard-avatar-ring, [data-tab-avatar='true']");
    if (avatars.length === 0) return;

    let pressTimer = null;
    let activeAvatar = null;
    let touchStartX = 0;
    let touchStartY = 0;

    const startPress = (el) => {
      activeAvatar = el;
      el.classList.add("avatar-holding");
      const wrapper = el.closest("#vcard-avatar-wrapper") || el;
      wrapper.classList.add("avatar-holding");

      pressTimer = setTimeout(() => {
        el.classList.remove("avatar-holding");
        wrapper.classList.remove("avatar-holding");
        activeAvatar = null;

        // Subtle haptic vibration on mobile if supported
        if (navigator.vibrate) {
          try { navigator.vibrate([40, 50, 40]); } catch (_) {}
        }

        // Open secret owner PIN modal
        const modal = document.getElementById("modal-owner-pin");
        if (modal) {
          modal.classList.add("active");
          document.body.classList.add("has-modal-open");
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
        const wrapper = activeAvatar.closest("#vcard-avatar-wrapper") || activeAvatar;
        wrapper.classList.remove("avatar-holding");
        activeAvatar = null;
      }
    };

    avatars.forEach(avatar => {
      // Suppress browser default context menu / touch-callout on the circle
      avatar.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });

      // Mobile touch events with scroll jitter threshold
      avatar.addEventListener("touchstart", (e) => {
        if (e.touches && e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
        startPress(avatar);
      }, { passive: true });

      avatar.addEventListener("touchmove", (e) => {
        if (e.touches && e.touches.length > 0) {
          const dx = Math.abs(e.touches[0].clientX - touchStartX);
          const dy = Math.abs(e.touches[0].clientY - touchStartY);
          // If customer is scrolling page (> 15px), abort hold
          if (dx > 15 || dy > 15) {
            cancelPress();
          }
        }
      }, { passive: true });

      avatar.addEventListener("touchend", cancelPress);
      avatar.addEventListener("touchcancel", cancelPress);

      // Desktop mouse events (Left click hold only)
      avatar.addEventListener("mousedown", (e) => {
        if (e.button === 0) startPress(avatar);
      });
      avatar.addEventListener("mouseup", cancelPress);
      avatar.addEventListener("mouseleave", cancelPress);
    });

    // Form submission for secret owner Password / PIN
    const pinForm = (document.getElementById("app-modals-root") || this.container).querySelector("#form-secret-owner-pin");
    if (pinForm) {
      pinForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const enteredPin = document.getElementById("input-owner-secret-pin")?.value.trim();
        const validPassword = this.vendor.password || this.vendor.pin || "2026";
        if (enteredPin === validPassword || enteredPin === this.vendor.pin) {
          document.getElementById("modal-owner-pin")?.classList.remove("active");
          if (!document.querySelector(".modal-overlay.active")) {
            document.body.classList.remove("has-modal-open");
          }
          window.OmniApp.showToast(`Owner Verified: Welcome ${this.vendor.branding.businessName}`);
          window.OmniApp.adminManageVendor(this.vendor.id);
        } else {
          window.OmniApp.showToast("Access Denied: Incorrect Password.");
          const pinInput = document.getElementById("input-owner-secret-pin");
          if (pinInput) {
            pinInput.value = "";
            pinInput.focus();
          }
        }
      });
    }
  }

  renderCartModalItems(currency) {
    const listEl = document.getElementById("cart-modal-items-list");
    const totalEl = document.getElementById("cart-modal-total-amount");
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
    // Feature authorization guards: Prevent navigating to revoked tabs
    if (tabName === "services" && this.vendor?.features?.quoteBuilder === false) tabName = "home";
    if (tabName === "shop" && this.vendor?.features?.ecommerceShop === false) tabName = "home";
    if (tabName === "calendar" && this.vendor?.features?.calendarBooking === false) tabName = "home";
    if (tabName === "reviews" && this.vendor?.features?.customerReviews === false) tabName = "home";

    this.activeTab = tabName;
    const dockRoot = document.getElementById("app-dock-root");
    if (dockRoot) {
      dockRoot.querySelectorAll(".dock-item").forEach(item => {
        item.classList.toggle("active", item.getAttribute("data-tab") === tabName);
      });
      this.updateDockPreviewBar();
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

  // Generate and download standard vCard (.vcf) contact file
  downloadVCard() {
    const v = this.vendor;
    if (!v) return;
    const phone = (v.contacts?.phone || "").replace(/[^\d+]/g, "");
    const wa = (v.contacts?.whatsapp || "").replace(/[^\d+]/g, "");
    const email = v.contacts?.email || "";
    const name = v.branding?.ownerName || v.branding?.businessName || "Business Contact";
    const org = v.branding?.businessName || "";
    const title = v.branding?.category || "";
    const note = v.about?.description || v.branding?.tagline || "";
    const url = window.location.href;
    const address = (v.contacts?.location || "").replace(/[\r\n]+/g, " ");

    const vcf = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${name}`,
      `ORG:${org}`,
      title ? `TITLE:${title}` : "",
      phone ? `TEL;TYPE=WORK,VOICE:${phone}` : "",
      wa ? `TEL;TYPE=CELL,VOICE:${wa}` : "",
      email ? `EMAIL;TYPE=WORK,INTERNET:${email}` : "",
      `URL:${url}`,
      address ? `ADR;TYPE=WORK:;;${address.replace(/;/g, " ")};;;;` : "",
      note ? `NOTE:${note.replace(/[\r\n]+/g, " ")}` : "",
      "END:VCARD"
    ].filter(Boolean).join("\r\n");

    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${(v.branding?.businessName || "contact").replace(/[^a-zA-Z0-9]/g, "_")}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    window.OmniApp.showToast("Contact card (.vcf) downloaded! Tap to save in your phonebook.");
  }
}
