/**
 * Centralized Mock API Service & Offline Network Interceptor
 * 
 * 1. Simulates Google Apps Script endpoints (action=fetch, action=insert, action=update, etc.)
 *    for sheets: "Inverter_id", "FMS", "Drop-Down Value", "Energy analysis".
 * 2. Automatically intercepts any window.fetch() calls to external APIs:
 *    - https://gateway.isolarcloud.com.hk/*
 *    - https://script.google.com/*
 *    - http://localhost:3000/api/solar/*
 *    - https://graph.facebook.com/*
 *    guaranteeing 100% offline local demo operation without breaking changes.
 */

import mockSolarService from "./mockSolarService.js";
import mockWhatsAppService from "./mockWhatsAppService.js";
import mockEmailService from "./mockEmailService.js";
import { getAllItems } from "../lib/storage.js";

const ENERGY_ANALYSIS_KEY = "market_mode_energy_analysis";

// Seed realistic energy analysis records if not present
const getEnergyAnalysisRecords = () => {
  try {
    const raw = localStorage.getItem(ENERGY_ANALYSIS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Error reading energy analysis records:", e);
  }

  // Pre-seed 30 days of data for rich graphs
  const seed = [];
  const beneficiaries = [
    { name: "Chetan Sahoo", enq: "ENQ-1001", base: 18.5 },
    { name: "Rajesh Kumar", enq: "ENQ-1002", base: 14.2 },
    { name: "Anita Patel", enq: "ENQ-1003", base: 22.0 },
    { name: "Sunil Verma", enq: "ENQ-1004", base: 11.5 }
  ];

  const now = new Date();
  for (let d = 30; d >= 0; d--) {
    const dt = new Date(now.getTime() - d * 86400000);
    const dateStr = dt.toISOString().split("T")[0];
    const dayOfMonth = dt.getDate();

    beneficiaries.forEach((b, bIdx) => {
      const variation = Math.sin((dayOfMonth + bIdx) * 0.8) * 3.5;
      const production = (b.base + variation).toFixed(2);
      seed.push({
        timestamp: `${dateStr} 18:30:00`,
        enquiryNumber: b.enq,
        beneficiaryName: b.name,
        energyDate: dateStr,
        production: String(production)
      });
    });
  }

  try {
    localStorage.setItem(ENERGY_ANALYSIS_KEY, JSON.stringify(seed));
  } catch (e) {}

  return seed;
};

export const mockApiService = {
  /**
   * Handle simulated Google Sheets fetch/insert/update
   */
  handleGoogleSheetsRequest(url, options = {}) {
    let urlObj;
    try {
      urlObj = new URL(url, "https://mock.local");
    } catch {
      urlObj = { searchParams: new URLSearchParams(url.includes("?") ? url.split("?")[1] : "") };
    }

    let action = urlObj.searchParams.get("action") || "fetch";
    let sheetName = urlObj.searchParams.get("sheet") || "";

    let bodyData = null;
    if (options.body) {
      if (typeof options.body === "string") {
        try {
          const params = new URLSearchParams(options.body);
          if (params.get("action")) action = params.get("action");
          if (params.get("sheetName")) sheetName = params.get("sheetName");
          bodyData = Object.fromEntries(params.entries());
        } catch {
          try {
            bodyData = JSON.parse(options.body);
            if (bodyData.action) action = bodyData.action;
            if (bodyData.sheetName) sheetName = bodyData.sheetName;
          } catch {}
        }
      }
    }

    // Handle sendWhatsAppAlerts
    if (action === "sendWhatsAppAlerts") {
      let alertList = [];
      try {
        alertList = JSON.parse(bodyData?.data || "[]");
      } catch {}
      mockWhatsAppService.sendLowGenerationAlerts(alertList);
      return { success: true, message: "Alerts recorded in demo LocalStorage" };
    }

    // Handle Insert
    if (action === "insert") {
      if (sheetName.toLowerCase().includes("energy")) {
        let rowObj = {};
        try {
          rowObj = JSON.parse(bodyData?.rowData || "{}");
        } catch {}

        const list = getEnergyAnalysisRecords();
        list.push({
          timestamp: rowObj.timestamp || new Date().toISOString(),
          enquiryNumber: rowObj.enquiryNumber || "ENQ-DEMO",
          beneficiaryName: rowObj.beneficiaryName || "Customer",
          energyDate: rowObj.energyDate || new Date().toISOString().split("T")[0],
          production: String(rowObj.production || "15.0")
        });
        localStorage.setItem(ENERGY_ANALYSIS_KEY, JSON.stringify(list));
      }
      return { success: true, message: "Demo record inserted successfully" };
    }

    // Handle Update
    if (action === "update") {
      return { success: true, message: "Demo record updated successfully" };
    }

    // Handle Fetch
    if (sheetName === "Inverter_id") {
      const inverters = getAllItems("Inverter_id") || [];
      return {
        status: "success",
        success: true,
        data: inverters,
        values: inverters.map(inv => [
          inv.timestamp || "",
          inv.beneficiary_name || "",
          inv.inverter_id || "",
          inv.inverter_capacity || "",
          inv.contact_number || ""
        ]),
        table: {
          rows: inverters.map(inv => ({
            c: [
              { v: inv.timestamp || "" },
              { v: inv.beneficiary_name || "" },
              { v: inv.inverter_id || "" },
              { v: inv.inverter_capacity || "" },
              { v: inv.contact_number || "" }
            ]
          }))
        }
      };
    }

    if (sheetName === "Energy analysis" || sheetName.toLowerCase().includes("energy")) {
      const records = getEnergyAnalysisRecords();
      return {
        status: "success",
        success: true,
        data: records,
        values: records.map(r => [
          r.timestamp,
          r.enquiryNumber,
          r.beneficiaryName,
          r.energyDate,
          r.production
        ]),
        table: {
          rows: [
            // header row
            { c: [{ v: "Timestamp" }, { v: "Enquiry Number" }, { v: "Beneficiary Name" }, { v: "Energy Date" }, { v: "Production" }] },
            ...records.map(r => ({
              c: [
                { v: r.timestamp },
                { v: r.enquiryNumber },
                { v: r.beneficiaryName },
                { v: r.energyDate },
                { v: r.production }
              ]
            }))
          ]
        }
      };
    }

    if (sheetName === "Drop-Down Value") {
      const dropdowns = [
        ["Active"],
        ["Pending"],
        ["Completed"],
        ["In Progress"],
        ["Approved"],
        ["Rejected"]
      ];
      return {
        status: "success",
        success: true,
        values: dropdowns,
        table: {
          rows: dropdowns.map(d => ({ c: [{ v: d[0] }] }))
        }
      };
    }

    if (sheetName === "FMS") {
      const enquiries = getAllItems("enquiries") || [];
      return {
        status: "success",
        success: true,
        data: enquiries,
        values: enquiries.map(e => [
          e.timestamp || "",
          e.enquiry_number || "",
          e.beneficiary_name || "",
          e.contact_number || "",
          e.address || "",
          e.present_load || ""
        ]),
        table: {
          rows: [
            { c: [{ v: "Timestamp" }, { v: "Enquiry Number" }, { v: "Beneficiary Name" }, { v: "Contact Number" }, { v: "Address" }, { v: "Present Load" }] },
            ...enquiries.map(e => ({
              c: [
                { v: e.timestamp || "" },
                { v: e.enquiry_number || "" },
                { v: e.beneficiary_name || "" },
                { v: e.contact_number || "" },
                { v: e.address || "" },
                { v: e.present_load || "" }
              ]
            }))
          ]
        }
      };
    }

    return { status: "success", success: true, table: { rows: [] } };
  },

  /**
   * Install global offline fetch interceptor
   */
  installMockFetchInterceptor() {
    if (typeof window === "undefined" || window.__OFFLINE_MOCK_INSTALLED__) return;
    window.__OFFLINE_MOCK_INSTALLED__ = true;

    const originalFetch = window.fetch;

    window.fetch = async function (input, init = {}) {
      const urlString = typeof input === "string" ? input : (input?.url || "");

      // 1. Intercept iSolarCloud OpenAPI
      if (urlString.includes("isolarcloud.com") || urlString.includes("/api/solar/")) {
        let body = {};
        if (init.body) {
          try {
            body = typeof init.body === "string" ? JSON.parse(init.body) : init.body;
          } catch {}
        }

        let mockResult;
        if (urlString.includes("/login")) {
          mockResult = await mockSolarService.login(body);
        } else if (urlString.includes("/getPVInverterRealTimeData") || urlString.includes("/inverter-data")) {
          mockResult = await mockSolarService.getPVInverterRealTimeData(body);
        } else if (urlString.includes("/getDevicePointMinuteDataList")) {
          mockResult = await mockSolarService.getDevicePointMinuteDataList(body);
        } else if (urlString.includes("/getDevicePointsDayMonthYearDataList")) {
          mockResult = await mockSolarService.getDevicePointsDayMonthYearDataList(body);
        } else {
          mockResult = { result_code: "1", result_msg: "success", result_data: {} };
        }

        return new Response(JSON.stringify(mockResult), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 2. Intercept Google Apps Script URLs
      if (urlString.includes("script.google.com") || urlString.includes("macros/s/")) {
        const mockResult = mockApiService.handleGoogleSheetsRequest(urlString, init);
        return new Response(JSON.stringify(mockResult), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 3. Intercept WhatsApp Cloud Graph API
      if (urlString.includes("graph.facebook.com")) {
        let body = {};
        try {
          body = typeof init.body === "string" ? JSON.parse(init.body) : init.body;
        } catch {}

        const mockResult = await mockWhatsAppService.sendQuotationWhatsApp({
          phone: body?.to,
          customerName: body?.template?.components?.[0]?.parameters?.[0]?.text
        });

        return new Response(JSON.stringify(mockResult), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Normal internal fetch (e.g., local assets)
      return originalFetch.apply(this, arguments);
    };

    console.log("[Offline Demo] Global offline API mock interceptor active.");
  }
};

export default mockApiService;
