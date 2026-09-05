import React from 'react';
import { Camera, Microscope, Dna, TestTube, CheckSquare, Eye, Shield } from 'lucide-react';
import { formatDate, getStatusBadgeClass } from '../utils/formatters';
import { useRole } from '../context/RoleContext';

export default function EvidenceCards({
  imaging = [],
  pathology = [],
  molecular = [],
  specimens = [],
  reviews = [],
  onViewDetails
}) {
  const { permissions, currentRole } = useRole();

  const img = imaging[0];
  const path = pathology[0];
  const mol = molecular[0];
  const spec = specimens[0];
  const rev = reviews[0];

  return (
    <div className="evidence-grid">
      {/* 1. Imaging Card */}
      <div className="evidence-card">
        <div>
          <div className="evidence-card-header">
            <div className="evidence-card-title">
              <Camera size={18} color="#0284c7" />
              <span>Imaging Evidence</span>
              {imaging.length > 1 && (
                <span className="badge badge-warning" style={{ fontSize: '0.68rem', marginLeft: '6px' }}>
                  {imaging.length} Acquisitions (Repeat)
                </span>
              )}
            </div>
            {img ? (
              <span className={`badge ${getStatusBadgeClass(img.quality_status)}`}>
                {img.quality_status}
              </span>
            ) : (
              <span className="badge badge-danger">MISSING</span>
            )}
          </div>

          {imaging.length > 0 ? (
            imaging.map((imgItem, idx) => (
              <div
                key={imgItem.imaging_id || idx}
                style={idx > 0 ? { marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed var(--slate-200)' } : {}}
              >
                {imaging.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className={`badge ${idx === 0 ? 'badge-neutral' : 'badge-warning'}`} style={{ fontSize: '0.68rem' }}>
                      {idx === 0 ? `Primary: ${imgItem.imaging_id}` : `Repeat Acquisition: ${imgItem.imaging_id}`}
                    </span>
                    <span className={`badge ${getStatusBadgeClass(imgItem.quality_status)}`} style={{ fontSize: '0.68rem' }}>
                      {imgItem.quality_status}
                    </span>
                  </div>
                )}
                <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>Modality:</strong> {imgItem.modality}</div>
                  <div>
                    <strong>Quality Score:</strong> {imgItem.quality_score?.toFixed(0)}/100{' '}
                    {imgItem.quality_score < 60 && <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Sub-threshold</span>}
                  </div>
                  <div><strong>Captured:</strong> {formatDate(imgItem.captured_at)}</div>
                  <div>
                    <strong>Freshness:</strong>{' '}
                    <span className={`badge ${imgItem.freshness === 'FRESH' ? 'badge-success' : 'badge-warning'}`}>
                      {imgItem.freshness || 'FRESH'}
                    </span>
                  </div>
                  <div><strong>Device:</strong> {imgItem.device_id}</div>
                  {permissions.canViewClinicalFindings ? (
                    <div style={{ marginTop: '6px', color: 'var(--slate-600)', fontSize: '0.8rem', fontStyle: 'italic', background: 'var(--slate-50)', padding: '6px', borderRadius: '4px' }}>
                      "{imgItem.findings_summary || 'No detailed annotations recorded.'}"
                    </div>
                  ) : (
                    <div style={{ marginTop: '6px', color: 'var(--slate-400)', fontSize: '0.78rem' }}>
                      <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      Clinical annotation masked for {currentRole}.
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '10px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => onViewDetails && onViewDetails({ ...imgItem, event_type: 'Imaging Evidence', evidence_kind: 'IMAGING' })}
                  >
                    <Eye size={13} /> View {imgItem.imaging_id} Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', padding: '12px 0' }}>
              No imaging records found for this case.
            </div>
          )}
        </div>
      </div>

      {/* 2. Pathology Card */}
      <div className="evidence-card">
        <div>
          <div className="evidence-card-header">
            <div className="evidence-card-title">
              <Microscope size={18} color="#059669" />
              <span>Pathology Results</span>
            </div>
            {path ? (
              <span className={`badge ${getStatusBadgeClass(path.status)}`}>
                {path.status}
              </span>
            ) : (
              <span className="badge badge-warning">PENDING</span>
            )}
          </div>

          {path ? (
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Pathology ID:</strong> {path.pathology_id}</div>
              <div>
                <strong>Severity:</strong>{' '}
                <span className={`badge ${path.severity === 'SEVERE' ? 'badge-danger' : path.severity === 'MODERATE' ? 'badge-warning' : 'badge-neutral'}`}>
                  {path.severity}
                </span>
              </div>
              <div><strong>Result Date:</strong> {formatDate(path.result_at)}</div>
              <div>
                <strong>Freshness:</strong>{' '}
                <span className={`badge ${path.freshness === 'FRESH' ? 'badge-success' : 'badge-warning'}`}>
                  {path.freshness || 'FRESH'}
                </span>
              </div>
              {permissions.canViewClinicalFindings ? (
                <div style={{ marginTop: '6px', color: 'var(--slate-600)', fontSize: '0.8rem', fontStyle: 'italic', background: 'var(--slate-50)', padding: '6px', borderRadius: '4px' }}>
                  "{path.finding}"
                </div>
              ) : (
                <div style={{ marginTop: '6px', color: 'var(--slate-400)', fontSize: '0.78rem' }}>
                  <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Cytology findings masked for {currentRole}.
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', padding: '12px 0' }}>
              Awaiting specimen histology processing.
            </div>
          )}
        </div>

        <div style={{ marginTop: '14px', borderTop: '1px solid var(--slate-100)', paddingTop: '10px' }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
            onClick={() => onViewDetails && onViewDetails({ ...path, event_type: 'Pathology Result', evidence_kind: 'PATHOLOGY' })}
            disabled={!path}
          >
            <Eye size={13} /> View Pathology Details
          </button>
        </div>
      </div>

      {/* 3. Molecular Card */}
      <div className="evidence-card">
        <div>
          <div className="evidence-card-header">
            <div className="evidence-card-title">
              <Dna size={18} color="#6366f1" />
              <span>Molecular Testing</span>
            </div>
            {mol ? (
              <span className={`badge ${getStatusBadgeClass(mol.result_status)}`}>
                {mol.result_status}
              </span>
            ) : (
              <span className="badge badge-warning">MISSING</span>
            )}
          </div>

          {mol ? (
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Molecular ID:</strong> {mol.molecular_id}</div>
              <div><strong>Assay:</strong> {mol.test_type}</div>
              <div><strong>Confidence:</strong> {(mol.confidence * 100).toFixed(0)}%</div>
              <div><strong>Result Date:</strong> {formatDate(mol.result_at)}</div>
              <div>
                <strong>Freshness:</strong>{' '}
                <span className={`badge ${mol.freshness === 'FRESH' ? 'badge-success' : 'badge-warning'}`}>
                  {mol.freshness || 'FRESH'}
                </span>
                {mol.freshness === 'STALE' && (
                  <span className="badge badge-warning" style={{ fontSize: '0.65rem', marginLeft: '4px' }}>
                    &gt;30 Days
                  </span>
                )}
              </div>
              {permissions.canViewClinicalFindings ? (
                <div style={{ marginTop: '6px', color: 'var(--slate-600)', fontSize: '0.8rem', fontStyle: 'italic', background: 'var(--slate-50)', padding: '6px', borderRadius: '4px' }}>
                  "{mol.finding}"
                </div>
              ) : (
                <div style={{ marginTop: '6px', color: 'var(--slate-400)', fontSize: '0.78rem' }}>
                  <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Assay findings masked for {currentRole}.
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', padding: '12px 0' }}>
              <div style={{ color: 'var(--amber-700)', fontWeight: 600, marginBottom: '4px' }}>
                Molecular evidence unavailable
              </div>
              Do not assume negative finding in absence of test results.
            </div>
          )}
        </div>

        <div style={{ marginTop: '14px', borderTop: '1px solid var(--slate-100)', paddingTop: '10px' }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
            onClick={() => onViewDetails && onViewDetails({ ...mol, event_type: 'Molecular Result', evidence_kind: 'MOLECULAR' })}
            disabled={!mol}
          >
            <Eye size={13} /> View Molecular Details
          </button>
        </div>
      </div>

      {/* 4. Specimen Custody Card */}
      <div className="evidence-card">
        <div>
          <div className="evidence-card-header">
            <div className="evidence-card-title">
              <TestTube size={18} color="#d97706" />
              <span>Specimen Custody</span>
            </div>
            {spec ? (
              <span className={`badge ${getStatusBadgeClass(spec.processing_status)}`}>
                {spec.processing_status}
              </span>
            ) : (
              <span className="badge badge-neutral">NONE</span>
            )}
          </div>

          {spec ? (
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Specimen ID:</strong> {spec.specimen_id}</div>
              <div><strong>Collection Site:</strong> {spec.collection_site}</div>
              <div><strong>Collected:</strong> {formatDate(spec.collection_time)}</div>
              <div><strong>Lab Receipt:</strong> {formatDate(spec.received_time) || 'Pending'}</div>
              <div>
                <strong>Lineage Status:</strong>{' '}
                {spec.is_lineage_broken ? (
                  <span className="badge badge-danger">BROKEN</span>
                ) : (
                  <span className="badge badge-success">VERIFIED</span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', padding: '12px 0' }}>
              No biospecimen collected.
            </div>
          )}
        </div>

        <div style={{ marginTop: '14px', borderTop: '1px solid var(--slate-100)', paddingTop: '10px' }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
            onClick={() => onViewDetails && onViewDetails({ ...spec, event_type: 'Specimen Custody', evidence_kind: 'SPECIMEN' })}
            disabled={!spec}
          >
            <Eye size={13} /> View Custody Details
          </button>
        </div>
      </div>

      {/* 5. Clinical Review Card */}
      <div className="evidence-card">
        <div>
          <div className="evidence-card-header">
            <div className="evidence-card-title">
              <CheckSquare size={18} color="#0f172a" />
              <span>Clinical Decision</span>
            </div>
            {rev ? (
              <span className={`badge ${getStatusBadgeClass(rev.decision)}`}>
                {rev.decision}
              </span>
            ) : (
              <span className="badge badge-neutral">PENDING REVIEW</span>
            )}
          </div>

          {rev ? (
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Review ID:</strong> {rev.review_id}</div>
              <div><strong>Reviewer Role:</strong> {rev.reviewer_role}</div>
              <div><strong>Decision:</strong> {rev.decision}</div>
              <div><strong>Confidence:</strong> {(rev.confidence * 100).toFixed(0)}%</div>
              <div><strong>Reviewed At:</strong> {formatDate(rev.reviewed_at)}</div>
              <div style={{ marginTop: '6px', color: 'var(--slate-600)', fontSize: '0.8rem', fontStyle: 'italic', background: 'var(--slate-50)', padding: '6px', borderRadius: '4px' }}>
                "{rev.reason}"
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', padding: '12px 0' }}>
              Case pending formal clinical review.
            </div>
          )}
        </div>

        <div style={{ marginTop: '14px', borderTop: '1px solid var(--slate-100)', paddingTop: '10px' }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
            onClick={() => onViewDetails && onViewDetails({ ...rev, event_type: 'Review Decision', evidence_kind: 'REVIEW' })}
            disabled={!rev}
          >
            <Eye size={13} /> View Review Audit
          </button>
        </div>
      </div>
    </div>
  );
}
