# Task 3 Brief: Simulated NPCI / Bank Rapid Freeze Gateway Modal

## Target Files
- Create: `frontend/src/components/BankFreezeModal.jsx`
- Modify: `frontend/src/components/DecisionSupport.jsx`

## Requirements
1. **Interactive Bank Freeze Modal (`BankFreezeModal.jsx`):**
   - Triggered when operator clicks "Dispatch 1930 Freeze Directive".
   - Shows an authentic cybercrime command terminal modal with simulated step-by-step gateway latency:
     - `T+0.3s`: `Connecting to NPCI Central Fraud Management Switch (CFMS)...` (Status: OK)
     - `T+0.7s`: `Routing to Beneficiary Bank Switch (${bankName || 'State Bank of India'})...` (Status: OK)
     - `T+1.1s`: `Account ${accountOrUpi} identified. Issuing administrative lien of ${amount} under Section 102 CrPC...` (Status: PROCESSING)
     - `T+1.5s`: `LIEN CONFIRMED. Beneficiary account locked. Reversal ticket generated.` (Status: SECURED)
   - Generates official Freeze Docket Token e.g. `NCRP-FRZ-2026-9921` with timestamp.
   - Allows operator to copy token, print formal directive, or close modal.
   - Calls `onConfirmFreeze(freezeDetails)` on completion so the parent docket updates with confirmed status.

2. **Integration in `DecisionSupport.jsx`:**
   - Add state for `isFreezeModalOpen`.
   - Clicking "Dispatch 1930 freeze request" opens `BankFreezeModal`.
   - When confirmed, updates the 1930 ticket card with green "LIEN PLACED & SECURED" status badge and token ID.

## Report Contract
Write report to: `docs/superpowers/plans/task-3-report.md`.
