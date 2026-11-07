# Task 1 Brief: Entity Extraction, Hinglish Lexicon & Attack Stage Engine

## Target Files
- Modify: `frontend/src/services/clientSerEngine.js`
- Modify: `backend/app/triage_agent.py`
- Modify: `frontend/src/mockData.js`

## Requirements
1. **Entity Extraction:**
   Implement regex and heuristic parsing to extract from transcripts:
   - `amount`: Stolen amount e.g. `₹45,000` or numeric values associated with rupees/INR/transfer.
   - `mule_upi`: Beneficiary UPI ID e.g. `*.cbi@sbi`, `*.police@hdfc`, or standard UPI handles (`@sbi`, `@okaxis`, `@okhdfcbank`, `@paytm`, `@phonepe`).
   - `utr_number`: 12-digit bank reference / UTR number e.g. `UTR-2026-9812-4112` or standalone 12-digit transaction ID.
   - `remote_apk`: Remote access tool e.g. `AnyDesk`, `TeamViewer`, `RustDesk`, `QuickSupport` with optional session ID.
   - `impersonated_agency`: `CBI`, `Mumbai Police`, `Cyber Crime Branch`, `TRAI`, `Customs`, `FedEx`, `Narcotics Control Bureau`.
   - `caller_phone`: Any masked or detected telephone number.

2. **Scam Attack Stage Classifier:**
   Analyze transcript and threat severity to determine the attack stage:
   - Stage 1: `AUTHORITY IMPERSONATION` — Claiming to be police/CBI/TRAI/customs.
   - Stage 2: `DIGITAL COERCION` — Threatening arrest, illegal parcels, demanding video call isolation.
   - Stage 3: `DEVICE INFILTRATION` — Screen share, downloading APK / AnyDesk / TeamViewer.
   - Stage 4: `ASSET LIQUIDATION` — Urgent fund transfer, OTP request, "security verification deposit".

3. **Hinglish & Indic Threat Phrases:**
   Expand cybercrime keywords to support authentic Hinglish phrases:
   - *"paise kat gaye"*, *"paise deduct ho gaye"*, *"digital arrest bol rahe hain"*, *"police bol rahi hai"*, *"screen share karwaya"*, *"app download karne ko bola"*, *"OTP bataya tha"*, *"OTP maang rahe hain"*, *"video call band mat karo"*.

4. **Scenario Presets in `mockData.js`:**
   Enrich the 4 fallback scenarios so each has structured `extracted_entities`, `scam_stage`, and Hinglish keyword support:
   - Scenario 1 (Digital Arrest): Amount `₹45,000`, Mule UPI `cbi.officer.desk@sbi`, UTR `UTR-2026-9812-4112`, Stage 4 (Asset Liquidation).
   - Scenario 2 (Remote APK Drain): Amount `₹1,20,000`, Remote APK `AnyDesk (Session: 948 219 042)`, Stage 3 (Device Infiltration).
   - Scenario 3 (Sextortion Threat): Amount `₹25,000`, Stage 2 (Digital Coercion).
   - Scenario 4 (Mule Informant): Mule UPI `mule.fastpay@icici`, Stage 4 (Asset Liquidation).

## Report Contract
Write report to: `docs/superpowers/plans/task-1-report.md`.
