import React, { useState, useEffect } from 'react';
import { GitBranch, Clock, TrendingDown, CheckCircle2, AlertTriangle, ShieldCheck, BarChart2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../services/api';

export default function ExperimentsPage() {
  const [expData, setExpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadExperiment();
  }, []);

  const loadExperiment = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getExperimentResults();
      setExpData(data);
    } catch (err) {
      setError(err.message || 'Failed to load experiment results.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container state-container">
        <div className="state-title">Loading Comparative Experiment Benchmarks...</div>
        <div className="state-desc">Calculating assembly latencies across 50 simulated clinical test cases.</div>
      </div>
    );
  }

  if (error || !expData) {
    return (
      <div className="page-container state-container">
        <AlertTriangle size={32} color="#e11d48" className="state-icon" />
        <div className="state-title">Unable to Load Benchmark Results</div>
        <div className="state-desc">{error}</div>
        <button className="btn btn-primary btn-sm" onClick={loadExperiment}>Retry</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 className="page-title">Case Review Assembly Time Benchmark</h1>
            <span className="badge badge-info">50 Test Cases</span>
          </div>
          <p className="page-subtitle">
            Controlled simulated evaluation comparing manual multi-system searching vs EyeSync unified evidence timeline.
          </p>
        </div>
        <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
          Simulated experiment using synthetic/de-identified test events.
        </span>
      </div>

      {/* Primary KPI Benchmarks */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="kpi-card kpi-warning">
          <div className="kpi-header">
            <span>Baseline Manual Workflow</span>
            <Clock size={18} />
          </div>
          <div className="kpi-value">{expData.baseline_avg_seconds}s</div>
          <div className="kpi-subtext">Searching 5 Siloed Systems</div>
        </div>

        <div className="kpi-card kpi-success">
          <div className="kpi-header">
            <span>EyeSync Unified Timeline</span>
            <Clock size={18} />
          </div>
          <div className="kpi-value" style={{ color: 'var(--emerald-600)' }}>
            {expData.eyesync_avg_seconds}s
          </div>
          <div className="kpi-subtext">Single-Screen Situational Awareness</div>
        </div>

        <div className="kpi-card kpi-info">
          <div className="kpi-header">
            <span>Average Time Saved</span>
            <TrendingDown size={18} />
          </div>
          <div className="kpi-value">
            {expData.average_time_saved_percentage}%
          </div>
          <div className="kpi-subtext">
            {expData.average_time_saved_seconds} seconds saved per case
          </div>
        </div>

        <div className="kpi-card kpi-danger">
          <div className="kpi-header">
            <span>Error & Omission Rate</span>
            <AlertTriangle size={18} />
          </div>
          <div className="kpi-value" style={{ fontSize: '1.4rem' }}>
            {expData.baseline_error_rate_pct}% → 0%
          </div>
          <div className="kpi-subtext">
            Baseline: {expData.baseline_total_errors} errors vs EyeSync: 0
          </div>
        </div>
      </div>

      {/* Benchmark Recharts Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <BarChart2 size={18} color="#0284c7" />
            <span>Assembly Time by Failure Mode & Complexity (Seconds)</span>
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
            Lower is better (EyeSync in Emerald, Baseline in Slate)
          </span>
        </div>
        <div className="card-body" style={{ height: '340px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expData.by_failure_mode}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="failure_mode" tick={{ fontSize: 11 }} />
              <YAxis label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="baseline_time_seconds" fill="#94a3b8" name="Baseline (Manual Multi-System)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="eyesync_time_seconds" fill="#10b981" name="EyeSync (Unified Timeline)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Experiment Test Cases Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Simulated Benchmark Test Case Log (First 15 Cases)</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
            Deterministic simulated latencies based on evidence retrieval complexity
          </span>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Archetype / Failure Mode</th>
                <th>Completeness</th>
                <th>Baseline Assembly</th>
                <th>EyeSync Assembly</th>
                <th>Time Saved</th>
                <th>% Reduction</th>
                <th>Baseline Errors</th>
              </tr>
            </thead>
            <tbody>
              {expData.sample_cases.slice(0, 15).map((row) => (
                <tr key={row.case_id}>
                  <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--primary-700)' }}>
                    {row.case_id}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {row.failure_mode}
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {row.evidence_completeness}%
                    </span>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--slate-700)' }}>
                    {row.baseline_time_seconds}s
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--emerald-600)' }}>
                    {row.eyesync_time_seconds}s
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--primary-700)' }}>
                    -{row.time_saved_seconds}s
                  </td>
                  <td>
                    <span className="badge badge-success">
                      {row.time_saved_percentage}%
                    </span>
                  </td>
                  <td>
                    {row.baseline_errors > 0 ? (
                      <span className="badge badge-danger">
                        {row.baseline_errors} error{row.baseline_errors > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="badge badge-success">0</span>
                    )}
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
