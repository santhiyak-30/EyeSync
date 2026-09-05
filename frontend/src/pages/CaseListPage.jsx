import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { formatDate, getStatusBadgeClass, getPriorityBadgeClass } from '../utils/formatters';

export default function CaseListPage({ onSelectCase }) {
  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [campFilter, setCampFilter] = useState('');
  const [anomalyFilter, setAnomalyFilter] = useState('');

  useEffect(() => {
    fetchCases();
  }, [skip, priority, statusFilter, campFilter, anomalyFilter]);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCases({
        search,
        priority: priority || undefined,
        status: statusFilter || undefined,
        camp: campFilter || undefined,
        has_anomaly: anomalyFilter || undefined,
        skip,
        limit,
      });
      setCases(data.cases || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to retrieve cases.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSkip(0);
    fetchCases();
  };

  const handleResetFilters = () => {
    setSearch('');
    setPriority('');
    setStatusFilter('');
    setCampFilter('');
    setAnomalyFilter('');
    setSkip(0);
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Temporary Camp Screening Cases</h1>
          <p className="page-subtitle">
            Searchable multidisciplinary case roster with automated completeness and evidence status scoring.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onSelectCase('CASE-0001')}
          >
            <Sparkles size={14} color="#0284c7" />
            <span>Open Golden Case (CASE-0001)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Case ID (e.g. CASE-0002) or Camp Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Priority Filter */}
        <select
          className="select-filter"
          value={priority}
          onChange={(e) => { setPriority(e.target.value); setSkip(0); }}
          aria-label="Filter Priority"
        >
          <option value="">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Workflow Status Filter */}
        <select
          className="select-filter"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setSkip(0); }}
          aria-label="Filter Status"
        >
          <option value="">All Statuses</option>
          <option value="Ready for Review">Ready for Review</option>
          <option value="Under Review">Under Review</option>
          <option value="Pending Evidence">Pending Evidence</option>
          <option value="Review Completed">Review Completed</option>
        </select>

        {/* Camp Location Filter */}
        <select
          className="select-filter"
          value={campFilter}
          onChange={(e) => { setCampFilter(e.target.value); setSkip(0); }}
          aria-label="Filter Camp"
        >
          <option value="">All Screening Camps</option>
          <option value="Camp-A (North Valley Health Center)">Camp-A (North Valley)</option>
          <option value="Camp-B (Eastern Rural Mobile Clinic)">Camp-B (Eastern Rural)</option>
          <option value="Camp-C (Hillside Community Outpost)">Camp-C (Hillside)</option>
          <option value="Camp-D (Riverdale Outreach Hub)">Camp-D (Riverdale)</option>
          <option value="Camp-E (Highland Primary Screening)">Camp-E (Highland)</option>
        </select>

        {/* Anomaly / Failure Filter */}
        <select
          className="select-filter"
          value={anomalyFilter}
          onChange={(e) => { setAnomalyFilter(e.target.value); setSkip(0); }}
          aria-label="Filter Anomalies"
          style={{ borderColor: anomalyFilter ? 'var(--amber-500)' : undefined }}
        >
          <option value="">All Evidence Conditions</option>
          <option value="missing_evidence">Missing Evidence Only</option>
          <option value="stale">Stale Evidence (&gt;30d)</option>
          <option value="low_quality">Low-Quality Imaging (&lt;60)</option>
          <option value="conflict">Conflicting Evidence</option>
          <option value="broken_lineage">Broken Specimen Lineage</option>
        </select>

        <button type="submit" className="btn btn-primary btn-sm">
          Filter
        </button>

        <button type="button" className="btn btn-secondary btn-sm" onClick={handleResetFilters} title="Reset Filters">
          <RotateCcw size={14} />
        </button>
      </form>

      {/* Case Table Card */}
      <div className="card">
        <div className="card-header">
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-800)' }}>
            Showing {cases.length} of {total} synthetic patient records
          </div>
          {anomalyFilter && (
            <span className="badge badge-warning">
              Filter: {anomalyFilter.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {loading ? (
          <div className="state-container" style={{ padding: '60px 20px' }}>
            <div className="state-title">Retrieving Screening Cases...</div>
            <div className="state-desc">Calculating evidence completeness and freshness metrics.</div>
          </div>
        ) : error ? (
          <div className="state-container" style={{ padding: '60px 20px' }}>
            <AlertTriangle size={32} color="#e11d48" className="state-icon" />
            <div className="state-title">Unable to Load Cases</div>
            <div className="state-desc">{error}</div>
            <button className="btn btn-primary btn-sm" onClick={fetchCases}>Retry</button>
          </div>
        ) : cases.length === 0 ? (
          <div className="state-container" style={{ padding: '60px 20px' }}>
            <div className="state-title">No Matching Cases Found</div>
            <div className="state-desc">Try clearing filters or changing search query.</div>
            <button className="btn btn-secondary btn-sm" onClick={handleResetFilters}>Reset All Filters</button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Priority</th>
                  <th>Completeness</th>
                  <th>Imaging</th>
                  <th>Pathology</th>
                  <th>Molecular</th>
                  <th>Lineage</th>
                  <th>Status</th>
                  <th>Camp Location</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.case_id} style={{ cursor: 'pointer' }} onClick={() => onSelectCase(c.case_id)}>
                    <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--primary-700)' }}>
                      {c.case_id}
                    </td>

                    <td>
                      <span className={`badge ${getPriorityBadgeClass(c.priority)}`}>
                        {c.priority}
                      </span>
                    </td>

                    <td style={{ minWidth: '130px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar-bg" style={{ height: '6px', margin: 0, flex: 1 }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${c.completeness_score}%`,
                              backgroundColor:
                                c.completeness_score >= 90
                                  ? 'var(--emerald-500)'
                                  : c.completeness_score >= 70
                                  ? 'var(--amber-500)'
                                  : 'var(--rose-500)',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                          {c.completeness_score.toFixed(0)}%
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${getStatusBadgeClass(c.imaging_status)}`}>
                        {c.imaging_status}
                      </span>
                      {c.has_low_quality_imaging && (
                        <span className="badge badge-danger" style={{ fontSize: '0.62rem', marginLeft: '4px' }}>
                          Low Q
                        </span>
                      )}
                    </td>

                    <td>
                      <span className={`badge ${getStatusBadgeClass(c.pathology_status)}`}>
                        {c.pathology_status}
                      </span>
                    </td>

                    <td>
                      <span className={`badge ${getStatusBadgeClass(c.molecular_status)}`}>
                        {c.molecular_status}
                      </span>
                      {c.has_stale_evidence && (
                        <span className="badge badge-warning" style={{ fontSize: '0.62rem', marginLeft: '4px' }}>
                          Stale
                        </span>
                      )}
                    </td>

                    <td>
                      {c.has_broken_lineage ? (
                        <span className="badge badge-danger">BROKEN</span>
                      ) : (
                        <span className="badge badge-success">OK</span>
                      )}
                    </td>

                    <td>
                      <span className={`badge ${getStatusBadgeClass(c.screening_status)}`}>
                        {c.screening_status}
                      </span>
                      {c.has_conflict && (
                        <span className="badge badge-danger" style={{ fontSize: '0.62rem', marginLeft: '4px' }}>
                          Conflict
                        </span>
                      )}
                    </td>

                    <td style={{ fontSize: '0.78rem', color: 'var(--slate-600)' }}>
                      {c.camp_location.split('(')[0]}
                    </td>

                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(c.case_id);
                        }}
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {total > limit && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--slate-200)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
              Page {currentPage} of {totalPages} ({total} total records)
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={skip === 0}
                onClick={() => setSkip(Math.max(0, skip - limit))}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={skip + limit >= total}
                onClick={() => setSkip(skip + limit)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
