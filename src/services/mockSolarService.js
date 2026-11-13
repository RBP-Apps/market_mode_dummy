/**
 * Centralized Mock Solar Cloud Service
 * Simulates the iSolarCloud OpenAPI responses and local solar backend proxy (/api/solar/*).
 * Completely offline: generates realistic inverter telemetry, solar bell curves, and generation history.
 */

export const mockSolarService = {
  /**
   * Simulate OpenAPI Login (/openapi/login or /api/solar/login)
   */
  async login(credentials = {}) {
    return {
      result_code: "1",
      result_msg: "success",
      result_data: {
        token: `demo-solar-token-${Date.now()}`,
        user_id: "demo_solar_account",
        user_account: credentials.user_account || "demo@rbpindia.com",
        expire_time: Date.now() + 86400000
      }
    };
  },

  /**
   * Simulate Real-Time Inverter Telemetry (/openapi/getPVInverterRealTimeData or /api/solar/inverter-data)
   */
  async getPVInverterRealTimeData({ sn_list = [] } = {}) {
    const list = Array.isArray(sn_list) && sn_list.length > 0 ? sn_list : ["I2460100212"];

    const devicePoints = list.map((sn) => {
      const cleanSn = String(sn).trim();
      const psKey = `1589518_${cleanSn.slice(-6) || "1_1_1"}`;

      return {
        device_point: {
          ps_key: psKey,
          device_sn: cleanSn,
          device_name: `Inverter ${cleanSn}`,
          p1: "3420", // Total Power (W)
          p2: "18450", // Total Energy (Wh)
          p4: "385.2", // PV1 Voltage (V)
          p5: "382.4", // PV2 Voltage (V)
          p6: "4.52", // PV1 Current (A)
          p14: "230.1", // Grid Voltage (V)
          p18: "49.98", // Grid Frequency (Hz)
          p21: "14.85", // Output Current (A)
          p24: "3400", // Output Power (W)
          p25: "42.5", // Temperature (°C)
          p26: "1240", // Operation Hours (h)
          p27: "0.99", // Power Factor
          p43: "1730", // PV1 Power (W)
          p87: "14200", // Today Energy (Wh)
          p88: "18450000", // Total Energy (Wh)
          p83044: "18.45", // Cumulative yield (kWh)
          p83045: "3420", // Active power (W)
          p83020: "48.5" // Inverter temperature
        }
      };
    });

    return {
      result_code: "1",
      result_msg: "success",
      result_data: {
        device_point_list: devicePoints
      }
    };
  },

  /**
   * Simulate Minute-by-Minute Solar Power Curve (/openapi/getDevicePointMinuteDataList)
   * Generates a realistic daylight bell curve (sunrise ~06:00, peak ~12:30, sunset ~18:30)
   */
  async getDevicePointMinuteDataList({
    ps_key_list = ["1589518_1_1_1"],
    start_time_stamp = "",
    end_time_stamp = "",
    minute_interval = 10,
    points = "p5,p6,p18,p21,p24"
  } = {}) {
    const psKey = Array.isArray(ps_key_list) ? ps_key_list[0] : (ps_key_list || "1589518_1_1_1");
    
    // Parse target date from start_time_stamp (YYYYMMDDHHmmss) or fallback to today
    let dateStr = "";
    if (start_time_stamp && start_time_stamp.length >= 8) {
      dateStr = start_time_stamp.substring(0, 8);
    } else {
      const d = new Date();
      dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    }

    const intervalMinutes = Number(minute_interval) || 10;
    const minuteDataArray = [];

    // Generate intervals for all 24 hours of the day
    for (let totalMinutes = 0; totalMinutes < 24 * 60; totalMinutes += intervalMinutes) {
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      const timeStamp = `${dateStr}${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}00`;

      // Bell curve calculation for daylight hours (06:00 to 18:30)
      let powerFactor = 0;
      if (totalMinutes >= 360 && totalMinutes <= 1110) {
        // Normalized daylight x from -1 to 1
        const x = (totalMinutes - 735) / 375;
        powerFactor = Math.max(0, Math.cos((x * Math.PI) / 2));
      }

      // Add small realistic ripple
      const ripple = powerFactor > 0 ? (Math.sin(totalMinutes / 17) * 0.05 + 1) : 0;
      const effectivePower = Math.round(powerFactor * 3500 * ripple);
      const voltage = powerFactor > 0 ? (360 + Math.sin(totalMinutes / 20) * 15).toFixed(1) : "0";
      const current = powerFactor > 0 ? (effectivePower / 370).toFixed(2) : "0";
      const gridVoltage = "231.2";
      const gridFrequency = (49.95 + Math.sin(totalMinutes / 10) * 0.06).toFixed(2);

      const record = {
        time_stamp: timeStamp,
        p5: voltage,
        p6: current,
        p18: gridFrequency,
        p21: (effectivePower / 231.2).toFixed(2),
        p24: String(effectivePower),
        p83045: String(effectivePower),
        p2: String(Math.round(totalMinutes * 15 * powerFactor))
      };

      minuteDataArray.push(record);
    }

    return {
      result_code: "1",
      result_msg: "success",
      result_data: {
        [psKey]: minuteDataArray
      }
    };
  },

  /**
   * Simulate Daily, Monthly, and Yearly Generation Points (/openapi/getDevicePointsDayMonthYearDataList)
   */
  async getDevicePointsDayMonthYearDataList({
    ps_key_list = ["1589518_1_1_1"],
    ps_key = "1589518_1_1_1",
    data_point = "p2",
    query_type = "1",
    start_date = "",
    end_date = "",
    start_year = "",
    end_year = ""
  } = {}) {
    const activePsKey = Array.isArray(ps_key_list) && ps_key_list[0] ? ps_key_list[0] : (ps_key || "1589518_1_1_1");
    const activePoint = data_point || "p2";
    const type = String(query_type || "1");

    const pointsArray = [];

    if (type === "1") {
      // Daily data across 30 days
      const now = new Date();
      for (let i = 30; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const timeStamp = `${y}${m}${day}`;

        // Daily energy in Wh (approx 14,000 Wh to 22,000 Wh, or in kWh ~18.5)
        const dailyEnergyWh = Math.round(18000 + Math.sin(i * 0.7) * 3500 + ((i % 5) * 400));
        const val = activePoint.includes("83044") ? (dailyEnergyWh / 1000).toFixed(2) : String(dailyEnergyWh);

        pointsArray.push({
          time_stamp: timeStamp,
          [activePoint]: val
        });
      }
    } else if (type === "2") {
      // Monthly data across 12 months
      const currentYear = new Date().getFullYear();
      for (let m = 1; m <= 12; m++) {
        const timeStamp = `${currentYear}${String(m).padStart(2, '0')}`;
        const monthlyEnergyWh = Math.round(520000 + Math.sin(m * 0.5) * 80000);
        const val = activePoint.includes("83044") ? (monthlyEnergyWh / 1000).toFixed(2) : String(monthlyEnergyWh);

        pointsArray.push({
          time_stamp: timeStamp,
          [activePoint]: val
        });
      }
    } else {
      // Yearly data
      const currentYear = new Date().getFullYear();
      [currentYear - 2, currentYear - 1, currentYear].forEach((yr) => {
        const yearlyEnergyWh = Math.round(6200000 + (yr % 3) * 350000);
        pointsArray.push({
          time_stamp: String(yr),
          [activePoint]: String(yearlyEnergyWh)
        });
      });
    }

    return {
      result_code: "1",
      result_msg: "success",
      result_data: {
        [activePsKey]: {
          [activePoint]: pointsArray
        }
      }
    };
  }
};

export default mockSolarService;

