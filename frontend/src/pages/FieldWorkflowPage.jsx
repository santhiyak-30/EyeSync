import React, { useState } from 'react';
import {
  UserPlus, FilePlus, Camera, TestTube, Truck, Building2,
  Microscope, Dna, RefreshCw, CheckSquare, Send, ShieldAlert,
  ArrowRight, AlertTriangle, CheckCircle2
} from 'lucide-react';

export default function FieldWorkflowPage() {
  const [selectedStep, setSelectedStep] = useState(0);

  const workflowSteps = [
    {
      number: 1,
      title: 'Camp Registration',
      actor: 'Camp Coordinator',
      icon: UserPlus,
      location: 'Field Camp Intake Desk',
      description: 'Patient arrives at temporary screening outreach camp. Synthetic de-identified identifier assigned (e.g., CASE-0001).',
      vulnerability: 'Patient volume surge, physical badge misplacement.',
      mitigation: 'Pre-printed de-identified QR barcode bands and deterministic ID sequencing.'
    },
    {
      number: 2,
      title: 'Case Created',
      actor: 'System / Coordinator',
      icon: FilePlus,
      location: 'Local SQLite Field Hub',
      description: 'Case opened with priority, screening department, and assigned ophthalmologist.',
      vulnerability: 'Temporary power outage or lack of cellular/cloud coverage.',
      mitigation: 'Offline-first local SQLite architecture guarantees 100% operational uptime without cloud APIs.'
    },
    {
      number: 3,
      title: 'Imaging Capture',
      actor: 'Imaging Technician',
      icon: Camera,
      location: 'Mobile Screening Pod / Van',
      description: 'Fundus photography, OCT, or slit-lamp capture. Automated quality scoring executed on-device.',
      vulnerability: 'Dense cataracts, poor pupil dilation, patient blink, dirty camera objective lens.',
      mitigation: 'Automated image quality analyzer flags score < 60 immediately for pod re-capture.'
    },
    {
      number: 4,
      title: 'Specimen Collection',
      actor: 'Field Phlebotomy / Nurse',
      icon: TestTube,
      location: 'Specimen Collection Station',
      description: 'Tear-film micro-fluidic collection or conjunctival swab. Barcode accession label affixed to tube.',
      vulnerability: 'Smudged handwritten labels, micro-tube spillage, insufficient sample volume.',
      mitigation: '2D Datamatrix barcode scan verification at the moment of patient swab.'
    },
    {
      number: 5,
      title: 'Cold-Chain Transport',
      actor: 'Logistics Courier',
      icon: Truck,
      location: 'Refrigerated Transport Van',
      description: 'Specimens placed in temperature-monitored cooler (2°C–8°C) and dispatched to Central Diagnostic Lab.',
      vulnerability: 'Transport delay over rough rural roads, temperature excursions, cooler lost accession tag.',
      mitigation: 'Specimen transport timestamp logging and automated custody break alerts.'
    },
    {
      number: 6,
      title: 'Laboratory Receipt',
      actor: 'Lab Accession Officer',
      icon: Building2,
      location: 'Central Diagnostic Lab',
      description: 'Cooler arrives; accession barcodes scanned into laboratory information system.',
      vulnerability: 'Mismatched barcode label leading to severed chain-of-custody.',
      mitigation: 'EyeSync flags LOST_LINKAGE and displays "SPECIMEN LINEAGE INCOMPLETE" alert.'
    },
    {
      number: 7,
      title: 'Pathology Analysis',
      actor: 'Pathology Reviewer',
      icon: Microscope,
      location: 'Cytopathology Unit',
      description: 'Histological staining and microscopic review for epithelial dysplasia, keratitis, or inflammation.',
      vulnerability: 'Non-diagnostic sparse cellular yield or biopsy taken outside lesion boundary.',
      mitigation: 'Flagged as INCONCLUSIVE or discordant when compared with imaging capture.'
    },
    {
      number: 8,
      title: 'Molecular Testing',
      actor: 'Molecular Reviewer',
      icon: Dna,
      location: 'Genomics / PCR Lab',
      description: 'Real-time PCR for viral DNA (HSV-1, HSV-2, VZV, CMV) and cytokine biomarker quantification.',
      vulnerability: 'Reagent batch delays; test result completed weeks after initial camp visit.',
      mitigation: 'Automated 30-day freshness engine flags STALE results before clinical reliance.'
    },
    {
      number: 9,
      title: 'Evidence Sync',
      actor: 'EyeSync Pipeline',
      icon: RefreshCw,
      location: 'Data Aggregation Engine',
      description: 'All multidisciplinary outputs merged into unified chronological evidence timeline.',
      vulnerability: 'Siloed data distributed across 5 different folders and legacy spreadsheets.',
      mitigation: 'EyeSync solves this entirely by unifying imaging, pathology, and molecular timelines.'
    },
    {
      number: 10,
      title: 'Case Review',
      actor: 'Case Reviewer / MD',
      icon: CheckSquare,
      location: 'Tele-Ophthalmology Console',
      description: 'Reviewer opens single unified case view; evaluates pre-computed completeness and uncertainty banners.',
      vulnerability: 'Manual review assembly fatigue leading to missed stale tests or overlooked conflicts.',
      mitigation: 'Assembly time slashed from 327s to 54s (83.5% reduction); zero missed anomalies.'
    },
    {
      number: 11,
      title: 'Decision Recorded',
      actor: 'Case Reviewer',
      icon: Send,
      location: 'Review Module',
      description: 'Definitive decision submitted (CLEAR, REFER, REVIEW_REQUIRED, INSUFFICIENT_EVIDENCE) with rationale.',
      vulnerability: 'Discharging patient based on incomplete evidence.',
      mitigation: 'Pre-review validation modal enforces completeness check and rationale documentation.'
    },
    {
      number: 12,
      title: 'Immutable Audit',
      actor: 'Governance Engine',
      icon: ShieldAlert,
      location: 'System Audit Ledger',
      description: 'All reviewer actions, timestamps, and automated anomaly warnings recorded in audit trail.',
      vulnerability: 'Lack of regulatory accountability in remote camp operations.',
      mitigation: 'Complete traceability for clinical governance and quality improvement.'
    },
  ];

  const current = workflowSteps[selectedStep];
  const StepIcon = current.icon;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Field Camp Operational Workflow</h1>
          <p className="page-subtitle">
            12-step end-to-end operational journey from rural patient registration to central laboratory audit.
          </p>
        </div>
      </div>

      {/* Horizontal Stepper */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Select a Workflow Stage to Inspect Vulnerabilities</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px' }}>
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              const isSelected = selectedStep === idx;
              return (
                <button
                  key={step.number}
                  onClick={() => setSelectedStep(idx)}
                  style={{
                    background: isSelected ? 'var(--primary-600)' : 'var(--slate-50)',
                    color: isSelected ? '#ffffff' : 'var(--slate-700)',
                    border: `1.5px solid ${isSelected ? 'var(--primary-700)' : 'var(--slate-200)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    minWidth: '135px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                  }}
                >
                  <Icon size={18} color={isSelected ? '#ffffff' : '#0284c7'} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    Step {step.number}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.2 }}>
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Step Deep Dive */}
      <div className="card">
        <div className="card-header" style={{ background: 'var(--slate-50)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--primary-600)', color: '#ffffff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StepIcon size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                Step {current.number}: {current.title}
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                <strong>Responsible Role:</strong> {current.actor} &nbsp;•&nbsp; <strong>Location:</strong> {current.location}
              </div>
            </div>
          </div>
          <span className="badge badge-info">Stage {current.number} of 12</span>
        </div>

        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '8px' }}>
                Standard Operating Procedure (SOP)
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate-700)', lineHeight: 1.5 }}>
                {current.description}
              </p>
            </div>

            <div style={{ background: 'var(--rose-50)', border: '1px solid var(--rose-200)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--rose-900)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} color="#e11d48" /> Field Vulnerability / Point of Failure
              </h4>
              <p style={{ fontSize: '0.83rem', color: 'var(--rose-800)', lineHeight: 1.4 }}>
                {current.vulnerability}
              </p>
            </div>

            <div style={{ background: 'var(--emerald-50)', border: '1px solid var(--emerald-200)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--emerald-900)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#059669" /> EyeSync System Defense
              </h4>
              <p style={{ fontSize: '0.83rem', color: 'var(--emerald-800)', lineHeight: 1.4 }}>
                {current.mitigation}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
