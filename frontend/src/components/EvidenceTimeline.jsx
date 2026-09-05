import React from 'react';
import {
  Camera,
  TestTube,
  Microscope,
  Dna,
  CheckCircle2,
  AlertCircle,
  Clock,
  Truck,
  Building2,
  FileText,
  Eye
} from 'lucide-react';
import { formatDate, formatTimeAgo, getStatusBadgeClass } from '../utils/formatters';

export default function EvidenceTimeline({ events = [], onViewDetails }) {
  if (!events || events.length === 0) {
    return (
      <div className="state-container" style={{ padding: '32px' }}>
        <Clock size={32} className="state-icon" />
        <div className="state-title">No Timeline Events Recorded</div>
        <div className="state-desc">This case has no chronological events registered yet.</div>
      </div>
    );
  }

  const getEventIcon = (type, status) => {
    switch (type) {
      case 'Case Created':
        return <FileText size={14} />;
      case 'Image Captured':
        return <Camera size={14} />;
      case 'Specimen Collected':
        return <TestTube size={14} />;
      case 'Specimen Transport':
        return <Truck size={14} />;
      case 'Laboratory Receipt':
        return <Building2 size={14} />;
      case 'Pathology Result':
        return <Microscope size={14} />;
      case 'Molecular Result':
        return <Dna size={14} />;
      case 'Review Decision':
        return <CheckCircle2 size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const getNodeClass = (event) => {
    if (event.freshness === 'STALE') return 'node-warning';
    if (event.status === 'ABNORMAL' || event.status === 'LOW_QUALITY' || event.status === 'BROKEN') return 'node-danger';
    if (event.status === 'NORMAL' || event.status === 'CLEAR' || event.status === 'AVAILABLE') return 'node-success';
    return '';
  };

  return (
    <div className="timeline-container">
      <div className="timeline-line" />
      {events.map((evt, idx) => (
        <div key={evt.event_id || idx} className="timeline-event-item">
          {/* Timeline Node Icon */}
          <div className={`timeline-node-icon ${getNodeClass(evt)}`}>
            {getEventIcon(evt.event_type, evt.status)}
          </div>

          {/* Timeline Card */}
          <div className="timeline-card">
            <div className="timeline-header">
              <div className="timeline-event-title">
                <span>{evt.event_type}</span>
                <span className={`badge ${getStatusBadgeClass(evt.status)}`}>
                  {evt.status}
                </span>
                {evt.freshness && (
                  <span
                    className={`badge ${evt.freshness === 'FRESH' ? 'badge-success' : 'badge-warning'}`}
                    style={{ fontSize: '0.68rem' }}
                  >
                    {evt.freshness}
                  </span>
                )}
                {evt.quality && (
                  <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                    {evt.quality}
                  </span>
                )}
              </div>
              <div className="timeline-time" title={evt.timestamp}>
                {formatDate(evt.timestamp)} ({formatTimeAgo(evt.timestamp)})
              </div>
            </div>

            <div className="timeline-details">
              {evt.summary}
            </div>

            <div className="timeline-footer">
              <div>
                <strong>Source:</strong> {evt.source} &nbsp;•&nbsp;
                <strong>Actor:</strong> {evt.reviewer || 'System'}
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onViewDetails && onViewDetails(evt)}
                aria-label={`View details for ${evt.event_type}`}
              >
                <Eye size={13} />
                <span>View Details</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
