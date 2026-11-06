import React from 'react';
import {
  PhoneCall,
  Archive,
  Activity,
  Clock3,
  TrendingUp,
  Cpu,
  ArrowUpRight
} from 'lucide-react';

export default function DashboardOverview({
  activeCount = 0,
  savedCount = 0,
  isAnalyzing = false,
  backendConnected = false,
  avgProcessingTimeSec = null,
  onCardClick
}) {
  const cards = [
    {
      id: 'active_calls',
      label: 'Active Calls',
      value: activeCount,
      subtext: activeCount > 0 ? 'Queued for triage' : 'Queue ready',
      icon: PhoneCall,
      sparklineColor: '#477F7C',
      sparklinePoints: '0,18 15,14 30,16 45,9 60,11 75,5 90,8 105,4',
      badge: activeCount > 0 ? `${activeCount} in queue` : 'Empty',
      clickable: true,
    },
    {
      id: 'saved_cases',
      label: 'Saved Cases',
      value: savedCount,
      subtext: savedCount > 0 ? 'Dossiers in browser vault' : 'Vault ready',
      icon: Archive,
      sparklineColor: '#B18B56',
      sparklinePoints: '0,16 20,15 40,11 60,13 80,8 100,5 110,4',
      badge: savedCount > 0 ? 'Offline sync' : 'Empty',
      clickable: true,
    },
    {
      id: 'analysis_status',
      label: 'Analysis Status',
      value: isAnalyzing ? 'Processing' : 'Standby',
      subtext: backendConnected ? 'SenseVoice / ONNX connected' : 'Local browser DSP active',
      icon: Activity,
      sparklineColor: isAnalyzing ? '#C9A36D' : '#55B7AE',
      sparklinePoints: '0,15 15,10 30,17 45,6 60,14 75,7 90,12 105,8',
      badge: isAnalyzing ? 'Active inference' : 'Ready',
      clickable: true,
    },
    {
      id: 'processing_time',
      label: 'Average Processing Time',
      value: avgProcessingTimeSec != null ? `${avgProcessingTimeSec.toFixed(1)}s` : '—',
      subtext: avgProcessingTimeSec != null ? 'Average session speed' : 'Not available',
      icon: Clock3,
      sparklineColor: '#6B7A82',
      sparklinePoints: '0,12 25,12 50,11 75,10 100,10',
      badge: avgProcessingTimeSec != null ? 'Measured' : 'Awaiting data',
      clickable: false,
    },
  ];

  const handleCardClick = (cardId) => {
    if (onCardClick) onCardClick(cardId);
  };

  return (
    <section
      className="dashboard-overview grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 px-4 sm:px-8 py-3.5 select-none"
      aria-label="Operational Summary Cards"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => card.clickable && handleCardClick(card.id)}
            className={`group bg-[#FAF9F5] dark:bg-[#111923] border border-[#E2DDD3] dark:border-[#223043] rounded-lg p-4 transition-all duration-200 shadow-sm relative overflow-hidden ${
              card.clickable ? 'cursor-pointer hover:border-[#B18B56] hover:shadow-md' : ''
            }`}
          >
            {/* Top row: Label & Icon */}
            <div className="flex items-center justify-between text-xs text-[#647078] dark:text-[#9AA6AC] mb-2 font-medium">
              <span className="font-mono uppercase tracking-wider text-[10px]">
                {card.label}
              </span>
              <div className="w-7 h-7 rounded bg-[#F1EFE8] dark:bg-[#182333] border border-[#E2DDD3] dark:border-[#223043] flex items-center justify-center text-[#477F7C] dark:text-[#55B7AE] group-hover:text-[#B18B56] transition-colors">
                <Icon size={14} />
              </div>
            </div>

            {/* Middle row: Large value & Sparkline */}
            <div className="flex items-baseline justify-between gap-2 my-1">
              <div className="font-serif text-3xl font-semibold tracking-tight text-[#111923] dark:text-[#F1EFE8]">
                {card.value}
              </div>

              {/* Minimal SVG Sparkline */}
              <div className="w-20 h-6 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 110 20" className="w-full h-full overflow-visible">
                  <polyline
                    fill="none"
                    stroke={card.sparklineColor}
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={card.sparklinePoints}
                  />
                </svg>
              </div>
            </div>

            {/* Bottom row: Subtext & Badge */}
            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-[#E2DDD3]/60 dark:border-[#223043]/60">
              <span className="text-[#647078] dark:text-[#8C969E] truncate">
                {card.subtext}
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#F1EFE8] dark:bg-[#182333] text-[#55636B] dark:text-[#9AA6AC] border border-[#E2DDD3] dark:border-[#223043] shrink-0">
                {card.badge}
              </span>
            </div>

            {/* Subtle antique gold top edge highlight on hover */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#B18B56] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        );
      })}
    </section>
  );
}
