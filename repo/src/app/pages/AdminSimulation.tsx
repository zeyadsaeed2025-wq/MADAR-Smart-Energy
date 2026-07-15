import { Navigation } from "../components/Navigation";
import { GlassCard } from "../components/GlassCard";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, Power, Zap, AlertTriangle, TrendingUp, TrendingDown,
  Camera, Cpu, Wifi, Database, Server, Lightbulb, Sun, Moon,
  Play, Pause, RotateCcw, ChevronDown, Eye, Radio, Activity,
  ArrowDown, ArrowUp, Clock, CheckCircle2, XCircle, Bell,
  Monitor, CircuitBoard, Timer, Flame,
} from "lucide-react";

const API = "http://localhost:3001";

interface Room {
  id: string;
  name: string;
  nameEn: string;
  state: "on" | "dimmed" | "off";
  brightness: number;
  command: string;
}

interface SimTimelineEvent {
  id: number;
  type: string;
  message: string;
  timestamp: string;
}

interface SystemStatusItem {
  status: string;
  label: string;
  lastPing: string | null;
}

interface SimulationState {
  simulationMode: boolean;
  state: {
    simulatedReading: string | null;
    rooms: Room[];
    automationStep: number;
    simulationTimeline: SimTimelineEvent[];
    competitionRunning: boolean;
    competitionStep: number;
  };
  systemStatus: {
    esp32Camera: SystemStatusItem;
    ocrEngine: SystemStatusItem;
    arduino: SystemStatusItem;
    websiteServer: SystemStatusItem;
    database: SystemStatusItem;
  };
}

interface HwHealth {
  status: string;
  connected: boolean;
  monitor_running?: boolean;
  uptime?: number;
}

interface HwRoom {
  state: string;
  brightness: number;
  name: string;
  name_ar: string;
  last_command: string | null;
  last_updated: number;
}

interface HwCommand {
  room: number;
  action: string;
  serial_cmd: string;
  status: string;
  timestamp: number;
  response: string | null;
  error: string | null;
}

const AUTOMATION_STEPS = [
  { key: "monitoring", label: "مراقبة الاستهلاك", icon: Activity, color: "#00ff88" },
  { key: "notification", label: "إرسال التنبيه", icon: Bell, color: "#00d4ff" },
  { key: "waiting", label: "انتظار رد المستخدم", icon: Clock, color: "#ffaa00" },
  { key: "saving", label: "تفعيل توفير الطاقة", icon: Zap, color: "#ff6b35" },
  { key: "dimming", label: "تخفيف الإضاءة", icon: Moon, color: "#ff6b35" },
  { key: "off", label: "إطفاء الإضاءة", icon: XCircle, color: "#ff4444" },
  { key: "decreasing", label: "انخفاض الاستهلاك", icon: TrendingDown, color: "#00ff88" },
  { key: "restored", label: "العودة للوضع الطبيعي", icon: CheckCircle2, color: "#00ff88" },
];

function SystemStatusSection({ systemStatus }: { systemStatus: SimulationState["systemStatus"] }) {
  const items = [
    { key: "esp32Camera", label: "كاميرا ESP32", icon: Camera, data: systemStatus?.esp32Camera },
    { key: "ocrEngine", label: "محرك OCR", icon: Cpu, data: systemStatus?.ocrEngine },
    { key: "arduino", label: "Arduino", icon: CircuitBoard, data: systemStatus?.arduino },
    { key: "websiteServer", label: "خادم الموقع", icon: Server, data: systemStatus?.websiteServer },
    { key: "database", label: "قاعدة البيانات", icon: Database, data: systemStatus?.database },
  ];

  return (
    <GlassCard>
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Monitor className="w-5 h-5 text-[#00d4ff]" />
        حالة النظام
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isOnline = item.data?.status === "online";
          const isWaiting = item.data?.status === "waiting";
          return (
            <div
              key={item.key}
              className={`p-3 rounded-xl border transition-all ${
                isOnline
                  ? "bg-[#00ff88]/5 border-[#00ff88]/30"
                  : isWaiting
                    ? "bg-[#ffaa00]/5 border-[#ffaa00]/30"
                    : "bg-[#ff4444]/5 border-[#ff4444]/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${isOnline ? "text-[#00ff88]" : isWaiting ? "text-[#ffaa00]" : "text-[#ff4444]"}`} />
                <span className="text-xs font-medium text-gray-300">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-[#00ff88] animate-pulse" : isWaiting ? "bg-[#ffaa00] animate-pulse" : "bg-[#ff4444]"}`} />
                <span className={`text-sm font-bold ${isOnline ? "text-[#00ff88]" : isWaiting ? "text-[#ffaa00]" : "text-[#ff4444]"}`}>
                  {item.data?.label || "--"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function LiveMeterSection({ reading }: { reading: string | null }) {
  return (
    <GlassCard glow="green">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-[#00ff88]" />
        قراءة العداد المباشر
      </h3>
      <div className="flex items-center justify-center py-6">
        <div className="text-center">
          <motion.div
            key={reading}
            initial={{ scale: 0.95, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl font-bold text-[#00ff88] mb-2"
          >
            {reading || "--"}
          </motion.div>
          <p className="text-lg text-gray-400">kWh</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-xs text-gray-500">قراءة حية من ESP32 OCR</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function SimControlsSection({ onAction, disabled }: { onAction: (action: string) => void; disabled: boolean }) {
  const buttons = [
    { action: "increase", label: "زيادة الاستهلاك", icon: TrendingUp, color: "from-[#ff4444] to-[#ff6b35]", textColor: "text-[#ff4444]" },
    { action: "decrease", label: "تقليل الاستهلاك", icon: TrendingDown, color: "from-[#00ff88] to-[#00d4ff]", textColor: "text-[#00ff88]" },
    { action: "warning", label: "إرسال تنبيه", icon: Bell, color: "from-[#ffaa00] to-[#ff6b35]", textColor: "text-[#ffaa00]" },
    { action: "ignore", label: "تجاهل التنبيه", icon: XCircle, color: "from-[#ff4444] to-[#ff0044]", textColor: "text-[#ff4444]" },
    { action: "reset", label: "إعادة تعيين", icon: RotateCcw, color: "from-gray-500 to-gray-600", textColor: "text-gray-400" },
  ];

  return (
    <GlassCard>
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-[#ffaa00]" />
        أدوات المحاكاة
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {buttons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.action}
              onClick={() => onAction(btn.action)}
              disabled={disabled}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
                disabled
                  ? "opacity-30 cursor-not-allowed border-white/10 bg-white/5"
                  : `border-white/20 bg-white/5 hover:bg-white/10 hover:scale-105 active:scale-95`
              }`}
            >
              <Icon className={`w-4 h-4 ${disabled ? "text-gray-600" : btn.textColor}`} />
              <span className={`text-sm font-medium ${disabled ? "text-gray-600" : "text-white"}`}>
                {btn.label}
              </span>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}

function RoomControlSection({ rooms, onRoomAction, disabled }: { rooms: Room[]; onRoomAction: (roomId: string, action: string) => void; disabled: boolean }) {
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.id || "living_room");

  return (
    <GlassCard glow="blue">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-[#ffaa00]" />
        تحكم بالغرف
      </h3>
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">اختر الغرفة</label>
        <div className="relative">
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:border-[#00d4ff]/50 focus:outline-none disabled:opacity-30"
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id} className="bg-[#12121a]">
                {room.name} ({room.nameEn})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onRoomAction(selectedRoom, "dim")}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
            disabled
              ? "opacity-30 cursor-not-allowed border-white/10 bg-white/5"
              : "border-[#ffaa00]/30 bg-[#ffaa00]/5 hover:bg-[#ffaa00]/10 hover:scale-105"
          }`}
        >
          <Moon className={`w-4 h-4 ${disabled ? "text-gray-600" : "text-[#ffaa00]"}`} />
          <span className={`text-sm font-medium ${disabled ? "text-gray-600" : "text-white"}`}>تخفيف</span>
        </button>
        <button
          onClick={() => onRoomAction(selectedRoom, "off")}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
            disabled
              ? "opacity-30 cursor-not-allowed border-white/10 bg-white/5"
              : "border-[#ff4444]/30 bg-[#ff4444]/5 hover:bg-[#ff4444]/10 hover:scale-105"
          }`}
        >
          <Power className={`w-4 h-4 ${disabled ? "text-gray-600" : "text-[#ff4444]"}`} />
          <span className={`text-sm font-medium ${disabled ? "text-gray-600" : "text-white"}`}>إطفاء</span>
        </button>
        <button
          onClick={() => onRoomAction(selectedRoom, "on")}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
            disabled
              ? "opacity-30 cursor-not-allowed border-white/10 bg-white/5"
              : "border-[#00ff88]/30 bg-[#00ff88]/5 hover:bg-[#00ff88]/10 hover:scale-105"
          }`}
        >
          <Sun className={`w-4 h-4 ${disabled ? "text-gray-600" : "text-[#00ff88]"}`} />
          <span className={`text-sm font-medium ${disabled ? "text-gray-600" : "text-white"}`}>تشغيل</span>
        </button>
      </div>
    </GlassCard>
  );
}

function RoomStatusSection({ rooms }: { rooms: Room[] }) {
  return (
    <GlassCard>
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Eye className="w-5 h-5 text-[#00d4ff]" />
        حالة الغرف
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`p-4 rounded-xl border text-center transition-all ${
              room.state === "on"
                ? "bg-[#00ff88]/5 border-[#00ff88]/30"
                : room.state === "dimmed"
                  ? "bg-[#ffaa00]/5 border-[#ffaa00]/30"
                  : "bg-[#ff4444]/5 border-[#ff4444]/30"
            }`}
          >
            <div className="flex items-center justify-center mb-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: room.state === "on" ? "rgba(0,255,136,0.1)" : room.state === "dimmed" ? "rgba(255,170,0,0.1)" : "rgba(255,68,68,0.1)",
                  boxShadow: room.state === "off" ? "none" : `0 0 ${room.brightness / 2}px rgba(255,255,255,${room.brightness / 200})`,
                }}
              >
                <Sun
                  className="w-6 h-6 transition-all"
                  style={{
                    color: room.state === "on" ? "#00ff88" : room.state === "dimmed" ? "#ffaa00" : "#ff4444",
                    opacity: room.brightness / 100,
                  }}
                />
              </div>
            </div>
            <p className="text-sm font-medium text-white mb-1">{room.name}</p>
            <span className={`text-xs font-bold ${
              room.state === "on" ? "text-[#00ff88]" : room.state === "dimmed" ? "text-[#ffaa00]" : "text-[#ff4444]"
            }`}>
              {room.state === "on" ? "مضاءة" : room.state === "dimmed" ? "خافتة" : "مطفية"}
            </span>
            <div className="mt-2">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${room.brightness}%`,
                    backgroundColor: room.state === "on" ? "#00ff88" : room.state === "dimmed" ? "#ffaa00" : "#ff4444",
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{room.brightness}%</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function AutomationPreviewSection({ currentStep }: { currentStep: number }) {
  return (
    <GlassCard glow="blue">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Radio className="w-5 h-5 text-[#00d4ff]" />
        مراحل الأتمتة
      </h3>
      <div className="space-y-2">
        {AUTOMATION_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          return (
            <motion.div
              key={step.key}
              initial={false}
              animate={{
                backgroundColor: isActive ? `${step.color}15` : isCompleted ? "rgba(0,255,136,0.05)" : "transparent",
                borderColor: isActive ? `${step.color}40` : isCompleted ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.05)",
              }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isActive ? "scale-[1.02]" : ""
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{
                backgroundColor: isActive ? `${step.color}20` : isCompleted ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.05)",
              }}>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
                ) : (
                  <Icon className="w-4 h-4" style={{ color: isActive ? step.color : "#666" }} />
                )}
              </div>
              <div className="flex-1">
                <span className={`text-sm font-medium ${isActive ? "text-white" : isCompleted ? "text-[#00ff88]" : "text-gray-500"}`}>
                  {step.label}
                </span>
              </div>
              {isActive && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: step.color }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function TimelineSection({ events }: { events: SimTimelineEvent[] }) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "success": return "#00ff88";
      case "warning": return "#ffaa00";
      case "critical": return "#ff4444";
      default: return "#00d4ff";
    }
  };

  return (
    <GlassCard>
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-400" />
        سجل الأحداث
      </h3>
      <div className="space-y-2 max-h-[350px] overflow-y-auto">
        {events.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">لا يوجد أحداث بعد</p>
        )}
        {[...events].reverse().map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5"
          >
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: getTypeColor(event.type) }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300">{event.message}</p>
              <span className="text-[10px] text-gray-500">
                {new Date(event.timestamp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

function HardwareSection({
  hwRooms,
  hwCommands,
  onReconnect,
  reconnecting,
}: {
  hwRooms: Record<string, HwRoom>;
  hwCommands: HwCommand[];
  onReconnect: () => void;
  reconnecting: boolean;
}) {
  const roomEntries = Object.entries(hwRooms || {});
  return (
    <GlassCard>
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <CircuitBoard className="w-5 h-5 text-[#00d4ff]" />
        Hardware Live Status
      </h3>
      {roomEntries.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {roomEntries.map(([key, room]) => {
            const isOn = room.state === "ON";
            const isDim = room.state === "DIM";
            return (
              <div
                key={key}
                className={`p-3 rounded-xl border text-center ${
                  isOn ? "bg-[#00ff88]/5 border-[#00ff88]/30"
                    : isDim ? "bg-[#ffaa00]/5 border-[#ffaa00]/30"
                      : "bg-[#ff4444]/5 border-[#ff4444]/30"
                }`}
              >
                <Sun
                  className="w-6 h-6 mx-auto mb-1"
                  style={{
                    color: isOn ? "#00ff88" : isDim ? "#ffaa00" : "#ff4444",
                    opacity: room.brightness / 100 || 0.3,
                  }}
                />
                <p className="text-xs font-bold text-white">{room.name_ar}</p>
                <span className={`text-[10px] font-bold ${
                  isOn ? "text-[#00ff88]" : isDim ? "text-[#ffaa00]" : "text-[#ff4444]"
                }`}>
                  {room.state} ({room.brightness}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
      {hwCommands.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 font-bold mb-2">آخر أوامر Serial</p>
          <div className="space-y-1 max-h-[150px] overflow-y-auto">
            {[...hwCommands].reverse().map((cmd, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 text-xs">
                <code className="text-[#00d4ff] font-mono">{cmd.serial_cmd}</code>
                <span className={`font-bold ${cmd.status === "acknowledged" ? "text-[#00ff88]" : "text-[#ff4444]"}`}>
                  {cmd.status}
                </span>
                <span className="text-gray-500">{new Date(cmd.timestamp * 1000).toLocaleTimeString("ar-EG")}</span>
                {cmd.response && <span className="text-gray-400">← {cmd.response}</span>}
                {cmd.error && <span className="text-[#ff4444]">← {cmd.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={onReconnect}
          disabled={reconnecting}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
            reconnecting
              ? "opacity-50 cursor-not-allowed border-white/10 bg-white/5 text-gray-500"
              : "border-[#00d4ff]/30 bg-[#00d4ff]/5 text-[#00d4ff] hover:bg-[#00d4ff]/10 hover:scale-105"
          }`}
        >
          <RotateCcw className={`w-4 h-4 ${reconnecting ? "animate-spin" : ""}`} />
          {reconnecting ? "جاري إعادة الاتصال..." : "إعادة اتصال Arduino"}
        </button>
      </div>
    </GlassCard>
  );
}

function CompetitionSection({ onRun, onStep, running, disabled }: { onRun: () => void; onStep: () => void; running: boolean; disabled: boolean }) {
  return (
    <GlassCard glow="green">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Flame className="w-5 h-5 text-[#ff4444]" />
        وضع العرض التوضيحي
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        اضغط "بدء العرض" لتشغيل تسلسل توضيحي كامل للمشاركة. أو اضغط "التالي" للتحكم يدوياً في كل خطوة.
      </p>
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
        <p className="text-xs text-gray-400 mb-2 font-bold">تسلسل العرض:</p>
        <div className="flex flex-wrap gap-2">
          {["زيادة الاستهلاك", "إرسال تنبيه", "تجاهل التنبيه", "تخفيف الإضاءة", "إطفاء الإضاءة", "انخفاض الاستهلاك", "نجاح التوفير", "إعادة التشغيل"].map((step, i) => (
            <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
              {i + 1}. {step}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRun}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
            disabled
              ? "opacity-30 cursor-not-allowed bg-white/5 text-gray-600"
              : "bg-gradient-to-r from-[#00ff88] to-[#00d4ff] text-[#0a0a0f] hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] hover:scale-105"
          }`}
        >
          <Play className="w-4 h-4" />
          {running ? "جاري العرض..." : "بدء العرض"}
        </button>
        <button
          onClick={onStep}
          disabled={disabled || running}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-medium transition-all duration-200 ${
            disabled || running
              ? "opacity-30 cursor-not-allowed border-white/10 bg-white/5 text-gray-600"
              : "border-[#ffaa00]/30 bg-[#ffaa00]/5 text-[#ffaa00] hover:bg-[#ffaa00]/10 hover:scale-105"
          }`}
        >
          <ArrowDown className="w-4 h-4" />
          التالية
        </button>
      </div>
    </GlassCard>
  );
}

export function AdminSimulation() {
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoDemoRunning, setAutoDemoRunning] = useState(false);
  const [hwHealth, setHwHealth] = useState<HwHealth | null>(null);
  const [hwRoomStatus, setHwRoomStatus] = useState<Record<string, HwRoom>>({});
  const [hwCommands, setHwCommands] = useState<HwCommand[]>([]);
  const [hwReconnecting, setHwReconnecting] = useState(false);
  const autoDemoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/simulation/status`);
      const data = await res.json();
      setSimState(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
    try {
      const [hwRes, hwRoomsRes, hwHistRes] = await Promise.allSettled([
        fetch(`${API}/api/hardware/health`),
        fetch(`${API}/api/hardware/rooms`),
        fetch(`${API}/api/hardware/history`),
      ]);
      if (hwRes.status === "fulfilled") {
        setHwHealth(await hwRes.value.json());
      } else {
        setHwHealth({ status: "offline", connected: false });
      }
      if (hwRoomsRes.status === "fulfilled") {
        const d = await hwRoomsRes.value.json();
        setHwRoomStatus(d.rooms || {});
      }
      if (hwHistRes.status === "fulfilled") {
        const d = await hwHistRes.value.json();
        setHwCommands(d.commands || []);
      }
    } catch {
      setHwHealth({ status: "offline", connected: false });
    }
  }, []);

  const handleReconnect = async () => {
    setHwReconnecting(true);
    try {
      await fetch(`${API}/api/hardware/reconnect`, { method: "POST" });
    } catch { /* silent */ }
    setTimeout(async () => {
      await fetchState();
      setHwReconnecting(false);
    }, 3000);
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

  const toggleSimulation = async () => {
    await fetch(`${API}/api/admin/simulation/toggle`, { method: "POST" });
    fetchState();
  };

  const handleSimAction = async (action: string) => {
    await fetch(`${API}/api/admin/simulation/${action}`, { method: "POST" });
    setTimeout(fetchState, 300);
  };

  const handleRoomAction = async (roomId: string, action: string) => {
    await fetch(`${API}/api/admin/room/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, action }),
    });
    setTimeout(fetchState, 300);
  };

  const startAutoDemo = async () => {
    setAutoDemoRunning(true);
    await fetch(`${API}/api/admin/competition/run`, { method: "POST" });
    fetchState();

    let step = 0;
    autoDemoRef.current = setInterval(async () => {
      if (step >= 8) {
        if (autoDemoRef.current) clearInterval(autoDemoRef.current);
        setAutoDemoRunning(false);
        fetchState();
        return;
      }
      await fetch(`${API}/api/admin/competition/step`, { method: "POST" });
      fetchState();
      step++;
    }, 2000);
  };

  const stopAutoDemo = () => {
    if (autoDemoRef.current) clearInterval(autoDemoRef.current);
    setAutoDemoRunning(false);
  };

  useEffect(() => {
    return () => {
      if (autoDemoRef.current) clearInterval(autoDemoRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-12 h-12 border-2 border-[#00ff88] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">جاري تحميل لوحة المحاكاة...</p>
        </div>
      </div>
    );
  }

  const isSimOn = simState?.simulationMode ?? false;
  const rooms = simState?.state?.rooms ?? [];
  const timeline = simState?.state?.simulationTimeline ?? [];
  const systemStatus = simState?.systemStatus ?? {
    esp32Camera: { status: "offline", label: "--", lastPing: null },
    ocrEngine: { status: "offline", label: "--", lastPing: null },
    arduino: { status: "offline", label: "--", lastPing: null },
    websiteServer: { status: "offline", label: "--", lastPing: null },
    database: { status: "offline", label: "--", lastPing: null },
  };

  const latestReading = simState?.state?.simulatedReading || null;
  const competitionRunning = simState?.state?.competitionRunning ?? false;

  const currentAutoStep = (() => {
    const optStatus = simState?.state;
    if (!optStatus) return 0;
    if (optStatus.competitionRunning) return simState?.state?.competitionStep ?? 0;
    if (optStatus.automationStep === 0) return 0;
    if (optStatus.automationStep === 1) return 2;
    if (optStatus.automationStep === 2) return 4;
    if (optStatus.automationStep === 3) return 5;
    return 0;
  })();

  return (
    <div className="min-h-screen bg-[#0a0a0f] dark">
      <Navigation />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Header + Simulation Mode Toggle */}
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-[#ffaa00]" />
                <h1 className="text-4xl font-bold">
                  <span className="bg-gradient-to-r from-[#ffaa00] to-[#ff6b35] bg-clip-text text-transparent">
                    Admin Simulation Panel
                  </span>
                </h1>
              </div>
              <p className="text-gray-400">
                لوحة المحاكاة التوضيحية - للاختبار والمسابقات فقط
              </p>
            </div>

            {/* Simulation Mode Switch */}
            <GlassCard className="!p-4 flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Power className={`w-5 h-5 ${isSimOn ? "text-[#00ff88]" : "text-gray-500"}`} />
                <div>
                  <p className="text-sm font-bold text-white">وضع المحاكاة</p>
                  <p className="text-xs text-gray-400">{isSimOn ? "مفعّل" : "معطّل"}</p>
                </div>
              </div>
              <button
                onClick={toggleSimulation}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                  isSimOn ? "bg-[#00ff88]" : "bg-gray-600"
                }`}
              >
                <motion.div
                  animate={{ x: isSimOn ? 28 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                />
              </button>
            </GlassCard>
          </div>

          {/* Warning Banner */}
          {!isSimOn && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-xl bg-[#ffaa00]/10 border border-[#ffaa00]/30 flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-[#ffaa00] flex-shrink-0" />
              <p className="text-sm text-[#ffaa00]">
                فعّل وضع المحاكاة للوصول لأدوات التحكم. الموقع يعمل بشكل طبيعي للمستخدمين العاديين.
              </p>
            </motion.div>
          )}

          {isSimOn && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Section 1: System Status */}
              <SystemStatusSection systemStatus={systemStatus} />

              {/* Hardware Bridge Status */}
              <GlassCard>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <CircuitBoard className="w-5 h-5 text-[#00d4ff]" />
                  Hardware Bridge (Python Service)
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${hwHealth?.connected ? "bg-[#00ff88] animate-pulse" : "bg-[#ff4444]"}`} />
                    <span className={`text-sm font-medium ${hwHealth?.connected ? "text-[#00ff88]" : "text-[#ff4444]"}`}>
                      {hwHealth?.connected ? "Arduino متصل" : "Arduino غير متصل"}
                    </span>
                  </div>
                  {hwHealth?.monitor_running !== undefined && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      hwHealth.monitor_running ? "text-[#00d4ff] bg-[#00d4ff]/10" : "text-gray-500 bg-white/5"
                    }`}>
                      Monitor: {hwHealth.monitor_running ? "Active" : "Idle"}
                    </span>
                  )}
                  {hwHealth?.uptime !== undefined && hwHealth.uptime > 0 && (
                    <span className="text-xs text-gray-500">
                      Uptime: {Math.floor(hwHealth.uptime / 60)}m {Math.floor(hwHealth.uptime % 60)}s
                    </span>
                  )}
                </div>
              </GlassCard>

              {/* Section 2: Live Meter + Section 3: Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LiveMeterSection reading={latestReading} />
                <SimControlsSection onAction={handleSimAction} disabled={!isSimOn} />
              </div>

              {/* Section 4: Room Controller + Section 7: Room Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RoomControlSection rooms={rooms} onRoomAction={handleRoomAction} disabled={!isSimOn} />
                <RoomStatusSection rooms={rooms} />
              </div>

              {/* Section 6: Automation Preview + Section 5: Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AutomationPreviewSection currentStep={currentAutoStep} />
                <TimelineSection events={timeline} />
              </div>

              {/* Section 8: Hardware Integration */}
              <HardwareSection
                hwRooms={hwRoomStatus}
                hwCommands={hwCommands}
                onReconnect={handleReconnect}
                reconnecting={hwReconnecting}
              />

              {/* Section 9: Competition Mode */}
              <CompetitionSection
                onRun={autoDemoRunning ? stopAutoDemo : startAutoDemo}
                onStep={() => handleSimAction("competition-step")}
                running={autoDemoRunning}
                disabled={!isSimOn}
              />

              {/* Section 10: Prototype Sync Info */}
              <GlassCard>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-[#00d4ff]" />
                  مزامنة البروتوتايب
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-gray-400 mb-1">الأداة</p>
                    <p className="text-sm font-bold text-white">عداد الكهربا LCD</p>
                    <p className="text-[10px] text-gray-500">يُقرأ عبر ESP32-CAM OCR</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-gray-400 mb-1">الأداة</p>
                    <p className="text-sm font-bold text-white">ESP32-CAM</p>
                    <p className="text-[10px] text-gray-500">التقاط صور + OCR</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-gray-400 mb-1">الأداة</p>
                    <p className="text-sm font-bold text-white">Arduino</p>
                    <p className="text-[10px] text-gray-500">تحكم LED بالـ PWM</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-gray-400 mb-1">الأداة</p>
                    <p className="text-sm font-bold text-white">LEDs بيضاء</p>
                    <p className="text-[10px] text-gray-500">تخفيف بالسطوعية PWM</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}