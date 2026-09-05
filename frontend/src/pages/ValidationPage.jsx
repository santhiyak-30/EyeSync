import React, { useState, useEffect } from 'react';
import { Users, Star, MessageSquare, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function ValidationPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const data = await api.getValidationFeedback();
      setFeedback(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderRatingBar = (score, max = 5) => {
    const pct = (score / max) * 100;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
        <div className="progress-bar-bg" style={{ height: '6px', margin: 0, flex: 1 }}>
          <div className="progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: 'var(--emerald-500)' }} />
        </div>
        <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '0.8rem', color: 'var(--slate-800)' }}>
          {score.toFixed(1)}/5.0
        </span>
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Screening Camp Stakeholder Validation</h1>
          <p className="page-subtitle">
            Multidisciplinary clinician evaluation of timeline usability, uncertainty communication, and review efficiency.
          </p>
        </div>
      </div>

      {/* Required Prototype Disclosure */}
      <div style={{ background: 'var(--indigo-50)', border: '1px solid var(--indigo-200)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertCircle size={20} color="#4f46e5" />
        <span style={{ fontSize: '0.85rem', color: 'var(--indigo-900)' }}>
          <strong>Evaluation Context:</strong> Prototype stakeholder validation / simulated feedback unless real participants are added. Ratings reflect structured heuristic evaluations across 4 representative screening roles.
        </span>
      </div>

      {/* Stakeholder Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
        {feedback.map((item, idx) => (
          <div key={idx} className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <div>
                <span className="badge badge-info" style={{ marginBottom: '4px' }}>
                  {item.role}
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                  {item.stakeholder_name}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                  Overall Score
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--emerald-600)', fontFamily: 'JetBrains Mono' }}>
                  {item.overall_usefulness.toFixed(1)} / 5.0
                </div>
              </div>
            </div>

            <div className="card-body">
              {/* Usability Rubric Metrics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem' }}>
                  <span style={{ color: 'var(--slate-600)' }}>Ease of Finding Evidence:</span>
                  {renderRatingBar(item.ease_of_finding_evidence)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem' }}>
                  <span style={{ color: 'var(--slate-600)' }}>Clarity of Missing Evidence:</span>
                  {renderRatingBar(item.clarity_of_missing_evidence)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem' }}>
                  <span style={{ color: 'var(--slate-600)' }}>Clarity of Stale Evidence:</span>
                  {renderRatingBar(item.clarity_of_stale_evidence)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem' }}>
                  <span style={{ color: 'var(--slate-600)' }}>Confidence in Review Workflow:</span>
                  {renderRatingBar(item.confidence_in_review)}
                </div>
              </div>

              {/* Qualitative Quote */}
              <div style={{ background: 'var(--slate-50)', borderLeft: '3px solid var(--primary-600)', padding: '12px 14px', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontSize: '0.84rem', color: 'var(--slate-700)', fontStyle: 'italic', lineHeight: 1.45 }}>
                <MessageSquare size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary-600)' }} />
                "{item.comment}"
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
