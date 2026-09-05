import React from 'react';
import { AlertTriangle, AlertCircle, Info, Clock, Split, ShieldAlert } from 'lucide-react';

export default function UncertaintyBanner({ alerts = [] }) {
  if (!alerts || alerts.length === 0) return null;

  const getAlertIcon = (type) => {
    switch (type) {
      case 'CONFLICT':
        return <Split size={20} />;
      case 'BROKEN_LINEAGE':
        return <ShieldAlert size={20} />;
      case 'LOW_QUALITY_IMAGING':
        return <AlertTriangle size={20} />;
      case 'STALE_MOLECULAR':
        return <Clock size={20} />;
      case 'MISSING_MOLECULAR':
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      {alerts.map((alert, idx) => {
        const isDanger = alert.severity === 'HIGH' || alert.type === 'CONFLICT' || alert.type === 'BROKEN_LINEAGE';
        const boxClass = isDanger ? 'uncertainty-danger' : 'uncertainty-warning';

        return (
          <div key={idx} className={`uncertainty-box ${boxClass}`}>
            <div style={{ marginTop: '2px' }}>
              {getAlertIcon(alert.type)}
            </div>
            <div style={{ flex: 1 }}>
              <div className="uncertainty-title">
                <span>{alert.title}</span>
                <span className={`badge ${isDanger ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                  {alert.type.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="uncertainty-message">
                {alert.message}
              </div>
              {alert.recommended_action && (
                <div className="uncertainty-action">
                  <strong>Recommended Protocol:</strong> {alert.recommended_action}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
