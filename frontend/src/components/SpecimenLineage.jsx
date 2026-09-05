import React from 'react';
import { ArrowRight, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export default function SpecimenLineage({ steps = [] }) {
  if (!steps || steps.length === 0) return null;

  const hasBrokenStep = steps.some((s) => s.is_broken);

  return (
    <div className="lineage-flow-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-800)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Specimen Chain of Custody & Laboratory Lineage</span>
        </h4>
        {hasBrokenStep ? (
          <span className="badge badge-danger" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
            <XCircle size={14} /> LINEAGE BROKEN
          </span>
        ) : (
          <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
            <CheckCircle size={14} /> Complete Lineage
          </span>
        )}
      </div>

      <div className="lineage-steps">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={step.step_number}>
              <div className={`lineage-step-node ${step.is_broken ? 'step-broken' : ''}`}>
                <div>
                  <div className="lineage-step-header">
                    <span className="step-num">Step {step.step_number}</span>
                    {step.is_broken ? (
                      <span className="badge badge-danger">Broken</span>
                    ) : step.status === 'OK' ? (
                      <span className="badge badge-success">OK</span>
                    ) : (
                      <span className="badge badge-warning">{step.status}</span>
                    )}
                  </div>

                  <div className="step-name">{step.step_name}</div>
                  
                  {step.entity_id && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>
                      {step.entity_id}
                    </div>
                  )}

                  <div className="step-details">{step.details}</div>
                </div>

                {step.timestamp && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '8px', borderTop: '1px solid var(--slate-200)', paddingTop: '4px' }}>
                    {formatDate(step.timestamp)}
                  </div>
                )}
              </div>

              {!isLast && (
                <div className="lineage-arrow">
                  <ArrowRight size={18} color={steps[idx + 1]?.is_broken ? '#ef4444' : '#94a3b8'} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {hasBrokenStep && (
        <div style={{ marginTop: '14px', background: 'var(--rose-50)', border: '1px solid var(--rose-200)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.82rem', color: 'var(--rose-800)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="#e11d48" />
          <span>
            <strong>Chain of Custody Alert:</strong> One or more processing stages failed to authenticate physical specimen custody. Do not commit definitive clinical diagnoses based on unverified lab accessions.
          </span>
        </div>
      )}
    </div>
  );
}
