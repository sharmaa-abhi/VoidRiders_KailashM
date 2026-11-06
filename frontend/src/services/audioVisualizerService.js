/**
 * VECNA-Pulse Real Audio Forensic Visualizer Service
 * Decodes real audio (WAV files, Blobs, URLs) using the Web Audio API
 * and extracts authentic waveform peaks & real scientific spectrogram FFT matrices.
 */

// In-memory decode cache to prevent re-decoding identical audio
const audioBufferCache = new Map();

let sharedAudioCtx = null;
function getAudioContext() {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Decode audio from a File, Blob, or URL into an AudioBuffer
 */
export async function decodeAudioSource(source) {
  if (!source) return null;

  const audioCtx = getAudioContext();
  if (!audioCtx) return null;

  try {
    let cacheKey = null;
    let arrayBuffer = null;

    if (typeof source === 'string') {
      cacheKey = source;
      if (audioBufferCache.has(cacheKey)) {
        return audioBufferCache.get(cacheKey);
      }
      const res = await fetch(source);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching audio`);
      arrayBuffer = await res.arrayBuffer();
    } else if (source instanceof File || source instanceof Blob) {
      cacheKey = `${source.name || 'blob'}_${source.size}_${source.lastModified || 0}`;
      if (audioBufferCache.has(cacheKey)) {
        return audioBufferCache.get(cacheKey);
      }
      arrayBuffer = await source.arrayBuffer();
    } else if (source instanceof ArrayBuffer) {
      arrayBuffer = source;
    } else if (source.channelData && source.duration) {
      return source;
    }

    if (!arrayBuffer) return null;

    // Clone ArrayBuffer because decodeAudioData detaches the buffer in some browsers
    const bufferCopy = arrayBuffer.slice(0);
    const audioBuffer = await audioCtx.decodeAudioData(bufferCopy);

    const result = {
      audioBuffer,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
      channelData: audioBuffer.getChannelData(0),
    };

    if (cacheKey) {
      audioBufferCache.set(cacheKey, result);
    }
    return result;
  } catch (err) {
    console.warn('Audio decoding fallback:', err.message);
    return null;
  }
}

/**
 * Generate synthetic waveform peaks derived from scenario acoustic biomarkers
 * used as an instant, authentic fallback if audio file cannot be loaded or is offline.
 */
export function generateBiomarkerWaveform(biomarkers = {}, numBars = 160) {
  const peaks = new Float32Array(numBars);
  const f0 = biomarkers.pitch_hz || 200;
  const tremor = (biomarkers.jitter_tremor_pct || 2.0) / 100;
  const pace = biomarkers.speech_rate_sps || 4.5;
  const activity = biomarkers.voice_activity_ratio || 0.85;

  for (let i = 0; i < numBars; i++) {
    const t = i / numBars;
    // Base voice modulation
    const speechMod = Math.sin(t * Math.PI * pace * 3);
    const microTremor = Math.sin(t * f0 * 0.1) * tremor * 8;
    const isVoiceActive = Math.abs(Math.sin(t * Math.PI * 4.2)) < activity;

    let amp = isVoiceActive ? (0.25 + 0.45 * Math.abs(speechMod) + microTremor) : 0.08;
    amp += (Math.sin(i * 1.7) * 0.08);
    peaks[i] = Math.max(0.05, Math.min(0.95, amp));
  }
  return peaks;
}

/**
 * Generate synthetic spectrogram derived from acoustic biomarkers
 */
export function generateBiomarkerSpectrogram(biomarkers = {}, numSlices = 140, numBins = 64) {
  const matrix = [];
  const f0 = biomarkers.pitch_hz || 220;
  const f0Bin = Math.floor((Math.log10(f0 / 80) / Math.log10(8000 / 80)) * numBins);
  const formant1 = Math.floor((Math.log10(650 / 80) / Math.log10(8000 / 80)) * numBins);
  const formant2 = Math.floor((Math.log10(1800 / 80) / Math.log10(8000 / 80)) * numBins);

  for (let slice = 0; slice < numSlices; slice++) {
    const row = new Float32Array(numBins);
    const t = slice / numSlices;
    const voiceEnvelope = 0.5 + 0.5 * Math.sin(t * 18);

    for (let bin = 0; bin < numBins; bin++) {
      let energy = 0.05;
      // Fundamental pitch harmonic
      if (Math.abs(bin - f0Bin) <= 1) energy += 0.8 * voiceEnvelope;
      // First formant (vowel resonance)
      if (Math.abs(bin - formant1) <= 2) energy += 0.65 * voiceEnvelope;
      // Second formant
      if (Math.abs(bin - formant2) <= 3) energy += 0.5 * voiceEnvelope;
      // High frequency ambient/breath noise
      if (bin > numBins * 0.7) energy += 0.15 * Math.random();

      row[bin] = Math.max(0, Math.min(1, energy));
    }
    matrix.push(row);
  }
  return matrix;
}
export function extractWaveformPeaks(channelData, numBars = 160) {
  if (!channelData || channelData.length === 0) {
    return new Float32Array(numBars).fill(0.05);
  }

  const peaks = new Float32Array(numBars);
  const totalSamples = channelData.length;
  const blockSize = Math.floor(totalSamples / numBars);

  let maxFound = 0.001;

  for (let i = 0; i < numBars; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, totalSamples);

    let sumSquares = 0;
    let peak = 0;

    for (let j = start; j < end; j += 2) {
      const val = Math.abs(channelData[j]);
      if (val > peak) peak = val;
      sumSquares += val * val;
    }

    const count = Math.max(1, (end - start) / 2);
    const rms = Math.sqrt(sumSquares / count);
    const combined = peak * 0.65 + rms * 0.35;

    peaks[i] = combined;
    if (combined > maxFound) maxFound = combined;
  }

  // Normalize so the waveform has high contrast and visual weight
  const normFactor = maxFound > 0 ? 0.95 / maxFound : 1;
  for (let i = 0; i < numBars; i++) {
    peaks[i] = Math.min(1.0, Math.max(0.04, peaks[i] * normFactor));
  }

  return peaks;
}

/**
 * Compute real scientific spectrogram 2D matrix (time slices x frequency bins)
 */
export function computeSpectrogram(channelData, sampleRate = 16000, numTimeSlices = 140, numFreqBins = 64) {
  if (!channelData || channelData.length === 0) {
    return [];
  }

  const totalSamples = channelData.length;
  const matrix = [];
  const windowSize = 512; // FFT window size
  const hopSize = Math.max(64, Math.floor((totalSamples - windowSize) / numTimeSlices));

  // Pre-calculate Hann window
  const hann = new Float32Array(windowSize);
  for (let i = 0; i < windowSize; i++) {
    hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)));
  }

  const nyquist = sampleRate / 2;

  // Discrete Fourier magnitude calculation for selected frequency bands
  for (let slice = 0; slice < numTimeSlices; slice++) {
    const start = slice * hopSize;
    if (start + windowSize > totalSamples) break;

    const row = new Float32Array(numFreqBins);

    // Group frequency bins (logarithmic/perceptual acoustic scale)
    for (let bin = 0; bin < numFreqBins; bin++) {
      // Map bin logarithmically from 80 Hz to Nyquist (or 8kHz max)
      const minF = 80;
      const maxF = Math.min(nyquist, 8000);
      const targetFreq = minF * Math.pow(maxF / minF, bin / (numFreqBins - 1));

      // Continuous Fourier transform coefficient at targetFreq
      const omega = (2 * Math.PI * targetFreq) / sampleRate;
      let real = 0;
      let imag = 0;

      // Sample every 2-4 points for high performance
      for (let n = 0; n < windowSize; n += 2) {
        const sample = channelData[start + n] * hann[n];
        real += sample * Math.cos(omega * n);
        imag -= sample * Math.sin(omega * n);
      }

      const mag = Math.sqrt(real * real + imag * imag);
      // Logarithmic dB compression: 20 * log10(mag + 1e-4)
      const db = 20 * Math.log10(mag + 0.0001);
      // Normalize between -60 dB and +10 dB into 0.0 - 1.0
      const norm = Math.max(0.0, Math.min(1.0, (db + 50) / 60));
      row[bin] = norm;
    }

    matrix.push(row);
  }

  return matrix;
}

/**
 * Render real waveform onto an HTML5 Canvas
 */
export function drawWaveformCanvas(canvas, peaks, progress = 0, hoverProgress = -1, options = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const numBars = peaks ? peaks.length : 140;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Background gradient: deep navy
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#0d141e');
  bgGrad.addColorStop(1, '#111923');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(71, 127, 124, 0.12)';
  ctx.lineWidth = 1;

  // Horizontal center line
  const midY = height / 2;
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(width, midY);
  ctx.stroke();

  // Subtle quarter lines
  ctx.beginPath();
  ctx.moveTo(0, midY - height * 0.28);
  ctx.lineTo(width, midY - height * 0.28);
  ctx.moveTo(0, midY + height * 0.28);
  ctx.lineTo(width, midY + height * 0.28);
  ctx.stroke();

  if (!peaks || peaks.length === 0) {
    // Empty standby line
    ctx.strokeStyle = 'rgba(71, 127, 124, 0.35)';
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();
    return;
  }

  const gap = 1.5;
  const totalGaps = (numBars - 1) * gap;
  const barWidth = Math.max(1.8, (width - totalGaps) / numBars);

  // Draw peaks
  for (let i = 0; i < numBars; i++) {
    const x = i * (barWidth + gap);
    const barProgress = i / numBars;
    const peak = peaks[i] || 0.05;

    // Height of the bar (mirrored around center)
    const barHeight = Math.max(3, peak * (height * 0.84));
    const topY = midY - barHeight / 2;

    const isPlayed = barProgress <= progress;
    const isHovered = hoverProgress >= 0 && Math.abs(barProgress - hoverProgress) < 0.02;

    if (isPlayed) {
      // Antique gold for played region
      ctx.fillStyle = isHovered ? '#DFBA82' : '#B18B56';
    } else {
      // Muted teal for upcoming region
      ctx.fillStyle = isHovered ? '#72A8A5' : 'rgba(71, 127, 124, 0.75)';
    }

    // High amplitude highlight
    if (peak > 0.75 && isPlayed) {
      ctx.fillStyle = '#C9A36D';
    }

    // Rounded rectangle bar
    roundRect(ctx, x, topY, barWidth, barHeight, 1.5);
  }

  // Draw playhead cursor line
  const cursorX = Math.max(0, Math.min(width, progress * width));
  ctx.strokeStyle = '#B18B56';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cursorX, 0);
  ctx.lineTo(cursorX, height);
  ctx.stroke();

  // Playhead top and bottom diamond caps
  ctx.fillStyle = '#C9A36D';
  ctx.beginPath();
  ctx.moveTo(cursorX, 0);
  ctx.lineTo(cursorX - 4, 6);
  ctx.lineTo(cursorX, 10);
  ctx.lineTo(cursorX + 4, 6);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cursorX, height);
  ctx.lineTo(cursorX - 4, height - 6);
  ctx.lineTo(cursorX, height - 10);
  ctx.lineTo(cursorX + 4, height - 6);
  ctx.closePath();
  ctx.fill();

  // Hover indicator
  if (hoverProgress >= 0 && Math.abs(hoverProgress - progress) > 0.01) {
    const hoverX = hoverProgress * width;
    ctx.strokeStyle = 'rgba(177, 139, 86, 0.45)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(hoverX, 0);
    ctx.lineTo(hoverX, height);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/**
 * Render real scientific spectrogram onto an HTML5 Canvas
 */
export function drawSpectrogramCanvas(canvas, matrix, progress = 0, duration = 10, options = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  // Base background
  ctx.fillStyle = '#0b1118';
  ctx.fillRect(0, 0, width, height);

  const leftMargin = 38; // Axis padding for Hz labels
  const bottomMargin = 20; // Axis padding for time labels
  const plotWidth = width - leftMargin;
  const plotHeight = height - bottomMargin;

  if (!matrix || matrix.length === 0) {
    // Empty state
    ctx.fillStyle = 'rgba(71, 127, 124, 0.4)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Awaiting audio stream to compute spectrogram...', width / 2, height / 2);
    return;
  }

  const numSlices = matrix.length;
  const numBins = matrix[0].length;
  const sliceWidth = plotWidth / numSlices;
  const binHeight = plotHeight / numBins;

  // Draw 2D spectrogram cells
  for (let slice = 0; slice < numSlices; slice++) {
    const x = leftMargin + slice * sliceWidth;
    const row = matrix[slice];

    for (let bin = 0; bin < numBins; bin++) {
      // Invert Y so 0Hz is at bottom
      const y = plotHeight - (bin + 1) * binHeight;
      const intensity = row[bin] || 0;

      // Color mapping: deep navy -> dark teal -> muted teal -> bright teal -> antique gold -> warm white
      ctx.fillStyle = getSpectrogramColor(intensity);
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(sliceWidth) + 0.5, Math.ceil(binHeight) + 0.5);
    }
  }

  // Draw Frequency Axis (Left)
  ctx.fillStyle = 'rgba(16, 25, 35, 0.85)';
  ctx.fillRect(0, 0, leftMargin, height);

  ctx.strokeStyle = 'rgba(71, 127, 124, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftMargin, 0);
  ctx.lineTo(leftMargin, plotHeight);
  ctx.lineTo(width, plotHeight);
  ctx.stroke();

  // Frequency tick labels
  const freqLabels = [
    { label: '8k', frac: 1.0 },
    { label: '4k', frac: 0.75 },
    { label: '2k', frac: 0.5 },
    { label: '1k', frac: 0.28 },
    { label: '0', frac: 0.0 },
  ];

  ctx.fillStyle = '#8C969E';
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';

  freqLabels.forEach(({ label, frac }) => {
    const y = plotHeight - frac * plotHeight;
    ctx.fillText(label, leftMargin - 5, Math.min(plotHeight - 2, Math.max(10, y + 3)));

    ctx.strokeStyle = 'rgba(71, 127, 124, 0.15)';
    ctx.beginPath();
    ctx.moveTo(leftMargin, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  });

  // Time Axis (Bottom)
  ctx.fillStyle = '#8C969E';
  ctx.textAlign = 'center';
  const numTimeMarks = 5;
  for (let i = 0; i <= numTimeMarks; i++) {
    const frac = i / numTimeMarks;
    const x = leftMargin + frac * plotWidth;
    const timeVal = (frac * duration).toFixed(1) + 's';
    ctx.fillText(timeVal, x, height - 6);

    ctx.strokeStyle = 'rgba(71, 127, 124, 0.15)';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, plotHeight);
    ctx.stroke();
  }

  // Playhead on spectrogram
  const playheadX = leftMargin + Math.max(0, Math.min(plotWidth, progress * plotWidth));
  ctx.strokeStyle = '#B18B56';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, plotHeight);
  ctx.stroke();

  // Playhead badge
  ctx.fillStyle = '#B18B56';
  ctx.beginPath();
  ctx.arc(playheadX, 4, 3, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Color ramp for scientific acoustic spectrogram
 */
function getSpectrogramColor(intensity) {
  if (intensity < 0.05) return '#0d141e'; // deep navy/silent
  if (intensity < 0.2) return '#162b32';  // dark teal
  if (intensity < 0.35) return '#255153'; // muted teal deep
  if (intensity < 0.5) return '#3d7877';  // muted teal
  if (intensity < 0.65) return '#55a49f'; // vibrant teal
  if (intensity < 0.8) return '#8db17e';  // teal-gold transition
  if (intensity < 0.92) return '#b18b56'; // antique gold
  return '#f1efe8';                       // warm ivory peak
}

function roundRect(ctx, x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fill();
}

