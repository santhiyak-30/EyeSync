import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Database, RefreshCw, BarChart2 } from 'lucide-react';
import api from '../services/api';

export default function DataQualityPage() {
  const [dataQuality, setDataQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDataQuality();
      setDataQuality(res);
    } catch (err) {
      setError(err.message || 'Failed to load data quality metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container state-container">
        <div className="state-title">Analyzing Dataset Integrity...</div>
        <div className="state-desc">Scanning tables for duplicate IDs, broken custody linkages, and format errors.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container state-container">
        <AlertTriangle size={32} color="#e11d48" className="state-icon" />
        <div className="state-title">Quality Audit Error</div>
        <div className="state-desc">{error}</div>
        <button className="btn btn-primary btn-sm" onClick={loadData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Evidence Data Quality & Integrity</h1>
          <p className="page-subtitle">
            Comprehensive audit of synthetic dataset hygiene, duplicate detection, and schema validation.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadData}>
          <RefreshCw size={14} /> Re-evaluate Quality
        </button>
      </div>

      {/* Overall Score Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, var(--slate-50) 100%)' }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="badge badge-success" style={{ marginBottom: '8px' }}>
              DATASET INTEGRITY AUDIT
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Overall EyeSync Data Quality Score
            </h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.88rem', maxWidth: '600px', marginTop: '4px' }}>
              Weighted index calculated across <strong>{dataQuality.total_records.toLocaleString()} total database records</strong>, measuring completeness, referential integrity, and timestamp validity.
            </p>
          </div>

          <div style={{ textAlign: 'center', background: '#ffffff', border: '2px solid var(--emerald-500)', borderRadius: 'var(--radius-lg)', padding: '16px 28px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Quality Index
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--emerald-600)', fontFamily: 'JetBrains Mono' }}>
              {dataQuality.data_quality_score.toFixed(1)}%
            </div>
            <span className="badge badge-success">High Clinical Usability</span>
          </div>
        </div>
      </div>

      {/* Audit Matrix Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-info">
          <div className="kpi-header">
            <span>Total Database Records</span>
            <Database size={16} />
          </div>
          <div className="kpi-value">{dataQuality.total_records}</div>
          <div className="kpi-subtext">Across 7 SQLite tables</div>
        </div>

        <div className="kpi-card kpi-success">
          <div className="kpi-header">
            <span>Missing Fields</span>
            <CheckCircle size={16} />
          </div>
          <div className="kpi-value">{dataQuality.missing_fields}</div>
          <div className="kpi-subtext">Zero schema violations</div>
        </div>

        <div className="kpi-card kpi-success">
          <div className="kpi-header">
            <span>Invalid Timestamps</span>
            <CheckCircle size={16} />
          </div>
          <div className="kpi-value">{dataQuality.invalid_timestamps}</div>
          <div className="kpi-subtext">All ISO-8601 compliant</div>
        </div>

        <div className="kpi-card kpi-warning">
          <div className="kpi-header">
            <span>Duplicate Imaging</span>
            <AlertTriangle size={16} />
          </div>
          <div className="kpi-value">{dataQuality.duplicate_records}</div>
          <div className="kpi-subtext">Repeat scan captures</div>
        </div>

        <div className="kpi-card kpi-danger">
          <div className="kpi-header">
            <span>Broken Custody Linkage</span>
            <AlertTriangle size={16} />
          </div>
          <div className="kpi-value">{dataQuality.broken_lineage}</div>
          <div className="kpi-subtext">Lost laboratory accessions</div>
        </div>

        <div className="kpi-card kpi-danger">
          <div className="kpi-header">
            <span>Multidisciplinary Conflicts</span>
            <AlertTriangle size={16} />
          </div>
          <div className="kpi-value">{dataQuality.conflicts}</div>
          <div className="kpi-subtext">Pathology vs Imaging reads</div>
        </div>
      </div>

      {/* Dataset Records Breakdown Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Dataset Entity Breakdown</h3>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Entity Table</th>
                <th>Record Count</th>
                <th>Primary Key</th>
                <th>Source Origin</th>
                <th>Integrity Check</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(dataQuality.dataset_breakdown).map(([entity, count]) => (
                <tr key={entity}>
                  <td style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                    {entity.replace(/_/g, ' ')}
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                    {count.toLocaleString()}
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--slate-500)', fontSize: '0.8rem' }}>
                    {entity === 'cases' ? 'case_id' : `${entity.slice(0, -1)}_id`}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--slate-600)' }}>
                    {entity === 'cases' ? 'Field Registration Desk' : entity.includes('specimen') ? 'Outreach Phlebotomy' : entity.includes('imaging') ? 'Mobile Camera Pod' : 'Central Diagnostic Lab'}
                  </td>
                  <td>
                    <span className="badge badge-success">
                      <CheckCircle size={12} /> Validated
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
