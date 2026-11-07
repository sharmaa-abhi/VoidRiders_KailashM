import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Activity, Zap, AlertTriangle } from 'lucide-react';

/**
 * PitchContourCanvas: Real-time Pitch (F0) Contour & Vocal Micro-Tremor Canvas
 *
 * Visualizes fundamental frequency (F0) variation across call time,
 * plots micro-tremor pulse bursts (jitter > 2.8%), renders a synchronized
 * playhead scanline, and supports click/drag scrubbing along the timeline.
 */
export default function PitchContourCanvas({
  timelineSegments = [],
  biomarkers = {},
  currentTime = 0,
  duration = 10,
  isPlaying = false,
  onSeek,
  className = '',
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const animFrameRef = useRef(null);

  const [canvasDimensions, setCanvasDimensions] = useState({ width: 500, height: 100 });
  const [hoverTime, setHoverTime] = useState(null);

  // Normalization parameters
  const effectiveDuration = Math.max(1, Number(duration) || 10);
  const basePitch = Number(biomarkers?.pitch_hz) || 185.0;
  const jitterPct = Number(biomarkers?.jitter_tremor_pct) || 1.5;
  const isHighTremor = jitterPct > 2.8;

  // Track container dimensions with ResizeObserver and DPR
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(200, Math.floor(rect.width));
      const height = Math.max(80, Math.floor(rect.height || 100));

      setCanvasDimensions({ width, height });

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(container);

    window.addEventListener('resize', updateSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Acoustic emotion offsets & contours
  const emotionPitchDeltas = useMemo(() => ({
    fear: 54,        // High acoustic pitch surge under threat
    distress: 38,    // High pitch with quavering tremor
    anger: 42,       // Sharp pitch surge with harsh declination
    nervousness: 22, // Moderate elevated pitch
    neutral: 0,      // Baseline speech prosody
  }), []);

  // Compute smooth pitch (F0) trajectory points and tremor bursts
  const { contourPoints, tremorSpikes } = useMemo(() => {
    const { width, height } = canvasDimensions;
    const padding = { top: 22, bottom: 20, left: 44, right: 14 };
    const plotWidth = Math.max(10, width - padding.left - padding.right);
    const plotHeight = Math.max(10, height - padding.top - padding.bottom);

    const minFreq = 60.0;
    const maxFreq = 440.0;

    const yForFreq = (f) => {
      const clamped = Math.max(minFreq, Math.min(maxFreq, f));
      const norm = (clamped - minFreq) / (maxFreq - minFreq);
      return padding.top + (1 - norm) * plotHeight;
    };

    const xForTime = (t) => {
      const clamped = Math.max(0, Math.min(effectiveDuration, t));
      return padding.left + (clamped / effectiveDuration) * plotWidth;
    };

    // Synthesize high-density samples across duration
    const sampleCount = Math.max(80, Math.min(300, Math.round(plotWidth / 2.5)));
    const points = [];
    const spikes = [];

    // Safe segments fallback
    const segments = timelineSegments.length > 0 ? timelineSegments : [
      {
        start_sec: 0,
        end_sec: effectiveDuration,
        emotion: biomarkers?.dominant_emotion || 'neutral',
        urgency: 60,
      },
    ];

    for (let i = 0; i <= sampleCount; i++) {
      const t = (i / sampleCount) * effectiveDuration;

      // Find matching segment
      let activeSeg = segments.find((s) => t >= s.start_sec && t <= s.end_sec);
      if (!activeSeg) {
        activeSeg = segments[segments.length - 1] || segments[0];
      }

      const urgency = Number(activeSeg?.urgency ?? 65);
      const urgencyFactor = Math.max(0, Math.min(1, (urgency - 40) / 60));
      const emotionShift = (emotionPitchDeltas[activeSeg?.emotion] || 0) * (0.55 + 0.45 * urgencyFactor);

      // Intra-segment prosodic intonation arc (natural speech cadence)
      const segLen = Math.max(0.4, (activeSeg.end_sec || effectiveDuration) - (activeSeg.start_sec || 0));
      const segT = Math.max(0, Math.min(1, (t - (activeSeg.start_sec || 0)) / segLen));
      const prosody = 14 * Math.sin(Math.PI * segT) - 7 * (segT - 0.5);

      // Micro-tremor oscillation (4-8Hz primary flutter + 12-14Hz secondary harmonic)
      const tremorBaseAmp = isHighTremor ? (jitterPct * 2.6) : (jitterPct * 0.8);
      const microTremor =
        Math.sin(2 * Math.PI * 6.5 * t) * tremorBaseAmp +
        Math.sin(2 * Math.PI * 13.2 * t) * (tremorBaseAmp * 0.35);

      // Synthesized pitch
      const pitchHz = Math.max(75, Math.min(420, basePitch + emotionShift + prosody + microTremor));
      const x = xForTime(t);
      const y = yForFreq(pitchHz);

      points.push({ t, x, y, pitchHz, microTremor });

      // Identify tremor spike pulses when jitter exceeds threshold (>2.8%)
      if (isHighTremor && (urgency >= 75 || Math.abs(microTremor) > tremorBaseAmp * 0.85)) {
        // Space out spikes so dots do not clump
        const lastSpike = spikes[spikes.length - 1];
        if (!lastSpike || t - lastSpike.t >= 0.55) {
          spikes.push({
            t,
            x,
            y,
            pitchHz,
            severity: urgency >= 85 ? 'critical' : 'warning',
            jitterValue: jitterPct,
          });
        }
      }
    }

    return { contourPoints: points, tremorSpikes: spikes };
  }, [
    canvasDimensions,
    effectiveDuration,
    basePitch,
    jitterPct,
    isHighTremor,
    timelineSegments,
    biomarkers?.dominant_emotion,
    emotionPitchDeltas,
  ]);

  // Interpolate current pitch at currentTime
  const currentPitchAtTime = useCallback(
    (t) => {
      if (!contourPoints || contourPoints.length === 0) return basePitch;
      const clampedT = Math.max(0, Math.min(effectiveDuration, t));

      for (let i = 0; i < contourPoints.length - 1; i++) {
        const p1 = contourPoints[i];
        const p2 = contourPoints[i + 1];
        if (clampedT >= p1.t && clampedT <= p2.t) {
          const ratio = (clampedT - p1.t) / (p2.t - p1.t || 1e-4);
          return p1.pitchHz + ratio * (p2.pitchHz - p1.pitchHz);
        }
      }
      return contourPoints[contourPoints.length - 1].pitchHz;
    },
    [contourPoints, effectiveDuration, basePitch]
  );

  // Main Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasDimensions;
    const dpr = window.devicePixelRatio || 1;

    const render = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const padding = { top: 22, bottom: 20, left: 44, right: 14 };
      const plotWidth = Math.max(10, width - padding.left - padding.right);
      const plotHeight = Math.max(10, height - padding.top - padding.bottom);
      const minFreq = 60.0;
      const maxFreq = 440.0;

      const yForFreq = (f) => {
        const clamped = Math.max(minFreq, Math.min(maxFreq, f));
        const norm = (clamped - minFreq) / (maxFreq - minFreq);
        return padding.top + (1 - norm) * plotHeight;
      };

      // 1. Dark High-Tech Background (#080c14)
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, width, height);

      // Subtle cybernetic gradient overlay
      const bgGrad = ctx.createLinearGradient(0, 0, width, 0);
      bgGrad.addColorStop(0, 'rgba(6, 182, 212, 0.03)');
      bgGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.0)');
      bgGrad.addColorStop(1, 'rgba(244, 63, 94, 0.03)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Frequency Gridlines (100Hz, 200Hz, 300Hz, 400Hz)
      const gridFreqs = [100, 200, 300, 400];
      ctx.lineWidth = 1;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = '9px "JetBrains Mono", Menlo, Consolas, monospace';

      gridFreqs.forEach((freq) => {
        const y = yForFreq(freq);

        // Grid hairline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        // Frequency Label
        ctx.fillStyle = '#64748b';
        ctx.fillText(`${freq}Hz`, padding.left - 6, y);
      });
      ctx.setLineDash([]); // Reset dash

      // 3. Segment Divider Ticks & Urgency Indicators
      if (timelineSegments && timelineSegments.length > 0) {
        timelineSegments.forEach((seg) => {
          if (seg.end_sec && seg.end_sec < effectiveDuration) {
            const segX = padding.left + (seg.end_sec / effectiveDuration) * plotWidth;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
            ctx.lineWidth = 1;
            ctx.setLineDash([1, 4]);
            ctx.beginPath();
            ctx.moveTo(segX, padding.top);
            ctx.lineTo(segX, height - padding.bottom);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      }

      // 4. Fundamental Frequency (F0) Bezier Curve + Cyan Gradient Fill
      if (contourPoints && contourPoints.length > 1) {
        // A. Draw Gradient Fill Underneath Curve
        const gradFill = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradFill.addColorStop(0, 'rgba(6, 182, 212, 0.16)');
        gradFill.addColorStop(0.65, 'rgba(6, 182, 212, 0.04)');
        gradFill.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

        ctx.beginPath();
        ctx.moveTo(contourPoints[0].x, contourPoints[0].y);

        // Smooth Bezier path via midpoints
        for (let i = 0; i < contourPoints.length - 1; i++) {
          const xc = (contourPoints[i].x + contourPoints[i + 1].x) / 2;
          const yc = (contourPoints[i].y + contourPoints[i + 1].y) / 2;
          ctx.quadraticCurveTo(contourPoints[i].x, contourPoints[i].y, xc, yc);
        }
        ctx.lineTo(contourPoints[contourPoints.length - 1].x, contourPoints[contourPoints.length - 1].y);

        // Close to bottom baseline
        ctx.lineTo(contourPoints[contourPoints.length - 1].x, height - padding.bottom);
        ctx.lineTo(contourPoints[0].x, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradFill;
        ctx.fill();

        // B. Draw Cyan Stroke (#06b6d4, line width 2)
        ctx.beginPath();
        ctx.moveTo(contourPoints[0].x, contourPoints[0].y);

        for (let i = 0; i < contourPoints.length - 1; i++) {
          const xc = (contourPoints[i].x + contourPoints[i + 1].x) / 2;
          const yc = (contourPoints[i].y + contourPoints[i + 1].y) / 2;
          ctx.quadraticCurveTo(contourPoints[i].x, contourPoints[i].y, xc, yc);
        }
        ctx.lineTo(contourPoints[contourPoints.length - 1].x, contourPoints[contourPoints.length - 1].y);

        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(6, 182, 212, 0.35)';
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
      }

      // 5. Micro-Tremor Pulse Indicators (amber/rose dots where jitter > 2.8%)
      if (isHighTremor && tremorSpikes && tremorSpikes.length > 0) {
        tremorSpikes.forEach((spike) => {
          const isCrit = spike.severity === 'critical';
          const outerColor = isCrit ? 'rgba(244, 63, 94, 0.35)' : 'rgba(245, 158, 11, 0.35)';
          const coreColor = isCrit ? '#f43f5e' : '#f59e0b';

          // Outer halo pulse
          ctx.beginPath();
          ctx.arc(spike.x, spike.y, 6.5, 0, Math.PI * 2);
          ctx.fillStyle = outerColor;
          ctx.fill();

          // Inner solid tremor dot
          ctx.beginPath();
          ctx.arc(spike.x, spike.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = coreColor;
          ctx.fill();

          // Subtle vertical tremor marker tick
          ctx.strokeStyle = outerColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(spike.x, spike.y - 7);
          ctx.lineTo(spike.x, Math.max(padding.top - 2, spike.y - 13));
          ctx.stroke();
        });
      }

      // 6. Hover Preview Cursor (when mouse moves over canvas)
      if (hoverTime !== null && hoverTime !== currentTime) {
        const hoverX = padding.left + (hoverTime / effectiveDuration) * plotWidth;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(hoverX, padding.top);
        ctx.lineTo(hoverX, height - padding.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 7. Synchronized Scanline Cursor & Top Playhead Pip
      const curSec = Math.max(0, Math.min(effectiveDuration, Number(currentTime) || 0));
      const curX = padding.left + (curSec / effectiveDuration) * plotWidth;
      const curF0 = currentPitchAtTime(curSec);
      const curY = yForFreq(curF0);

      // Vertical Scanline Hairline
      const scanGrad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      scanGrad.addColorStop(0, 'rgba(6, 182, 212, 0.85)');
      scanGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.6)');
      scanGrad.addColorStop(1, 'rgba(6, 182, 212, 0.85)');

      ctx.strokeStyle = scanGrad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(curX, padding.top - 2);
      ctx.lineTo(curX, height - padding.bottom);
      ctx.stroke();

      // Intersection pip on F0 curve
      ctx.beginPath();
      ctx.arc(curX, curY, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(curX, curY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Top Playhead Pip Badge (showing timestamp & F0 value)
      const pipText = `${curSec.toFixed(1)}s • ${Math.round(curF0)} Hz`;
      ctx.font = 'bold 9px "JetBrains Mono", Menlo, Consolas, monospace';
      const textMetrics = ctx.measureText(pipText);
      const pipWidth = textMetrics.width + 12;
      const pipHeight = 15;
      const pipY = padding.top - 12;

      // Clamp pip within left/right plot boundaries
      const minPipX = padding.left + pipWidth / 2;
      const maxPipX = width - padding.right - pipWidth / 2;
      const clampedPipX = Math.max(minPipX, Math.min(maxPipX, curX));

      // Draw pill background
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      const rx = clampedPipX - pipWidth / 2;
      const ry = pipY - pipHeight / 2;
      const radius = 3;

      ctx.beginPath();
      ctx.moveTo(rx + radius, ry);
      ctx.lineTo(rx + pipWidth - radius, ry);
      ctx.quadraticCurveTo(rx + pipWidth, ry, rx + pipWidth, ry + radius);
      ctx.lineTo(rx + pipWidth, ry + pipHeight - radius);
      ctx.quadraticCurveTo(rx + pipWidth, ry + pipHeight, rx + pipWidth - radius, ry + pipHeight);
      ctx.lineTo(rx + radius, ry + pipHeight);
      ctx.quadraticCurveTo(rx, ry + pipHeight, rx, ry + pipHeight - radius);
      ctx.lineTo(rx, ry + radius);
      ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pip text
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pipText, clampedPipX, pipY + 0.5);

      // Bottom Timeline Ticks (0s, 50%, 100%)
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'left';
      ctx.font = '8px "JetBrains Mono", Menlo, Consolas, monospace';
      ctx.fillText('0.0s', padding.left, height - 6);

      ctx.textAlign = 'center';
      const midSec = (effectiveDuration / 2).toFixed(1);
      ctx.fillText(`${midSec}s`, padding.left + plotWidth / 2, height - 6);

      ctx.textAlign = 'right';
      ctx.fillText(`${effectiveDuration.toFixed(1)}s`, width - padding.right, height - 6);

      ctx.restore();
    };

    render();

    // Re-render silky 60fps playhead animation during audio playback
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(render);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    canvasDimensions,
    effectiveDuration,
    contourPoints,
    tremorSpikes,
    currentTime,
    hoverTime,
    isPlaying,
    isHighTremor,
    timelineSegments,
    currentPitchAtTime,
  ]);

  // Click & Drag Scrub Seeking
  const handleSeekFromClientX = useCallback(
    (clientX) => {
      const container = containerRef.current;
      if (!container || !onSeek) return;

      const rect = container.getBoundingClientRect();
      const padding = { left: 44, right: 14 };
      const plotWidth = Math.max(10, rect.width - padding.left - padding.right);

      const relX = clientX - rect.left - padding.left;
      const ratio = Math.max(0, Math.min(1, relX / plotWidth));
      const targetSec = Math.round(ratio * effectiveDuration * 10) / 10;

      onSeek(targetSec);
    },
    [onSeek, effectiveDuration]
  );

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    handleSeekFromClientX(e.clientX);
  };

  const handlePointerMove = (e) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const padding = { left: 44, right: 14 };
    const plotWidth = Math.max(10, rect.width - padding.left - padding.right);
    const relX = e.clientX - rect.left - padding.left;
    const ratio = Math.max(0, Math.min(1, relX / plotWidth));
    const previewTime = Math.round(ratio * effectiveDuration * 10) / 10;
    setHoverTime(previewTime);

    if (isDraggingRef.current) {
      handleSeekFromClientX(e.clientX);
    }
  };

  const handlePointerUp = (e) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const handlePointerLeave = () => {
    setHoverTime(null);
  };

  return (
    <div
      className={`bg-[#080c14] border border-slate-200 dark:border-[#1e293b] rounded-lg overflow-hidden flex flex-col select-none transition-colors shadow-sm ${className}`}
    >
      {/* Telemetry Header Bar */}
      <div className="px-3 py-1.5 bg-[#0b101c] border-b border-slate-200 dark:border-[#1e293b]/70 flex items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-mono uppercase tracking-wider text-[9px] text-cyan-300">
              Vocal telemetry // Pitch (F0) & Tremor
            </span>
          </div>

          {isPlaying && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 text-[8px] font-mono border border-cyan-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              SYNC
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono">
          {/* Tremor Alert Badge */}
          {isHighTremor ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[9px] font-semibold animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>TREMOR SPIKE {jitterPct}%</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[9px]">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>STABLE {jitterPct}%</span>
            </div>
          )}

          {/* Current Pitch Readout */}
          <div className="text-slate-400 text-[9px] hidden sm:inline-block">
            Base: <span className="text-slate-200 font-semibold">{Math.round(basePitch)} Hz</span>
          </div>
        </div>
      </div>

      {/* High-Tech Canvas Scrubber */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="relative w-full h-[96px] cursor-crosshair touch-none"
        title="Click or drag to seek along vocal pitch timeline"
      >
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>
    </div>
  );
}
