import { Navigation } from "../components/Navigation";
import { GlassCard } from "../components/GlassCard";
import { StatusIndicator } from "../components/StatusIndicator";
import {
  Zap,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Battery,
  Activity,
  Shield,
  Bell,
  Clock,
  Sun,
  Moon,
  Cpu,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Progress } from "../components/ui/progress";
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";

const API = "http://localhost:3001";

interface DailyPlan {
  dailyTarget: number;
  dayStartReading: number | null;
  dailyConsumption: number;
  remaining: number;
  percentage: number;
  efficiencyScore: number;
  status: string;
}

interface AutomationState {
  optimizationStatus: string;
  notificationCount: number;
  lastNotificationTime: string | null;
  lightState: string;
  escalationStep: number;
}

interface TimelineEvent {
  id: number;
  type: string;
  message: string;
  value: number | null;
  timestamp: string;
}

interface OcrStatusState {
  cameraConnected: boolean;
  totalReadings: number;
  lastReading: string | null;
  lastReadingTime: string | null;
  lastError: string | null;
}

function getEfficiencyColor(score: number): string {
  if (score >= 85) return "#00ff88";
  if (score >= 70) return "#00d4ff";
  if (score >= 50) return "#ffaa00";
  return "#ff4444";
}

function getOptimizationLabel(status: string): string {
  switch (status) {
    case "normal": return "الوضع الطبيعي";
    case "energy_saving": return "توفير الطاقة نشط";
    case "light_dimmed": return "الإضاءة خافتة";
    case "light_off": return "الإضاءة مطفية";
    default: return "الوضع الطبيعي";
  }
}

function getOptimizationColor(status: string): string {
  switch (status) {
    case "normal": return "#00ff88";
    case "energy_saving": return "#ffaa00";
    case "light_dimmed": return "#ff6b35";
    case "light_off": return "#ff4444";
    default: return "#00ff88";
  }
}

function getRecommendation(consumption: number, target: number): string[] {
  const percentage = target > 0 ? (consumption / target) * 100 : 0;
  const tips: string[] = [];

  if (percentage <= 50) {
    tips.push("ممتاز! أنت في المسار الصحيح. واصل 유지.");
  } else if (percentage <= 80) {
    tips.push("استهلك أكتر من النص. راجع الأجهزة المستخدمة.");
    tips.push("قلل تشغيل المكيف أو ارفع الحرارة درجة.");
  } else if (percentage <= 100) {
    tips.push("قربت توصل للحد! قلل استهلاكك فوراً.");
    tips.push("أطفئ الأجهزة غير الضرورية.");
    tips.push("تجنب استخدام الغسالة والمكواة دلوقتي.");
  } else {
    tips.push("تجاوزت الحد اليومي! يجب التدخل فوراً.");
    tips.push("أطفئ كل جهاز غير ضروري.");
    tips.push("النظام قد يقلل الإضاءة تلقائياً.");
  }

  return tips;
}

function LiveCamera() {
  const [imgSrc, setImgSrc] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const fetchImage = () => {
      const timestamp = new Date().getTime();
      setImgSrc(`http://192.168.1.57/capture?t=${timestamp}`);
      setLastUpdate(new Date());
    };
    fetchImage();
    const interval = setInterval(fetchImage, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard glow="blue" hover>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">كاميرا المراقبة</h3>
          <span className="text-xs text-gray-500">
            تحديث: {lastUpdate.toLocaleTimeString("ar-EG")}
          </span>
        </div>
        <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden border border-white/10">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt="ESP32-CAM Live Feed"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              جاري الاتصال بالكاميرا...
            </div>
          )}
          <div className="absolute top-2 left-2 bg-[#ff4444]/80 text-white text-xs px-2 py-1 rounded animate-pulse">
            LIVE
          </div>
        </div>
        <p className="text-xs text-gray-400">
          تأكد من توجيه الكاميرا على عداد الكهربا للقراءة الصحيحة
        </p>
      </div>
    </GlassCard>
  );
}

function LiveReading({ latestReading, connectionStatus }: { latestReading: number | null; connectionStatus: string }) {
  const interpretation = latestReading !== null
    ? latestReading <= 5
      ? { message: "ممتاز! استهلاك منخفض جداً", color: "text-[#00ff88]", icon: "🌟" }
      : latestReading <= 15
        ? { message: "جيد! استهلاك معقول", color: "text-[#00d4ff]", icon: "✅" }
        : latestReading <= 30
          ? { message: "متوسط! ممكن توفر أكتر", color: "text-[#ffaa00]", icon: "⚠️" }
          : latestReading <= 50
            ? { message: "عالي! خد بالك من الاستهلاك", color: "text-[#ff6b35]", icon: "🔶" }
            : { message: "مرتفع جداً! وفّر الكهرباء", color: "text-[#ff4444]", icon: "🚨" }
    : { message: "في انتظار القراءة", color: "text-gray-500", icon: "⏳" };

  return (
    <GlassCard glow={latestReading !== null ? "green" : "none"} hover>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-[#00ff88]/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.3)]">
          <Activity className="w-6 h-6 text-[#00ff88]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">قراءة مباشرة من العداد</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connectionStatus === "online" ? "bg-[#00ff88] animate-pulse" : "bg-[#ff4444]"}`} />
              <span className="text-xs text-gray-500">{connectionStatus === "online" ? "متصل" : "غير متصل"}</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[#00ff88]">
            {latestReading !== null ? `${latestReading} kWh` : "جاري القراءة..."}
          </h3>
          {connectionStatus === "online" && latestReading !== null && (
            <p className={`text-sm font-medium mt-1 ${interpretation.color}`}>
              {interpretation.icon} {interpretation.message}
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function AutomationPanel({ automation, dailyPlan, onAcknowledge }: {
  automation: AutomationState;
  dailyPlan: DailyPlan;
  onAcknowledge: () => void;
}) {
  const statusColor = getOptimizationColor(automation.optimizationStatus);
  const isOverBudget = dailyPlan.percentage > 100;

  return (
    <GlassCard glow={automation.optimizationStatus !== "normal" ? "none" : "green"}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">حالة الأتمتة الذكية</h3>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
          <span className="text-sm font-medium" style={{ color: statusColor }}>
            {getOptimizationLabel(automation.optimizationStatus)}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg border" style={{ borderColor: `${statusColor}40`, backgroundColor: `${statusColor}10` }}>
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5" style={{ color: statusColor }} />
            <span className="text-sm font-bold text-white">
              {automation.optimizationStatus === "normal" ? "النظام يعمل بشكل طبيعي" : "النظام يعمل في وضع توفير"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Bell className="w-3 h-3 text-gray-400" />
              <span className="text-gray-400">التنبيهات: {automation.notificationCount}</span>
            </div>
            <div className="flex items-center gap-2">
              {automation.lightState === "on" ? <Sun className="w-3 h-3 text-[#ffaa00]" /> : <Moon className="w-3 h-3 text-gray-400" />}
              <span className="text-gray-400">الإضاءة: {automation.lightState === "on" ? "مضاءة" : automation.lightState === "dimmed" ? "خافتة" : "مطفية"}</span>
            </div>
          </div>
        </div>

        {isOverBudget && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-[#ff4444]/10 border border-[#ff4444]/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[#ff4444]" />
              <span className="text-sm font-bold text-[#ff4444]">تجاوز الحد اليومي!</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              الاستهلاك وصل {dailyPlan.percentage.toFixed(0)}% من المخطط. النظام هيبدأ تقليل الاستهلاك تلقائياً.
            </p>
            <button
              onClick={onAcknowledge}
              className="w-full px-3 py-2 bg-[#ff4444]/20 border border-[#ff4444]/40 rounded-lg text-xs font-medium text-white hover:bg-[#ff4444]/30 transition-all"
            >
              أنا فاهم - ثبّت التنبيه
            </button>
          </motion.div>
        )}

        <div className="space-y-2">
          {["normal", "energy_saving", "light_dimmed", "light_off"].map((step, i) => (
            <div
              key={step}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                automation.optimizationStatus === step ? "bg-white/5" : "opacity-40"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  automation.optimizationStatus === step ? "animate-pulse" : ""
                }`}
                style={{ backgroundColor: getOptimizationColor(step) }}
              />
              <span className="text-xs text-gray-400">
                {i === 0 && "الطبيعي"}
                {i === 1 && "توفير الطاقة نشط"}
                {i === 2 && "الإضاءة خافتة"}
                {i === 3 && "الإضاءة مطفية"}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <Cpu className="w-3 h-3 text-gray-500" />
          <span className="text-[10px] text-gray-500">
            أوامر التحكم تُرسل فعلياً إلى Arduino عبر Python Control Service
          </span>
        </div>
      </div>
    </GlassCard>
  );
}

function TimelinePanel({ events }: { events: TimelineEvent[] }) {
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">سجل الأحداث</h3>
        <Clock className="w-5 h-5 text-gray-400" />
      </div>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {events.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">لا يوجد أحداث بعد</p>
        )}
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 rounded-lg border border-white/10 bg-white/5"
          >
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: getTypeColor(event.type) }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300">{event.message}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {event.value !== null && (
                    <span className="text-[10px] font-mono" style={{ color: getTypeColor(event.type) }}>
                      {event.value} kWh
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

export function Dashboard() {
  const [latestReading, setLatestReading] = useState<number | null>(null);
  const [readingsHistory, setReadingsHistory] = useState<{ value: number; timestamp: string }[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("offline");
  const [dailyPlan, setDailyPlan] = useState<DailyPlan>({
    dailyTarget: 25,
    dayStartReading: null,
    dailyConsumption: 0,
    remaining: 25,
    percentage: 0,
    efficiencyScore: 95,
    status: "excellent",
  });
  const [automation, setAutomation] = useState<AutomationState>({
    optimizationStatus: "normal",
    notificationCount: 0,
    lastNotificationTime: null,
    lightState: "on",
    escalationStep: 0,
  });
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [ocrStatus, setOcrStatus] = useState<OcrStatusState>({
    cameraConnected: false,
    totalReadings: 0,
    lastReading: null,
    lastReadingTime: null,
    lastError: null,
  });
  const [editingTarget, setEditingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState("25");

  const fetchData = useCallback(async () => {
    try {
      const [latestRes, historyRes, planRes, autoRes, timelineRes, ocrRes] = await Promise.allSettled([
        fetch(`${API}/api/latest`),
        fetch(`${API}/api/readings`),
        fetch(`${API}/api/daily-plan`),
        fetch(`${API}/api/automation`),
        fetch(`${API}/api/timeline`),
        fetch(`${API}/api/ocr/status`),
      ]);

      if (latestRes.status === "fulfilled") {
        const data = await latestRes.value.json();
        if (data.value !== null) {
          const numValue = parseFloat(data.value);
          if (!isNaN(numValue)) {
            setLatestReading(numValue);
            setConnectionStatus("online");
          }
        } else {
          setConnectionStatus("offline");
        }
      }

      if (historyRes.status === "fulfilled") {
        const data = await historyRes.value.json();
        if (data.length > 0) {
          const parsed = data.map((r: { value: string; timestamp: string }) => ({
            value: parseFloat(r.value) || 0,
            timestamp: r.timestamp,
          }));
          setReadingsHistory(parsed.slice(-50));
        }
      }

      if (planRes.status === "fulfilled") {
        setDailyPlan(await planRes.value.json());
      }

      if (autoRes.status === "fulfilled") {
        setAutomation(await autoRes.value.json());
      }

      if (timelineRes.status === "fulfilled") {
        setTimelineEvents(await timelineRes.value.json());
      }

      if (ocrRes.status === "fulfilled") {
        const data = await ocrRes.value.json();
        setOcrStatus({
          cameraConnected: data.cameraConnected || false,
          totalReadings: data.totalReadings || 0,
          lastReading: data.lastReading || null,
          lastReadingTime: data.lastReadingTime || null,
          lastError: data.lastError || null,
        });
      }
    } catch {
      setConnectionStatus("offline");
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAcknowledge = async () => {
    try {
      await fetch(`${API}/api/automation/acknowledge`, { method: "POST" });
      fetchData();
    } catch {}
  };

  const handleUpdateTarget = async () => {
    const val = parseFloat(newTarget);
    if (!isNaN(val) && val > 0) {
      try {
        await fetch(`${API}/api/settings/target`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: val }),
        });
        setEditingTarget(false);
        fetchData();
      } catch {}
    }
  };

  const percentageUsed = dailyPlan.percentage;
  const status = percentageUsed > 90 ? "critical" : percentageUsed > 75 ? "warning" : "normal";
  const monthlyPrediction = latestReading !== null ? Math.round(latestReading * 30) : 0;
  const costEstimate = dailyPlan.dailyConsumption * 0.25;
  const savings = latestReading !== null ? Math.max(0, dailyPlan.dailyTarget * 0.3) : 0;

  const hourlyData = readingsHistory.length > 0
    ? readingsHistory.map((r) => ({
        time: new Date(r.timestamp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", hour12: true }),
        consumption: r.value,
      }))
    : latestReading !== null
      ? [{ time: "الآن", consumption: latestReading }]
      : [];

  const dynamicRecommendations = latestReading !== null ? getRecommendation(dailyPlan.dailyConsumption, dailyPlan.dailyTarget) : [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] dark">
      <Navigation />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                لوحة التحكم
              </span>
            </h1>
            <p className="text-gray-400">
              راقب استهلاك الكهربا بتاعك في الوقت الفعلي
            </p>
          </div>

          <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LiveCamera />
            <LiveReading latestReading={latestReading} connectionStatus={connectionStatus} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <GlassCard glow="green" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">القراءة الحية من العداد</p>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {latestReading !== null ? `${latestReading} kWh` : "-- kWh"}
                  </h3>
                  {latestReading !== null ? (
                    <p className="text-sm font-medium text-[#00ff88]">
                      القيمة المطلقة من ESP32 OCR
                    </p>
                  ) : (
                    <div className={`flex items-center gap-1 text-sm ${connectionStatus === "online" ? "text-[#00ff88]" : "text-gray-500"}`}>
                      {connectionStatus === "online" ? (
                        <><TrendingDown className="w-4 h-4" /><span>جاري المراقبة</span></>
                      ) : (
                        <span>في انتظار القراءة</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#00ff88]/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.3)]">
                  <Zap className="w-6 h-6 text-[#00ff88]" fill="#00ff88" />
                </div>
              </div>
            </GlassCard>

            <GlassCard hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">الاستهلاك اليومي</p>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {dailyPlan.dailyConsumption.toFixed(1)} kWh
                  </h3>
                  <p className={`text-sm font-medium ${dailyPlan.status === "excellent" ? "text-[#00ff88]" : dailyPlan.status === "good" ? "text-[#00d4ff]" : dailyPlan.status === "warning" ? "text-[#ffaa00]" : "text-[#ff4444]"}`}>
                    {dailyPlan.status === "excellent" ? "🌟 ممتاز" : dailyPlan.status === "good" ? "✅ جيد" : dailyPlan.status === "warning" ? "⚠️ انتباه" : "🚨 حرج"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
                  <Battery className="w-6 h-6 text-[#00d4ff]" />
                </div>
              </div>
            </GlassCard>

            <GlassCard hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">التوقع الشهري</p>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {monthlyPrediction > 0 ? `${monthlyPrediction} kWh` : "-- kWh"}
                  </h3>
                  <div className="flex items-center gap-1 text-[#ffaa00] text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>{monthlyPrediction > 0 ? "بناءً على القراءة الحية" : "في انتظار البيانات"}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#ffaa00]/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#ffaa00]" />
                </div>
              </div>
            </GlassCard>

            <GlassCard hover>
              <div>
                <p className="text-sm text-gray-400 mb-3">حالة الكاميرا و OCR</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${ocrStatus.cameraConnected ? "bg-[#00ff88] animate-pulse" : "bg-[#ff4444]"}`} />
                  <span className="text-sm font-medium text-white">{ocrStatus.cameraConnected ? "الكاميرا متصلة" : "الكاميرا غير متصلة"}</span>
                </div>
                <p className="text-xs text-gray-400">
                  القراءات: <span className="text-[#00ff88] font-bold">{ocrStatus.totalReadings}</span>
                </p>
                {ocrStatus.lastError && (
                  <p className="text-xs text-[#ff4444] mt-1">{ocrStatus.lastError}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  آخر قراءة: {ocrStatus.lastReadingTime ? new Date(ocrStatus.lastReadingTime).toLocaleTimeString("ar-EG") : "--"}
                </p>
              </div>
            </GlassCard>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <GlassCard glow={status === "critical" ? "none" : "green"}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white">المخطط اليومي للطاقة</h3>
                      <button
                        onClick={() => setEditingTarget(!editingTarget)}
                        className="p-1 rounded hover:bg-white/10 transition-all"
                      >
                        <Sun className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    {editingTarget ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="number"
                          value={newTarget}
                          onChange={(e) => setNewTarget(e.target.value)}
                          className="w-24 px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm"
                          min="1"
                        />
                        <span className="text-xs text-gray-400">kWh</span>
                        <button onClick={handleUpdateTarget} className="px-2 py-1 bg-[#00ff88]/20 rounded text-xs text-[#00ff88]">حفظ</button>
                        <button onClick={() => setEditingTarget(false)} className="px-2 py-1 bg-white/10 rounded text-xs text-gray-400">إلغاء</button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">
                        الحد اليومي: {dailyPlan.dailyTarget} kWh | قراءة البداية: {dailyPlan.dayStartReading !== null ? `${dailyPlan.dayStartReading} kWh` : "انتظار..."}
                      </p>
                    )}
                  </div>
                  <StatusIndicator status={status} label={`${percentageUsed.toFixed(0)}% مستخدم`} />
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">الطاقة المستخدمة اليوم</span>
                      <span className="text-sm font-medium text-white">
                        {dailyPlan.dailyConsumption.toFixed(1)} / {dailyPlan.dailyTarget} kWh
                      </span>
                    </div>
                    <Progress value={Math.min(percentageUsed, 100)} className="h-3" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">المتبقي اليوم</p>
                      <p className="text-lg font-bold text-[#00ff88]">
                        {dailyPlan.remaining.toFixed(1)} kWh
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">التكلفة المتوقعة</p>
                      <p className="text-lg font-bold text-white">${costEstimate.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">كفاءة الطاقة</p>
                      <p className="text-lg font-bold" style={{ color: getEfficiencyColor(dailyPlan.efficiencyScore) }}>
                        {dailyPlan.efficiencyScore}%
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {hourlyData.length > 0 && (
                <GlassCard>
                  <h3 className="text-xl font-bold text-white mb-4">الاستهلاك اللحظي</h3>
                  <p className="text-sm text-gray-400 mb-6">قراءات العداد المباشرة من ESP32 OCR</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={hourlyData}>
                      <defs>
                        <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="time" stroke="#8a8a95" style={{ fontSize: "12px" }} />
                      <YAxis stroke="#8a8a95" style={{ fontSize: "12px" }} label={{ value: "kWh", angle: -90, position: "insideLeft", fill: "#8a8a95" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#12121a",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Area type="monotone" dataKey="consumption" stroke="#00ff88" strokeWidth={3} fillOpacity={1} fill="url(#colorConsumption)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </GlassCard>
              )}

              {dynamicRecommendations.length > 0 && (
                <GlassCard glow="blue">
                  <h3 className="text-xl font-bold text-white mb-4">توصيات مبنية على القراءة الحية</h3>
                  <div className="space-y-3">
                    {dynamicRecommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                        <Zap className="w-4 h-4 text-[#00d4ff] mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-300">{rec}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </div>

            <div className="space-y-6">
              <AutomationPanel automation={automation} dailyPlan={dailyPlan} onAcknowledge={handleAcknowledge} />

              <TimelinePanel events={timelineEvents} />

              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">التنبيهات</h3>
                  <div className="w-8 h-8 rounded-full bg-[#ff4444]/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#ff4444]">{automation.notificationCount}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {dailyPlan.percentage > 80 && dailyPlan.percentage <= 100 && (
                    <div className="p-4 rounded-lg border bg-[#ffaa00]/5 border-[#ffaa00]/20">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#ffaa00] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white mb-1">اقتراب الحد اليومي</h4>
                          <p className="text-xs text-gray-400">وصلت لـ {dailyPlan.percentage.toFixed(0)}% من حد الاستهلاك اليومي</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {dailyPlan.percentage > 100 && (
                    <div className="p-4 rounded-lg border bg-[#ff4444]/5 border-[#ff4444]/20">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#ff4444] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white mb-1">تجاوز الحد اليومي!</h4>
                          <p className="text-xs text-gray-400">الاستهلاك وصل {dailyPlan.percentage.toFixed(0)}% - النظام يتخذ إجراءات تلقائية</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {dailyPlan.percentage <= 60 && latestReading !== null && (
                    <div className="p-4 rounded-lg border bg-[#00ff88]/5 border-[#00ff88]/20">
                      <div className="flex items-start gap-3">
                        <TrendingDown className="w-5 h-5 text-[#00ff88] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white mb-1">استهلاك ممتاز</h4>
                          <p className="text-xs text-gray-400">أنت ماشي في المسار الصح - واصل كده!</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {latestReading === null && (
                    <p className="text-sm text-gray-500 text-center py-4">في انتظار القراءة من العداد</p>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}