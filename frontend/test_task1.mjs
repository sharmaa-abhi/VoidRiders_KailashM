import assert from 'node:assert';
import {
  extractCyberEntities,
  detectScamAttackStage,
  clientDetectThreats,
  clientRedactPii,
  analyzeAudioClientSide,
} from './src/services/clientSerEngine.js';
import { FALLBACK_SCENARIOS, INDICATIVE_DISCLAIMER } from './src/mockData.js';

console.log('--- RUNNING TASK 1 TEST SUITE ---');

// Test 1: Hinglish Keyword Detection
console.log('[Test 1] Hinglish & Indic cybercrime phrase detection...');
const hinglishText =
  'paise kat gaye aur paise deduct ho gaye. digital arrest bol rahe hain aur police bol rahi hai. ' +
  'screen share karwaya app download karne ko bola. otp bataya tha aur otp maang rahe hain. ' +
  'video call band mat karo! FedEx and CBI also mentioned.';
const detectedKw = clientDetectThreats(hinglishText);
const requiredKw = [
  'paise kat gaye',
  'paise deduct ho gaye',
  'digital arrest bol rahe hain',
  'police bol rahi hai',
  'screen share karwaya',
  'app download karne ko bola',
  'otp bataya tha',
  'otp maang rahe hain',
  'video call band mat karo',
  'fedex',
  'cbi',
];
for (const kw of requiredKw) {
  assert(
    detectedKw.includes(kw),
    `Expected keyword "${kw}" to be detected in text`
  );
}
console.log('✓ All 11 cyber threat keywords correctly detected.');

// Test 2: Entity Extraction
console.log('[Test 2] Entity Extraction across diverse cybercrime formats...');
const s1Text =
  'Someone claiming CBI Mumbai made me transfer ₹45,000 to mule UPI cbi.officer.desk@sbi with transaction UTR-2026-9812-4112 from phone +91 98721 04912';
const e1 = extractCyberEntities(s1Text);
assert.strictEqual(e1.amount, '₹45,000');
assert.strictEqual(e1.mule_upi, 'cbi.officer.desk@sbi');
assert.strictEqual(e1.utr_number, 'UTR-2026-9812-4112');
assert.strictEqual(e1.impersonated_agency, 'CBI');
assert.strictEqual(e1.caller_phone, '+91 98721 04912');
console.log('✓ Scenario 1 entities extracted correctly:', e1);

const s2Text =
  'Caller asked me to install AnyDesk (Session: 948 219 042) QuickSupport APK. paise deduct ho gaye ₹1,20,000!';
const e2 = extractCyberEntities(s2Text);
assert.strictEqual(e2.amount, '₹1,20,000');
assert.strictEqual(e2.remote_apk, 'AnyDesk (Session: 948 219 042)');
console.log('✓ Scenario 2 entities extracted correctly:', e2);

const s3Text =
  'Threatening to leak video unless I pay ₹25,000 extortion money. Demanding video call!';
const e3 = extractCyberEntities(s3Text);
assert.strictEqual(e3.amount, '₹25,000');
console.log('✓ Scenario 3 entities extracted correctly:', e3);

const s4Text =
  'Renting out bank accounts, stolen funds routed via mule UPI mule.fastpay@icici exceeding ₹5,00,000';
const e4 = extractCyberEntities(s4Text);
assert.strictEqual(e4.amount, '₹5,00,000');
assert.strictEqual(e4.mule_upi, 'mule.fastpay@icici');
console.log('✓ Scenario 4 entities extracted correctly:', e4);

// Test 3: Attack Stage Classifier
console.log('[Test 3] Scam Attack Stage Engine (Stages 1-4)...');
// Stage 1: Authority Impersonation
const stage1 = detectScamAttackStage(
  'Calling from TRAI and Customs Department regarding your passport.',
  ['trai', 'customs'],
  extractCyberEntities('Calling from TRAI and Customs Department regarding your passport.')
);
assert.strictEqual(stage1.stage_number, 1);
assert.strictEqual(stage1.stage_name, 'AUTHORITY IMPERSONATION');
console.log('✓ Stage 1 (AUTHORITY IMPERSONATION) classified correctly.');

// Stage 2: Digital Coercion
const stage2 = detectScamAttackStage(
  s3Text,
  clientDetectThreats(s3Text),
  e3
);
assert.strictEqual(stage2.stage_number, 2);
assert.strictEqual(stage2.stage_name, 'DIGITAL COERCION');
console.log('✓ Stage 2 (DIGITAL COERCION) classified correctly.');

// Stage 3: Device Infiltration
const stage3 = detectScamAttackStage(
  s2Text,
  clientDetectThreats(s2Text),
  e2
);
assert.strictEqual(stage3.stage_number, 3);
assert.strictEqual(stage3.stage_name, 'DEVICE INFILTRATION');
console.log('✓ Stage 3 (DEVICE INFILTRATION) classified correctly.');

// Stage 4: Asset Liquidation
const stage4 = detectScamAttackStage(
  s1Text,
  clientDetectThreats(s1Text),
  e1
);
assert.strictEqual(stage4.stage_number, 4);
assert.strictEqual(stage4.stage_name, 'ASSET LIQUIDATION');
console.log('✓ Stage 4 (ASSET LIQUIDATION) classified correctly.');

// Test 4: Mock Data Fallback Scenarios validation
console.log('[Test 4] Validating FALLBACK_SCENARIOS schema & values...');
assert.strictEqual(FALLBACK_SCENARIOS.length, 4);

// Scenario 1: Digital Arrest
const sc1 = FALLBACK_SCENARIOS.find((s) => s.call_id === 'CALL-2026-0891');
assert(sc1, 'CALL-2026-0891 scenario exists');
assert.strictEqual(sc1.extracted_entities.amount, '₹45,000');
assert.strictEqual(sc1.extracted_entities.mule_upi, 'cbi.officer.desk@sbi');
assert.strictEqual(sc1.extracted_entities.utr_number, 'UTR-2026-9812-4112');
assert.strictEqual(sc1.scam_stage.stage_number, 4);
assert.strictEqual(sc1.scam_stage.stage_name, 'ASSET LIQUIDATION');
assert.strictEqual(sc1.triage_insights.extracted_entities.amount, '₹45,000');
assert.strictEqual(sc1.triage_insights.scam_stage.stage_number, 4);

// Scenario 2: Remote APK Takeover
const sc2 = FALLBACK_SCENARIOS.find((s) => s.call_id === 'CALL-2026-0892');
assert(sc2, 'CALL-2026-0892 scenario exists');
assert.strictEqual(sc2.extracted_entities.amount, '₹1,20,000');
assert.strictEqual(sc2.extracted_entities.remote_apk, 'AnyDesk (Session: 948 219 042)');
assert.strictEqual(sc2.scam_stage.stage_number, 3);
assert.strictEqual(sc2.scam_stage.stage_name, 'DEVICE INFILTRATION');

// Scenario 3: Sextortion Threat
const sc3 = FALLBACK_SCENARIOS.find((s) => s.call_id === 'CALL-2026-0893');
assert(sc3, 'CALL-2026-0893 scenario exists');
assert.strictEqual(sc3.extracted_entities.amount, '₹25,000');
assert.strictEqual(sc3.scam_stage.stage_number, 2);
assert.strictEqual(sc3.scam_stage.stage_name, 'DIGITAL COERCION');

// Scenario 4: Mule Informant
const sc4 = FALLBACK_SCENARIOS.find((s) => s.call_id === 'CALL-2026-0894');
assert(sc4, 'CALL-2026-0894 scenario exists');
assert.strictEqual(sc4.extracted_entities.mule_upi, 'mule.fastpay@icici');
assert.strictEqual(sc4.scam_stage.stage_number, 4);
assert.strictEqual(sc4.scam_stage.stage_name, 'ASSET LIQUIDATION');

console.log('✓ All 4 fallback scenarios match the brief requirements.');

// Test 5: analyzeAudioClientSide
console.log('[Test 5] Validating analyzeAudioClientSide client-side output...');
const fakeBuffer = new Float32Array(16000 * 3); // 3 seconds
for (let i = 0; i < fakeBuffer.length; i++) {
  fakeBuffer[i] = Math.sin((2 * Math.PI * 250 * i) / 16000) * 0.5;
}
const clientResult = await analyzeAudioClientSide(fakeBuffer, 16000, s1Text);
assert(clientResult.extracted_entities, 'Top-level extracted_entities exists');
assert.strictEqual(clientResult.extracted_entities.amount, '₹45,000');
assert(clientResult.scam_stage, 'Top-level scam_stage exists');
assert.strictEqual(clientResult.scam_stage.stage_number, 4);
assert(clientResult.triage_insights.extracted_entities, 'triage_insights extracted_entities exists');
assert(clientResult.triage_insights.scam_stage, 'triage_insights scam_stage exists');
console.log('✓ analyzeAudioClientSide output contract verified.');

console.log('\n>>> ALL TASK 1 TESTS PASSED SUCCESSFULLY! <<<');
