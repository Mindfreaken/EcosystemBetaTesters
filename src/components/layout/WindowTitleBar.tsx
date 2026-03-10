"use client";

import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { X, Minus, Square } from "lucide-react";

const WindowTitleBar = () => {
  const [isTauri, setIsTauri] = useState(false);
  const [appWindow, setAppWindow] = useState<any>(null);

  useEffect(() => {
    // Check if running in Tauri
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      setIsTauri(true);
      setAppWindow(getCurrentWindow());
    }
  }, []);

  if (!isTauri) return null;

  return (
    <div
      data-tauri-drag-region
      className="h-8 flex items-center justify-between select-none fixed top-0 left-0 right-0 z-[9999]"
      style={{
        background: "linear-gradient(to right, rgba(0, 0, 0, 0.8), rgba(20, 20, 20, 0.8))",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(var(--primary-rgb, 100, 100, 255), 0.2)",
      }}
    >
      <div className="flex items-center px-3 gap-2 pointer-events-none">
        <img
          src="/achievements/early_adopter_sticker.png"
          alt="Logo"
          className="w-4 h-4"
        />
        <span className="text-xs font-medium opacity-80" style={{ color: "var(--text)" }}>
          EcoSystem Beta
        </span>
      </div>

      <div className="flex items-center h-full">
        <button
          onClick={() => appWindow?.minimize()}
          className="px-4 h-full transition-colors hover:bg-white/10"
          title="Minimize"
        >
          <Minus size={14} style={{ color: "var(--text)" }} />
        </button>
        <button
          onClick={() => appWindow?.toggleMaximize()}
          className="px-4 h-full transition-colors hover:bg-white/10"
          title="Maximize"
        >
          <Square size={12} style={{ color: "var(--text)" }} />
        </button>
        <button
          onClick={() => appWindow?.close()}
          className="px-4 h-full transition-colors hover:bg-red-500/80 group"
          title="Close"
        >
          <X size={14} className="group-hover:text-white" style={{ color: "var(--text)" }} />
        </button>
      </div>
    </div>
  );
};

export default WindowTitleBar;
