import React, { useState, useEffect } from 'react';
import { ClipboardList, Filter, Search, ChevronLeft, ChevronRight, Shield, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { formatDate, getStatusBadgeClass } from '../utils/formatters';

export default function AuditLogsPage({ onSelectCase }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [caseFilter, setCaseFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [skip, roleFilter, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAuditLogs({
        case_id: caseFilter || undefined,
        role: roleFilter || undefined,
        action: actionFilter || undefined,
        skip,
        limit,
      });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSkip(0);
    fetchLogs();
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Regulatory & Governance Audit Trail</h1>
          <p className="page-subtitle">
            Immutable transaction log of all case accesses, clinical decisions, and automated risk detections.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchLogs}>
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearch} className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search Case ID (e.g. CASE-0005)..."
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
          />
        </div>

        <select
          className="select-filter"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setSkip(0); }}
          aria-label="Filter by Role"
        >
          <option value="">All Roles</option>
          <option value="Camp Coordinator">Camp Coordinator</option>
          <option value="Imaging Reviewer">Imaging Reviewer</option>
          <option value="Pathology Reviewer">Pathology Reviewer</option>
          <option value="Molecular Reviewer">Molecular Reviewer</option>
          <option value="Case Reviewer">Case Reviewer</option>
          <option value="Administrator">Administrator</option>
        </select>

        <select
          className="select-filter"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setSkip(0); }}
          aria-label="Filter by Action"
        >
          <option value="">All Actions</option>
          <option value="CASE_CREATED">CASE_CREATED</option>
          <option value="CASE_VIEWED">CASE_VIEWED</option>
          <option value="EVIDENCE_VIEWED">EVIDENCE_VIEWED</option>
          <option value="REVIEW_SUBMITTED">REVIEW_SUBMITTED</option>
          <option value="CONFLICT_DETECTED">CONFLICT_DETECTED</option>
          <option value="LINEAGE_ERROR_DETECTED">LINEAGE_ERROR_DETECTED</option>
          <option value="LOW_QUALITY_DETECTED">LOW_QUALITY_DETECTED</option>
        </select>

        <button type="submit" className="btn btn-primary btn-sm">Filter</button>
      </form>

      {/* Table Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <ClipboardList size={18} color="#0284c7" />
            <span>Audit Records ({total.toLocaleString()} Total Events)</span>
          </h3>
        </div>

        {loading ? (
          <div className="state-container" style={{ padding: '40px' }}>
            <div className="state-title">Loading Audit History...</div>
          </div>
        ) : error ? (
          <div className="state-container" style={{ padding: '40px' }}>
            <div className="state-title">Audit Error</div>
            <div className="state-desc">{error}</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User Role</th>
                  <th>Case ID</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Result</th>
                  <th>Event Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--slate-500)', whiteSpace: 'nowrap' }}>
                      {formatDate(log.timestamp)}
                    </td>

                    <td style={{ fontWeight: 600 }}>
                      {log.user_role}
                    </td>

                    <td>
                      {log.case_id ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 6px', fontFamily: 'JetBrains Mono', fontSize: '0.75rem' }}
                          onClick={() => onSelectCase && onSelectCase(log.case_id)}
                        >
                          {log.case_id}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--slate-400)' }}>System</span>
                      )}
                    </td>

                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-800)' }}>
                      {log.action}
                    </td>

                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                        {log.resource_type}
                      </span>
                    </td>

                    <td>
                      <span className={`badge ${log.result === 'SUCCESS' ? 'badge-success' : log.result === 'WARNING' ? 'badge-warning' : 'badge-danger'}`}>
                        {log.result}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.8rem', color: 'var(--slate-700)', maxWidth: '360px' }}>
                      {log.details || 'Event logged.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > limit && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--slate-200)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
              Page {currentPage} of {totalPages}
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
