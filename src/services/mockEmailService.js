/**
 * Centralized Mock Email Service
 * Replaces external EmailJS, SMTP, and Nodemailer providers.
 * Stores all dispatched emails in LocalStorage without external network calls.
 */

const STORAGE_KEY = "market_mode_sent_emails";

const getStoredEmails = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Failed to read mock email storage:", err);
    return [];
  }
};

const saveStoredEmails = (emails) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
  } catch (err) {
    console.warn("Failed to save mock email storage:", err);
  }
};

export const mockEmailService = {
  /**
   * Simulate sending an email (drop-in replacement for emailjs.send)
   */
  async sendEmail(serviceIdOrParams, templateId, templateParams, publicKey) {
    let emailData = {};

    if (typeof serviceIdOrParams === "object" && serviceIdOrParams !== null) {
      emailData = serviceIdOrParams;
    } else {
      emailData = {
        serviceId: serviceIdOrParams,
        templateId,
        publicKey,
        ...(templateParams || {})
      };
    }

    const emailRecord = {
      id: `DEMO-MAIL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      to: emailData.to_email || emailData.to || "customer@example.com",
      replyTo: emailData.reply_to || "sales@marketmode.demo",
      customerName: emailData.customer_name || emailData.customerName || "Customer",
      enquiryNumber: emailData.enquiry_number || emailData.enquiryNumber || "N/A",
      productName: emailData.product_name || emailData.productName || "Solar System",
      quotationLink: emailData.quotation_link || emailData.quotationLink || null,
      subject: emailData.subject || `Quotation - Enquiry #${emailData.enquiry_number || "DEMO"}`,
      body: emailData.body || emailData.message || `Solar Quotation Document for ${emailData.customer_name || "Customer"}`,
      status: "sent",
      timestamp: new Date().toISOString(),
      isDemo: true
    };

    const emails = getStoredEmails();
    emails.unshift(emailRecord);
    saveStoredEmails(emails);

    console.log(`[Demo Email] Simulated email to ${emailRecord.to} (${emailRecord.subject})`);

    // Return EmailJS compatible response object
    return {
      status: 200,
      text: "OK",
      success: true,
      data: emailRecord
    };
  },

  /**
   * Helper for direct mailto simulation (e.g. from Followup page)
   */
  sendEmailDirect(to, subject, body) {
    return this.sendEmail({
      to_email: to,
      subject: subject || "Notification",
      body: body || ""
    });
  },

  /**
   * Get all sent demo emails
   */
  getEmails() {
    return getStoredEmails();
  },

  /**
   * Clear all stored demo emails
   */
  clearEmails() {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export default mockEmailService;

