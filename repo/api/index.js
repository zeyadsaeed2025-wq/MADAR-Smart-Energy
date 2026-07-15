const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:5000";

const DEFAULT_STATE = {
  dailyPlan: { dailyTarget: 25, dayStartDate: "", dayStartReading: null },
  automation: {
    optimizationStatus: "normal",
    notificationCount: 0,
    lastNotificationTime: null,
    lightState: "on",
    escalationStep: 0,
  },
  ocrStatus: {
    cameraConnected: false,
    lastReading: null,
    lastReadingTime: null,
    totalReadings: 0,
    lastError: null,
    lastUpdateTime: null,
  },
  simulationMode: false,
  simulationState: {
    simulatedReading: null,
    rooms: [
      { id: "living_room", name: "غرفة المعيشة", nameEn: "Living Room", state: "on", brightness: 100, command: "ROOM_1" },
      { id: "bedroom", name: "غرفة النوم", nameEn: "Bedroom", state: "on", brightness: 100, command: "ROOM_2" },
      { id: "kitchen", name: "المطبخ", nameEn: "Kitchen", state: "on", brightness: 100, command: "ROOM_3" },
      { id: "bathroom", name: "الحمام", nameEn: "Bathroom", state: "on", brightness: 100, command: "ROOM_4" },
    ],
    automationStep: 0,
    simulationTimeline: [],
    competitionRunning: false,
    competitionStep: 0,
  },
  timeline: [],
};

const SYSTEM_STATUS_DEFAULT = {
  esp32Camera: { status: "online", label: "متصل", lastPing: null },
  ocrEngine: { status: "online", label: "جاهز", lastPing: null },
  arduino: { status: "offline", label: "غير متصل", lastPing: null },
  websiteServer: { status: "online", label: "يعمل", lastPing: null },
  database: { status: "online", label: "متصل", lastPing: null },
};

function getSupabaseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function getSupabaseAnonHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

async function supabaseGet(table, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? "?" + query : ""}`;
  const res = await fetch(url, { headers: getSupabaseHeaders() });
  if (!res.ok) throw new Error(`Supabase GET ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabasePost(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: getSupabaseHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase POST ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabaseUpsert(table, body, onConflict = "") {
  const headers = getSupabaseHeaders();
  if (onConflict) headers.Prefer = "return=representation,resolution=merge-duplicates";
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase UPSERT ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabasePatch(table, body, filter) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: getSupabaseHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase PATCH ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function readState() {
  try {
    const rows = await supabaseGet("app_state", "id=eq.1&select=state");
    if (rows && rows.length > 0 && rows[0].state) {
      const state = typeof rows[0].state === "string" ? JSON.parse(rows[0].state) : rows[0].state;
      return { ...structuredClone(DEFAULT_STATE), ...state };
    }
  } catch (e) {
    console.error("[readState] Error:", e.message);
  }
  return structuredClone(DEFAULT_STATE);
}

async function writeState(state) {
  try {
    await supabasePost("app_state", {
      id: 1,
      state: JSON.stringify(state),
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    try {
      await supabasePatch("app_state", { state: JSON.stringify(state), updated_at: new Date().toISOString() }, "id=eq.1");
    } catch (e2) {
      console.error("[writeState] Error:", e2.message);
    }
  }
}

async function addReading(value) {
  const row = { value: String(value), timestamp: new Date().toISOString() };
  const result = await supabasePost("readings", row);
  return result;
}

async function getReadings() {
  return supabaseGet("readings", "order=timestamp.asc");
}

async function getLatestReading() {
  const rows = await supabaseGet("readings", "order=timestamp.desc&limit=1");
  return rows && rows.length > 0 ? rows[0] : null;
}

function addTimelineEvent(state, type, message, value = null) {
  if (!state.timeline) state.timeline = [];
  state.timeline.push({
    id: Date.now(),
    type,
    message,
    value,
    timestamp: new Date().toISOString(),
  });
  if (state.timeline.length > 50) state.timeline = state.timeline.slice(-50);
}

function addSimTimelineEvent(state, type, message) {
  if (!state.simulationState) state.simulationState = structuredClone(DEFAULT_STATE.simulationState);
  if (!state.simulationState.simulationTimeline) state.simulationState.simulationTimeline = [];
  state.simulationState.simulationTimeline.push({
    id: Date.now() + Math.random(),
    type,
    message,
    timestamp: new Date().toISOString(),
  });
  if (state.simulationState.simulationTimeline.length > 30) {
    state.simulationState.simulationTimeline = state.simulationState.simulationTimeline.slice(-30);
  }
}

function getDailyConsumption(state, latestValue) {
  if (state.dailyPlan.dayStartReading === null) {
    state.dailyPlan.dayStartReading = latestValue;
    addTimelineEvent(state, "info", "بداية يوم جديدة - تم تأسيس قراءة البداية", latestValue);
  }
  return Math.max(0, latestValue - state.dailyPlan.dayStartReading);
}

function runAutomation(state, dailyConsumption) {
  const target = state.dailyPlan.dailyTarget;
  const percentage = target > 0 ? (dailyConsumption / target) * 100 : 0;
  const automation = state.automation;

  if (percentage <= 100) {
    if (automation.optimizationStatus !== "normal") {
      addTimelineEvent(state, "success", "تمت العودة للوضع الطبيعي - الاستهلاك ضمن المخطط", dailyConsumption);
    }
    automation.optimizationStatus = "normal";
    automation.lightState = "on";
    automation.notificationCount = 0;
    automation.escalationStep = 0;
    return;
  }

  automation.notificationCount += 1;
  automation.lastNotificationTime = new Date().toISOString();

  if (automation.escalationStep <= 0) {
    automation.optimizationStatus = "normal";
    automation.lightState = "on";
    automation.escalationStep = 1;
    addTimelineEvent(state, "warning", `تنبيه: تجاوز المخطط اليومي - الاستهلاك ${dailyConsumption.toFixed(1)} kWh من ${target} kWh`, dailyConsumption);
  }

  if (automation.escalationStep === 1 && automation.notificationCount >= 3) {
    automation.optimizationStatus = "energy_saving";
    addTimelineEvent(state, "critical", "تفعيل وضع توفير الطاقة تلقائياً - تم تجاهل التنبيهات", dailyConsumption);
    automation.escalationStep = 2;
  } else if (automation.escalationStep === 2) {
    automation.optimizationStatus = "light_dimmed";
    automation.lightState = "dimmed";
    addTimelineEvent(state, "critical", "تم تخفيف الإضاءة لتوفير الطاقة", dailyConsumption);
    automation.escalationStep = 3;
  } else if (automation.escalationStep === 3) {
    automation.optimizationStatus = "light_off";
    automation.lightState = "off";
    addTimelineEvent(state, "critical", "تم إطفاء الإضاءة بالكامل لتوفير الطاقة", dailyConsumption);
    automation.escalationStep = 4;
  }
}

function resetDayIfNeeded(state) {
  const today = new Date().toDateString();
  if (state.dailyPlan.dayStartDate !== today) {
    state.dailyPlan.dayStartDate = today;
    state.dailyPlan.dayStartReading = null;
    state.automation.optimizationStatus = "normal";
    state.automation.notificationCount = 0;
    state.automation.lastNotificationTime = null;
    state.automation.lightState = "on";
    state.automation.escalationStep = 0;
    state.timeline = [];
    console.log("[Day Reset] New day detected, reset daily plan");
  }
}

async function proxyToPython(method, path, body = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${PYTHON_SERVICE_URL}${path}`, opts);
  const data = await res.json();
  if (!res.ok) return { success: false, error: `Python service returned ${res.status}`, ...data };
  return data;
}

async function sendHardwareCommand(room, action) {
  try {
    await proxyToPython("POST", "/api/control-room", { room, action: action.toUpperCase() });
    console.log(`[Hardware] Sent R${room}_${action.toUpperCase()} to Arduino`);
  } catch (e) {
    console.log(`[Hardware] Arduino not available: ${e.message || e}`);
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

async function parseBody(req) {
  const text = await req.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

function matchRoute(method, path, pattern) {
  if (method !== pattern.method) return null;
  const patternParts = pattern.path.split("/");
  const pathParts = path.split("/");
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

async function handleRequest(req) {
  const h = corsHeaders();
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: h });
  }

  const url = new URL(req.url, "http://localhost");
  let path = url.pathname;
  if (path.startsWith("/api/")) path = path.slice(4);
  if (path.startsWith("/")) path = path.slice(1);
  const method = req.method;

  try {
    if (method === "POST" && path === "reading") {
      const body = await parseBody(req);
      const { value } = body;
      if (value === undefined || value === null) {
        return json({ error: "Missing value" }, 400, h);
      }
      await addReading(value);
      const state = await readState();
      state.ocrStatus.lastReading = value;
      state.ocrStatus.lastReadingTime = new Date().toISOString();
      state.ocrStatus.totalReadings = (state.ocrStatus.totalReadings || 0) + 1;
      state.ocrStatus.lastError = null;
      resetDayIfNeeded(state);
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const dailyConsumption = getDailyConsumption(state, numValue);
        runAutomation(state, dailyConsumption);
      }
      await writeState(state);
      return json({ status: "ok", value }, 200, h);
    }

    if (method === "GET" && path === "latest") {
      const latest = await getLatestReading();
      if (!latest) return json({ value: null }, 200, h);
      return json(latest, 200, h);
    }

    if (method === "GET" && path === "readings") {
      const all = await getReadings();
      return json(all, 200, h);
    }

    if (method === "POST" && path === "ocr/status") {
      const body = await parseBody(req);
      const state = await readState();
      if (body.cameraConnected !== undefined) state.ocrStatus.cameraConnected = body.cameraConnected;
      if (body.error !== undefined) state.ocrStatus.lastError = body.error;
      state.ocrStatus.lastUpdateTime = new Date().toISOString();
      await writeState(state);
      return json({ status: "ok" }, 200, h);
    }

    if (method === "GET" && path === "ocr/status") {
      const state = await readState();
      return json(state.ocrStatus, 200, h);
    }

    if (method === "GET" && path === "daily-plan") {
      const state = await readState();
      resetDayIfNeeded(state);
      let dailyConsumption = 0;
      const latest = await getLatestReading();
      if (latest) {
        const latestValue = parseFloat(latest.value);
        if (!isNaN(latestValue)) {
          dailyConsumption = getDailyConsumption(state, latestValue);
        }
      }
      const remaining = Math.max(0, state.dailyPlan.dailyTarget - dailyConsumption);
      const percentage = state.dailyPlan.dailyTarget > 0 ? (dailyConsumption / state.dailyPlan.dailyTarget) * 100 : 0;
      await writeState(state);
      return json({
        dailyTarget: state.dailyPlan.dailyTarget,
        dayStartReading: state.dailyPlan.dayStartReading,
        dailyConsumption,
        remaining,
        percentage,
        efficiencyScore: percentage <= 60 ? 95 : percentage <= 80 ? 85 : percentage <= 100 ? 70 : Math.max(20, 100 - Math.floor(percentage - 100) * 2),
        status: percentage <= 60 ? "excellent" : percentage <= 80 ? "good" : percentage <= 100 ? "warning" : "critical",
      }, 200, h);
    }

    if (method === "GET" && path === "automation") {
      const state = await readState();
      resetDayIfNeeded(state);
      await writeState(state);
      return json({
        optimizationStatus: state.automation.optimizationStatus,
        notificationCount: state.automation.notificationCount,
        lastNotificationTime: state.automation.lastNotificationTime,
        lightState: state.automation.lightState,
        escalationStep: state.automation.escalationStep,
      }, 200, h);
    }

    if (method === "POST" && path === "settings/target") {
      const body = await parseBody(req);
      const { target } = body;
      if (target === undefined || target === null || typeof target !== "number" || target <= 0) {
        return json({ error: "Invalid target value" }, 400, h);
      }
      const state = await readState();
      state.dailyPlan.dailyTarget = target;
      addTimelineEvent(state, "info", `تم تحديث المخطط اليومي إلى ${target} kWh`, target);
      await writeState(state);
      return json({ status: "ok", dailyTarget: target }, 200, h);
    }

    if (method === "POST" && path === "automation/acknowledge") {
      const state = await readState();
      state.automation.lastNotificationTime = new Date().toISOString();
      state.automation.notificationCount = 0;
      state.automation.escalationStep = 0;
      addTimelineEvent(state, "info", "تم تأكيد التنبيه من المستخدم");
      await writeState(state);
      return json({ status: "ok" }, 200, h);
    }

    if (method === "GET" && path === "timeline") {
      const state = await readState();
      const timeline = (state.timeline || []).slice(-20);
      return json(timeline, 200, h);
    }

    // ============================================================
    // ADMIN SIMULATION
    // ============================================================

    if (method === "GET" && path === "admin/simulation/status") {
      const state = await readState();
      const systemStatus = { ...SYSTEM_STATUS_DEFAULT };
      systemStatus.websiteServer.lastPing = new Date().toISOString();
      systemStatus.database.lastPing = new Date().toISOString();
      systemStatus.esp32Camera.status = state.ocrStatus.cameraConnected ? "online" : "offline";
      systemStatus.esp32Camera.label = state.ocrStatus.cameraConnected ? "متصل" : "غير متصل";
      systemStatus.ocrEngine.status = (state.ocrStatus.totalReadings || 0) > 0 ? "online" : "waiting";
      systemStatus.ocrEngine.label = (state.ocrStatus.totalReadings || 0) > 0 ? "جاهز" : "انتظار";
      try {
        const hwHealth = await proxyToPython("GET", "/api/health");
        systemStatus.arduino.status = hwHealth.connected ? "online" : "offline";
        systemStatus.arduino.label = hwHealth.connected ? "متصل" : "غير متصل";
        systemStatus.arduino.lastPing = new Date().toISOString();
      } catch {
        systemStatus.arduino.status = "offline";
        systemStatus.arduino.label = "Python offline";
      }
      return json({
        simulationMode: state.simulationMode,
        state: state.simulationState,
        systemStatus,
      }, 200, h);
    }

    if (method === "POST" && path === "admin/simulation/toggle") {
      const state = await readState();
      state.simulationMode = !state.simulationMode;
      if (state.simulationMode) {
        addSimTimelineEvent(state, "info", "تم تفعيل وضع المحاكاة");
      } else {
        addSimTimelineEvent(state, "info", "تم إيقاف وضع المحاكاة");
      }
      await writeState(state);
      return json({ simulationMode: state.simulationMode }, 200, h);
    }

    if (method === "POST" && path === "admin/simulation/increase") {
      const state = await readState();
      if (!state.simulationMode) return json({ error: "Simulation mode is OFF" }, 400, h);
      const latest = await getLatestReading();
      const latestVal = latest ? parseFloat(latest.value) : 10;
      const newVal = (latestVal + 5).toFixed(1);
      await addReading(newVal);
      state.ocrStatus.lastReading = newVal;
      state.ocrStatus.lastReadingTime = new Date().toISOString();
      state.ocrStatus.totalReadings = (state.ocrStatus.totalReadings || 0) + 1;
      state.simulationState.simulatedReading = newVal;
      resetDayIfNeeded(state);
      const dc = getDailyConsumption(state, parseFloat(newVal));
      runAutomation(state, dc);
      addSimTimelineEvent(state, "warning", `تم زيادة الاستهلاك إلى ${newVal} kWh`);
      await writeState(state);
      return json({ status: "ok", value: newVal, dailyConsumption: dc, automation: state.automation.optimizationStatus }, 200, h);
    }

    if (method === "POST" && path === "admin/simulation/decrease") {
      const state = await readState();
      if (!state.simulationMode) return json({ error: "Simulation mode is OFF" }, 400, h);
      const latest = await getLatestReading();
      const latestVal = latest ? parseFloat(latest.value) : 10;
      const newVal = Math.max(0, latestVal - 5).toFixed(1);
      await addReading(newVal);
      state.ocrStatus.lastReading = newVal;
      state.ocrStatus.lastReadingTime = new Date().toISOString();
      state.ocrStatus.totalReadings = (state.ocrStatus.totalReadings || 0) + 1;
      state.simulationState.simulatedReading = newVal;
      resetDayIfNeeded(state);
      const dc = getDailyConsumption(state, parseFloat(newVal));
      runAutomation(state, dc);
      addSimTimelineEvent(state, "success", `تم تقليل الاستهلاك إلى ${newVal} kWh`);
      await writeState(state);
      return json({ status: "ok", value: newVal, dailyConsumption: dc, automation: state.automation.optimizationStatus }, 200, h);
    }

    if (method === "POST" && path === "admin/simulation/warning") {
      const state = await readState();
      if (!state.simulationMode) return json({ error: "Simulation mode is OFF" }, 400, h);
      state.automation.notificationCount += 1;
      state.automation.lastNotificationTime = new Date().toISOString();
      addSimTimelineEvent(state, "warning", "تم إرسال تنبيه للمستخدم");
      await writeState(state);
      return json({ status: "ok", notificationCount: state.automation.notificationCount }, 200, h);
    }

    if (method === "POST" && path === "admin/simulation/ignore") {
      const state = await readState();
      if (!state.simulationMode) return json({ error: "Simulation mode is OFF" }, 400, h);
      state.automation.notificationCount += 1;
      state.automation.lastNotificationTime = new Date().toISOString();
      if (state.automation.escalationStep <= 0) state.automation.escalationStep = 1;
      if (state.automation.escalationStep === 1 && state.automation.notificationCount >= 3) {
        state.automation.optimizationStatus = "energy_saving";
        state.automation.escalationStep = 2;
        addSimTimelineEvent(state, "critical", "تم تجاهل التنبيه - تفعيل توفير الطاقة");
      } else if (state.automation.escalationStep === 2) {
        state.automation.optimizationStatus = "light_dimmed";
        state.automation.lightState = "dimmed";
        state.automation.escalationStep = 3;
        addSimTimelineEvent(state, "critical", "تم تخفيف الإضاءة");
      } else if (state.automation.escalationStep === 3) {
        state.automation.optimizationStatus = "light_off";
        state.automation.lightState = "off";
        state.automation.escalationStep = 4;
        addSimTimelineEvent(state, "critical", "تم إطفاء الإضاءة");
      }
      await writeState(state);
      return json({ status: "ok", automation: state.automation.optimizationStatus, step: state.automation.escalationStep }, 200, h);
    }

    if (method === "POST" && path === "admin/simulation/reset") {
      const state = await readState();
      if (!state.simulationMode) return json({ error: "Simulation mode is OFF" }, 400, h);
      state.automation.optimizationStatus = "normal";
      state.automation.notificationCount = 0;
      state.automation.lastNotificationTime = null;
      state.automation.lightState = "on";
      state.automation.escalationStep = 0;
      state.simulationState.automationStep = 0;
      state.simulationState.simulatedReading = null;
      state.simulationState.competitionRunning = false;
      state.simulationState.competitionStep = 0;
      state.simulationState.rooms.forEach(r => { r.state = "on"; r.brightness = 100; });
      addSimTimelineEvent(state, "info", "تم إعادة تعيين المحاكاة بالكامل");
      await writeState(state);
      return json({ status: "ok" }, 200, h);
    }

    if (method === "GET" && path === "admin/rooms") {
      const state = await readState();
      return json(state.simulationState.rooms, 200, h);
    }

    if (method === "POST" && path === "admin/room/control") {
      const body = await parseBody(req);
      const { roomId, action } = body;
      const state = await readState();
      if (!state.simulationMode) return json({ error: "Simulation mode is OFF" }, 400, h);
      const room = state.simulationState.rooms.find(r => r.id === roomId);
      if (!room) return json({ error: "Room not found" }, 400, h);
      let command = "";
      let hwRoom = 0;
      switch (action) {
        case "dim":
          room.state = "dimmed";
          room.brightness = 40;
          command = `${room.command}_DIM`;
          hwRoom = state.simulationState.rooms.indexOf(room) + 1;
          addSimTimelineEvent(state, "critical", `تم تخفيف إضاءة ${room.name} إلى 40%`);
          break;
        case "off":
          room.state = "off";
          room.brightness = 0;
          command = `${room.command}_OFF`;
          hwRoom = state.simulationState.rooms.indexOf(room) + 1;
          addSimTimelineEvent(state, "critical", `تم إطفاء إضاءة ${room.name}`);
          break;
        case "on":
          room.state = "on";
          room.brightness = 100;
          command = `${room.command}_ON`;
          hwRoom = state.simulationState.rooms.indexOf(room) + 1;
          addSimTimelineEvent(state, "success", `تم تشغيل إضاءة ${room.name} بالكامل`);
          break;
        default:
          return json({ error: "Invalid action" }, 400, h);
      }
      if (hwRoom > 0) sendHardwareCommand(hwRoom, action.toUpperCase());
      await writeState(state);
      return json({ status: "ok", room, command }, 200, h);
    }

    if (method === "GET" && path === "admin/system-status") {
      const state = await readState();
      const systemStatus = { ...SYSTEM_STATUS_DEFAULT };
      systemStatus.esp32Camera.status = state.ocrStatus.cameraConnected ? "online" : "offline";
      systemStatus.esp32Camera.label = state.ocrStatus.cameraConnected ? "متصل" : "غير متصل";
      systemStatus.ocrEngine.status = (state.ocrStatus.totalReadings || 0) > 0 ? "online" : "waiting";
      systemStatus.ocrEngine.label = (state.ocrStatus.totalReadings || 0) > 0 ? "جاهز" : "انتظار";
      systemStatus.websiteServer.lastPing = new Date().toISOString();
      systemStatus.database.lastPing = new Date().toISOString();
      try {
        const hwHealth = await proxyToPython("GET", "/api/health");
        systemStatus.arduino.status = hwHealth.connected ? "online" : "offline";
        systemStatus.arduino.label = hwHealth.connected ? "متصل" : "غير متصل";
        systemStatus.arduino.lastPing = new Date().toISOString();
      } catch {
        systemStatus.arduino.status = "offline";
        systemStatus.arduino.label = "Python offline";
      }
      return json(systemStatus, 200, h);
    }

    if (method === "POST" && path === "admin/competition/run") {
      const state = await readState();
      if (!state.simulationMode) return json({ error: "Simulation mode is OFF" }, 400, h);
      state.simulationState.competitionRunning = true;
      state.simulationState.competitionStep = 0;
      state.simulationState.rooms.forEach(r => { r.state = "on"; r.brightness = 100; });
      addSimTimelineEvent(state, "info", "بدء عرض توضيحي كامل");
      await writeState(state);
      return json({ status: "ok", message: "Competition demo started" }, 200, h);
    }

    if (method === "POST" && path === "admin/competition/step") {
      const state = await readState();
      if (!state.simulationMode) return json({ error: "Simulation mode is OFF" }, 400, h);
      const step = state.simulationState.competitionStep;
      const targetRoom = state.simulationState.rooms.find(r => r.id === "living_room");
      let action = "";
      switch (step) {
        case 0: {
          const latest = await getLatestReading();
          const latestVal = latest ? parseFloat(latest.value) : 10;
          const newVal = (latestVal + 8).toFixed(1);
          await addReading(newVal);
          state.ocrStatus.lastReading = newVal;
          state.ocrStatus.lastReadingTime = new Date().toISOString();
          state.ocrStatus.totalReadings = (state.ocrStatus.totalReadings || 0) + 1;
          resetDayIfNeeded(state);
          const dc = getDailyConsumption(state, parseFloat(newVal));
          runAutomation(state, dc);
          addSimTimelineEvent(state, "warning", `الخطوة 1: زيادة الاستهلاك إلى ${newVal} kWh`);
          action = "consumption_increased";
          break;
        }
        case 1: {
          state.automation.notificationCount = 1;
          state.automation.lastNotificationTime = new Date().toISOString();
          addSimTimelineEvent(state, "warning", "الخطوة 2: إرسال تنبيه للمستخدم");
          action = "notification_sent";
          break;
        }
        case 2: {
          state.automation.notificationCount = 3;
          state.automation.escalationStep = 1;
          state.automation.optimizationStatus = "energy_saving";
          addSimTimelineEvent(state, "critical", "الخطوة 3: تجاهل المستخدم - تفعيل توفير الطاقة");
          action = "notification_ignored";
          break;
        }
        case 3: {
          if (targetRoom) {
            targetRoom.state = "dimmed";
            targetRoom.brightness = 40;
          }
          state.automation.escalationStep = 2;
          state.automation.optimizationStatus = "light_dimmed";
          state.automation.lightState = "dimmed";
          addSimTimelineEvent(state, "critical", "الخطوة 4: تخفيف إضاءة غرفة المعيشة");
          sendHardwareCommand(1, "DIM");
          action = "room_dimmed";
          break;
        }
        case 4: {
          if (targetRoom) {
            targetRoom.state = "off";
            targetRoom.brightness = 0;
          }
          state.automation.escalationStep = 3;
          state.automation.optimizationStatus = "light_off";
          state.automation.lightState = "off";
          addSimTimelineEvent(state, "critical", "الخطوة 5: إطفاء إضاءة غرفة المعيشة");
          sendHardwareCommand(1, "OFF");
          action = "room_turned_off";
          break;
        }
        case 5: {
          const latest = await getLatestReading();
          const latestVal = latest ? parseFloat(latest.value) : 10;
          const newVal = Math.max(0, latestVal - 12).toFixed(1);
          await addReading(newVal);
          state.ocrStatus.lastReading = newVal;
          state.ocrStatus.lastReadingTime = new Date().toISOString();
          state.ocrStatus.totalReadings = (state.ocrStatus.totalReadings || 0) + 1;
          resetDayIfNeeded(state);
          const dc = getDailyConsumption(state, parseFloat(newVal));
          runAutomation(state, dc);
          addSimTimelineEvent(state, "success", `الخطوة 6: تقليل الاستهلاك إلى ${newVal} kWh`);
          action = "consumption_decreased";
          break;
        }
        case 6: {
          if (targetRoom) {
            targetRoom.state = "on";
            targetRoom.brightness = 100;
          }
          state.automation.optimizationStatus = "normal";
          state.automation.lightState = "on";
          state.automation.notificationCount = 0;
          state.automation.escalationStep = 0;
          addSimTimelineEvent(state, "success", "الخطوة 7: العودة للوضع الطبيعي");
          sendHardwareCommand(1, "ON");
          action = "system_restored";
          break;
        }
        default: {
          state.simulationState.competitionRunning = false;
          state.simulationState.competitionStep = 0;
          addSimTimelineEvent(state, "info", "انتهى العرض التوضيحي");
          action = "demo_complete";
          break;
        }
      }
      state.simulationState.competitionStep = (step + 1) % 8;
      if (step >= 7) {
        state.simulationState.competitionRunning = false;
        state.simulationState.competitionStep = 0;
      }
      await writeState(state);
      return json({
        status: "ok",
        step,
        action,
        competitionStep: state.simulationState.competitionStep,
        running: state.simulationState.competitionRunning,
      }, 200, h);
    }

    // ============================================================
    // HARDWARE PROXY
    // ============================================================

    if (method === "GET" && path === "hardware/connection") {
      try {
        const data = await proxyToPython("GET", "/api/connection");
        return json(data, 200, h);
      } catch (e) {
        return json({ success: false, connection: { status: "disconnected", last_error: "Python service not running" } }, 200, h);
      }
    }

    if (method === "POST" && path === "hardware/control-room") {
      const body = await parseBody(req);
      const { room, action } = body;
      if (!room || !action) {
        return json({ success: false, error: "Missing room or action" }, 400, h);
      }
      try {
        const data = await proxyToPython("POST", "/api/control-room", { room, action: action.toUpperCase() });
        return json(data, 200, h);
      } catch (e) {
        return json({ success: false, error: "Python service not reachable", local_update: true }, 200, h);
      }
    }

    if (method === "GET" && path === "hardware/room-status") {
      try {
        const data = await proxyToPython("GET", "/api/room-status");
        return json(data, 200, h);
      } catch (e) {
        return json({ success: false, rooms: {}, connected: false }, 200, h);
      }
    }

    if (method === "GET" && path === "hardware/rooms") {
      try {
        const data = await proxyToPython("GET", "/api/rooms");
        return json(data, 200, h);
      } catch (e) {
        return json({ success: false, rooms: {}, connected: false }, 200, h);
      }
    }

    if (method === "POST" && path === "hardware/reconnect") {
      try {
        const data = await proxyToPython("POST", "/api/reconnect");
        return json(data, 200, h);
      } catch (e) {
        return json({ success: false, message: "Python service not reachable" }, 200, h);
      }
    }

    if (method === "POST" && path === "hardware/auto-test") {
      try {
        const data = await proxyToPython("POST", "/api/auto-test");
        return json(data, 200, h);
      } catch (e) {
        return json({ success: false, error: "Python service not reachable", report: null }, 200, h);
      }
    }

    if (method === "GET" && path === "hardware/health") {
      try {
        const data = await proxyToPython("GET", "/api/health");
        return json(data, 200, h);
      } catch (e) {
        return json({ status: "offline", connected: false, monitor_running: false }, 200, h);
      }
    }

    if (method === "GET" && path === "hardware/history") {
      try {
        const data = await proxyToPython("GET", "/api/command-history");
        return json(data, 200, h);
      } catch (e) {
        return json({ success: false, commands: [], total: 0 }, 200, h);
      }
    }

    if (method === "GET" && path === "hardware/ports") {
      try {
        const data = await proxyToPython("GET", "/api/available-ports");
        return json(data, 200, h);
      } catch (e) {
        return json({ success: false, ports: [], current_port: null }, 200, h);
      }
    }

    return json({ error: "Not found", path, method }, 404, h);
  } catch (e) {
    console.error("[API Error]", e);
    return json({ error: "Internal server error", message: e.message }, 500, h);
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const OPTIONS = handleRequest;
