// Seed Data for Smart Business vCard & Vendor Operating System
export const INITIAL_DATA = {
  platformSettings: {
    platformName: "OmniCard OS",
    tagline: "Next-Gen Smart Business vCards & Vendor OS",
    currencySymbol: "₹",
    supportWhatsApp: "+917019601569",
    supportEmail: "support@omnicard.io",
    adminPin: "1234",
    adminUpi: "7019601569@ybl",
    lastAdminChange: {
      action: "Initial system configuration & setup",
      timestamp: 1773177600000,
      dateString: "10 Sep 2026, 04:00 AM"
    },
    firebaseConfig: {
      apiKey: "AIzaSyC1F2gHzKlIiyGDEF8hMT8L2Dc1eO1YUYk",
      authDomain: "flavours-catering-3b122.firebaseapp.com",
      databaseURL: "https://flavours-catering-3b122-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "flavours-catering-3b122",
      storageBucket: "flavours-catering-3b122.firebasestorage.app",
      messagingSenderId: "1079367774104",
      appId: "1:1079367774104:web:64c6f439a7f906ac4b85ed"
    }
  },
  subscriptionPlans: [
    {
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
    },
    {
      id: "plan-starter",
      name: "Starter Lite",
      price: 999,
      durationDays: 30,
      description: "Essential digital business card with contact launcher & basic services.",
      features: {
        quoteBuilder: true,
        ecommerceShop: false,
        calendarBooking: false,
        customerReviews: true,
        promoBanner: false,
        pwaInstall: true,
        leadForm: true
      }
    },
    {
      id: "plan-pro",
      name: "Professional Growth",
      price: 2499,
      durationDays: 90,
      description: "Full suite with Quote builder, E-commerce shop, and verified partner badge.",
      features: {
        quoteBuilder: true,
        ecommerceShop: true,
        calendarBooking: true,
        customerReviews: true,
        promoBanner: true,
        pwaInstall: true,
        leadForm: true
      }
    },
    {
      id: "plan-enterprise",
      name: "Enterprise Annual VIP",
      price: 7999,
      durationDays: 365,
      description: "Uncapped features, custom domain routing, priority booking, and VIP support.",
      features: {
        quoteBuilder: true,
        ecommerceShop: true,
        calendarBooking: true,
        customerReviews: true,
        promoBanner: true,
        pwaInstall: true,
        leadForm: true
      }
    }
  ],
  vendors: [
    {
      id: "elite-catering",
      slug: "elite-catering",
      pin: "2026",
      password: "2026",
      status: "active", // active, suspended, expired
      planId: "plan-enterprise",
      createdAt: "2026-01-15T10:00:00.000Z",
      expiresAt: "2027-01-15T10:00:00.000Z", // Future date
      verified: true,
      isOpen: true,
      openHours: "08:00 AM - 11:00 PM (Daily)",
      branding: {
        businessName: "Elite Banquet & Gourmet Catering",
        ownerName: "Chef Rajesh & Sons",
        category: "ELITE CATERING & EVENTS",
        tagline: "Bespoke Royal Cuisine & Luxury Event Catering Across India",
        avatarEmoji: "🍛",
        theme: "Sunset Dark",
        colors: {
          primary: "#D4FF00",    // Electric Lime
          secondary: "#00E5FF",  // Clean Cyan
          background: "#07090E", // Dark Swiss Base
          cardBg: "#0F131C"      // Bento Dark Card
        }
      },
      contacts: {
        phone: "+919876543210",
        whatsapp: "919876543210",
        email: "events@elitebanquet.com",
        location: "102 Grand Heritage Boulevard, Jubilee Hills, Hyderabad",
        mapUrl: "https://maps.google.com/?q=Jubilee+Hills+Hyderabad",
        website: "https://elitebanquet.com"
      },
      notices: {
        marquee: "🎉 Now taking Royal Wedding & Corporate Gala bookings for Winter 2026! Book early for 15% VIP discount.",
        expiryNoticeHoursThreshold: 48
      },
      promo: {
        title: "Grand Wedding Tasting Box Deal",
        badge: "LIMITED TASTING PASS",
        code: "ROYAL26",
        discount: "Complimentary Chef's 12-Course Sampler Box with every booked wedding consultation.",
        enabled: true
      },
      about: {
        tagline: "Crafting unforgettable gastronomic journeys since 2012.",
        description: "Specializing in regal Awadhi, Coastal Seafood, contemporary Pan-Asian, and artisanal European live counters. Certified ISO 22000 hygiene and 5-star hospitality crew for gatherings from 50 to 5,000 guests.",
        consultationFee: 499,
        establishedYear: 2012,
        highlightStats: [
          { label: "Weddings Catered", value: "1,400+" },
          { label: "Master Chefs", value: "24" },
          { label: "Hygiene Rating", value: "5.0 ★" }
        ]
      },
      features: {
        quoteBuilder: true,
        ecommerceShop: true,
        calendarBooking: true,
        customerReviews: true,
        promoBanner: true,
        pwaInstall: true,
        leadForm: true
      },
      leadForm: {
        enabled: true,
        title: "Request a Call Back & Free Quote",
        subtitle: "Submit your details below. Chef Rajesh's team will connect with you on WhatsApp right away.",
        buttonText: "Request Call Back",
        submitButtonText: "Request Call Back ⚡",
        buttonIcon: "⚡",
        fields: [
          {
            id: "fld-name",
            type: "text",
            label: "Your Full Name",
            placeholder: "e.g. Vikram Sharma",
            required: true,
            options: []
          },
          {
            id: "fld-phone",
            type: "phone",
            label: "WhatsApp / Contact Number",
            placeholder: "e.g. 9876543210",
            required: true,
            options: []
          },
          {
            id: "fld-service",
            type: "select",
            label: "Event & Catering Type",
            placeholder: "Choose event category",
            required: true,
            options: ["Royal Wedding Gala", "Corporate Executive Lunch", "Private Cocktail Party", "Live Artisanal Chaat Counter", "Family Gathering & Birthday"]
          },
          {
            id: "fld-date",
            type: "date",
            label: "Event / Function Date",
            placeholder: "Select event date",
            required: true,
            options: []
          },
          {
            id: "fld-addons",
            type: "multiselect",
            label: "Additional Counters Required",
            placeholder: "Select all that apply",
            required: false,
            options: ["Molecular Mixology Bar", "Live Dessert & Baklava Studio", "VIP Uniformed Service Crew", "Tasting Session at Venue", "Floral Dining Decor"]
          },
          {
            id: "fld-notes",
            type: "textarea",
            label: "Guest Count & Special Requests",
            placeholder: "e.g. ~250 guests, strictly vegetarian counter needed...",
            required: false,
            options: []
          }
        ]
      },
      leads: [
        {
          id: "lead-201",
          createdAt: "2026-09-06T11:20:00.000Z",
          customerName: "Sameer Singhania",
          customerPhone: "9820112233",
          status: "New",
          fields: [
            { label: "Your Full Name", value: "Sameer Singhania" },
            { label: "WhatsApp / Contact Number", value: "9820112233" },
            { label: "Event & Catering Type", value: "Royal Wedding Gala" },
            { label: "Event / Function Date", value: "2026-11-20" },
            { label: "Additional Counters Required", value: ["Molecular Mixology Bar", "Live Dessert & Baklava Studio"] },
            { label: "Guest Count & Special Requests", value: "Approx 450 guests for destination wedding in Udaipur." }
          ]
        }
      ],
      services: [
        {
          id: "srv-1",
          name: "Royal Mughlai & Awadhi Buffet (Per Guest)",
          category: "Buffet Menus",
          description: "Dum Pukht Biryani, Galouti Kebabs, Paneer Pasanda, Dal Bukhara, Shahi Tukda & 18 side accompaniments.",
          visible: true
        },
        {
          id: "srv-2",
          name: "Live Artisanal Chaat & Street Food Studio",
          category: "Live Counters",
          description: "Interactive chef counter with Banarasi Palak Chaat, Nitrogen Dahi Vada, and Purani Dilli Golgappas.",
          visible: true
        },
        {
          id: "srv-3",
          name: "Signature Corporate Lunch Bento Catering",
          category: "Corporate",
          description: "Eco-friendly premium hot bento boxes for leadership meetings, keynote summits, and board retreats.",
          visible: true
        },
        {
          id: "srv-4",
          name: "Luxury Mocktail & Molecular Mixology Bar",
          category: "Beverage",
          description: "Custom smoked botanicals, edible gold sparkles, fresh cold-pressed syrups, and flair bartenders.",
          visible: true
        }
      ],
      products: [
        {
          id: "prod-1",
          name: "Chef's Artisanal Spice Rubs (Pack of 4)",
          category: "Artisanal Spices",
          price: 799,
          unit: "box",
          emoji: "🌶️",
          description: "Handcrafted roasted garam masala, royal zaatar, tandoori marinade & saffron seasoning.",
          visible: true
        },
        {
          id: "prod-2",
          name: "Heritage Saffron Dum Pukht Biryani Handi (Serves 4)",
          category: "Signature Biryani",
          price: 1850,
          unit: "handi",
          emoji: "🍲",
          description: "Slow-cooked in an authentic sealed earthenware pot with wild aged Basmati and Kashmiri Saffron.",
          visible: true
        },
        {
          id: "prod-3",
          name: "Royal Baklava & Rose Halwa Sweets Hamper",
          category: "Royal Desserts",
          price: 1250,
          unit: "tin",
          emoji: "🍯",
          description: "Layered flaky pistachio baklava and silver-leaf infused rose halwa presented in a gold-embossed tin.",
          visible: true
        },
        {
          id: "prod-4",
          name: "Cold-Pressed Kashmiri Saffron Kahwa Elixir (500ml)",
          category: "Beverages",
          price: 550,
          unit: "bottle",
          emoji: "🫖",
          description: "Brewed green tea concentrate with crushed green cardamom, cinnamon bark, and whole almond flakes.",
          visible: true
        }
      ],
      bookings: [
        {
          id: "bkg-101",
          clientName: "Vikramaditya Roy",
          clientPhone: "9811223344",
          date: "2026-09-15",
          timeSlot: "11:00 AM",
          service: "Royal Mughlai & Awadhi Buffet (Per Guest)",
          notes: "Wedding reception tasting for 400 guests.",
          status: "Confirmed",
          createdAt: "2026-09-02T14:30:00.000Z"
        },
        {
          id: "bkg-102",
          clientName: "Meera Singhania",
          clientPhone: "9722334455",
          date: "2026-09-18",
          timeSlot: "03:00 PM",
          service: "Signature Corporate Lunch Bento Catering",
          notes: "Q4 Tech leadership summit catering setup.",
          status: "Pending",
          createdAt: "2026-09-04T09:15:00.000Z"
        }
      ],
      reviewTags: [
        "Royal Taste & Flavors",
        "Immaculate Hygiene",
        "Punctual Setup",
        "Courteous Staff",
        "Stunning Presentation",
        "Generous Portions"
      ],
      reviews: [
        {
          id: "rev-1",
          author: "Rohit & Natasha Verma",
          rating: 5,
          date: "August 28, 2026",
          tags: ["Royal Taste & Flavors", "Stunning Presentation"],
          content: "Rajesh and his team orchestrated the catering for our sister's sangeet and reception. The live chaat bar and the Awadhi biryani blew every guest away! Seamless service."
        },
        {
          id: "rev-2",
          author: "Pooja Hegde (VP Events, Zenith Corp)",
          rating: 5,
          date: "August 20, 2026",
          tags: ["Punctual Setup", "Courteous Staff"],
          content: "Flawless corporate conference lunches. Hot, gourmet, and neatly packed. The mixology mocktail bar at the mixer was an absolute highlight."
        },
        {
          id: "rev-3",
          author: "Aditya K. Rao",
          rating: 4,
          date: "July 14, 2026",
          tags: ["Royal Taste & Flavors", "Immaculate Hygiene"],
          content: "Ordered the Dum Pukht handis for a 30-person family get-together. Supreme aroma and great meat tenderization. Highly recommended."
        }
      ]
    },
    {
      id: "luxe-beauty",
      slug: "luxe-beauty",
      pin: "2026",
      password: "2026",
      status: "active",
      planId: "plan-pro",
      createdAt: "2026-02-10T12:00:00.000Z",
      expiresAt: "2026-12-31T12:00:00.000Z",
      verified: true,
      isOpen: true,
      openHours: "10:00 AM - 08:30 PM (Tue-Sun)",
      branding: {
        businessName: "Luxe Hair & Aesthetic Retreat",
        ownerName: "Ananya Sharma",
        category: "PREMIUM BEAUTY RETREAT",
        tagline: "Modern Hair Sculpting, Organic Skin Therapy & Bridal Glamour",
        avatarEmoji: "💇‍♀️",
        theme: "Peach Cream",
        colors: {
          primary: "#FF8C69",
          secondary: "#D4FF00",
          background: "#090A10",
          cardBg: "#111420"
        }
      },
      contacts: {
        phone: "+919811002233",
        whatsapp: "919811002233",
        email: "glow@luxebeauty.co",
        location: "Shop 4, Palladium Luxury Galleria, Indiranagar, Bengaluru",
        mapUrl: "https://maps.google.com/?q=Indiranagar+Bangalore",
        website: "https://luxebeauty.co"
      },
      notices: {
        marquee: "✨ Korean Glass-Skin HydraFacial promo at 25% off this week! Walk-ins & slot bookings open.",
        expiryNoticeHoursThreshold: 24
      },
      promo: {
        title: "Glass-Skin Glow Makeover Pass",
        badge: "WEEKEND PASS",
        code: "GLOW2026",
        discount: "Get flat ₹800 OFF on Hair Botoplex + Hydra-Facial combo.",
        enabled: true
      },
      about: {
        tagline: "Elegance defined by mindful dermatology and haute styling.",
        description: "Boutique salon offering vegan botanical haircare, clinical aesthetic treatments, and couture bridal makeup by celebrity stylists.",
        consultationFee: 350,
        establishedYear: 2018,
        highlightStats: [
          { label: "Bridal Makeovers", value: "850+" },
          { label: "Certified Therapists", value: "14" },
          { label: "Client Satisfaction", value: "99.2%" }
        ]
      },
      features: {
        quoteBuilder: true,
        ecommerceShop: true,
        calendarBooking: true,
        customerReviews: true,
        promoBanner: true,
        pwaInstall: true,
        leadForm: true
      },
      leadForm: {
        enabled: true,
        title: "Request Aesthetic Consultation Call",
        subtitle: "Schedule a personalized consultation with Dr. Ananya Sharma's dermatology crew.",
        buttonText: "Request Consultation Call",
        submitButtonText: "Request Call Back ⚡",
        buttonIcon: "💇‍♀️",
        fields: [
          {
            id: "fld-lb-1",
            type: "text",
            label: "Your Full Name",
            placeholder: "e.g. Priya Nair",
            required: true,
            options: []
          },
          {
            id: "fld-lb-2",
            type: "phone",
            label: "WhatsApp / Phone",
            placeholder: "e.g. 9811002233",
            required: true,
            options: []
          },
          {
            id: "fld-lb-3",
            type: "select",
            label: "Service of Interest",
            placeholder: "Select aesthetic treatment",
            required: true,
            options: ["Korean Hydra-Infusion Facial", "Caviar & Keratin Gloss Reconstruction", "Couture Airbrush Bridal Artistry", "Scalp Detox & Micro-needling"]
          },
          {
            id: "fld-lb-4",
            type: "date",
            label: "Preferred Consultation Date",
            placeholder: "Select date",
            required: false,
            options: []
          },
          {
            id: "fld-lb-5",
            type: "multiselect",
            label: "Hair / Skin Concerns",
            placeholder: "Select all that apply",
            required: false,
            options: ["Dry & Frizzy Hair", "Acne & Pigmentation", "Bridal Glow Trial", "Sensitive Skin", "Anti-Aging & Peptides"]
          },
          {
            id: "fld-lb-6",
            type: "textarea",
            label: "Specific Concerns / Goals",
            placeholder: "Any ongoing treatments or allergies we should note?",
            required: false,
            options: []
          }
        ]
      },
      leads: [
        {
          id: "lead-202",
          createdAt: "2026-09-07T14:15:00.000Z",
          customerName: "Rhea Sen",
          customerPhone: "9944001122",
          status: "New",
          fields: [
            { label: "Your Full Name", value: "Rhea Sen" },
            { label: "WhatsApp / Phone", value: "9944001122" },
            { label: "Service of Interest", value: "Couture Airbrush Bridal Artistry" },
            { label: "Preferred Consultation Date", value: "2026-10-15" },
            { label: "Hair / Skin Concerns", value: ["Bridal Glow Trial", "Sensitive Skin"] },
            { label: "Specific Concerns / Goals", value: "Need bridal hair and makeup package for 3 ceremonies." }
          ]
        }
      ],
      services: [
        {
          id: "lb-srv-1",
          name: "Korean Medical Hydra-Infusion Facial",
          category: "Facial Care",
          description: "Deep pore vacuum extraction, multi-peptide galvanic infusion & LED light collagen stimulation.",
          visible: true
        },
        {
          id: "lb-srv-2",
          name: "Caviar & Keratin Gloss Reconstruction",
          category: "Hair Therapy",
          description: "Formaldehyde-free intensive restructuring ritual for silky glass hair that lasts up to 4 months.",
          visible: true
        },
        {
          id: "lb-srv-3",
          name: "Couture Airbrush Bridal Artistry",
          category: "Bridal",
          description: "Waterproof HD airbrush makeup, designer floral hairstyle, draping, and complimentary touch-up kit.",
          visible: true
        }
      ],
      products: [
        {
          id: "lb-prod-1",
          name: "Botanical Silk Argan Hair Elixir (100ml)",
          category: "Haircare",
          price: 1250,
          unit: "bottle",
          emoji: "🧴",
          description: "Weightless thermal heat shield & frizz taming serum enriched with pure Moroccan argan oil.",
          visible: true
        },
        {
          id: "lb-prod-2",
          name: "Hyaluronic + Niacinamide Dewy Mist",
          category: "Skincare",
          price: 890,
          unit: "spray",
          emoji: "✨",
          description: "Ultra-fine hydrating facial mist with rosewater and multi-molecular plumping actives.",
          visible: true
        }
      ],
      bookings: [
        {
          id: "lb-bkg-1",
          clientName: "Tanvi Kapoor",
          clientPhone: "9944556677",
          date: "2026-09-12",
          timeSlot: "02:00 PM",
          service: "Korean Medical Hydra-Infusion Facial",
          notes: "Sensitive skin, prefers organic rose calm toner.",
          status: "Confirmed",
          createdAt: "2026-09-03T11:00:00.000Z"
        }
      ],
      reviewTags: [
        "Flawless Glow",
        "Hygienic Tools",
        "Expert Stylist",
        "Relaxing Ambience",
        "Transparent Pricing"
      ],
      reviews: [
        {
          id: "lb-rev-1",
          author: "Siddhi Deshmukh",
          rating: 5,
          date: "August 30, 2026",
          tags: ["Flawless Glow", "Expert Stylist"],
          content: "Ananya is a genius! My hair was severely heat damaged and the Caviar reconstruction completely revived it. Beautiful aesthetic salon."
        }
      ]
    },
    {
      id: "apex-medical",
      slug: "apex-medical",
      pin: "2026",
      password: "2026",
      status: "active",
      planId: "plan-starter",
      createdAt: "2026-03-01T08:00:00.000Z",
      expiresAt: "2027-01-15T14:00:00.000Z", // Future active date
      verified: true,
      isOpen: true,
      openHours: "09:00 AM - 07:00 PM (Mon-Sat)",
      branding: {
        businessName: "Dr. Rao's Apex Wellness Clinic",
        ownerName: "Dr. Vikram Rao, MD, Cardiology",
        category: "CLINIC & PREVENTIVE HEALTH",
        tagline: "Evidence-Based Cardiovascular & Lifestyle Medicine",
        avatarEmoji: "🩺",
        theme: "Emerald Green",
        colors: {
          primary: "#10B981",
          secondary: "#00E5FF",
          background: "#070B0A",
          cardBg: "#0F1815"
        }
      },
      contacts: {
        phone: "+919443322110",
        whatsapp: "919443322110",
        email: "care@apexwellness.org",
        location: "Suite 301, Mediplex Towers, Bandra West, Mumbai",
        mapUrl: "https://maps.google.com/?q=Bandra+West+Mumbai",
        website: "https://apexwellness.org"
      },
      notices: {
        marquee: "⚠️ Annual Card Hosting Expiry Alert: Renew before midnight to maintain seamless WhatsApp booking & instant quotes.",
        expiryNoticeHoursThreshold: 24
      },
      promo: {
        title: "Comprehensive Heart & Lipid Profile Screening",
        badge: "WELLNESS CHECK",
        code: "HEARTCHECK",
        discount: "Includes 12-lead ECG, HbA1c, Advanced Lipid Panel + 30-min Physician Consultation.",
        enabled: true
      },
      about: {
        tagline: "Preventive wellness before acute interventions.",
        description: "Led by Senior Interventional Cardiologist Dr. Vikram Rao with 18+ years of clinical excellence in Mumbai's premier hospital networks.",
        consultationFee: 1200,
        establishedYear: 2015,
        highlightStats: [
          { label: "Patients Treated", value: "12,000+" },
          { label: "Clinical Trials", value: "18" },
          { label: "Patient Trust", value: "4.95 ★" }
        ]
      },
      features: {
        quoteBuilder: true,
        ecommerceShop: false,
        calendarBooking: true,
        customerReviews: true,
        promoBanner: true,
        pwaInstall: true,
        leadForm: true
      },
      leadForm: {
        enabled: true,
        title: "Request Physician Consultation Call",
        subtitle: "Dr. Vikram Rao's clinical team will get in touch with you to understand your medical needs.",
        buttonText: "Request Doctor Call Back",
        submitButtonText: "Request Call Back ⚡",
        buttonIcon: "🩺",
        fields: [
          {
            id: "fld-am-1",
            type: "text",
            label: "Patient Full Name",
            placeholder: "e.g. Ramesh Chandra",
            required: true,
            options: []
          },
          {
            id: "fld-am-2",
            type: "phone",
            label: "WhatsApp / Phone Number",
            placeholder: "e.g. 9443322110",
            required: true,
            options: []
          },
          {
            id: "fld-am-3",
            type: "select",
            label: "Consultation Requirement",
            placeholder: "Select health specialty",
            required: true,
            options: ["Comprehensive Cardiologist Consultation", "24-Hour Holter ECG Analysis", "Cardiac Stress Treadmill Test (TMT)", "Preventive Heart & Lipid Screening", "Post-Operative Recovery Follow-up"]
          },
          {
            id: "fld-am-4",
            type: "date",
            label: "Preferred Appointment Date",
            placeholder: "Select date",
            required: false,
            options: []
          },
          {
            id: "fld-am-5",
            type: "multiselect",
            label: "Symptoms / Prior Conditions",
            placeholder: "Select any symptoms",
            required: false,
            options: ["Hypertension / High BP", "Chest Discomfort", "Palpitations", "Shortness of Breath", "Family History of Heart Disease"]
          },
          {
            id: "fld-am-6",
            type: "textarea",
            label: "Health Background & Notes",
            placeholder: "Describe existing medications or doctor recommendations...",
            required: false,
            options: []
          }
        ]
      },
      leads: [
        {
          id: "lead-203",
          createdAt: "2026-09-07T16:40:00.000Z",
          customerName: "Kishore Advani",
          customerPhone: "9820011223",
          status: "New",
          fields: [
            { label: "Patient Full Name", value: "Kishore Advani" },
            { label: "WhatsApp / Phone Number", value: "9820011223" },
            { label: "Consultation Requirement", value: "Comprehensive Cardiologist Consultation" },
            { label: "Preferred Appointment Date", value: "2026-09-15" },
            { label: "Symptoms / Prior Conditions", value: ["Hypertension / High BP", "Palpitations"] },
            { label: "Health Background & Notes", value: "Looking for second opinion on quarterly stress test." }
          ]
        }
      ],
      services: [
        {
          id: "am-srv-1",
          name: "In-Clinic Cardiologist Comprehensive Consultation",
          category: "Consultation",
          description: "Detailed medical history evaluation, physical examination, resting ECG interpretation, and treatment strategy.",
          visible: true
        },
        {
          id: "am-srv-2",
          name: "Holter Monitor 24-Hour Continuous ECG Analysis",
          category: "Diagnostics",
          description: "Digital telemetry monitor patch for arrhythmia detection with automated AI rhythm breakdown.",
          visible: true
        },
        {
          id: "am-srv-3",
          name: "Preventive Cardiac Stress Treadmill Test (TMT)",
          category: "Diagnostics",
          description: "Physician-supervised Bruce protocol exercise test evaluating ischemic response and functional capacity.",
          visible: true
        }
      ],
      products: [],
      bookings: [
        {
          id: "am-bkg-1",
          clientName: "Sunil Narang",
          clientPhone: "9820011223",
          date: "2026-09-10",
          timeSlot: "10:00 AM",
          service: "In-Clinic Cardiologist Comprehensive Consultation",
          notes: "Routine quarterly hypertension checkup.",
          status: "Confirmed",
          createdAt: "2026-09-05T10:00:00.000Z"
        }
      ],
      reviewTags: [
        "Accurate Diagnosis",
        "Gentle & Attentive",
        "Minimal Wait Time",
        "Modern Diagnostics",
        "Transparent Advice"
      ],
      reviews: [
        {
          id: "am-rev-1",
          author: "Harish Mankad",
          rating: 5,
          date: "August 25, 2026",
          tags: ["Accurate Diagnosis", "Gentle & Attentive"],
          content: "Dr. Rao is so patient and explains every single ECG reading and lipid metric clearly without rushing. We trust our entire family's heart health with him."
        }
      ]
    }
  ]
};
