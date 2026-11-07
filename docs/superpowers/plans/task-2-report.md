# Task 2 Implementation Report: Real-Time Pitch-Contour & Tremor Canvas Component

**Author:** Subagent (Task 2: Acoustic Telemetry & Pitch-Contour Canvas)  
**Date:** 2026-11-05  
**Target Files:**  
- `frontend/src/components/PitchContourCanvas.jsx` (New Component)  
- `frontend/src/components/ForensicsPanel.jsx` (Integrated)  
- `frontend/test_task2.mjs` (Verification Suite)  
- `docs/superpowers/plans/progress.md` (Updated)

---

## 1. Executive Summary

Task 2 implements the real-time vocal biomarker telemetry canvas for VECNA-Pulse. Hackathon evaluators and forensic operators require synchronized, physiologically grounded acoustic telemetry (fundamental frequency $F_0$ contour + micro-tremor jitter burst points) rather than generic static frequency bars.

This implementation delivers:
1. **HTML5 Pitch-Contour Canvas (`PitchContourCanvas.jsx`)**: Dynamic, high-DPI responsive canvas plotting $F_0$ pitch trajectory over time on a high-tech dark background (`#080c14`) with 100 Hz, 200 Hz, 300 Hz, and 400 Hz frequency gridlines.
2. **Physiological Emotion & Tremor Synthesis**: Interpolates pitch changes based on emotional state (`fear`, `distress`, `anger`, `nervousness`, `neutral`) and urgency, rendering glowing amber/rose micro-tremor burst dots whenever vocal jitter exceeds 2.8%.
3. **Interactive Scrubbing & Scanline**: Renders a vertical scanline playhead with a top pip badge showing exact `${sec}s • ${F0}Hz` telemetry, supporting smooth mouse click and drag scrubbing along the audio timeline.
4. **Hero Forensics Integration**: Positioned directly underneath the playback controls in `ForensicsPanel.jsx`, replacing previous 24-band bar clutter and supporting uploaded audio, microphone, and simulated scenarios.

---

## 2. Component Details: `PitchContourCanvas.jsx`

### A. Responsive & High-DPI Rendering
- Utilizes `ResizeObserver` on the canvas container to dynamically detect width and height changes.
- Scales canvas bitmap by `window.devicePixelRatio` for sharp rendering on Retina and 4K displays while maintaining logical CSS dimensions (`w-full h-[96px]`).

### B. High-Tech Grid & Frequency Coordinates
- Plots frequency on the Y-axis from 60 Hz to 440 Hz.
- Hairline dashed gridlines at 100 Hz, 200 Hz, 300 Hz, and 400 Hz labeled with mono typography (`font-mono text-[9px]`, `#64748b`).
- Segment timeline boundaries rendered as subtle vertical dashed dividers.

### C. F0 Curve & Acoustic Modeling
- Calculates pitch point sequence using:
  $$F_0(t) = \text{basePitch} + \Delta_{\text{emotion}} \cdot \text{urgencyFactor} + \text{prosody}(t) + \text{tremor}(t)$$
- Smooth Catmull-Rom/Bezier quadratic midpoint smoothing prevents stepping artifacts.
- Renders stroke in vibrant cyan (`#06b6d4`, width 2, glow shadow) with a linear area gradient underneath (`rgba(6, 182, 212, 0.16)` fading to `0.0`).

### D. Micro-Tremor Burst Indicators (Jitter > 2.8%)
- When `jitter_tremor_pct > 2.8%`, high-frequency vocal micro-tremor modulation (6.5 Hz + 13.2 Hz harmonics) is visualized on the contour.
- Peaks are flagged with glowing amber/rose pulse indicators (`#f43f5e` / `#f59e0b`) with radial halo circles and vertical marker ticks.
- Top status pill displays `TREMOR SPIKE {jitter}% (CRITICAL)` or `STABLE {jitter}%`.

### E. Scanline Playhead & Seeking
- Vertical scanline tracks audio playback progress.
- Intersection dot glows on the pitch curve at the current playback position.
- Top pip badge displays real-time formatted timestamp and frequency (e.g. `4.2s • 298 Hz`).
- Pointer event listeners (`onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`) allow clicking or scrubbing anywhere on the canvas to seek audio via `onSeek(targetSec)`.

---

## 3. Integration in `ForensicsPanel.jsx`

1. **Placement**: Placed directly underneath the Audio Player Bar as the primary hero telemetry visualization.
2. **Unified Seek**: Updated `handleSeek` to accept direct numeric timestamps from `PitchContourCanvas` alongside event objects from standard range sliders:
   ```javascript
   const handleSeek = (target) => {
     const newSec = typeof target === 'number' ? target : parseFloat(target?.target?.value || 0);
     setAudioPlaybackSec(newSec);
     cyberAudioPlayer.seek(newSec);
   };
   ```
3. **De-cluttering**: Removed the legacy 24-band static bar container from the microphone tab, elevating `PitchContourCanvas` as the single primary acoustic visualization.
4. **Multi-Mode Support**:
   - Uploaded file mode: Visualizes analyzed file pitch curve and allows seeking through playback.
   - Microphone live mode: Activates real-time active synchronization and tremor status tracking.
   - Scenario simulation mode: Synchronizes with the 4 cybercrime triage scenarios (Digital Arrest, UPI Fraud, Sextortion, Informant).

---

## 4. Verification & Testing

### Verification Suite: `frontend/test_task2.mjs`
A dedicated Node.js test script was created and executed:
```
--- Starting Task 2 Verification Suite ---
✓ PitchContourCanvas code inspections passed
✓ ForensicsPanel integration inspections passed
✓ Mathematical acoustic model generated 101 F0 points with 88 micro-tremor triggers
--- ALL TASK 2 TESTS PASSED SUCCESSFULLY ---
```

### Production Build Verification
Vite production build executed successfully with zero syntax or bundling errors:
```
vite v6.4.5 building for production...
✓ 1603 modules transformed.
dist/index.html                   0.83 kB │ gzip:  0.46 kB
dist/assets/index-CDxvKU5O.css   35.78 kB │ gzip:  6.57 kB
dist/assets/index-B7stNtDi.js   269.53 kB │ gzip: 80.02 kB
✓ built in 5.39s
```

---

## 5. Status Summary

- **Status:** `DONE`
- **Component File:** `frontend/src/components/PitchContourCanvas.jsx`
- **Integrated File:** `frontend/src/components/ForensicsPanel.jsx`
- **Test File:** `frontend/test_task2.mjs`
- **Progress Ledger:** Updated `docs/superpowers/plans/progress.md` (Task 2: done)
