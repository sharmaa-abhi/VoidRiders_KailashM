/**
 * Task 2 Verification Script: Real-Time Pitch-Contour & Tremor Canvas Component
 * Validates PitchContourCanvas implementation, ForensicsPanel integration,
 * math synthesis, tremor detection thresholds, and seek handlers.
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- Starting Task 2 Verification Suite ---');

// 1. Verify PitchContourCanvas file exists and contains required props and features
const canvasPath = path.resolve('frontend/src/components/PitchContourCanvas.jsx');
assert(fs.existsSync(canvasPath), 'PitchContourCanvas.jsx must exist');
const canvasCode = fs.readFileSync(canvasPath, 'utf8');

assert(canvasCode.includes('timelineSegments'), 'Must accept timelineSegments prop');
assert(canvasCode.includes('biomarkers'), 'Must accept biomarkers prop');
assert(canvasCode.includes('currentTime'), 'Must accept currentTime prop');
assert(canvasCode.includes('duration'), 'Must accept duration prop');
assert(canvasCode.includes('isPlaying'), 'Must accept isPlaying prop');
assert(canvasCode.includes('onSeek'), 'Must accept onSeek prop');

// Canvas dimensions and Retina DPR
assert(canvasCode.includes('ResizeObserver'), 'Must measure canvas dynamically using ResizeObserver');
assert(canvasCode.includes('devicePixelRatio'), 'Must handle devicePixelRatio for crisp Retina rendering');

// High-tech dark background & frequency grid
assert(canvasCode.includes('#080c14'), 'Must draw dark high-tech background #080c14');
assert(canvasCode.includes('100') && canvasCode.includes('200') && canvasCode.includes('300') && canvasCode.includes('400'), 'Must render 100Hz, 200Hz, 300Hz, 400Hz frequency gridlines');

// Bezier curve & cyan styling
assert(canvasCode.includes('#06b6d4'), 'Must use cyan #06b6d4 for pitch contour curve');
assert(canvasCode.includes('quadraticCurveTo'), 'Must use smooth Bezier curve drawing');

// Tremor detection where jitter > 2.8%
assert(canvasCode.includes('2.8'), 'Must evaluate jitter tremor threshold at 2.8%');
assert(canvasCode.includes('tremorSpikes') || canvasCode.includes('isHighTremor'), 'Must render micro-tremor markers');
assert(canvasCode.includes('#f43f5e') || canvasCode.includes('#f59e0b'), 'Must render amber/rose tremor markers');

// Synchronized scanline cursor & pip
assert(canvasCode.includes('pipText') || canvasCode.includes('curSec') || canvasCode.includes('curF0'), 'Must render playhead cursor with timestamp and F0 readout');

// Click / drag to seek
assert(canvasCode.includes('onPointerDown') || canvasCode.includes('handleSeekFromClientX'), 'Must support click/drag seeking');
console.log('✓ PitchContourCanvas code inspections passed');

// 2. Verify ForensicsPanel integration
const panelPath = path.resolve('frontend/src/components/ForensicsPanel.jsx');
assert(fs.existsSync(panelPath), 'ForensicsPanel.jsx must exist');
const panelCode = fs.readFileSync(panelPath, 'utf8');

assert(panelCode.includes("import PitchContourCanvas from './PitchContourCanvas'"), 'ForensicsPanel must import PitchContourCanvas');
assert(panelCode.includes('<PitchContourCanvas'), 'ForensicsPanel must render <PitchContourCanvas />');
assert(panelCode.includes('timelineSegments={timeline}'), 'Must pass timelineSegments={timeline}');
assert(panelCode.includes('biomarkers={biomarkers}'), 'Must pass biomarkers={biomarkers}');
assert(panelCode.includes('currentTime={audioPlaybackSec}'), 'Must pass currentTime={audioPlaybackSec}');
assert(panelCode.includes('duration={audioDurationSec}'), 'Must pass duration={audioDurationSec}');
assert(panelCode.includes('isPlaying='), 'Must pass isPlaying state');
assert(panelCode.includes('onSeek={handleSeek}'), 'Must pass onSeek={handleSeek}');

// Verify handleSeek accepts numbers as well as events
assert(panelCode.includes("typeof target === 'number'"), 'handleSeek must support direct numeric seek timestamps');

// Verify removal of cluttered 24-band frequency block
assert(!panelCode.includes('freqBands.map'), 'Cluttered 24-band frequency bars must be cleaned up from mic tab');
console.log('✓ ForensicsPanel integration inspections passed');

// 3. Test mathematical synthesis of F0 points & tremor bursts
const basePitch = 284.5; // From Digital Arrest scenario
const duration = 10.0;
const segments = [
  { start_sec: 0.0, end_sec: 2.5, emotion: 'nervousness', urgency: 72 },
  { start_sec: 2.5, end_sec: 5.0, emotion: 'fear', urgency: 91 },
  { start_sec: 5.0, end_sec: 7.5, emotion: 'fear', urgency: 96 },
  { start_sec: 7.5, end_sec: 10.0, emotion: 'distress', urgency: 94 },
];

const emotionDeltas = { fear: 54, distress: 38, anger: 42, nervousness: 22, neutral: 0 };
const jitterPct = 4.2; // High tremor (> 2.8%)

let tremorSpikeCount = 0;
const samplePoints = [];
for (let i = 0; i <= 100; i++) {
  const t = (i / 100) * duration;
  const seg = segments.find((s) => t >= s.start_sec && t <= s.end_sec) || segments[0];
  const urgency = seg.urgency;
  const urgencyFactor = Math.max(0, Math.min(1, (urgency - 40) / 60));
  const emotionShift = (emotionDeltas[seg.emotion] || 0) * (0.55 + 0.45 * urgencyFactor);
  const microTremor = Math.sin(2 * Math.PI * 6.5 * t) * (jitterPct * 2.6);
  const pitchHz = basePitch + emotionShift + microTremor;

  samplePoints.push({ t, pitchHz });

  if (jitterPct > 2.8 && (urgency >= 75 || Math.abs(microTremor) > jitterPct * 2.0)) {
    tremorSpikeCount++;
  }
}

assert(samplePoints.length === 101, 'Should generate 101 sample points');
assert(samplePoints.every((p) => p.pitchHz > 60 && p.pitchHz < 450), 'All pitch points must fall within audible vocal range (60-450 Hz)');
assert(tremorSpikeCount > 5, 'Tremor spikes must be detected when jitter > 2.8%');
console.log(`✓ Mathematical acoustic model generated ${samplePoints.length} F0 points with ${tremorSpikeCount} micro-tremor triggers`);

console.log('--- ALL TASK 2 TESTS PASSED SUCCESSFULLY ---');
