# Task 2 Brief: Real-Time Pitch-Contour & Tremor Canvas Component

## Target Files
- Create: `frontend/src/components/PitchContourCanvas.jsx`
- Modify: `frontend/src/components/ForensicsPanel.jsx`

## Requirements
1. **HTML5 Pitch-Contour Canvas (`PitchContourCanvas.jsx`):**
   - Renders a clean, high-density audio waveform / pitch ($F_0$) contour canvas (measuring 100% width $\times$ 90-100px height).
   - Draws dark hairline frequency gridlines (100 Hz, 200 Hz, 300 Hz, 400 Hz) with subtle labels (`font-mono text-[9px]`).
   - Draws the fundamental frequency ($F_0$) pitch curve in cyan (`#06b6d4`) with subtle area gradient below.
   - Maps timeline segments dynamically or uses pitch variation formula based on `timeline_segments` and `biomarkers.pitch_hz`.
   - Plots distinct micro-tremor jitter pulse indicators (amber/rose dots) where jitter exceeds 2.8%.
   - Renders a synchronized playhead vertical scanline tracking `currentTime / duration`.
   - Handles mouse scrub / click to seek along the audio timeline.

2. **Integration in `ForensicsPanel.jsx`:**
   - Integrate `<PitchContourCanvas />` right under the playback scrubber bar as the visual hero element.
   - Pass `timelineSegments`, `biomarkers`, `currentTime={audioPlaybackSec}`, `duration={audioDurationSec}`, `isPlaying={isPlayingAudio}`, and `onSeek={handleSeek}`.
   - Clean up existing frequency bar clutter so the pitch contour is the primary acoustic visualization.

## Report Contract
Write report to: `docs/superpowers/plans/task-2-report.md`.
