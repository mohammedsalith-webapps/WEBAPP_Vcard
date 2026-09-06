// WhatsApp Deep-Linking Engine
// Generates beautifully formatted Markdown strings for WhatsApp chats

export const WhatsAppEngine = {
  cleanPhone(phone) {
    if (!phone) return "";
    return phone.toString().replace(/[^\d]/g, "");
  },

  getLink(phone, text) {
    const clean = this.cleanPhone(phone);
    const encoded = encodeURIComponent(text);
    return `https://api.whatsapp.com/send?phone=${clean}&text=${encoded}`;
  },

  // Open WhatsApp in a new tab/window
  openChat(phone, text) {
    const url = this.getLink(phone, text);
    window.open(url, "_blank", "noopener,noreferrer");
  },

  // 1. Service Quote Request
  buildQuoteMessage(vendor, selectedServices, client = {}) {
    const lines = selectedServices.map((srv, index) => {
      const cat = srv.category ? ` [${srv.category}]` : "";
      return `${index + 1}. *${srv.name}*${cat}`;
    });

    const itemsText = lines.join("\n\n");
    const now = new Date().toLocaleString();
    const srvCount = selectedServices.length;

    return `*📋 NEW SERVICE QUOTE REQUEST (${srvCount} Service${srvCount > 1 ? 's' : ''})*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Business:* ${vendor.branding.businessName}\n` +
      (client.name ? `*Client Name:* ${client.name}\n` : "") +
      (client.phone ? `*Contact Phone:* ${client.phone}\n` : "") +
      (client.eventDate ? `*Preferred Date / Timeline:* ${client.eventDate}\n` : "") +
      (client.notes ? `*Requirements & Scope:* ${client.notes}\n` : "") +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*SELECTED SERVICES TO QUOTE:*\n\n${itemsText}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💬 *Request:* Please provide a customized quote / proposal for the selected service(s).\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Sent via ${vendor.branding.businessName} Smart vCard on ${now}_\n` +
      `_Awaiting your custom quotation & availability._`;
  },

  // 2. E-Commerce Cart Order
  buildOrderMessage(vendor, cartItems, client = {}) {
    const currency = vendor.currency || "₹";
    let total = 0;
    const lines = cartItems.map((item, index) => {
      const lineTotal = item.price * item.quantity;
      total += lineTotal;
      const emoji = item.emoji ? `${item.emoji} ` : "";
      return `${index + 1}. ${emoji}*${item.name}*\n   ↳ ${item.quantity} ${item.unit || "unit(s)"} × ${currency}${item.price} = *${currency}${lineTotal.toLocaleString()}*`;
    });

    const itemsText = lines.join("\n\n");
    const now = new Date().toLocaleString();

    return `*🛍️ NEW PRODUCT ORDER*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Store:* ${vendor.branding.businessName}\n` +
      (client.name ? `*Customer:* ${client.name}\n` : "") +
      (client.phone ? `*Customer WhatsApp:* ${client.phone}\n` : "") +
      (client.address ? `*Delivery / Table / Notes:* ${client.address}\n` : "") +
      (client.notes ? `*Order Instructions:* ${client.notes}\n` : "") +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*ORDERED ITEMS:*\n\n${itemsText}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*TOTAL PAYABLE:* *${currency}${total.toLocaleString()}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Order placed on ${now} via Smart vCard PWA_\n` +
      `_Kindly confirm delivery timeline and payment options._`;
  },

  // 3. Appointment & Booking Confirmation
  buildBookingMessage(vendor, booking = {}) {
    const currency = vendor.currency || "₹";
    const now = new Date().toLocaleString();

    return `*📅 NEW APPOINTMENT BOOKING*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Provider:* ${vendor.branding.businessName}\n` +
      (booking.clientName && booking.clientName !== "WhatsApp Client" ? `*Client:* ${booking.clientName}\n` : "") +
      (booking.clientPhone ? `*Phone:* ${booking.clientPhone}\n` : "") +
      `*Service:* *${booking.service}*\n` +
      `*Date:* 🗓️ *${booking.date}*\n` +
      `*Time Slot:* ⏰ *${booking.timeSlot}*\n` +
      (vendor.about?.consultationFee ? `*Consultation Fee:* ${currency}${vendor.about.consultationFee}\n` : "") +
      (booking.notes ? `*Client Notes:* ${booking.notes}\n` : "") +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Appointment request logged on ${now}_\n` +
      `_Please acknowledge and send confirmation._`;
  },

  // 4. Claim Offer Deal
  buildClaimOfferMessage(vendor, promo, clientName = "") {
    return `*⚡ CLAIMING PROMO OFFER: ${promo.code || promo.badge}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Hello *${vendor.branding.businessName}* team!\n\n` +
      `I would like to claim your limited-time offer:\n` +
      `🏷️ *${promo.title}*\n` +
      `🎁 *Details:* ${promo.discount}\n` +
      `🔑 *Offer Code:* \`${promo.code}\`\n` +
      (clientName ? `👤 *My Name:* ${clientName}\n` : "") +
      `\nPlease let me know how I can redeem this offer. Thank you!`;
  },

  // 5. Vendor Direct Reply to Client
  buildVendorReply(vendor, clientName, message) {
    return `Hello ${clientName || "there"}, this is *${vendor.branding.businessName}*:\n\n${message}`;
  }
};
