// MADAR Smart Energy Management Platform - Cloudflare Worker Backend
// Uses Supabase for state storage instead of in-memory arrays

// ─── CORS Helpers ────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, status);
}

// ─── Supabase Helpers ────────────────────────────────────────────────────────

function getSupabaseHeaders(env, useServiceKey = false) {
  const key = useServiceKey ? env.SUPABASE_SERVICE_KEY : env.SUPABASE_ANON_KEY;
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

async function supabaseGet(env, table, query = '') {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  const res = await fetch(url, { headers: getSupabaseHeaders(env) });
  if (!res.ok) throw new Error(`Supabase GET ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabaseInsert(env, table, data) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getSupabaseHeaders(env),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase INSERT ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabaseUpsert(env, table, data, onConflict = 'id') {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const headers = {
    ...getSupabaseHeaders(env),
    'Prefer': 'return=representation,resolution=merge-duplicates',
  };
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase UPSERT ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabaseUpdate(env, table, data, query = '') {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getSupabaseHeaders(env),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase UPDATE ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabaseDelete(env, table, query = '') {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getSupabaseHeaders(env),
  });
  if (!res.ok) throw new Error(`Supabase DELETE ${table}: ${res.status} ${await res.text()}`);
}

// ─── App State Helpers (single JSON blob in app_state table, id=1) ───────────

const DEFAULT_STATE = {
  id: 1,
  dailyPlan: {
    target: 50,
    current: 0,
    readings: [],
    status: 'normal',
  },
  automation: {
    enabled: true,
    alerts: [],
    actions: [],
    lastAction: null,
  },
  simulation: {
    active: false,
    mode: null,
    rooms: {
      room1: { name: 'غرفة المعيشة', consumption: 0, devices: [] },
      room2: { name: 'غرفة النوم', consumption: 0, devices: [] },
      room3: { name: 'المطبخ', consumption: 0, devices: [] },
      room4: { name: 'غرفة العمل', consumption: 0, devices: [] },
    },
    notifications: [],
    history: [],
    warning: null,
  },
  timeline: [],
  systemStatus: {
    pythonConnected: false,
    lastHeartbeat: null,
    uptime: 0,
  },
};

async function getAppState(env) {
  try {
    const rows = await supabaseGet(env, 'app_state', 'id=eq.1&select=*');
    if (rows && rows.length > 0 && rows[0].state) {
      return rows[0].state;
    }
  } catch (e) {
    // Table might not exist yet, continue with defaults
  }
  return structuredClone(DEFAULT_STATE);
}

async function saveAppState(env, state) {
  try {
    await supabaseUpsert(env, 'app_state', { id: 1, state, updated_at: new Date().toISOString() });
  } catch (e) {
    // If upsert fails, try insert
    try {
      await supabaseInsert(env, 'app_state', { id: 1, state, updated_at: new Date().toISOString() });
    } catch (e2) {
      console.error('Failed to save app state:', e2);
    }
  }
}

// ─── Default OCR Status ──────────────────────────────────────────────────────

const DEFAULT_OCR_STATUS = {
  cameraConnected: false,
  lastReading: null,
  lastTimestamp: null,
  totalReadings: 0,
  errors: 0,
};

async function getOcrStatus(env) {
  try {
    const rows = await supabaseGet(env, 'ocr_status', 'id=eq.1&select=*');
    if (rows && rows.length > 0 && rows[0].status) {
      return rows[0].status;
    }
  } catch (e) {
    // Table might not exist yet
  }
  return structuredClone(DEFAULT_OCR_STATUS);
}

async function saveOcrStatus(env, status) {
  try {
    await supabaseUpsert(env, 'ocr_status', { id: 1, status, updated_at: new Date().toISOString() });
  } catch (e) {
    try {
      await supabaseInsert(env, 'ocr_status', { id: 1, status, updated_at: new Date().toISOString() });
    } catch (e2) {
      console.error('Failed to save OCR status:', e2);
    }
  }
}

// ─── Python Service Proxy Helper ─────────────────────────────────────────────

async function proxyToPython(env, path, method = 'GET', body = null) {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body && method !== 'GET') {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`${env.PYTHON_SERVICE_URL}${path}`, opts);
    const data = await res.json();
    return jsonResponse(data);
  } catch (e) {
    return jsonResponse({
      connected: false,
      error: 'Python service unavailable',
      message: 'الخدمة غير متاحة حالياً',
    });
  }
}

// ─── Request Handler ─────────────────────────────────────────────────────────

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // ── OPTIONS Preflight ──────────────────────────────────────────────────────
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // ── Parse body if POST/PUT/PATCH ───────────────────────────────────────────
  let body = null;
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/reading - receive OCR reading value
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/reading' && method === 'POST') {
    const { value, timestamp } = body;
    if (value === undefined) {
      return errorResponse('Missing reading value', 400);
    }

    const now = new Date().toISOString();
    const reading = {
      value: Number(value),
      timestamp: timestamp || now,
    };

    // Store in readings table
    try {
      await supabaseInsert(env, 'readings', reading);
    } catch (e) {
      console.error('Failed to insert reading:', e);
    }

    // Update app state
    const state = await getAppState(env);
    state.dailyPlan.current = Number(value);
    state.dailyPlan.readings.push(reading);
    if (state.dailyPlan.readings.length > 100) {
      state.dailyPlan.readings = state.dailyPlan.readings.slice(-100);
    }
    if (value >= state.dailyPlan.target) {
      state.dailyPlan.status = 'exceeded';
    } else {
      state.dailyPlan.status = 'normal';
    }
    await saveAppState(env, state);

    // Add timeline event
    state.timeline.push({
      type: 'reading',
      value: Number(value),
      timestamp: now,
      message: `تم تسجيل قراءة: ${value} وحدة`,
    });
    if (state.timeline.length > 50) {
      state.timeline = state.timeline.slice(-50);
    }
    await saveAppState(env, state);

    // Update OCR status
    const ocrStatus = await getOcrStatus(env);
    ocrStatus.lastReading = Number(value);
    ocrStatus.lastTimestamp = now;
    ocrStatus.totalReadings += 1;
    ocrStatus.cameraConnected = true;
    await saveOcrStatus(env, ocrStatus);

    return jsonResponse({ success: true, reading });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/ocr/status - update OCR camera status
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/ocr/status' && method === 'POST') {
    const current = await getOcrStatus(env);
    const updated = { ...current, ...body, lastTimestamp: new Date().toISOString() };
    await saveOcrStatus(env, updated);
    return jsonResponse({ success: true, status: updated });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/latest - get latest reading
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/latest' && method === 'GET') {
    try {
      const rows = await supabaseGet(env, 'readings', 'order=timestamp.desc&limit=1');
      if (rows && rows.length > 0) {
        return jsonResponse(rows[0]);
      }
    } catch (e) {
      // fallback
    }
    const state = await getAppState(env);
    if (state.dailyPlan.readings.length > 0) {
      return jsonResponse(state.dailyPlan.readings[state.dailyPlan.readings.length - 1]);
    }
    return jsonResponse({ value: 0, timestamp: new Date().toISOString() });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/readings - get all readings
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/readings' && method === 'GET') {
    try {
      const rows = await supabaseGet(env, 'readings', 'order=timestamp.desc&limit=100');
      return jsonResponse(rows || []);
    } catch (e) {
      const state = await getAppState(env);
      return jsonResponse(state.dailyPlan.readings || []);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/ocr/status - get OCR status
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/ocr/status' && method === 'GET') {
    const status = await getOcrStatus(env);
    return jsonResponse(status);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/daily-plan - get daily plan data
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/daily-plan' && method === 'GET') {
    const state = await getAppState(env);
    return jsonResponse(state.dailyPlan);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/automation - get automation status
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/automation' && method === 'GET') {
    const state = await getAppState(env);
    return jsonResponse(state.automation);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/settings/target - update daily target
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/settings/target' && method === 'POST') {
    const { target } = body;
    if (target === undefined) {
      return errorResponse('Missing target value', 400);
    }
    const state = await getAppState(env);
    state.dailyPlan.target = Number(target);
    if (state.dailyPlan.current >= state.dailyPlan.target) {
      state.dailyPlan.status = 'exceeded';
    } else {
      state.dailyPlan.status = 'normal';
    }
    await saveAppState(env, state);
    return jsonResponse({ success: true, target: Number(target), dailyPlan: state.dailyPlan });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/automation/acknowledge - acknowledge automation alert
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/automation/acknowledge' && method === 'POST') {
    const { alertId } = body;
    const state = await getAppState(env);
    if (alertId !== undefined) {
      state.automation.alerts = state.automation.alerts.filter(a => a.id !== alertId);
    } else {
      state.automation.alerts = [];
    }
    await saveAppState(env, state);
    return jsonResponse({ success: true, automation: state.automation });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/timeline - get timeline events
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/timeline' && method === 'GET') {
    const state = await getAppState(env);
    return jsonResponse(state.timeline || []);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/admin/simulation/status - get simulation status
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/admin/simulation/status' && method === 'GET') {
    const state = await getAppState(env);
    return jsonResponse(state.simulation);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/admin/simulation/toggle - toggle simulation mode
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/admin/simulation/toggle' && method === 'POST') {
    const { active, mode } = body;
    const state = await getAppState(env);
    state.simulation.active = active !== undefined ? active : !state.simulation.active;
    if (mode) state.simulation.mode = mode;
    if (state.simulation.active) {
      state.timeline.push({
        type: 'simulation',
        message: 'تم تفعيل وضع المحاكاة',
        timestamp: new Date().toISOString(),
      });
    } else {
      state.timeline.push({
        type: 'simulation',
        message: 'تم إيقاف وضع المحاكاة',
        timestamp: new Date().toISOString(),
      });
    }
    await saveAppState(env, state);
    return jsonResponse({ success: true, simulation: state.simulation });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/admin/simulation/increase - increase consumption
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/admin/simulation/increase' && method === 'POST') {
    const { amount, room } = body;
    const state = await getAppState(env);
    const inc = Number(amount) || 5;
    if (room && state.simulation.rooms[room]) {
      state.simulation.rooms[room].consumption += inc;
    }
    state.dailyPlan.current += inc;
    state.simulation.history.push({
      action: 'increase',
      amount: inc,
      room: room || 'all',
      timestamp: new Date().toISOString(),
    });
    state.timeline.push({
      type: 'simulation',
      message: `تم زيادة الاستهلاك بمقدار ${inc} وحدة`,
      timestamp: new Date().toISOString(),
    });
    if (state.dailyPlan.current >= state.dailyPlan.target) {
      state.dailyPlan.status = 'exceeded';
      state.automation.alerts.push({
        id: Date.now(),
        type: 'target_exceeded',
        message: 'تم تجاوز الحد اليومي المستهدف',
        timestamp: new Date().toISOString(),
        acknowledged: false,
      });
    }
    await saveAppState(env, state);
    return jsonResponse({ success: true, simulation: state.simulation, dailyPlan: state.dailyPlan });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/admin/simulation/decrease - decrease consumption
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/admin/simulation/decrease' && method === 'POST') {
    const { amount, room } = body;
    const state = await getAppState(env);
    const dec = Number(amount) || 5;
    if (room && state.simulation.rooms[room]) {
      state.simulation.rooms[room].consumption = Math.max(0, state.simulation.rooms[room].consumption - dec);
    }
    state.dailyPlan.current = Math.max(0, state.dailyPlan.current - dec);
    state.simulation.history.push({
      action: 'decrease',
      amount: dec,
      room: room || 'all',
      timestamp: new Date().toISOString(),
    });
    state.timeline.push({
      type: 'simulation',
      message: `تم تقليل الاستهلاك بمقدار ${dec} وحدة`,
      timestamp: new Date().toISOString(),
    });
    if (state.dailyPlan.current < state.dailyPlan.target) {
      state.dailyPlan.status = 'normal';
    }
    await saveAppState(env, state);
    return jsonResponse({ success: true, simulation: state.simulation, dailyPlan: state.dailyPlan });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/admin/simulation/warning - send warning
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/admin/simulation/warning' && method === 'POST') {
    const { message } = body;
    const state = await getAppState(env);
    const warning = {
      id: Date.now(),
      message: message || 'تحذير: استهلاك مرتفع',
      timestamp: new Date().toISOString(),
      active: true,
    };
    state.simulation.warning = warning;
    state.timeline.push({
      type: 'warning',
      message: warning.message,
      timestamp: new Date().toISOString(),
    });
    await saveAppState(env, state);
    return jsonResponse({ success: true, warning });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/admin/simulation/ignore - ignore notification
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/admin/simulation/ignore' && method === 'POST') {
    const { notificationId } = body;
    const state = await getAppState(env);
    state.simulation.notifications = state.simulation.notifications.filter(
      n => n.id !== notificationId
    );
    if (!notificationId) {
      state.simulation.notifications = [];
      state.simulation.warning = null;
    }
    await saveAppState(env, state);
    return jsonResponse({ success: true, simulation: state.simulation });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/admin/simulation/reset - reset simulation
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/admin/simulation/reset' && method === 'POST') {
    const state = await getAppState(env);
    state.simulation = structuredClone(DEFAULT_STATE.simulation);
    state.dailyPlan.current = 0;
    state.dailyPlan.readings = [];
    state.dailyPlan.status = 'normal';
    state.automation.alerts = [];
    state.timeline.push({
      type: 'simulation',
      message: 'تم إعادة تعيين المحاكاة',
      timestamp: new Date().toISOString(),
    });
    await saveAppState(env, state);
    return jsonResponse({ success: true, simulation: state.simulation });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/admin/rooms - get rooms
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/admin/rooms' && method === 'GET') {
    const state = await getAppState(env);
    const rooms = state.simulation.rooms;
    const roomList = Object.entries(rooms).map(([key, room]) => ({
      id: key,
      name: room.name,
      consumption: room.consumption,
      devices: room.devices,
    }));
    return jsonResponse(roomList);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/admin/room/control - control room
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/admin/room/control' && method === 'POST') {
    const { roomId, device, action } = body;
    if (!roomId) return errorResponse('Missing roomId', 400);
    const state = await getAppState(env);
    if (!state.simulation.rooms[roomId]) {
      return errorResponse('Room not found', 404);
    }
    const room = state.simulation.rooms[roomId];
    if (device) {
      const existing = room.devices.find(d => d.id === device.id || d.name === device.name);
      if (existing) {
        Object.assign(existing, device);
      } else {
        room.devices.push(device);
      }
    }
    state.timeline.push({
      type: 'room_control',
      message: `تم التحكم في ${room.name}: ${action || 'تحديث'}`,
      timestamp: new Date().toISOString(),
    });
    await saveAppState(env, state);
    return jsonResponse({ success: true, room });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/admin/system-status - get system status
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/admin/system-status' && method === 'GET') {
    const state = await getAppState(env);
    return jsonResponse(state.systemStatus);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/admin/competition/run - start competition demo
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/admin/competition/run' && method === 'POST') {
    const state = await getAppState(env);
    state.simulation.active = true;
    state.simulation.mode = 'competition';
    state.dailyPlan.current = 0;
    state.dailyPlan.readings = [];
    state.dailyPlan.status = 'normal';
    state.simulation.history = [];
    state.automation.alerts = [];
    state.timeline.push({
      type: 'competition',
      message: 'تم بدء عرض المسابقة',
      timestamp: new Date().toISOString(),
    });
    await saveAppState(env, state);
    return jsonResponse({ success: true, message: 'تم بدء عرض المسابقة' });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/admin/competition/step - step competition demo
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/api/admin/competition/step' && method === 'POST') {
    const { step } = body;
    const state = await getAppState(env);
    const stepNum = Number(step) || 1;

    // Simulate a reading increase
    const increment = Math.floor(Math.random() * 10) + 1;
    state.dailyPlan.current += increment;
    state.dailyPlan.readings.push({
      value: increment,
      timestamp: new Date().toISOString(),
    });
    state.simulation.history.push({
      action: 'step',
      amount: increment,
      step: stepNum,
      timestamp: new Date().toISOString(),
    });
    state.timeline.push({
      type: 'competition_step',
      message: `خطوة ${stepNum}: زيادة ${increment} وحدة`,
      timestamp: new Date().toISOString(),
    });
    if (state.dailyPlan.current >= state.dailyPlan.target) {
      state.dailyPlan.status = 'exceeded';
      state.automation.alerts.push({
        id: Date.now(),
        type: 'competition_target_exceeded',
        message: 'تم تجاوز الحد في عرض المسابقة',
        timestamp: new Date().toISOString(),
        acknowledged: false,
      });
    }
    await saveAppState(env, state);
    return jsonResponse({
      success: true,
      step: stepNum,
      increment,
      dailyPlan: state.dailyPlan,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Hardware Proxy Endpoints → Python Service
  // ──────────────────────────────────────────────────────────────────────────

  if (path === '/api/hardware/connection' && method === 'GET') {
    return proxyToPython(env, '/api/connection');
  }
  if (path === '/api/hardware/control-room' && method === 'POST') {
    return proxyToPython(env, '/api/control-room', 'POST', body);
  }
  if (path === '/api/hardware/room-status' && method === 'GET') {
    return proxyToPython(env, '/api/room-status');
  }
  if (path === '/api/hardware/rooms' && method === 'GET') {
    return proxyToPython(env, '/api/rooms');
  }
  if (path === '/api/hardware/reconnect' && method === 'POST') {
    return proxyToPython(env, '/api/reconnect', 'POST', body);
  }
  if (path === '/api/hardware/auto-test' && method === 'POST') {
    return proxyToPython(env, '/api/auto-test', 'POST', body);
  }
  if (path === '/api/hardware/health' && method === 'GET') {
    return proxyToPython(env, '/api/health');
  }
  if (path === '/api/hardware/history' && method === 'GET') {
    return proxyToPython(env, '/api/history');
  }
  if (path === '/api/hardware/ports' && method === 'GET') {
    return proxyToPython(env, '/api/ports');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Root / Health check
  // ──────────────────────────────────────────────────────────────────────────
  if (path === '/' || path === '/api/health') {
    return jsonResponse({
      status: 'ok',
      service: 'MADAR Backend',
      version: '1.0.0-cloudflare',
      timestamp: new Date().toISOString(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 404 Not Found
  // ──────────────────────────────────────────────────────────────────────────
  return errorResponse('Not Found', 404);
}

// ─── Worker Entry Point ──────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env);
    } catch (err) {
      console.error('Worker error:', err);
      return errorResponse('Internal Server Error: ' + err.message, 500);
    }
  },
};
