import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  FileText,
  RotateCcw,
  Download,
  Zap,
  Save,
  Check,
  Building,
  ClipboardList,
  Clock,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Lock,
  Share2
} from 'lucide-react';
import { INDICATIVE_DISCLAIMER } from '../mockData';

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

  const ticketDraft = copilotData?.ncrp_1930_ticket_draft;
  const isTicketSubmitted = ticketDraft && submittedTickets[ticketDraft.ticket_id];

  const handleSubmitTicket = (ticketId) => {
    setSubmittedTickets((prev) => ({ ...prev, [ticketId]: true }));
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `1930 emergency freeze request #${ticketId} dispatched to banking liaison node.`,
    };
    setCaseNotesLog((prev) => [newLog, ...prev]);
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

  // Determine stage progression:
  // 1: Voice Received (Done if activeCall)
  // 2: Processing (Done if activeCall)
  // 3: Analysis Complete (Done if activeCall)
  // 4: Awaiting Human Review (Active if not verified, Done if verified)
  // 5: Verified / Recorded (Done if verified)
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
      note: 'SER & keyword classification complete',
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
          <h2 className="font-serif text-sm font-semibold text-[#111923] dark:text-[#F1EFE8]">
            Incident Review & Log
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
              title="Export forensic report (Markdown + JSON)"
            >
              <Download size={11} />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-3.5 sm:p-4 space-y-3.5 overflow-y-auto flex-1 min-h-0">
        {activeCall ? (
          <>
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
                <div className="absolute left-2.5 top-1.5 bottom-1.5 w-0.5 bg-[#E2DDD3] dark:bg-[#223043]" />

                {workflowStages.map((st, idx) => {
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

            {/* 1930 NCRP Freeze Ticket Card (When present or generated) */}
            {ticketDraft && (
              <div className="bg-[#FAF3E8] dark:bg-[#1A1813] border border-[#B18B56] rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#8C6B3A] dark:text-[#DFBA82] flex items-center gap-1.5 font-serif">
                    <Building size={14} className="text-[#B18B56]" />
                    <span>1930 NCRP Freeze Request</span>
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#FAF3E8] dark:bg-[#2B2317] border border-[#B18B56] text-[#8C6B3A] dark:text-[#DFBA82] font-semibold">
                    {ticketDraft.priority}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                  <div className="bg-white dark:bg-[#0b1118] p-1.5 rounded border border-[#E2DDD3] dark:border-[#223043]">
                    <span className="text-[9px] text-[#8C969E] block">Docket</span>
                    <span className="text-[#111923] dark:text-[#F1EFE8] truncate block">
                      {ticketDraft.ticket_id}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#0b1118] p-1.5 rounded border border-[#E2DDD3] dark:border-[#223043]">
                    <span className="text-[9px] text-[#8C969E] block">Amount</span>
                    <strong className="text-[#B33939] dark:text-[#F87171]">
                      {ticketDraft.amount_involved}
                    </strong>
                  </div>
                  <div className="bg-white dark:bg-[#0b1118] p-1.5 rounded border border-[#E2DDD3] dark:border-[#223043]">
                    <span className="text-[9px] text-[#8C969E] block">Channel</span>
                    <span className="text-[#111923] dark:text-[#F1EFE8] truncate block">
                      {ticketDraft.payment_channel}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#0b1118] p-1.5 rounded border border-[#E2DDD3] dark:border-[#223043]">
                    <span className="text-[9px] text-[#8C969E] block">Window</span>
                    <span className="text-[#10B981] truncate block">
                      {ticketDraft.golden_hour_window_remaining || 'Active window'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleSubmitTicket(ticketDraft.ticket_id)}
                  disabled={isTicketSubmitted}
                  className={`w-full py-1.5 px-3 text-xs font-mono font-semibold rounded flex items-center justify-center gap-1.5 transition-colors ${
                    isTicketSubmitted
                      ? 'bg-[#EBF7F2] dark:bg-[#132A22] border border-[#A3D9C5] dark:border-[#1E5743] text-[#1E7452] dark:text-[#6EE7B7] cursor-default'
                      : 'bg-[#B18B56] hover:bg-[#8C6B3A] text-white shadow-sm'
                  }`}
                >
                  {isTicketSubmitted ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Freeze request logged with 1930</span>
                    </>
                  ) : (
                    <>
                      <Zap size={13} className="fill-current" />
                      <span>Dispatch 1930 Freeze Request</span>
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

            {/* Dispatch Notes & Voice Copilot */}
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
