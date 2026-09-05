from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CaseBase(BaseModel):
    case_id: str
    case_created_at: datetime
    camp_location: str
    screening_status: str
    priority: str
    department: str
    assigned_reviewer: str

    class Config:
        from_attributes = True


class ImagingEventOut(BaseModel):
    imaging_id: str
    case_id: str
    captured_at: datetime
    modality: str
    quality_score: float
    quality_status: str
    device_id: str
    operator_id: str
    location: str
    review_status: str
    findings_summary: Optional[str] = None
    freshness: Optional[str] = None

    class Config:
        from_attributes = True


class SpecimenOut(BaseModel):
    specimen_id: str
    case_id: str
    collection_time: datetime
    collection_site: str
    transport_time: Optional[datetime] = None
    received_time: Optional[datetime] = None
    processing_status: str
    linked_pathology_id: Optional[str] = None
    linked_molecular_id: Optional[str] = None
    is_lineage_broken: Optional[bool] = False

    class Config:
        from_attributes = True


class PathologyResultOut(BaseModel):
    pathology_id: str
    case_id: str
    specimen_id: Optional[str] = None
    result_at: datetime
    finding: str
    severity: str
    status: str
    freshness: Optional[str] = None

    class Config:
        from_attributes = True


class MolecularResultOut(BaseModel):
    molecular_id: str
    case_id: str
    specimen_id: Optional[str] = None
    result_at: datetime
    result_status: str
    confidence: float
    test_type: str
    finding: str
    freshness: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewDecisionOut(BaseModel):
    review_id: str
    case_id: str
    reviewer_role: str
    reviewed_at: datetime
    decision: str
    confidence: float
    reason: str
    evidence_completeness: float

    class Config:
        from_attributes = True


class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    user_role: str
    case_id: Optional[str] = None
    action: str
    resource_type: str
    result: str
    details: Optional[str] = None

    class Config:
        from_attributes = True


class CompletenessItem(BaseModel):
    name: str
    available: bool
    points_awarded: float
    max_points: float


class EvidenceCompletenessBreakdown(BaseModel):
    score: float
    items: List[CompletenessItem]
    missing_items: List[str]


class UncertaintyAlert(BaseModel):
    type: str  # MISSING_MOLECULAR, LOW_QUALITY_IMAGING, STALE_MOLECULAR, CONFLICT, BROKEN_LINEAGE, DUPLICATE_IMAGING
    severity: str  # HIGH, MEDIUM, LOW
    title: str
    message: str
    recommended_action: str


class TimelineEvent(BaseModel):
    event_id: str
    event_type: str  # Case Created, Image Captured, Specimen Collected, Specimen Received, Pathology Result, Molecular Result, Review Decision
    timestamp: datetime
    source: str
    status: str
    freshness: Optional[str] = None
    quality: Optional[str] = None
    reviewer: Optional[str] = None
    summary: str
    raw_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SpecimenLineageStep(BaseModel):
    step_number: int
    step_name: str
    entity_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    status: str  # OK, PENDING, BROKEN, DELAYED
    details: str
    is_broken: bool = False


class CaseListItem(BaseModel):
    case_id: str
    case_created_at: datetime
    camp_location: str
    screening_status: str
    priority: str
    department: str
    assigned_reviewer: str
    completeness_score: float
    imaging_status: str
    pathology_status: str
    molecular_status: str
    lineage_status: str
    review_status: str
    overall_freshness: str
    has_conflict: bool
    has_low_quality_imaging: bool
    has_stale_evidence: bool
    has_broken_lineage: bool
    missing_evidence_count: int


class CaseDetailResponse(BaseModel):
    case_id: str
    case_created_at: datetime
    camp_location: str
    screening_status: str
    priority: str
    department: str
    assigned_reviewer: str
    completeness: EvidenceCompletenessBreakdown
    uncertainties: List[UncertaintyAlert]
    timeline: List[TimelineEvent]
    lineage: List[SpecimenLineageStep]
    imaging: Optional[List[ImagingEventOut]] = None
    specimens: Optional[List[SpecimenOut]] = None
    pathology: Optional[List[PathologyResultOut]] = None
    molecular: Optional[List[MolecularResultOut]] = None
    reviews: Optional[List[ReviewDecisionOut]] = None
    audit_history: Optional[List[AuditLogOut]] = None


class ReviewCreateRequest(BaseModel):
    case_id: str
    reviewer_role: str
    decision: str  # CLEAR, REFER, REVIEW_REQUIRED, INSUFFICIENT_EVIDENCE
    confidence: float
    reason: str


class ReviewResponse(BaseModel):
    success: bool
    message: str
    review: ReviewDecisionOut


class DashboardMetricsResponse(BaseModel):
    total_cases: int
    ready_for_review: int
    missing_evidence_cases: int
    stale_evidence_cases: int
    low_quality_imaging_cases: int
    conflicting_evidence_cases: int
    broken_lineage_cases: int
    cases_by_status: List[Dict[str, Any]]
    completeness_distribution: List[Dict[str, Any]]
    missing_evidence_by_type: List[Dict[str, Any]]
    failure_cases_by_category: List[Dict[str, Any]]
    average_assembly_time_seconds: float
    recommended_demo_cases: List[Dict[str, Any]]


class DataQualityResponse(BaseModel):
    total_records: int
    duplicate_records: int
    missing_fields: int
    invalid_timestamps: int
    broken_lineage: int
    stale_evidence: int
    low_quality_imaging: int
    conflicts: int
    data_quality_score: float
    dataset_breakdown: Dict[str, int]


class FailureModeItem(BaseModel):
    failure_mode: str
    cause: str
    detection: str
    user_impact: str
    risk: str
    system_response: str
    recommended_action: str
    occurrence_count: int


class StakeholderFeedbackItem(BaseModel):
    role: str
    stakeholder_name: str
    ease_of_finding_evidence: float
    clarity_of_missing_evidence: float
    clarity_of_stale_evidence: float
    confidence_in_review: float
    overall_usefulness: float
    comment: str
