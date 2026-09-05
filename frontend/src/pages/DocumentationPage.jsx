import React, { useState } from 'react';
import { BookOpen, Shield, Network, Code2, Layers, Lock } from 'lucide-react';

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState('privacy');

  const tabs = [
    { id: 'privacy', label: 'Privacy by Design', icon: Lock },
    { id: 'architecture', label: 'System Architecture', icon: Layers },
    { id: 'freshness', label: 'Freshness & Completeness', icon: Code2 },
    { id: 'workflow', label: 'Camp Operations', icon: Network },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Technical Documentation & Protocols</h1>
          <p className="page-subtitle">
            System architectural specifications, clinical safety protocols, and privacy-by-design standards.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--slate-200)', marginBottom: '24px' }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--primary-600)' : 'transparent'}`,
                color: isActive ? 'var(--primary-700)' : 'var(--slate-500)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <Icon size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Tab 1: Privacy by Design */}
      {activeTab === 'privacy' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Lock size={18} color="#0284c7" />
              <span>Privacy-by-Design Architectural Guarantees</span>
            </h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--slate-700)' }}>
            <div style={{ background: 'var(--primary-50)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-100)' }}>
              <strong>Zero Real Patient Identifiers:</strong> EyeSync strictly prohibits real names, social security numbers, hospital registration IDs, phone numbers, postal addresses, or raw facial photos. Every record uses deterministic synthetic keys (e.g. <code>CASE-0001</code>).
            </div>

            <h4 style={{ fontWeight: 700, color: 'var(--slate-900)' }}>Core Privacy Pillars</h4>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Data Minimisation:</strong> The schema only stores clinical evidence necessary for eye screening triage (modality, quality, finding category, timestamps). Extraneous demographic fields are deliberately omitted.</li>
              <li><strong>Role-Based Access Control (RBAC):</strong> Views are tailored by operational necessity. Field Camp Coordinators see completeness and transport progress without unnecessary exposure to clinical histological text.</li>
              <li><strong>Immutable Audit Logging:</strong> Every case inspection, review submission, and detected anomaly is recorded with timestamp and active role into an append-only audit trail.</li>
              <li><strong>Offline SQLite Local Containment:</strong> Zero external cloud databases, third-party authentication services, or tracking analytics. All data stays strictly on the host operating machine.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Content Tab 2: System Architecture */}
      {activeTab === 'architecture' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Layers size={18} color="#059669" />
              <span>Full-Stack Architecture & Dataflow</span>
            </h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem', lineHeight: 1.6 }}>
            <p>
              EyeSync utilizes a lightweight, high-performance architecture engineered specifically for temporary field camp deployments without reliable internet access:
            </p>

            <div style={{ background: 'var(--slate-900)', color: '#e2e8f0', padding: '16px', borderRadius: 'var(--radius-md)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', lineHeight: 1.7 }}>
              <div>[React + Vite Frontend (Port 5173)]</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;│ (REST HTTP / Axios via centralized api.js)</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;▼</div>
              <div>[FastAPI Backend Server (Port 8000)]</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;├── Freshness & Completeness Scoring Services</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;├── Specimen Lineage Tree Assembler</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;├── Uncertainty & Conflict Detection Rules</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;└── Benchmark Simulation Engine</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;│ (SQLAlchemy ORM)</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;▼</div>
              <div>[Local SQLite Database (eyesync.db)] &lt;── [Synthetic CSV Seeds]</div>
            </div>
          </div>
        </div>
      )}

      {/* Content Tab 3: Freshness & Completeness Engine */}
      {activeTab === 'freshness' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Code2 size={18} color="#6366f1" />
              <span>Evidence Freshness & Completeness Calculation Models</span>
            </h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem', lineHeight: 1.6 }}>
            <h4 style={{ fontWeight: 700, color: 'var(--slate-900)' }}>1. Evidence Completeness Scoring Model (0–100 Scale)</h4>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Evidence Modality</th>
                    <th>Points</th>
                    <th>Condition Required</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Imaging Evidence</strong></td>
                    <td>30 Points</td>
                    <td>At least one valid scan with quality != MISSING</td>
                  </tr>
                  <tr>
                    <td><strong>Pathology Results</strong></td>
                    <td>30 Points</td>
                    <td>Histology result recorded with status != PENDING</td>
                  </tr>
                  <tr>
                    <td><strong>Molecular Testing</strong></td>
                    <td>20 Points</td>
                    <td>Viral PCR / cytokine panel recorded with status != MISSING</td>
                  </tr>
                  <tr>
                    <td><strong>Specimen Lineage</strong></td>
                    <td>10 Points</td>
                    <td>Unbroken chain of custody (status != LOST_LINKAGE)</td>
                  </tr>
                  <tr>
                    <td><strong>Clinical Review</strong></td>
                    <td>10 Points</td>
                    <td>Formal review decision recorded with rationale</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '12px' }}>2. Configurable Freshness Engine</h4>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>Imaging Freshness:</strong> Fresh &lt; 7 days; Stale &ge; 7 days.</li>
              <li><strong>Pathology Freshness:</strong> Fresh &lt; 14 days; Stale &ge; 14 days.</li>
              <li><strong>Molecular Freshness:</strong> Fresh &lt; 30 days; Stale &ge; 30 days (reflecting pathogen clearance kinetics).</li>
            </ul>
          </div>
        </div>
      )}

      {/* Content Tab 4: Camp Operations */}
      {activeTab === 'workflow' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Network size={18} color="#d97706" />
              <span>Field Screening Camp Operational Guidelines</span>
            </h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem', lineHeight: 1.6 }}>
            <p>
              Temporary eye screening camps face extreme logistical challenges: high patient throughput (100–300 patients per day), limited electrical grid stability, and reliance on refrigerated transport to move specimens to regional laboratories.
            </p>
            <p>
              <strong>Critical Risk Protocols:</strong>
            </p>
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Image Quality Threshold:</strong> Technicians must verify quality scores before patients leave the screening pod. Any score below 60 must be re-captured immediately.</li>
              <li><strong>Specimen Temperature Tracking:</strong> Micro-tubes must be logged into the cold container before the scheduled courier departure.</li>
              <li><strong>Discrepancy Resolution:</strong> Any case where Pathology reports Severe Abnormality and Imaging reports Normal must be held for multidisciplinary consensus review.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
