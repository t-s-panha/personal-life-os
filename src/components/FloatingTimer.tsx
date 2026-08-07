"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTimer } from "@/context/TimerContext";
import { formatDuration, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, ChevronDown, ChevronUp, Clock, Loader2 } from "lucide-react";

export function FloatingTimer() {
  const router = useRouter();
  const {
    activeTimer,
    isRunning,
    isPaused,
    elapsedSeconds,
    isSubmitting,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useTimer();

  const [collapsed, setCollapsed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!activeTimer) return null;

  const handleStop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMsg(null);
    const success = await stopTimer();
    if (!success && activeTimer) {
      setErrorMsg("Couldn't save time entry. Tap to retry.");
    }
  };

  const handleTogglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPaused) resumeTimer();
    else pauseTimer();
  };

  const handleNavigateToTime = () => {
    router.push("/time");
  };

  // Compact collapsed pill view
  if (collapsed) {
    return (
      <div
        onClick={handleNavigateToTime}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-card/95 backdrop-blur border border-primary/30 shadow-xl px-3 py-2 rounded-full cursor-pointer hover:bg-accent/80 transition-all touch-manipulation mb-[env(safe-area-inset-bottom)] select-none"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isPaused ? "bg-amber-400" : "bg-emerald-400")} />
          <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", isPaused ? "bg-amber-500" : "bg-emerald-500")} />
        </span>
        <Clock className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono text-xs font-bold">{formatDuration(elapsedSeconds)}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(false);
          }}
          className="p-1 hover:bg-muted rounded-full"
          title="Expand timer"
        >
          <ChevronUp className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    );
  }

  // Expanded floating widget
  return (
    <div
      onClick={handleNavigateToTime}
      className="fixed bottom-4 right-4 z-40 w-72 bg-card/95 backdrop-blur border border-primary/30 shadow-2xl rounded-xl p-3.5 cursor-pointer hover:border-primary/50 transition-all touch-manipulation mb-[env(safe-area-inset-bottom)] select-none"
    >
      <div className="flex items-center justify-between gap-2 border-b pb-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isPaused ? "bg-amber-400" : "bg-emerald-400")} />
            <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", isPaused ? "bg-amber-500" : "bg-emerald-500")} />
          </span>
          <Badge variant="outline" className="text-[10px] uppercase font-semibold shrink-0">
            {activeTimer.category}
          </Badge>
          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
            {activeTimer.description || "Live Activity"}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(true);
          }}
          className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
          title="Collapse"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-mono font-extrabold tracking-tight">
            {formatDuration(elapsedSeconds)}
          </div>
          {isPaused && <span className="text-[10px] text-amber-500 font-semibold">PAUSED</span>}
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant={isPaused ? "default" : "outline"}
            onClick={handleTogglePause}
            className="h-8 px-2.5 text-xs touch-manipulation"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 mr-1" /> : <Pause className="w-3.5 h-3.5 mr-1" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={handleStop}
            disabled={isSubmitting}
            className="h-8 px-2.5 text-xs touch-manipulation"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Square className="w-3 h-3 mr-1 fill-current" /> Stop
              </>
            )}
          </Button>
        </div>
      </div>

      {errorMsg && (
        <p className="text-[10px] text-destructive font-medium mt-2 pt-1 border-t text-center">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
