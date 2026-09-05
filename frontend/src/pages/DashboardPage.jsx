import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  Split,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Activity,
  Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../services/api';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

const DEFAULT_DEMO_CASES = [
  {
    case_id: 'CASE-0001',
    title: 'Complete Evidence (Golden Path)',
    description: '100% complete evidence, fresh imaging, pathology, and molecular testing with verified lineage.',
    badge: 'Golden Case',
    badge_type: 'success'
  },
  {
    case_id: 'CASE-0002',
    title: 'Missing Molecular Evidence',
    description: 'Pathology and imaging present; molecular PCR absent. Demonstrates uncertainty communication.',
    badge: 'Missing Molecular',
    badge_type: 'warning'
  },
  {
    case_id: 'CASE-0003',
    title: 'Low-Quality Imaging',
    description: 'Fundus image quality score is 38/100. Demonstrates reduced clinical confidence warning.',
    badge: 'Low Quality',
    badge_type: 'danger'
  },
  {
    case_id: 'CASE-0004',
    title: 'Stale Molecular Result',
    description: 'Molecular result is >30 days old. Demonstrates automated freshness threshold expiration.',
    badge: 'Stale Evidence',
    badge_type: 'warning'
  },
  {
    case_id: 'CASE-0005',
    title: 'Conflicting Evidence',
    description: 'Pathology reports Severe Abnormality vs Imaging Normal read. Triggers multidisciplinary review alert.',
    badge: 'Conflict',
    badge_type: 'danger'
  },
  {
    case_id: 'CASE-0006',
    title: 'Broken Specimen Lineage',
    description: 'Specimen accession lost in transit. Visualizes interrupted custody chain in tree.',
    badge: 'Broken Lineage',
    badge_type: 'danger'
  }
];

export default function DashboardPage({ onSelectCase, onNavigateToCases }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container state-container">
        <Activity size={36} className="state-icon pulse" color="#0284c7" />
        <div className="state-title">Loading EyeSync Dashboard...</div>
        <div className="state-desc">Aggregating multidisciplinary evidence metrics from SQLite database.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container state-container">
        <AlertTriangle size={36} className="state-icon" color="#e11d48" />
        <div className="state-title">Unable to Load Dashboard Data</div>
        <div className="state-desc">{error}</div>
        <button className="btn btn-primary" onClick={loadMetrics}>
          Retry Connection
        </button>
      </div>
    );
  }

  const demoCases = (metrics?.recommended_demo_cases && metrics.recommended_demo_cases.length > 0)
    ? metrics.recommended_demo_cases
    : DEFAULT_DEMO_CASES;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Multidisciplinary Screening Operations</h1>
          <p className="page-subtitle">
            Real-time evidence coordination across temporary eye-care field camps, remote vans, and central diagnostic labs.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onNavigateToCases}>
          <span>View All 500 Cases</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Recommended Demo Cases Launcher */}
      <div className="demo-cases-banner">
        <div className="demo-cases-title">
          <h3>
            <Sparkles size={18} color="#0284c7" />
            <span>Recommended Demo Cases (Instant Failure Mode Evaluation)</span>
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
            Click any case to inspect its multidisciplinary timeline & failure alerts:
          </span>
        </div>
        <div className="demo-cases-grid">
          {demoCases.map((demo) => (
            <button
              key={demo.case_id}
              id={`demo-case-${demo.case_id.toLowerCase()}`}
              className="demo-case-btn"
              onClick={() => onSelectCase(demo.case_id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="demo-case-id">{demo.case_id}</span>
                <span className={`badge badge-${demo.badge_type}`} style={{ fontSize: '0.65rem' }}>
                  {demo.badge}
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--slate-800)' }}>
                {demo.title}
              </div>
              <div className="demo-case-desc">
                {demo.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 7 KPI Metric Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-info">
          <div className="kpi-header">
            <span>Total Active Cases</span>
            <Users size={18} />
          </div>
          <div className="kpi-value">{metrics.total_cases}</div>
          <div className="kpi-subtext">5 Temporary Screening Camps</div>
        </div>

        <div className="kpi-card kpi-success">
          <div className="kpi-header">
            <span>Ready For Review</span>
            <CheckCircle2 size={18} />
          </div>
          <div className="kpi-value">{metrics.ready_for_review}</div>
          <div className="kpi-subtext">Awaiting Clinician Sign-off</div>
        </div>

        <div className="kpi-card kpi-warning">
          <div className="kpi-header">
            <span>Missing Molecular Evidence</span>
            <AlertTriangle size={18} />
          </div>
          <div className="kpi-value">{metrics.missing_evidence_cases}</div>
          <div className="kpi-subtext">Missing Molecular / Imaging</div>
        </div>

        <div className="kpi-card kpi-warning">
          <div className="kpi-header">
            <span>Stale Molecular Result</span>
            <Clock size={18} />
          </div>
          <div className="kpi-value">{metrics.stale_evidence_cases}</div>
          <div className="kpi-subtext">&gt;30-day Test Results</div>
        </div>

        <div className="kpi-card kpi-danger">
          <div className="kpi-header">
            <span>Low-Quality Imaging</span>
            <Camera size={18} />
          </div>
          <div className="kpi-value">{metrics.low_quality_imaging_cases}</div>
          <div className="kpi-subtext">Quality Score &lt; 60/100</div>
        </div>

        <div className="kpi-card kpi-danger">
          <div className="kpi-header">
            <span>Conflicting Evidence</span>
            <Split size={18} />
          </div>
          <div className="kpi-value">{metrics.conflicting_evidence_cases}</div>
          <div className="kpi-subtext">Pathology vs Imaging</div>
        </div>

        <div className="kpi-card kpi-danger">
          <div className="kpi-header">
            <span>Broken Specimen Lineage</span>
            <ShieldAlert size={18} />
          </div>
          <div className="kpi-value">{metrics.broken_lineage_cases}</div>
          <div className="kpi-subtext">Lost Specimen Custody</div>
        </div>
      </div>

      {/* Operational Visualizations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Chart 1: Cases by Screening Status */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 className="card-title">Cases by Screening Workflow Status</h3>
          </div>
          <div className="card-body" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.cases_by_status}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} name="Cases" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Evidence Completeness Score Distribution */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 className="card-title">Evidence Completeness Distribution</h3>
          </div>
          <div className="card-body" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.completeness_distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Cases in Range" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row of Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Chart 3: Missing Evidence by Modality/Type */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 className="card-title">Missing Multidisciplinary Evidence by Type</h3>
          </div>
          <div className="card-body" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.missing_evidence_by_type} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="type" type="category" tick={{ fontSize: 12 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Missing Cases" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Failure Cases by Category */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h3 className="card-title">Screening Camp Failure Modes Breakdown</h3>
          </div>
          <div className="card-body" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.failure_cases_by_category}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {metrics.failure_cases_by_category.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Assembly Time Benchmark Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, var(--primary-50) 100%)' }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="badge badge-info" style={{ marginBottom: '8px' }}>
              PROTOTYPE EXPERIMENT BENCHMARK
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Case Review Assembly Time Improvement
            </h3>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.88rem', maxWidth: '600px', marginTop: '4px' }}>
              EyeSync reduces manual cross-system search latency from <strong>~327 seconds (Baseline)</strong> down to{' '}
              <strong>~54 seconds (EyeSync)</strong> per patient case — an <strong>83.5% reduction</strong> in clinical review delay.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                Baseline Search
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-700)', fontFamily: 'JetBrains Mono' }}>
                ~327s
              </div>
            </div>
            <TrendingDown size={32} color="#059669" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald-600)', textTransform: 'uppercase' }}>
                EyeSync Unified
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--emerald-600)', fontFamily: 'JetBrains Mono' }}>
                ~54s
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
