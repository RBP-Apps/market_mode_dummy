/**
 * Centralized Mock WhatsApp Service
 * Provides simulated WhatsApp message dispatch and tracking for demo mode.
 * Stores all dispatched messages in LocalStorage without any external network calls.
 */

const STORAGE_KEY = "market_mode_whatsapp_messages";

const getStoredMessages = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Failed to read mock WhatsApp storage:", err);
    return [];
  }
};

const saveStoredMessages = (messages) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (err) {
    console.warn("Failed to save mock WhatsApp storage:", err);
  }
};

export const mockWhatsAppService = {
  /**
   * Simulate sending a quotation via WhatsApp
   */
  async sendQuotationWhatsApp({ phone, customerName, pdfUrl } = {}) {
    let cleanPhone = String(phone || "").replace(/\D/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    const messageRecord = {
      id: `DEMO-WA-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      phone: cleanPhone || "919999999999",
      customerName: customerName || "Valued Customer",
      template: "send_qoutation_market_mode",
      pdfUrl: pdfUrl || null,
      type: "quotation",
      status: "sent",
      timestamp: new Date().toISOString(),
      isDemo: true,
      previewText: `Dear ${customerName || "Customer"}, here is your solar quotation document.`
    };

    const messages = getStoredMessages();
    messages.unshift(messageRecord);
    saveStoredMessages(messages);

    console.log(`[Demo WhatsApp] Quotation message simulated for ${messageRecord.customerName} (${messageRecord.phone})`);

    // Return structure matching WhatsApp Cloud API / Edge function response
    return {
      success: true,
      messaging_product: "whatsapp",
      contacts: [{ input: cleanPhone, wa_id: cleanPhone }],
      messages: [{ id: messageRecord.id, message_status: "accepted" }]
    };
  },

  /**
   * Simulate direct WhatsApp messaging (replaces window.open whatsapp web links)
   */
  sendWhatsAppDirect(phone, text, metadata = {}) {
    let cleanPhone = String(phone || "").replace(/\D/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    const messageRecord = {
      id: `DEMO-WA-DIR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      phone: cleanPhone,
      text: text || "",
      type: "direct",
      status: "sent",
      timestamp: new Date().toISOString(),
      isDemo: true,
      ...metadata
    };

    const messages = getStoredMessages();
    messages.unshift(messageRecord);
    saveStoredMessages(messages);

    console.log(`[Demo WhatsApp Direct] Simulated message to ${cleanPhone}: "${text?.substring(0, 40)}..."`);
    return { success: true, messageId: messageRecord.id };
  },

  /**
   * Simulate batch low generation alert dispatch
   */
  async sendLowGenerationAlerts(alertList = []) {
    const messages = getStoredMessages();
    const timestamp = new Date().toISOString();

    const created = alertList.map((item) => ({
      id: `DEMO-WA-ALERT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      phone: item.contactNumber || "N/A",
      customerName: item.beneficiaryName,
      inverterId: item.inverterId,
      specYield: item.specYield,
      capacity: item.capacity,
      message: item.message,
      type: "low_generation_alert",
      status: "sent",
      timestamp,
      isDemo: true
    }));

    messages.unshift(...created);
    saveStoredMessages(messages);

    console.log(`[Demo WhatsApp] Simulated ${created.length} low generation alerts.`);
    return { success: true, count: created.length, data: created };
  },

  /**
   * Get all dispatched demo WhatsApp messages
   */
  getMessages() {
    return getStoredMessages();
  },

  /**
   * Clear all stored demo WhatsApp messages
   */
  clearMessages() {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export default mockWhatsAppService;

