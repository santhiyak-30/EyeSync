from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

try:
    from .database import Base
except ImportError:
    from database import Base


class Case(Base):
    __tablename__ = "cases"

    case_id = Column(String(32), primary_key=True, index=True)
    case_created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    camp_location = Column(String(128), nullable=False)
    screening_status = Column(String(64), nullable=False)  # Under Review, Ready for Review, Review Completed, Pending Evidence
    priority = Column(String(32), nullable=False)  # High, Medium, Low, Critical
    department = Column(String(64), nullable=False)  # Ophthalmology, Retinal Care, Glaucoma Clinic
    assigned_reviewer = Column(String(64), nullable=False)

    # Relationships
    imaging_events = relationship("ImagingEvent", back_populates="case", cascade="all, delete-orphan")
    specimens = relationship("Specimen", back_populates="case", cascade="all, delete-orphan")
    pathology_results = relationship("PathologyResult", back_populates="case", cascade="all, delete-orphan")
    molecular_results = relationship("MolecularResult", back_populates="case", cascade="all, delete-orphan")
    review_decisions = relationship("ReviewDecision", back_populates="case", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="case", cascade="all, delete-orphan")


class ImagingEvent(Base):
    __tablename__ = "imaging_events"

    imaging_id = Column(String(32), primary_key=True, index=True)
    case_id = Column(String(32), ForeignKey("cases.case_id"), nullable=False, index=True)
    captured_at = Column(DateTime, nullable=False)
    modality = Column(String(64), nullable=False)  # Fundus, OCT, Slit Lamp, Retinal Image
    quality_score = Column(Float, nullable=False)  # 0 to 100
    quality_status = Column(String(32), nullable=False)  # GOOD, ACCEPTABLE, LOW_QUALITY, MISSING
    device_id = Column(String(64), nullable=False)
    operator_id = Column(String(64), nullable=False)
    location = Column(String(128), nullable=False)
    review_status = Column(String(64), nullable=False)  # NORMAL, ABNORMAL, PENDING_READ, INCONCLUSIVE
    findings_summary = Column(Text, nullable=True)

    case = relationship("Case", back_populates="imaging_events")


class Specimen(Base):
    __tablename__ = "specimens"

    specimen_id = Column(String(32), primary_key=True, index=True)
    case_id = Column(String(32), ForeignKey("cases.case_id"), nullable=False, index=True)
    collection_time = Column(DateTime, nullable=False)
    collection_site = Column(String(128), nullable=False)
    transport_time = Column(DateTime, nullable=True)
    received_time = Column(DateTime, nullable=True)
    processing_status = Column(String(64), nullable=False)  # RECEIVED, IN_TRANSIT, PROCESSED, LOST_LINKAGE
    linked_pathology_id = Column(String(32), nullable=True)
    linked_molecular_id = Column(String(32), nullable=True)

    case = relationship("Case", back_populates="specimens")


class PathologyResult(Base):
    __tablename__ = "pathology_results"

    pathology_id = Column(String(32), primary_key=True, index=True)
    case_id = Column(String(32), ForeignKey("cases.case_id"), nullable=False, index=True)
    specimen_id = Column(String(32), nullable=True)
    result_at = Column(DateTime, nullable=False)
    finding = Column(Text, nullable=False)
    severity = Column(String(32), nullable=False)  # NONE, MILD, MODERATE, SEVERE
    status = Column(String(32), nullable=False)  # NORMAL, ABNORMAL, PENDING, INCONCLUSIVE

    case = relationship("Case", back_populates="pathology_results")


class MolecularResult(Base):
    __tablename__ = "molecular_results"

    molecular_id = Column(String(32), primary_key=True, index=True)
    case_id = Column(String(32), ForeignKey("cases.case_id"), nullable=False, index=True)
    specimen_id = Column(String(32), nullable=True)
    result_at = Column(DateTime, nullable=False)
    result_status = Column(String(32), nullable=False)  # AVAILABLE, STALE, MISSING, LOW_CONFIDENCE
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0
    test_type = Column(String(128), nullable=False)
    finding = Column(Text, nullable=False)

    case = relationship("Case", back_populates="molecular_results")


class ReviewDecision(Base):
    __tablename__ = "review_decisions"

    review_id = Column(String(32), primary_key=True, index=True)
    case_id = Column(String(32), ForeignKey("cases.case_id"), nullable=False, index=True)
    reviewer_role = Column(String(64), nullable=False)
    reviewed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    decision = Column(String(64), nullable=False)  # CLEAR, REFER, REVIEW_REQUIRED, INSUFFICIENT_EVIDENCE
    confidence = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    evidence_completeness = Column(Float, nullable=False)

    case = relationship("Case", back_populates="review_decisions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_role = Column(String(64), nullable=False)
    case_id = Column(String(32), ForeignKey("cases.case_id"), nullable=True, index=True)
    action = Column(String(64), nullable=False)  # CASE_VIEWED, REVIEW_SUBMITTED, etc.
    resource_type = Column(String(64), nullable=False)
    result = Column(String(32), nullable=False)  # SUCCESS, WARNING, FAILED
    details = Column(Text, nullable=True)

    case = relationship("Case", back_populates="audit_logs")
