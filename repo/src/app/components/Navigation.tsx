import { Link, useLocation } from "react-router";
import { Logo } from "./Logo";
import {
  LayoutDashboard,
  Settings,
  Wifi,
  Lightbulb,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { useState } from "react";

export function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    { path: "/setup", label: "الإعدادات", icon: Settings },
    { path: "/device", label: "الجهاز", icon: Wifi },
    { path: "/insights", label: "التحليلات", icon: Lightbulb },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo size="sm" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                    ${
                      isActive(item.path)
                        ? "bg-[#00ff88]/10 text-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.2)]"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Get Started Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/admin/simulation"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:text-[#ffaa00] hover:bg-[#ffaa00]/10 transition-all duration-200"
              title="Admin Simulation"
            >
              <Shield className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-2 bg-gradient-to-r from-[#00ff88] to-[#00d4ff] text-[#0a0a0f] rounded-lg font-medium hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all duration-300"
            >
              ابدأ دلوقتي
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${
                      isActive(item.path)
                        ? "bg-[#00ff88]/10 text-[#00ff88]"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            <Link
              to="/admin/simulation"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-[#ffaa00] hover:bg-[#ffaa00]/10 transition-all duration-200"
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">Admin Panel</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}