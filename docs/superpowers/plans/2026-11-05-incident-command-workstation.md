# VECNA-Pulse 1930 Incident Command Workstation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform VECNA-Pulse into a real, workable 1930 Cybercrime Incident Command Workstation with synchronized vocal biomarker pitch canvas, scam attack-stage tracking, live financial entity extraction, simulated NPCI banking freeze gateway, and a clean, high-density command UI.

**Architecture:** Dual-stack client-server model. Core forensic intelligence (entity extraction, scam stages, Hinglish phrases, pitch canvas, simulated NPCI gateway) is implemented in client-side JavaScript for zero-crash offline/static demo resilience, and mirrored in the FastAPI backend for complete API contract compliance.

**Tech Stack:** React 18, Vite, Tailwind CSS, Lucide Icons, HTML5 Canvas, Web Audio API, FastAPI, Python 3.12, librosa.

## Global Constraints
- Zero-crash fallback: app must operate 100% offline in browser without active backend.
- Anti-slop UI: no nested card soup, hairline dividers (`border-slate-800`), obsidian command palette (`#080c14`).
- Maintain Responsible AI Statutory Guardrail (`indicative_disclaimer`) on all views.
- Section 65B Indian Evidence Act SHA-256 tamper-evident export seal.
- Commit wisely: do not flood git commits; do not push to remote until explicitly instructed.

---

### Task 1: Entity Extraction, Hinglish Lexicon & Attack Stage Engine

**Files:**
- Modify: `frontend/src/services/clientSerEngine.js`
- Modify: `backend/app/triage_agent.py`
- Modify: `frontend/src/mockData.js`

**Interfaces:**
- Consumes: Raw transcript string, acoustic biomarkers, emotion probabilities.
- Produces: `extracted_entities`: `{ amount, mule_upi, utr_number, remote_apk, impersonated_agency, caller_phone }`, `scam_stage`: `{ stage_number, stage_name, stage_desc, next_action }`, `hinglish_keywords`: `string[]`.

- [ ] **Step 1: Implement entity extraction and scam stage classifier in `clientSerEngine.js`**
  Add regex patterns for Indian financial entities (amount, UPI, 12-digit UTR, AnyDesk/TeamViewer/RustDesk sessions, agencies like CBI/Customs/TRAI/Mumbai Police). Add `detectScamAttackStage()` and Hinglish phrase matching (*"paise kat gaye"*, *"digital arrest"*, *"screen share"*).
- [ ] **Step 2: Mirror entity extraction and Hinglish keywords in `backend/app/triage_agent.py`**
  Update `detect_threat_keywords()` and `generate_triage_insights()` to return `extracted_entities` and `scam_stage` in `TriagePayload`.
- [ ] **Step 3: Enrich scenario presets in `frontend/src/mockData.js`**
  Add pre-extracted entity models and attack stages to all 4 default cybercrime scenarios (Digital Arrest, UPI Remote Drain, Sextortion, Mule Informant).
- [ ] **Step 4: Verify entity extraction in Node environment**
  Verify that passing sample cybercrime transcripts extracts amount (₹45,000), UPI (`police.cbi@sbi`), UTR (`2026-9812-4112`), and stage.

---

### Task 2: Real-Time Pitch-Contour & Tremor Canvas Component

**Files:**
- Create: `frontend/src/components/PitchContourCanvas.jsx`
- Modify: `frontend/src/components/ForensicsPanel.jsx`

**Interfaces:**
- Consumes: `timelineSegments: Array<{start_sec, end_sec, urgency, emotion}>`, `biomarkers: {pitch_hz, jitter_tremor_pct}`, `currentTime: number`, `duration: number`, `isPlaying: boolean`.
- Produces: HTML5 dynamic canvas rendering $F_0$ pitch line curve, micro-tremor jitter pulses, time grid, and playhead cursor.

- [ ] **Step 1: Create `PitchContourCanvas.jsx`**
  Build canvas component drawing:
  - Dark grid with frequency markers (100 Hz, 200 Hz, 300 Hz, 400 Hz) and time marks.
  - Smooth Bezier curve representing fundamental pitch ($F_0$) over time.
  - Orange/rose tremor pulse dots where jitter exceeds 2.8%.
  - Synchronized vertical scan cursor linked to audio playback `currentTime`.
- [ ] **Step 2: Integrate `PitchContourCanvas` into `ForensicsPanel.jsx`**
  Replace repetitive card elements with the pitch canvas as the visual centerpiece. Connect `audioPlaybackSec` and `audioDurationSec` to canvas playhead.
- [ ] **Step 3: Verify canvas rendering in browser**
  Ensure play/pause moves the cursor smoothly and pitch values scale accurately.

---

### Task 3: Simulated NPCI / Bank Rapid Freeze Gateway Modal

**Files:**
- Create: `frontend/src/components/BankFreezeModal.jsx`
- Modify: `frontend/src/components/DecisionSupport.jsx`

**Interfaces:**
- Consumes: `isOpen: boolean`, `onClose: () => void`, `ticketDraft: object`, `extractedEntities: object`.
- Produces: `onConfirmFreeze: (freezeRecord) => void` updating call docket with confirmed bank lien token.

- [ ] **Step 1: Build `BankFreezeModal.jsx`**
  Create an animated terminal-style modal:
  - Step 1 (0.4s): Connecting to NPCI Central Fraud Management Switch (CFMS)...
  - Step 2 (0.8s): Querying Beneficiary Bank IFSC / UPI Switch...
  - Step 3 (1.2s): Mule Account identified; applying administrative lien under Section 102 CrPC / 1930 Directive...
  - Step 4 (1.5s): LIEN PLACED: ₹Hold Confirmed. Generate Token ID `NCRP-FRZ-XXXX`.
  - Action buttons: "Print Docket", "Copy Token", "Close".
- [ ] **Step 2: Connect `BankFreezeModal` in `DecisionSupport.jsx`**
  Bind the "Dispatch 1930 Freeze Directive" button to trigger `BankFreezeModal`, automatically feeding extracted UTR, Amount, and Mule Account into the freeze sequence.

---

### Task 4: Anti-Slop UI Overhaul & Command Console Polish

**Files:**
- Modify: `frontend/src/components/DecisionSupport.jsx`
- Modify: `frontend/src/components/ForensicsPanel.jsx`
- Modify: `frontend/src/components/CallQueue.jsx`
- Modify: `frontend/src/components/Header.jsx`
- Modify: `frontend/src/services/caseDb.js`

**Interfaces:**
- Consumes: All updated state and components.
- Produces: Polished, unified 3-column Incident Command Workstation with Golden Hour timer, De-escalation Teleprompter, Extracted Entities Board, and SHA-256 Section 65B dossier export.

- [ ] **Step 1: Upgrade `DecisionSupport.jsx`**
  - Add **Golden Hour Countdown Clock** with real-time fund dispersion risk gauge.
  - Add **Scam Modus Operandi (MO) Attack Stage Stepper** (4 stages with active stage highlight).
  - Add **Live Operator De-escalation Teleprompter** (calming advice tailored to caller distress).
  - Clean styling: remove card soup, use crisp hairline borders.
- [ ] **Step 2: Upgrade `ForensicsPanel.jsx`**
  - Add **Extracted Cybercrime Entities Board** with 1-click action buttons (Copy UTR, Flag Mule, Kill APK).
  - Add **Urgency Math Breakdown pill** (e.g. *60% Acoustic Strain [Pitch +45Hz] + 40% Extortion Threat*).
  - Streamline layout with high information density.
- [ ] **Step 3: Upgrade `CallQueue.jsx` & `Header.jsx`**
  - Modernize queue rows with compact status badges, elapsed timer, and clean selection indicators.
  - Header: Add global Golden Hour remaining badge and crisp status indicator.
- [ ] **Step 4: Implement SHA-256 Section 65B Evidence Seal in `caseDb.js` and dossier export**
  Generate browser-native `crypto.subtle.digest('SHA-256', ...)` hash of case evidence and attach official Section 65B forensic verification header to exports.

---

### Task 5: End-to-End Verification & Smoke Test

**Files:**
- Test: Frontend build & execution check
- Test: Offline simulation test

- [ ] **Step 1: Test scenario playback & pitch canvas synchronization**
  Verify audio synthesis plays scenario lines while the pitch canvas draws the waveform curve and tracking cursor.
- [ ] **Step 2: Test 1930 Freeze Gateway simulation**
  Click "Dispatch 1930 Freeze Directive", verify animated bank lien steps, and check token generation.
- [ ] **Step 3: Test dossier export with SHA-256 seal**
  Export case dossier and verify the cryptographic hash and legal Section 65B certificate are formatted properly.
- [ ] **Step 4: Final commit of the polished workstation**
  Commit the complete feature set cleanly to git.
