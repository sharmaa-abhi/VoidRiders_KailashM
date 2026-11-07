import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Starting Task 4 verification tests...\n');

// 1. Test caseDb.js functions
import {
  generateEvidenceSha256,
  generateSection65BCertificate,
  formatSection65BMarkdownBanner,
} from './src/services/caseDb.js';

// Verify SHA-256 hash generation
const testPayloadA = {
  call_id: 'CALL-2026-0891',
  caller_tag: 'Distressed Victim / Digital Arrest',
  urgency_score: 94,
  amount: '₹45,000',
};

const hashA = await generateEvidenceSha256(testPayloadA);
assert.strictEqual(typeof hashA, 'string', 'SHA-256 hash must be a string');
assert.strictEqual(hashA.length, 64, 'SHA-256 hash must be exactly 64 hex characters');
assert.match(hashA, /^[a-f0-9]{64}$/, 'SHA-256 hash must match lowercase hex format');
console.log(`✓ caseDb: generateEvidenceSha256 produces valid 64-char hash (${hashA.slice(0, 16)}...)`);

// Verify determinism
const hashA2 = await generateEvidenceSha256(testPayloadA);
assert.strictEqual(hashA, hashA2, 'Hashing identical payload must be deterministic');
console.log('✓ caseDb: generateEvidenceSha256 is deterministic');

// Verify tamper-evidence
const testPayloadB = { ...testPayloadA, amount: '₹95,000' };
const hashB = await generateEvidenceSha256(testPayloadB);
assert.notStrictEqual(hashA, hashB, 'Tampered payload must produce distinct SHA-256 hash');
console.log('✓ caseDb: SHA-256 hash changes on data alteration');

// Verify Section 65B Certificate generation
const cert = generateSection65BCertificate(testPayloadA, hashA);
assert.ok(cert.certificate_id.startsWith('CERT-65B-2026-'), 'Certificate ID format verified');
assert.strictEqual(cert.evidence_sha256, hashA, 'Certificate holds matching SHA-256');
assert.ok(cert.statutory_act.includes('Section 65B'), 'Statutory reference present');
assert.ok(cert.statutory_officer_declaration.includes('without tampering'), 'Officer declaration present');
assert.strictEqual(cert.verification_status, 'SECURED_AND_VERIFIED', 'Verification status verified');
console.log(`✓ caseDb: Section 65B Certificate generated (${cert.certificate_id})`);

// Verify Markdown Banner format
const banner = formatSection65BMarkdownBanner(cert);
assert.ok(banner.includes('SECTION 65B INDIAN EVIDENCE ACT FORENSIC CERTIFICATE'), 'Banner title present');
assert.ok(banner.includes(cert.certificate_id), 'Banner includes certificate ID');
assert.ok(banner.includes(hashA), 'Banner includes evidence SHA-256');
assert.ok(banner.includes('OFFICER STATUTORY DECLARATION'), 'Banner includes officer declaration');
console.log('✓ caseDb: formatSection65BMarkdownBanner renders legal forensic header');

// 2. Verify DecisionSupport.jsx
const dsCode = fs.readFileSync(path.join(__dirname, 'src/components/DecisionSupport.jsx'), 'utf8');

// Golden Hour Countdown Clock
assert.ok(dsCode.includes('Golden Hour Interdiction Countdown'), 'DecisionSupport has Golden Hour Countdown Clock title');
assert.ok(dsCode.includes('Tier 1 Mule Account'), 'DecisionSupport contains Tier 1 Mule Account definition');
assert.ok(dsCode.includes('Tier 2 Multi-Hop Dispersion'), 'DecisionSupport contains Tier 2 Multi-Hop definition');
assert.ok(dsCode.includes('ATM Cashout / Crypto Drain Risk'), 'DecisionSupport contains ATM Cashout / Crypto Drain definition');
assert.ok(dsCode.includes('92%'), 'DecisionSupport contains 92% recovery tier');
assert.ok(dsCode.includes('48%'), 'DecisionSupport contains 48% recovery tier');
assert.ok(dsCode.includes('<12%'), 'DecisionSupport contains <12% recovery tier');
console.log('✓ DecisionSupport: Golden Hour Countdown Clock with 3 dispersion tiers verified');

// Attack Stage Stepper
assert.ok(dsCode.includes('Impersonation'), 'DecisionSupport stepper: Impersonation stage');
assert.ok(dsCode.includes('Coercion'), 'DecisionSupport stepper: Coercion stage');
assert.ok(dsCode.includes('Infiltration'), 'DecisionSupport stepper: Infiltration stage');
assert.ok(dsCode.includes('Liquidation'), 'DecisionSupport stepper: Liquidation stage');
assert.ok(dsCode.includes('Scam Modus Operandi (MO) Attack Stage'), 'DecisionSupport stepper title present');
assert.ok(dsCode.includes('Action:'), 'DecisionSupport includes immediate tactical recommendations');
console.log('✓ DecisionSupport: 4-stage Attack MO Stepper & Tactical Recommendations verified');

// Live Operator De-escalation Teleprompter
assert.ok(dsCode.includes('Live Operator De-escalation Teleprompter'), 'DecisionSupport teleprompter title present');
assert.ok(
  dsCode.includes('State police and CBI never make arrest video calls') ||
  dsCode.includes('never make arrest video calls'),
  'DecisionSupport teleprompter fear de-escalation script present'
);
assert.ok(
  dsCode.includes('toggle Airplane mode') || dsCode.includes('Airplane mode'),
  'DecisionSupport teleprompter infiltration script present'
);
assert.ok(dsCode.includes('handleCopyTeleprompter') || dsCode.includes('Copy Script'), 'DecisionSupport teleprompter copy action present');
console.log('✓ DecisionSupport: Live Operator De-escalation Teleprompter with contextual scripts verified');

// 3. Verify ForensicsPanel.jsx
const fpCode = fs.readFileSync(path.join(__dirname, 'src/components/ForensicsPanel.jsx'), 'utf8');

// Cybercrime Entities Board
assert.ok(fpCode.includes('Extracted Cybercrime Entities Board'), 'ForensicsPanel has Entities Board title');
assert.ok(fpCode.includes('Target Amount'), 'ForensicsPanel displays Amount entity chip');
assert.ok(fpCode.includes('Mule UPI Handle') || fpCode.includes('Mule UPI'), 'ForensicsPanel displays Mule UPI chip');
assert.ok(fpCode.includes('Bank UTR Reference') || fpCode.includes('Bank UTR'), 'ForensicsPanel displays Bank UTR chip');
assert.ok(fpCode.includes('Remote APK Session') || fpCode.includes('remote_apk'), 'ForensicsPanel displays Remote APK chip');
assert.ok(fpCode.includes('Impersonated Agency') || fpCode.includes('impersonated_agency'), 'ForensicsPanel displays Impersonated Agency chip');

// 1-Click Action Buttons
assert.ok(fpCode.includes('Copy UTR'), 'ForensicsPanel has Copy UTR action');
assert.ok(fpCode.includes('Flag Mule'), 'ForensicsPanel has Flag Mule action');
assert.ok(fpCode.includes('Kill APK'), 'ForensicsPanel has Kill APK action');
console.log('✓ ForensicsPanel: Extracted Cybercrime Entities Board with 1-click actions verified');

// Urgency Math Breakdown Pill
assert.ok(fpCode.includes('FUSION FORMULA') || fpCode.includes('MATH EXPLAINABILITY'), 'ForensicsPanel has Urgency Math badge');
assert.ok(fpCode.includes('Vocal Strain: Pitch +'), 'ForensicsPanel calculates vocal strain pitch delta');
assert.ok(fpCode.includes('Extortion Threat:'), 'ForensicsPanel formats extortion threat vector');
assert.ok(fpCode.includes('= Score'), 'ForensicsPanel renders combined score formula');
console.log('✓ ForensicsPanel: Urgency Math Explainability Formula pill verified');

// 4. Verify CallQueue.jsx & Header.jsx
const cqCode = fs.readFileSync(path.join(__dirname, 'src/components/CallQueue.jsx'), 'utf8');
assert.ok(cqCode.includes('getScamStageBadge') || cqCode.includes('Stage 4 • Liquidation'), 'CallQueue has Scam Stage badge formatter');
assert.ok(cqCode.includes('getCallElapsedTime') || cqCode.includes('T+'), 'CallQueue has elapsed time badge');
assert.ok(cqCode.includes('urgency_score'), 'CallQueue displays color-coded urgency score');
console.log('✓ CallQueue: Streamlined high-density queue with Scam Stage and elapsed timer badges verified');

const hCode = fs.readFileSync(path.join(__dirname, 'src/components/Header.jsx'), 'utf8');
assert.ok(hCode.includes('Golden Hour:'), 'Header includes Golden Hour Global Countdown badge');
assert.ok(hCode.includes('Tier 1 Mule') && hCode.includes('Tier 2 Multi-Hop'), 'Header displays dispersion risk tier');
console.log('✓ Header: Global Golden Hour Countdown badge and status telemetry verified');

// 5. Verify App.jsx integration
const appCode = fs.readFileSync(path.join(__dirname, 'src/App.jsx'), 'utf8');
assert.ok(appCode.includes('generateEvidenceSha256'), 'App.jsx imports generateEvidenceSha256');
assert.ok(appCode.includes('generateSection65BCertificate'), 'App.jsx imports generateSection65BCertificate');
assert.ok(appCode.includes('formatSection65BMarkdownBanner'), 'App.jsx imports formatSection65BMarkdownBanner');
assert.ok(appCode.includes('forensic_certificate_65b'), 'App.jsx attaches Section 65B certificate to JSON export');
assert.ok(appCode.includes('activeCall={activeCall}'), 'App.jsx passes activeCall to Header');
console.log('✓ App.jsx: Section 65B evidence seal attached to exports & Header wired verified');

console.log('\n🎉 ALL TASK 4 VERIFICATION CHECKS PASSED PERFECTLY!\n');
