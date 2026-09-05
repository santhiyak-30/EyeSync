import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  FileCheck2,
  GitBranch,
  Flame,
  ClipboardList,
  Network,
  Users,
  BookOpen,
  Eye
} from 'lucide-react';
import { useRole } from '../context/RoleContext';

export default function Sidebar({ activePage, setActivePage }) {
  const { currentRole, permissions } = useRole();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Core Operations' },
    { id: 'cases', label: 'Case Explorer', icon: FolderKanban, section: 'Core Operations' },
    { id: 'quality', label: 'Data Quality Score', icon: FileCheck2, section: 'Evidence Health' },
    { id: 'failures', label: 'Failure Mode (FMEA)', icon: Flame, section: 'Evidence Health' },
    { id: 'experiments', label: 'Assembly Benchmark', icon: GitBranch, section: 'Research & Impact' },
    { id: 'workflow', label: 'Field Camp Workflow', icon: Network, section: 'Research & Impact' },
    { id: 'validation', label: 'Stakeholder Feedback', icon: Users, section: 'Evaluation' },
    { id: 'audit', label: 'Audit Trail', icon: ClipboardList, section: 'Governance' },
    { id: 'docs', label: 'Documentation', icon: BookOpen, section: 'Governance' },
  ];

  // Group items by section
  const sections = {};
  navItems.forEach((item) => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <div className="brand-logo">
          <Eye size={22} color="#38bdf8" />
          <span>EyeSync</span>
        </div>
        <div className="brand-subtitle">
          Multidisciplinary Evidence Coordination Platform
        </div>
      </div>

      <nav className="sidebar-nav">
        {Object.entries(sections).map(([sectionName, items]) => (
          <div key={sectionName} style={{ marginBottom: '10px' }}>
            <div className="nav-section-title">{sectionName}</div>
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActivePage(item.id)}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none' }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontWeight: 600, color: 'var(--slate-300)', marginBottom: '4px' }}>
          Active View: {currentRole}
        </div>
        <div>
          v1.0.0 • SQLite Local Mode
        </div>
      </div>
    </aside>
  );
}
