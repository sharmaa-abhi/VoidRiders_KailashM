import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Building,
  Terminal,
  Copy,
  Check,
  Printer,
  Download,
  X,
  Zap,
  Clock,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

/**
 * Resolves beneficiary financial institution name based on UPI handle or provided entity bank.
 */
function resolveBankName(upiOrAccount = '', explicitBank = '') {
  if (explicitBank && explicitBank.trim()) return explicitBank.trim();
  const lower = upiOrAccount.toLowerCase();
  if (lower.includes('@sbi') || lower.includes('sbi')) return 'State Bank of India (CFMS Node 01)';
  if (lower.includes('@okhdfcbank') || lower.includes('hdfc')) return 'HDFC Bank Ltd. (CFMS Switch)';
  if (lower.includes('@icici')) return 'ICICI Bank Ltd. (CFMS Gateway)';
  if (lower.includes('@axisbank') || lower.includes('axis')) return 'Axis Bank Ltd.';
  if (lower.includes('@paytm')) return 'Paytm Payments Bank Switch';
  if (lower.includes('@ybl') || lower.includes('yes')) return 'Yes Bank Ltd.';
  if (lower.includes('@pnb') || lower.includes('pnb')) return 'Punjab National Bank';
  if (lower.includes('@kotak') || lower.includes('kotak')) return 'Kotak Mahindra Bank';
  if (lower.includes('@barodampay') || lower.includes('bob')) return 'Bank of Baroda';
  return 'State Bank of India (Beneficiary Switch)';
}

/**
 * Gentle Web Audio confirmation chime on lien lock.
 */
function playConfirmationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio context may be restricted in silent autoplay
  }
}

export default function BankFreezeModal({
  isOpen,
  onClose,
  ticketDraft,
  extractedEntities = {},
  onConfirmFreeze,
  initialConfirmedRecord = null,
}) {
  if (!isOpen) return null;

  // Extract core targets with fallbacks
  const amount =
    ticketDraft?.amount_involved ||
    extractedEntities?.amount ||
    '₹45,000';

  const muleId =
    ticketDraft?.mule_upi ||
    extractedEntities?.mule_upi ||
    extractedEntities?.beneficiary_account ||
    ticketDraft?.freeze_target ||
    'cbi.officer.desk@sbi';

  const utr =
    ticketDraft?.utr_number ||
    extractedEntities?.utr_number ||
    'UTR-2026-9812-4112';

  const ticketId =
    ticketDraft?.ticket_id ||
    `1930-NCRP-${Math.floor(100000 + Math.random() * 900000)}`;

  const bankName = resolveBankName(muleId, extractedEntities?.bank_name || ticketDraft?.bank_name);

  // States
  const [currentStep, setCurrentStep] = useState(initialConfirmedRecord ? 4 : 0);
  const [freezeToken, setFreezeToken] = useState(() => {
    return (
      initialConfirmedRecord?.tokenId ||
      `NCRP-FRZ-2026-${Math.floor(1000 + Math.random() * 9000)}`
    );
  });
  const [copiedToken, setCopiedToken] = useState(false);
  const [downloadedNotice, setDownloadedNotice] = useState(false);
  const [simulatedPing, setSimulatedPing] = useState(24);
  const terminalEndRef = useRef(null);
  const timeoutsRef = useRef([]);

  // Clear existing timeouts helper
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  // Run sequence when opening if not already secured
  useEffect(() => {
    if (initialConfirmedRecord) {
      setCurrentStep(4);
      return;
    }

    setCurrentStep(0);
    clearAllTimeouts();

    // Live latency fluctuation
    const pingInterval = setInterval(() => {
      setSimulatedPing(Math.floor(18 + Math.random() * 14));
    }, 450);

    // Step 1 (~350ms): Handshake NPCI Central Fraud Management Switch (CFMS)
    const t1 = setTimeout(() => {
      setCurrentStep(1);
    }, 350);

    // Step 2 (~750ms): Query Beneficiary Financial Institution
    const t2 = setTimeout(() => {
      setCurrentStep(2);
    }, 750);

    // Step 3 (~1150ms): Account/UPI Encumbered under Sec 102 CrPC
    const t3 = setTimeout(() => {
      setCurrentStep(3);
    }, 1150);

    // Step 4 (~1500ms): ADMINISTRATIVE LIEN PLACED
    const t4 = setTimeout(() => {
      setCurrentStep(4);
      playConfirmationChime();
    }, 1500);

    timeoutsRef.current = [t1, t2, t3, t4];

    return () => {
      clearAllTimeouts();
      clearInterval(pingInterval);
    };
  }, [initialConfirmedRecord, isOpen]);

  // Scroll terminal to bottom as new steps appear
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentStep]);

  // Fast forward / instant skip
  const handleFastForward = () => {
    clearAllTimeouts();
    setCurrentStep(4);
    playConfirmationChime();
  };

  // Copy freeze token to clipboard
  const handleCopyToken = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(freezeToken);
    }
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  // Generate and download formal 1930 Directive Text Document
  const handlePrintOrDownloadDirective = () => {
    const timestamp = new Date().toISOString();
    const directiveContent = `================================================================================
GOVERNMENT OF INDIA - MINISTRY OF HOME AFFAIRS (MHA)
NATIONAL CYBER CRIME REPORTING PORTAL (NCRP) - CITIZEN FRAUD TRIAGE (1930)
CENTRAL FRAUD MANAGEMENT SWITCH (CFMS) RAPID FREEZE DIRECTIVE
================================================================================

DIRECTIVE DOCKET NUMBER: ${freezeToken}
DISPATCH TIMESTAMP (UTC): ${timestamp}
INCIDENT DOCKET REFERENCE: ${ticketId}
LEGAL SANCTION AUTHORITY: Section 102 Code of Criminal Procedure (CrPC) / Sec 106 BNSS

--- 1. TARGET BENEFICIARY FINANCIAL TELEMETRY ---
ENCUMBERED AMOUNT     : ${amount} (INR)
BENEFICIARY IDENTIFIER: ${muleId}
INSTITUTION ROUTED    : ${bankName}
TRANSACTION UTR       : ${utr}
FREEZE PRIORITY       : IMMEDIATE GOLDEN-HOUR SECURED
NPCI SWITCH STATUS    : 200 OK (GATEWAY ACKNOWLEDGED)

--- 2. STATUTORY LIEN MANDATE ---
To: Nodal Fraud & Compliance Officer, ${bankName}
Pursuant to Section 102 of the Code of Criminal Procedure, 1973 (CrPC) and the 1930 
National Citizen Financial Cyber Fraud reporting protocol, you are hereby directed to 
immediately place an administrative lien and debit freeze upon the aforementioned 
account/UPI node. All outgoing fund dispersion or automated debit transfers up to 
the encumbered amount (${amount}) must be halted with immediate effect.

DISPATCHING CONSOLE   : VECNA-Pulse 1930 Triage Incident Workstation
HASH SIGNATURE        : SHA256:${Math.random().toString(16).substring(2, 10).toUpperCase()}-MHA-1930-SECURED
================================================================================
Generated for official judicial & forensic audit records.
`;

    // Trigger file download
    try {
      const blob = new Blob([directiveContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `NCRP-DIRECTIVE-${freezeToken}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadedNotice(true);
      setTimeout(() => setDownloadedNotice(false), 3000);
    } catch {
      // Fallback
    }

    // Also trigger system print dialog if operator wants paper copy
    if (typeof window !== 'undefined' && window.print) {
      // Short delay to let download trigger first
      setTimeout(() => {
        try {
          window.print();
        } catch {
          // ignore print dialog rejection
        }
      }, 500);
    }
  };

  // Complete and commit lien record
  const handleCompleteAndClose = () => {
    const freezeRecord = {
      tokenId: freezeToken,
      ticketId,
      status: 'LIEN_CONFIRMED',
      timestamp: Date.now(),
      amount,
      targetAccount: muleId,
      bankName,
      utr,
      details: `Administrative Lien placed on ${muleId} under Sec 102 CrPC via NPCI CFMS. Amount ${amount} secured.`,
    };

    if (onConfirmFreeze) {
      onConfirmFreeze(freezeRecord);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Obsidian Cyber Command Modal */}
      <div className="bg-[#080c14] border border-cyan-500/40 rounded-2xl w-full max-w-2xl shadow-2xl shadow-cyan-950/70 overflow-hidden text-slate-100 font-sans flex flex-col max-h-[92vh]">
        {/* Glowing Top Cyber Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-500 animate-pulse" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#0b101c] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 shadow-sm shadow-cyan-900/50">
              <Zap className="w-4 h-4 fill-current text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide text-white font-mono uppercase">
                  NPCI Rapid Freeze Gateway
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-cyan-950 border border-cyan-700/60 text-cyan-300">
                  CFMS v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Central Fraud Management Switch • Sec 102 CrPC Golden-Hour Directive
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Telemetry Ping */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-[#05080f] border border-slate-800 text-[10px] font-mono text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>RTT: {simulatedPing}ms</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400">TLS 1.3 GOV-PKI</span>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Target Parameters Dossier Bar */}
          <div className="bg-[#0b111e] border border-slate-800/90 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Target UPI / Account
              </span>
              <span className="text-xs font-semibold text-amber-300 truncate block" title={muleId}>
                {muleId}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Encumbered Amount
              </span>
              <span className="text-xs font-bold text-emerald-400 block">{amount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Beneficiary Switch
              </span>
              <span className="text-xs text-slate-200 truncate block" title={bankName}>
                {bankName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Transaction UTR
              </span>
              <span className="text-xs font-mono text-cyan-300 truncate block" title={utr}>
                {utr}
              </span>
            </div>
          </div>

          {/* Terminal Stream Simulation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-0.5">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>NPCI CFMS DIRECTIVE TRANSMISSION STREAM</span>
              </span>
              {currentStep < 4 ? (
                <button
                  onClick={handleFastForward}
                  className="text-cyan-400 hover:text-cyan-300 text-[10px] underline underline-offset-2 flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>Instant Dispatch (Skip animation)</span>
                </button>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>DISPATCH COMPLETE</span>
                </span>
              )}
            </div>

            {/* Terminal Box */}
            <div className="bg-[#04060b] border border-slate-800 rounded-xl p-3 font-mono text-[11px] leading-relaxed space-y-2 shadow-inner">
              {/* Step 0 */}
              <div className="flex items-start gap-2 text-slate-400">
                <span className="text-slate-600 select-none">[T+0.0s]</span>
                <span className="flex-1">
                  Connecting to NPCI Central Fraud Management Switch (CFMS) root node...
                </span>
                <span className="text-cyan-400 font-semibold">[INIT]</span>
              </div>

              {/* Step 1: Handshake */}
              {currentStep >= 1 && (
                <div className="flex items-start gap-2 text-slate-300 animate-fadeIn">
                  <span className="text-slate-600 select-none">[T+0.35s]</span>
                  <span className="flex-1">
                    Handshake: NPCI Central Fraud Management Switch (CFMS)...
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-semibold">
                    OK (Latency: 28ms)
                  </span>
                </div>
              )}

              {/* Step 2: Query Beneficiary */}
              {currentStep >= 2 && (
                <div className="flex items-start gap-2 text-slate-300 animate-fadeIn">
                  <span className="text-slate-600 select-none">[T+0.75s]</span>
                  <span className="flex-1">
                    Querying Beneficiary Financial Institution ({bankName})...
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 font-semibold">
                    OK (Switch Active)
                  </span>
                </div>
              )}

              {/* Step 3: Account Encumbrance */}
              {currentStep >= 3 && (
                <div className="flex items-start gap-2 text-slate-300 animate-fadeIn">
                  <span className="text-slate-600 select-none">[T+1.15s]</span>
                  <span className="flex-1">
                    Account / UPI (<span className="text-amber-300">{muleId}</span>) Encumbered under
                    Sec 102 CrPC &amp; 1930 Protocol...
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-semibold ${
                      currentStep >= 4
                        ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-400'
                        : 'bg-amber-950/80 border border-amber-500/40 text-amber-300 animate-pulse'
                    }`}
                  >
                    {currentStep >= 4 ? 'COMPLETED' : 'PROCESSING'}
                  </span>
                </div>
              )}

              {/* Step 4: Secured */}
              {currentStep >= 4 && (
                <div className="flex items-start gap-2 text-emerald-300 font-semibold pt-1 border-t border-slate-800/80 animate-fadeIn">
                  <span className="text-slate-600 select-none font-normal">[T+1.50s]</span>
                  <span className="flex-1">
                    ADMINISTRATIVE LIEN PLACED: Amount{' '}
                    <span className="text-white bg-emerald-950 px-1 rounded">{amount}</span> Held.
                    Reversal Token Generated.
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold uppercase tracking-wider shadow-sm shadow-emerald-500/40">
                    SECURED
                  </span>
                </div>
              )}

              <div ref={terminalEndRef} />
            </div>

            {/* Step Progress Bar */}
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  currentStep >= 4
                    ? 'bg-emerald-500 w-full'
                    : currentStep === 3
                    ? 'bg-amber-400 w-3/4'
                    : currentStep === 2
                    ? 'bg-cyan-400 w-1/2'
                    : currentStep === 1
                    ? 'bg-cyan-500 w-1/4'
                    : 'bg-slate-700 w-1/12'
                }`}
              />
            </div>
          </div>

          {/* Secured Summary Card (Appears when Step 4 is reached) */}
          {currentStep >= 4 && (
            <div className="bg-[#0b1424] border border-emerald-500/50 rounded-xl p-4 space-y-3.5 shadow-lg shadow-emerald-950/30 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/40 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                      1930 Administrative Lien Confirmed
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Beneficiary Outflows Locked • Golden-Hour Protection Active
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-semibold uppercase">
                    Sec 102 CrPC Legal Notice
                  </span>
                </div>
              </div>

              {/* Token ID Display Bar */}
              <div className="bg-[#050912] border border-emerald-600/40 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block">
                    Official 1930 NCRP Freeze Docket Token
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold text-emerald-400 tracking-wide select-all">
                    {freezeToken}
                  </span>
                </div>

                <button
                  onClick={handleCopyToken}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                    copiedToken
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title="Copy Token to clipboard"
                >
                  {copiedToken ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Freeze Token</span>
                    </>
                  )}
                </button>
              </div>

              {/* Legal Notice Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-300">
                <div className="p-2 rounded bg-[#070d18] border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Encumbered Sum</span>
                  <span className="font-bold text-emerald-400 text-xs">{amount}</span>
                </div>
                <div className="p-2 rounded bg-[#070d18] border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Beneficiary Target</span>
                  <span className="text-slate-200 truncate block" title={muleId}>
                    {muleId}
                  </span>
                </div>
                <div className="p-2 rounded bg-[#070d18] border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Bank Switch UTR</span>
                  <span className="text-cyan-300 truncate block" title={utr}>
                    {utr}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed font-sans bg-[#070d18]/60 p-2 rounded border border-slate-800/80">
                <strong className="text-slate-300 font-mono">Statutory Notice: </strong>
                Under Section 102 CrPC / Sec 106 BNSS, this administrative freeze command encumbers all
                clearing accounts associated with the target beneficiary identifier for 24 hours. The
                beneficiary institution must preserve logs for cyber forensics examination.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-[#0b101c] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-[11px] text-slate-400 font-mono text-center sm:text-left">
            <span>Auth: MHA-1930-TRIAGE-CONSOLE</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Print / Download Directive Button */}
            {currentStep >= 4 && (
              <button
                onClick={handlePrintOrDownloadDirective}
                className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                title="Download legal 1930 Directive Notice & print"
              >
                {downloadedNotice ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Directive Downloaded</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>Print 1930 Directive</span>
                  </>
                )}
              </button>
            )}

            {/* Complete & Close Button */}
            <button
              onClick={currentStep >= 4 ? handleCompleteAndClose : handleFastForward}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors ${
                currentStep >= 4
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {currentStep >= 4 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Complete &amp; Close</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Freeze Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
