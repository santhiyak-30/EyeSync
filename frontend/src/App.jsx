import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import CaseListPage from './pages/CaseListPage';
import CaseDetailPage from './pages/CaseDetailPage';
import DataQualityPage from './pages/DataQualityPage';
import ExperimentsPage from './pages/ExperimentsPage';
import FailureAnalysisPage from './pages/FailureAnalysisPage';
import AuditLogsPage from './pages/AuditLogsPage';
import FieldWorkflowPage from './pages/FieldWorkflowPage';
import ValidationPage from './pages/ValidationPage';
import DocumentationPage from './pages/DocumentationPage';
import api from './services/api';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    checkConnection();
    // Heartbeat check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      await api.getHealth();
      setIsConnected(true);
      setConnectionError(null);
    } catch (err) {
      setIsConnected(false);
      setConnectionError(err.message);
    }
  };

  const handleSelectCase = (caseId) => {
    setSelectedCaseId(caseId);
    setActivePage('case_detail');
  };

  const handleBackToCases = () => {
    setActivePage('cases');
  };

  return (
    <div className="app-shell">
      {/* Top Banner and Header */}
      <Header
        onSelectDemoCase={handleSelectCase}
        isConnected={isConnected}
      />

      {/* Backend Disconnected Warning */}
      {!isConnected && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#991b1b', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="#dc2626" />
            <span>
              <strong>Backend Disconnected:</strong> {connectionError || 'Unable to communicate with FastAPI backend server on http://localhost:8000.'} Please ensure the backend is running with <code>uvicorn backend.main:app --reload</code>.
            </span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={checkConnection}>
            <RefreshCw size={13} /> Retry Connection
          </button>
        </div>
      )}

      {/* App Body */}
      <div className="app-body">
        <Sidebar
          activePage={activePage === 'case_detail' ? 'cases' : activePage}
          setActivePage={(pageId) => {
            setActivePage(pageId);
          }}
        />

        <main className="app-content">
          {activePage === 'dashboard' && (
            <DashboardPage
              onSelectCase={handleSelectCase}
              onNavigateToCases={() => setActivePage('cases')}
            />
          )}

          {activePage === 'cases' && (
            <CaseListPage
              onSelectCase={handleSelectCase}
            />
          )}

          {activePage === 'case_detail' && (
            <CaseDetailPage
              caseId={selectedCaseId}
              onBack={handleBackToCases}
              onSelectCase={handleSelectCase}
            />
          )}

          {activePage === 'quality' && (
            <DataQualityPage />
          )}

          {activePage === 'failures' && (
            <FailureAnalysisPage />
          )}

          {activePage === 'experiments' && (
            <ExperimentsPage />
          )}

          {activePage === 'workflow' && (
            <FieldWorkflowPage />
          )}

          {activePage === 'validation' && (
            <ValidationPage />
          )}

          {activePage === 'audit' && (
            <AuditLogsPage onSelectCase={handleSelectCase} />
          )}

          {activePage === 'docs' && (
            <DocumentationPage />
          )}
        </main>
      </div>
    </div>
  );
}
