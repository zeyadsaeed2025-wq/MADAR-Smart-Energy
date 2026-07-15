import { Navigation } from "../components/Navigation";
import { GlassCard } from "../components/GlassCard";
import {
  Lightbulb,
  TrendingDown,
  Wind,
  Tv,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  Award,
  Clock,
} from "lucide-react";
import { motion } from "motion/react";

export function Insights() {
  const recommendations = [
    {
      id: 1,
      priority: "high",
      icon: Wind,
      title: "Optimize AC Usage",
      description: "Your AC is consuming 45% of your daily energy. Increase temperature by 2°C to save up to 20%.",
      potentialSaving: "4.2 kWh/day",
      savingAmount: "$1.05/day",
      impact: "High Impact",
      actionable: true,
    },
    {
      id: 2,
      priority: "medium",
      icon: Tv,
      title: "Turn Off Standby Devices",
      description: "3 devices are on standby mode consuming unnecessary power.",
      potentialSaving: "0.8 kWh/day",
      savingAmount: "$0.20/day",
      impact: "Medium Impact",
      actionable: true,
    },
    {
      id: 3,
      priority: "low",
      icon: Lightbulb,
      title: "Switch to LED Lights",
      description: "Replace 5 traditional bulbs with LED to reduce lighting costs by 75%.",
      potentialSaving: "1.2 kWh/day",
      savingAmount: "$0.30/day",
      impact: "Low Impact",
      actionable: false,
    },
    {
      id: 4,
      priority: "medium",
      icon: Sun,
      title: "Peak Hour Awareness",
      description: "Avoid running high-power devices between 2 PM - 5 PM when rates are highest.",
      potentialSaving: "2.1 kWh/day",
      savingAmount: "$0.84/day",
      impact: "Medium Impact",
      actionable: true,
    },
  ];

  const energyTips = [
    {
      icon: Moon,
      title: "Night Mode Automation",
      description: "Set automated schedules to reduce energy usage during night hours.",
    },
    {
      icon: Target,
      title: "Smart Temperature Control",
      description: "Maintain AC temperature between 24-26°C for optimal efficiency.",
    },
    {
      icon: Clock,
      title: "Load Shifting",
      description: "Run washing machines and dishwashers during off-peak hours.",
    },
  ];

  const achievements = [
    {
      title: "Energy Saver",
      description: "Saved 50+ kWh this month",
      progress: 78,
      unlocked: false,
    },
    {
      title: "Eco Warrior",
      description: "30 days of optimized usage",
      progress: 100,
      unlocked: true,
    },
    {
      title: "Smart Home Pro",
      description: "Implemented 10+ recommendations",
      progress: 60,
      unlocked: false,
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return {
          bg: "bg-[#ff4444]/10",
          border: "border-[#ff4444]/30",
          text: "text-[#ff4444]",
          badge: "bg-[#ff4444]",
        };
      case "medium":
        return {
          bg: "bg-[#ffaa00]/10",
          border: "border-[#ffaa00]/30",
          text: "text-[#ffaa00]",
          badge: "bg-[#ffaa00]",
        };
      default:
        return {
          bg: "bg-[#00d4ff]/10",
          border: "border-[#00d4ff]/30",
          text: "text-[#00d4ff]",
          badge: "bg-[#00d4ff]",
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] dark">
      <Navigation />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-[#00ff88]" />
              <h1 className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  AI-Powered Insights
                </span>
              </h1>
            </div>
            <p className="text-gray-400">
              Personalized recommendations to optimize your energy consumption
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <GlassCard hover glow="green">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#00ff88]/10 mb-3">
                  <TrendingDown className="w-6 h-6 text-[#00ff88]" />
                </div>
                <p className="text-3xl font-bold text-[#00ff88] mb-1">8.3 kWh</p>
                <p className="text-sm text-gray-400">Potential Daily Savings</p>
              </div>
            </GlassCard>

            <GlassCard hover>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#00d4ff]/10 mb-3">
                  <Target className="w-6 h-6 text-[#00d4ff]" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">4</p>
                <p className="text-sm text-gray-400">Active Recommendations</p>
              </div>
            </GlassCard>

            <GlassCard hover>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#ffaa00]/10 mb-3">
                  <Award className="w-6 h-6 text-[#ffaa00]" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">2/3</p>
                <p className="text-sm text-gray-400">Achievements Unlocked</p>
              </div>
            </GlassCard>

            <GlassCard hover>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">87%</p>
                <p className="text-sm text-gray-400">Efficiency Score</p>
              </div>
            </GlassCard>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Recommendations */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Recommendations Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Smart Recommendations
                </h2>
                <button className="text-sm text-[#00ff88] hover:underline flex items-center gap-1">
                  Refresh
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Recommendations List */}
              <div className="space-y-4">
                {recommendations.map((rec, index) => {
                  const Icon = rec.icon;
                  const colors = getPriorityColor(rec.priority);

                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <GlassCard hover className={`${colors.border} border-2`}>
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-7 h-7 ${colors.text}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <h3 className="text-lg font-bold text-white">
                                {rec.title}
                              </h3>
                              <span className={`px-2 py-1 ${colors.badge} rounded-full text-xs text-[#0a0a0f] font-medium whitespace-nowrap`}>
                                {rec.impact}
                              </span>
                            </div>

                            <p className="text-sm text-gray-400 mb-4">
                              {rec.description}
                            </p>

                            {/* Savings Info */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-6">
                                <div>
                                  <p className="text-xs text-gray-400">Potential Saving</p>
                                  <p className="text-sm font-bold text-[#00ff88]">
                                    {rec.potentialSaving}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400">Cost Saving</p>
                                  <p className="text-sm font-bold text-white">
                                    {rec.savingAmount}
                                  </p>
                                </div>
                              </div>

                              {rec.actionable && (
                                <button className="px-4 py-2 bg-gradient-to-r from-[#00ff88] to-[#00d4ff] text-[#0a0a0f] rounded-lg font-medium text-sm hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] transition-all duration-300">
                                  Apply Now
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>

              {/* Energy Saving Tips */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Energy Saving Tips
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {energyTips.map((tip, index) => {
                    const Icon = tip.icon;
                    return (
                      <GlassCard key={index} hover>
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#00d4ff]/10 mb-3">
                            <Icon className="w-6 h-6 text-[#00d4ff]" />
                          </div>
                          <h3 className="text-sm font-bold text-white mb-2">
                            {tip.title}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {tip.description}
                          </p>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column - Achievements & Stats */}
            <div className="space-y-6">
              {/* Achievements */}
              <GlassCard glow="green">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="w-6 h-6 text-[#ffaa00]" />
                  <h3 className="text-xl font-bold text-white">Achievements</h3>
                </div>

                <div className="space-y-4">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border ${
                        achievement.unlocked
                          ? "bg-[#00ff88]/10 border-[#00ff88]/30"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-white mb-1">
                            {achievement.title}
                          </h4>
                          <p className="text-xs text-gray-400">
                            {achievement.description}
                          </p>
                        </div>
                        {achievement.unlocked && (
                          <CheckCircle2 className="w-5 h-5 text-[#00ff88] flex-shrink-0 ml-2" />
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${
                              achievement.unlocked
                                ? "bg-[#00ff88]"
                                : "bg-gradient-to-r from-[#00ff88] to-[#00d4ff]"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${achievement.progress}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {achievement.progress}% Complete
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Weekly Challenge */}
              <GlassCard glow="blue">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#00ff88] to-[#00d4ff] mb-4">
                    <Target className="w-8 h-8 text-[#0a0a0f]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Weekly Challenge
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Reduce daily consumption by 15% to earn 500 points!
                  </p>

                  {/* Challenge Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Progress</span>
                      <span className="text-xs font-medium text-white">12%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#00ff88] to-[#00d4ff]"
                        initial={{ width: 0 }}
                        animate={{ width: "12%" }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">
                    3 days remaining
                  </p>
                </div>
              </GlassCard>

              {/* Impact Summary */}
              <GlassCard>
                <h3 className="text-xl font-bold text-white mb-4">
                  Your Impact This Month
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#00ff88]/10 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-[#00ff88]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Energy Saved</p>
                        <p className="text-sm font-bold text-white">47.3 kWh</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
                        <span className="text-lg">💰</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Money Saved</p>
                        <p className="text-sm font-bold text-white">$11.82</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#00ff88]/10 flex items-center justify-center">
                        <span className="text-lg">🌱</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">CO₂ Reduced</p>
                        <p className="text-sm font-bold text-white">23.6 kg</p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
