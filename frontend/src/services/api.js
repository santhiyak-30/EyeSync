/**
 * EyeSync Centralized API Service
 * Configurable via VITE_API_URL environment variable.
 * Includes JWT token management, automatic role token acquisition, and graceful error handling.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  // Acquire or retrieve JWT token
  let authToken = localStorage.getItem('eyesync_token');

  // Auto-acquire demo token for active role if token is missing
  if (!authToken && !endpoint.startsWith('/api/health') && !endpoint.startsWith('/api/auth/')) {
    try {
      const activeRole = localStorage.getItem('eyesync_role') || 'Case Reviewer';
      const authRes = await fetch(`${BASE_URL}/api/auth/token-for-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: activeRole }),
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        authToken = authData.access_token;
        localStorage.setItem('eyesync_token', authToken);
      }
    } catch (e) {
      console.warn('Could not auto-acquire initial JWT token:', e);
    }
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorDetails = `HTTP Error ${response.status}`;
      try {
        const errorJson = await response.json();
        errorDetails = errorJson.message || errorJson.details || errorDetails;
      } catch (e) {
        // Non-JSON response
      }

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('eyesync_token');
        throw new Error(errorDetails || 'Authentication required: Token expired or missing. Please re-authenticate.');
      }

      if (response.status === 403) {
        throw new Error(errorDetails || 'Access Forbidden (HTTP 403): Your active role does not have permission for this resource.');
      }

      throw new Error(errorDetails);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);

    // Differentiate network / connection failure from logic error
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('fetch')) {
      throw new Error('Unable to connect to EyeSync backend server. Please verify the Python FastAPI service is running on ' + BASE_URL);
    }
    throw error;
  }
}

export const api = {
  // System Health
  getHealth: () => request('/api/health'),

  // Authentication & RBAC
  login: (username, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getTokenForRole: (role) =>
    request('/api/auth/token-for-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  getCurrentUser: () => request('/api/auth/me'),

  // Cases
  getCases: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.priority) query.append('priority', params.priority);
    if (params.status) query.append('status', params.status);
    if (params.camp) query.append('camp', params.camp);
    if (params.has_anomaly) query.append('has_anomaly', params.has_anomaly);
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    return request(`/api/cases?${query.toString()}`);
  },

  getCaseDetail: (caseId) =>
    request(`/api/cases/${encodeURIComponent(caseId)}`),

  getCaseTimeline: (caseId) =>
    request(`/api/cases/${encodeURIComponent(caseId)}/timeline`),

  getCaseEvidence: (caseId) =>
    request(`/api/cases/${encodeURIComponent(caseId)}/evidence`),

  getCaseLineage: (caseId) =>
    request(`/api/cases/${encodeURIComponent(caseId)}/lineage`),

  // Specimen Ingestion (Strict Pydantic Validation)
  ingestSpecimen: (payload) =>
    request('/api/specimens', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Dashboard Metrics
  getDashboardMetrics: () => request('/api/dashboard/metrics'),

  // Audit Logs (Restricted to Administrator & Case Reviewer)
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.case_id) query.append('case_id', params.case_id);
    if (params.role) query.append('role', params.role);
    if (params.action) query.append('action', params.action);
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    return request(`/api/audit-logs?${query.toString()}`);
  },

  // Review Decision Submission (Restricted to Case Reviewer & Administrator)
  submitReview: (payload) =>
    request('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Experiments & Benchmarking
  getExperimentResults: () => request('/api/experiments/results'),

  // Failure Mode & Effects Analysis (FMEA)
  getFailureModes: () => request('/api/failures'),

  // Data Quality Assessment
  getDataQuality: () => request('/api/data-quality'),

  // Stakeholder Prototype Feedback
  getValidationFeedback: () => request('/api/validation'),
};

export default api;
