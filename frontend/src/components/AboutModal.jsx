import React from 'react';
import {
  ShieldCheck,
  Radio,
  Cpu,
  AudioWaveform,
  Layers,
  Lock,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { INDICATIVE_DISCLAIMER } from '../mockData';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-[#FAF9F5] dark:bg-[#111923] border border-[#B18B56] rounded-xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E2DDD3] dark:border-[#223043] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#111923] dark:bg-[#182333] border border-[#B18B56] flex items-center justify-center text-[#55B7AE]">
              <AudioWaveform size={20} />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#111923] dark:text-[#FAF9F5]">
                VECNA-Pulse Architecture
              </h2>
              <p className="text-xs text-[#647078] dark:text-[#9AA6AC] font-mono">
                Voice Triage & Emergency Response Intelligence Desk
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#8C969E] hover:text-[#111923] dark:hover:text-white font-mono text-sm p-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 text-xs text-[#55636B] dark:text-[#9AA6AC] leading-relaxed font-sans">
          <p>
            <strong>VECNA-Pulse</strong> is a specialized Voice Intelligence Command Center engineered to prioritize emergency incident calls based on real-time acoustic vocal biomarker analysis, automated speech recognition, and cybercrime triage playbooks.
          </p>

          {/* 3 Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-[#F1EFE8] dark:bg-[#182333] border border-[#E2DDD3] dark:border-[#223043] space-y-1">
              <div className="flex items-center gap-1.5 text-[#477F7C] dark:text-[#55B7AE] font-mono font-semibold text-[11px]">
                <AudioWaveform size={14} />
                <span>Acoustic SER</span>
              </div>
              <p className="text-[11px] text-[#647078] dark:text-[#9AA6AC]">
                Autocorrelation F0 pitch extraction, cycle-to-cycle jitter tremor %, and RMS energy decibel curves.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F1EFE8] dark:bg-[#182333] border border-[#E2DDD3] dark:border-[#223043] space-y-1">
              <div className="flex items-center gap-1.5 text-[#B18B56] font-mono font-semibold text-[11px]">
                <Cpu size={14} />
                <span>Adaptive Engine</span>
              </div>
              <p className="text-[11px] text-[#647078] dark:text-[#9AA6AC]">
                Hybrid architecture supporting Sherpa-ONNX on local hardware or pure Web Audio DSP on edge clients.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F1EFE8] dark:bg-[#182333] border border-[#E2DDD3] dark:border-[#223043] space-y-1">
              <div className="flex items-center gap-1.5 text-[#10B981] font-mono font-semibold text-[11px]">
                <Lock size={14} />
                <span>1930 NCRP Triage</span>
              </div>
              <p className="text-[11px] text-[#647078] dark:text-[#9AA6AC]">
                Instant financial freeze dockets for golden-hour fraud mitigation, PII regex masking, and law enforcement directives.
              </p>
            </div>
          </div>

          {/* Ethical & Legal Guardrails */}
          <div className="p-4 rounded-lg bg-[#FAF3E8] dark:bg-[#1D1912] border border-[#B18B56]/50 space-y-2">
            <div className="flex items-center gap-2 text-[#8C6B3A] dark:text-[#DFBA82] font-semibold text-xs font-serif">
              <ShieldCheck size={16} className="text-[#B18B56]" />
              <span>Ethical AI & Human-in-the-Loop Protocol</span>
            </div>
            <p className="text-[11px] text-[#8C6B3A] dark:text-[#DFBA82] leading-relaxed">
              {INDICATIVE_DISCLAIMER}
            </p>
          </div>

          {/* Version details */}
          <div className="pt-2 border-t border-[#E2DDD3] dark:border-[#223043] flex items-center justify-between text-[10px] font-mono text-[#8C969E]">
            <span>ENGINE: VECNA-PULSE v3.0.0</span>
            <span>STATION: SECURE COMMAND DESK</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded bg-[#111923] dark:bg-[#FAF9F5] text-[#FAF9F5] dark:text-[#111923] text-xs font-mono font-semibold hover:opacity-90 transition-opacity"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}

