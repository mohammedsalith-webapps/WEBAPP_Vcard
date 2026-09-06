// Database Abstraction Layer with Firebase Realtime Database & LocalStorage Dual Sync
import { INITIAL_DATA } from "./seedData.js";

const STORAGE_KEY = "OMNICARD_SYSTEM_DATA_2026";

class DatabaseService {
  constructor() {
    this.data = null;
    this.firebaseApp = null;
    this.firebaseDb = null;
    this.isFirebaseReady = false;
    this.listeners = [];
  }

  // Initialize DB: Load from LocalStorage or seed with INITIAL_DATA
  async init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
        this.saveLocal();
      }
    } catch (err) {
      console.warn("Error reading localStorage, initializing seed data:", err);
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
      this.saveLocal();
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
            pwaInstall: true
          }
        };
        this.data.subscriptionPlans.unshift(demoPlan);
        this.saveLocal();
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
      });
      if (cleaned) {
        this.saveLocal();
      }
    }

    // Try initializing Firebase if config exists in settings
    this.tryInitFirebase();

    return this.data;
  }

  saveLocal() {
    try {
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

  // Firebase Realtime DB optional sync
  tryInitFirebase() {
    const fbConf = this.data?.platformSettings?.firebaseConfig;
    if (fbConf && fbConf.apiKey && fbConf.databaseURL && window.firebase) {
      try {
        if (!window.firebase.apps.length) {
          this.firebaseApp = window.firebase.initializeApp(fbConf);
        } else {
          this.firebaseApp = window.firebase.app();
        }
        this.firebaseDb = window.firebase.database();
        this.isFirebaseReady = true;
        console.log("Firebase Realtime DB connected successfully.");

        // Listen for live updates
        this.firebaseDb.ref("omnicard").on("value", (snapshot) => {
          const cloudData = snapshot.val();
          if (cloudData && typeof cloudData === "object") {
            this.data = cloudData;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
            this.notifyListeners();
          }
        });
      } catch (err) {
        console.warn("Firebase initialization failed, operating in LocalStorage mode:", err);
        this.isFirebaseReady = false;
      }
    }
  }

  // Sync current data to Firebase if connected
  async syncToCloud() {
    if (this.isFirebaseReady && this.firebaseDb) {
      try {
        await this.firebaseDb.ref("omnicard").set(this.data);
      } catch (err) {
        console.warn("Cloud sync failed, persisted locally:", err);
      }
    }
  }

  // Platform Settings
  getPlatformSettings() {
    return this.data.platformSettings;
  }

  async updatePlatformSettings(newSettings) {
    this.data.platformSettings = { ...this.data.platformSettings, ...newSettings };
    this.saveLocal();
    await this.syncToCloud();
    return this.data.platformSettings;
  }

  // Vendors
  getVendors() {
    return this.data.vendors || [];
  }

  getVendor(idOrSlug) {
    if (!idOrSlug) return null;
    return this.getVendors().find((v) => v.id === idOrSlug || v.slug === idOrSlug) || null;
  }

  async saveVendor(vendorData) {
    const vendors = this.getVendors();
    const index = vendors.findIndex((v) => v.id === vendorData.id);
    if (index >= 0) {
      vendors[index] = { ...vendors[index], ...vendorData };
    } else {
      vendors.push(vendorData);
    }
    this.data.vendors = vendors;
    this.saveLocal();
    await this.syncToCloud();
    return vendorData;
  }

  async deleteVendor(vendorId) {
    this.data.vendors = this.getVendors().filter((v) => v.id !== vendorId);
    this.saveLocal();
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
    vendor.services = vendor.services.filter((s) => s.id !== serviceId);
    await this.saveVendor(vendor);
    return true;
  }

  async toggleService(vendorId, serviceId) {
    const vendor = this.getVendor(vendorId);
    if (!vendor || !vendor.services) return null;
    const s = vendor.services.find((x) => x.id === serviceId);
    if (s) {
      s.visible = !s.visible;
      await this.saveVendor(vendor);
      return s;
    }
    return null;
  }

  // Firebase Realtime DB Admin Management
  async updateFirebaseConfig(fbConf) {
    if (!this.data.platformSettings) this.data.platformSettings = {};
    this.data.platformSettings.firebaseConfig = { ...fbConf };
    this.saveLocal();
    this.tryInitFirebase();
    if (this.isFirebaseReady) {
      await this.syncToCloud();
      return { success: true, connected: true };
    }
    return { success: true, connected: false, message: "Configuration saved to LocalStorage. Connect to internet to sync with Firebase." };
  }

  async testFirebaseSync() {
    if (!this.isFirebaseReady || !this.firebaseDb) {
      return { success: false, error: "Firebase Realtime Database is not currently initialized or connected." };
    }
    try {
      await this.firebaseDb.ref("omnicard").set(this.data);
      return { success: true, message: "Successfully synchronized local database to Firebase Realtime Database." };
    } catch (err) {
      return { success: false, error: err.message };
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
      appId: ""
    };
    this.saveLocal();
    this.isFirebaseReady = false;
    this.firebaseApp = null;
    this.firebaseDb = null;
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
      isFirebaseReady: this.isFirebaseReady
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
    vendor.bookings = vendor.bookings.filter((b) => b.id !== bookingId);
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
    const index = vendor.reviews.findIndex((r) => r.id === reviewId);
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
    vendor.reviews = vendor.reviews.filter((r) => r.id !== reviewId);
    await this.saveVendor(vendor);
    return true;
  }

  // Product Management (Usable by both Admin and Vendor)
  async addProduct(vendorId, newProduct) {
    const vendor = this.getVendor(vendorId);
    if (!vendor) return null;
    if (!vendor.products) vendor.products = [];
    const product = {
      id: newProduct.id || ("prod-" + Date.now()),
      name: newProduct.name || "New Product",
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
    vendor.products = vendor.products.filter((p) => p.id !== productId);
    await this.saveVendor(vendor);
    return true;
  }

  async toggleProduct(vendorId, productId) {
    const vendor = this.getVendor(vendorId);
    if (!vendor || !vendor.products) return null;
    const p = vendor.products.find((x) => x.id === productId);
    if (p) {
      p.visible = !p.visible;
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
    this.saveLocal();
    await this.syncToCloud();
    return planData;
  }

  async deleteSubscriptionPlan(planId) {
    this.data.subscriptionPlans = this.getSubscriptionPlans().filter((p) => p.id !== planId);
    this.saveLocal();
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
      this.saveLocal();
      await this.syncToCloud();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Reset to default seed data
  async resetToDefaults() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveLocal();
    await this.syncToCloud();
    return this.data;
  }
}

export const db = new DatabaseService();
