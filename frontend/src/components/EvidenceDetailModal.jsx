import React from 'react';
import { X, FileText, Clock, Shield, Database, CheckCircle2 } from 'lucide-react';
import { formatDate, getStatusBadgeClass } from '../utils/formatters';

export default function EvidenceDetailModal({ evidence, caseDetail, onClose }) {
  if (!evidence) return null;

  const rawId = evidence.imaging_id || evidence.pathology_id || evidence.molecular_id || evidence.specimen_id || evidence.review_id || evidence.event_id || evidence.raw_id;

  // Filter case audit logs related to this evidence or general case
  const relatedAudits = (caseDetail?.audit_history || []).filter(
    (a) => a.resource_type === evidence.evidence_kind || (a.details && a.details.includes(rawId))
  );

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="#0284c7" />
            <span>{evidence.event_type || 'Evidence Drill-Down'}</span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px', borderRadius: '50%' }}
            aria-label="Close Modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Metadata Overview */}
          <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>EVIDENCE ID</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--primary-700)' }}>{rawId || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>CASE ID</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{caseDetail?.case_id || evidence.case_id}</span>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>TIMESTAMP</span>
                <span>{formatDate(evidence.captured_at || evidence.result_at || evidence.collection_time || evidence.reviewed_at || evidence.timestamp)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>STATUS</span>
                <span className={`badge ${getStatusBadgeClass(evidence.status || evidence.quality_status || evidence.result_status || evidence.decision)}`}>
                  {evidence.status || evidence.quality_status || evidence.result_status || evidence.decision || 'RECORDED'}
                </span>
              </div>
            </div>
          </div>

          {/* Freshness & Quality Calculation */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="#0284c7" /> Freshness & Data Quality Engine
            </h4>
            <div style={{ fontSize: '0.83rem', color: 'var(--slate-700)', background: '#ffffff', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-sm)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>
                <strong>Calculated Freshness:</strong>{' '}
                <span className={`badge ${evidence.freshness === 'FRESH' ? 'badge-success' : 'badge-warning'}`}>
                  {evidence.freshness || 'FRESH'}
                </span>
              </div>
              <div>
                <strong>Freshness Threshold:</strong>{' '}
                {evidence.evidence_kind === 'IMAGING' ? '7 Days' : evidence.evidence_kind === 'MOLECULAR' ? '30 Days' : '14 Days'}
              </div>
              {evidence.quality_score !== undefined && (
                <div>
                  <strong>Quality Score:</strong> {evidence.quality_score.toFixed(1)} / 100.0{' '}
                  <span style={{ color: evidence.quality_score >= 60 ? 'var(--emerald-600)' : 'var(--rose-600)', fontWeight: 600 }}>
                    ({evidence.quality_score >= 60 ? 'Exceeds diagnostic threshold' : 'Sub-threshold: Reduced confidence'})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Specimen and Linkage Relationships */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={16} color="#059669" /> Lineage & Specimen Relationships
            </h4>
            <div style={{ fontSize: '0.83rem', color: 'var(--slate-700)', background: '#ffffff', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
              <div>
                <strong>Parent Case:</strong> {caseDetail?.case_id} ({caseDetail?.camp_location})
              </div>
              <div>
                <strong>Linked Specimen:</strong> {evidence.specimen_id || (caseDetail?.specimens?.[0]?.specimen_id) || 'Direct in-vivo imaging (No biospecimen)'}
              </div>
              <div>
                <strong>Operator / Station:</strong> {evidence.operator_id || evidence.reviewer || evidence.device_id || 'Field Health Station'}
              </div>
            </div>
          </div>

          {/* Detailed Findings Text */}
          {(evidence.findings_summary || evidence.finding || evidence.reason || evidence.summary) && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '8px' }}>
                Clinical Annotation / Finding
              </h4>
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-800)', background: 'var(--slate-50)', padding: '12px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary-600)' }}>
                {evidence.findings_summary || evidence.finding || evidence.reason || evidence.summary}
              </div>
            </div>
          )}

          {/* Audit History for this evidence */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={16} color="#64748b" /> Immutable Audit Verification Trail
            </h4>
            {relatedAudits.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {relatedAudits.map((a, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', background: 'var(--slate-50)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{a.action}</span>
                      <span style={{ color: 'var(--slate-500)', marginLeft: '8px' }}>by {a.user_role}</span>
                      <div style={{ color: 'var(--slate-600)', fontSize: '0.75rem', marginTop: '2px' }}>{a.details}</div>
                    </div>
                    <span style={{ color: 'var(--slate-400)', fontFamily: 'JetBrains Mono', fontSize: '0.7rem' }}>
                      {formatDate(a.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontStyle: 'italic' }}>
                Initial capture logged upon case intake.
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
