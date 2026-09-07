// Public Business Home / Pricing & Features Showcase Controller
import { db } from "./db.js";

export class HomeController {
  constructor(container) {
    this.container = container;
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    const settings = db.getPlatformSettings() || {};
    const currency = settings.currencySymbol || "₹";
    const rawWa = settings.supportWhatsApp || "+919876543210";
    const cleanWa = rawWa.replace(/[^0-9]/g, "");
    const plans = db.getSubscriptionPlans() || [];
    const vendors = db.getVendors() || [];

    // General WhatsApp support link
    const generalInquiryText = encodeURIComponent(
      `Hello Admin! I am interested in getting an interactive Smart Business vCard on ${settings.platformName || "OmniCard OS"}. Please guide me on setup and package activation.`
    );
    const generalWaUrl = `https://wa.me/${cleanWa}?text=${generalInquiryText}`;

    this.container.innerHTML = `
      <div class="minimal-home-container">

        <!-- 1. Minimal Header / Hero -->
        <div class="minimal-hero">
          <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(212,255,0,0.1); border: 1px solid rgba(212,255,0,0.3); border-radius: 999px; padding: 4px 12px; margin-bottom: 14px;">
            <span style="font-size: 0.85rem;">⚡</span>
            <span style="font-size: 0.74rem; font-weight: 700; color: var(--theme-primary, #D4FF00); text-transform: uppercase; letter-spacing: 0.05em;">Smart Business vCard Platform</span>
          </div>

          <h1 class="minimal-title">
            ${settings.platformName || "OmniCard OS"}
          </h1>

          <p class="minimal-subtitle">
            Interactive digital business storefronts with integrated WhatsApp quote requests, product ordering, calendar slot booking, and customer reviews.
          </p>

          <!-- Top Quick Actions -->
          <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
            <a href="?view=admin" class="btn-pill active" style="text-decoration: none; padding: 9px 18px; font-weight: 700; font-size: 0.84rem;">
              <span>🛡️ Admin Login</span>
              <span>→</span>
            </a>
            <a href="${generalWaUrl}" target="_blank" rel="noopener noreferrer" class="btn-pill" style="text-decoration: none; padding: 9px 18px; font-weight: 600; font-size: 0.84rem; color: #25D366; border-color: rgba(37,211,102,0.35);">
              <span>💬 WhatsApp Support</span>
              <span>↗</span>
            </a>
          </div>
        </div>

        <!-- 2. Features Granted for vCard (Key Highlights Only - Neat & Compact) -->
        <div class="minimal-features-card">
          <div class="minimal-section-title">
            <span>✨</span>
            <span>Modular vCard Features</span>
          </div>
          <div class="minimal-section-desc">
            Core profile is default. Specific features are granted and managed per business by Admin:
          </div>

          <div class="features-highlights-grid">
            <div class="highlight-item">
              <span class="highlight-icon">🏠</span>
              <div class="highlight-info">
                <div class="highlight-title">
                  <span>Home Profile</span>
                  <span class="pill-status-active" style="font-size: 0.62rem; padding: 1px 6px;">DEFAULT</span>
                </div>
                <div class="highlight-sub">Contacts, Hours, GPS Maps & .vcf Phonebook Save</div>
              </div>
            </div>

            <div class="highlight-item">
              <span class="highlight-icon">📋</span>
              <div class="highlight-info">
                <div class="highlight-title">
                  <span>Services Quote</span>
                  <span class="package-tab-tag active" style="font-size: 0.62rem; padding: 1px 6px;">ADMIN GRANTED</span>
                </div>
                <div class="highlight-sub">Service Catalog with 1-Click WhatsApp Quote Builder</div>
              </div>
            </div>

            <div class="highlight-item">
              <span class="highlight-icon">🛍️</span>
              <div class="highlight-info">
                <div class="highlight-title">
                  <span>Product Shop</span>
                  <span class="package-tab-tag active" style="font-size: 0.62rem; padding: 1px 6px;">ADMIN GRANTED</span>
                </div>
                <div class="highlight-sub">E-Commerce Catalog, Cart Counters & WhatsApp Checkout</div>
              </div>
            </div>

            <div class="highlight-item">
              <span class="highlight-icon">📅</span>
              <div class="highlight-info">
                <div class="highlight-title">
                  <span>Book Appointment</span>
                  <span class="package-tab-tag active" style="font-size: 0.62rem; padding: 1px 6px;">ADMIN GRANTED</span>
                </div>
                <div class="highlight-sub">Interactive Calendar Date & Time-Slot Booking</div>
              </div>
            </div>

            <div class="highlight-item">
              <span class="highlight-icon">★</span>
              <div class="highlight-info">
                <div class="highlight-title">
                  <span>Customer Reviews</span>
                  <span class="package-tab-tag active" style="font-size: 0.62rem; padding: 1px 6px;">ADMIN GRANTED</span>
                </div>
                <div class="highlight-sub">5-Star Client Ratings, Feedback Tags & WhatsApp Review</div>
              </div>
            </div>

            <div class="highlight-item">
              <span class="highlight-icon">📱</span>
              <div class="highlight-info">
                <div class="highlight-title">
                  <span>1-Tap PWA App</span>
                  <span class="pill-status-active" style="font-size: 0.62rem; padding: 1px 6px;">INCLUDED</span>
                </div>
                <div class="highlight-sub">Install to iPhone & Android Home Screen + Offline Access</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Package Types in Compact List (No Long Descriptions) -->
        <div style="margin-bottom: 20px;">
          <div style="margin-bottom: 12px;">
            <div class="minimal-section-title">
              <span>💳</span>
              <span>Available Packages</span>
            </div>
            <div class="minimal-section-desc">
              Choose your plan. Activate instantly via WhatsApp:
            </div>
          </div>

          <div class="package-list-container">
            ${plans.map((plan, idx) => {
              const isDemo = plan.id === "plan-demo";
              const isFree = Number(plan.price) === 0;
              const isPopular = idx === 1 || plan.id === "growth" || plan.id === "pro-30";
              const priceDisplay = isFree ? "FREE" : `${currency}${Number(plan.price).toLocaleString()}`;

              // Direct WhatsApp request link for this plan
              const planMsg = encodeURIComponent(
                `Hello Admin! I would like to opt for the *${plan.name}* package (${isFree ? 'FREE TRIAL' : `${priceDisplay} / ${plan.durationDays} Days`}) on ${settings.platformName || "OmniCard OS"}. Please set up my smart vCard!`
              );
              const planWaUrl = `https://wa.me/${cleanWa}?text=${planMsg}`;

              return `
                <div class="package-list-item compact ${isPopular || isDemo ? 'featured' : ''}">
                  <div class="package-list-header">
                    <div class="package-list-name-col">
                      <div class="package-list-name">
                        <span>${plan.name}</span>
                        ${isDemo ? `<span class="pill-status-active" style="font-size: 0.65rem;">🎁 FREE TRIAL</span>` : ""}
                        ${isPopular && !isDemo ? `<span class="pill-status-active" style="font-size: 0.65rem; background: rgba(0,229,255,0.15); color: #00E5FF; border-color: rgba(0,229,255,0.4);">POPULAR</span>` : ""}
                      </div>
                    </div>

                    <div class="package-list-price-col">
                      <div class="package-list-price">${priceDisplay}</div>
                      <div style="font-size: 0.72rem; color: var(--theme-text-muted, #94A3B8);">${plan.durationDays} Days</div>
                    </div>
                  </div>

                  <!-- Compact Granted Feature Tags -->
                  <div class="package-list-badges-row">
                    <span class="package-tab-tag active">✓ 🏠 Home</span>
                    <span class="package-tab-tag ${plan.features?.quoteBuilder !== false ? 'active' : ''}">
                      ${plan.features?.quoteBuilder !== false ? '✓' : '✗'} 📋 Services
                    </span>
                    <span class="package-tab-tag ${plan.features?.ecommerceShop !== false ? 'active' : ''}">
                      ${plan.features?.ecommerceShop !== false ? '✓' : '✗'} 🛍️ Shop
                    </span>
                    <span class="package-tab-tag ${plan.features?.calendarBooking !== false ? 'active' : ''}">
                      ${plan.features?.calendarBooking !== false ? '✓' : '✗'} 📅 Book
                    </span>
                    <span class="package-tab-tag ${plan.features?.customerReviews !== false ? 'active' : ''}">
                      ${plan.features?.customerReviews !== false ? '✓' : '✗'} ★ Reviews
                    </span>
                    <span class="package-tab-tag ${plan.features?.pwaInstall !== false ? 'active' : ''}">
                      ${plan.features?.pwaInstall !== false ? '✓' : '✗'} 📱 PWA
                    </span>
                  </div>

                  <!-- 1-Click WhatsApp Opt Action -->
                  <div class="package-list-actions compact">
                    <div style="font-size: 0.74rem; color: var(--theme-text-muted);">
                      ${isFree ? 'Zero payment required' : 'Instant activation by Admin'}
                    </div>
                    <a href="${planWaUrl}" target="_blank" rel="noopener noreferrer" class="package-list-opt-btn">
                      <span>${isDemo ? '🎁 Opt Demo' : `⚡ Opt on WhatsApp`}</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <!-- 4. More questions? Chat to Admin on WhatsApp for more details -->
        <div class="admin-whatsapp-contact-banner">
          <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 240px;">
            <div style="font-size: 2.2rem; flex-shrink: 0;">💬</div>
            <div>
              <div style="font-size: 1rem; font-weight: 800; color: #FFFFFF; margin-bottom: 2px;">
                Have More Questions?
              </div>
              <div style="font-size: 0.78rem; color: var(--theme-text-muted, #94A3B8); line-height: 1.4;">
                Chat to Admin on WhatsApp for more details, custom features, or instant activation.
              </div>
            </div>
          </div>
          <a href="${generalWaUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-submit" style="width: auto; padding: 12px 24px; font-size: 0.9rem; flex-shrink: 0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <span>Chat to Admin on WhatsApp →</span>
          </a>
        </div>

        <!-- 4. Prominent Super Admin Login Card -->
        <div class="admin-login-banner-card">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🛡️</div>
          <h2 style="font-size: 1.25rem; font-weight: 800; color: #FFFFFF; margin-bottom: 6px;">
            Super Admin Portal
          </h2>
          <p style="font-size: 0.82rem; color: var(--theme-text-muted, #94A3B8); max-width: 440px; margin: 0 auto 16px; line-height: 1.45;">
            Master administrative console to register new business vCards, grant or revoke tabs (Services, Shop, Bookings), and manage subscription plans.
          </p>
          <a href="?view=admin" class="btn-submit-primary" style="max-width: 280px; margin: 0 auto; text-decoration: none; padding: 12px 24px; font-size: 0.92rem;">
            <span>🛡️ Open Super Admin Login</span>
            <span>→</span>
          </a>
        </div>

        <!-- 5. Quick Demo vCards -->
        <div style="margin-top: 24px; text-align: center;">
          <div style="font-size: 0.76rem; color: var(--theme-text-muted); margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            Test Live Demo vCards:
          </div>
          <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
            ${vendors.map(v => `
              <a href="?v=${v.slug || v.id}" class="btn-pill" style="text-decoration: none; font-size: 0.78rem; padding: 5px 12px;">
                <span>${v.branding.avatarEmoji || '🏢'}</span>
                <span>${v.branding.businessName}</span>
                <span>↗</span>
              </a>
            `).join("")}
          </div>
        </div>

      </div>
    `;
  }

  bindEvents() {
    // Smooth scrolling for in-page anchors
    this.container.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute("href").substring(1);
        const targetEl = this.container.querySelector(`#${targetId}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }
}
