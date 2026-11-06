import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  Volume2,
  Archive,
  Trash2,
  Zap,
  Search,
  Filter,
  Mic,
  MicOff,
  Upload,
  Play,
  FileAudio,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function CallQueue({
  calls = [],
  selectedCallId,
  onSelectCall,
  onRefreshQueue,
  onSimulateSurge,
  isLoading,
  isSurgeActive,
  savedCases = [],
  onDeleteSavedCase,
  isMockMode,
  onAnalyzeAudioFile,
  onSimulateScenario,
  isAnalyzing
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'saved'
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'

  // Live microphone recording state
  const [isRecording, setIsRecording] = useState(false);
  const [micPermission, setMicPermission] = useState('standby'); // 'standby' | 'listening' | 'granted' | 'denied'
  const [micLiveText, setMicLiveText] = useState('');
  const [micFreqBands, setMicFreqBands] = useState(new Array(20).fill(0));

  // Quick actions drawers
  const [showUploadDrawer, setShowUploadDrawer] = useState(false);
  const [showScenarioDrawer, setShowScenarioDrawer] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [transcriptHint, setTranscriptHint] = useState('');

  // Refs for Web Audio & Mic
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const micStreamRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const capturedWordsRef = useRef('');

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopMicrophoneStream();
    };
  }, []);

  const stopMicrophoneStream = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    setMicFreqBands(new Array(20).fill(0));
  };

  const handleToggleMicrophone = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      stopMicrophoneStream();
      setMicPermission('standby');
    } else {
      // Start recording - requests permission ONLY here!
      if (!navigator?.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicPermission('denied');
        alert('Microphone input is not supported in this browser environment or requires HTTPS/localhost.');
        return;
      }
      try {
        setMicLiveText('');
        capturedWordsRef.current = '';
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        setMicPermission('listening');

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateSpectrum = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const bands = [];
          for (let i = 0; i < 20; i++) {
            const raw = dataArray[i] || 0;
            bands.push(Math.min(100, Math.round((raw / 255) * 100)));
          }
          setMicFreqBands(bands);
          animFrameRef.current = requestAnimationFrame(updateSpectrum);
        };
        updateSpectrum();

        // Browser Speech Recognition for spoken transcripts
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
          try {
            const rec = new SpeechRec();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-US';
            rec.onresult = (evt) => {
              const words = Array.from(evt.results)
                .map((r) => r[0].transcript)
                .join(' ');
              capturedWordsRef.current = words;
              setMicLiveText(words);
            };
            rec.start();
            speechRecognitionRef.current = rec;
          } catch (e) {}
        }

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const file = new File([audioBlob], `mic_${Date.now()}.wav`, { type: 'audio/wav' });
          const spoken = capturedWordsRef.current ? capturedWordsRef.current.trim() : '';
          if (onAnalyzeAudioFile) {
            onAnalyzeAudioFile(file, spoken);
          }
        };

        mediaRecorder.start(2000);
        setIsRecording(true);
      } catch (err) {
        setMicPermission('denied');
        alert('Microphone permission or hardware access unavailable: ' + err.message);
      }
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadFile || !onAnalyzeAudioFile) return;
    onAnalyzeAudioFile(uploadFile, transcriptHint);
    setShowUploadDrawer(false);
    setUploadFile(null);
    setTranscriptHint('');
  };

  const handleScenarioSelect = (scenarioId) => {
    if (onSimulateScenario) {
      onSimulateScenario(scenarioId);
    }
    setShowScenarioDrawer(false);
  };

  // Filter calls
  const currentList = activeTab === 'active' ? calls : savedCases;

  const filteredCalls = currentList.filter((call) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = call.call_id?.toLowerCase().includes(q);
      const matchTag = call.caller_tag?.toLowerCase().includes(q);
      const matchText = call.transcript?.raw_redacted?.toLowerCase().includes(q);
      const matchCrime = call.triage_insights?.crime_category?.toLowerCase().includes(q);
      const matchEmotion = call.dominant_emotion?.toLowerCase().includes(q);
      if (!matchId && !matchTag && !matchText && !matchCrime && !matchEmotion) return false;
    }

    // Urgency level filter
    if (urgencyFilter !== 'ALL') {
      if (call.urgency_level !== urgencyFilter) return false;
    }

    return true;
  });

  const getUrgencyBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-[#FBEAE9] text-[#B33939] border-[#F2B8B5] dark:bg-[#341616] dark:text-[#F87171] dark:border-[#5A2323]';
      case 'HIGH':
        return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A] dark:bg-[#332208] dark:text-[#FBBF24] dark:border-[#593C0E]';
      case 'MEDIUM':
        return 'bg-[#FEF9C3] text-[#854D0E] border-[#FEF08A] dark:bg-[#2C2408] dark:text-[#FACC15] dark:border-[#4E3F0E]';
      default:
        return 'bg-[#F1EFE8] text-[#55636B] border-[#E2DDD3] dark:bg-[#182333] dark:text-[#9AA6AC] dark:border-[#223043]';
    }
  };

  const formatTimestamp = (ms) => {
    if (!ms) return 'Just now';
    const date = new Date(ms);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-[#FAF9F5] dark:bg-[#111923] border border-[#E2DDD3] dark:border-[#223043] rounded-lg flex flex-col h-full min-h-0 overflow-hidden shadow-sm transition-colors select-none">
      {/* Panel Top Header & Mode Tabs */}
      <div className="px-3.5 py-2.5 border-b border-[#E2DDD3] dark:border-[#223043] bg-[#F1EFE8]/70 dark:bg-[#0b1118]/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-[#E2DDD3]/60 dark:bg-[#182333] p-0.5 rounded-md text-xs font-mono">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-[#FAF9F5] dark:bg-[#111923] text-[#111923] dark:text-[#F1EFE8] font-semibold shadow-sm border border-[#E2DDD3]/50 dark:border-[#223043]'
                : 'text-[#647078] dark:text-[#9AA6AC] hover:text-[#111923] dark:hover:text-white'
            }`}
          >
            Active ({calls.length})
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              activeTab === 'saved'
                ? 'bg-[#FAF9F5] dark:bg-[#111923] text-[#111923] dark:text-[#F1EFE8] font-semibold shadow-sm border border-[#E2DDD3]/50 dark:border-[#223043]'
                : 'text-[#647078] dark:text-[#9AA6AC] hover:text-[#111923] dark:hover:text-white'
            }`}
          >
            Saved ({savedCases.length})
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {isSurgeActive && (
            <span className="text-[10px] font-mono font-semibold text-[#B33939] dark:text-[#F87171] bg-[#FBEAE9] dark:bg-[#341616] border border-[#F2B8B5] dark:border-[#5A2323] px-2 py-0.5 rounded animate-pulse">
              SURGE
            </span>
          )}

          <button
            onClick={onRefreshQueue}
            disabled={isLoading}
            className="p-1 rounded text-[#647078] dark:text-[#9AA6AC] hover:text-[#111923] dark:hover:text-[#F1EFE8] hover:bg-[#E2DDD3]/50 dark:hover:bg-[#182333] transition-colors"
            title="Refresh queue"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="px-3.5 py-2 border-b border-[#E2DDD3] dark:border-[#223043] bg-[#FAF9F5] dark:bg-[#111923] space-y-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C969E]" />
          <input
            type="text"
            placeholder="Search identifier, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F1EFE8] dark:bg-[#0b1118] border border-[#E2DDD3] dark:border-[#223043] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#111923] dark:text-[#F1EFE8] placeholder-[#8C969E] focus:outline-none focus:border-[#477F7C]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#8C969E] hover:text-[#111923]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Urgency Filter Pills */}
        <div className="flex items-center gap-1 text-[10px] font-mono overflow-x-auto pb-0.5">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setUrgencyFilter(lvl)}
              className={`px-2 py-0.5 rounded border transition-colors ${
                urgencyFilter === lvl
                  ? 'bg-[#111923] dark:bg-[#FAF9F5] text-[#FAF9F5] dark:text-[#111923] border-[#111923] dark:border-[#FAF9F5] font-semibold'
                  : 'bg-[#F1EFE8] dark:bg-[#182333] text-[#647078] dark:text-[#9AA6AC] border-[#E2DDD3] dark:border-[#223043] hover:border-[#B18B56]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Live Microphone Standalone Component */}
      <div className="px-3.5 py-2.5 border-b border-[#E2DDD3] dark:border-[#223043] bg-[#F7F5EE] dark:bg-[#141C28]">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                isRecording
                  ? 'bg-[#B33939] text-white shadow-md animate-pulse'
                  : 'bg-[#E2DDD3] dark:bg-[#1E293B] text-[#477F7C] dark:text-[#55B7AE]'
              }`}
            >
              {isRecording ? <Mic size={13} /> : <MicOff size={13} />}
            </div>
            <div>
              <span className="text-xs font-semibold text-[#111923] dark:text-[#F1EFE8] block leading-tight">
                Live Microphone Input
              </span>
              <span className="text-[10px] font-mono text-[#647078] dark:text-[#8C969E]">
                {isRecording
                  ? 'Streaming audio & speech'
                  : micPermission === 'denied'
                  ? 'Access denied by browser'
                  : 'Standby · Click to record'}
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleMicrophone}
            className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all shadow-sm flex items-center gap-1.5 ${
              isRecording
                ? 'bg-[#B33939] hover:bg-[#9B2C2C] text-white'
                : 'bg-[#477F7C] hover:bg-[#3B6C69] text-white'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRecording ? 'bg-white animate-ping' : 'bg-[#FAF9F5]'
              }`}
            />
            <span>{isRecording ? 'Stop' : 'Start'}</span>
          </button>
        </div>

        {/* Live Audio Spectrum Bars when recording */}
        {isRecording && (
          <div className="mt-2 p-2 rounded bg-[#0b1118] border border-[#223043] space-y-1">
            <div className="h-6 flex items-end gap-1 px-1">
              {micFreqBands.map((val, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded-t-sm transition-all duration-75 bg-[#55B7AE]"
                  style={{ height: `${Math.max(8, val)}%` }}
                />
              ))}
            </div>
            {micLiveText && (
              <p className="text-[10px] font-sans italic text-[#E2DDD3] truncate pt-1 border-t border-[#223043]">
                "{micLiveText}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Upload File & Scenario Drawer Trigger Bars (Quick Actions) */}
      <div className="px-3.5 py-1.5 border-b border-[#E2DDD3] dark:border-[#223043] bg-[#FAF9F5] dark:bg-[#111923] flex items-center justify-between text-xs">
        <span className="font-mono text-[9px] uppercase text-[#8C969E] tracking-wider">
          Quick Actions
        </span>
        <div className="flex items-center gap-1 font-mono text-[10px]">
          <button
            onClick={() => {
              setShowUploadDrawer(!showUploadDrawer);
              setShowScenarioDrawer(false);
            }}
            className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
              showUploadDrawer
                ? 'bg-[#B18B56] text-white border-[#B18B56]'
                : 'bg-[#F1EFE8] dark:bg-[#182333] text-[#55636B] dark:text-[#9AA6AC] border-[#E2DDD3] dark:border-[#223043] hover:border-[#B18B56]'
            }`}
            title="Upload Audio File (WAV)"
          >
            <Upload size={10} />
            <span>Upload Audio File</span>
          </button>

          <button
            onClick={() => {
              setShowScenarioDrawer(!showScenarioDrawer);
              setShowUploadDrawer(false);
            }}
            className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
              showScenarioDrawer
                ? 'bg-[#477F7C] text-white border-[#477F7C]'
                : 'bg-[#F1EFE8] dark:bg-[#182333] text-[#55636B] dark:text-[#9AA6AC] border-[#E2DDD3] dark:border-[#223043] hover:border-[#477F7C]'
            }`}
            title="Run Scenario Test"
          >
            <Radio size={10} />
            <span>Run Scenario Test</span>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('decision-support');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-2 py-0.5 rounded border bg-[#F1EFE8] dark:bg-[#182333] text-[#55636B] dark:text-[#9AA6AC] border-[#E2DDD3] dark:border-[#223043] hover:border-[#477F7C] transition-colors flex items-center gap-1"
            title="View Incident Logs"
          >
            <Clock size={10} />
            <span className="hidden sm:inline">Incident Logs</span>
          </button>
        </div>
      </div>

      {/* Drawer: Upload Audio File */}
      {showUploadDrawer && (
        <form
          onSubmit={handleUploadSubmit}
          className="p-3 bg-[#F1EFE8] dark:bg-[#131b26] border-b border-[#E2DDD3] dark:border-[#223043] space-y-2 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#111923] dark:text-[#F1EFE8]">
              Upload Recording (.wav)
            </span>
            <button
              type="button"
              onClick={() => setShowUploadDrawer(false)}
              className="text-[10px] text-[#8C969E] hover:text-[#111923]"
            >
              Close
            </button>
          </div>

          <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#0b1118] border border-dashed border-[#B18B56] rounded-md cursor-pointer hover:bg-[#FAF9F5] text-xs text-[#55636B] dark:text-[#9AA6AC] transition-colors">
            <FileAudio size={14} className="text-[#B18B56] shrink-0" />
            <span className="truncate flex-1">
              {uploadFile ? uploadFile.name : 'Choose audio file...'}
            </span>
            <input
              type="file"
              accept="audio/wav,audio/*"
              onChange={(e) => e.target.files && setUploadFile(e.target.files[0])}
              className="hidden"
            />
          </label>

          <input
            type="text"
            placeholder="Context note (optional, e.g. 'Caller says extortion in progress')..."
            value={transcriptHint}
            onChange={(e) => setTranscriptHint(e.target.value)}
            className="w-full bg-white dark:bg-[#0b1118] border border-[#E2DDD3] dark:border-[#223043] rounded px-2.5 py-1.5 text-xs text-[#111923] dark:text-[#F1EFE8] placeholder-[#8C969E] focus:outline-none focus:border-[#477F7C]"
          />

          <button
            type="submit"
            disabled={!uploadFile || isAnalyzing}
            className={`w-full py-1.5 rounded text-xs font-semibold font-mono flex items-center justify-center gap-1.5 transition-colors ${
              !uploadFile || isAnalyzing
                ? 'bg-[#E2DDD3] dark:bg-[#1E293B] text-[#8C969E] cursor-not-allowed'
                : 'bg-[#477F7C] hover:bg-[#3B6C69] text-white shadow-sm'
            }`}
          >
            {isAnalyzing ? (
              <span>Analyzing Audio...</span>
            ) : (
              <>
                <Play size={11} className="fill-current" />
                <span>Process & Ingest Call</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Drawer: Scenario Test Selection */}
      {showScenarioDrawer && (
        <div className="p-3 bg-[#F1EFE8] dark:bg-[#131b26] border-b border-[#E2DDD3] dark:border-[#223043] space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#111923] dark:text-[#F1EFE8]">
              Test Incident Scenarios
            </span>
            <button
              onClick={() => setShowScenarioDrawer(false)}
              className="text-[10px] text-[#8C969E] hover:text-[#111923]"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs font-sans">
            {[
              { id: 'digital_arrest', label: 'Digital Arrest', tag: 'High Fear' },
              { id: 'upi_fraud', label: 'UPI APK Drain', tag: 'High Distress' },
              { id: 'distressed_victim', label: 'Sextortion', tag: 'Critical Alert' },
              { id: 'informant', label: 'Mule Account Tip', tag: 'Moderate' },
            ].map((scen) => (
              <button
                key={scen.id}
                onClick={() => handleScenarioSelect(scen.id)}
                className="p-2 rounded bg-white dark:bg-[#0b1118] border border-[#E2DDD3] dark:border-[#223043] hover:border-[#B18B56] text-left transition-colors shadow-sm"
              >
                <div className="font-medium text-[#111923] dark:text-[#F1EFE8] text-[11px] truncate">
                  {scen.label}
                </div>
                <div className="text-[9px] font-mono text-[#477F7C] dark:text-[#55B7AE] mt-0.5">
                  {scen.tag}
                </div>
              </button>
            ))}
          </div>

          {isMockMode && onSimulateSurge && (
            <button
              onClick={() => {
                onSimulateSurge();
                setShowScenarioDrawer(false);
              }}
              className="w-full py-1.5 px-2 rounded bg-white dark:bg-[#0b1118] border border-[#E2DDD3] dark:border-[#223043] hover:border-[#B18B56] text-xs font-mono text-[#B18B56] flex items-center justify-center gap-1.5 transition-colors"
            >
              <Zap size={12} className="text-[#B18B56]" />
              <span>Simulate Multi-Call Surge</span>
            </button>
          )}
        </div>
      )}

      {/* Main Call List Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        {filteredCalls.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-xs text-[#647078] dark:text-[#8C969E] space-y-2">
            <Phone className="w-8 h-8 text-[#C8C2B5] dark:text-[#2A374A] mx-auto" />
            <p className="font-serif text-sm font-semibold text-[#111923] dark:text-[#F1EFE8]">
              {activeTab === 'active' ? 'No active calls' : 'No saved cases in vault'}
            </p>
            <p className="text-[11px] max-w-[220px] text-[#647078] dark:text-[#8C969E]">
              {activeTab === 'active'
                ? 'Upload a recording or start live audio to begin triage.'
                : 'Save dossiers from the decision panel to review them offline.'}
            </p>
          </div>
        ) : (
          filteredCalls.map((call) => {
            const isSelected = call.call_id === selectedCallId;
            return (
              <div
                key={call.call_id}
                onClick={() => onSelectCall(call)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-150 border relative ${
                  isSelected
                    ? 'bg-[#477F7C]/15 dark:bg-[#182333] border-[#B18B56] shadow-sm'
                    : 'bg-white dark:bg-[#0b1118] border-[#E2DDD3] dark:border-[#223043] hover:border-[#B18B56]/60'
                }`}
              >
                {/* Thin antique gold indicator bar for selected call */}
                {isSelected && (
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#B18B56] rounded-l" />
                )}

                {/* Call ID & Urgency Pill */}
                <div className="flex items-center justify-between mb-1 pl-1">
                  <span className="font-mono text-xs font-bold text-[#111923] dark:text-[#F1EFE8] flex items-center gap-1.5">
                    <Phone
                      size={12}
                      className={isSelected ? 'text-[#B18B56]' : 'text-[#8C969E]'}
                    />
                    {call.call_id}
                  </span>

                  <span
                    className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded border ${getUrgencyBadge(
                      call.urgency_level
                    )}`}
                  >
                    {call.urgency_score} · {call.urgency_level}
                  </span>
                </div>

                {/* Caller Description */}
                <p className="text-xs text-[#202933] dark:text-[#E2DDD3] font-medium line-clamp-1 mb-2 pl-1">
                  {call.caller_tag}
                </p>

                {/* State & Metrics row */}
                <div className="space-y-1.5 pl-1">
                  <div className="flex items-center justify-between text-[11px] text-[#647078] dark:text-[#8C969E]">
                    <span className="flex items-center gap-1">
                      <Volume2 size={11} className="text-[#8C969E]" />
                      <span className="font-mono text-[10px]">
                        State:{' '}
                        <strong className="text-[#111923] dark:text-[#F1EFE8] capitalize font-medium">
                          {call.dominant_emotion || 'neutral'}
                        </strong>
                      </span>
                    </span>
                    <span className="font-mono text-[10px] text-[#8C969E]">
                      {formatTimestamp(call.timestamp_ms)}
                    </span>
                  </div>

                  {/* Urgency Progress Bar */}
                  <div className="w-full bg-[#E2DDD3] dark:bg-[#1E293B] rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        call.urgency_score >= 80
                          ? 'bg-[#B33939]'
                          : call.urgency_score >= 60
                          ? 'bg-[#B18B56]'
                          : 'bg-[#477F7C]'
                      }`}
                      style={{ width: `${call.urgency_score}%` }}
                    />
                  </div>
                </div>

                {/* Delete button for saved cases */}
                {activeTab === 'saved' && onDeleteSavedCase && (
                  <div className="mt-2 pt-2 border-t border-[#E2DDD3]/60 dark:border-[#223043] flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSavedCase(call.call_id);
                      }}
                      className="text-[10px] font-mono text-[#B33939] hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={11} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="px-3.5 py-2 border-t border-[#E2DDD3] dark:border-[#223043] bg-[#F1EFE8]/70 dark:bg-[#0b1118]/80 flex items-center justify-between text-[10px] font-mono text-[#647078] dark:text-[#8C969E]">
        <span>
          Showing {filteredCalls.length} of {currentList.length}
        </span>
        <span className="text-[#B18B56]">QUEUE ACTIVE</span>
      </div>
    </div>
  );
}
