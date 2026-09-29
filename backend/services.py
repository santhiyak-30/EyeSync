from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
try:
    from .models import Case, ImagingEvent, Specimen, PathologyResult, MolecularResult, ReviewDecision, AuditLog
    from .schemas import (
        EvidenceCompletenessBreakdown, CompletenessItem, UncertaintyAlert,
        TimelineEvent, SpecimenLineageStep, CaseListItem
    )
except ImportError:
    from models import Case, ImagingEvent, Specimen, PathologyResult, MolecularResult, ReviewDecision, AuditLog
    from schemas import (
        EvidenceCompletenessBreakdown, CompletenessItem, UncertaintyAlert,
        TimelineEvent, SpecimenLineageStep, CaseListItem
    )

# Configurable Freshness Thresholds (in days)
FRESHNESS_CONFIG = {
    "imaging": 7,      # Fresh < 7 days
    "pathology": 14,   # Fresh < 14 days
    "molecular": 30    # Fresh < 30 days
}

# Low quality threshold
QUALITY_SCORE_THRESHOLD = 60.0


def calculate_freshness(timestamp: Optional[datetime], evidence_type: str, ref_time: Optional[datetime] = None) -> str:
    """
    Reusable freshness utility function.
    Returns: 'FRESH', 'STALE', 'MISSING', or 'UNKNOWN'
    """
    if not timestamp:
        return "MISSING"
    
    threshold_days = FRESHNESS_CONFIG.get(evidence_type.lower(), 14)
    now = ref_time or datetime.utcnow()
    
    # Calculate difference
    age_days = (now - timestamp).total_seconds() / 86400.0
    if age_days < 0:
        return "FRESH"
    return "FRESH" if age_days < threshold_days else "STALE"


def calculate_completeness(
    case: Case,
    imaging_list: List[ImagingEvent],
    pathology_list: List[PathologyResult],
    molecular_list: List[MolecularResult],
    specimen_list: List[Specimen],
    review_list: List[ReviewDecision]
) -> EvidenceCompletenessBreakdown:
    """
    Calculates 0-100 evidence completeness score with exact itemized points:
    - Imaging available = 30 points (Primary visual diagnostic modality)
    - Pathology available = 30 points (Histological / cytologic confirmation)
    - Molecular available = 20 points (Confirmatory viral PCR / biomarker panel)
    - Specimen lineage complete = 10 points (Verified chain of custody)
    - Review decision available = 10 points (Final clinical triage disposition)
    """
    # Evidence scoring model: In temporary screening camps, visual imaging and tissue
    # pathology carry primary diagnostic weight (60% combined). Confirmatory PCR assays
    # provide 20%, while unbroken chain of custody and signed clinical reviews provide
    # the final 20% to reach a 100% comprehensive record.
    items: List[CompletenessItem] = []
    missing_items: List[str] = []
    total_score = 0.0

    # 1. Imaging Available (30 pts)
    # Evaluates presence of readable capture (modality cannot be marked MISSING)
    has_imaging = len(imaging_list) > 0 and any(img.quality_status != "MISSING" for img in imaging_list)
    pts_img = 30.0 if has_imaging else 0.0
    total_score += pts_img
    items.append(CompletenessItem(
        name="Imaging Evidence",
        available=has_imaging,
        points_awarded=pts_img,
        max_points=30.0
    ))
    if not has_imaging:
        missing_items.append("Imaging Evidence")

    # 2. Pathology Available (30 pts)
    has_pathology = len(pathology_list) > 0 and any(p.status != "PENDING" for p in pathology_list)
    pts_path = 30.0 if has_pathology else 0.0
    total_score += pts_path
    items.append(CompletenessItem(
        name="Pathology Results",
        available=has_pathology,
        points_awarded=pts_path,
        max_points=30.0
    ))
    if not has_pathology:
        missing_items.append("Pathology Results")

    # 3. Molecular Available (20 pts)
    has_molecular = len(molecular_list) > 0 and any(m.result_status != "MISSING" for m in molecular_list)
    pts_mol = 20.0 if has_molecular else 0.0
    total_score += pts_mol
    items.append(CompletenessItem(
        name="Molecular Testing",
        available=has_molecular,
        points_awarded=pts_mol,
        max_points=20.0
    ))
    if not has_molecular:
        missing_items.append("Molecular Testing")

    # 4. Specimen Lineage Complete (10 pts)
    is_lineage_ok = False
    if len(specimen_list) > 0:
        spec = specimen_list[0]
        # Lineage is complete if received, not lost linkage, and linked
        if spec.processing_status != "LOST_LINKAGE" and spec.received_time is not None:
            is_lineage_ok = True
    pts_lin = 10.0 if is_lineage_ok else 0.0
    total_score += pts_lin
    items.append(CompletenessItem(
        name="Specimen Lineage",
        available=is_lineage_ok,
        points_awarded=pts_lin,
        max_points=10.0
    ))
    if not is_lineage_ok:
        missing_items.append("Specimen Lineage")

    # 5. Review Decision Available (10 pts)
    has_review = len(review_list) > 0
    pts_rev = 10.0 if has_review else 0.0
    total_score += pts_rev
    items.append(CompletenessItem(
        name="Clinical Review",
        available=has_review,
        points_awarded=pts_rev,
        max_points=10.0
    ))
    if not has_review:
        missing_items.append("Clinical Review")

    return EvidenceCompletenessBreakdown(
        score=round(total_score, 1),
        items=items,
        missing_items=missing_items
    )


def build_specimen_lineage(
    case: Case,
    specimen_list: List[Specimen],
    pathology_list: List[PathologyResult],
    molecular_list: List[MolecularResult]
) -> List[SpecimenLineageStep]:
    """
    Constructs the 6-step visual specimen lineage tree:
    Case -> Specimen Collection -> Transport -> Laboratory Receipt -> Pathology -> Molecular Result
    Explicitly flags broken lineage steps.
    """
    steps: List[SpecimenLineageStep] = []
    
    # Step 1: Case Registration
    steps.append(SpecimenLineageStep(
        step_number=1,
        step_name="Case Registration",
        entity_id=case.case_id,
        timestamp=case.case_created_at,
        status="OK",
        details=f"Screening case created at {case.camp_location} ({case.department})",
        is_broken=False
    ))

    if not specimen_list:
        steps.append(SpecimenLineageStep(
            step_number=2,
            step_name="Specimen Collection",
            entity_id=None,
            timestamp=None,
            status="PENDING",
            details="No specimen collected for this case yet.",
            is_broken=False
        ))
        return steps

    spec = specimen_list[0]

    # Step 2: Specimen Collection
    steps.append(SpecimenLineageStep(
        step_number=2,
        step_name="Specimen Collection",
        entity_id=spec.specimen_id,
        timestamp=spec.collection_time,
        status="OK",
        details=f"Collected at {spec.collection_site}",
        is_broken=False
    ))

    # Step 3: Cold Chain Transport
    if spec.transport_time:
        steps.append(SpecimenLineageStep(
            step_number=3,
            step_name="Transport to Lab",
            entity_id=f"TR-{spec.specimen_id}",
            timestamp=spec.transport_time,
            status="OK",
            details="Dispatched via temperature-monitored specimen carrier",
            is_broken=False
        ))
    else:
        steps.append(SpecimenLineageStep(
            step_number=3,
            step_name="Transport to Lab",
            entity_id=None,
            timestamp=None,
            status="PENDING",
            details="Transport departure not recorded",
            is_broken=True
        ))

    # Step 4: Laboratory Receipt
    # Specimen custody check: If lost in transit or barcoding severed,
    # the failure cascades downstream to invalidate pathology and molecular steps.
    is_lost = spec.processing_status == "LOST_LINKAGE"
    if spec.received_time and not is_lost:
        steps.append(SpecimenLineageStep(
            step_number=4,
            step_name="Laboratory Receipt",
            entity_id=f"LAB-{spec.specimen_id}",
            timestamp=spec.received_time,
            status="OK",
            details=f"Received at Central Laboratory. Status: {spec.processing_status}",
            is_broken=False
        ))
    elif is_lost:
        # Interrupted chain-of-custody: Sample cannot be authenticated.
        steps.append(SpecimenLineageStep(
            step_number=4,
            step_name="Laboratory Receipt",
            entity_id=f"LAB-{spec.specimen_id}",
            timestamp=spec.received_time or spec.collection_time,
            status="BROKEN",
            details="LINEAGE BROKEN: Specimen accession lost in transit or label damaged.",
            is_broken=True
        ))
    else:
        steps.append(SpecimenLineageStep(
            step_number=4,
            step_name="Laboratory Receipt",
            entity_id=None,
            timestamp=None,
            status="PENDING",
            details="Awaiting central laboratory check-in",
            is_broken=False
        ))

    # Step 5: Pathology Processing
    if pathology_list and not is_lost:
        p = pathology_list[0]
        steps.append(SpecimenLineageStep(
            step_number=5,
            step_name="Pathology Analysis",
            entity_id=p.pathology_id,
            timestamp=p.result_at,
            status="OK" if p.status != "INCONCLUSIVE" else "PENDING",
            details=f"Pathology Result: {p.status} (Severity: {p.severity})",
            is_broken=False
        ))
    elif is_lost or (spec.linked_pathology_id is None and not pathology_list):
        steps.append(SpecimenLineageStep(
            step_number=5,
            step_name="Pathology Analysis",
            entity_id=None,
            timestamp=None,
            status="BROKEN" if is_lost else "PENDING",
            details="SPECIMEN LINEAGE INCOMPLETE: Pathology link missing" if is_lost else "Pathology pending",
            is_broken=is_lost
        ))
    else:
        steps.append(SpecimenLineageStep(
            step_number=5,
            step_name="Pathology Analysis",
            entity_id=None,
            timestamp=None,
            status="PENDING",
            details="Specimen aliquoted, awaiting micro-pathology review",
            is_broken=False
        ))

    # Step 6: Molecular Result
    if molecular_list and not is_lost:
        m = molecular_list[0]
        steps.append(SpecimenLineageStep(
            step_number=6,
            step_name="Molecular Testing",
            entity_id=m.molecular_id,
            timestamp=m.result_at,
            status="OK" if m.result_status == "AVAILABLE" else m.result_status,
            details=f"Assay: {m.test_type} ({m.result_status})",
            is_broken=False
        ))
    elif is_lost:
        steps.append(SpecimenLineageStep(
            step_number=6,
            step_name="Molecular Testing",
            entity_id=None,
            timestamp=None,
            status="BROKEN",
            details="SPECIMEN LINEAGE INCOMPLETE: Molecular testing severed due to lost specimen accession.",
            is_broken=True
        ))
    else:
        steps.append(SpecimenLineageStep(
            step_number=6,
            step_name="Molecular Testing",
            entity_id=None,
            timestamp=None,
            status="PENDING",
            details="Molecular assay not conducted or pending",
            is_broken=False
        ))

    return steps


def detect_uncertainties_and_conflicts(
    case: Case,
    imaging_list: List[ImagingEvent],
    pathology_list: List[PathologyResult],
    molecular_list: List[MolecularResult],
    specimen_list: List[Specimen]
) -> List[UncertaintyAlert]:
    """
    Evaluates failure cases and uncertainties:
    1. Missing Molecular Evidence
    2. Low-Quality Imaging
    3. Stale Molecular Result
    4. Duplicate Imaging
    5. Conflicting Evidence (e.g. Pathology Abnormal vs Imaging Normal)
    6. Broken Specimen Lineage
    """
    alerts: List[UncertaintyAlert] = []

    # 1. Missing Molecular Evidence
    has_imaging = len(imaging_list) > 0
    has_pathology = len(pathology_list) > 0
    has_molecular = len(molecular_list) > 0 and any(m.result_status != "MISSING" for m in molecular_list)

    if (has_imaging or has_pathology) and not has_molecular:
        alerts.append(UncertaintyAlert(
            type="MISSING_MOLECULAR",
            severity="MEDIUM",
            title="Molecular Evidence Unavailable",
            message="UNKNOWN – Evidence unavailable. Clinical reviewer must not assume a negative molecular finding in the absence of test results.",
            recommended_action="Order reflex molecular PCR assay or document rationale for proceeding without molecular markers."
        ))

    # 2. Low-Quality Imaging
    for img in imaging_list:
        if img.quality_score < QUALITY_SCORE_THRESHOLD or img.quality_status == "LOW_QUALITY":
            alerts.append(UncertaintyAlert(
                type="LOW_QUALITY_IMAGING",
                severity="HIGH",
                title="Low-Quality Imaging Detected",
                message=f"LOW QUALITY – Interpretation confidence reduced (Quality score: {img.quality_score:.0f}/100, Modality: {img.modality}). Media opacity, poor pupil dilation, or patient motion detected.",
                recommended_action="Request re-imaging at screening pod or schedule high-resolution in-clinic OCT/Slit Lamp."
            ))
            break

    # 3. Stale Molecular Result
    for mol in molecular_list:
        freshness = calculate_freshness(mol.result_at, "molecular")
        if freshness == "STALE" or mol.result_status == "STALE":
            alerts.append(UncertaintyAlert(
                type="STALE_MOLECULAR",
                severity="MEDIUM",
                title="Stale Molecular Evidence",
                message="STALE – Verify before clinical review. Molecular findings are older than 30-day freshness window and may no longer reflect active inflammatory or viral kinetics.",
                recommended_action="Verify patient clinical evolution since test date; consider rapid repeat tear-film biomarker test."
            ))
            break

    # 4. Duplicate Imaging Evidence
    if len(imaging_list) > 1:
        modalities = [img.modality for img in imaging_list]
        if len(modalities) != len(set(modalities)):
            alerts.append(UncertaintyAlert(
                type="DUPLICATE_IMAGING",
                severity="LOW",
                title="Duplicate Evidence Detected",
                message="DUPLICATE EVIDENCE DETECTED – Multiple imaging acquisitions recorded for the same modality. Review timestamps to verify which acquisition represents the definitive scan.",
                recommended_action="Compare image quality scores and select the optimal scan for case review documentation."
            ))

    # 5. Conflicting Evidence
    # Heuristic: Detect biological discordance across diagnostic modalities.
    # Case A: Histology demonstrates dysplasia/necrosis while imaging read claims normal retina.
    # Case B: Fundus/OCT shows distinct lesions while cytology scrape failed to harvest abnormal cells.
    # Both states mandate case conference before clinical clearance.
    if pathology_list and imaging_list:
        path = pathology_list[0]
        img = imaging_list[0]
        if path.status == "ABNORMAL" and img.review_status == "NORMAL":
            alerts.append(UncertaintyAlert(
                type="CONFLICT",
                severity="HIGH",
                title="Conflicting Multidisciplinary Evidence",
                message="CONFLICTING EVIDENCE – REVIEW REQUIRED. Pathology reports ABNORMAL findings with elevated severity, while Imaging read indicates NORMAL ocular structures.",
                recommended_action="Conduct multidisciplinary case conference. Review raw histology slides alongside high-magnification fundus captures."
            ))
        elif path.status == "NORMAL" and img.review_status == "ABNORMAL":
            alerts.append(UncertaintyAlert(
                type="CONFLICT",
                severity="HIGH",
                title="Conflicting Multidisciplinary Evidence",
                message="CONFLICTING EVIDENCE – REVIEW REQUIRED. Imaging demonstrates distinct retinal/corneal lesions, while Pathology biopsy was reported as NORMAL.",
                recommended_action="Evaluate whether biopsy sample was taken from the lesion margin; consider targeted repeat sampling."
            ))

    # 6. Broken Specimen Lineage
    if specimen_list:
        spec = specimen_list[0]
        if spec.processing_status == "LOST_LINKAGE" or (spec.received_time and not spec.linked_pathology_id and not spec.linked_molecular_id and (pathology_list or molecular_list)):
            alerts.append(UncertaintyAlert(
                type="BROKEN_LINEAGE",
                severity="HIGH",
                title="Specimen Lineage Incomplete",
                message="SPECIMEN LINEAGE INCOMPLETE / LINEAGE BROKEN – Physical specimen custody link severed between field collection and central lab verification.",
                recommended_action="Quarantine unverified lab results. Perform barcode audit and chain-of-custody verification before clinical reliance."
            ))

    return alerts


def build_unified_timeline(
    case: Case,
    imaging_list: List[ImagingEvent],
    pathology_list: List[PathologyResult],
    molecular_list: List[MolecularResult],
    specimen_list: List[Specimen],
    review_list: List[ReviewDecision]
) -> List[TimelineEvent]:
    """
    Merges all multidisciplinary events into a unified chronological array sorted by timestamp.
    """
    events: List[TimelineEvent] = []

    # 1. Case Created
    events.append(TimelineEvent(
        event_id=f"EVT-CASE-{case.case_id}",
        event_type="Case Created",
        timestamp=case.case_created_at,
        source="Field Registration",
        status=case.screening_status,
        quality=None,
        freshness="FRESH",
        reviewer=case.assigned_reviewer,
        summary=f"Case opened at {case.camp_location}. Department: {case.department}, Priority: {case.priority}.",
        raw_id=case.case_id,
        metadata={
            "priority": case.priority,
            "department": case.department,
            "camp": case.camp_location
        }
    ))

    # 2. Imaging Events
    for img in imaging_list:
        freshness = calculate_freshness(img.captured_at, "imaging")
        events.append(TimelineEvent(
            event_id=f"EVT-{img.imaging_id}",
            event_type="Image Captured",
            timestamp=img.captured_at,
            source=f"Screening Pod ({img.modality})",
            status=img.review_status,
            freshness=freshness,
            quality=f"{img.quality_status} ({img.quality_score:.0f}/100)",
            reviewer=img.operator_id,
            summary=f"{img.modality} acquisition on {img.device_id}. Status: {img.review_status}. {img.findings_summary or ''}",
            raw_id=img.imaging_id,
            metadata={
                "modality": img.modality,
                "device_id": img.device_id,
                "operator_id": img.operator_id,
                "quality_score": img.quality_score,
                "location": img.location
            }
        ))

    # 3. Specimen Events
    for spec in specimen_list:
        # Collection
        events.append(TimelineEvent(
            event_id=f"EVT-COL-{spec.specimen_id}",
            event_type="Specimen Collected",
            timestamp=spec.collection_time,
            source="Field Specimen Station",
            status="COLLECTED",
            freshness="FRESH",
            quality="PRESERVED",
            reviewer="Field Phlebotomy / Nurse",
            summary=f"Biomaterial collected from {spec.collection_site}.",
            raw_id=spec.specimen_id,
            metadata={"collection_site": spec.collection_site}
        ))

        # Transport
        if spec.transport_time:
            events.append(TimelineEvent(
                event_id=f"EVT-TR-{spec.specimen_id}",
                event_type="Specimen Transport",
                timestamp=spec.transport_time,
                source="Logistics Courier",
                status="IN_TRANSIT",
                freshness="FRESH",
                quality="COLD_CHAIN_ACTIVE",
                reviewer="Logistics Lead",
                summary="Packed in cold container and dispatched to Central Diagnostic Lab.",
                raw_id=spec.specimen_id,
                metadata={}
            ))

        # Receipt
        if spec.received_time:
            is_lost = spec.processing_status == "LOST_LINKAGE"
            events.append(TimelineEvent(
                event_id=f"EVT-REC-{spec.specimen_id}",
                event_type="Laboratory Receipt",
                timestamp=spec.received_time,
                source="Central Diagnostic Lab",
                status="BROKEN" if is_lost else "RECEIVED",
                freshness="FRESH",
                quality="FAILED" if is_lost else "VERIFIED",
                reviewer="Lab Accession Officer",
                summary="Specimen accession lost / bar-code error" if is_lost else f"Specimen received and accessioned. Status: {spec.processing_status}",
                raw_id=spec.specimen_id,
                metadata={"processing_status": spec.processing_status}
            ))

    # 4. Pathology Results
    for path in pathology_list:
        freshness = calculate_freshness(path.result_at, "pathology")
        events.append(TimelineEvent(
            event_id=f"EVT-{path.pathology_id}",
            event_type="Pathology Result",
            timestamp=path.result_at,
            source="Ocular Pathology Lab",
            status=path.status,
            freshness=freshness,
            quality=f"Severity: {path.severity}",
            reviewer="Pathology Reviewer",
            summary=f"Pathology Finding: {path.finding} (Severity: {path.severity})",
            raw_id=path.pathology_id,
            metadata={
                "severity": path.severity,
                "status": path.status,
                "specimen_id": path.specimen_id
            }
        ))

    # 5. Molecular Results
    for mol in molecular_list:
        freshness = calculate_freshness(mol.result_at, "molecular")
        events.append(TimelineEvent(
            event_id=f"EVT-{mol.molecular_id}",
            event_type="Molecular Result",
            timestamp=mol.result_at,
            source="Molecular Genetics Unit",
            status=mol.result_status,
            freshness=freshness,
            quality=f"Confidence: {int(mol.confidence * 100)}%",
            reviewer="Molecular Reviewer",
            summary=f"Test: {mol.test_type}. Result: {mol.finding}",
            raw_id=mol.molecular_id,
            metadata={
                "test_type": mol.test_type,
                "confidence": mol.confidence,
                "result_status": mol.result_status
            }
        ))

    # 6. Review Decisions
    for rev in review_list:
        events.append(TimelineEvent(
            event_id=f"EVT-{rev.review_id}",
            event_type="Review Decision",
            timestamp=rev.reviewed_at,
            source="Multidisciplinary Review Board",
            status=rev.decision,
            freshness="FRESH",
            quality=f"Confidence: {int(rev.confidence * 100)}%",
            reviewer=rev.reviewer_role,
            summary=f"Review Decision: {rev.decision}. Reason: {rev.reason}",
            raw_id=rev.review_id,
            metadata={
                "decision": rev.decision,
                "confidence": rev.confidence,
                "completeness": rev.evidence_completeness
            }
        ))

    # Sort chronological by timestamp
    events.sort(key=lambda x: x.timestamp)
    return events


def log_audit_event(
    db: Session,
    user_role: str,
    action: str,
    resource_type: str,
    result: str = "SUCCESS",
    case_id: Optional[str] = None,
    details: Optional[str] = None
) -> AuditLog:
    """
    Records an immutable audit event in the database.
    """
    audit = AuditLog(
        timestamp=datetime.utcnow(),
        user_role=user_role,
        case_id=case_id,
        action=action,
        resource_type=resource_type,
        result=result,
        details=details
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit
