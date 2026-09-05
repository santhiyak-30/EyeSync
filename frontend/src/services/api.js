/**
 * EyeSync Centralized API Service
 * Configurable via VITE_API_URL environment variable.
 * Includes graceful error handling to guarantee no blank screens.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
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
        // Response was not JSON
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

  getCaseDetail: (caseId, userRole = 'Case Reviewer') =>
    request(`/api/cases/${encodeURIComponent(caseId)}?user_role=${encodeURIComponent(userRole)}`),

  getCaseTimeline: (caseId) =>
    request(`/api/cases/${encodeURIComponent(caseId)}/timeline`),

  getCaseEvidence: (caseId) =>
    request(`/api/cases/${encodeURIComponent(caseId)}/evidence`),

  getCaseLineage: (caseId) =>
    request(`/api/cases/${encodeURIComponent(caseId)}/lineage`),

  // Dashboard Metrics
  getDashboardMetrics: () => request('/api/dashboard/metrics'),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.case_id) query.append('case_id', params.case_id);
    if (params.role) query.append('role', params.role);
    if (params.action) query.append('action', params.action);
    if (params.skip !== undefined) query.append('skip', params.skip);
    if (params.limit !== undefined) query.append('limit', params.limit);
    return request(`/api/audit-logs?${query.toString()}`);
  },

  // Review Decision Submission
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
