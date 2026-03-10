"use client";

import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { Download, RefreshCw, X, Sparkles } from "lucide-react";

/**
 * AppUpdater Component
 * Handles checking for updates and prompting the user to install them.
 */
const AppUpdater = () => {
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "found" | "downloading" | "ready">("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        if (typeof window === "undefined" || !(window as any).__TAURI_INTERNALS__) return;
        
        const update = await check();
        if (update) {
          setUpdateInfo(update);
          setStatus("found");
        }
      } catch (err) {
        console.error("Failed to check for updates:", err);
      }
    };

    checkForUpdates();
  }, []);

  const handleUpdate = async () => {
    if (!updateInfo) return;

    try {
      setStatus("downloading");
      let downloaded = 0;
      let total = 0;

      await updateInfo.downloadAndInstall((chunkLength: number, contentLength?: number) => {
        downloaded += chunkLength;
        if (contentLength) {
          total = contentLength;
          setDownloadProgress(Math.round((downloaded / total) * 100));
        }
      });

      setStatus("ready");
    } catch (err) {
      console.error("Failed to download update:", err);
      setStatus("idle");
    }
  };

  const handleRestart = async () => {
    // restart() is available on the update object in v2 or via relaunch
    try {
        // @ts-ignore - plugin-updater restart
        await updateInfo?.restart();
    } catch (e) {
        // Fallback or manual restart hint if needed
        window.location.reload();
    }
  };

  if (status === "idle") return null;

  return (
    <div className="fixed bottom-6 right-6 z-[10000] w-80 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div 
        className="p-4 rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative"
        style={{
          background: "rgba(10, 10, 10, 0.85)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Glow effect */}
        <div 
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "var(--primary)" }}
        />

        {status === "found" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles size={18} className="text-primary" style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Update Available</h4>
                <p className="text-[10px] opacity-60">Version {updateInfo.version} is ready</p>
              </div>
            </div>
            <p className="text-xs opacity-80 leading-relaxed">
                A new version of EcoSystem is available. Would you like to update now?
            </p>
            <div className="flex gap-2 pt-1">
              <button 
                onClick={handleUpdate}
                className="flex-1 px-3 py-2 rounded-lg bg-primary text-background text-xs font-bold transition-transform active:scale-95 flex items-center justify-center gap-1"
                style={{ backgroundColor: "var(--primary)", color: "var(--background)" }}
              >
                <Download size={14} /> Update Now
              </button>
              <button 
                onClick={() => setStatus("idle")}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {status === "downloading" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin text-primary" style={{ color: "var(--primary)" }} />
                Downloading...
              </h4>
              <span className="text-xs font-mono">{downloadProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${downloadProgress}%`, backgroundColor: "var(--primary)" }}
              />
            </div>
          </div>
        )}

        {status === "ready" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                <RefreshCw size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Update Ready</h4>
                <p className="text-[10px] opacity-60 text-green-400">Restart to apply</p>
              </div>
            </div>
            <button 
              onClick={handleRestart}
            //   @ts-ignore
              className="w-full px-3 py-2 rounded-lg bg-primary text-background text-xs font-bold transition-transform active:scale-95 flex items-center justify-center gap-1"
              style={{ backgroundColor: "var(--primary)", color: "var(--background)" }}
            >
              Restart App
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppUpdater;
