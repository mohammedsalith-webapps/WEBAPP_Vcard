# OmniCard OS - Smart Business vCard & Vendor Operating System (SaaS PWA)

A full-stack, single-page Progressive Web App (PWA) SaaS platform allowing businesses to create, manage, and share interactive digital business vCards with built-in E-Commerce, Service Quote Builders, Calendar Booking, and Review systems, along with a Vendor Self-Service Portal and Super Admin Management Console.

## 🚀 Quick Launch

Open your terminal in this project folder and run:

```bash
python -m http.server 8080
```

Then visit:
- **Public Digital vCard**: `http://localhost:8080/?v=elite-catering`
- **Vendor Console**: `http://localhost:8080/?view=vendor` (PIN: `2026`)
- **Super Admin Console**: `http://localhost:8080/?view=admin` (PIN: `1234`)

## 🎨 Design System
- **Modern Bento Grid & Minimalist Swiss Architecture**
- Solid color blocks, 1px crisp borders (`rgba(255,255,255,0.08)`), dark Swiss canvas (`#07090E`), Bento cards (`#0F131C`)
- High-contrast electric accents (`#D4FF00`, `#00E5FF`, `#FF8C69`, `#10B981`)
- Typography: `Outfit` & `Plus Jakarta Sans`

## 📱 Modules Included
1. **Module 1: Public Digital Business Card (vCard)**
   - Interactive iOS mobile phone container frame with notch/dynamic island & expanded mode toggle
   - Profile Header: glowing avatar ring, category badge, verified partner pill (`👑`), live open/closed status, rating summary pill
   - Real-time notice marquee ticker banner
   - Automated hosting expiry warning banner (<24h)
   - Quick contact launcher: Call, WhatsApp, Email, Location (Google Maps), Website
   - Promotional offer card with `Claim Offer ⚡` WhatsApp trigger
   - 5 Core Navigation Tabs:
     - **Home**: About story, consultation fee badge, highlight stats, address map
     - **Services**: Filterable catalog, multi-select checkboxes, sticky quote bar, itemized WhatsApp quote modal
     - **Shop**: E-Commerce product cards with `+`/`-` quantity selector, floating cart bar, WhatsApp order checkout modal
     - **Calendar**: Interactive monthly calendar, time-slot selector (`09:00 AM`–`06:00 PM`), service selector, client details form (saves to DB + opens WhatsApp confirmation)
     - **Reviews**: Rating score card, review cards, `Write a Review ★` modal with 1–5 star picker, feedback tags, and real-time submission
2. **Module 2: Vendor Self-Service Console**
   - WhatsApp Number + 4-digit PIN authentication
   - Profile & Branding editor (Name, category, tagline, contacts, consultation fee)
   - Theme selector (`Sunset Dark`, `Peach Cream`, `Glamour Red`, `Emerald Green`, `Ocean Blue`, `Flipkart Blue`, `Custom`)
   - Custom hex color pickers & emoji picker
   - Services catalog manager (CRUD)
   - Shop products manager (CRUD)
   - Bookings manager (Status updates: Pending/Confirmed/Completed/Cancelled & direct WhatsApp reply)
   - Reviews manager (moderation & feedback tag chips editor)
3. **Module 3: Super Admin Management Console**
   - Master PIN auth (`1234`)
   - KPI dashboard overview (Total Cards, Active Cards, Revenue, Subscriptions)
   - Vendor user directory (Search, filter by status, suspend, extend expiry +30d, delete)
   - Create new vendor card with 1-click template presets (`Salon`, `Restaurant`, `Catering`, `Doctor`, `Tutor`, `Grocery`, `Real Estate`, `Custom`) & granular feature toggles
   - Subscription plans manager (CRUD)
   - Platform settings & full JSON database backup/export & restore
4. **Module 4: Core Technical Features & PWA**
   - Service Worker (`sw.js`) for offline asset caching
   - Dynamic Web App Manifest (`manifest.webmanifest`)
   - WhatsApp deep-linking engine with clean markdown formatting
   - LocalStorage cache layer + Firebase Realtime DB dual-sync compatibility
