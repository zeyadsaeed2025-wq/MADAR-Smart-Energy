import { Navigation } from "../components/Navigation";
import { GlassCard } from "../components/GlassCard";
import { useState } from "react";
import {
  Home,
  Plus,
  Minus,
  Tv,
  Wind,
  Refrigerator,
  Lightbulb,
  Laptop,
  Coffee,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";

export function UserSetup() {
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState(3);
  const [sockets, setSockets] = useState(8);

  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  const devices = [
    { id: "ac", name: "Air Conditioner", icon: Wind, power: 2.5 },
    { id: "tv", name: "Television", icon: Tv, power: 0.15 },
    { id: "fridge", name: "Refrigerator", icon: Refrigerator, power: 0.4 },
    { id: "lights", name: "LED Lights", icon: Lightbulb, power: 0.06 },
    { id: "laptop", name: "Laptop", icon: Laptop, power: 0.08 },
    { id: "coffee", name: "Coffee Maker", icon: Coffee, power: 1.2 },
  ];

  const toggleDevice = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const totalEstimatedConsumption = selectedDevices.reduce((acc, deviceId) => {
    const device = devices.find((d) => d.id === deviceId);
    return acc + (device?.power || 0);
  }, 0);

  const estimatedDaily = totalEstimatedConsumption * 8; // Assuming 8 hours avg usage
  const recommendedBudget = Math.ceil(estimatedDaily * 1.2); // 20% buffer

  return (
    <div className="min-h-screen bg-[#0a0a0f] dark">
      <Navigation />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Energy Setup Wizard
              </span>
            </h1>
            <p className="text-gray-400">
              Let's configure your smart energy plan in 3 simple steps
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                      s === step
                        ? "bg-gradient-to-r from-[#00ff88] to-[#00d4ff] text-[#0a0a0f] shadow-[0_0_30px_rgba(0,255,136,0.4)]"
                        : s < step
                          ? "bg-[#00ff88] text-[#0a0a0f]"
                          : "bg-white/5 text-gray-500"
                    }`}
                  >
                    {s < step ? <CheckCircle2 className="w-6 h-6" /> : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-16 h-1 rounded-full ${
                        s < step ? "bg-[#00ff88]" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-16 mt-4">
              <p className={`text-sm ${step === 1 ? "text-[#00ff88]" : "text-gray-500"}`}>
                Home Info
              </p>
              <p className={`text-sm ${step === 2 ? "text-[#00ff88]" : "text-gray-500"}`}>
                Devices
              </p>
              <p className={`text-sm ${step === 3 ? "text-[#00ff88]" : "text-gray-500"}`}>
                Review
              </p>
            </div>
          </div>

          {/* Step 1: Home Information */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <GlassCard glow="green">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00ff88]/10 mb-4">
                    <Home className="w-8 h-8 text-[#00ff88]" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Tell us about your home
                  </h2>
                  <p className="text-gray-400">
                    This helps us create a personalized energy plan
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Number of Rooms */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-4">
                      Number of Rooms
                    </label>
                    <div className="flex items-center justify-center gap-6">
                      <button
                        onClick={() => setRooms(Math.max(1, rooms - 1))}
                        className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
                      >
                        <Minus className="w-5 h-5 text-white" />
                      </button>
                      <div className="w-32 text-center">
                        <p className="text-5xl font-bold text-[#00ff88]">{rooms}</p>
                        <p className="text-sm text-gray-400 mt-1">rooms</p>
                      </div>
                      <button
                        onClick={() => setRooms(rooms + 1)}
                        className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Number of Sockets */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-4">
                      Number of Power Sockets
                    </label>
                    <div className="flex items-center justify-center gap-6">
                      <button
                        onClick={() => setSockets(Math.max(1, sockets - 1))}
                        className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
                      >
                        <Minus className="w-5 h-5 text-white" />
                      </button>
                      <div className="w-32 text-center">
                        <p className="text-5xl font-bold text-[#00d4ff]">{sockets}</p>
                        <p className="text-sm text-gray-400 mt-1">sockets</p>
                      </div>
                      <button
                        onClick={() => setSockets(sockets + 1)}
                        className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="px-8 py-3 bg-gradient-to-r from-[#00ff88] to-[#00d4ff] text-[#0a0a0f] rounded-lg font-medium hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all duration-300 flex items-center gap-2"
                  >
                    Next Step
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 2: Select Devices */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <GlassCard glow="blue">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00d4ff]/10 mb-4">
                    <Tv className="w-8 h-8 text-[#00d4ff]" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Select Your Devices
                  </h2>
                  <p className="text-gray-400">
                    Choose the appliances you use regularly
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  {devices.map((device) => {
                    const Icon = device.icon;
                    const isSelected = selectedDevices.includes(device.id);

                    return (
                      <button
                        key={device.id}
                        onClick={() => toggleDevice(device.id)}
                        className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                          isSelected
                            ? "bg-[#00ff88]/10 border-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.3)]"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <Icon
                          className={`w-10 h-10 mx-auto mb-3 ${
                            isSelected ? "text-[#00ff88]" : "text-gray-400"
                          }`}
                        />
                        <p
                          className={`text-sm font-medium mb-1 ${
                            isSelected ? "text-white" : "text-gray-400"
                          }`}
                        >
                          {device.name}
                        </p>
                        <p className="text-xs text-gray-500">{device.power} kW</p>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-medium hover:bg-white/10 transition-all duration-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={selectedDevices.length === 0}
                    className="px-8 py-3 bg-gradient-to-r from-[#00ff88] to-[#00d4ff] text-[#0a0a0f] rounded-lg font-medium hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Step
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 3: Review & Generate Plan */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <GlassCard glow="green">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#00ff88] to-[#00d4ff] mb-4">
                    <CheckCircle2 className="w-8 h-8 text-[#0a0a0f]" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Your Energy Plan
                  </h2>
                  <p className="text-gray-400">
                    We've generated a personalized plan for you
                  </p>
                </div>

                <div className="space-y-6 mb-8">
                  {/* Summary */}
                  <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4">Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Rooms</p>
                        <p className="text-2xl font-bold text-white">{rooms}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Sockets</p>
                        <p className="text-2xl font-bold text-white">{sockets}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Devices</p>
                        <p className="text-2xl font-bold text-white">
                          {selectedDevices.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Total Power</p>
                        <p className="text-2xl font-bold text-white">
                          {totalEstimatedConsumption.toFixed(1)} kW
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Budget */}
                  <div className="p-6 bg-gradient-to-br from-[#00ff88]/10 to-[#00d4ff]/10 rounded-xl border border-[#00ff88]/30 shadow-[0_0_30px_rgba(0,255,136,0.2)]">
                    <h3 className="text-lg font-bold text-white mb-4">
                      Recommended Daily Budget
                    </h3>
                    <div className="flex items-end gap-2 mb-2">
                      <p className="text-5xl font-bold bg-gradient-to-r from-[#00ff88] to-[#00d4ff] bg-clip-text text-transparent">
                        {recommendedBudget}
                      </p>
                      <p className="text-2xl text-gray-400 mb-2">kWh/day</p>
                    </div>
                    <p className="text-sm text-gray-400">
                      Based on your devices, we recommend a daily budget of {recommendedBudget} kWh
                      with a 20% safety buffer.
                    </p>
                  </div>

                  {/* Device List */}
                  <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4">
                      Your Devices
                    </h3>
                    <div className="space-y-3">
                      {selectedDevices.map((deviceId) => {
                        const device = devices.find((d) => d.id === deviceId);
                        if (!device) return null;
                        const Icon = device.icon;

                        return (
                          <div
                            key={deviceId}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-[#00ff88]" />
                              <span className="text-white">{device.name}</span>
                            </div>
                            <span className="text-gray-400">{device.power} kW</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-medium hover:bg-white/10 transition-all duration-300"
                  >
                    Back
                  </button>
                  <button className="px-8 py-3 bg-gradient-to-r from-[#00ff88] to-[#00d4ff] text-[#0a0a0f] rounded-lg font-medium hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all duration-300 flex items-center gap-2">
                    Complete Setup
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
