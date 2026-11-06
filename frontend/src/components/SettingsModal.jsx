import React, { useState } from 'react';
import { X, Key, Cpu, ChevronRight } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  provider,
  setProvider,
  apiKey,
  setApiKey,
  onOpenHardwareWizard,
}) {
  const [tempProvider, setTempProvider] = useState(provider || 'offline');
  const [tempApiKey, setTempApiKey] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setProvider(tempProvider);
    setApiKey(tempApiKey);
    localStorage.setItem('vecna_provider', tempProvider);
    localStorage.setItem('vecna_api_key', tempApiKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-[#FAF9F5] dark:bg-[#111923] border border-[#B18B56] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E2DDD3] dark:border-[#223043] bg-[#F1EFE8]/70 dark:bg-[#0b1118]/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#477F7C] dark:text-[#55B7AE]" />
            <h2 className="font-serif text-sm font-bold text-[#111923] dark:text-[#F1EFE8]">
              Inference Provider & Credentials
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8C969E] hover:text-[#111923] dark:hover:text-white p-1 rounded transition-colors font-mono text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono font-semibold text-[#111923] dark:text-[#FAF9F5] uppercase tracking-wider block">
              Inference Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'offline', name: 'Local Offline', desc: 'In-browser DSP / Local ONNX' },
                { id: 'siliconflow', name: 'SiliconFlow', desc: 'SenseVoice + Qwen 2.5' },
                { id: 'groq', name: 'Groq Cloud', desc: 'Whisper + Llama 3.3' },
                { id: 'openrouter', name: 'OpenRouter', desc: 'Free / Community Tier' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTempProvider(p.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    tempProvider === p.id
                      ? 'bg-[#477F7C]/15 dark:bg-[#182333] border-[#B18B56] text-[#111923] dark:text-[#FAF9F5] shadow-sm font-semibold'
                      : 'bg-white dark:bg-[#0b1118] border-[#E2DDD3] dark:border-[#223043] text-[#55636B] dark:text-[#9AA6AC] hover:border-[#477F7C]'
                  }`}
                >
                  <div className="text-xs font-semibold">{p.name}</div>
                  <div className="text-[10px] text-[#8C969E] mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {tempProvider !== 'offline' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-semibold text-[#111923] dark:text-[#FAF9F5]">
                  {tempProvider.toUpperCase()} API KEY
                </label>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="text-[11px] font-mono text-[#477F7C] dark:text-[#55B7AE] hover:underline"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Paste API key credentials..."
                className="w-full bg-white dark:bg-[#0b1118] border border-[#E2DDD3] dark:border-[#223043] rounded-md px-3 py-2 text-xs font-mono text-[#111923] dark:text-[#FAF9F5] placeholder-[#8C969E] focus:outline-none focus:border-[#477F7C]"
              />
              <p className="text-[10px] font-mono text-[#8C969E]">
                Stored securely inside client browser localStorage.
              </p>
            </div>
          )}

          {/* Hardware Engine Launcher */}
          {onOpenHardwareWizard && (
            <div className="pt-2 border-t border-[#E2DDD3] dark:border-[#223043]">
              <button
                type="button"
                onClick={onOpenHardwareWizard}
                className="w-full p-2.5 rounded-lg bg-[#F1EFE8] dark:bg-[#182333] border border-[#E2DDD3] dark:border-[#223043] hover:border-[#B18B56] flex items-center justify-between transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#B18B56]" />
                  <div className="text-left">
                    <span className="font-semibold text-[#111923] dark:text-[#FAF9F5] block">
                      Hardware Profiler & Engine Wizard
                    </span>
                    <span className="text-[10px] text-[#8C969E]">
                      Auto-detect CPU, RAM, GPU and calibrate model tier
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8C969E]" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E2DDD3] dark:border-[#223043] bg-[#F1EFE8]/70 dark:bg-[#0b1118]/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded border border-[#E2DDD3] dark:border-[#223043] text-xs font-mono text-[#647078] hover:text-[#111923] dark:text-[#9AA6AC] dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded bg-[#477F7C] hover:bg-[#3B6C69] text-white text-xs font-mono font-semibold shadow-sm"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
