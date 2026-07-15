import { Zap } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        {/* Outer glow circle */}
        <div
          className={`${sizes[size]} rounded-full bg-gradient-to-br from-[#00ff88] to-[#00d4ff] p-0.5 shadow-[0_0_30px_rgba(0,255,136,0.5)]`}
        >
          {/* Inner dark circle */}
          <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center">
            {/* Lightning bolt icon */}
            <Zap
              className={`${size === "sm" ? "w-4 h-4" : size === "md" ? "w-6 h-6" : "w-8 h-8"} text-[#00ff88]`}
              fill="#00ff88"
            />
          </div>
        </div>
        {/* Pulsing animation ring */}
        <div
          className={`absolute inset-0 ${sizes[size]} rounded-full bg-[#00ff88] opacity-20 animate-ping`}
        ></div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <h1
            className={`${textSizes[size]} font-bold bg-gradient-to-r from-[#00ff88] to-[#00d4ff] bg-clip-text text-transparent tracking-tight`}
          >
            مدار
          </h1>
          {size !== "sm" && (
            <p className="text-xs text-muted-foreground tracking-wider">
              طاقة ذكية
            </p>
          )}
        </div>
      )}
    </div>
  );
}