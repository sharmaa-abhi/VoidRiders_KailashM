import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  FileText,
  RotateCcw,
  Download,
  Zap,
  Save,
  Check,
  Building,
  ClipboardList,
  Copy,
  ExternalLink,
  Clock,
  Headphones,
  ArrowRight,
  AlertTriangle,
  UserCheck,
  Lock,
  Share2
} from 'lucide-react';
import { INDICATIVE_DISCLAIMER } from '../mockData';
import BankFreezeModal from './BankFreezeModal';

export default function DecisionSupport({
  activeCall,
  onProcessVoiceCopilot,
  copilotData,
  isProcessingCopilot,
  onExportReport,
  isExporting,
  onSaveCaseLocally,
  isCaseSaved
}) {
  const [completedActions, setCompletedActions] = useState({});
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [submittedTickets, setSubmittedTickets] = useState({});
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [confirmedFreezes, setConfirmedFreezes] = useState({});
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [goldenSecLeft, setGoldenSecLeft] = useState(48 * 60);

  // Human verification state
  const [verifiedCases, setVerifiedCases] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [caseNotesLog, setCaseNotesLog] = useState([
    {
      id: 1,
      time: '12:04 PM',
      text: 'Incident flagged by queue filter based on acoustic urgency and threat keywords.',
    },
  ]);

  const isCurrentVerified = activeCall && !!verifiedCases[activeCall.call_id];

  // Sync Golden Hour countdown with selected call
  useEffect(() => {
    if (activeCall?.call_id) {
      const initialMins = activeCall.urgency_score > 85 ? 42 : 52;
      setGoldenSecLeft(initialMins * 60);
    }
  }, [activeCall?.call_id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setGoldenSecLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const insights = activeCall?.triage_insights || {
    crime_category: 'General Cyber Incident',
    recommended_actions: [
      'Verify caller safety and establish whether any active financial transfer has occurred.',
      'Instruct caller to hold all outgoing UPI / IMPS transactions immediately.',
      'Log complaint docket on national 1930 / NCRP cybercrime portal.',
    ],
    explainability_summary: 'Pending triage analysis.',
    indicative_disclaimer: INDICATIVE_DISCLAIMER,
  };

  const extractedEntities =
    activeCall?.extracted_entities ||
    activeCall?.triage_insights?.extracted_entities ||
    {};

  const actions = (copilotData && copilotData.updated_actions) || insights.recommended_actions || [];

  const toggleAction = (idx) => {
    if (!activeCall) return;
    const cid = activeCall.call_id;
    setCompletedActions((prev) => ({
      ...prev,
      [cid]: {
        ...(prev[cid] || {}),
        [idx]: !prev[cid]?.[idx],
      },
    }));
  };

  const handleProcessCopilotSubmit = () => {
    if (!dispatchNotes.trim() || isProcessingCopilot) return;
    onProcessVoiceCopilot(dispatchNotes.trim());
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Officer note applied: "${dispatchNotes.trim()}"`,
    };
    setCaseNotesLog((prev) => [newLog, ...prev]);
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleProcessCopilotSubmit();
    }
  };

  // 1930 ticket draft derived from copilot or activeCall entities
  const ticketDraft =
    copilotData?.ncrp_1930_ticket_draft ||
    (extractedEntities?.amount || extractedEntities?.mule_upi
      ? {
          ticket_id: `1930-NCRP-${activeCall?.call_id ? activeCall.call_id.replace(/[^0-9]/g, '') : '2026-0891'}`,
          call_id: activeCall?.call_id,
          incident_category: activeCall?.triage_insights?.crime_category || 'Financial Cyber Fraud',
          amount_involved: extractedEntities.amount || '₹45,000',
          payment_channel: extractedEntities.mule_upi ? 'PhonePe (UPI)' : 'Bank IMPS/RTGS',
          priority: 'IMMEDIATE_FREEZE',
          freeze_target: extractedEntities.mule_upi || 'Beneficiary Bank Node',
          mule_upi: extractedEntities.mule_upi || 'cbi.officer.desk@sbi',
          utr_number: extractedEntities.utr_number || 'UTR-2026-9812-4112',
          status: 'DRAFT_PENDING_DISPATCH',
          golden_hour_window_remaining: '48 mins (Golden Hour)',
        }
      : null);

  const currentTicketId = ticketDraft?.ticket_id;
  const confirmedFreeze = currentTicketId ? confirmedFreezes[currentTicketId] : null;

  const handleConfirmFreeze = (freezeRecord) => {
    const tId = freezeRecord.ticketId || currentTicketId || '1930-NCRP-2026';
    setConfirmedFreezes((prev) => ({
      ...prev,
      [tId]: freezeRecord,
    }));
    setSubmittedTickets((prev) => ({
      ...prev,
      [tId]: true,
    }));

    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `[1930 CFMS] Administrative Lien Confirmed (${freezeRecord.tokenId}). Amount ${freezeRecord.amount || ticketDraft?.amount_involved} encumbered on ${freezeRecord.targetAccount || 'mule account'} under Sec 102 CrPC.`,
    };
    setCaseNotesLog((prev) => [newLog, ...prev]);
  };

  const handleCopyTicketToken = (token) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(token);
    }
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // Golden Hour Tier Calculation
  const minsLeft = Math.floor(goldenSecLeft / 60);
  const secsLeft = goldenSecLeft % 60;
  const elapsedMin = 60 - minsLeft;

  const getGoldenTier = () => {
    if (elapsedMin <= 15) {
      return {
        title: '0-15m: Tier 1 Mule Account',
        recoveryPct: '92%',
        recoveryLabel: 'Estimated recovery: 92%',
        theme: 'text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/40',
        barColor: 'bg-[#10B981]',
        badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300',
      };
    }
    if (elapsedMin <= 45) {
      return {
        title: '15-45m: Tier 2 Multi-Hop Dispersion',
        recoveryPct: '48%',
        recoveryLabel: 'Estimated recovery: 48%',
        theme: 'text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600/40 bg-amber-50 dark:bg-amber-950/40',
        barColor: 'bg-[#B18B56]',
        badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300',
      };
    }
    return {
      title: '45-60m: ATM Cashout / Crypto Drain Risk',
      recoveryPct: '<12%',
      recoveryLabel: 'Estimated recovery: <12%',
      theme: 'text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-600/40 bg-rose-50 dark:bg-rose-950/40',
      barColor: 'bg-[#B33939]',
      badge: 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300',
    };
  };

  const goldenTier = getGoldenTier();

  // Attack Stage Stepper derivation
  const getActiveStageNumber = () => {
    const stage = activeCall?.scam_stage || activeCall?.triage_insights?.scam_stage;
    if (typeof stage === 'number') return stage;
    if (typeof stage === 'object' && stage?.stage_number) return stage.stage_number;
    const text = (activeCall?.transcript?.raw_redacted || '').toLowerCase();
    if (text.includes('anydesk') || text.includes('apk') || text.includes('screen share')) return 3;
    if (text.includes('transfer') || text.includes('upi') || text.includes('utr') || text.includes('otp')) return 4;
    if (text.includes('video call') || text.includes('arrest') || text.includes('blackmail')) return 2;
    return 1;
  };

  const activeStageNum = getActiveStageNumber();

  const ATTACK_STAGES = [
    { num: 1, name: 'Impersonation', desc: 'CBI / Police / Courier' },
    { num: 2, name: 'Coercion', desc: 'Digital Arrest / Sextortion' },
    { num: 3, name: 'Infiltration', desc: 'AnyDesk / APK Session' },
    { num: 4, name: 'Liquidation', desc: 'Mule Routing / OTP Drain' },
  ];

  const getStageTacticalAction = () => {
    if (activeCall?.scam_stage?.next_action) return activeCall.scam_stage.next_action;
    switch (activeStageNum) {
      case 1:
        return 'Action: Instruct victim to verify caller identity on cybercrime.gov.in and sever unverified inbound call.';
      case 2:
        return 'Action: Break video call isolation immediately, reassure victim that state police and CBI never make arrest video calls, reject extortion.';
      case 3:
        return 'Action: Order caller to toggle Airplane mode or turn off Wi-Fi right now to disconnect remote APK session.';
      case 4:
      default:
        return 'Action: Break video call, issue 1930 freeze on beneficiary mule accounts and transaction UTR.';
    }
  };

  // Live Operator De-escalation Teleprompter
  const getTeleprompterPrompt = () => {
    const text = (activeCall?.transcript?.raw_redacted || '').toLowerCase();
    const emotion = activeCall?.dominant_emotion || 'fear';

    if (text.includes('anydesk') || text.includes('quicksupport') || text.includes('apk') || text.includes('screen share')) {
      return {
        tag: 'Infiltration Interdiction',
        script: "Say: 'Immediately turn off your phone\'s WiFi or toggle Airplane mode right now to disconnect the scammer\'s screen share.'",
        type: 'critical',
      };
    }

    if (text.includes('sextortion') || text.includes('blackmail') || text.includes('kill myself') || text.includes('leak video')) {
      return {
        tag: 'Crisis De-escalation',
        script: "Say: 'Sir/Madam, stay calm and do not pay any money. You are completely safe. Morphing videos is a common extortion tactic and we are taking down the links right now.'",
        type: 'reassurance',
      };
    }

    if (emotion === 'fear' || emotion === 'distress' || text.includes('digital arrest') || text.includes('cbi') || text.includes('police')) {
      return {
        tag: 'Digital Arrest De-escalation',
        script: "Say: 'Sir/Madam, take a deep breath. State police and CBI never make arrest video calls. Your bank account is safe and we are encumbering the funds right now.'",
        type: 'reassurance',
      };
    }

    return {
      tag: 'Operator Guidance',
      script: "Say: 'We have logged your incident docket on 1930 NCRP. Please keep transaction UTR and beneficiary handles ready while we place administrative liens.'",
      type: 'standard',
    };
  };

  const teleprompter = getTeleprompterPrompt();

  const handleCopyTeleprompter = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(teleprompter.script);
    }
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleVerifyIncident = () => {
    if (!activeCall) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setVerifiedCases((prev) => ({
      ...prev,
      [activeCall.call_id]: {
        verifiedAt: nowStr,
        officer: 'OP-VECNA-74',
      },
    }));
    const newLog = {
      id: Date.now(),
      time: nowStr,
      text: `Incident verified by human operator OP-VECNA-74. Stage advanced to Verified / Recorded.`,
    };
    setCaseNotesLog((prev) => [newLog, ...prev]);
    setShowReviewModal(false);
  };

  // Operational Workflow timeline
  const workflowStages = [
    {
      num: '01',
      label: 'Voice Received',
      completed: !!activeCall,
      time: activeCall ? '00:00' : '—',
      note: 'Call stream received',
    },
    {
      num: '02',
      label: 'Processing',
      completed: !!activeCall,
      time: activeCall ? '+0.4s' : '—',
      note: 'Acoustic biomarkers extracted',
    },
    {
      num: '03',
      label: 'Analysis Complete',
      completed: !!activeCall,
      time: activeCall ? '+1.2s' : '—',
      note: 'SER & threat classification complete',
    },
    {
      num: '04',
      label: 'Awaiting Human Review',
      completed: isCurrentVerified,
      active: !isCurrentVerified && !!activeCall,
      time: isCurrentVerified ? 'Reviewed' : 'Pending',
      note: isCurrentVerified ? 'Operator verification completed' : 'Operator review required',
    },
    {
      num: '05',
      label: 'Verified / Recorded',
      completed: isCurrentVerified,
      time: isCurrentVerified ? verifiedCases[activeCall?.call_id]?.verifiedAt : 'Pending',
      note: isCurrentVerified ? 'Dossier recorded in audit log' : 'Final disposition pending',
    },
  ];

  return (
    <div className="bg-[#FAF9F5] dark:bg-[#111923] border border-[#E2DDD3] dark:border-[#223043] rounded-lg flex flex-col h-full min-h-0 overflow-hidden shadow-sm transition-colors select-none">
      {/* Panel Top Header */}
      <div className="px-4 py-2.5 border-b border-[#E2DDD3] dark:border-[#223043] bg-[#F1EFE8]/70 dark:bg-[#0b1118]/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#477F7C] dark:text-[#55B7AE]" />
          <h2 className="font-serif text-sm font-semibold text-[#111923] dark:text-[#F1EFE8]">
            Incident Command & Decision Support
          </h2>
          {activeCall && (
            <span
              className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded border ${
                isCurrentVerified
                  ? 'bg-[#EBF7F2] text-[#1E7452] border-[#A3D9C5] dark:bg-[#132A22] dark:text-[#6EE7B7] dark:border-[#1E5743]'
                  : 'bg-[#FFF9EE] text-[#9A6715] border-[#F0D59D] dark:bg-[#251E13] dark:text-[#FCD34D] dark:border-[#5C451E]'
              }`}
            >
              {isCurrentVerified ? 'VERIFIED' : 'PENDING REVIEW'}
            </span>
          )}
        </div>

        {/* Top Action Buttons */}
        {activeCall && (
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <button
              onClick={() => onSaveCaseLocally && onSaveCaseLocally(activeCall)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors ${
                isCaseSaved
                  ? 'bg-[#EBF7F2] border-[#A3D9C5] text-[#1E7452] dark:bg-[#132A22] dark:border-[#1E5743] dark:text-[#6EE7B7]'
                  : 'bg-white dark:bg-[#182333] border-[#E2DDD3] dark:border-[#223043] text-[#55636B] dark:text-[#9AA6AC] hover:border-[#B18B56]'
              }`}
              title="Save dossier to browser vault"
            >
              {isCaseSaved ? (
                <>
                  <Check size={11} className="text-[#10B981]" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save size={11} className="text-[#8C969E]" />
                  <span>Save Case</span>
                </>
              )}
            </button>

            <button
              onClick={onExportReport}
              disabled={isExporting}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#111923] dark:bg-[#FAF9F5] hover:bg-[#202933] dark:hover:bg-white text-[#FAF9F5] dark:text-[#111923] rounded transition-colors shadow-sm font-semibold"
              title="Export Section 65B Certified Forensic Dossier"
            >
              <Download size={11} />
              <span>{isExporting ? 'Exporting...' : 'Export Dossier'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-3.5 sm:p-4 space-y-3.5 overflow-y-auto flex-1 min-h-0">
        {activeCall ? (
          <>
            {/* 1. Golden Hour Countdown Clock Widget */}
            <div className="bg-[#FAF9F5] dark:bg-[#0b1118] border border-[#E2DDD3] dark:border-[#223043] rounded-lg p-3 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#B18B56] animate-pulse" />
                  <span className="text-xs font-serif font-bold text-[#111923] dark:text-[#FAF9F5] uppercase tracking-wider">
                    Golden Hour Interdiction Countdown
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-[#B18B56]">
                  {minsLeft}m {secsLeft < 10 ? '0' : ''}{secsLeft}s remaining
                </span>
              </div>

              {/* Progress Bar with Tier Zones */}
              <div className="space-y-1">
                <div className="w-full bg-[#E2DDD3] dark:bg-[#1E293B] rounded-full h-2 overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-1000 ${goldenTier.barColor}`}
                    style={{ width: `${Math.max(5, Math.min(100, (goldenSecLeft / 3600) * 100))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#647078] dark:text-[#8C969E]">
                  <span>0m (Triage)</span>
                  <span>15m (Tier 1)</span>
                  <span>45m (Tier 2 Multi-Hop)</span>
                  <span>60m (ATM/Crypto)</span>
                </div>
              </div>

              {/* Active Dispersion Tier Badge */}
              <div className={`p-2 rounded border flex items-center justify-between text-xs ${goldenTier.theme}`}>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                  <span className="font-semibold">{goldenTier.title}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-current/30 ${goldenTier.badge}`}>
                  {goldenTier.recoveryLabel}
                </span>
              </div>
            </div>

            {/* 2. Attack Stage Visual Stepper */}
            <div className="bg-[#FAF9F5] dark:bg-[#0b1118] border border-[#E2DDD3] dark:border-[#223043] rounded-lg p-3 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-[#111923] dark:text-[#FAF9F5] uppercase tracking-wider">
                  Scam Modus Operandi (MO) Attack Stage
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-400/40">
                  Active: Stage {activeStageNum}
                </span>
              </div>

              {/* 4-Step Stepper Bar */}
              <div className="grid grid-cols-4 gap-1.5">
                {ATTACK_STAGES.map((step) => {
                  const isCurrent = step.num === activeStageNum;
                  const isPast = step.num < activeStageNum;

                  let stepStyle = 'bg-[#F1EFE8] dark:bg-[#121927] border-[#E2DDD3] dark:border-[#1e293b] text-[#8C969E]';
                  if (isCurrent) {
                    stepStyle =
                      'bg-rose-500/15 dark:bg-rose-950/60 border-rose-500/70 text-rose-700 dark:text-rose-300 shadow-sm';
                  } else if (isPast) {
                    stepStyle =
                      'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-700 dark:text-emerald-400';
                  }

                  return (
                    <div
                      key={step.num}
                      className={`p-2 rounded-md border text-center transition-all ${stepStyle}`}
                    >
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        {isPast ? (
                          <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                        ) : (
                          <span
                            className={`w-3.5 h-3.5 rounded-full text-[9px] font-mono flex items-center justify-center font-bold ${
                              isCurrent ? 'bg-[#B33939] text-white' : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {step.num}
                          </span>
                        )}
                        <span className="text-[11px] font-bold truncate">{step.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#647078] dark:text-[#8C969E] block truncate">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Immediate Tactical Recommendation */}
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                <Zap className="w-3.5 h-3.5 text-[#B18B56] fill-current shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">
                  {getStageTacticalAction()}
                </span>
              </div>
            </div>

            {/* 3. Live Operator De-escalation Teleprompter */}
            <div className="bg-[#FAF9F5] dark:bg-[#0b1118] border border-[#477F7C]/40 dark:border-[#223043] rounded-lg p-3 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-[#477F7C] dark:text-[#55B7AE]" />
                  <span className="text-xs font-serif font-bold text-[#111923] dark:text-[#FAF9F5] uppercase tracking-wider">
                    Live Operator De-escalation Teleprompter
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#182333] text-[#55B7AE] border border-[#477F7C]/50">
                  {teleprompter.tag}
                </span>
              </div>

              {/* Script Body */}
              <div className="bg-white dark:bg-[#131b26] border border-[#E2DDD3] dark:border-[#223043] p-2.5 rounded-md text-xs leading-relaxed text-[#111923] dark:text-[#FAF9F5] font-medium relative group">
                <p className="italic text-[#477F7C] dark:text-[#55B7AE]">
                  {teleprompter.script}
                </p>

                <div className="mt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleCopyTeleprompter}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-medium rounded bg-[#F1EFE8] dark:bg-[#182333] text-[#55636B] dark:text-[#9AA6AC] border border-[#E2DDD3] dark:border-[#223043] hover:border-[#477F7C] transition-colors"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-3 h-3 text-[#10B981]" />
                        <span>Copied Script</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Prominent Review Incident Verification Button */}
            <div className="bg-[#FAF9F5] dark:bg-[#131b26] border border-[#B18B56] rounded-lg p-3 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-serif text-sm font-semibold text-[#111923] dark:text-[#FAF9F5]">
                  Human Operator Verification
                </span>
                <span className="font-mono text-[10px] text-[#B18B56]">
                  {isCurrentVerified ? 'STEP 05 COMPLETE' : 'STEP 04 ACTIVE'}
                </span>
              </div>

              <p className="text-[11px] text-[#647078] dark:text-[#9AA6AC] leading-relaxed">
                Automated acoustic indicators prioritize urgency. Final triage determination requires human operator sign-off.
              </p>

              <button
                onClick={() => setShowReviewModal(true)}
                className={`w-full py-2 px-3 rounded-md text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
                  isCurrentVerified
                    ? 'bg-[#EBF7F2] dark:bg-[#132A22] border border-[#A3D9C5] dark:border-[#1E5743] text-[#1E7452] dark:text-[#6EE7B7]'
                    : 'bg-[#B18B56] hover:bg-[#8C6B3A] text-white'
                }`}
              >
                {isCurrentVerified ? (
                  <>
                    <CheckCircle2 size={13} className="text-[#10B981]" />
                    <span>Incident Verified by Operator</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={13} />
                    <span>Review Incident & Authorize</span>
                  </>
                )}
              </button>
            </div>

            {/* Workflow Timeline (Connected vertical timeline) */}
            <div className="bg-[#F1EFE8]/70 dark:bg-[#0b1118] border border-[#E2DDD3] dark:border-[#223043] rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="font-semibold text-[#111923] dark:text-[#F1EFE8]">
                  Operational Workflow
                </span>
                <span className="text-[10px] text-[#8C969E]">
                  {isCurrentVerified ? '5 of 5 Complete' : '4 of 5 In Progress'}
                </span>
              </div>

              <div className="relative pl-6 space-y-3">
                {/* Vertical connecting line */}
                <div className="absolute left-2.5 top-1.5 bottom-1.5 w-0.5 bg-[#E2DDD3] dark:border-[#223043]" />

                {workflowStages.map((st) => {
                  const isDone = st.completed;
                  const isActive = st.active;
                  return (
                    <div key={st.num} className="relative flex items-start gap-2.5 text-xs">
                      {/* Node circle */}
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] transition-colors border ${
                          isDone
                            ? 'bg-[#477F7C] text-white border-[#477F7C]'
                            : isActive
                            ? 'bg-[#B18B56] text-white border-[#B18B56] animate-pulse'
                            : 'bg-white dark:bg-[#182333] text-[#8C969E] border-[#E2DDD3] dark:border-[#223043]'
                        }`}
                      >
                        {isDone ? <Check size={10} /> : st.num}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono text-xs font-semibold ${
                              isActive
                                ? 'text-[#B18B56]'
                                : isDone
                                ? 'text-[#111923] dark:text-[#F1EFE8]'
                                : 'text-[#8C969E]'
                            }`}
                          >
                            {st.label}
                          </span>
                          <span className="font-mono text-[10px] text-[#8C969E]">{st.time}</span>
                        </div>
                        <p className="text-[10px] text-[#647078] dark:text-[#8C969E] font-sans leading-tight">
                          {st.note}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 1930 NCRP Freeze Ticket Card */}
            {ticketDraft && (
              <div
                className={`rounded-lg p-3 space-y-2 border transition-all ${
                  confirmedFreeze
                    ? 'bg-emerald-50/70 dark:bg-[#091512] border-emerald-400 dark:border-emerald-600/50 shadow-sm'
                    : 'bg-[#FAF3E8] dark:bg-[#1A1813] border-[#B18B56]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider font-serif ${
                      confirmedFreeze
                        ? 'text-emerald-900 dark:text-emerald-200'
                        : 'text-[#8C6B3A] dark:text-[#DFBA82]'
                    }`}
                  >
                    {confirmedFreeze ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : (
                      <Building className="w-3.5 h-3.5 text-[#B18B56]" />
                    )}
                    1930 Account Freeze Request
                  </span>

                  {confirmedFreeze ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider">
                      LIEN CONFIRMED &amp; SECURED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF3E8] dark:bg-[#2B2317] border border-[#B18B56] text-[#8C6B3A] dark:text-[#DFBA82] font-semibold">
                      {ticketDraft.priority}
                    </span>
                  )}
                </div>

                {/* Confirmed Token Display Bar */}
                {confirmedFreeze && (
                  <div className="bg-white dark:bg-[#06120e] p-2.5 rounded-md border border-emerald-300 dark:border-emerald-600/60 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase text-emerald-700 dark:text-emerald-400 font-semibold block">
                        Freeze Token (Sec 102 CrPC)
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-950 dark:text-emerald-200 truncate block">
                        {confirmedFreeze.tokenId}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyTicketToken(confirmedFreeze.tokenId)}
                      className="flex-shrink-0 text-[11px] font-mono px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 flex items-center gap-1 transition-colors"
                      title="Copy Freeze Token"
                    >
                      {copiedToken ? (
                        <>
                          <Check className="w-3 h-3 text-[#10B981]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                  <div className="bg-white dark:bg-[#080d16] p-2 rounded border border-[#E2DDD3] dark:border-[#223043]">
                    <span className="text-[10px] text-[#647078] dark:text-[#8C969E] block">Docket</span>
                    <span className="text-[#111923] dark:text-[#F1EFE8] truncate block font-semibold">
                      {ticketDraft.ticket_id}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#080d16] p-2 rounded border border-[#E2DDD3] dark:border-[#223043]">
                    <span className="text-[10px] text-[#647078] dark:text-[#8C969E] block">Amount</span>
                    <strong
                      className={
                        confirmedFreeze
                          ? 'text-[#1E7452] dark:text-[#6EE7B7]'
                          : 'text-[#B33939] dark:text-[#F87171]'
                      }
                    >
                      {ticketDraft.amount_involved}
                    </strong>
                  </div>
                  <div className="bg-white dark:bg-[#080d16] p-2 rounded border border-[#E2DDD3] dark:border-[#223043]">
                    <span className="text-[10px] text-[#647078] dark:text-[#8C969E] block">Channel</span>
                    <span className="text-[#111923] dark:text-[#F1EFE8] truncate block font-medium">
                      {ticketDraft.payment_channel}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#080d16] p-2 rounded border border-[#E2DDD3] dark:border-[#223043]">
                    <span className="text-[10px] text-[#647078] dark:text-[#8C969E] block">Status</span>
                    <span
                      className={`font-semibold ${
                        confirmedFreeze
                          ? 'text-[#1E7452] dark:text-[#6EE7B7]'
                          : 'text-[#10B981]'
                      }`}
                    >
                      {confirmedFreeze ? 'Lien Active' : ticketDraft.golden_hour_window_remaining || 'Active window'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFreezeModalOpen(true)}
                  className={`w-full py-1.5 px-3 text-xs font-mono font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                    confirmedFreeze
                      ? 'bg-[#477F7C] hover:bg-[#3B6C69] text-white shadow-sm'
                      : 'bg-[#B18B56] hover:bg-[#8C6B3A] text-white shadow-sm'
                  }`}
                >
                  {confirmedFreeze ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>View 1930 Lien Gateway Dossier</span>
                    </>
                  ) : (
                    <>
                      <Zap size={13} className="fill-current" />
                      <span>Dispatch 1930 Freeze Directive</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Response Playbook Checklist */}
            <div className="bg-[#F1EFE8]/70 dark:bg-[#0b1118] border border-[#E2DDD3] dark:border-[#223043] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-[#111923] dark:text-[#F1EFE8]">
                  Response Playbook
                </span>
                <span className="text-[10px] text-[#8C969E]">
                  {Object.values(completedActions[activeCall.call_id] || {}).filter(Boolean).length} / {actions.length} Completed
                </span>
              </div>

              <div className="space-y-1.5 font-sans">
                {actions.map((act, idx) => {
                  const isChecked = !!(completedActions[activeCall.call_id]?.[idx]);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleAction(idx)}
                      className={`p-2 rounded border text-xs cursor-pointer flex items-start gap-2 transition-colors ${
                        isChecked
                          ? 'bg-[#E2DDD3]/40 dark:bg-[#182333]/40 border-[#E2DDD3] dark:border-[#223043] text-[#8C969E] line-through'
                          : 'bg-white dark:bg-[#131b26] border-[#E2DDD3] dark:border-[#223043] text-[#111923] dark:text-[#FAF9F5] hover:border-[#477F7C]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-[#C8C2B5] text-[#477F7C] cursor-pointer"
                      />
                      <span className="leading-snug">{act}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dispatch Directives & Voice Copilot */}
            <div className="bg-[#F1EFE8]/70 dark:bg-[#0b1118] border border-[#E2DDD3] dark:border-[#223043] rounded-lg p-3 space-y-2">
              <span className="text-xs font-semibold text-[#111923] dark:text-[#F1EFE8] block font-serif">
                Dispatch Directives & Notes
              </span>

              <textarea
                rows={2}
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type officer notes (e.g. 'Victim confirmed ₹45,000 sent via PhonePe, initiate 1930 freeze')..."
                className="w-full bg-white dark:bg-[#131b26] border border-[#E2DDD3] dark:border-[#223043] rounded p-2 text-xs text-[#111923] dark:text-[#FAF9F5] placeholder-[#8C969E] focus:outline-none focus:border-[#477F7C] resize-none"
              />

              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setDispatchNotes('')}
                  className="px-2 py-1 text-[11px] font-mono text-[#8C969E] hover:text-[#111923] rounded border border-[#E2DDD3] dark:border-[#223043] transition-colors"
                >
                  Clear
                </button>

                <button
                  onClick={handleProcessCopilotSubmit}
                  disabled={!dispatchNotes.trim() || isProcessingCopilot}
                  className={`px-3 py-1 text-xs font-mono font-semibold rounded flex items-center gap-1.5 transition-colors ${
                    dispatchNotes.trim() && !isProcessingCopilot
                      ? 'bg-[#477F7C] hover:bg-[#3B6C69] text-white shadow-sm'
                      : 'bg-[#E2DDD3] dark:bg-[#1E293B] text-[#8C969E] cursor-not-allowed'
                  }`}
                >
                  <span>{isProcessingCopilot ? 'Processing...' : 'Apply Directive'}</span>
                </button>
              </div>

              {/* Audit history log */}
              {caseNotesLog.length > 0 && (
                <div className="pt-2 border-t border-[#E2DDD3] dark:border-[#223043] space-y-1">
                  <span className="text-[10px] font-mono text-[#8C969E] uppercase tracking-wider block">
                    Incident Audit Stream
                  </span>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {caseNotesLog.map((log) => (
                      <div
                        key={log.id}
                        className="p-1.5 rounded bg-white dark:bg-[#131b26] border border-[#E2DDD3] dark:border-[#223043] text-[10px] text-[#55636B] dark:text-[#9AA6AC]"
                      >
                        <span className="font-mono text-[#B18B56] block">{log.time}</span>
                        <p>{log.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="h-64 flex flex-col items-center justify-center p-6 text-center text-[#8C969E] space-y-2">
            <ClipboardList className="w-8 h-8 text-[#C8C2B5] dark:text-[#2A374A] mx-auto" />
            <h3 className="font-serif text-sm font-semibold text-[#111923] dark:text-[#F1EFE8]">
              Awaiting Incident Selection
            </h3>
            <p className="text-[11px] max-w-[220px] text-[#647078] dark:text-[#8C969E] leading-relaxed">
              Active incident details, workflow timeline, and response playbooks will populate once a call is selected or analyzed.
            </p>
          </div>
        )}
      </div>

      {/* Simulated NPCI / Bank Rapid Freeze Gateway Modal */}
      <BankFreezeModal
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
        ticketDraft={ticketDraft}
        extractedEntities={extractedEntities}
        onConfirmFreeze={handleConfirmFreeze}
        initialConfirmedRecord={confirmedFreeze}
      />

      {/* Review & Authorization Modal */}
      {showReviewModal && activeCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF9F5] dark:bg-[#111923] border border-[#B18B56] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2DDD3] dark:border-[#223043] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#111923] dark:text-[#FAF9F5]">
                  Authorize Incident Review
                </h3>
                <span className="font-mono text-xs text-[#B18B56]">
                  Case: {activeCall.call_id}
                </span>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-[#8C969E] hover:text-[#111923] font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#55636B] dark:text-[#9AA6AC] leading-relaxed">
              <div className="p-3 rounded bg-[#F1EFE8] dark:bg-[#182333] border border-[#E2DDD3] dark:border-[#223043] space-y-1">
                <span className="font-mono text-[10px] text-[#B18B56] block">INCIDENT SUMMARY</span>
                <p className="font-semibold text-[#111923] dark:text-[#FAF9F5]">
                  {activeCall.triage_insights?.crime_category}
                </p>
                <p>Urgency Level: <strong className="text-[#B18B56]">{activeCall.urgency_score}/100 ({activeCall.urgency_level})</strong></p>
              </div>

              <p>
                By authorizing this record, you confirm human verification of the acoustic triage cues, validate the priority ranking, and advance the incident into the permanent response audit register.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2DDD3] dark:border-[#223043]">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-1.5 rounded border border-[#E2DDD3] dark:border-[#223043] text-xs font-mono text-[#647078] hover:text-[#111923]"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyIncident}
                className="px-4 py-1.5 rounded bg-[#477F7C] hover:bg-[#3B6C69] text-white text-xs font-mono font-semibold shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} />
                <span>Confirm & Sign-Off</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
