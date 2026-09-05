import React, { useState, useEffect } from 'react';
import { Eye, ShieldAlert, UserCheck, Activity } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import api from '../services/api';

const DEMO_SCENARIOS = [
  { id: 'CASE-0001', label: 'CASE-0001 (Golden Complete)' },
  { id: 'CASE-0002', label: 'CASE-0002 (Missing Molecular)' },
  { id: 'CASE-0003', label: 'CASE-0003 (Low-Quality Image)' },
  { id: 'CASE-0004', label: 'CASE-0004 (Stale Molecular)' },
  { id: 'CASE-0005', label: 'CASE-0005 (Conflicting Evidence)' },
  { id: 'CASE-0006', label: 'CASE-0006 (Broken Lineage)' },
  { id: 'CASE-0007', label: 'CASE-0007 (Duplicate / Repeat Imaging)' },
];

export default function Header({ onSelectDemoCase, isConnected = true }) {
  const { currentRole, setCurrentRole, ROLES } = useRole();
  const [cases, setCases] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.getCases({ limit: 500 })
      .then((data) => {
        if (isMounted && data?.cases) {
          setCases(data.cases);
        }
      })
      .catch((err) => {
        console.warn('Could not load full case list in Header, using default cases:', err);
      });
    return () => { isMounted = false; };
  }, [isConnected]);

  const query = searchFilter.trim().toLowerCase();

  const filteredDemoScenarios = DEMO_SCENARIOS.filter((item) =>
    !query || item.id.toLowerCase().includes(query) || item.label.toLowerCase().includes(query)
  );

  const filteredAllCases = cases.filter((c) => {
    if (!query) return true;
    return (
      c.case_id.toLowerCase().includes(query) ||
      (c.camp_location && c.camp_location.toLowerCase().includes(query)) ||
      (c.department && c.department.toLowerCase().includes(query)) ||
      (c.screening_status && c.screening_status.toLowerCase().includes(query))
    );
  });

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchFilter.trim()) {
      if (filteredDemoScenarios.length > 0) {
        onSelectDemoCase?.(filteredDemoScenarios[0].id);
        setSearchFilter('');
      } else if (filteredAllCases.length > 0) {
        onSelectDemoCase?.(filteredAllCases[0].case_id);
        setSearchFilter('');
      }
    }
  };

  return (
    <>
      {/* Top Persistent Privacy-by-Design Banner */}
      <div className="privacy-banner" id="privacy-banner">
        <ShieldAlert size={16} />
        <span>DE-IDENTIFIED SYNTHETIC DATA – DEMONSTRATION ONLY</span>
        <span className="privacy-badge">Zero Real Patient Data</span>
      </div>

      {/* Main Top Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="brand-logo">
            <Eye size={26} color="#0284c7" />
            <span>EyeSync</span>
          </div>
          <span className="badge badge-neutral" style={{ fontSize: '0.75rem', textTransform: 'none' }}>
            Screening Camp Hub
          </span>
        </div>

        <div className="header-right">
          {/* Quick Demo Case Selector & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-500)', whiteSpace: 'nowrap' }}>
              Demo Cases:
            </span>
            <input
              type="text"
              placeholder="Search 500 cases..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="select-filter"
              style={{
                fontSize: '0.78rem',
                padding: '4px 8px',
                width: '130px',
                height: '28px',
              }}
              title="Search by ID (e.g. CASE-0007), camp, or scenario. Press Enter to navigate."
              aria-label="Filter Demo Cases"
            />
            <select
              id="demo-cases-dropdown"
              className="select-filter"
              style={{ fontSize: '0.78rem', padding: '4px 8px', height: '28px', maxWidth: '240px' }}
              onChange={(e) => {
                if (e.target.value) {
                  onSelectDemoCase?.(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              aria-label="Select Demo Case"
            >
              <option value="" disabled>
                {searchFilter ? `Matches (${filteredDemoScenarios.length + filteredAllCases.length})...` : 'Jump to Demo Case...'}
              </option>

              {filteredDemoScenarios.length > 0 && (
                <optgroup label="Key Demonstration Scenarios">
                  {filteredDemoScenarios.map((demo) => (
                    <option key={demo.id} value={demo.id}>
                      {demo.label}
                    </option>
                  ))}
                </optgroup>
              )}

              {filteredAllCases.length > 0 && (
                <optgroup label="All 500 Cases">
                  {filteredAllCases.map((c) => (
                    <option key={c.case_id} value={c.case_id}>
                      {c.case_id} – {c.camp_location ? c.camp_location.split(' ')[0] : 'Camp'} ({c.screening_status})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Role Switcher */}
          <div className="role-badge-group">
            <UserCheck size={16} color="#0284c7" />
            <span className="role-label">Role:</span>
            <select
              className="role-select"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              aria-label="Select Active Role"
            >
              {Object.values(ROLES).map((roleName) => (
                <option key={roleName} value={roleName}>
                  {roleName}
                </option>
              ))}
            </select>
          </div>

          {/* Connection Indicator */}
          <div
            title={isConnected ? 'Backend API Connected' : 'Backend Disconnected'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
          >
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                backgroundColor: isConnected ? 'var(--emerald-500)' : 'var(--rose-500)',
                display: 'inline-block',
              }}
              className={isConnected ? 'pulse' : ''}
            />
            <span style={{ color: 'var(--slate-500)', fontWeight: 500 }}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </header>
    </>
  );
}
