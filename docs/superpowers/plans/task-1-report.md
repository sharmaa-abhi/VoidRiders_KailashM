# Task 1 Report: Entity Extraction, Hinglish Lexicon & Attack Stage Engine

## 1. Executive Summary
Task 1 has been implemented and verified for **VECNA-Pulse Real-Time SER & Cybercrime Call Triage Workstation**. The dual-stack client-server architecture has been enriched with:
1. **Financial & Cybercrime Entity Extraction**: Deterministic regex & heuristic parser extracting stolen amount (`₹45,000`), beneficiary mule UPI (`cbi.officer.desk@sbi`, `mule.fastpay@icici`), 12-digit transaction UTR (`UTR-2026-9812-4112`), remote APK / desktop takeover tools & sessions (`AnyDesk (Session: 948 219 042)`), impersonated agencies (`CBI`, `Mumbai Police`, `TRAI`, `FedEx`, `Customs`), and caller contact telephone numbers.
2. **Scam Attack Stage Engine**: Four-tier cybercrime progression classifier mapping incidents to:
   - **Stage 1: AUTHORITY IMPERSONATION** (Claiming to be CBI, Police, TRAI, Customs, FedEx)
   - **Stage 2: DIGITAL COERCION** (Threatening arrest, narcotics parcels, video call isolation, blackmail / sextortion)
   - **Stage 3: DEVICE INFILTRATION** (Screen sharing, AnyDesk, TeamViewer, malicious APK installation)
   - **Stage 4: ASSET LIQUIDATION** (Urgent fund transfer, OTP request, mule routing, golden-hour freeze)
3. **Authentic Hinglish & Indic Threat Lexicon**: Integrated 11+ authentic Hinglish phrases into keyword threat dictionaries across both pure-client DSP and backend agents (*"paise kat gaye"*, *"paise deduct ho gaye"*, *"digital arrest bol rahe hain"*, *"police bol rahi hai"*, *"screen share karwaya"*, *"app download karne ko bola"*, *"otp bataya tha"*, *"otp maang rahe hain"*, *"video call band mat karo"*).
4. **Preset Scenario Enrichment**: Updated all 4 default fallback scenarios in `frontend/src/mockData.js` and `backend/app/mock_generator.py` to embed structured `extracted_entities`, `scam_stage`, and Hinglish keywords at the root level and within `triage_insights`.

---

## 2. File Changes & Interfaces

### 1. `frontend/src/services/clientSerEngine.js`
- **Added Hinglish Phrases to `THREAT_KEYWORDS`**:
  - `paise kat gaye`: 88, `paise deduct ho gaye`: 88
  - `digital arrest bol rahe hain`: 94, `police bol rahi hai`: 80
  - `screen share karwaya`: 85, `app download karne ko bola`: 85
  - `otp bataya tha`: 90, `otp maang rahe hain`: 90
  - `video call band mat karo`: 92
  - `trai`: 80, `mumbai police`: 85, `cyber crime branch`: 85, `fedex`: 75, `narcotics control bureau`: 85
- **Implemented `extractCyberEntities(text)`**:
  - Returns `{ amount, mule_upi, utr_number, remote_apk, impersonated_agency, caller_phone }`.
  - Parses rupee currency variations (`₹`, `Rs.`, `INR`, `Lakh`), UPI IDs excluding email domains, UTR transaction references, remote tools with session IDs, law enforcement agencies, and phone numbers.
- **Implemented `detectScamAttackStage(text, threatKeywords, extractedEntities)`**:
  - Returns `{ stage_number, stage_name, stage_desc, next_action }`.
  - Determines tactical investigative priority:
    - Stage 4: `ASSET LIQUIDATION` (Next Action: 1930 NCRP golden-hour freeze on beneficiary accounts & UTR)
    - Stage 3: `DEVICE INFILTRATION` (Next Action: Disconnect network, enable Airplane Mode, uninstall remote tools)
    - Stage 2: `DIGITAL COERCION` (Next Action: Disconnect scammer call, ensure victim safety, do not pay extortion)
    - Stage 1: `AUTHORITY IMPERSONATION` (Next Action: Advise law enforcement does not arrest over video calls)
- **Updated `analyzeAudioClientSide()`**:
  - Evaluates `extractCyberEntities(rawText)` and `detectScamAttackStage(rawText, keywords, extractedEntities)`.
  - Returns payload with `extracted_entities` and `scam_stage` at the top level and nested within `triage_insights`.

### 2. `backend/app/triage_agent.py`
- Added Hinglish cybercrime phrases to `THREAT_KEYWORDS`.
- Implemented `extract_cyber_entities(text: str) -> Dict[str, Any]` matching JavaScript implementation.
- Implemented `detect_scam_attack_stage(text: str, threat_keywords, extracted_entities) -> Dict[str, Any]`.
- Updated `classify_crime_category()` to recognize Hinglish crime markers.
- Updated `generate_triage_insights()` to return `extracted_entities` and `scam_stage` in `insights`.
- Updated `format_forensic_case_report()` to render Scam Attack Stage and Extracted Cybercrime Entities in the official Markdown Dossier and JSON export packet.

### 3. `backend/app/main.py`
- Updated `/api/analyze-audio` and WebSocket `/ws/live-call` response payloads to expose `extracted_entities` and `scam_stage` at the top level.

### 4. `frontend/src/mockData.js` & `backend/app/mock_generator.py`
- **Scenario 1 (`CALL-2026-0891` - Digital Arrest)**:
  - Amount: `₹45,000`
  - Mule UPI: `cbi.officer.desk@sbi`
  - UTR: `UTR-2026-9812-4112`
  - Impersonated Agency: `CBI`
  - Stage: `4 (ASSET LIQUIDATION)`
- **Scenario 2 (`CALL-2026-0892` - Remote APK Drain)**:
  - Amount: `₹1,20,000`
  - Remote APK: `AnyDesk (Session: 948 219 042)`
  - Stage: `3 (DEVICE INFILTRATION)`
- **Scenario 3 (`CALL-2026-0893` - Sextortion Threat)**:
  - Amount: `₹25,000`
  - Stage: `2 (DIGITAL COERCION)`
- **Scenario 4 (`CALL-2026-0894` - Mule Informant)**:
  - Mule UPI: `mule.fastpay@icici`
  - Amount: `₹5,00,000`
  - Stage: `4 (ASSET LIQUIDATION)`

---

## 3. Verification & Test Evidence

### Test Suite (`frontend/test_task1.mjs`)
Executed using Node.js v24:
```
--- RUNNING TASK 1 TEST SUITE ---
[Test 1] Hinglish & Indic cybercrime phrase detection...
✓ All 11 cyber threat keywords correctly detected.
[Test 2] Entity Extraction across diverse cybercrime formats...
✓ Scenario 1 entities extracted correctly: {
  amount: '₹45,000',
  mule_upi: 'cbi.officer.desk@sbi',
  utr_number: 'UTR-2026-9812-4112',
  remote_apk: null,
  impersonated_agency: 'CBI',
  caller_phone: '+91 98721 04912'
}
✓ Scenario 2 entities extracted correctly: {
  amount: '₹1,20,000',
  mule_upi: null,
  utr_number: null,
  remote_apk: 'AnyDesk (Session: 948 219 042)',
  impersonated_agency: null,
  caller_phone: null
}
✓ Scenario 3 entities extracted correctly: {
  amount: '₹25,000',
  mule_upi: null,
  utr_number: null,
  remote_apk: null,
  impersonated_agency: null,
  caller_phone: null
}
✓ Scenario 4 entities extracted correctly: {
  amount: '₹5,00,000',
  mule_upi: 'mule.fastpay@icici',
  utr_number: null,
  remote_apk: null,
  impersonated_agency: null,
  caller_phone: null
}
[Test 3] Scam Attack Stage Engine (Stages 1-4)...
✓ Stage 1 (AUTHORITY IMPERSONATION) classified correctly.
✓ Stage 2 (DIGITAL COERCION) classified correctly.
✓ Stage 3 (DEVICE INFILTRATION) classified correctly.
✓ Stage 4 (ASSET LIQUIDATION) classified correctly.
[Test 4] Validating FALLBACK_SCENARIOS schema & values...
✓ All 4 fallback scenarios match the brief requirements.
[Test 5] Validating analyzeAudioClientSide client-side output...
✓ analyzeAudioClientSide output contract verified.

>>> ALL TASK 1 TESTS PASSED SUCCESSFULLY! <<<
```

---

## 4. Status
- **Status:** `DONE`
- Ready for Task 2 (Real-Time Pitch-Contour & Tremor Canvas Component).
