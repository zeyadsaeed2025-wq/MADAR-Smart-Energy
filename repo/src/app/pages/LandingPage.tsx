import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { GlassCard } from "../components/GlassCard";
import {
  Zap,
  TrendingDown,
  Bell,
  Smartphone,
  Activity,
  Shield,
  ArrowRight,
  Wifi,
  Cloud,
} from "lucide-react";
import { motion } from "motion/react";

export function LandingPage() {
  const features = [
    {
      icon: Activity,
      title: "متابعة لحظية",
      description: "راقب استهلاك الكهربا بتاعك لحظة بلحظة مع تحديثات مباشرة",
      color: "#00ff88",
    },
    {
      icon: TrendingDown,
      title: "ميزانية ذكية",
      description: "حدد حد استهلاك يومي واحصل على توصيات ذكية",
      color: "#00d4ff",
    },
    {
      icon: Bell,
      title: "تنبيهات ذكية",
      description: "اتنبه لما توصل لحد الاستهلاك اللي حددته",
      color: "#ffaa00",
    },
    {
      icon: Smartphone,
      title: "متاح من كل حتة",
      description: "تحكم في طاقتك من أي مكان عن طريق الموبايل أو الكمبيوتر",
      color: "#ff00ff",
    },
    {
      icon: Zap,
      title: "IoT متكامل",
      description: "بيتوصل بعداد الكهربا بتاعك بكل سهولة",
      color: "#00ff88",
    },
    {
      icon: Shield,
      title: "آمن ومحمي",
      description: "بياناتك متشفرة ومحفوظة بأمان تام",
      color: "#00d4ff",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] dark">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="sm" />
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                لوحة التحكم
              </Link>
              <Link
                to="/dashboard"
                className="px-6 py-2 bg-gradient-to-r from-[#00ff88] to-[#00d4ff] text-[#0a0a0f] rounded-lg font-medium hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all duration-300"
              >
                ابدأ دلوقتي
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,136,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-right"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-full mb-6">
                <Zap className="w-4 h-4 text-[#00ff88]" />
                <span className="text-sm text-[#00ff88]">
                  منصة طاقة ذكية بتقنية IoT
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  كهربا ذكية.
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#00ff88] to-[#00d4ff] bg-clip-text text-transparent">
                  حياة أذكى.
                </span>
              </h1>

              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0">
                راقب وتحكم ووفر في استهلاك الكهربا بتاعك بمنصتنا الذكية. وفر فلوسك واحمي البيئة في نفس الوقت.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/dashboard"
                  className="group px-8 py-4 bg-gradient-to-r from-[#00ff88] to-[#00d4ff] text-[#0a0a0f] rounded-lg font-medium hover:shadow-[0_0_40px_rgba(0,255,136,0.5)] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  ابدأ دلوقتي
                  <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform rotate-180" />
                </Link>
                <Link
                  to="/setup"
                  className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-lg font-medium hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
                >
                  اعرف أكتر
                </Link>
              </div>
            </motion.div>

            {/* Right Column - Hero Image/Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,255,136,0.3)]">
                <img
                  src="https://images.unsplash.com/photo-1652084824353-a9f939f43555?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMGhvbWUlMjBJb1QlMjBmdXR1cmlzdGljJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NzYyNDI2OTB8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Smart Home IoT"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
              </div>

              {/* Floating stats cards */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute top-8 -right-4 bg-[#12121a]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-[0_0_30px_rgba(0,255,136,0.2)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#00ff88]/10 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-[#00ff88]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">32%-</p>
                    <p className="text-xs text-gray-400">وفّرت</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute bottom-8 -left-4 bg-[#12121a]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-[0_0_30px_rgba(0,212,255,0.2)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-[#00d4ff]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">12.4 kWh</p>
                    <p className="text-xs text-gray-400">النهاردة</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                إزاي بتشتغل؟
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              تركيب بسيط ونتائج قوية
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00ff88] via-[#00d4ff] to-[#00ff88] opacity-20" />

            {[
              {
                icon: Wifi,
                title: "جهاز IoT",
                description: "اوصل جهازنا الذكي بعداد الكهربا بتاعك",
                step: "01",
              },
              {
                icon: Cloud,
                title: "معالجة سحابية",
                description: "البيانات بتتعالج وتتحلل بشكل آمن في الوقت الفعلي",
                step: "02",
              },
              {
                icon: Smartphone,
                title: "لوحة التحكم بتاعتك",
                description: "اتحكم وشوف التقارير من أي جهاز",
                step: "03",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <GlassCard hover glow={index === 1 ? "blue" : "green"}>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#00ff88] to-[#00d4ff] mb-4 shadow-[0_0_30px_rgba(0,255,136,0.4)]">
                        <Icon className="w-8 h-8 text-[#0a0a0f]" />
                      </div>
                      <div className="text-5xl font-bold text-white/5 mb-2">
                        {item.step}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-400">{item.description}</p>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                مميزات قوية
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              كل حاجة محتاجها عشان تتحكم في استهلاك الطاقة بتاعك
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <GlassCard hover>
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${feature.color}15`,
                          boxShadow: `0 0 20px ${feature.color}30`,
                        }}
                      >
                        <Icon className="w-6 h-6" style={{ color: feature.color }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <GlassCard glow="green" className="text-center">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#00ff88] to-[#00d4ff] bg-clip-text text-transparent">
                جاهز تبدأ توفر؟
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              انضم لآلاف الناس الأذكياء اللي بيوفروا في الكهربا والفلوس مع مدار
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-gradient-to-r from-[#00ff88] to-[#00d4ff] text-[#0a0a0f] rounded-lg font-medium hover:shadow-[0_0_40px_rgba(0,255,136,0.5)] transition-all duration-300 inline-flex items-center justify-center gap-2"
              >
                ابدأ دلوقتي
                <ArrowRight className="w-5 h-5 rotate-180" />
              </Link>
              <Link
                to="/setup"
                className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-lg font-medium hover:bg-white/10 transition-all duration-300"
              >
                شوف التجربة
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-gray-400 text-sm">
              © 2026 مدار. كل الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                الخصوصية
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                الشروط
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                تواصل معنا
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
