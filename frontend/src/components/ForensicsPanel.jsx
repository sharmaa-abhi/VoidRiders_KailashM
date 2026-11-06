import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Activity,
  AudioWaveform,
  Volume2,
  VolumeX,
  Radio,
  FileCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  Info,
  Maximize2,
  RotateCcw,
  Gauge,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cyberAudioPlayer } from '../services/audioSynthesizer';
import {
  decodeAudioSource,
  extractWaveformPeaks,
  computeSpectrogram,
  drawWaveformCanvas,
  drawSpectrogramCanvas,
  generateBiomarkerWaveform,
  generateBiomarkerSpectrogram
} from '../services/audioVisualizerService';
import { INDICATIVE_DISCLAIMER } from '../mockData';

export default function ForensicsPanel({
  activeCall,
  onAnalyzeAudioFile,
  onSimulateScenario,
  isAnalyzing
}) {
  const [visTab, setVisTab] = useState('waveform'); // 'waveform' | 'spectrogram' | 'analysis'
  const [bottomTab, setBottomTab] = useState('transcript'); // 'transcript' | 'summary' | 'cues'

  // Playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlaybackSec, setAudioPlaybackSec] = useState(0);
  const [audioDurationSec, setAudioDurationSec] = useState(10);
  const [audioVolume, setAudioVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [hoverProgress, setHoverProgress] = useState(-1);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  // Real decoded audio data
  const [decodedPeaks, setDecodedPeaks] = useState(null);
  const [spectrogramMatrix, setSpectrogramMatrix] = useState(null);

  // Canvas refs
  const waveformCanvasRef = useRef(null);
  const spectrogramCanvasRef = useRef(null);
  const animationRef = useRef(null);

  // Helper to map call ID to sample audio
  const getAudioUrlForCall = (call) => {
    if (!call) return null;
    if (call.audio_url) return call.audio_url;
    if (call.audio_file) return call.audio_file;
    const cid = call.call_id?.toLowerCase() || '';
    if (cid.includes('0891') || cid.includes('digital') || cid.includes('panic')) {
      return '/samples/panic_victim.wav';
    }
    if (cid.includes('0893') || cid.includes('sextortion') || cid.includes('angry')) {
      return '/samples/angry_caller.wav';
    }
    return '/samples/nervous_caller.wav';
  };

  // Decode audio whenever active call changes
  useEffect(() => {
    cyberAudioPlayer.stop();
    setIsPlayingAudio(false);
    setAudioPlaybackSec(0);

    if (!activeCall) {
      setDecodedPeaks(null);
      setSpectrogramMatrix(null);
      return;
    }

    let isSubscribed = true;
    setIsAudioLoading(true);

    const loadAndDecode = async () => {
      const audioSource = getAudioUrlForCall(activeCall);
      if (!audioSource) {
        setIsAudioLoading(false);
        return;
      }

      try {
        const decoded = await decodeAudioSource(audioSource);
        if (!isSubscribed) return;

        if (decoded && decoded.channelData) {
          const peaks = extractWaveformPeaks(decoded.channelData, 160);
          const spec = computeSpectrogram(decoded.channelData, decoded.sampleRate, 140, 64);
          setDecodedPeaks(peaks);
          setSpectrogramMatrix(spec);
          setAudioDurationSec(decoded.duration || 10);
        } else {
          // If decoding failed or file offline, derive authentic waveform from call's acoustic biomarkers
          const fallbackPeaks = generateBiomarkerWaveform(activeCall.acoustic_biomarkers, 160);
          const fallbackSpec = generateBiomarkerSpectrogram(activeCall.acoustic_biomarkers, 140, 64);
          setDecodedPeaks(fallbackPeaks);
          setSpectrogramMatrix(fallbackSpec);
          setAudioDurationSec(10);
        }
      } catch (err) {
        console.warn('Audio visualization decode error, using biomarker model:', err);
        const fallbackPeaks = generateBiomarkerWaveform(activeCall.acoustic_biomarkers, 160);
        const fallbackSpec = generateBiomarkerSpectrogram(activeCall.acoustic_biomarkers, 140, 64);
        setDecodedPeaks(fallbackPeaks);
        setSpectrogramMatrix(fallbackSpec);
        setAudioDurationSec(10);
      } finally {
        if (isSubscribed) setIsAudioLoading(false);
      }
    };

    loadAndDecode();

    return () => {
      isSubscribed = false;
      cyberAudioPlayer.stop();
    };
  }, [activeCall?.call_id]);

  // Render waveform canvas when peaks or playback position changes
  const renderWaveform = useCallback(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const progress = audioDurationSec > 0 ? audioPlaybackSec / audioDurationSec : 0;
    drawWaveformCanvas(canvas, decodedPeaks, progress, hoverProgress);
  }, [decodedPeaks, audioPlaybackSec, audioDurationSec, hoverProgress]);

  // Render spectrogram canvas when matrix or playback position changes
  const renderSpectrogram = useCallback(() => {
    const canvas = spectrogramCanvasRef.current;
    if (!canvas) return;
    const progress = audioDurationSec > 0 ? audioPlaybackSec / audioDurationSec : 0;
    drawSpectrogramCanvas(canvas, spectrogramMatrix, progress, audioDurationSec);
  }, [spectrogramMatrix, audioPlaybackSec, audioDurationSec]);

  // Trigger draw on tab or data change
  useEffect(() => {
    if (visTab === 'waveform') {
      renderWaveform();
    } else if (visTab === 'spectrogram') {
      renderSpectrogram();
    }
  }, [visTab, renderWaveform, renderSpectrogram]);

  // Animation frame loop during playback for silky smooth playhead motion
  useEffect(() => {
    if (!isPlayingAudio) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const loop = () => {
      if (visTab === 'waveform') {
        renderWaveform();
      } else if (visTab === 'spectrogram') {
        renderSpectrogram();
      }
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlayingAudio, visTab, renderWaveform, renderSpectrogram]);

  // Audio Playback Controls
  const togglePlayAudio = () => {
    if (!activeCall) return;

    if (isPlayingAudio) {
      cyberAudioPlayer.pause();
      setIsPlayingAudio(false);
    } else {
      cyberAudioPlayer.playScenario(
        activeCall,
        (curr, dur) => {
          setAudioPlaybackSec(curr);
          if (dur) setAudioDurationSec(dur);
        },
        () => {
          setIsPlayingAudio(false);
          setAudioPlaybackSec(0);
        }
      );
      setIsPlayingAudio(true);
    }
  };

  const handleCanvasClick = (e, canvasRef) => {
    if (!canvasRef.current || audioDurationSec <= 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frac = Math.max(0, Math.min(1, x / rect.width));
    const targetSec = frac * audioDurationSec;
    setAudioPlaybackSec(targetSec);
    cyberAudioPlayer.seek(targetSec);
  };

  const handleCanvasMouseMove = (e, canvasRef) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frac = Math.max(0, Math.min(1, x / rect.width));
    setHoverProgress(frac);
  };

  const handleCanvasMouseLeave = () => {
    setHoverProgress(-1);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setAudioVolume(val);
    cyberAudioPlayer.setVolume(val);
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      cyberAudioPlayer.setVolume(audioVolume || 0.8);
      setIsMuted(false);
    } else {
      cyberAudioPlayer.setVolume(0);
      setIsMuted(true);
    }
  };

  const formatTime = (sec) => {
    if (isNaN(sec) || sec < 0) sec = 0;
    const mins = Math.floor(sec / 60);
    const secs = (sec % 60).toFixed(1);
    return `${mins < 10 ? '0' : ''}${mins}:${parseFloat(secs) < 10 ? '0' : ''}${secs}`;
  };

  // Biomarkers & Transcript
  const biomarkers = activeCall?.acoustic_biomarkers || {
    pitch_hz: 180.0,
    jitter_tremor_pct: 1.5,
    speech_rate_sps: 4.2,
    rms_energy_db: -20.0,
    vocal_anomaly: 'Signal stable · Nominal vocal tone.',
    voice_activity_ratio: 0.85,
    confidence_score: 0.90,
  };

  const emotionProbs = activeCall?.emotion_probabilities || {
    fear: 0.2,
    distress: 0.2,
    nervousness: 0.2,
    anger: 0.2,
    neutral: 0.2,
  };

  const transcript = activeCall?.transcript || {
    raw_redacted: 'No transcript recorded.',
    pii_masked_count: 0,
    detected_keywords: [],
  };

  const timeline = activeCall?.timeline_segments || [];

  // PII & keyword highlighting for transcript
  const renderHighlightedTranscript = (rawText, keywords = []) => {
    if (!rawText) return 'Awaiting call audio...';
    const piiRegex = /(\[REDACTED-[A-Za-z]+\])/g;
    const parts = rawText.split(piiRegex);

    return parts.map((part, idx) => {
      if (part.startsWith('[REDACTED-')) {
        const label = part.replace('[REDACTED-', '').replace(']', '');
        return (
          <span
            key={idx}
            className="inline-flex items-center font-mono text-[10px] font-semibold bg-[#FAF3E8] dark:bg-[#2B2317] text-[#8C6B3A] dark:text-[#E4C594] border border-[#B18B56]/50 px-1.5 py-0.5 rounded mx-1 select-all"
          >
            {label} MASKED
          </span>
        );
      }

      if (keywords.length === 0) return <span key={idx}>{part}</span>;

      const escapedKws = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const kwRegex = new RegExp(`(${escapedKws.join('|')})`, 'gi');
      const kwParts = part.split(kwRegex);

      return (
        <span key={idx}>
          {kwParts.map((subPart, sIdx) => {
            const isMatch = keywords.some(
              (kw) => kw.toLowerCase() === subPart.toLowerCase()
            );
            if (isMatch) {
              return (
                <span
                  key={sIdx}
                  className="font-medium text-[#B33939] dark:text-[#F87171] underline decoration-[#B33939]/50 underline-offset-4 px-1 bg-[#FBEAE9] dark:bg-[#341616] rounded"
                >
                  {subPart}
                </span>
              );
            }
            return <span key={sIdx}>{subPart}</span>;
          })}
        </span>
      );
    });
  };

  return (
    <div className="bg-[#111923] text-[#F1EFE8] border border-[#223043] rounded-lg flex flex-col h-full min-h-0 overflow-hidden shadow-lg transition-colors select-none">
      {/* Refined Center Workspace Header */}
      <div className="px-5 py-3 border-b border-[#223043] bg-[#0b1118] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-[#182333] border border-[#B18B56]/40 flex items-center justify-center text-[#55B7AE]">
            <AudioWaveform size={14} />
          </div>
          <div>
            <h2 className="font-serif text-sm sm:text-base font-semibold tracking-wide text-[#FAF9F5] flex items-center gap-2">
              <span>Voice Analysis Workspace</span>
              {activeCall && (
                <span className="font-mono text-[10px] text-[#B18B56] font-normal px-2 py-0.5 rounded bg-[#182333] border border-[#223043]">
                  {activeCall.call_id}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-[#8C969E] font-sans">
              Scientific acoustic spectral analysis & forensic decoding
            </p>
          </div>
        </div>

        {/* Visualization Switcher Tabs */}
        <div className="flex items-center bg-[#182333] p-0.5 rounded-md border border-[#223043] text-xs font-mono">
          <button
            onClick={() => setVisTab('waveform')}
            className={`px-3 py-1 rounded text-xs transition-all ${
              visTab === 'waveform'
                ? 'bg-[#477F7C] text-white font-semibold shadow-sm'
                : 'text-[#8C969E] hover:text-white'
            }`}
          >
            Waveform
          </button>

          <button
            onClick={() => setVisTab('spectrogram')}
            className={`px-3 py-1 rounded text-xs transition-all ${
              visTab === 'spectrogram'
                ? 'bg-[#477F7C] text-white font-semibold shadow-sm'
                : 'text-[#8C969E] hover:text-white'
            }`}
          >
            Spectrogram
          </button>

          <button
            onClick={() => setVisTab('analysis')}
            className={`px-3 py-1 rounded text-xs transition-all ${
              visTab === 'analysis'
                ? 'bg-[#477F7C] text-white font-semibold shadow-sm'
                : 'text-[#8C969E] hover:text-white'
            }`}
          >
            Analysis
          </button>
        </div>
      </div>

      {/* Main Analysis Body */}
      <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-3.5">
        {activeCall ? (
          <>
            {/* Visualizer Canvas Card */}
            <div className="bg-[#0b1118] border border-[#223043] rounded-lg p-3 relative overflow-hidden shadow-inner">
              {/* Top Canvas Telemetry Row */}
              <div className="flex items-center justify-between text-[11px] font-mono text-[#8C969E] mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#55B7AE] animate-pulse" />
                  <span className="text-[#FAF9F5] font-medium">
                    {visTab === 'waveform'
                      ? 'PCM Time-Domain Waveform'
                      : visTab === 'spectrogram'
                      ? 'FFT Spectral Density (0 Hz – 8 kHz)'
                      : 'Acoustic Feature Extractor'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span>{isAudioLoading ? 'Decoding audio...' : '16 kHz Mono PCM'}</span>
                  <span className="text-[#B18B56]">·</span>
                  <span className="text-[#FAF9F5] font-semibold">{formatTime(audioPlaybackSec)}</span>
                  <span>/</span>
                  <span>{formatTime(audioDurationSec)}</span>
                </div>
              </div>

              {/* View 1: Waveform Canvas */}
              {visTab === 'waveform' && (
                <div className="relative cursor-pointer group" style={{ height: '170px' }}>
                  <canvas
                    ref={waveformCanvasRef}
                    width={800}
                    height={200}
                    className="w-full h-full rounded border border-[#223043]/70 block"
                    onClick={(e) => handleCanvasClick(e, waveformCanvasRef)}
                    onMouseMove={(e) => handleCanvasMouseMove(e, waveformCanvasRef)}
                    onMouseLeave={handleCanvasMouseLeave}
                  />

                  {/* Canvas Legend */}
                  <div className="absolute bottom-2 right-3 flex items-center gap-3 text-[9px] font-mono text-[#8C969E] bg-[#0b1118]/80 px-2 py-0.5 rounded border border-[#223043]/50 pointer-events-none">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#B18B56]" />
                      <span>Played</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#477F7C]" />
                      <span>Upcoming</span>
                    </span>
                  </div>
                </div>
              )}

              {/* View 2: Scientific Spectrogram Canvas */}
              {visTab === 'spectrogram' && (
                <div className="relative cursor-pointer group" style={{ height: '170px' }}>
                  <canvas
                    ref={spectrogramCanvasRef}
                    width={800}
                    height={200}
                    className="w-full h-full rounded border border-[#223043]/70 block"
                    onClick={(e) => handleCanvasClick(e, spectrogramCanvasRef)}
                    onMouseMove={(e) => handleCanvasMouseMove(e, spectrogramCanvasRef)}
                    onMouseLeave={handleCanvasMouseLeave}
                  />

                  {/* Colormap Legend */}
                  <div className="absolute bottom-2 right-3 flex items-center gap-1.5 text-[9px] font-mono text-[#8C969E] bg-[#0b1118]/85 px-2 py-0.5 rounded border border-[#223043]/50 pointer-events-none">
                    <span>Intensity:</span>
                    <div className="w-16 h-2 rounded-sm bg-gradient-to-r from-[#111923] via-[#477F7C] via-[#B18B56] to-[#FAF9F5]" />
                  </div>
                </div>
              )}

              {/* View 3: Analysis Diagnostic Radar/Summary */}
              {visTab === 'analysis' && (
                <div className="p-3 bg-[#111923] rounded border border-[#223043] space-y-3" style={{ minHeight: '170px' }}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                    <div className="p-2.5 rounded bg-[#182333] border border-[#223043]">
                      <span className="text-[10px] text-[#8C969E] block">Pitch Trend</span>
                      <strong className="text-[#55B7AE] text-sm block mt-0.5">
                        {biomarkers.pitch_hz > 240 ? 'Acute High Pitch' : 'Stable Nominal'}
                      </strong>
                      <span className="text-[9px] text-[#6A7880]">Baseline: 160-220 Hz</span>
                    </div>

                    <div className="p-2.5 rounded bg-[#182333] border border-[#223043]">
                      <span className="text-[10px] text-[#8C969E] block">Vocal Tremor</span>
                      <strong className="text-[#B18B56] text-sm block mt-0.5">
                        {biomarkers.jitter_tremor_pct > 3.0 ? 'Elevated Micro-Tremor' : 'Nominal Jitter'}
                      </strong>
                      <span className="text-[9px] text-[#6A7880]">Threshold: &gt; 3.0%</span>
                    </div>

                    <div className="p-2.5 rounded bg-[#182333] border border-[#223043]">
                      <span className="text-[10px] text-[#8C969E] block">Speech Cadence</span>
                      <strong className="text-[#FAF9F5] text-sm block mt-0.5">
                        {biomarkers.speech_rate_sps > 5.5 ? 'Rapid Agitated' : 'Measured Cadence'}
                      </strong>
                      <span className="text-[9px] text-[#6A7880]">Average: 3.5-5.0 syl/s</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-[#182333] border border-[#223043] text-xs font-sans text-[#E2DDD3] leading-relaxed">
                    <span className="font-mono text-[10px] text-[#B18B56] uppercase block mb-1">
                      Signal Anomaly Assessment
                    </span>
                    <p>{biomarkers.vocal_anomaly}</p>
                  </div>
                </div>
              )}

              {/* Playback Transport Bar */}
              <div className="mt-3 pt-2.5 border-t border-[#223043] flex items-center justify-between gap-3">
                {/* Play/Pause Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlayAudio}
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-all shadow-sm ${
                      isPlayingAudio
                        ? 'bg-[#B18B56] hover:bg-[#8C6B3A] text-white'
                        : 'bg-[#477F7C] hover:bg-[#3B6C69] text-white'
                    }`}
                    title={isPlayingAudio ? 'Pause' : 'Play call audio'}
                  >
                    {isPlayingAudio ? (
                      <Pause size={14} className="fill-current" />
                    ) : (
                      <Play size={14} className="fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="font-mono text-xs text-[#FAF9F5]">
                    <span>{formatTime(audioPlaybackSec)}</span>
                    <span className="text-[#8C969E] px-1">/</span>
                    <span className="text-[#8C969E]">{formatTime(audioDurationSec)}</span>
                  </div>
                </div>

                {/* Timeline scrubber slider */}
                <div className="flex-1 mx-2">
                  <input
                    type="range"
                    min="0"
                    max={audioDurationSec || 10}
                    step="0.05"
                    value={audioPlaybackSec}
                    onChange={(e) => {
                      const newSec = parseFloat(e.target.value);
                      setAudioPlaybackSec(newSec);
                      cyberAudioPlayer.seek(newSec);
                    }}
                    className="w-full h-1 bg-[#182333] rounded-lg appearance-none cursor-pointer accent-[#B18B56]"
                  />
                </div>

                {/* Volume & Audio controls */}
                <div className="flex items-center gap-2 text-[#8C969E]">
                  <button
                    onClick={toggleMute}
                    className="p-1 hover:text-white transition-colors"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : audioVolume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-[#182333] rounded-lg appearance-none cursor-pointer accent-[#477F7C]"
                  />
                </div>
              </div>
            </div>

            {/* Vocal Metrics Strip (Compact horizontal cards directly under canvas) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <div className="bg-[#0b1118] border border-[#223043] p-2.5 rounded-lg">
                <span className="text-[10px] font-mono text-[#8C969E] block">Pitch (F0)</span>
                <strong className="font-serif text-lg font-semibold text-[#FAF9F5] block mt-0.5">
                  {biomarkers.pitch_hz != null ? `${biomarkers.pitch_hz} Hz` : '—'}
                </strong>
                <span className="text-[9px] font-mono text-[#6A7880]">Fund. frequency</span>
              </div>

              <div className="bg-[#0b1118] border border-[#223043] p-2.5 rounded-lg">
                <span className="text-[10px] font-mono text-[#8C969E] block">Tremor (Jitter)</span>
                <strong className="font-serif text-lg font-semibold text-[#B18B56] block mt-0.5">
                  {biomarkers.jitter_tremor_pct != null ? `${biomarkers.jitter_tremor_pct}%` : '—'}
                </strong>
                <span className="text-[9px] font-mono text-[#6A7880]">Cycle variance</span>
              </div>

              <div className="bg-[#0b1118] border border-[#223043] p-2.5 rounded-lg">
                <span className="text-[10px] font-mono text-[#8C969E] block">Speech Rate</span>
                <strong className="font-serif text-lg font-semibold text-[#55B7AE] block mt-0.5">
                  {biomarkers.speech_rate_sps != null ? `${biomarkers.speech_rate_sps}` : '—'} <span className="text-xs font-mono font-normal">syl/s</span>
                </strong>
                <span className="text-[9px] font-mono text-[#6A7880]">Syllabic pace</span>
              </div>

              <div className="bg-[#0b1118] border border-[#223043] p-2.5 rounded-lg">
                <span className="text-[10px] font-mono text-[#8C969E] block">RMS Energy</span>
                <strong className="font-serif text-lg font-semibold text-[#FAF9F5] block mt-0.5">
                  {biomarkers.rms_energy_db != null ? `${biomarkers.rms_energy_db} dB` : '—'}
                </strong>
                <span className="text-[9px] font-mono text-[#6A7880]">Vocal power</span>
              </div>

              <div className="bg-[#0b1118] border border-[#223043] p-2.5 rounded-lg">
                <span className="text-[10px] font-mono text-[#8C969E] block">Speech Activity</span>
                <strong className="font-serif text-lg font-semibold text-[#10B981] block mt-0.5">
                  {biomarkers.voice_activity_ratio != null
                    ? `${Math.round(biomarkers.voice_activity_ratio * 100)}%`
                    : '—'}
                </strong>
                <span className="text-[9px] font-mono text-[#6A7880]">VAD ratio</span>
              </div>

              <div className="bg-[#0b1118] border border-[#223043] p-2.5 rounded-lg">
                <span className="text-[10px] font-mono text-[#8C969E] block">Signal Rating</span>
                <strong className="font-serif text-lg font-semibold text-[#FAF9F5] block mt-0.5">
                  {biomarkers.confidence_score != null
                    ? `${Math.round(biomarkers.confidence_score * 100)}%`
                    : '—'}
                </strong>
                <span className="text-[9px] font-mono text-[#6A7880]">SNR quality</span>
              </div>
            </div>

            {/* Bottom Section: Tabs for Transcription, Summary, Vocal Cues */}
            <div className="bg-[#0b1118] border border-[#223043] rounded-lg overflow-hidden">
              {/* Sub-Tabs Header */}
              <div className="px-4 py-2 border-b border-[#223043] bg-[#111923] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <button
                    onClick={() => setBottomTab('transcript')}
                    className={`px-3 py-1 rounded transition-colors ${
                      bottomTab === 'transcript'
                        ? 'bg-[#182333] text-[#FAF9F5] font-semibold border-b-2 border-[#B18B56]'
                        : 'text-[#8C969E] hover:text-white'
                    }`}
                  >
                    1. Transcription
                  </button>

                  <button
                    onClick={() => setBottomTab('summary')}
                    className={`px-3 py-1 rounded transition-colors ${
                      bottomTab === 'summary'
                        ? 'bg-[#182333] text-[#FAF9F5] font-semibold border-b-2 border-[#B18B56]'
                        : 'text-[#8C969E] hover:text-white'
                    }`}
                  >
                    2. Analysis Summary
                  </button>

                  <button
                    onClick={() => setBottomTab('cues')}
                    className={`px-3 py-1 rounded transition-colors ${
                      bottomTab === 'cues'
                        ? 'bg-[#182333] text-[#FAF9F5] font-semibold border-b-2 border-[#B18B56]'
                        : 'text-[#8C969E] hover:text-white'
                    }`}
                  >
                    3. Vocal & Emotional Cues
                  </button>
                </div>

                <span className="text-[10px] font-mono text-[#8C969E]">
                  {transcript.pii_masked_count} PII MASKED
                </span>
              </div>

              {/* Sub-Tab 1: Transcription */}
              {bottomTab === 'transcript' && (
                <div className="p-4 space-y-3">
                  <div className="bg-[#111923] p-3.5 rounded border border-[#223043] text-xs leading-relaxed text-[#E2DDD3] font-sans">
                    {renderHighlightedTranscript(
                      transcript.raw_redacted,
                      transcript.detected_keywords
                    )}
                  </div>

                  {/* Timeline Segments */}
                  {timeline.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#8C969E]">
                        <span>Call progression timeline</span>
                        <span>{timeline.length} segments</span>
                      </div>
                      <div className="flex gap-1 h-5 w-full bg-[#111923] p-0.5 rounded border border-[#223043]">
                        {timeline.map((seg, idx) => (
                          <div
                            key={idx}
                            title={`${seg.start_sec}s - ${seg.end_sec}s: ${seg.emotion} (Urgency: ${seg.urgency})`}
                            className="flex-1 rounded-sm text-[9px] font-mono flex items-center justify-center text-white bg-[#477F7C]"
                            style={{
                              backgroundColor:
                                seg.emotion === 'fear'
                                  ? '#B33939'
                                  : seg.emotion === 'distress'
                                  ? '#B18B56'
                                  : '#477F7C',
                            }}
                          >
                            <span className="truncate px-0.5">{seg.urgency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 2: Analysis Summary */}
              {bottomTab === 'summary' && (
                <div className="p-4 space-y-3 text-xs">
                  <div className="bg-[#111923] p-3 rounded border border-[#223043] space-y-1.5">
                    <span className="font-mono text-[10px] text-[#B18B56] uppercase tracking-wider block">
                      Incident Category & Rationale
                    </span>
                    <h3 className="font-serif text-base text-[#FAF9F5] font-semibold">
                      {activeCall.triage_insights?.crime_category || 'General Incident'}
                    </h3>
                    <p className="text-[#8C969E] leading-relaxed font-sans text-xs">
                      {activeCall.triage_insights?.explainability_summary ||
                        'Acoustic urgency derived from combined vocal biomarker tremor and keyword severity.'}
                    </p>
                  </div>

                  {/* Indicative Disclaimer Notice */}
                  <div className="p-3 rounded bg-[#182333]/80 border border-[#B18B56]/40 flex items-start gap-2.5 text-[#E2DDD3]">
                    <ShieldAlert size={16} className="text-[#B18B56] shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed font-sans">
                      {INDICATIVE_DISCLAIMER}
                    </p>
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: Vocal & Emotional Cues */}
              {bottomTab === 'cues' && (
                <div className="p-4 space-y-3">
                  <div className="space-y-2">
                    {[
                      { key: 'fear', label: 'Vocal Panic / Fear', color: '#B33939' },
                      { key: 'distress', label: 'Distress / Strain', color: '#B18B56' },
                      { key: 'nervousness', label: 'Tension / Hesitation', color: '#C9A36D' },
                      { key: 'anger', label: 'Agitation', color: '#9B2C2C' },
                      { key: 'neutral', label: 'Baseline Neutral', color: '#477F7C' },
                    ].map(({ key, label, color }) => {
                      const prob = emotionProbs[key] ?? 0.2;
                      const pct = Math.round(prob * 100);
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-[#E2DDD3]">{label}</span>
                            <span className="text-[#8C969E]">{pct}%</span>
                          </div>
                          <div className="w-full bg-[#182333] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[10px] font-sans text-[#8C969E] italic pt-1">
                    Note: Vocal indicators represent acoustic modulation signals only and do not establish clinical diagnosis or legal intent.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="h-72 flex flex-col items-center justify-center p-8 text-center text-[#8C969E] space-y-3">
            <FileCheck className="w-10 h-10 text-[#223043] mx-auto" />
            <h3 className="font-serif text-base font-semibold text-[#FAF9F5]">
              No audio selected
            </h3>
            <p className="text-xs max-w-sm text-[#8C969E] leading-relaxed">
              Choose an active call from the queue or upload an audio file to view real-time waveform, spectrogram, and acoustic biomarkers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
