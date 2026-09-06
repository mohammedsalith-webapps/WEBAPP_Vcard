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

    // Pre-calculated WhatsApp message for general inquiry
    const generalInquiryText = encodeURIComponent(
      `Hello Admin! I am interested in getting an interactive Smart Business vCard for my business on ${settings.platformName || "OmniCard OS"}. Please guide me on the packages and setup.`
    );
    const generalWaUrl = `https://wa.me/${cleanWa}?text=${generalInquiryText}`;

    // Demo plan quick WhatsApp link
    const demoPlan = plans.find(p => p.id === "plan-demo");
    const demoDays = demoPlan ? demoPlan.durationDays : 3;
    const demoInquiryText = encodeURIComponent(
      `Hello Admin! I want to claim the *3-Day Free Demo Package* (FREE) for my business on ${settings.platformName || "OmniCard OS"}. Please create my demo card so I can test all features!`
    );
    const demoWaUrl = `https://wa.me/${cleanWa}?text=${demoInquiryText}`;

    this.container.innerHTML = `
      <div class="portal-container" style="max-width: 1140px; padding: 24px 16px 80px;">

        <!-- 1. Hero Section -->
        <div class="bento-card" style="padding: 36px 28px; margin-bottom: 24px; position: relative; overflow: hidden; background: radial-gradient(circle at top right, rgba(212,255,0,0.06), transparent 60%), #0F131C; border-color: rgba(212,255,0,0.25);">
          <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(212,255,0,0.1); border: 1px solid rgba(212,255,0,0.3); border-radius: 999px; padding: 4px 12px; margin-bottom: 16px;">
            <span style="font-size: 0.8rem;">⚡</span>
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--theme-primary); text-transform: uppercase; letter-spacing: 0.05em;">Smart Business vCard & SaaS OS</span>
          </div>

          <h1 style="font-size: 2.2rem; font-weight: 800; line-height: 1.2; color: #FFFFFF; margin-bottom: 14px; max-width: 820px;">
            Supercharge Your Business With An Interactive Smart vCard
          </h1>

          <p style="font-size: 1rem; line-height: 1.6; color: var(--theme-text-muted); margin-bottom: 24px; max-width: 760px;">
            Upgrade from flat paper cards to a high-converting digital storefront built directly for WhatsApp. Showcase services, take product orders, schedule calendar bookings, and collect 5-star reviews — all in a sleek, offline-capable PWA.
          </p>

          <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 28px;">
            <a href="${demoWaUrl}" target="_blank" rel="noopener noreferrer" class="btn-submit-primary" style="padding: 12px 24px; font-size: 0.92rem; text-decoration: none; width: auto;">
              <span>🎁 Claim ${demoDays}-Day Free Demo on WhatsApp</span>
              <span>↗</span>
            </a>
            <a href="#section-pricing" class="btn-pill active" style="padding: 12px 20px; font-size: 0.92rem; text-decoration: none;">
              <span>💎 View All Packages & Prices</span>
              <span>↓</span>
            </a>
            <a href="#section-demos" class="btn-pill" style="padding: 12px 20px; font-size: 0.92rem; text-decoration: none;">
              <span>👀 Test Live Demo Cards</span>
            </a>
          </div>

          <!-- Quick Trust Badges -->
          <div style="display: flex; flex-wrap: wrap; gap: 16px; border-top: 1px solid var(--theme-border); padding-top: 20px; font-size: 0.78rem; color: #E2E8F0;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: var(--theme-primary);">✓</span> Zero App Store Download Required
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: var(--theme-primary);">✓</span> 1-Click WhatsApp Ordering & Checkout
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: var(--theme-primary);">✓</span> 1-Tap Save Contact to Phonebook (.vcf)
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: var(--theme-primary);">✓</span> Secure Vendor Console (Long-Press Access)
            </div>
          </div>
        </div>

        <!-- 2. Features Grid: Everything included in this vCard -->
        <div style="margin-bottom: 36px;">
          <div style="margin-bottom: 18px;">
            <h2 style="font-size: 1.4rem; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
              ✨ Complete Operating Suite Built Into Every vCard
            </h2>
            <p style="font-size: 0.85rem; color: var(--theme-text-muted);">
              All the tools your business needs to turn card viewers into paying customers on WhatsApp.
            </p>
          </div>

          <div class="bento-grid bento-grid-3">
            <!-- Feature 1: E-Commerce Store -->
            <div class="bento-card">
              <div style="font-size: 1.8rem; margin-bottom: 10px;">🛍️</div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: #FFF; margin-bottom: 6px;">
                WhatsApp E-Commerce Store
              </h3>
              <p style="font-size: 0.82rem; color: var(--theme-text-muted); line-height: 1.5; margin-bottom: 10px;">
                Display physical or digital products with photos, prices, unit tags, and quantities. Customers add to cart and dispatch orders directly to your WhatsApp with auto-calculated totals.
              </p>
              <span class="pill-status-active" style="font-size: 0.65rem;">Direct WhatsApp Checkout</span>
            </div>

            <!-- Feature 2: Service Quote Builder -->
            <div class="bento-card">
              <div style="font-size: 1.8rem; margin-bottom: 10px;">📋</div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: #FFF; margin-bottom: 6px;">
                Request-to-Quote Service Builder
              </h3>
              <p style="font-size: 0.82rem; color: var(--theme-text-muted); line-height: 1.5; margin-bottom: 10px;">
                Clients select one or multiple services from your catalog to request an itemized quotation. Vendors quote custom pricing tailored to each client's scope, requirements, and volume directly on WhatsApp.
              </p>
              <span class="pill-status-active" style="font-size: 0.65rem;">Custom Quotation on Demand</span>
            </div>

            <!-- Feature 3: Calendar Booking -->
            <div class="bento-card">
              <div style="font-size: 1.8rem; margin-bottom: 10px;">📅</div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: #FFF; margin-bottom: 6px;">
                Slot & Appointment Booking
              </h3>
              <p style="font-size: 0.82rem; color: var(--theme-text-muted); line-height: 1.5; margin-bottom: 10px;">
                Allow customers to choose booking dates, time slots (morning, afternoon, evening), and appointment consultation types without endless phone tag.
              </p>
              <span class="pill-status-active" style="font-size: 0.65rem;">Direct Slot Booking</span>
            </div>

            <!-- Feature 4: Customer Reviews -->
            <div class="bento-card">
              <div style="font-size: 1.8rem; margin-bottom: 10px;">★</div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: #FFF; margin-bottom: 6px;">
                Social Proof & 5-Star Reviews
              </h3>
              <p style="font-size: 0.82rem; color: var(--theme-text-muted); line-height: 1.5; margin-bottom: 10px;">
                Showcase genuine customer reviews, average star scores, and verified buyer badges right on your card to establish immediate trust with new leads.
              </p>
              <span class="pill-status-active" style="font-size: 0.65rem;">Verified Feedback</span>
            </div>

            <!-- Feature 5: 1-Tap Contact Saving -->
            <div class="bento-card">
              <div style="font-size: 1.8rem; margin-bottom: 10px;">📲</div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: #FFF; margin-bottom: 6px;">
                1-Tap Save Contact (.vcf)
              </h3>
              <p style="font-size: 0.82rem; color: var(--theme-text-muted); line-height: 1.5; margin-bottom: 10px;">
                Never lose a connection. Customers download your complete business contact profile (.vcf file) into their Apple or Android phonebook with a single tap.
              </p>
              <span class="pill-status-active" style="font-size: 0.65rem;">Instant Phonebook Sync</span>
            </div>

            <!-- Feature 6: Long-Press Security Backoffice -->
            <div class="bento-card">
              <div style="font-size: 1.8rem; margin-bottom: 10px;">🔒</div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: #FFF; margin-bottom: 6px;">
                Hidden Long-Press Login
              </h3>
              <p style="font-size: 0.82rem; color: var(--theme-text-muted); line-height: 1.5; margin-bottom: 10px;">
                Customers never see any login buttons. You access your vendor management portal by pressing and holding (1.5s) your card logo with an Admin-assigned password.
              </p>
              <span class="pill-status-active" style="font-size: 0.65rem;">Tamper-Proof Privacy</span>
            </div>

            <!-- Feature 7: PWA Offline App -->
            <div class="bento-card">
              <div style="font-size: 1.8rem; margin-bottom: 10px;">📱</div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: #FFF; margin-bottom: 6px;">
                Installable Progressive Web App
              </h3>
              <p style="font-size: 0.82rem; color: var(--theme-text-muted); line-height: 1.5; margin-bottom: 10px;">
                Clients can add your digital card to their smartphone home screen with an app icon. Works seamlessly offline and loads in under 1 second.
              </p>
              <span class="pill-status-active" style="font-size: 0.65rem;">Native App Feel</span>
            </div>

            <!-- Feature 8: Promo Coupons & Announcements -->
            <div class="bento-card">
              <div style="font-size: 1.8rem; margin-bottom: 10px;">🏷️</div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: #FFF; margin-bottom: 6px;">
                Promo Coupons & Marquee
              </h3>
              <p style="font-size: 0.82rem; color: var(--theme-text-muted); line-height: 1.5; margin-bottom: 10px;">
                Broadcast ticker announcements across the top of your card and feature promotional discount badges (e.g. 15% OFF) with 1-click copy coupon codes.
              </p>
              <span class="pill-status-active" style="font-size: 0.65rem;">High-Conversion Offers</span>
            </div>

            <!-- Feature 9: Directions & Coordinates -->
            <div class="bento-card">
              <div style="font-size: 1.8rem; margin-bottom: 10px;">📍</div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: #FFF; margin-bottom: 6px;">
                GPS Directions & Calling
              </h3>
              <p style="font-size: 0.82rem; color: var(--theme-text-muted); line-height: 1.5; margin-bottom: 10px;">
                1-tap direct calling, email launcher, operating hours display, and turnkey Google Maps GPS route navigation right to your shop or office doorstep.
              </p>
              <span class="pill-status-active" style="font-size: 0.65rem;">Turn-by-Turn GPS</span>
            </div>
          </div>
        </div>

        <!-- 3. Live Demo Cards Section -->
        <div id="section-demos" style="margin-bottom: 36px;">
          <div style="margin-bottom: 18px;">
            <h2 style="font-size: 1.4rem; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
              👀 Test Drive Real Live vCard Showcases
            </h2>
            <p style="font-size: 0.85rem; color: var(--theme-text-muted);">
              Experience the actual interactive cards active on the platform. Try adding products to cart, building quotes, and testing the tabs.
            </p>
          </div>

          <div class="bento-grid bento-grid-3">
            ${vendors.map(v => `
              <div class="bento-card" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <span style="font-size: 2.2rem;">${v.branding.avatarEmoji || '🏢'}</span>
                    <span class="btn-pill" style="font-size: 0.68rem; padding: 2px 8px; color: var(--theme-primary);">${v.branding.category}</span>
                  </div>
                  <h3 style="font-size: 1.1rem; color: #FFF; margin-bottom: 4px;">${v.branding.businessName}</h3>
                  <div style="font-size: 0.78rem; color: var(--theme-secondary); margin-bottom: 8px;">By ${v.branding.ownerName}</div>
                  <p style="font-size: 0.8rem; color: var(--theme-text-muted); line-height: 1.4; margin-bottom: 14px;">
                    ${v.branding.tagline || v.about?.description?.substring(0, 80) + '...'}
                  </p>
                  <div style="font-size: 0.75rem; color: #FFF; margin-bottom: 14px;">
                    <div>🛍️ Products: <b>${v.products?.length || 0} items</b></div>
                    <div>📋 Services: <b>${v.services?.length || 0} items</b></div>
                    <div>★ Reviews: <b>${v.reviews?.length || 0} reviews</b></div>
                  </div>
                </div>

                <a href="?v=${v.slug || v.id}" class="btn-pill active" style="text-align: center; text-decoration: none; padding: 10px; font-weight: 700; font-size: 0.82rem; display: block;">
                  <span>Open Live Demo vCard</span>
                  <span>↗</span>
                </a>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- 4. Subscription Packages & Pricing Section -->
        <div id="section-pricing" style="margin-bottom: 36px;">
          <div style="margin-bottom: 18px;">
            <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.3); border-radius: 999px; padding: 3px 10px; margin-bottom: 8px;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--theme-secondary); text-transform: uppercase;">Transparent Pricing</span>
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
              💎 Choose Your Business Package
            </h2>
            <p style="font-size: 0.85rem; color: var(--theme-text-muted);">
              All packages include full platform capabilities. Select a package and opt directly through WhatsApp with 1 click.
            </p>
          </div>

          <div class="bento-grid bento-grid-3">
            ${plans.map(plan => {
              const isDemo = plan.id === "plan-demo";
              const isFree = Number(plan.price) === 0;
              const priceDisplay = isFree ? "FREE" : `${currency}${Number(plan.price).toLocaleString()}`;
              
              // Direct WhatsApp ordering URL for this specific plan
              const planMsg = encodeURIComponent(
                `Hello Admin! I would like to get a Smart Business vCard for my business. I want to opt for the *${plan.name}* package (${isFree ? 'FREE TRIAL' : `${priceDisplay} / ${plan.durationDays} Days`}). Please set up my card!`
              );
              const planWaUrl = `https://wa.me/${cleanWa}?text=${planMsg}`;

              return `
                <div class="bento-card" style="display: flex; flex-direction: column; justify-content: space-between; ${isDemo ? 'border-color: rgba(212,255,0,0.45); background: rgba(212,255,0,0.025);' : ''}">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                      <div>
                        <h3 style="font-size: 1.15rem; font-weight: 700; color: #FFFFFF;">${plan.name}</h3>
                        ${isDemo ? `
                          <span class="pill-status-active" style="font-size: 0.65rem; background: rgba(212,255,0,0.15); color: var(--theme-primary); border-color: rgba(212,255,0,0.4); margin-top: 4px; display: inline-block;">
                            🎁 FREE TRIAL NO PAYMENT
                          </span>
                        ` : ''}
                      </div>
                      <span class="btn-pill" style="font-size: 0.72rem; padding: 3px 10px; color: var(--theme-primary);">
                        ${plan.durationDays} Days
                      </span>
                    </div>

                    <div style="margin-bottom: 12px;">
                      <div style="font-size: 2.2rem; font-weight: 800; color: ${isDemo ? 'var(--theme-primary)' : '#FFFFFF'};">
                        ${priceDisplay}
                      </div>
                      <div style="font-size: 0.72rem; color: var(--theme-text-muted);">
                        ${isFree ? '100% Free Trial • No Credit Card Required' : `Valid for ${plan.durationDays} days of service`}
                      </div>
                    </div>

                    <p style="font-size: 0.82rem; color: var(--theme-text-muted); line-height: 1.45; margin-bottom: 18px;">
                      ${plan.description}
                    </p>

                    <div style="border-top: 1px solid var(--theme-border); padding-top: 14px; margin-bottom: 20px; font-size: 0.78rem; color: #FFFFFF;">
                      <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--theme-text-muted); margin-bottom: 8px;">
                        Package Inclusions:
                      </div>
                      <div style="padding: 3px 0; display: flex; align-items: center; gap: 6px;">
                        <span style="color: ${plan.features?.quoteBuilder !== false ? '#10B981' : '#EF4444'};">
                          ${plan.features?.quoteBuilder !== false ? '✓' : '✗'}
                        </span>
                        <span>Interactive Service Quote Builder</span>
                      </div>
                      <div style="padding: 3px 0; display: flex; align-items: center; gap: 6px;">
                        <span style="color: ${plan.features?.ecommerceShop !== false ? '#10B981' : '#EF4444'};">
                          ${plan.features?.ecommerceShop !== false ? '✓' : '✗'}
                        </span>
                        <span>WhatsApp E-Commerce Product Shop</span>
                      </div>
                      <div style="padding: 3px 0; display: flex; align-items: center; gap: 6px;">
                        <span style="color: ${plan.features?.calendarBooking !== false ? '#10B981' : '#EF4444'};">
                          ${plan.features?.calendarBooking !== false ? '✓' : '✗'}
                        </span>
                        <span>Direct Calendar Slot Booking</span>
                      </div>
                      <div style="padding: 3px 0; display: flex; align-items: center; gap: 6px;">
                        <span style="color: ${plan.features?.customerReviews !== false ? '#10B981' : '#EF4444'};">
                          ${plan.features?.customerReviews !== false ? '✓' : '✗'}
                        </span>
                        <span>Customer Reviews & Ratings System</span>
                      </div>
                      <div style="padding: 3px 0; display: flex; align-items: center; gap: 6px;">
                        <span style="color: ${plan.features?.promoBanner !== false ? '#10B981' : '#EF4444'};">
                          ${plan.features?.promoBanner !== false ? '✓' : '✗'}
                        </span>
                        <span>Announcement Marquee & Promo Banner</span>
                      </div>
                      <div style="padding: 3px 0; display: flex; align-items: center; gap: 6px;">
                        <span style="color: ${plan.features?.pwaInstall !== false ? '#10B981' : '#EF4444'};">
                          ${plan.features?.pwaInstall !== false ? '✓' : '✗'}
                        </span>
                        <span>PWA Installable App & Offline Mode</span>
                      </div>
                    </div>
                  </div>

                  <!-- 1-Click WhatsApp Request Action Button -->
                  <a href="${planWaUrl}" target="_blank" rel="noopener noreferrer" class="${isDemo ? 'btn-submit-primary' : 'btn-pill active'}" style="text-align: center; text-decoration: none; padding: 12px; font-weight: 700; font-size: 0.85rem; display: flex; justify-content: center; align-items: center; gap: 6px;">
                    <span>${isDemo ? '🎁 Opt 3-Day Demo on WhatsApp' : `⚡ Opt for ${plan.name} on WhatsApp`}</span>
                    <span>↗</span>
                  </a>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <!-- 5. 1-Click Admin WhatsApp Support Banner -->
        <div class="bento-card" style="padding: 28px; margin-bottom: 30px; text-align: center; border-color: rgba(16,185,129,0.3); background: radial-gradient(circle at center, rgba(16,185,129,0.06), transparent 70%), #0F131C;">
          <div style="font-size: 2.2rem; margin-bottom: 10px;">💬</div>
          <h2 style="font-size: 1.3rem; font-weight: 700; color: #FFF; margin-bottom: 6px;">
            Have Questions or Need a Custom Business Card Solution?
          </h2>
          <p style="font-size: 0.85rem; color: var(--theme-text-muted); max-width: 600px; margin: 0 auto 18px; line-height: 1.5;">
            Chat directly with our platform team on WhatsApp. We will help you select the ideal package, configure your services and products, and launch your vCard in minutes.
          </p>
          <a href="${generalWaUrl}" target="_blank" rel="noopener noreferrer" class="btn-submit-primary" style="display: inline-flex; width: auto; padding: 12px 28px; text-decoration: none; background: #10B981; border-color: #10B981; color: #000; font-weight: 700;">
            <span>💬 Chat Directly with Admin on WhatsApp (${rawWa})</span>
            <span>↗</span>
          </a>
        </div>

        <!-- 6. Footer / Portal Access -->
        <div style="border-top: 1px solid var(--theme-border); padding-top: 24px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; font-size: 0.8rem; color: var(--theme-text-muted);">
          <div>
            <b>${settings.platformName || "OmniCard OS"}</b> • The Modern Digital Business Card & Operating System
          </div>
          <div style="display: flex; gap: 12px; align-items: center;">
            <span>Are you a registered business?</span>
            <a href="?v=elite-catering" class="btn-pill" style="font-size: 0.72rem; padding: 4px 10px; text-decoration: none;">
              Open Card & Hold Logo to Login
            </a>
            <a href="?view=admin" class="btn-pill" style="font-size: 0.72rem; padding: 4px 10px; text-decoration: none; color: var(--theme-primary);">
              🛡️ Super Admin Portal
            </a>
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
