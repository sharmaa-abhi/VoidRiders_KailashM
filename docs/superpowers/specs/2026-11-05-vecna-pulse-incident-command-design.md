# VECNA-Pulse: Real-Time Cybercrime Incident Command & Vocal Forensics Workstation

**Date:** 2026-11-05  
**Project:** VECNA-Pulse (VECNAVERSE Hackathon — Team VoidRiders)  
**Status:** Approved for Implementation  
**Goal:** Transform the prototype into an authentic, workable 1930 Cybercrime Incident Command Workstation with real-time vocal biomarker canvas, scam attack-stage tracking, live entity extraction, simulated NPCI banking freeze gateway, and clean, high-density incident response UI.

---

## 1. Problem Context & The Cybercrime "Golden Hour"

When Indian citizens fall victim to digital arrest extortion, unauthorized UPI drains, or remote APK hijacks (AnyDesk, TeamViewer), the first 60 minutes (**"The Golden Hour"**) dictate whether funds can be frozen before leaving the domestic banking system. 

Emergency 1930 operators face three operational bottlenecks:
1. **Severe Caller Panic & Distraction:** Victims are screaming, crying, or whispering under active coercion by scammers on a parallel video call.
2. **Entity Hunting Under Pressure:** Operators lose critical minutes attempting to extract 12-digit bank UTRs, beneficiary UPI IDs, and fraudulent APK sessions from frantic speech.
3. **Delayed Bank Interdiction:** Lack of instant feedback on whether the destination mule account has been encumbered.

VECNA-Pulse solves this by combining **Real-Time Speech Emotion Recognition (SER)** via acoustic biomarkers ($F_0$ pitch, cycle-to-cycle jitter tremor %, speech cadence, and energy) with **Scam Modus Operandi (MO) Stage Tracking**, **Automated Entity Extraction**, and a **Simulated NPCI / Bank Rapid Freeze Gateway**.

---

## 2. Anti-Slop UI & Layout Specification

### 2.1 Aesthetic Principles
* **Eliminate Nested Card Soup:** Remove repetitive rounded boxes inside rounded boxes. Use flat, hairline borders (`border-slate-800`), disciplined padding, and high information density.
* **Palette:**
  * Background: `#080c14` (Deep Command Obsidian)
  * Surface: `#0e1422` / Panel headers `#131b2c`
  * Hairline Dividers: `#1e293b` / Active elements `#2a3854`
  * Telemetry Accents:
    * Cyan (`#06b6d4`): Real-time audio pitch ($F_0$) & acoustic metrics
    * Amber (`#f59e0b`): Warning / APK Infiltration / Jitter tremor
    * Rose (`#f43f5e`): Severe panic / Critical extortion
    * Emerald (`#10b981`): Bank lien confirmation & Section 65B seal
* **Typography:** Clean system sans-serif for UI labels, strictly paired with monospace (`font-mono`) for UTRs, UPI handles, pitch values, and timestamps.

### 2.2 Three-Column Command Grid
* **Header:** Workstation identity, Golden Hour Global Timer, Live Surge Indicator, Hardware Profile badge, and Demo Mode toggle.
* **Left Column (22% width): Multi-Call Priority Queue (`CallQueue.jsx`)**
  * Displays active incoming emergency calls sorted descending by Urgency Score (0–100).
  * Shows Call ID, Scam Category tag, elapsed call time, and color-coded urgency badge.
* **Center Column (48% width): Vocal Forensics & Scam Anatomy (`ForensicsPanel.jsx`)**
  * Mode Switcher: `.wav` Upload, Live Mic (Web Audio API), Scenarios.
  * **Interactive Pitch-Contour & Tremor Canvas:** HTML5 Canvas rendering fundamental frequency ($F_0$) pitch curve with synchronized audio playback cursor.
  * **Extracted Incident Entity Board:** Interactive chips for Amount, Mule UPI ID, Bank UTR, and APK Session ID with 1-click action buttons.
  * **Transcript Box:** PII masked pills (`[REDACTED-PHONE]`, `[REDACTED-Aadhaar]`, `[REDACTED-OTP]`, `[REDACTED-ACCT]`) and highlighted threat keywords.
* **Right Column (30% width): Incident Command & Dispatch (`DecisionSupport.jsx`)**
  * **Golden Hour Fund Dissipation Widget:** Real-time countdown clock showing estimated mule account dispersion risk (Tier 1 vs Tier 2/3).
  * **Scam Modus Operandi (MO) Attack Stage Stepper:** Visual 4-stage progression (Authority Impersonation $\rightarrow$ Digital Coercion $\rightarrow$ Device Hijack $\rightarrow$ Asset Liquidation).
  * **Live Operator De-escalation Teleprompter:** Dynamic, context-sensitive scripts to help operators calm the caller.
  * **1930 Bank Rapid Freeze Trigger:** Dispatches simulated instant freeze directive.
  * **Tamper-Evident Dossier Export:** Case export with Section 65B Indian Evidence Act SHA-256 digital certificate.

---

## 3. Detailed Component & Feature Specifications

### 3.1 Real-Time Pitch-Contour & Tremor Canvas
* **Location:** `frontend/src/components/ForensicsPanel.jsx`
* **Implementation:** HTML5 Canvas element measuring 100% width $\times$ 90px height.
* **Data Sources:** 
  * Recorded / Simulated: Pre-computed pitch and jitter slices mapped across timeline segments.
  * Live Mic: Real-time autocorrelation $F_0$ extractor running on Web Audio `AudioWorklet` / `ScriptProcessor` buffer.
* **Visuals:** Dark grid lines, dynamic blue/cyan pitch contour line, vertical playhead tracking `currentTime`, and orange tremor pulse markers when jitter exceeds 3.0%.

### 3.2 Cybercrime Entity Extraction Engine
* **Location:** `frontend/src/services/clientSerEngine.js` & `backend/app/triage_agent.py`
* **Entities Extracted:**
  * `amount`: Regex matching `₹\s?(\d[\d,]+)` or `(\d+)\s*(?:thousand|lakh|rupees|rs)`
  * `mule_upi`: Regex matching `[\w.-]+@(sbi|hdfc|icici|axis|paytm|phonepe|okhdfcbank|okaxis|ybl|apl)`
  * `utr_number`: Regex matching 12-digit numeric sequences or `UTR[-:\s]?([A-Za-z0-9]{12,18})`
  * `remote_apk`: Regex matching `(AnyDesk|TeamViewer|RustDesk|QuickSupport)` with optional session numbers
  * `impersonated_agency`: Regex matching `(CBI|Customs|Narcotics|Mumbai Police|ED|TRAI|FedEx)`
* **Output:** Structured `extracted_entities` dictionary available in the triage payload.

### 3.3 Attack Stage & Scam Modus Operandi (MO) Classifier
* **Stages:**
  1. `IMPERSONATION`: Claiming to be police, customs, or courier.
  2. `COERCION`: Threat of immediate arrest, isolation on video call.
  3. `INFILTRATION`: Demanding screen sharing via AnyDesk/TeamViewer/APK.
  4. `LIQUIDATION`: Demanding money transfer or OTP sharing.
* **Logic:** Evaluates threat keywords and acoustic distress to assign the active stage (1–4) and display recommended immediate counter-measures.

### 3.4 Simulated NPCI / Bank Rapid Freeze Gateway Modal
* **Location:** New component `frontend/src/components/BankFreezeModal.jsx` (invoked from `DecisionSupport.jsx`)
* **Behavior:**
  * Triggered when operator clicks *"Dispatch 1930 Freeze Directive"*.
  * Displays terminal-style animated verification sequence:
    * `T+0.3s`: Routing to NPCI Central Fraud Management System (CFMS)...
    * `T+0.7s`: Querying beneficiary bank switch (State Bank of India)...
    * `T+1.1s`: Target Account `XXXX-XXXX-8912` identified. Placing immediate administrative lien of ₹45,000...
    * `T+1.4s`: LIEN CONFIRMED. Transaction UTR locked. Reversal ticket generated.
  * Provides a printable / copyable **1930 NCRP Freeze Token ID** (`NCRP-FRZ-2026-9921`).

### 3.5 Indic / Hinglish Threat Lexicon
* **Location:** `backend/app/triage_agent.py` & `frontend/src/services/clientSerEngine.js`
* Added Phrases:
  * *"paise kat gaye"* / *"paise deduct ho gaye"* (Asset drain)
  * *"digital arrest bol rahe hain"* / *"police bol rahi hai"* (Coercion)
  * *"screen share karwaya"* / *"app download karne ko bola"* (Remote APK)
  * *"OTP bataya tha"* / *"OTP maang rahe hain"* (Credential compromise)
  * *"video call band mat karo bol rahe hain"* (Isolation)

### 3.6 Cryptographic SHA-256 Courtroom Admissibility Seal
* **Location:** `frontend/src/services/caseDb.js` & `DecisionSupport.jsx`
* Computes standard SHA-256 hex digest of the normalized case payload:
  $$\text{SHA-256}(\text{call\_id} + \text{timestamp} + \text{transcript} + \text{entities} + \text{urgency})$$
* Embeds Section 65B Indian Evidence Act certification banner in both Markdown and JSON exports.

---

## 4. Architectural Boundaries & Data Flow

```
[Audio Input]
      |
      v
[Acoustic DSP / F0 YIN] ------> [Pitch-Contour Canvas]
      |
      v
[Entity & Scam Stage Engine] -> [Extracted Entities Board]
      |                                  |
      v                                  v
[Hybrid Urgency Calculator] ----> [1930 Incident Command]
                                         |
                                         +--> [Simulated NPCI Gateway Modal]
                                         |
                                         +--> [SHA-256 Section 65B Seal]
```

All features are implemented dual-stack:
* Client-Side (Pure JavaScript): Enables 100% functionality on static deployment (Vercel) and during offline demos.
* Server-Side (FastAPI + librosa): Ensures robust backend API contract parity.

---

## 5. Verification Plan

1. **Audio Canvas Verification:** Start scenario / mic playback and verify the canvas draws smooth $F_0$ pitch line with synchronized time cursor.
2. **Entity Board Verification:** Switch between scenarios and verify extracted amount, beneficiary UPI, UTR, and remote app appear cleanly.
3. **NPCI Modal Verification:** Click "Dispatch 1930 Freeze" and confirm the simulated banking gateway opens, executes animated steps, and marks the freeze token as confirmed.
4. **De-escalation Teleprompter Verification:** Verify that high-urgency calls display caller calming advice.
5. **Dossier Export Verification:** Export markdown and confirm the SHA-256 seal and Section 65B certificate header are present.
6. **Clean UI Quality:** Ensure no card-nesting clutter, responsive alignment, and dark command palette consistency.
