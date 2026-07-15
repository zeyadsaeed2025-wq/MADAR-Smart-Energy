import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const MAX_READINGS = 500;
const readings = [];
let ocrStatus = {
  cameraConnected: false,
  lastReading: null,
  lastReadingTime: null,
  totalReadings: 0,
  lastError: null,
  lastUpdateTime: null,
};

let dailyPlan = {
  dailyTarget: 25,
  dayStartDate: new Date().toDateString(),
  dayStartReading: null,
};

let automation = {
  optimizationStatus: "normal",
  notificationCount: 0,
  lastNotificationTime: null,
  lightState: "on",
  escalationStep: 0,
};

let timeline = [];

function resetDayIfNeeded() {
  const today = new Date().toDateString();
  if (dailyPlan.dayStartDate !== today) {
    dailyPlan.dayStartDate = today;
    dailyPlan.dayStartReading = null;
    automation.optimizationStatus = "normal";
    automation.notificationCount = 0;
    automation.lastNotificationTime = null;
    automation.lightState = "on";
    automation.escalationStep = 0;
    timeline = [];
    console.log("[Day Reset] New day detected, reset daily plan");
  }
}

function addTimelineEvent(type, message, value = null) {
  const event = {
    id: Date.now(),
    type,
    message,
    value,
    timestamp: new Date().toISOString(),
  };
  timeline.push(event);
  if (timeline.length > 50) timeline = timeline.slice(-50);
  console.log(`[Timeline] ${type}: ${message}`);
}

function pushReading(entry) {
  readings.push(entry);
  if (readings.length > MAX_READINGS) readings.splice(0, readings.length - MAX_READINGS);
}

function getDailyConsumption(latestValue) {
  if (dailyPlan.dayStartReading === null) {
    dailyPlan.dayStartReading = latestValue;
    addTimelineEvent("info", "بداية يوم جديدة - تم تأسيس قراءة البداية", latestValue);
  }
  return Math.max(0, latestValue - dailyPlan.dayStartReading);
}

function runAutomation(dailyConsumption) {
  const target = dailyPlan.dailyTarget;
  const percentage = target > 0 ? (dailyConsumption / target) * 100 : 0;

  if (percentage <= 100) {
    if (automation.optimizationStatus !== "normal") {
      addTimelineEvent("success", "تمت العودة للوضع الطبيعي - الاستهلاك ضمن المخطط", dailyConsumption);
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
    addTimelineEvent("warning", `تنبيه: تجاوز المخطط اليومي - الاستهلاك ${dailyConsumption.toFixed(1)} kWh من ${target} kWh`, dailyConsumption);
  }

  if (automation.escalationStep === 1 && automation.notificationCount >= 3) {
    automation.optimizationStatus = "energy_saving";
    addTimelineEvent("critical", "تفعيل وضع توفير الطاقة تلقائياً - تم تجاهل التنبيهات", dailyConsumption);
    automation.escalationStep = 2;
  } else if (automation.escalationStep === 2) {
    automation.optimizationStatus = "light_dimmed";
    automation.lightState = "dimmed";
    addTimelineEvent("critical", "تم تخفيف الإضاءة لتوفير الطاقة", dailyConsumption);
    automation.escalationStep = 3;
  } else if (automation.escalationStep === 3) {
    automation.optimizationStatus = "light_off";
    automation.lightState = "off";
    addTimelineEvent("critical", "تم إطفاء الإضاءة بالكامل لتوفير الطاقة", dailyConsumption);
    automation.escalationStep = 4;
  }
}

app.post("/api/reading", (req, res) => {
  const { value } = req.body;
  if (value === undefined || value === null) {
    return res.status(400).json({ error: "Missing value" });
  }
  pushReading({ value, timestamp: new Date().toISOString() });
  ocrStatus.lastReading = value;
  ocrStatus.lastReadingTime = new Date().toISOString();
  ocrStatus.totalReadings = readings.length;
  ocrStatus.lastError = null;

  resetDayIfNeeded();

  const numValue = parseFloat(value);
  if (!isNaN(numValue)) {
    const dailyConsumption = getDailyConsumption(numValue);
    runAutomation(dailyConsumption);
  }

  console.log(`[POST /api/reading] Received value: ${value}`);
  res.json({ status: "ok", value });
});

app.post("/api/ocr/status", (req, res) => {
  const { cameraConnected, error } = req.body;
  if (cameraConnected !== undefined) {
    ocrStatus.cameraConnected = cameraConnected;
  }
  if (error !== undefined) {
    ocrStatus.lastError = error;
  }
  ocrStatus.lastUpdateTime = new Date().toISOString();
  res.json({ status: "ok" });
});

app.get("/api/latest", (req, res) => {
  if (readings.length === 0) {
    return res.json({ value: null });
  }
  const latest = readings[readings.length - 1];
  console.log(`[GET /api/latest] Returning: ${latest.value}`);
  res.json(latest);
});

app.get("/api/readings", (req, res) => {
  res.json(readings);
});

app.get("/api/ocr/status", (req, res) => {
  res.json(ocrStatus);
});

app.get("/api/daily-plan", (req, res) => {
  resetDayIfNeeded();
  let dailyConsumption = 0;
  if (readings.length > 0) {
    const latestValue = parseFloat(readings[readings.length - 1].value);
    if (!isNaN(latestValue)) {
      dailyConsumption = getDailyConsumption(latestValue);
    }
  }
  const remaining = Math.max(0, dailyPlan.dailyTarget - dailyConsumption);
  const percentage = dailyPlan.dailyTarget > 0 ? (dailyConsumption / dailyPlan.dailyTarget) * 100 : 0;

  res.json({
    dailyTarget: dailyPlan.dailyTarget,
    dayStartReading: dailyPlan.dayStartReading,
    dailyConsumption: dailyConsumption,
    remaining: remaining,
    percentage: percentage,
    efficiencyScore: percentage <= 60 ? 95 : percentage <= 80 ? 85 : percentage <= 100 ? 70 : Math.max(20, 100 - Math.floor(percentage - 100) * 2),
    status: percentage <= 60 ? "excellent" : percentage <= 80 ? "good" : percentage <= 100 ? "warning" : "critical",
  });
});

app.get("/api/automation", (req, res) => {
  resetDayIfNeeded();
  res.json({
    optimizationStatus: automation.optimizationStatus,
    notificationCount: automation.notificationCount,
    lastNotificationTime: automation.lastNotificationTime,
    lightState: automation.lightState,
    escalationStep: automation.escalationStep,
  });
});

app.post("/api/settings/target", (req, res) => {
  const { target } = req.body;
  if (target === undefined || target === null || typeof target !== "number" || target <= 0) {
    return res.status(400).json({ error: "Invalid target value" });
  }
  dailyPlan.dailyTarget = target;
  addTimelineEvent("info", `تم تحديث المخطط اليومي إلى ${target} kWh`, target);
  console.log(`[POST /api/settings/target] New target: ${target}`);
  res.json({ status: "ok", dailyTarget: target });
});

app.post("/api/automation/acknowledge", (req, res) => {
  automation.lastNotificationTime = new Date().toISOString();
  automation.notificationCount = 0;
  automation.escalationStep = 0;
  addTimelineEvent("info", "تم تأكيد التنبيه من المستخدم");
  res.json({ status: "ok" });
});

app.get("/api/timeline", (req, res) => {
  res.json(timeline.slice(-20));
});

// ============================================================
// ADMIN SIMULATION API (completely separate from existing logic)
// ============================================================

let simulationMode = false;
let simulationState = {
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
};

const systemStatus = {
  esp32Camera: { status: "online", label: "متصل", lastPing: null },
  ocrEngine: { status: "online", label: "جاهز", lastPing: null },
  arduino: { status: "offline", label: "غير متصل", lastPing: null },
  websiteServer: { status: "online", label: "يعمل", lastPing: new Date().toISOString() },
  database: { status: "online", label: "متصل", lastPing: new Date().toISOString() },
};

function addSimTimelineEvent(type, message) {
  const event = {
    id: Date.now() + Math.random(),
    type,
    message,
    timestamp: new Date().toISOString(),
  };
  simulationState.simulationTimeline.push(event);
  if (simulationState.simulationTimeline.length > 30) {
    simulationState.simulationTimeline = simulationState.simulationTimeline.slice(-30);
  }
  console.log(`[SimTimeline] ${type}: ${message}`);
}

app.get("/api/admin/simulation/status", (req, res) => {
  res.json({ simulationMode, state: simulationState, systemStatus });
});

app.post("/api/admin/simulation/toggle", (req, res) => {
  simulationMode = !simulationMode;
  if (simulationMode) {
    addSimTimelineEvent("info", "تم تفعيل وضع المحاكاة");
  } else {
    addSimTimelineEvent("info", "تم إيقاف وضع المحاكاة");
  }
  res.json({ simulationMode });
});

app.post("/api/admin/simulation/increase", (req, res) => {
  if (!simulationMode) return res.status(400).json({ error: "Simulation mode is OFF" });
  const latestVal = readings.length > 0 ? parseFloat(readings[readings.length - 1].value) : 10;
  const newVal = (latestVal + 5).toFixed(1);
  pushReading({ value: newVal, timestamp: new Date().toISOString() });
  ocrStatus.lastReading = newVal;
  ocrStatus.lastReadingTime = new Date().toISOString();
  ocrStatus.totalReadings = readings.length;
  simulationState.simulatedReading = newVal;
  resetDayIfNeeded();
  const numValue = parseFloat(newVal);
  const dailyConsumption = getDailyConsumption(numValue);
  runAutomation(dailyConsumption);
  addSimTimelineEvent("warning", `تم زيادة الاستهلاك إلى ${newVal} kWh`);
  res.json({ status: "ok", value: newVal, dailyConsumption, automation: automation.optimizationStatus });
});

app.post("/api/admin/simulation/decrease", (req, res) => {
  if (!simulationMode) return res.status(400).json({ error: "Simulation mode is OFF" });
  const latestVal = readings.length > 0 ? parseFloat(readings[readings.length - 1].value) : 10;
  const newVal = Math.max(0, latestVal - 5).toFixed(1);
  pushReading({ value: newVal, timestamp: new Date().toISOString() });
  ocrStatus.lastReading = newVal;
  ocrStatus.lastReadingTime = new Date().toISOString();
  ocrStatus.totalReadings = readings.length;
  simulationState.simulatedReading = newVal;
  resetDayIfNeeded();
  const numValue = parseFloat(newVal);
  const dailyConsumption = getDailyConsumption(numValue);
  runAutomation(dailyConsumption);
  addSimTimelineEvent("success", `تم تقليل الاستهلاك إلى ${newVal} kWh`);
  res.json({ status: "ok", value: newVal, dailyConsumption, automation: automation.optimizationStatus });
});

app.post("/api/admin/simulation/warning", (req, res) => {
  if (!simulationMode) return res.status(400).json({ error: "Simulation mode is OFF" });
  automation.notificationCount += 1;
  automation.lastNotificationTime = new Date().toISOString();
  addSimTimelineEvent("warning", "تم إرسال تنبيه للمستخدم");
  res.json({ status: "ok", notificationCount: automation.notificationCount });
});

app.post("/api/admin/simulation/ignore", (req, res) => {
  if (!simulationMode) return res.status(400).json({ error: "Simulation mode is OFF" });
  automation.notificationCount += 1;
  automation.lastNotificationTime = new Date().toISOString();
  if (automation.escalationStep <= 0) automation.escalationStep = 1;
  if (automation.escalationStep === 1 && automation.notificationCount >= 3) {
    automation.optimizationStatus = "energy_saving";
    automation.escalationStep = 2;
    addSimTimelineEvent("critical", "تم تجاهل التنبيه - تفعيل توفير الطاقة");
  } else if (automation.escalationStep === 2) {
    automation.optimizationStatus = "light_dimmed";
    automation.lightState = "dimmed";
    automation.escalationStep = 3;
    addSimTimelineEvent("critical", "تم تخفيف الإضاءة");
  } else if (automation.escalationStep === 3) {
    automation.optimizationStatus = "light_off";
    automation.lightState = "off";
    automation.escalationStep = 4;
    addSimTimelineEvent("critical", "تم إطفاء الإضاءة");
  }
  res.json({ status: "ok", automation: automation.optimizationStatus, step: automation.escalationStep });
});

app.post("/api/admin/simulation/reset", (req, res) => {
  if (!simulationMode) return res.status(400).json({ error: "Simulation mode is OFF" });
  automation.optimizationStatus = "normal";
  automation.notificationCount = 0;
  automation.lastNotificationTime = null;
  automation.lightState = "on";
  automation.escalationStep = 0;
  simulationState.automationStep = 0;
  simulationState.simulatedReading = null;
  simulationState.competitionRunning = false;
  simulationState.competitionStep = 0;
  simulationState.rooms.forEach(r => { r.state = "on"; r.brightness = 100; });
  addSimTimelineEvent("info", "تم إعادة تعيين المحاكاة بالكامل");
  res.json({ status: "ok" });
});

app.get("/api/admin/rooms", (req, res) => {
  res.json(simulationState.rooms);
});

app.post("/api/admin/room/control", (req, res) => {
  if (!simulationMode) return res.status(400).json({ error: "Simulation mode is OFF" });
  const { roomId, action } = req.body;
  const room = simulationState.rooms.find(r => r.id === roomId);
  if (!room) return res.status(400).json({ error: "Room not found" });
  let command = "";
  let hwRoom = 0;
  switch (action) {
    case "dim":
      room.state = "dimmed";
      room.brightness = 40;
      command = `${room.command}_DIM`;
      hwRoom = simulationState.rooms.indexOf(room) + 1;
      addSimTimelineEvent("critical", `تم تخفيف إضاءة ${room.name} إلى 40%`);
      break;
    case "off":
      room.state = "off";
      room.brightness = 0;
      command = `${room.command}_OFF`;
      hwRoom = simulationState.rooms.indexOf(room) + 1;
      addSimTimelineEvent("critical", `تم إطفاء إضاءة ${room.name}`);
      break;
    case "on":
      room.state = "on";
      room.brightness = 100;
      command = `${room.command}_ON`;
      hwRoom = simulationState.rooms.indexOf(room) + 1;
      addSimTimelineEvent("success", `تم تشغيل إضاءة ${room.name} بالكامل`);
      break;
    default:
      return res.status(400).json({ error: "Invalid action" });
  }
  if (hwRoom > 0) sendHardwareCommand(hwRoom, action.toUpperCase());
  res.json({ status: "ok", room, command });
});

app.get("/api/admin/system-status", async (req, res) => {
  try {
    systemStatus.esp32Camera.status = ocrStatus.cameraConnected ? "online" : "offline";
    systemStatus.esp32Camera.label = ocrStatus.cameraConnected ? "متصل" : "غير متصل";
    systemStatus.ocrEngine.status = ocrStatus.totalReadings > 0 ? "online" : "waiting";
    systemStatus.ocrEngine.label = ocrStatus.totalReadings > 0 ? "جاهز" : "انتظار";

    try {
      const hwHealth = await proxyToPython("GET", "/api/health");
      systemStatus.arduino.status = hwHealth.connected ? "online" : "offline";
      systemStatus.arduino.label = hwHealth.connected ? "متصل" : "غير متصل";
      systemStatus.arduino.lastPing = new Date().toISOString();
    } catch {
      systemStatus.arduino.status = "offline";
      systemStatus.arduino.label = "Python offline";
    }

    systemStatus.websiteServer.status = "online";
    systemStatus.websiteServer.lastPing = new Date().toISOString();
    res.json(systemStatus);
  } catch (e) {
    res.status(500).json({ error: "Failed to get system status" });
  }
});

app.post("/api/admin/competition/run", (req, res) => {
  if (!simulationMode) return res.status(400).json({ error: "Simulation mode is OFF" });
  simulationState.competitionRunning = true;
  simulationState.competitionStep = 0;
  simulationState.rooms.forEach(r => { r.state = "on"; r.brightness = 100; });
  addSimTimelineEvent("info", "بدء عرض توضيحي كامل");
  res.json({ status: "ok", message: "Competition demo started" });
});

app.post("/api/admin/competition/step", (req, res) => {
  if (!simulationMode) return res.status(400).json({ error: "Simulation mode is OFF" });
  const step = simulationState.competitionStep;
  const targetRoom = simulationState.rooms.find(r => r.id === "living_room");
  let action = "";
  switch (step) {
    case 0: {
      const latestVal = readings.length > 0 ? parseFloat(readings[readings.length - 1].value) : 10;
      const newVal = (latestVal + 8).toFixed(1);
      pushReading({ value: newVal, timestamp: new Date().toISOString() });
      ocrStatus.lastReading = newVal;
      ocrStatus.lastReadingTime = new Date().toISOString();
      ocrStatus.totalReadings = readings.length;
      resetDayIfNeeded();
      const dc = getDailyConsumption(parseFloat(newVal));
      runAutomation(dc);
      addSimTimelineEvent("warning", `الخطوة 1: زيادة الاستهلاك إلى ${newVal} kWh`);
      action = "consumption_increased";
      break;
    }
    case 1: {
      automation.notificationCount = 1;
      automation.lastNotificationTime = new Date().toISOString();
      addSimTimelineEvent("warning", "الخطوة 2: إرسال تنبيه للمستخدم");
      action = "notification_sent";
      break;
    }
    case 2: {
      automation.notificationCount = 3;
      automation.escalationStep = 1;
      automation.optimizationStatus = "energy_saving";
      addSimTimelineEvent("critical", "الخطوة 3: تجاهل المستخدم - تفعيل توفير الطاقة");
      action = "notification_ignored";
      break;
    }
    case 3: {
      if (targetRoom) {
        targetRoom.state = "dimmed";
        targetRoom.brightness = 40;
      }
      automation.escalationStep = 2;
      automation.optimizationStatus = "light_dimmed";
      automation.lightState = "dimmed";
      addSimTimelineEvent("critical", "الخطوة 4: تخفيف إضاءة غرفة المعيشة");
      sendHardwareCommand(1, "DIM");
      action = "room_dimmed";
      break;
    }
    case 4: {
      if (targetRoom) {
        targetRoom.state = "off";
        targetRoom.brightness = 0;
      }
      automation.escalationStep = 3;
      automation.optimizationStatus = "light_off";
      automation.lightState = "off";
      addSimTimelineEvent("critical", "الخطوة 5: إطفاء إضاءة غرفة المعيشة");
      sendHardwareCommand(1, "OFF");
      action = "room_turned_off";
      break;
    }
    case 5: {
      const latestVal = readings.length > 0 ? parseFloat(readings[readings.length - 1].value) : 10;
      const newVal = Math.max(0, latestVal - 12).toFixed(1);
      pushReading({ value: newVal, timestamp: new Date().toISOString() });
      ocrStatus.lastReading = newVal;
      ocrStatus.lastReadingTime = new Date().toISOString();
      ocrStatus.totalReadings = readings.length;
      resetDayIfNeeded();
      const dc = getDailyConsumption(parseFloat(newVal));
      runAutomation(dc);
      addSimTimelineEvent("success", `الخطوة 6: تقليل الاستهلاك إلى ${newVal} kWh`);
      action = "consumption_decreased";
      break;
    }
    case 6: {
      if (targetRoom) {
        targetRoom.state = "on";
        targetRoom.brightness = 100;
      }
      automation.optimizationStatus = "normal";
      automation.lightState = "on";
      automation.notificationCount = 0;
      automation.escalationStep = 0;
      addSimTimelineEvent("success", "الخطوة 7: العودة للوضع الطبيعي");
      sendHardwareCommand(1, "ON");
      action = "system_restored";
      break;
    }
    default: {
      simulationState.competitionRunning = false;
      simulationState.competitionStep = 0;
      addSimTimelineEvent("info", "انتهى العرض التوضيحي");
      action = "demo_complete";
      break;
    }
  }
  simulationState.competitionStep = (step + 1) % 8;
  if (step >= 7) {
    simulationState.competitionRunning = false;
    simulationState.competitionStep = 0;
  }
  res.json({ status: "ok", step, action, competitionStep: simulationState.competitionStep, running: simulationState.competitionRunning });
});

// ============================================================
// HARDWARE PROXY - Bridge to Python Control Service
// ============================================================

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:5000";

async function proxyToPython(method, path, body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${PYTHON_SERVICE_URL}${path}`, opts);
  const data = await res.json();
  if (!res.ok) {
    return { success: false, error: `Python service returned ${res.status}`, ...data };
  }
  return data;
}

app.get("/api/hardware/connection", async (req, res) => {
  try {
    const data = await proxyToPython("GET", "/api/connection");
    res.json(data);
  } catch (e) {
    res.json({ success: false, connection: { status: "disconnected", last_error: "Python service not running" } });
  }
});

app.post("/api/hardware/control-room", async (req, res) => {
  try {
    const { room, action } = req.body;
    if (!room || !action) {
      return res.status(400).json({ success: false, error: "Missing room or action" });
    }
    const actionUpper = action.toUpperCase();
    const data = await proxyToPython("POST", "/api/control-room", { room, action: actionUpper });
    res.json(data);
  } catch (e) {
    res.json({ success: false, error: "Python service not reachable", local_update: true });
  }
});

app.get("/api/hardware/room-status", async (req, res) => {
  try {
    const data = await proxyToPython("GET", "/api/room-status");
    res.json(data);
  } catch (e) {
    res.json({ success: false, rooms: {}, connected: false });
  }
});

app.get("/api/hardware/rooms", async (req, res) => {
  try {
    const data = await proxyToPython("GET", "/api/rooms");
    res.json(data);
  } catch (e) {
    res.json({ success: false, rooms: {}, connected: false });
  }
});

app.post("/api/hardware/reconnect", async (req, res) => {
  try {
    const data = await proxyToPython("POST", "/api/reconnect");
    res.json(data);
  } catch (e) {
    res.json({ success: false, message: "Python service not reachable" });
  }
});

app.post("/api/hardware/auto-test", async (req, res) => {
  try {
    const data = await proxyToPython("POST", "/api/auto-test");
    res.json(data);
  } catch (e) {
    res.json({ success: false, error: "Python service not reachable", report: null });
  }
});

app.get("/api/hardware/health", async (req, res) => {
  try {
    const data = await proxyToPython("GET", "/api/health");
    res.json(data);
  } catch (e) {
    res.json({ status: "offline", connected: false, monitor_running: false });
  }
});

app.get("/api/hardware/history", async (req, res) => {
  try {
    const data = await proxyToPython("GET", "/api/command-history");
    res.json(data);
  } catch (e) {
    res.json({ success: false, commands: [], total: 0 });
  }
});

app.get("/api/hardware/ports", async (req, res) => {
  try {
    const data = await proxyToPython("GET", "/api/available-ports");
    res.json(data);
  } catch (e) {
    res.json({ success: false, ports: [], current_port: null });
  }
});

// ============================================================
// Wire Arduino into automation escalation
// ============================================================

async function sendHardwareCommand(room, action) {
  try {
    await proxyToPython("POST", "/api/control-room", { room, action: action.toUpperCase() });
    console.log(`[Hardware] Sent R${room}_${action.toUpperCase()} to Arduino`);
  } catch (e) {
    console.log(`[Hardware] Arduino not available: ${e.message || e}`);
  }
}

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
