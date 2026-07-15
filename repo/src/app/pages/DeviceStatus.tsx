import { Navigation } from "../components/Navigation";
import { GlassCard } from "../components/GlassCard";
import { StatusIndicator } from "../components/StatusIndicator";
import {
  Wifi,
  WifiOff,
  Activity,
  Signal,
  RefreshCw,
  MapPin,
  Clock,
  Database,
  Zap,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

export function DeviceStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [dataPoints, setDataPoints] = useState(15847);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setDataPoints((prev) => prev + Math.floor(Math.random() * 3));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const deviceInfo = {
    model: "WM-Energy-IoT-X1",
    serialNumber: "WM-2026-04-15847",
    firmwareVersion: "v2.4.1",
    installDate: "March 15, 2026",
    location: "Main Electrical Panel",
  };

  const networkStats = {
    signalStrength: 92,
    latency: 24,
    uptime: 99.8,
    dataTransferred: 2.4,
  };

  const connectionHistory = [
    { time: "Today, 14:23", status: "Connected", duration: "2h 15m" },
    { time: "Today, 12:08", status: "Disconnected", duration: "5m" },
    { time: "Today, 06:42", status: "Connected", duration: "5h 26m" },
    { time: "Yesterday, 23:11", status: "Connected", duration: "7h 31m" },
  ];

  const getSignalQuality = (strength: number) => {
    if (strength >= 80) return { label: "Excellent", color: "#00ff88" };
    if (strength >= 60) return { label: "Good", color: "#00d4ff" };
    if (strength >= 40) return { label: "Fair", color: "#ffaa00" };
    return { label: "Poor", color: "#ff4444" };
  };

  const signalQuality = getSignalQuality(networkStats.signalStrength);

  return (
    <div className="min-h-screen bg-[#0a0a0f] dark">
      <Navigation />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                IoT Device Status
              </span>
            </h1>
            <p className="text-gray-400">
              Monitor your smart energy meter connectivity and performance
            </p>
          </div>

          {/* Main Status Card */}
          <div className="mb-8">
            <GlassCard glow={isOnline ? "green" : "none"}>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left: Device Visual */}
                <div className="flex flex-col items-center justify-center p-8">
                  <motion.div
                    animate={{
                      scale: isOnline ? [1, 1.05, 1] : 1,
                    }}
                    transition={{
                      duration: 2,
                      repeat: isOnline ? Infinity : 0,
                      ease: "easeInOut",
                    }}
                    className="relative"
                  >
                    {/* Device Icon */}
                    <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-[#12121a] to-[#1a1a24] border-2 border-white/10 flex items-center justify-center relative overflow-hidden shadow-[0_0_60px_rgba(0,255,136,0.3)]">
                      {/* Circuit pattern background */}
                      <div className="absolute inset-0 opacity-10">
                        <img
                          src="https://images.unsplash.com/photo-1771011726530-45b0f51401dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXJjdWl0JTIwYm9hcmQlMjB0ZWNobm9sb2d5JTIwZ3JlZW4lMjBuZW9ufGVufDF8fHx8MTc3NjI0MjY5MXww&ixlib=rb-4.1.0&q=80&w=1080"
                          alt="Circuit"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {isOnline ? (
                        <Wifi className="w-20 h-20 text-[#00ff88] z-10" />
                      ) : (
                        <WifiOff className="w-20 h-20 text-gray-500 z-10" />
                      )}

                      {/* Pulsing ring */}
                      {isOnline && (
                        <motion.div
                          className="absolute inset-0 border-4 border-[#00ff88] rounded-3xl"
                          animate={{
                            opacity: [0.5, 0, 0.5],
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      )}
                    </div>

                    {/* Corner indicators */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#00ff88] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.6)]">
                      <CheckCircle className="w-4 h-4 text-[#0a0a0f]" />
                    </div>
                  </motion.div>

                  <div className="mt-8 text-center">
                    <StatusIndicator
                      status={isOnline ? "online" : "offline"}
                      label={isOnline ? "Device Online" : "Device Offline"}
                    />
                    <p className="text-sm text-gray-400 mt-2">
                      Last update: {lastUpdate.toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Right: Device Info */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Device Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-400">Model</span>
                        <span className="text-white font-medium">
                          {deviceInfo.model}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-400">Serial Number</span>
                        <span className="text-white font-medium font-mono text-sm">
                          {deviceInfo.serialNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-400">Firmware</span>
                        <span className="text-[#00ff88] font-medium">
                          {deviceInfo.firmwareVersion}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-400">Install Date</span>
                        <span className="text-white font-medium">
                          {deviceInfo.installDate}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-400">Location</span>
                        <span className="text-white font-medium">
                          {deviceInfo.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full px-6 py-3 bg-gradient-to-r from-[#00ff88] to-[#00d4ff] text-[#0a0a0f] rounded-lg font-medium hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all duration-300 flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Check for Updates
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Network Statistics */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <GlassCard hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Signal Strength</p>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {networkStats.signalStrength}%
                  </h3>
                  <p
                    className="text-sm font-medium"
                    style={{ color: signalQuality.color }}
                  >
                    {signalQuality.label}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#00ff88]/10 flex items-center justify-center">
                  <Signal className="w-6 h-6 text-[#00ff88]" />
                </div>
              </div>
            </GlassCard>

            <GlassCard hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Latency</p>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {networkStats.latency}ms
                  </h3>
                  <p className="text-sm text-[#00d4ff]">Fast</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-[#00d4ff]" />
                </div>
              </div>
            </GlassCard>

            <GlassCard hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Uptime</p>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {networkStats.uptime}%
                  </h3>
                  <p className="text-sm text-[#00ff88]">30 days</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#00ff88]/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#00ff88]" />
                </div>
              </div>
            </GlassCard>

            <GlassCard hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Data Points</p>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {dataPoints.toLocaleString()}
                  </h3>
                  <p className="text-sm text-gray-400">Total collected</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Data Flow Visualization */}
          <div className="mb-8">
            <GlassCard glow="blue">
              <h3 className="text-xl font-bold text-white mb-6">
                Data Flow Visualization
              </h3>

              <div className="relative py-12">
                {/* Flow diagram */}
                <div className="flex items-center justify-between">
                  {/* Energy Meter */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00ff88] to-[#00d4ff] flex items-center justify-center shadow-[0_0_30px_rgba(0,255,136,0.4)]">
                      <Zap className="w-10 h-10 text-[#0a0a0f]" />
                    </div>
                    <p className="text-sm text-white mt-3 font-medium">
                      Energy Meter
                    </p>
                    <p className="text-xs text-gray-400">Physical Device</p>
                  </motion.div>

                  {/* Arrow 1 */}
                  <div className="flex-1 flex items-center justify-center">
                    <motion.div
                      className="h-1 bg-gradient-to-r from-[#00ff88] to-[#00d4ff] relative"
                      style={{ width: "100%" }}
                      animate={{
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-l-[#00d4ff] border-y-4 border-y-transparent" />
                    </motion.div>
                  </div>

                  {/* IoT Device */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-[#12121a] border-2 border-[#00d4ff] flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.4)]">
                      <Wifi className="w-10 h-10 text-[#00d4ff]" />
                    </div>
                    <p className="text-sm text-white mt-3 font-medium">IoT Hub</p>
                    <p className="text-xs text-gray-400">WM-X1</p>
                  </motion.div>

                  {/* Arrow 2 */}
                  <div className="flex-1 flex items-center justify-center">
                    <motion.div
                      className="h-1 bg-gradient-to-r from-[#00d4ff] to-[#00ff88] relative"
                      style={{ width: "100%" }}
                      animate={{
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: 1,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-l-[#00ff88] border-y-4 border-y-transparent" />
                    </motion.div>
                  </div>

                  {/* Cloud */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#00ff88] flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.4)]">
                      <TrendingUp className="w-10 h-10 text-[#0a0a0f]" />
                    </div>
                    <p className="text-sm text-white mt-3 font-medium">Cloud</p>
                    <p className="text-xs text-gray-400">Processing</p>
                  </motion.div>
                </div>

                {/* Stats below */}
                <div className="grid grid-cols-3 gap-4 mt-12">
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <p className="text-2xl font-bold text-[#00ff88] mb-1">
                      {networkStats.dataTransferred} GB
                    </p>
                    <p className="text-xs text-gray-400">Data Transferred</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <p className="text-2xl font-bold text-[#00d4ff] mb-1">
                      {networkStats.latency}ms
                    </p>
                    <p className="text-xs text-gray-400">Average Latency</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <p className="text-2xl font-bold text-white mb-1">
                      {dataPoints.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">Total Data Points</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Connection History */}
          <GlassCard>
            <h3 className="text-xl font-bold text-white mb-6">
              Connection History
            </h3>
            <div className="space-y-3">
              {connectionHistory.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        entry.status === "Connected"
                          ? "bg-[#00ff88]/10"
                          : "bg-gray-500/10"
                      }`}
                    >
                      {entry.status === "Connected" ? (
                        <Wifi className="w-5 h-5 text-[#00ff88]" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{entry.status}</p>
                      <p className="text-sm text-gray-400">{entry.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white">{entry.duration}</p>
                    <p className="text-sm text-gray-400">Duration</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
