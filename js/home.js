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

        <!-- 2. List of Features Granted for vCard -->
        <div class="minimal-features-card">
          <div class="minimal-section-title">
            <span>✨</span>
            <span>Features Granted for Business vCards</span>
          </div>
          <div class="minimal-section-desc">
            Each digital business card is modular. Core profile is default, and specific business tabs are granted and managed by the Admin:
          </div>

          <div class="minimal-features-list">
            <!-- Feature 1: Home Profile -->
            <div class="minimal-feature-row">
              <div class="minimal-feature-icon">🏠</div>
              <div style="flex: 1;">
                <div class="minimal-feature-name">
                  <span>Home Profile</span>
                  <span class="pill-status-active" style="font-size: 0.65rem; padding: 2px 7px;">DEFAULT</span>
                </div>
                <div class="minimal-feature-detail">
                  Complete digital branding, verified badge, operating hours, direct phone calling, email launcher, turn-by-turn Google Maps GPS route, and 1-tap save contact (.vcf) to smartphone phonebook.
                </div>
              </div>
            </div>

            <!-- Feature 2: Services & Quote Builder -->
            <div class="minimal-feature-row">
              <div class="minimal-feature-icon">📋</div>
              <div style="flex: 1;">
                <div class="minimal-feature-name">
                  <span>Services & Quote Builder</span>
                  <span class="btn-pill" style="font-size: 0.65rem; padding: 2px 7px; color: var(--theme-primary);">ADMIN GRANTED</span>
                </div>
                <div class="minimal-feature-detail">
                  Interactive service catalog with categories. Clients check services and submit a customized quotation request directly to vendor WhatsApp. Includes live sticky preview bar.
                </div>
              </div>
            </div>

            <!-- Feature 3: Shop & E-Commerce Cart -->
            <div class="minimal-feature-row">
              <div class="minimal-feature-icon">🛍️</div>
              <div style="flex: 1;">
                <div class="minimal-feature-name">
                  <span>E-Commerce Product Shop & Cart</span>
                  <span class="btn-pill" style="font-size: 0.65rem; padding: 2px 7px; color: #10B981;">ADMIN GRANTED</span>
                </div>
                <div class="minimal-feature-detail">
                  Showcase products with categories, units, and prices. Includes real-time quantity counters, sticky cart preview bar, and 1-click itemized WhatsApp order checkout.
                </div>
              </div>
            </div>

            <!-- Feature 4: Book Appointment -->
            <div class="minimal-feature-row">
              <div class="minimal-feature-icon">📅</div>
              <div style="flex: 1;">
                <div class="minimal-feature-name">
                  <span>Book Appointment & Slots</span>
                  <span class="btn-pill" style="font-size: 0.65rem; padding: 2px 7px; color: #00E5FF;">ADMIN GRANTED</span>
                </div>
                <div class="minimal-feature-detail">
                  Interactive calendar date picker, matching color time-slot selection (morning, afternoon, evening), and automated WhatsApp booking notification.
                </div>
              </div>
            </div>

            <!-- Feature 5: Customer Reviews -->
            <div class="minimal-feature-row">
              <div class="minimal-feature-icon">★</div>
              <div style="flex: 1;">
                <div class="minimal-feature-name">
                  <span>5-Star Customer Reviews</span>
                  <span class="btn-pill" style="font-size: 0.65rem; padding: 2px 7px; color: #F59E0B;">ADMIN GRANTED</span>
                </div>
                <div class="minimal-feature-detail">
                  Public star ratings, verified client compliments, and direct WhatsApp review submission so business owners receive instant client feedback.
                </div>
              </div>
            </div>

            <!-- Feature 6: PWA & Offline Support -->
            <div class="minimal-feature-row">
              <div class="minimal-feature-icon">📱</div>
              <div style="flex: 1;">
                <div class="minimal-feature-name">
                  <span>PWA Offline App Installation</span>
                  <span class="pill-status-active" style="font-size: 0.65rem; padding: 2px 7px;">INCLUDED</span>
                </div>
                <div class="minimal-feature-detail">
                  Installable directly onto client home screens without App Store or Play Store downloads. Works smoothly offline with instant sub-second loading.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Package Types in LIST TYPE (Not Grid) -->
        <div style="margin-bottom: 24px;">
          <div style="margin-bottom: 12px;">
            <div class="minimal-section-title">
              <span>💳</span>
              <span>Available Subscription Packages</span>
            </div>
            <div class="minimal-section-desc">
              Choose a package suited for your business. Select any plan to activate instantly via WhatsApp:
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
                <div class="package-list-item ${isPopular || isDemo ? 'featured' : ''}">
                  <div class="package-list-header">
                    <div class="package-list-name-col">
                      <div class="package-list-name">
                        <span>${plan.name}</span>
                        ${isDemo ? `<span class="pill-status-active" style="font-size: 0.65rem;">🎁 FREE TRIAL</span>` : ""}
                        ${isPopular && !isDemo ? `<span class="pill-status-active" style="font-size: 0.65rem; background: rgba(0,229,255,0.15); color: #00E5FF; border-color: rgba(0,229,255,0.4);">POPULAR</span>` : ""}
                      </div>
                      <div style="font-size: 0.78rem; color: var(--theme-text-muted, #94A3B8); margin-top: 3px; line-height: 1.4;">
                        ${plan.description}
                      </div>
                    </div>

                    <div class="package-list-price-col">
                      <div class="package-list-price">${priceDisplay}</div>
                      <div style="font-size: 0.72rem; color: var(--theme-text-muted, #94A3B8);">${plan.durationDays} Days Validity</div>
                    </div>
                  </div>

                  <!-- Granted Tabs / Features in this package -->
                  <div class="package-list-badges-row">
                    <span class="package-tab-tag active">✓ 🏠 Home (Default)</span>
                    <span class="package-tab-tag ${plan.features?.quoteBuilder !== false ? 'active' : ''}">
                      ${plan.features?.quoteBuilder !== false ? '✓' : '✗'} 📋 Services
                    </span>
                    <span class="package-tab-tag ${plan.features?.ecommerceShop !== false ? 'active' : ''}">
                      ${plan.features?.ecommerceShop !== false ? '✓' : '✗'} 🛍️ Shop
                    </span>
                    <span class="package-tab-tag ${plan.features?.calendarBooking !== false ? 'active' : ''}">
                      ${plan.features?.calendarBooking !== false ? '✓' : '✗'} 📅 Book Appointment
                    </span>
                    <span class="package-tab-tag ${plan.features?.customerReviews !== false ? 'active' : ''}">
                      ${plan.features?.customerReviews !== false ? '✓' : '✗'} ★ Reviews
                    </span>
                    <span class="package-tab-tag ${plan.features?.pwaInstall !== false ? 'active' : ''}">
                      ${plan.features?.pwaInstall !== false ? '✓' : '✗'} 📱 PWA App
                    </span>
                  </div>

                  <!-- 1-Click WhatsApp Opt Action -->
                  <div class="package-list-actions">
                    <div style="font-size: 0.74rem; color: var(--theme-text-muted);">
                      ${isFree ? 'Zero payment required • Test all features immediately' : 'Instant WhatsApp activation by Admin'}
                    </div>
                    <a href="${planWaUrl}" target="_blank" rel="noopener noreferrer" class="package-list-opt-btn">
                      <span>${isDemo ? '🎁 Opt 3-Day Demo on WhatsApp' : `⚡ Opt for ${plan.name} on WhatsApp`}</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
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
