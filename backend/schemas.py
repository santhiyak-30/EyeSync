import re
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator


ALLOWED_COLLECTION_SITES = [
    "Right Tear Film",
    "Left Tear Film",
    "Bilateral Conjunctival Swab",
    "Right Anterior Chamber Micro-aspirate",
    "Left Epithelial Scraping"
]

ALLOWED_SPECIMEN_STATUSES = [
    "RECEIVED",
    "IN_TRANSIT",
    "PROCESSED",
    "LOST_LINKAGE"
]

ALLOWED_REVIEW_DECISIONS = [
    "CLEAR",
    "REFER",
    "REVIEW_REQUIRED",
    "INSUFFICIENT_EVIDENCE"
]

ALLOWED_ROLES = [
    "Camp Coordinator",
    "Imaging Reviewer",
    "Pathology Reviewer",
    "Molecular Reviewer",
    "Case Reviewer",
    "Administrator"
]


# --------------------------------------------------------------------------
# Authentication & Authorization Schemas
# --------------------------------------------------------------------------
class LoginRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    username: str = Field(..., min_length=1, description="Username")
    password: str = Field(..., min_length=1, description="Password")


class RoleTokenRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    role: str = Field(..., description="EyeSync role identifier")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        v_clean = v.strip()
        matched = next((r for r in ALLOWED_ROLES if r.lower() == v_clean.lower()), None)
        if not matched:
            raise ValueError(f"role '{v}' is not recognized. Allowed roles: {ALLOWED_ROLES}")
        return matched


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    full_name: Optional[str] = None
    expires_in_seconds: int


class AuthenticatedUserOut(BaseModel):
    username: str
    role: str
    full_name: Optional[str] = None
    permissions: Dict[str, Any]


# --------------------------------------------------------------------------
# Core Entity Output Schemas
# --------------------------------------------------------------------------
class CaseBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    case_id: str
    case_created_at: datetime
    camp_location: str
    screening_status: str
    priority: str
    department: str
    assigned_reviewer: str


class ImagingEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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


class SpecimenOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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


# --------------------------------------------------------------------------
# Strict Specimen Ingestion Payload (Qbee Review 1 Key Improvement)
# --------------------------------------------------------------------------
class SpecimenIngestPayload(BaseModel):
    """
    Strict API schema for specimen accession ingestion into the screening camp pipeline.
    Validates field types, regex identifiers, categorical values, and temporal/lineage coherence.
    """
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    specimen_id: str = Field(..., description="Unique specimen accession code, e.g. SPEC-0001")
    case_id: str = Field(..., description="Associated case identifier, e.g. CASE-0001")
    collection_time: datetime = Field(..., description="Timestamp of specimen acquisition in field camp")
    collection_site: str = Field(..., description="Anatomical sampling site")
    transport_time: Optional[datetime] = Field(None, description="Cold chain dispatch timestamp")
    received_time: Optional[datetime] = Field(None, description="Laboratory intake timestamp")
    processing_status: str = Field(..., description="Accession custody status")
    linked_pathology_id: Optional[str] = Field(None, description="Linked pathology identifier, e.g. PATH-0001")
    linked_molecular_id: Optional[str] = Field(None, description="Linked molecular identifier, e.g. MOL-0001")

    @field_validator("specimen_id")
    @classmethod
    def validate_specimen_id(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("specimen_id cannot be empty or whitespace")
        v_clean = v.strip()
        if not re.match(r"^SPEC-\d{4,}$", v_clean):
            raise ValueError("specimen_id must follow the format 'SPEC-XXXX' (e.g., SPEC-0001)")
        return v_clean

    @field_validator("case_id")
    @classmethod
    def validate_case_id(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("case_id cannot be empty or whitespace")
        v_clean = v.strip()
        if not re.match(r"^CASE-\d{4,}$", v_clean):
            raise ValueError("case_id must follow the format 'CASE-XXXX' (e.g., CASE-0001)")
        return v_clean

    @field_validator("collection_site")
    @classmethod
    def validate_collection_site(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("collection_site cannot be empty or whitespace")
        v_clean = v.strip()
        matched = next((site for site in ALLOWED_COLLECTION_SITES if site.lower() == v_clean.lower()), None)
        if not matched:
            raise ValueError(f"collection_site '{v}' is invalid. Allowed sites: {ALLOWED_COLLECTION_SITES}")
        return matched

    @field_validator("processing_status")
    @classmethod
    def validate_processing_status(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("processing_status cannot be empty or whitespace")
        v_upper = v.strip().upper()
        if v_upper not in ALLOWED_SPECIMEN_STATUSES:
            raise ValueError(f"processing_status '{v}' is invalid. Allowed statuses: {ALLOWED_SPECIMEN_STATUSES}")
        return v_upper

    @field_validator("linked_pathology_id")
    @classmethod
    def validate_pathology_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v_strip = v.strip()
        if not v_strip:
            return None
        if not re.match(r"^PATH-\d{4,}$", v_strip):
            raise ValueError("linked_pathology_id must follow the format 'PATH-XXXX' (e.g., PATH-0001)")
        return v_strip

    @field_validator("linked_molecular_id")
    @classmethod
    def validate_molecular_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v_strip = v.strip()
        if not v_strip:
            return None
        if not re.match(r"^MOL-\d{4,}$", v_strip):
            raise ValueError("linked_molecular_id must follow the format 'MOL-XXXX' (e.g., MOL-0001)")
        return v_strip

    @field_validator("collection_time")
    @classmethod
    def validate_collection_time(cls, v: datetime) -> datetime:
        now_dt = datetime.now(v.tzinfo) if v.tzinfo else datetime.utcnow()
        if v > now_dt + timedelta(days=2):
            raise ValueError("collection_time cannot be a future timestamp beyond current screening camp window")
        return v

    @model_validator(mode="after")
    def validate_lineage_and_chronology(self) -> "SpecimenIngestPayload":
        # 1. Temporal sequence checks
        if self.transport_time is not None:
            if self.transport_time < self.collection_time:
                raise ValueError(
                    f"Invalid temporal sequence: transport_time ({self.transport_time}) cannot be prior to collection_time ({self.collection_time})"
                )

        if self.received_time is not None:
            if self.received_time < self.collection_time:
                raise ValueError(
                    f"Invalid temporal sequence: received_time ({self.received_time}) cannot be prior to collection_time ({self.collection_time})"
                )
            if self.transport_time is not None and self.received_time < self.transport_time:
                raise ValueError(
                    f"Invalid temporal sequence: received_time ({self.received_time}) cannot be prior to transport_time ({self.transport_time})"
                )

        # 2. Lineage state coherence checks
        if self.processing_status == "IN_TRANSIT" and self.received_time is not None:
            raise ValueError(
                "Invalid lineage state: Specimen marked 'IN_TRANSIT' cannot have a laboratory received_time recorded"
            )

        if self.processing_status == "LOST_LINKAGE":
            if self.linked_pathology_id is not None and self.linked_molecular_id is not None:
                raise ValueError(
                    "Invalid lineage relationship: Specimen with 'LOST_LINKAGE' cannot possess valid downstream diagnostic linkages"
                )

        if self.processing_status == "PROCESSED" and self.received_time is None:
            raise ValueError(
                "Invalid custody state: Specimen marked 'PROCESSED' must have a recorded laboratory received_time"
            )

        return self


class PathologyResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pathology_id: str
    case_id: str
    specimen_id: Optional[str] = None
    result_at: datetime
    finding: str
    severity: str
    status: str
    freshness: Optional[str] = None


class MolecularResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    molecular_id: str
    case_id: str
    specimen_id: Optional[str] = None
    result_at: datetime
    result_status: str
    confidence: float
    test_type: str
    finding: str
    freshness: Optional[str] = None


class ReviewDecisionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    review_id: str
    case_id: str
    reviewer_role: str
    reviewed_at: datetime
    decision: str
    confidence: float
    reason: str
    evidence_completeness: float


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    user_role: str
    case_id: Optional[str] = None
    action: str
    resource_type: str
    result: str
    details: Optional[str] = None


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
    event_type: str
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
    status: str
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


# --------------------------------------------------------------------------
# Strict Review Request Schema
# --------------------------------------------------------------------------
class ReviewCreateRequest(BaseModel):
    """
    Strict API schema for multidisciplinary review submissions.
    Enforces format constraints, allowed decision categories, confidence bounds, and rationale length.
    """
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    case_id: str = Field(..., description="Case identifier, e.g. CASE-0001")
    reviewer_role: Optional[str] = Field(None, description="Reviewer role (enforced from verified JWT context)")
    decision: str = Field(..., description="Clinical decision")
    confidence: float = Field(..., description="Diagnostic confidence score between 0.0 and 1.0")
    reason: str = Field(..., min_length=5, max_length=2000, description="Mandatory clinical rationale")

    @field_validator("case_id")
    @classmethod
    def validate_case_id(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("case_id cannot be empty or whitespace")
        v_clean = v.strip()
        if not re.match(r"^CASE-\d{4,}$", v_clean):
            raise ValueError("case_id must follow the format 'CASE-XXXX' (e.g. CASE-0001)")
        return v_clean

    @field_validator("decision")
    @classmethod
    def validate_decision(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("decision cannot be empty or whitespace")
        v_upper = v.strip().upper()
        if v_upper not in ALLOWED_REVIEW_DECISIONS:
            raise ValueError(f"decision '{v}' is invalid. Allowed decisions: {ALLOWED_REVIEW_DECISIONS}")
        return v_upper

    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v: float) -> float:
        if v < 0.0 or v > 1.0:
            raise ValueError(f"confidence must be between 0.0 and 1.0 inclusive (received {v})")
        return round(float(v), 4)

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("reason cannot be empty or whitespace")
        v_strip = v.strip()
        if len(v_strip) < 5:
            raise ValueError("Clinical rationale must contain at least 5 non-whitespace characters")
        return v_strip


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
