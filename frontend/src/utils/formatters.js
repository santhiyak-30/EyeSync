/**
 * Formatting and styling helper functions
 */

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateString;
  }
}

export function formatTimeAgo(dateString) {
  if (!dateString) return '';
  try {
    const now = new Date(2026, 8, 3, 10, 0, 0); // Synchronized anchor
    const then = new Date(dateString);
    const diffHours = Math.round((now - then) / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  } catch (e) {
    return '';
  }
}

export function getStatusBadgeClass(status) {
  const s = String(status || '').toUpperCase();
  if (['GOOD', 'CLEAR', 'REVIEW COMPLETED', 'NORMAL', 'FRESH', 'OK', 'SUCCESS', 'AVAILABLE'].includes(s)) {
    return 'badge-success';
  }
  if (['ACCEPTABLE', 'UNDER REVIEW', 'READY FOR REVIEW', 'STALE', 'PENDING', 'PENDING EVIDENCE', 'WARNING'].includes(s)) {
    return 'badge-warning';
  }
  if (['LOW_QUALITY', 'ABNORMAL', 'CRITICAL', 'HIGH', 'BROKEN', 'LINEAGE BROKEN', 'FAILED', 'LOST_LINKAGE', 'CONFLICT'].includes(s)) {
    return 'badge-danger';
  }
  return 'badge-info';
}

export function getPriorityBadgeClass(priority) {
  const p = String(priority || '').toUpperCase();
  if (p === 'CRITICAL') return 'badge-danger';
  if (p === 'HIGH') return 'badge-warning';
  if (p === 'MEDIUM') return 'badge-info';
  return 'badge-neutral';
}
