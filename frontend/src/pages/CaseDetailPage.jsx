import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
  Send,
  Eye,
  Building,
  User,
  Activity,
  Sparkles,
  CheckSquare
} from 'lucide-react';
import api from '../services/api';
import { formatDate, getStatusBadgeClass, getPriorityBadgeClass } from '../utils/formatters';
import { useRole } from '../context/RoleContext';

import UncertaintyBanner from '../components/UncertaintyBanner';
import EvidenceTimeline from '../components/EvidenceTimeline';
import SpecimenLineage from '../components/SpecimenLineage';
import EvidenceCards from '../components/EvidenceCards';
import EvidenceDetailModal from '../components/EvidenceDetailModal';
import ReviewModal from '../components/ReviewModal';

export default function CaseDetailPage({ caseId, onBack, onSelectCase }) {
  const { currentRole, permissions } = useRole();
  const [caseDetail, setCaseDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    if (caseId) {
      loadCaseData();
    }
  }, [caseId, currentRole]);

  const loadCaseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCaseDetail(caseId, currentRole);
      setCaseDetail(data);
    } catch (err) {
      setError(err.message || 'Unable to retrieve case details.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = (newReview) => {
    // Reload case data to reflect new review decision and audit entry
    loadCaseData();
  };

  if (loading) {
    return (
      <div className="page-container state-container">
        <Activity size={36} className="state-icon pulse" color="#0284c7" />
        <div className="state-title">Assembling Unified Evidence Timeline...</div>
        <div className="state-desc">Synthesizing imaging, specimen custody, pathology, and molecular records for {caseId}.</div>
      </div>
    );
  }

  if (error || !caseDetail) {
    return (
      <div className="page-container state-container">
        <AlertTriangle size={36} className="state-icon" color="#e11d48" />
        <div className="state-title">Case Not Found</div>
        <div className="state-desc">{error || `No data exists for ${caseId}`}</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Case List
          </button>
          <button className="btn btn-primary" onClick={loadCaseData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const score = caseDetail.completeness?.score ?? 0;

  return (
    <div className="page-container">
      {/* Navigation & Header */}
      <div style={{ marginBottom: '16px' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: '12px' }}>
          <ArrowLeft size={14} /> Back to Case List
        </button>

        <div className="page-header" style={{ marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 className="page-title" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {caseDetail.case_id}
              </h1>
              <span className={`badge ${getPriorityBadgeClass(caseDetail.priority)}`}>
                {caseDetail.priority} Priority
              </span>
              <span className={`badge ${getStatusBadgeClass(caseDetail.screening_status)}`}>
                {caseDetail.screening_status}
              </span>
              <span className="badge badge-neutral">
                {caseDetail.department}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', color: 'var(--slate-500)', fontSize: '0.85rem', marginTop: '6px' }}>
              <span><strong>Camp:</strong> {caseDetail.camp_location}</span>
              <span>•</span>
              <span><strong>Opened:</strong> {formatDate(caseDetail.case_created_at)}</span>
              <span>•</span>
              <span><strong>Assignee:</strong> {caseDetail.assigned_reviewer}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={() => setIsReviewModalOpen(true)}
              disabled={!permissions.canReviewCase}
              title={!permissions.canReviewCase ? `Role '${currentRole}' cannot submit clinical decisions` : undefined}
            >
              <CheckSquare size={16} />
              <span>Start Case Review</span>
            </button>
          </div>
        </div>
      </div>

      {/* Uncertainty & Risk Warning Banners */}
      <UncertaintyBanner alerts={caseDetail.uncertainties} />

      {/* Completeness Meter Card */}
      <div className="completeness-box">
        <div className="completeness-header">
          <div>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-900)' }}>
              Multidisciplinary Evidence Completeness Score
            </span>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
              Weighted checklist ensuring all required clinical evidence is verified before final discharge.
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'JetBrains Mono', color: score >= 90 ? 'var(--emerald-600)' : score >= 70 ? 'var(--amber-600)' : 'var(--rose-600)' }}>
            {score.toFixed(0)}%
          </div>
        </div>

        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{
              width: `${score}%`,
              backgroundColor: score >= 90 ? 'var(--emerald-500)' : score >= 70 ? 'var(--amber-500)' : 'var(--rose-500)'
            }}
          />
        </div>

        {/* Itemized Points Checklist */}
        <div className="completeness-checklist">
          {caseDetail.completeness?.items?.map((item) => (
            <div
              key={item.name}
              className={`checklist-item ${item.available ? 'item-available' : 'item-missing'}`}
            >
              <span>{item.available ? '✓' : '✗'}</span>
              <span>{item.name} ({item.points_awarded.toFixed(0)}/{item.max_points.toFixed(0)} pts)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Specimen Lineage Flowchart */}
      <SpecimenLineage steps={caseDetail.lineage} />

      {/* Multidisciplinary Evidence Modular Cards Grid */}
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '12px' }}>
          Multidisciplinary Evidence Modalities
        </h3>
        <EvidenceCards
          imaging={caseDetail.imaging}
          pathology={caseDetail.pathology}
          molecular={caseDetail.molecular}
          specimens={caseDetail.specimens}
          reviews={caseDetail.reviews}
          onViewDetails={(ev) => setSelectedEvidence(ev)}
        />
      </div>

      {/* Unified Chronological Evidence Timeline */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Clock size={18} color="#0284c7" />
            <span>Unified Chronological Evidence Timeline</span>
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
            Strict chronological sequence of all field events & diagnostic milestones
          </span>
        </div>
        <div className="card-body">
          <EvidenceTimeline
            events={caseDetail.timeline}
            onViewDetails={(ev) => setSelectedEvidence(ev)}
          />
        </div>
      </div>

      {/* Drill-down Detail Modal */}
      {selectedEvidence && (
        <EvidenceDetailModal
          evidence={selectedEvidence}
          caseDetail={caseDetail}
          onClose={() => setSelectedEvidence(null)}
        />
      )}

      {/* Review Submission Modal */}
      {isReviewModalOpen && (
        <ReviewModal
          caseDetail={caseDetail}
          onClose={() => setIsReviewModalOpen(false)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}
