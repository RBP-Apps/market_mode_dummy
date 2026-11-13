// src/services/storageService.js
// Centralized Data and Database Service using LocalStorage and IndexedDB

import {
  getItem,
  setItem,
  updateItem,
  deleteItem,
  getAllItems,
  clearStorage,
  initializeStorage,
  saveFile,
  getFile,
  getFileUrlSync,
  deleteFile,
  subscribeToStorage,
} from "../lib/storage.js";
import mockWhatsAppService from "./mockWhatsAppService.js";

// ==========================================
// Default Seed Data
// ==========================================

const defaultUsers = [
  {
    id: 1,
    username: "admin",
    name: "Administrator",
    password: "admin",
    role: "admin",
    page: "ALL",
    access: true,
    department: "ALL",
    given_by: "System",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    username: "sahoo@rbpindia.com",
    name: "Sahoo",
    password: "rbpindia@2025",
    role: "admin",
    page: "ALL",
    access: true,
    department: "ALL",
    given_by: "System",
    created_at: new Date().toISOString(),
  },
];

const defaultDropdowns = [
  {
    id: 1,
    structure_type: "Standard",
    roof_type: "RCC Roof",
    system_type: "On-Grid",
    need_type: "Residential",
    project_mode: "CAPEX",
    vendor_name: "RBP Solar",
    stage: "Initial Discussion",
    follow_up: "Interested",
    status: "Active",
    inverter_make: "Sungrow",
    inverter_capacity: "3 kW",
    module_make: "Tata Power",
    module_capacity: "540W",
    module_type: "Mono PERC",
    structure_make: "GI Standard",
    phase: "Single Phase",
  },
  {
    id: 2,
    structure_type: "Elevated",
    roof_type: "Metal Sheet",
    system_type: "Off-Grid",
    need_type: "Commercial",
    project_mode: "RESCO",
    vendor_name: "SolarTech",
    stage: "Survey Done",
    follow_up: "Call Scheduled",
    status: "Active",
    inverter_make: "Growatt",
    inverter_capacity: "5 kW",
    module_make: "Adani Solar",
    module_capacity: "550W",
    module_type: "TOPCon",
    structure_make: "Elevated GI",
    phase: "Three Phase",
  },
  {
    id: 3,
    structure_type: "High Rise",
    roof_type: "Tiled Roof",
    system_type: "Hybrid",
    need_type: "Industrial",
    project_mode: "CAPEX",
    vendor_name: "EcoPower",
    stage: "Quotation Sent",
    follow_up: "Follow Up Required",
    status: "Active",
    inverter_make: "SolarEdge",
    inverter_capacity: "10 kW",
    module_make: "Waaree",
    module_capacity: "575W",
    module_type: "Bifacial",
    structure_make: "Custom Heavy Duty",
    phase: "Three Phase",
  },
  {
    id: 4,
    structure_type: "Tin Shade",
    roof_type: "Asbestos Sheet",
    system_type: "On-Grid",
    need_type: "Institutional",
    project_mode: "CAPEX",
    vendor_name: "Tata Power Solar",
    stage: "Order Placed",
    follow_up: "Not Interested",
    status: "Active",
    inverter_make: "GoodWe",
    inverter_capacity: "15 kW",
    module_make: "Vikram Solar",
    module_capacity: "580W",
    module_type: "Mono PERC",
    structure_make: "Tin Shade Clamp",
    phase: "Three Phase",
  },
];

const defaultMaster2 = [
  {
    id: 1,
    dealer: "RBP Solar Energy Pvt Ltd",
    address: "VIP Road, Raipur, Chhattisgarh 492001",
    contact: "9876543210",
    our_bank_name: "HDFC Bank",
    account_no: "50200012345678",
    ifsc_code: "HDFC0001234",
    branch: "Raipur Main Branch",
  },
];

const defaultProducts = [
  {
    id: 1,
    product_code: "SP-3KW-OG",
    product_name: "3 kW On-Grid Solar System",
    category: "Solar System",
    capacity: 3,
    capacity_unit: "kW",
    selling_price: 180000,
    center_subsidy: 78000,
    state_subsidy: 0,
    status: "Active",
  },
  {
    id: 2,
    product_code: "SP-5KW-OG",
    product_name: "5 kW On-Grid Solar System",
    category: "Solar System",
    capacity: 5,
    capacity_unit: "kW",
    selling_price: 280000,
    center_subsidy: 78000,
    state_subsidy: 0,
    status: "Active",
  },
  {
    id: 3,
    product_code: "SP-10KW-OG",
    product_name: "10 kW On-Grid Solar System",
    category: "Solar System",
    capacity: 10,
    capacity_unit: "kW",
    selling_price: 520000,
    center_subsidy: 78000,
    state_subsidy: 0,
    status: "Active",
  },
];

const defaultQuotes = [
  {
    id: 1,
    mode: "CAPEX",
    module_type: "Mono PERC",
    structure: "Standard",
    phase: "Single Phase",
    capacity_kwp: "3",
    pv_modules: "6 x 540W Mono PERC",
    inverter: "3 kW Grid-Tied Inverter",
    rate_per_watt: "42",
    system_cost: "180000",
    center_subsidy: "78000",
    net_cost: "102000",
    spec_part_1: "Tier 1 Solar Modules with 25 Years Performance Warranty",
    spec_part_2: "Grid-Tied String Inverter with 5 Years Standard Warranty",
  },
  {
    id: 2,
    mode: "CAPEX",
    module_type: "Mono PERC",
    structure: "Elevated",
    phase: "Three Phase",
    capacity_kwp: "5",
    pv_modules: "10 x 540W Mono PERC",
    inverter: "5 kW Grid-Tied Inverter",
    rate_per_watt: "40",
    system_cost: "280000",
    center_subsidy: "78000",
    net_cost: "202000",
    spec_part_1: "High Efficiency Modules with Anti-Reflective Coating",
    spec_part_2: "Three-Phase Inverter with Built-in WiFi Monitoring",
  },
  {
    id: 3,
    mode: "CAPEX",
    module_type: "TOPCon",
    structure: "Standard",
    phase: "Three Phase",
    capacity_kwp: "10",
    pv_modules: "18 x 575W N-Type TOPCon",
    inverter: "10 kW Grid-Tied Inverter",
    rate_per_watt: "38",
    system_cost: "520000",
    center_subsidy: "78000",
    net_cost: "442000",
    spec_part_1: "N-Type TOPCon High Yield Modules with Lower Degradation",
    spec_part_2: "Heavy Duty Dual MPPT Inverter with Surge Protection",
  },
];

const defaultInverters = [
  {
    id: 1,
    serial_no: "1",
    inverter_id: "INV-RBP-001",
    beneficiary_name: "Ramesh Sharma",
    capacity: "5 kW",
    plant_name: "Sharma Residence 5kW",
  },
  {
    id: 2,
    serial_no: "2",
    inverter_id: "INV-RBP-002",
    beneficiary_name: "Sunil Verma",
    capacity: "10 kW",
    plant_name: "Verma Enterprise 10kW",
  },
];

// Initialize seed data if not present
initializeStorage({
  login: defaultUsers,
  dropdown: defaultDropdowns,
  Master2: defaultMaster2,
  product_list: defaultProducts,
  solar_systems_quote_list: defaultQuotes,
  Inverter_id: defaultInverters,
});

// ==========================================
// Lifecycle Triggers & Inter-module Relations
// ==========================================

const LIFECYCLE_TABLES = [
  "site_surveys",
  "new_quatation_create",
  "new_new_quatation_create",
  "quatation_10kw",
  "sales_calls",
  "order_placements",
  "ip_assignments",
  "dispatch_materials",
  "customer_notifications",
  "material_receipts",
  "installations",
  "billings",
  "documents_uploads",
  "project_insurance",
  "subsidy_disbursals",
  "subsidy_redemptions",
  "inspections",
  "qc",
  "registration",
  "payments",
  "payment_confirmations",
  "project_commissions",
  "dcr_creation",
  "dispatch_planner",
];

/**
 * Calculates days between actual and planned dates
 */
function calculateDelayDays(actualDate, plannedDate) {
  if (!actualDate || !plannedDate) return null;
  try {
    const act = new Date(actualDate);
    const plan = new Date(plannedDate);
    if (isNaN(act.getTime()) || isNaN(plan.getTime())) return null;
    const diffTime = act.getTime() - plan.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return String(diffDays);
  } catch (_e) {
    return null;
  }
}

/**
 * Generate next enquiry number EN-XXX based on existing numbers
 */
function generateNextEnquiryNumber() {
  const enquiries = getAllItems("enquiries");
  let maxNum = 0;
  enquiries.forEach((item) => {
    if (item.enquiry_number && typeof item.enquiry_number === "string") {
      const match = item.enquiry_number.match(/^EN-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `EN-${String(nextNum).padStart(3, "0")}`;
}

/**
 * Execute hooks on insert into a table
 */
function handleBeforeInsert(table, row) {
  const items = getAllItems(table);
  let maxId = 0;
  items.forEach((item) => {
    const id = parseInt(item.id, 10);
    if (!isNaN(id) && id > maxId) maxId = id;
  });

  const nextId = row.id ? row.id : maxId + 1;
  const processed = { ...row, id: nextId };

  if (table === "enquiries") {
    if (!processed.enquiry_number) {
      processed.enquiry_number = generateNextEnquiryNumber();
    }
    if (!processed.timestamp) {
      processed.timestamp = new Date().toISOString();
    }
  }

  return processed;
}

/**
 * Execute hooks after insert into a table
 */
function handleAfterInsert(table, insertedRow) {
  if (table === "enquiries") {
    const plannedDate = insertedRow.timestamp
      ? new Date(insertedRow.timestamp).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    // 1. Assign survey table (keyed on enquiry_id)
    const assignSurveyItems = getAllItems("assign_survey");
    const existingAssignSurvey = assignSurveyItems.find(
      (a) => String(a.enquiry_id) === String(insertedRow.id)
    );
    if (!existingAssignSurvey) {
      let maxAsId = 0;
      assignSurveyItems.forEach((a) => {
        const num = parseInt(a.id, 10);
        if (num > maxAsId) maxAsId = num;
      });
      assignSurveyItems.push({
        id: maxAsId + 1,
        enquiry_id: insertedRow.id,
        planned_1: plannedDate,
        created_at: new Date().toISOString(),
      });
      setItem("assign_survey", assignSurveyItems);
    }

    // 2. Lifecycle tables (keyed on enquiry_number)
    LIFECYCLE_TABLES.forEach((ltTable) => {
      const ltItems = getAllItems(ltTable);
      const existing = ltItems.find(
        (item) => String(item.enquiry_number) === String(insertedRow.enquiry_number)
      );
      if (!existing) {
        let maxLtId = 0;
        ltItems.forEach((item) => {
          const num = parseInt(item.id, 10);
          if (num > maxLtId) maxLtId = num;
        });
        ltItems.push({
          id: maxLtId + 1,
          enquiry_number: insertedRow.enquiry_number,
          planned: plannedDate,
          created_at: new Date().toISOString(),
        });
        setItem(ltTable, ltItems);
      }
    });

    // 3. Keep fms synchronized
    const fmsItems = getAllItems("fms");
    const existingFms = fmsItems.find(
      (item) => String(item.enquiry_number) === String(insertedRow.enquiry_number)
    );
    if (!existingFms) {
      fmsItems.push({
        ...insertedRow,
        id: insertedRow.id,
        enquiry_number: insertedRow.enquiry_number,
      });
      setItem("fms", fmsItems);
    }
  }
}

/**
 * Execute hooks on update of a table
 */
function handleBeforeUpdate(table, row, updates) {
  const merged = { ...row, ...updates };

  // Calculate delay if actual date is updated
  if (merged.actual && merged.planned && updates.actual !== undefined) {
    merged.delay = calculateDelayDays(merged.actual, merged.planned);
  }
  if (merged.actual_1 && merged.planned_1 && updates.actual_1 !== undefined) {
    merged.delay_1 = calculateDelayDays(merged.actual_1, merged.planned_1);
  }

  return merged;
}

/**
 * Execute hooks after update of a table
 */
function handleAfterUpdate(table, updatedRow) {
  if (table === "enquiries" && updatedRow.enquiry_number) {
    // Keep fms in sync
    updateItem("fms", (item) => String(item.enquiry_number) === String(updatedRow.enquiry_number), {
      ...updatedRow,
    });
  }
}

// ==========================================
// Relational Join Resolver
// ==========================================

function resolveJoins(table, row, selectString) {
  if (!selectString || selectString === "*") return row;

  const result = { ...row };

  // Check for join patterns:
  // 1) enquiries:enquiry_id (*)
  // 2) enquiries:enquiry_number (*)
  // 3) enquiries!left (...)
  // 4) new_quatation_create!left(*)

  // 1 & 2: Alias joins e.g. enquiries:enquiry_id (*) or enquiries:enquiry_number (*)
  const aliasJoinMatches = [...selectString.matchAll(/([a-zA-Z0-9_]+):([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g)];
  aliasJoinMatches.forEach((m) => {
    const targetTable = m[1];
    const foreignKey = m[2];
    const columnsStr = m[3].trim();

    const targetItems = getAllItems(targetTable);
    const foreignVal = row[foreignKey];

    let matchedTarget = null;
    if (foreignKey === "enquiry_id") {
      matchedTarget = targetItems.find((item) => String(item.id) === String(foreignVal));
    } else {
      matchedTarget = targetItems.find((item) => String(item[foreignKey]) === String(foreignVal));
    }

    if (matchedTarget) {
      if (columnsStr === "*" || !columnsStr) {
        result[targetTable] = { ...matchedTarget };
      } else {
        const selectedCols = columnsStr.split(",").map((c) => c.trim()).filter(Boolean);
        const projected = {};
        selectedCols.forEach((col) => {
          projected[col] = matchedTarget[col];
        });
        result[targetTable] = projected;
      }
    } else {
      result[targetTable] = null;
    }
  });

  // 3: Explicit left joins e.g. enquiries!left ( col1, col2, ... )
  const leftJoinMatches = [...selectString.matchAll(/([a-zA-Z0-9_]+)!left\s*\(([^)]*)\)/g)];
  leftJoinMatches.forEach((m) => {
    const targetTable = m[1];
    const columnsStr = m[2].trim();

    const targetItems = getAllItems(targetTable);
    let matchedTarget = null;

    if (targetTable === "enquiries") {
      if (row.enquiry_number) {
        matchedTarget = targetItems.find(
          (item) => String(item.enquiry_number) === String(row.enquiry_number)
        );
      } else if (row.enquiry_id) {
        matchedTarget = targetItems.find(
          (item) => String(item.id) === String(row.enquiry_id)
        );
      }
    } else if (targetTable === "new_quatation_create") {
      if (row.enquiry_number) {
        matchedTarget = targetItems.find(
          (item) => String(item.enquiry_number) === String(row.enquiry_number)
        );
      }
    }

    if (matchedTarget) {
      if (columnsStr === "*" || !columnsStr) {
        result[targetTable] = { ...matchedTarget };
      } else {
        const selectedCols = columnsStr.split(",").map((c) => c.trim()).filter(Boolean);
        const projected = {};
        selectedCols.forEach((col) => {
          projected[col] = matchedTarget[col];
        });
        result[targetTable] = projected;
      }
    } else {
      result[targetTable] = null;
    }
  });

  return result;
}

/**
 * Filter columns based on select projection string (if not *)
 */
function projectColumns(row, selectString) {
  if (!selectString || selectString.includes("*")) {
    return row;
  }
  // Strip joins like enquiries(...)
  const cleaned = selectString.replace(/[a-zA-Z0-9_]+(!left)?(:[a-zA-Z0-9_]+)?\s*\([^)]*\)/g, "");
  const cols = cleaned.split(",").map((c) => c.trim()).filter(Boolean);
  if (!cols.length) return row;

  const projected = {};
  cols.forEach((col) => {
    if (col in row) {
      projected[col] = row[col];
    }
  });
  return projected;
}

// ==========================================
// Query Builder Class
// ==========================================

export class QueryBuilder {
  constructor(table) {
    this.table = table;
    this._selectCols = "*";
    this._selectOptions = null;
    this._filters = [];
    this._orderBys = [];
    this._limit = null;
    this._range = null;
    this._isSingle = false;
    this._isMaybeSingle = false;
    this._operation = "select";
    this._payload = null;
  }

  select(columns = "*", options = null) {
    this._operation = "select";
    this._selectCols = columns;
    this._selectOptions = options;
    return this;
  }

  insert(data, _options = null) {
    this._operation = "insert";
    this._payload = data;
    return this;
  }

  update(data) {
    this._operation = "update";
    this._payload = data;
    return this;
  }

  upsert(data, _options = null) {
    this._operation = "upsert";
    this._payload = data;
    return this;
  }

  delete() {
    this._operation = "delete";
    return this;
  }

  eq(column, value) {
    this._filters.push((row) => {
      const rowVal = row[column];
      if (rowVal === null || rowVal === undefined) {
        return value === null || value === undefined;
      }
      if (typeof rowVal === "string" && typeof value === "string") {
        return rowVal.trim().toLowerCase() === value.trim().toLowerCase();
      }
      return String(rowVal) === String(value);
    });
    return this;
  }

  neq(column, value) {
    this._filters.push((row) => {
      const rowVal = row[column];
      if (rowVal === null || rowVal === undefined) {
        return value !== null && value !== undefined;
      }
      if (typeof rowVal === "string" && typeof value === "string") {
        return rowVal.trim().toLowerCase() !== value.trim().toLowerCase();
      }
      return String(rowVal) !== String(value);
    });
    return this;
  }

  gt(column, value) {
    this._filters.push((row) => row[column] > value);
    return this;
  }

  gte(column, value) {
    this._filters.push((row) => row[column] >= value);
    return this;
  }

  lt(column, value) {
    this._filters.push((row) => row[column] < value);
    return this;
  }

  lte(column, value) {
    this._filters.push((row) => row[column] <= value);
    return this;
  }

  like(column, pattern) {
    const regex = new RegExp(`^${pattern.replace(/%/g, ".*")}$`);
    this._filters.push((row) => regex.test(String(row[column] || "")));
    return this;
  }

  ilike(column, pattern) {
    const regex = new RegExp(`^${pattern.replace(/%/g, ".*")}$`, "i");
    this._filters.push((row) => regex.test(String(row[column] || "")));
    return this;
  }

  is(column, value) {
    this._filters.push((row) => {
      if (value === null) {
        return (
          row[column] === null ||
          row[column] === undefined ||
          row[column] === ""
        );
      }
      return row[column] === value;
    });
    return this;
  }

  in(column, valuesArray) {
    const normalized = (valuesArray || []).map((v) => String(v).trim().toLowerCase());
    this._filters.push((row) => {
      const rowVal = row[column];
      if (rowVal === null || rowVal === undefined) return false;
      return normalized.includes(String(rowVal).trim().toLowerCase());
    });
    return this;
  }

  contains(column, value) {
    this._filters.push((row) => {
      const rowVal = row[column];
      if (!rowVal) return false;
      if (Array.isArray(rowVal)) {
        return rowVal.includes(value);
      }
      return String(rowVal).includes(String(value));
    });
    return this;
  }

  not(column, operator, value) {
    if (operator === "is" && value === null) {
      this._filters.push(
        (row) =>
          row[column] !== null &&
          row[column] !== undefined &&
          row[column] !== ""
      );
    } else {
      this._filters.push((row) => row[column] !== value);
    }
    return this;
  }

  or(conditionString) {
    // Basic parser for or("status.eq.Active,status.eq.Pending")
    const parts = conditionString.split(",").map((p) => p.trim());
    this._filters.push((row) => {
      return parts.some((part) => {
        const tokens = part.split(".");
        if (tokens.length >= 3) {
          const col = tokens[0];
          const op = tokens[1];
          const val = tokens.slice(2).join(".");
          if (op === "eq") return String(row[col]) === String(val);
          if (op === "neq") return String(row[col]) !== String(val);
        }
        return false;
      });
    });
    return this;
  }

  order(column, { ascending = true } = {}) {
    this._orderBys.push({ column, ascending });
    return this;
  }

  limit(count) {
    this._limit = count;
    return this;
  }

  range(from, to) {
    this._range = { from, to };
    return this;
  }

  single() {
    this._isSingle = true;
    return this;
  }

  maybeSingle() {
    this._isMaybeSingle = true;
    return this;
  }

  /**
   * Execute the query and return { data, error, count }
   */
  async execute() {
    try {
      const allRows = getAllItems(this.table);

      // ─── INSERT ───
      if (this._operation === "insert") {
        const toInsert = Array.isArray(this._payload) ? this._payload : [this._payload];
        const insertedRows = [];

        toInsert.forEach((row) => {
          const processed = handleBeforeInsert(this.table, row);
          insertedRows.push(processed);
          allRows.push(processed);
          handleAfterInsert(this.table, processed);
        });

        setItem(this.table, allRows);
        return { data: insertedRows, error: null };
      }

      // ─── UPDATE ───
      if (this._operation === "update") {
        const updatedRows = [];
        const newAllRows = allRows.map((row) => {
          const matches = this._filters.every((fn) => fn(row));
          if (matches) {
            const updated = handleBeforeUpdate(this.table, row, this._payload);
            updatedRows.push(updated);
            handleAfterUpdate(this.table, updated);
            return updated;
          }
          return row;
        });

        setItem(this.table, newAllRows);
        return { data: updatedRows, error: null };
      }

      // ─── UPSERT ───
      if (this._operation === "upsert") {
        const toUpsert = Array.isArray(this._payload) ? this._payload : [this._payload];
        const results = [];

        toUpsert.forEach((record) => {
          let foundIndex = -1;
          if (record.id) {
            foundIndex = allRows.findIndex((r) => String(r.id) === String(record.id));
          } else if (record.enquiry_number) {
            foundIndex = allRows.findIndex(
              (r) => String(r.enquiry_number) === String(record.enquiry_number)
            );
          } else if (record.username) {
            foundIndex = allRows.findIndex(
              (r) => String(r.username).toLowerCase() === String(record.username).toLowerCase()
            );
          }

          if (foundIndex >= 0) {
            const updated = handleBeforeUpdate(this.table, allRows[foundIndex], record);
            allRows[foundIndex] = updated;
            results.push(updated);
            handleAfterUpdate(this.table, updated);
          } else {
            const inserted = handleBeforeInsert(this.table, record);
            allRows.push(inserted);
            results.push(inserted);
            handleAfterInsert(this.table, inserted);
          }
        });

        setItem(this.table, allRows);
        return { data: results, error: null };
      }

      // ─── DELETE ───
      if (this._operation === "delete") {
        const deletedRows = [];
        const remaining = allRows.filter((row) => {
          const matches = this._filters.every((fn) => fn(row));
          if (matches) {
            deletedRows.push(row);
            return false;
          }
          return true;
        });

        setItem(this.table, remaining);
        return { data: deletedRows, error: null };
      }

      // ─── SELECT ───
      let filtered = allRows.filter((row) => this._filters.every((fn) => fn(row)));
      const totalCount = filtered.length;

      // Apply ordering
      if (this._orderBys.length > 0) {
        filtered.sort((a, b) => {
          for (const { column, ascending } of this._orderBys) {
            const aVal = a[column];
            const bVal = b[column];

            if (aVal === bVal) continue;
            if (aVal === null || aVal === undefined) return ascending ? 1 : -1;
            if (bVal === null || bVal === undefined) return ascending ? -1 : 1;

            if (typeof aVal === "number" && typeof bVal === "number") {
              return ascending ? aVal - bVal : bVal - aVal;
            }

            const comp = String(aVal).localeCompare(String(bVal));
            if (comp !== 0) {
              return ascending ? comp : -comp;
            }
          }
          return 0;
        });
      }

      // Apply range or limit
      if (this._range) {
        filtered = filtered.slice(this._range.from, this._range.to + 1);
      } else if (this._limit !== null && this._limit !== undefined) {
        filtered = filtered.slice(0, this._limit);
      }

      // Resolve joins & projections
      let resultRows = filtered.map((row) => {
        const withJoins = resolveJoins(this.table, row, this._selectCols);
        return projectColumns(withJoins, this._selectCols);
      });

      // Handle head-only count query
      if (this._selectOptions?.head) {
        return { data: null, count: totalCount, error: null };
      }

      // Handle single / maybeSingle
      if (this._isSingle) {
        if (resultRows.length === 0) {
          return { data: null, error: new Error("Row not found"), count: 0 };
        }
        return { data: resultRows[0], error: null, count: totalCount };
      }

      if (this._isMaybeSingle) {
        return { data: resultRows[0] || null, error: null, count: totalCount };
      }

      const response = { data: resultRows, error: null };
      if (this._selectOptions?.count === "exact") {
        response.count = totalCount;
      }

      return response;
    } catch (err) {
      console.error(`Database error executing query on table "${this.table}":`, err);
      return { data: null, error: err };
    }
  }

  // Thenable interface so await db.from(...)... works directly
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.execute().catch(onRejected);
  }
}

// ==========================================
// Centralized Database & Service Client
// ==========================================

export const db = {
  /**
   * Initiate query on table
   */
  from(tableName) {
    return new QueryBuilder(tableName);
  },

  /**
   * File and Document Storage client
   */
  storage: {
    from(bucketName) {
      return {
        /**
         * Upload a file to bucket
         */
        async upload(filePath, fileOrBlob, _options = {}) {
          try {
            const dataUrl = await saveFile(bucketName, filePath, fileOrBlob);
            return {
              data: { path: filePath, fullPath: `${bucketName}/${filePath}`, dataUrl },
              error: null,
            };
          } catch (err) {
            console.error(`Upload error in bucket "${bucketName}":`, err);
            return { data: null, error: err };
          }
        },

        /**
         * Get public URL for stored file
         */
        getPublicUrl(filePath) {
          const publicUrl = getFileUrlSync(bucketName, filePath);
          return {
            data: { publicUrl },
          };
        },

        /**
         * Download file from bucket
         */
        async download(filePath) {
          try {
            const file = await getFile(bucketName, filePath);
            if (!file) throw new Error("File not found");
            return { data: file, error: null };
          } catch (err) {
            return { data: null, error: err };
          }
        },

        /**
         * Remove file from bucket
         */
        async remove(filePaths) {
          try {
            const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
            for (const p of paths) {
              await deleteFile(bucketName, p);
            }
            return { data: paths, error: null };
          } catch (err) {
            return { data: null, error: err };
          }
        },
      };
    },
  },

  /**
   * Edge functions replacement (dispatches WhatsApp message or returns success)
   */
  functions: {
    async invoke(functionName, { body } = {}) {
      if (functionName === "whatsapp-quotation") {
        try {
          const result = await mockWhatsAppService.sendQuotationWhatsApp({
            phone: body?.phone,
            customerName: body?.customerName,
            pdfUrl: body?.pdfUrl
          });
          return { data: result, error: null };
        } catch (err) {
          console.warn("WhatsApp mock dispatch error:", err);
          return {
            data: { success: true, message: "Quotation processed successfully (demo)" },
            error: null,
          };
        }
      }

      return { data: { success: true, message: `Function ${functionName} simulated successfully` }, error: null };
    },
  },

  /**
   * LocalStorage Authentication State manager
   */
  auth: {
    async signInWithPassword({ email, password }) {
      const users = getAllItems("login");
      const user = users.find(
        (u) =>
          u.username?.toLowerCase() === email?.toLowerCase() ||
          u.email_id?.toLowerCase() === email?.toLowerCase()
      );

      if (!user || user.password?.trim() !== password?.trim()) {
        return { data: { user: null, session: null }, error: new Error("Invalid login credentials") };
      }

      const session = {
        access_token: "local-session-token",
        user: { id: user.id, email: user.username, role: user.role },
      };

      return { data: { user, session }, error: null };
    },

    async signOut() {
      sessionStorage.clear();
      return { error: null };
    },

    async getSession() {
      const username = sessionStorage.getItem("username");
      if (!username) return { data: { session: null }, error: null };
      return {
        data: {
          session: {
            user: { email: username, role: sessionStorage.getItem("role") },
          },
        },
        error: null,
      };
    },

    onAuthStateChange(_callback) {
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },
  },

  /**
   * Realtime reactive channel subscription
   */
  channel(_channelName) {
    return {
      on(event, filter, callback) {
        const handler = callback || filter;
        const unsubscribe = subscribeToStorage((detail) => {
          handler({
            eventType: detail.action,
            new: detail.record,
            old: detail.record,
            table: detail.table,
          });
        });
        return {
          subscribe() {
            return this;
          },
          unsubscribe,
        };
      },
      subscribe() {
        return this;
      },
    };
  },
};

// Re-export storage primitives for direct access when needed
export {
  getItem,
  setItem,
  updateItem,
  deleteItem,
  getAllItems,
  clearStorage,
  initializeStorage,
};

export const storageService = db;
export default db;
