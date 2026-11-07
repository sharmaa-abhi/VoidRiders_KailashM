# Task 4 Brief: Anti-Slop UI Overhaul & Command Console Polish

## Target Files
- Modify: `frontend/src/components/DecisionSupport.jsx`
- Modify: `frontend/src/components/ForensicsPanel.jsx`
- Modify: `frontend/src/components/CallQueue.jsx`
- Modify: `frontend/src/components/Header.jsx`
- Modify: `frontend/src/services/caseDb.js`

## Requirements
1. **DecisionSupport.jsx Polish:**
   - Add **Golden Hour Countdown Clock**: 60-minute countdown displaying remaining time and estimated mule dispersion risk (e.g., Tier 1 Mule: 92% recovery vs Tier 2 Multi-Hop: 45%).
   - Add **Attack Stage Visual Stepper**: 4 stages (Impersonation -> Coercion -> Infiltration -> Liquidation) with current active stage highlighted.
   - Add **Live Operator De-escalation Teleprompter**: Shows dynamic suggested script based on caller's dominant emotion and detected coercion vector.
   - Remove card soup and use flat hairline borders (`border-slate-800`).

2. **ForensicsPanel.jsx Polish:**
   - Add **Extracted Cybercrime Entities Board**: Displays interactive chips for Amount, Mule UPI ID, Bank UTR, and Remote APK Session with 1-click action buttons (`Copy UTR`, `Flag Mule`, `Kill APK`).
   - Add **Urgency Math Breakdown pill**: Displays exact composition (e.g., *60% Vocal Strain + 40% Extortion Threats*).
   - Clean up spacing and improve contrast.

3. **CallQueue.jsx & Header.jsx Polish:**
   - Streamline Call Queue rows: High-density list with attack stage badges, elapsed time, and urgency pills.
   - Header: Add global Golden Hour countdown badge and clean status telemetry.

4. **SHA-256 Section 65B Evidence Seal in `caseDb.js`:**
   - Implement `generateEvidenceSha256(casePayload)` using `crypto.subtle.digest('SHA-256', ...)`.
   - Embed Section 65B Indian Evidence Act certification banner in both Markdown and JSON exports with the computed cryptographic hash.

## Report Contract
Write report to: `docs/superpowers/plans/task-4-report.md`.
