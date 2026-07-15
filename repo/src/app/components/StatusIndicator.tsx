interface StatusIndicatorProps {
  status: "normal" | "warning" | "critical" | "offline" | "online";
  label: string;
  showDot?: boolean;
}

export function StatusIndicator({
  status,
  label,
  showDot = true,
}: StatusIndicatorProps) {
  const statusConfig = {
    normal: {
      color: "#00ff88",
      bg: "bg-[#00ff88]/10",
      border: "border-[#00ff88]/30",
      text: "text-[#00ff88]",
      glow: "shadow-[0_0_10px_rgba(0,255,136,0.3)]",
    },
    online: {
      color: "#00ff88",
      bg: "bg-[#00ff88]/10",
      border: "border-[#00ff88]/30",
      text: "text-[#00ff88]",
      glow: "shadow-[0_0_10px_rgba(0,255,136,0.3)]",
    },
    warning: {
      color: "#ffaa00",
      bg: "bg-[#ffaa00]/10",
      border: "border-[#ffaa00]/30",
      text: "text-[#ffaa00]",
      glow: "shadow-[0_0_10px_rgba(255,170,0,0.3)]",
    },
    critical: {
      color: "#ff4444",
      bg: "bg-[#ff4444]/10",
      border: "border-[#ff4444]/30",
      text: "text-[#ff4444]",
      glow: "shadow-[0_0_10px_rgba(255,68,68,0.3)]",
    },
    offline: {
      color: "#666",
      bg: "bg-gray-500/10",
      border: "border-gray-500/30",
      text: "text-gray-500",
      glow: "",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} ${config.border} border ${config.glow}`}
    >
      {showDot && (
        <div className="relative flex items-center justify-center">
          <div
            className={`w-2 h-2 rounded-full ${config.text.replace("text-", "bg-")}`}
          />
          <div
            className={`absolute w-2 h-2 rounded-full ${config.text.replace("text-", "bg-")} opacity-50 animate-ping`}
          />
        </div>
      )}
      <span className={`text-sm font-medium ${config.text}`}>{label}</span>
    </div>
  );
}
