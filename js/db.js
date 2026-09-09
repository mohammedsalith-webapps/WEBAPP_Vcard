// Database Abstraction Layer with Firebase Realtime Database & LocalStorage Dual Sync
import { INITIAL_DATA } from "./seedData.js";

const STORAGE_KEY = "OMNICARD_SYSTEM_DATA_2026";
const PENDING_SYNC_KEY = "OMNICARD_PENDING_SYNC";

class DatabaseService {
  constructor() {
    this.data = null;
    this.firebaseApp = null;
    this.firebaseDb = null;
    this.isFirebaseReady = false;
    this.isFirebaseConnected = false;
    this.isFreshSeed = false;
    this.isSyncing = false;
    this.listeners = [];
  }

  // Initialize DB: Load from LocalStorage or seed with INITIAL_DATA
  async init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.isFreshSeed = false;
        this.data = JSON.parse(stored);
      } else {
        this.isFreshSeed = true;
        this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
        this.saveLocal({ touchUpdatedAt: false });
      }
    } catch (err) {
      console.warn("Error reading localStorage, initializing seed data:", err);
      this.isFreshSeed = true;
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
      this.saveLocal({ touchUpdatedAt: false });
    }

    // Ensure Firebase cloud config from INITIAL_DATA is adopted if missing
    const initFbConf = INITIAL_DATA.platformSettings?.firebaseConfig;
    if (initFbConf && initFbConf.apiKey) {
      if (!this.data.platformSettings) this.data.platformSettings = {};
      const curFb = this.data.platformSettings.firebaseConfig;
      if (!curFb || (!curFb.apiKey && !curFb.disabled)) {
        this.data.platformSettings.firebaseConfig = { ...initFbConf };
        this.saveLocal({ touchUpdatedAt: false });
      }
    }

    // Ensure platformSettings has adminUpi and supportWhatsApp
    if (this.data) {
      if (!this.data.platformSettings) this.data.platformSettings = {};
      let settingsMigrated = false;
      if (!this.data.platformSettings.adminUpi) {
        this.data.platformSettings.adminUpi = INITIAL_DATA.platformSettings?.adminUpi || "7019601569@ybl";
        settingsMigrated = true;
      }
      if (!this.data.platformSettings.supportWhatsApp) {
        this.data.platformSettings.supportWhatsApp = INITIAL_DATA.platformSettings?.supportWhatsApp || "+917019601569";
        settingsMigrated = true;
      }
      if (settingsMigrated) {
        this.saveLocal({ touchUpdatedAt: false });
      }
    }

    // Ensure 3-Day Free Demo plan exists even for existing local storage data
    if (this.data && Array.isArray(this.data.subscriptionPlans)) {
      if (!this.data.subscriptionPlans.some(p => p.id === "plan-demo")) {
        const demoPlan = (INITIAL_DATA.subscriptionPlans && INITIAL_DATA.subscriptionPlans.find(p => p.id === "plan-demo")) || {
          id: "plan-demo",
          name: "3-Day Free Demo",
          price: 0,
          durationDays: 3,
          description: "Complimentary 3-day full-access trial for new vendors to experience the digital vCard system.",
          features: {
            quoteBuilder: true,
            ecommerceShop: true,
            calendarBooking: true,
            customerReviews: true,
            promoBanner: true,
            pwaInstall: true,
            leadForm: true
          }
        };
        this.data.subscriptionPlans.unshift(demoPlan);
        this.saveLocal({ touchUpdatedAt: false });
      }
    }

    // Ensure services across all vendors have no prices (Quote on Request system)
    if (this.data && Array.isArray(this.data.vendors)) {
      let cleaned = false;
      this.data.vendors.forEach(v => {
        if (Array.isArray(v.services)) {
          v.services.forEach(s => {
            if (s.price !== undefined) {
              delete s.price;
              cleaned = true;
            }
          });
        }
        if (Array.isArray(v.products)) {
          // If demo vendor, sync default categories
          const initV = INITIAL_DATA.vendors && INITIAL_DATA.vendors.find(iv => iv.id === v.id);
          v.products.forEach(p => {
            if (!p.category) {
              const initP = initV && initV.products && initV.products.find(ip => ip.id === p.id);
              p.category = (initP && initP.category) || "General Products";
              cleaned = true;
            }
          });
        }
        // Ensure apex-medical has active expiry
        if ((v.id === "apex-medical" || v.slug === "apex-medical") && v.expiresAt && new Date(v.expiresAt) < new Date("2026-09-08")) {
          v.expiresAt = "2027-01-15T14:00:00.000Z";
          cleaned = true;
        }
      });
      if (cleaned) {
        this.saveLocal({ touchUpdatedAt: false });
      }
    }

    // Ensure leadForm feature and default settings exist across plans and vendors
    if (this.data && Array.isArray(this.data.subscriptionPlans)) {
      this.data.subscriptionPlans.forEach(p => {
        if (!p.features) p.features = {};
        if (p.features.leadForm === undefined) p.features.leadForm = true;
      });
    }
    if (this.data && Array.isArray(this.data.vendors)) {
      let leadUpdated = false;
      this.data.vendors.forEach(v => {
        if (!v.features) v.features = {};
        if (v.features.leadForm === undefined) {
          v.features.leadForm = true;
          leadUpdated = true;
        }
        if (!v.leadForm) {
          const initV = INITIAL_DATA.vendors && INITIAL_DATA.vendors.find(iv => iv.id === v.id);
          if (initV && initV.leadForm) {
            v.leadForm = JSON.parse(JSON.stringify(initV.leadForm));
          } else {
            v.leadForm = {
              enabled: true,
              title: "Request a Call Back",
              subtitle: "Fill this quick form and our team will get in touch with you right away.",
              buttonText: "Request Call Back",
              submitButtonText: "Request Call Back ⚡",
              buttonIcon: "⚡",
              fields: [
                { id: "fld-name", type: "text", label: "Full Name", placeholder: "Enter your full name", required: true, options: [] },
                { id: "fld-phone", type: "phone", label: "Phone / WhatsApp", placeholder: "Your 10-digit number", required: true, options: [] },
                { id: "fld-service", type: "select", label: "Service / Requirement", placeholder: "Select an option", required: false, options: ["General Inquiry", "Pricing & Quotation", "Support"] },
                { id: "fld-date", type: "date", label: "Preferred Date", placeholder: "Select date", required: false, options: [] },
                { id: "fld-notes", type: "textarea", label: "Message / Query", placeholder: "Tell us how we can help you...", required: false, options: [] }
              ]
            };
          }
          leadUpdated = true;
        }
        if (!Array.isArray(v.leads)) {
          const initV = INITIAL_DATA.vendors && INITIAL_DATA.vendors.find(iv => iv.id === v.id);
          v.leads = (initV && initV.leads) ? JSON.parse(JSON.stringify(initV.leads)) : [];
          leadUpdated = true;
        }
      });
      if (leadUpdated) {
        this.saveLocal({ touchUpdatedAt: false });
      }
    }

    // Ensure pwaInstall feature exists across all plans and vendors
    if (this.data && Array.isArray(this.data.subscriptionPlans)) {
      this.data.subscriptionPlans.forEach(p => {
        if (!p.features) p.features = {};
        if (p.features.pwaInstall === undefined) p.features.pwaInstall = true;
      });
    }
    if (this.data && Array.isArray(this.data.vendors)) {
      let pwaUpdated = false;
      this.data.vendors.forEach(v => {
        if (!v.features) v.features = {};
        if (v.features.pwaInstall === undefined) {
          v.features.pwaInstall = true;
          pwaUpdated = true;
        }
      });
      if (pwaUpdated) {
        this.saveLocal({ touchUpdatedAt: false });
      }
    }

    // Try initializing Firebase if config exists in settings
    await this.tryInitFirebase();

    return this.data;
  }

  saveLocal(options = {}) {
    try {
      const touch = options && options.touchUpdatedAt === true;
      if (touch && this.data) {
        this.data.updatedAt = Date.now();
        try {
          localStorage.setItem(PENDING_SYNC_KEY, "true");
        } catch (_) {}
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.notifyListeners();
    } catch (err) {
      console.error("Failed to save to localStorage:", err);
    }
  }

  notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.data);
      } catch (e) {
        console.error("Listener error:", e);
      }
    });
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== callback);
    };
  }

  // Firebase Realtime DB sync initialization with authoritative cloud resolution
  async tryInitFirebase() {
    const fbConf = this.data?.platformSettings?.firebaseConfig;
    if (!fbConf || !fbConf.apiKey || !fbConf.databaseURL || fbConf.disabled) {
      this.isFirebaseReady = false;
      this.isFirebaseConnected = false;
      return;
    }

    if (typeof window === "undefined" || !window.firebase) {
      console.warn("Firebase SDK not loaded, operating in LocalStorage mode.");
      this.isFirebaseReady = false;
      this.isFirebaseConnected = false;
      return;
    }

    try {
      if (!window.firebase.apps || !window.firebase.apps.length) {
        this.firebaseApp = window.firebase.initializeApp(fbConf);
      } else {
        this.firebaseApp = window.firebase.apps[0];
      }
      this.firebaseDb = window.firebase.database();
      this.isFirebaseReady = true;

      // Real-time connection listener on .info/connected
      this.firebaseDb.ref(".info/connected").on("value", (snap) => {
        const isConn = snap.val() === true;
        this.isFirebaseConnected = isConn;
        if (isConn) {
          this.isFirebaseReady = true;
          console.log("🟢 [Firebase] Actively connected to cloud RTDB.");
        } else {
          console.log("🟡 [Firebase] Connection state changed: waiting for cloud link.");
        }
        this.notifyListeners();
      });

      // Initial fetch: resolve authoritative state between cloud and local
      try {
        const fetchPromise = this.firebaseDb.ref("omnicard").once("value");
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 3500));
        const snapshot = await Promise.race([fetchPromise, timeoutPromise]);

        if (snapshot && snapshot.exists()) {
          const cloudData = snapshot.val();
          if (cloudData && typeof cloudData === "object" && Array.isArray(cloudData.vendors)) {
            const hasPendingSync = localStorage.getItem(PENDING_SYNC_KEY) === "true";
            const localTime = Number(this.data?.updatedAt) || 0;
            const cloudTime = Number(cloudData.updatedAt) || 0;

            // Only push local to cloud if THIS device explicitly made offline user edits that haven't been synced yet!
            if (!this.isFreshSeed && hasPendingSync && localTime > cloudTime) {
              console.log("⚡ [DB] Pending un-synced user edits detected. Syncing to Firebase.");
              await this.syncToCloud();
            } else {
              // Cloud data takes precedence!
              console.log("⚡ [DB] Adopting authoritative cloud state from Firebase.");
              this.data = cloudData;
              if (!this.data.platformSettings) this.data.platformSettings = {};
              this.data.platformSettings.firebaseConfig = { ...fbConf };
              localStorage.removeItem(PENDING_SYNC_KEY);
              this.saveLocal({ touchUpdatedAt: false });
            }
          }
        } else if (snapshot && !snapshot.exists()) {
          // Cloud database is empty, seed it with current local state
          console.log("⚡ [DB] Cloud database is empty. Seeding Firebase with initial state.");
          await this.syncToCloud();
        }
      } catch (fetchErr) {
        console.warn("Initial Firebase fetch warning:", fetchErr);
      }

      // Listen for live updates across all devices in real-time
      this.firebaseDb.ref("omnicard").on("value", (snapshot) => {
        if (this.isSyncing) return; // Prevent echoing our own save
        const cloudData = snapshot.val();
        if (cloudData && typeof cloudData === "object" && Array.isArray(cloudData.vendors)) {
          const hasPendingSync = localStorage.getItem(PENDING_SYNC_KEY) === "true";
          const localTime = Number(this.data?.updatedAt) || 0;
          const cloudTime = Number(cloudData.updatedAt) || 0;

          if (hasPendingSync && localTime > cloudTime) {
            // Local has pending unsynced edits that haven't pushed yet
            return;
          }

          this.data = cloudData;
          if (!this.data.platformSettings) {
            this.data.platformSettings = JSON.parse(JSON.stringify(INITIAL_DATA.platformSettings || {}));
          }
          if (fbConf) {
            this.data.platformSettings.firebaseConfig = { ...fbConf };
          }
          localStorage.removeItem(PENDING_SYNC_KEY);
          this.saveLocal({ touchUpdatedAt: false });
        }
      });
    } catch (err) {
      console.warn("Firebase initialization failed, operating in LocalStorage mode:", err);
      this.isFirebaseReady = false;
      this.isFirebaseConnected = false;
    }
  }

  // Sync current data to Firebase if connected
  async syncToCloud() {
    if (!this.isFirebaseReady || !this.firebaseDb) return;
    try {
      this.isSyncing = true;
      if (this.data) {
        this.data.updatedAt = Date.now();
      }
      await this.firebaseDb.ref("omnicard").set(this.data);
      try {
        localStorage.removeItem(PENDING_SYNC_KEY);
      } catch (_) {}
      console.log("✅ [DB] Successfully synchronized state to Firebase RTDB.");
    } catch (err) {
      console.warn("Cloud sync failed, persisted locally:", err);
    } finally {
      this.isSyncing = false;
    }
  }

  // Platform Settings
  getPlatformSettings() {
    if (!this.data) {
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
    if (!this.data.platformSettings) {
      this.data.platformSettings = JSON.parse(JSON.stringify(INITIAL_DATA.platformSettings || {}));
    }
    return this.data.platformSettings;
  }

  async updatePlatformSettings(newSettings) {
    if (!this.data) this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    if (!this.data.platformSettings) this.data.platformSettings = {};
    this.data.platformSettings = { ...this.data.platformSettings, ...newSettings };
    this.saveLocal({ touchUpdatedAt: true });
    await this.syncToCloud();
    return this.data.platformSettings;
  }

  // Vendors
  getVendors() {
    if (!this.data) {
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
    return this.data.vendors || [];
  }

  // Subscription Plans
  getSubscriptionPlans() {
    if (!this.data) {
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
    return this.data.subscriptionPlans || [];
  }

  getVendor(idOrSlug) {
    if (!idOrSlug) return null;
    const target = String(idOrSlug).trim().toLowerCase();
    return this.getVendors().find((v) => 
      (v.id && v.id.toLowerCase() === target) || 
      (v.slug && v.slug.toLowerCase() === target)
    ) || null;
  }

  async saveVendor(vendorData) {
    const vendors = this.getVendors();
    const index = vendors.findIndex((v) => (v.id && v.id === vendorData.id) || (v.slug && v.slug === vendorData.slug));
    const cleanVendor = JSON.parse(JSON.stringify(vendorData));
    if (index >= 0) {
      vendors[index] = { ...vendors[index], ...cleanVendor, features: { ...(vendors[index].features || {}), ...(cleanVendor.features || {}) } };
    } else {
      vendors.push(cleanVendor);
    }
    this.data.vendors = vendors;
    this.saveLocal({ touchUpdatedAt: true });
    await this.syncToCloud();
    return cleanVendor;
  }

  async deleteVendor(vendorId) {
    this.data.vendors = this.getVendors().filter((v) => v.id !== vendorId);
    this.saveLocal({ touchUpdatedAt: true });
    await this.syncToCloud();
    return true;
  }

  // Service Management (Usable by both Admin and Vendor)
  async addService(vendorId, newService) {
    const vendor = this.getVendor(vendorId);
    if (!vendor) return null;
    if (!vendor.services) vendor.services = [];
    const service = {
      id: newService.id || ("srv-" + Date.now()),
      name: newService.name || "Untitled Service",
      category: newService.category || "General",
      description: newService.description || "",
      visible: newService.visible !== false
    };
    vendor.services.push(service);
    await this.saveVendor(vendor);
    return service;
  }

  async updateService(vendorId, serviceId, updatedFields) {
    const vendor = this.getVendor(vendorId);
    if (!vendor || !vendor.services) return null;
    const index = vendor.services.findIndex((s) => s.id === serviceId);
    if (index >= 0) {
      vendor.services[index] = {
        ...vendor.services[index],
        ...updatedFields
      };
      // Ensure price is removed if present
      delete vendor.services[index].price;
      await this.saveVendor(vendor);
      return vendor.services[index];
    }
    return null;
  }

  async deleteService(vendorId, serviceId) {
    const vendor = this.getVendor(vendorId);
    if (!vendor || !vendor.services) return false;
    vendor.services = vendor.services.filter((s) => String(s.id) !== String(serviceId));
    await this.saveVendor(vendor);
    return true;
  }

  async toggleService(vendorId, serviceId) {
    const vendor = this.getVendor(vendorId);
    if (!vendor || !vendor.services) return null;
    const s = vendor.services.find((x) => String(x.id) === String(serviceId));
    if (s) {
      const isCurrentlyVisible = s.visible !== false;
      s.visible = !isCurrentlyVisible;
      await this.saveVendor(vendor);
      return s;
    }
    return null;
  }

  // Firebase Realtime DB Admin Management
  async updateFirebaseConfig(fbConf) {
    if (!this.data.platformSettings) this.data.platformSettings = {};
    const cleanConf = { ...fbConf };
    delete cleanConf.disabled;
    this.data.platformSettings.firebaseConfig = cleanConf;
    this.saveLocal({ touchUpdatedAt: true });

    if (typeof window !== "undefined" && window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
      try {
        await Promise.all(window.firebase.apps.map(a => a.delete()));
      } catch (_) {}
    }
    await this.tryInitFirebase();
    if (this.isFirebaseReady) {
      await this.syncToCloud();
      return { success: true, connected: true, message: "Connected to Firebase Realtime Database and synchronized successfully!" };
    }
    return { success: true, connected: false, message: "Configuration saved to LocalStorage. Connect to internet to sync with Firebase." };
  }

  async testFirebaseSync() {
    if (!this.isFirebaseReady || !this.firebaseDb) {
      return { success: false, error: "Firebase Realtime Database is not currently initialized or connected." };
    }
    try {
      this.isSyncing = true;
      if (this.data) this.data.updatedAt = Date.now();
      await this.firebaseDb.ref("omnicard").set(this.data);
      try {
        localStorage.removeItem(PENDING_SYNC_KEY);
      } catch (_) {}
      return { success: true, message: "Successfully synchronized local database to Firebase Realtime Database." };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      this.isSyncing = false;
    }
  }

  disconnectFirebase() {
    if (!this.data.platformSettings) this.data.platformSettings = {};
    this.data.platformSettings.firebaseConfig = {
      apiKey: "",
      authDomain: "",
      databaseURL: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
      disabled: true
    };
    this.saveLocal({ touchUpdatedAt: true });
    this.isFirebaseReady = false;
    this.isFirebaseConnected = false;
    if (typeof window !== "undefined" && window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
      try {
        window.firebase.apps.map(a => a.delete());
      } catch (_) {}
    }
    this.firebaseApp = null;
    this.firebaseDb = null;
    this.notifyListeners();
    return { success: true };
  }

  getStorageStats() {
    const str = localStorage.getItem(STORAGE_KEY) || "";
    const bytes = new Blob([str]).size;
    const kb = (bytes / 1024).toFixed(1);
    const vendors = this.getVendors();
    const plans = this.getSubscriptionPlans();
    return {
      key: STORAGE_KEY,
      sizeKb: kb,
      vendorCount: vendors.length,
      planCount: plans.length,
      isFirebaseReady: this.isFirebaseReady,
      isFirebaseConnected: this.isFirebaseConnected
    };
  }

  // Bookings
  async addBooking(vendorId, booking) {
    const vendor = this.getVendor(vendorId);
    if (!vendor) return null;
    if (!vendor.bookings) vendor.bookings = [];

    const newBooking = {
      id: "bkg-" + Date.now(),
      createdAt: new Date().toISOString(),
      status: "Pending",
      ...booking
    };

    vendor.bookings.unshift(newBooking);
    await this.saveVendor(vendor);
    return newBooking;
  }

  async updateBookingStatus(vendorId, bookingId, newStatus) {
    const vendor = this.getVendor(vendorId);
    if (!vendor || !vendor.bookings) return null;

    const bkg = vendor.bookings.find((b) => b.id === bookingId);
    if (bkg) {
      bkg.status = newStatus;
      await this.saveVendor(vendor);
    }
    return bkg;
  }

  async updateBooking(vendorId, bookingId, updatedFields) {
    const vendor = this.getVendor(vendorId);
    if (!vendor || !vendor.bookings) return null;
    const index = vendor.bookings.findIndex((b) => b.id === bookingId);
    if (index >= 0) {
      vendor.bookings[index] = {
        ...vendor.bookings[index],
        ...updatedFields
      };
      await this.saveVendor(vendor);
      return vendor.bookings[index];
    }
    return null;
  }

  async deleteBooking(vendorId, bookingId) {
    const vendor = this.getVendor(vendorId);
    if (!vendor || !vendor.bookings) return false;
    vendor.bookings = vendor.bookings.filter((b) => String(b.id) !== String(bookingId));
    await this.saveVendor(vendor);
    return true;
  }

  // Reviews
  async addReview(vendorId, review) {
    const vendor = this.getVendor(vendorId);
    if (!vendor) return null;
    if (!vendor.reviews) vendor.reviews = [];

    const newReview = {
      id: "rev-" + Date.now(),
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      createdAt: new Date().toISOString(),
      ...review
    };

    vendor.reviews.unshift(newReview);
    await this.saveVendor(vendor);
    return newReview;
  }

  async updateReview(vendorId, reviewId, updatedFields) {
    const vendor = this.getVendor(vendorId);
    if (!vendor || !vendor.reviews) return null;
    const index = vendor.reviews.findIndex((r) => String(r.id) === String(reviewId));
    if (index >= 0) {
      vendor.reviews[index] = {
        ...vendor.reviews[index],
        ...updatedFields,
        rating: updatedFields.rating !== undefined ? Number(updatedFields.rating) : vendor.reviews[index].rating
      };
      await this.saveVendor(vendor);
      return vendor.reviews[index];
    }
    return null;
  }

  async deleteReview(vendorId, reviewId) {
    const vendor = this.getVendor(vendorId);
    if (!vendor || !vendor.reviews) return false;
    vendor.reviews = vendor.reviews.filter((r) => String(r.id) !== String(reviewId));
    await this.saveVendor(vendor);
    return true;
  }

  // Leads & Lead Form Management
  async addLead(vendorId, leadData) {
    const vendor = this.getVendor(vendorId);
    if (!vendor) return null;
    if (!vendor.leads) vendor.leads = [];

    const newLead = {
      id: "lead-" + Date.now(),
      createdAt: new Date().toISOString(),
      status: "New", // New, Contacted, Converted
      ...leadData
    };

    vendor.leads.unshift(newLead);
    await this.saveVendor(vendor);
    return newLead;
  }

  async updateLeadStatus(vendorId, leadId, newStatus) {
    const vendor = this.getVendor(vendorId);
    if (!vendor || !vendor.leads) return null;

    const lead = vendor.leads.find((l) => l.id === leadId);
    if (lead) {
      lead.status = newStatus;
      await this.saveVendor(vendor);
    }
    return lead;
  }

  async deleteLead(vendorId, leadId) {
    const vendor = this.getVendor(vendorId);
    if (!vendor || !vendor.leads) return false;
    vendor.leads = vendor.leads.filter((l) => l.id !== leadId);
    await this.saveVendor(vendor);
    return true;
  }

  async saveLeadFormConfig(vendorId, leadFormConfig) {
    const vendor = this.getVendor(vendorId);
    if (!vendor) return null;
    vendor.leadForm = {
      ...vendor.leadForm,
      ...leadFormConfig
    };
    await this.saveVendor(vendor);
    return vendor.leadForm;
  }

  // Product Management (Usable by both Admin and Vendor)
  async addProduct(vendorId, newProduct) {
    const vendor = this.getVendor(vendorId);
    if (!vendor) return null;
    if (!vendor.products) vendor.products = [];
    const product = {
      id: newProduct.id || ("prod-" + Date.now()),
      name: newProduct.name || "New Product",
      category: newProduct.category || "General",
      price: Number(newProduct.price || 0),
      unit: newProduct.unit || "unit",
      emoji: newProduct.emoji || "🛍️",
      description: newProduct.description || "",
      visible: newProduct.visible !== false
    };
    vendor.products.push(product);
    await this.saveVendor(vendor);
    return product;
  }

  async updateProduct(vendorId, productId, updatedFields) {
    const vendor = this.getVendor(vendorId);
    if (!vendor || !vendor.products) return null;
    const index = vendor.products.findIndex((p) => p.id === productId);
    if (index >= 0) {
      vendor.products[index] = {
        ...vendor.products[index],
        ...updatedFields,
        price: updatedFields.price !== undefined ? Number(updatedFields.price) : vendor.products[index].price
      };
      await this.saveVendor(vendor);
      return vendor.products[index];
    }
    return null;
  }

  async deleteProduct(vendorId, productId) {
    const vendor = this.getVendor(vendorId);
    if (!vendor || !vendor.products) return false;
    vendor.products = vendor.products.filter((p) => String(p.id) !== String(productId));
    await this.saveVendor(vendor);
    return true;
  }

  async toggleProduct(vendorId, productId) {
    const vendor = this.getVendor(vendorId);
    if (!vendor || !vendor.products) return null;
    const p = vendor.products.find((x) => String(x.id) === String(productId));
    if (p) {
      const isCurrentlyVisible = p.visible !== false;
      p.visible = !isCurrentlyVisible;
      await this.saveVendor(vendor);
      return p;
    }
    return null;
  }

  // Subscription Plans
  getSubscriptionPlans() {
    return this.data.subscriptionPlans || [];
  }

  async saveSubscriptionPlan(planData) {
    const plans = this.getSubscriptionPlans();
    const index = plans.findIndex((p) => p.id === planData.id);
    if (index >= 0) {
      plans[index] = { ...plans[index], ...planData };
    } else {
      plans.push(planData);
    }
    this.data.subscriptionPlans = plans;
    this.saveLocal({ touchUpdatedAt: true });
    await this.syncToCloud();
    return planData;
  }

  async deleteSubscriptionPlan(planId) {
    this.data.subscriptionPlans = this.getSubscriptionPlans().filter((p) => p.id !== planId);
    this.saveLocal({ touchUpdatedAt: true });
    await this.syncToCloud();
    return true;
  }

  // Full Database Backup / Export & Restore
  exportBackupJson() {
    return JSON.stringify(this.data, null, 2);
  }

  async importBackupJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.vendors || !parsed.platformSettings) {
        throw new Error("Invalid OmniCard backup schema.");
      }
      this.data = parsed;
      this.saveLocal({ touchUpdatedAt: true });
      await this.syncToCloud();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Reset to default seed data
  async resetToDefaults() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveLocal({ touchUpdatedAt: true });
    await this.syncToCloud();
    return this.data;
  }
}

// Global Singleton pattern across all module scopes
const db = (typeof window !== "undefined" && window.__OMNICARD_DB__)
  ? window.__OMNICARD_DB__
  : new DatabaseService();

if (typeof window !== "undefined") {
  window.__OMNICARD_DB__ = db;
  window.OmniDB = db;
}

export { db, DatabaseService };
