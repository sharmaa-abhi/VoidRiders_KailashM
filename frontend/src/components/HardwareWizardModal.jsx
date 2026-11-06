import React, { useState, useEffect } from 'react';
import { X, Cpu, HardDrive, Download, Trash2, CheckCircle2, ShieldCheck, Box, Sparkles } from 'lucide-react';
import { MODEL_TIERS, requestPersistentStorage } from '../services/hardwareEngine';
import {
  getModelCatalogForTier,
  downloadAllLocalModels,
  clearAllLocalModels,
  areModelsInstalledLocally
} from '../services/localModelEngine';

export default function HardwareWizardModal({
  isOpen,
  onClose,
  hardwareInfo,
  currentTier,
  onSelectTier,
  storageInfo,
  onRefreshStorage,
}) {
  if (!isOpen) return null;

  const [selectedTier, setSelectedTier] = useState(currentTier || hardwareInfo?.recommendedTier || 'MID_RANGE');
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloadStatusText, setDownloadStatusText] = useState('');
  const [modelsInstalled, setModelsInstalled] = useState(false);
  const [isPersisted, setIsPersisted] = useState(storageInfo?.isPersisted || false);

  const activeCatalog = getModelCatalogForTier(selectedTier);

  useEffect(() => {
    checkInstalledState(selectedTier);
  }, [selectedTier, isOpen]);

  const checkInstalledState = async (tier) => {
    const installed = await areModelsInstalledLocally(tier);
    setModelsInstalled(installed);
  };

  const handleDownloadAllModels = async () => {
    try {
      setDownloadProgress(5);
      setDownloadStatusText(`Initializing persistent storage for ${activeCatalog.profileName}...`);
      await downloadAllLocalModels(
        selectedTier,
        (pct) => setDownloadProgress(pct),
        (status) => setDownloadStatusText(status)
      );
      setModelsInstalled(true);
      setTimeout(() => {
        setDownloadProgress(null);
        setDownloadStatusText('');
        if (onRefreshStorage) onRefreshStorage();
      }, 700);
    } catch (e) {
      alert('Model caching completed with fallback: ' + e.message);
      setDownloadProgress(null);
      setDownloadStatusText('');
    }
  };

  const handleClearCache = async () => {
    if (confirm(`Clear local on-device models for ${activeCatalog.profileName}?`)) {
      await clearAllLocalModels(selectedTier);
      setModelsInstalled(false);
      if (onRefreshStorage) onRefreshStorage();
    }
  };

  const handlePersist = async () => {
    const granted = await requestPersistentStorage();
    setIsPersisted(granted);
    if (onRefreshStorage) onRefreshStorage();
  };

  const handleSaveAndApply = () => {
    onSelectTier(selectedTier);
    localStorage.setItem('vecna_model_tier', selectedTier);
    localStorage.setItem('vecna_hardware_setup_done', 'true');
    onClose();
  };

  const recommendedId = hardwareInfo?.recommendedTier || 'MID_RANGE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-[#FAF9F5] dark:bg-[#111923] border border-[#B18B56] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E2DDD3] dark:border-[#223043] bg-[#F1EFE8]/70 dark:bg-[#0b1118]/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#B18B56]" />
            <h2 className="font-serif text-sm font-bold text-[#111923] dark:text-[#F1EFE8]">
              System Telemetry & Hardware Profiler
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8C969E] hover:text-[#111923] dark:hover:text-white p-1 rounded font-mono text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 font-sans">
          {/* Detected Host Specs */}
          <div className="bg-[#F1EFE8] dark:bg-[#182333] border border-[#E2DDD3] dark:border-[#223043] p-3 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#8C969E] block">CPU CORES</span>
              <strong className="text-[#111923] dark:text-[#FAF9F5]">{hardwareInfo?.cores || 4} threads</strong>
            </div>
            <div>
              <span className="text-[10px] text-[#8C969E] block">RAM MEMORY</span>
              <strong className="text-[#111923] dark:text-[#FAF9F5]">{hardwareInfo?.memory || 8} GB</strong>
            </div>
            <div>
              <span className="text-[10px] text-[#8C969E] block">ACCELERATION</span>
              <span className="text-[#477F7C] dark:text-[#55B7AE] font-semibold">{hardwareInfo?.hasWebGPU ? 'WebGPU' : 'Standard'}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#8C969E] block">ADAPTER</span>
              <span className="text-[#111923] dark:text-[#FAF9F5] truncate block text-[11px]" title={hardwareInfo?.gpuRenderer}>
                {hardwareInfo?.gpuRenderer?.slice(0, 16) || 'Integrated'}
              </span>
            </div>
          </div>

          {/* Profile / Tier Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-serif font-semibold text-[#111923] dark:text-[#FAF9F5]">
                Calibrated Model Execution Profiles
              </span>
              <span className="text-[10px] font-mono text-[#8C969E]">
                Recommended: <strong className="text-[#B18B56]">{recommendedId}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.values(MODEL_TIERS).map((tier) => {
                const isSelected = selectedTier === tier.id;
                const isRec = recommendedId === tier.id;
                const catalog = getModelCatalogForTier(tier.id);

                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#477F7C]/15 dark:bg-[#182333] border-[#B18B56] text-[#111923] dark:text-[#FAF9F5] shadow-sm font-semibold'
                        : 'bg-white dark:bg-[#0b1118] border-[#E2DDD3] dark:border-[#223043] text-[#55636B] dark:text-[#9AA6AC] hover:border-[#477F7C]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold flex items-center gap-1.5">
                        {tier.name}
                      </span>
                      {isRec && (
                        <span className="text-[9px] font-mono font-semibold bg-[#EBF7F2] text-[#1E7452] dark:bg-[#132A22] dark:text-[#6EE7B7] border border-[#A3D9C5] dark:border-[#1E5743] px-1.5 py-0.2 rounded">
                          Optimal
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#647078] dark:text-[#8C969E] leading-normal font-sans">
                      {tier.description}
                    </p>
                    <div className="mt-1.5 flex justify-between text-[10px] font-mono text-[#477F7C] dark:text-[#55B7AE]">
                      <span>{catalog.totalDownloadMB > 0 ? `${catalog.totalDownloadMB} MB total` : '0 MB download'}</span>
                      <span>{catalog.models[0].modelSize}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Model Bundle for Selected Profile */}
          <div className="bg-[#F1EFE8] dark:bg-[#182333] border border-[#E2DDD3] dark:border-[#223043] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111923] dark:text-[#FAF9F5]">
                  <Box className="w-4 h-4 text-[#477F7C] dark:text-[#55B7AE]" />
                  <span>{activeCatalog.profileName} Model Bundle</span>
                </div>
                <p className="text-[10px] font-mono text-[#477F7C] dark:text-[#55B7AE] mt-0.5">
                  Rating: <strong>{activeCatalog.accuracyRating}</strong> · {activeCatalog.recommendedFor}
                </p>
              </div>

              {modelsInstalled ? (
                <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-[#1E7452] dark:text-[#6EE7B7] bg-[#EBF7F2] dark:bg-[#132A22] border border-[#A3D9C5] dark:border-[#1E5743] px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                  <span>Ready</span>
                </span>
              ) : (
                <span className="text-[11px] font-mono text-[#B18B56]">
                  {activeCatalog.totalDownloadMB === 0 ? 'Cloud API' : 'Not cached'}
                </span>
              )}
            </div>

            {/* Model Items */}
            <div className="space-y-1.5">
              {activeCatalog.models.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-white dark:bg-[#0b1118] p-2 rounded-lg border border-[#E2DDD3] dark:border-[#223043] text-xs flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-semibold text-[#111923] dark:text-[#FAF9F5] block text-[11px]">
                      {mod.name}
                    </span>
                    <span className="text-[10px] text-[#8C969E] block">
                      {mod.description}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#B18B56] shrink-0 font-medium">
                    {mod.sizeMB > 0 ? `${mod.sizeMB} MB` : 'API Call'}
                  </span>
                </div>
              ))}
            </div>

            {/* Storage Progress & Download Bar */}
            {downloadProgress !== null && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#111923] dark:text-[#FAF9F5]">{downloadStatusText}</span>
                  <span className="text-[#B18B56]">{downloadProgress}%</span>
                </div>
                <div className="w-full bg-[#E2DDD3] dark:bg-[#223043] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#B18B56] h-full rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions for Selected Profile */}
            <div className="flex items-center justify-between pt-1 gap-2">
              <div className="flex items-center gap-2">
                {activeCatalog.totalDownloadMB > 0 && (
                  <button
                    onClick={handleDownloadAllModels}
                    disabled={downloadProgress !== null}
                    className="px-3 py-1.5 rounded-lg bg-[#477F7C] hover:bg-[#3B6C69] text-white text-xs font-mono font-medium shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{modelsInstalled ? 'Re-cache Models' : 'Cache Offline Bundle'}</span>
                  </button>
                )}

                {modelsInstalled && (
                  <button
                    onClick={handleClearCache}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E2DDD3] dark:border-[#223043] text-xs font-mono text-[#B33939] hover:bg-[#FBEAE9] dark:hover:bg-[#341616] transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Purge Cache</span>
                  </button>
                )}
              </div>

              {/* Storage Persistence */}
              <button
                onClick={handlePersist}
                className="text-[11px] font-mono text-[#8C969E] hover:text-[#111923] dark:hover:text-white flex items-center gap-1"
                title="Ensure browser does not clear offline models under storage pressure"
              >
                <HardDrive className="w-3 h-3 text-[#B18B56]" />
                <span>{isPersisted ? 'Storage Persistent' : 'Request Persistence'}</span>
              </button>
            </div>
          </div>
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
            onClick={handleSaveAndApply}
            className="px-4 py-1.5 rounded bg-[#B18B56] hover:bg-[#8C6B3A] text-white text-xs font-mono font-semibold shadow-sm"
          >
            Apply & Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
