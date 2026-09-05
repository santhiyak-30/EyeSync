import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, ShieldAlert, Send } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import api from '../services/api';

export default function ReviewModal({ caseDetail, onClose, onReviewSubmitted }) {
  const { currentRole } = useRole();
  const [decision, setDecision] = useState('REFER');
  const [confidence, setConfidence] = useState(0.9);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!caseDetail) return null;

  // Pre-review checks
  const completenessScore = caseDetail.completeness?.score ?? 0;
  const isComplete = completenessScore >= 90;
  const hasUncertainties = (caseDetail.uncertainties || []).length > 0;
  const hasLineageBreak = (caseDetail.lineage || []).some((s) => s.is_broken);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setErrorMsg('Please enter a clinical rationale (at least 5 characters).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        case_id: caseDetail.case_id,
        reviewer_role: currentRole,
        decision,
        confidence: parseFloat(confidence),
        reason: reason.trim(),
      };

      const result = await api.submitReview(payload);
      if (result.success) {
        onReviewSubmitted && onReviewSubmitted(result.review);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to record review decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} color="#0284c7" />
            <span>Multidisciplinary Clinical Review – {caseDetail.case_id}</span>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Pre-Review Safety Assessment */}
            <div style={{ background: 'var(--slate-50)', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)', marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-800)', marginBottom: '8px' }}>
                Pre-Review Clinical Safety Validation:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                <div>
                  <strong>Completeness:</strong> {completenessScore}%{' '}
                  <span className={`badge ${isComplete ? 'badge-success' : 'badge-warning'}`}>
                    {isComplete ? 'Adequate' : 'Incomplete'}
                  </span>
                </div>
                <div>
                  <strong>Lineage Integrity:</strong>{' '}
                  <span className={`badge ${hasLineageBreak ? 'badge-danger' : 'badge-success'}`}>
                    {hasLineageBreak ? 'BROKEN' : 'Verified'}
                  </span>
                </div>
              </div>

              {hasUncertainties && (
                <div style={{ marginTop: '12px', background: 'var(--amber-50)', border: '1px solid var(--amber-200)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--amber-900)' }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <AlertTriangle size={14} /> Active Uncertainty Warnings Detected:
                  </div>
                  <ul style={{ paddingLeft: '16px' }}>
                    {caseDetail.uncertainties.map((u, i) => (
                      <li key={i}>{u.title}: {u.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {errorMsg && (
              <div style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-200)', color: 'var(--rose-800)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            {/* Decision Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-800)', marginBottom: '8px' }}>
                Clinical Decision Recommendation:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {[
                  { value: 'CLEAR', label: 'CLEAR', desc: 'Normal exam; 12-mo review' },
                  { value: 'REFER', label: 'REFER', desc: 'Refer to specialty clinic' },
                  { value: 'REVIEW_REQUIRED', label: 'REVIEW REQ', desc: 'Multidisciplinary conference' },
                  { value: 'INSUFFICIENT_EVIDENCE', label: 'INSUFFICIENT', desc: 'Missing tests / broken lineage' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    style={{
                      border: `1.5px solid ${decision === opt.value ? 'var(--primary-600)' : 'var(--slate-200)'}`,
                      background: decision === opt.value ? 'var(--primary-50)' : '#ffffff',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.82rem' }}>
                      <input
                        type="radio"
                        name="decision"
                        value={opt.value}
                        checked={decision === opt.value}
                        onChange={(e) => setDecision(e.target.value)}
                      />
                      <span>{opt.label}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Confidence Slider */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-800)' }}>
                  Diagnostic Decision Confidence:
                </label>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--primary-700)', fontSize: '0.9rem' }}>
                  {(confidence * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Clinical Rationale Text Area */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-800)', marginBottom: '6px' }}>
                Clinical Rationale & Action Plan (Mandatory):
              </label>
              <textarea
                className="form-control"
                style={{ padding: '10px', minHeight: '90px', resize: 'vertical' }}
                placeholder="Enter clinical rationale, evidence concordance notes, and next follow-up steps..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Send size={15} />
              <span>{isSubmitting ? 'Recording Decision...' : 'Submit Review & Log Audit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
