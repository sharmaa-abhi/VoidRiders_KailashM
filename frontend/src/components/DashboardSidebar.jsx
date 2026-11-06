import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  Settings,
  Info,
  Radio,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sliders,
  AudioWaveform,
  Activity
} from 'lucide-react';

export default function DashboardSidebar({
  currentView = 'dashboard',
  onSelectView,
  onOpenSettings,
  onOpenAbout,
  backendConnected,
  onOpenDashboard,
  isCollapsed = false,
  onToggleCollapse
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, anchor: '#command' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, anchor: '#analysis' },
    { id: 'incidents', label: 'Incidents', icon: ClipboardList, anchor: '#incidents' },
  ];

  const handleNavClick = (id, anchor) => {
    if (onSelectView) onSelectView(id);
    const elem = document.querySelector(anchor);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <aside
      className={`dashboard-sidebar transition-all duration-300 flex flex-col justify-between select-none ${
        isCollapsed ? 'w-20 px-3' : 'w-64 px-5'
      }`}
      aria-label="VECNA-Pulse Command Navigation"
    >
      {/* Top brand header */}
      <div>
        <div className="flex items-center justify-between pt-6 pb-6 border-b border-[#223043]/60">
          <button
            onClick={onOpenDashboard}
            className="flex items-center gap-3 text-left group focus:outline-none"
            title="Return to VECNA-Pulse Home"
          >
            <div className="w-8 h-8 border border-[#B18B56] flex items-center justify-center rotate-45 transition-transform duration-300 group-hover:scale-105 shrink-0 bg-[#16212e]">
              <span className="w-2.5 h-2.5 bg-[#B18B56] block"></span>
            </div>
            {!isCollapsed && (
              <div>
                <span className="font-serif text-lg tracking-wider text-[#F1EFE8] font-semibold block leading-tight">
                  VECNA<span className="text-[#55B7AE] italic font-normal">-Pulse</span>
                </span>
                <span className="text-[9px] font-mono tracking-widest text-[#B18B56] uppercase block">
                  Voice Intelligence
                </span>
              </div>
            )}
          </button>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded text-[#8C969E] hover:text-[#F1EFE8] hover:bg-[#1a2534] transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        {/* Section kicker */}
        {!isCollapsed && (
          <div className="text-[10px] font-mono tracking-widest uppercase text-[#8C969E] mt-6 mb-3 px-2 flex items-center justify-between">
            <span>Navigation / Desk</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#B18B56]/60"></span>
          </div>
        )}

        {/* Navigation list */}
        <nav className="space-y-1.5 mt-2" aria-label="Command sections">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.anchor)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all text-left ${
                  isSelected
                    ? 'bg-[#477F7C]/25 text-[#FAF9F5] border-l-2 border-[#B18B56] shadow-inner font-semibold'
                    : 'text-[#9AA6AC] hover:text-[#FAF9F5] hover:bg-[#16212e] border-l-2 border-transparent'
                }`}
                title={item.label}
              >
                <Icon
                  size={17}
                  className={`shrink-0 transition-colors ${
                    isSelected ? 'text-[#55B7AE]' : 'text-[#8C969E] group-hover:text-[#FAF9F5]'
                  }`}
                />
                {!isCollapsed && <span className="tracking-wide">{item.label}</span>}
                {!isCollapsed && isSelected && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#B18B56]" />
                )}
              </button>
            );
          })}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium text-[#9AA6AC] hover:text-[#FAF9F5] hover:bg-[#16212e] border-l-2 border-transparent transition-all text-left"
            title="System & Inference Settings"
          >
            <Settings size={17} className="text-[#8C969E] shrink-0" />
            {!isCollapsed && <span className="tracking-wide">Settings</span>}
          </button>

          {/* About Button */}
          {onOpenAbout && (
            <button
              onClick={onOpenAbout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium text-[#9AA6AC] hover:text-[#FAF9F5] hover:bg-[#16212e] border-l-2 border-transparent transition-all text-left"
              title="About Voice Intelligence System"
            >
              <Info size={17} className="text-[#8C969E] shrink-0" />
              {!isCollapsed && <span className="tracking-wide">About</span>}
            </button>
          )}
        </nav>
      </div>

      {/* Bottom status and waveform motif */}
      <div className="pt-6 pb-6 border-t border-[#223043]/60 space-y-4">
        {/* Acoustic Waveform Motif */}
        {!isCollapsed ? (
          <div className="bg-[#0b1118]/80 p-3 rounded-lg border border-[#223043]/50 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#8C969E]">
              <span className="flex items-center gap-1.5">
                <AudioWaveform size={12} className="text-[#55B7AE]" />
                <span>ACOUSTIC PULSE</span>
              </span>
              <span className="text-[#B18B56]">16.0 kHz</span>
            </div>
            <div className="h-6 flex items-center gap-1 px-0.5" aria-hidden="true">
              {Array.from({ length: 18 }, (_, index) => {
                const heightFrac = Math.abs(Math.sin((index + 1) * 0.72));
                const isGold = index % 4 === 1;
                return (
                  <span
                    key={index}
                    className={`flex-1 rounded-full transition-all duration-300 ${
                      isGold ? 'bg-[#B18B56]' : 'bg-[#477F7C]'
                    }`}
                    style={{
                      height: `${Math.max(16, heightFrac * 100)}%`,
                      opacity: 0.85,
                    }}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2 h-2 rounded-full bg-[#55B7AE] animate-ping" />
          </div>
        )}

        {/* System Status */}
        <div className={`space-y-1.5 ${isCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-2 text-[11px] text-[#AAB4B7]">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                backendConnected ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-[#B18B56]'
              }`}
            />
            {!isCollapsed && (
              <span className="font-mono text-[10px] truncate">
                {backendConnected ? 'Analysis Online (v3.0)' : 'Local Engine Active'}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <div className="text-[9px] font-mono text-[#6A7880] tracking-wider uppercase pl-4">
              VECNA-PULSE / STATION 04
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
