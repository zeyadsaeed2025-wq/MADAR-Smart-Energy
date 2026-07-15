import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "green" | "blue" | "none";
}

export function GlassCard({
  children,
  className = "",
  hover = false,
  glow = "none",
}: GlassCardProps) {
  const glowClasses = {
    green: "shadow-[0_0_30px_rgba(0,255,136,0.2)] hover:shadow-[0_0_40px_rgba(0,255,136,0.3)]",
    blue: "shadow-[0_0_30px_rgba(0,212,255,0.2)] hover:shadow-[0_0_40px_rgba(0,212,255,0.3)]",
    none: "",
  };

  return (
    <div
      className={`
        relative bg-[#12121a]/70 backdrop-blur-xl 
        border border-white/10 rounded-2xl p-6
        ${hover ? "transition-all duration-300 hover:scale-[1.02] hover:border-white/20" : ""}
        ${glowClasses[glow]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
