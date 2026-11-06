import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Settings,
  Radio,
  Sun,
  Moon,
  ToggleLeft,
  ToggleRight,
  Home,
  UserCheck,
  Clock,
  Activity,
  AudioWaveform,
  Cpu
} from 'lucide-react';

export default function Header({
  isMockMode,
  setIsMockMode,
  onOpenSettings,
  provider,
  backendConnected,
  theme,
  setTheme,
  onOpenHome
}) {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      // e.g. "06 Nov 2026, 16:18:04"
      const formatted = now.toLocaleDateString('en-GB', options);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      setCurrentDateTime(`${formatted} (${tz.split('/').pop() || 'LOCAL'})`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <header className="bg-[#FAF9F5]/95 dark:bg-[#111923]/95 backdrop-blur border-b border-[#E2DDD3] dark:border-[#1E293B] px-4 sm:px-8 py-3.5 sticky top-0 z-30 transition-colors select-none">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left Section: Page Heading & Acoustic Motif */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#111923] dark:bg-[#182333] border border-[#B18B56]/50 flex items-center justify-center text-[#55B7AE] shadow-sm shrink-0">
            <AudioWaveform className="w-5 h-5 text-[#55B7AE] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#111923] dark:text-[#F1EFE8]">
                Voice Intelligence Command Center
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF9F5] dark:bg-[#182333] text-[#477F7C] dark:text-[#55B7AE] border border-[#E2DDD3] dark:border-[#223043] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#55B7AE] animate-ping" />
                ACTIVE DESK
              </span>
            </div>
            <p className="text-xs text-[#647078] dark:text-[#9AA6AC] flex items-center gap-1.5 font-sans">
              <span>Triage</span>
              <span className="text-[#B18B56]">·</span>
              <span>Analyze</span>
              <span className="text-[#B18B56]">·</span>
              <span>Coordinate</span>
            </p>
          </div>
        </div>

        {/* Center / Right Section: Live Telemetry & System Status */}
        <div className="flex items-center gap-3 flex-wrap justify-between md:justify-end w-full md:w-auto">
          {/* Live Clock Strip */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F1EFE8] dark:bg-[#182333] border border-[#E2DDD3] dark:border-[#223043] text-[11px] font-mono text-[#55636B] dark:text-[#9AA6AC]">
            <Clock size={12} className="text-[#B18B56]" />
            <span>{currentDateTime || 'Synchronizing clock...'}</span>
          </div>

          {/* Operator Duty Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#F1EFE8] dark:bg-[#182333] border border-[#E2DDD3] dark:border-[#223043] text-[11px] font-mono text-[#55636B] dark:text-[#9AA6AC]">
            <UserCheck size={12} className="text-[#477F7C] dark:text-[#55B7AE]" />
            <span>OP-VECNA-74</span>
          </div>

          {/* Service status indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${
              backendConnected
                ? 'bg-[#EBF7F2] dark:bg-[#132A22]/50 border-[#A3D9C5] dark:border-[#1E5743] text-[#1E7452] dark:text-[#6EE7B7]'
                : 'bg-[#FFF9EE] dark:bg-[#251E13]/50 border-[#F0D59D] dark:border-[#5C451E] text-[#9A6715] dark:text-[#FCD34D]'
            }`}
            title={backendConnected ? 'Backend hybrid pipeline active' : 'Pure in-browser Web Audio DSP active'}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                backendConnected ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
              }`}
            />
            <span className="text-[11px] font-medium">
              {backendConnected ? 'Analysis Online' : 'Local DSP Mode'}
            </span>
          </div>

          {/* Controls Cluster */}
          <div className="flex items-center gap-1.5">
            {/* Demo Mode Toggle */}
            <button
              onClick={() => setIsMockMode(!isMockMode)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-all ${
                isMockMode
                  ? 'bg-[#FAF3E8] dark:bg-[#261E14] border-[#B18B56] text-[#8C6B3A] dark:text-[#DFBA82] font-semibold'
                  : 'bg-[#F1EFE8] dark:bg-[#182333] border-[#E2DDD3] dark:border-[#223043] text-[#55636B] dark:text-[#9AA6AC] hover:border-[#B18B56]'
              }`}
              title="Toggle demo scenarios vs user live session calls"
            >
              <span className="text-[11px] font-mono">Demo Mode</span>
              {isMockMode ? (
                <ToggleRight className="w-4 h-4 text-[#B18B56]" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-[#8C969E]" />
              )}
            </button>

            {/* Provider Settings */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-[#F1EFE8] dark:bg-[#182333] border border-[#E2DDD3] dark:border-[#223043] text-[#55636B] dark:text-[#9AA6AC] hover:border-[#477F7C] transition-colors"
              title="Configure AI & Inference Providers"
            >
              <Settings className="w-3.5 h-3.5 text-[#477F7C] dark:text-[#55B7AE]" />
              <span className="capitalize text-[11px] font-mono hidden sm:inline">
                {provider === 'offline' ? 'Local' : provider}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-[#F1EFE8] dark:bg-[#182333] border border-[#E2DDD3] dark:border-[#223043] text-[#55636B] dark:text-[#9AA6AC] hover:border-[#B18B56] transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#B18B56]" />
              ) : (
                <Moon className="w-4 h-4 text-[#477F7C]" />
              )}
            </button>

            {/* Return to Home / Landing Page */}
            {onOpenHome && (
              <button
                onClick={onOpenHome}
                className="flex items-center justify-center w-8 h-8 rounded-md bg-[#F1EFE8] dark:bg-[#182333] border border-[#E2DDD3] dark:border-[#223043] text-[#55636B] dark:text-[#9AA6AC] hover:border-[#477F7C] transition-colors"
                title="Return to Presentation Homepage"
              >
                <Home className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
