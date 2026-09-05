from datetime import datetime
from pathlib import Path
import pandas as pd
from sqlalchemy.orm import Session

try:
    from .database import engine, Base, SessionLocal
    from .models import Case, ImagingEvent, Specimen, PathologyResult, MolecularResult, ReviewDecision, AuditLog
    from .data_generator import generate_synthetic_data, DATA_DIR
except ImportError:
    from database import engine, Base, SessionLocal
    from models import Case, ImagingEvent, Specimen, PathologyResult, MolecularResult, ReviewDecision, AuditLog
    from data_generator import generate_synthetic_data, DATA_DIR


def parse_dt(val):
    if pd.isna(val) or val is None or val == "":
        return None
    if isinstance(val, datetime):
        return val
    try:
        return datetime.fromisoformat(str(val))
    except Exception:
        return None


def seed_database(force: bool = False):
    """
    Idempotently seeds SQLite database from synthetic CSV files.
    If CSV files do not exist, runs the data generator first.
    """
    # Check if CSV files exist
    required_files = [
        "cases.csv", "imaging_events.csv", "specimens.csv",
        "pathology_results.csv", "molecular_results.csv",
        "review_decisions.csv", "audit_logs.csv"
    ]
    all_exist = all((DATA_DIR / f).exists() for f in required_files)
    if not all_exist or force:
        print("CSV files missing or force reload requested. Running data generator...")
        generate_synthetic_data()

    # Create tables
    if force:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check existing cases count
        existing_cases = db.query(Case).count()
        if existing_cases >= 500 and not force:
            print(f"Database already populated with {existing_cases} cases. Skipping seed.")
            return

        print("Seeding database from CSV files...")

        # 1. Cases
        df_cases = pd.read_csv(DATA_DIR / "cases.csv")
        for _, row in df_cases.iterrows():
            if not db.query(Case).filter(Case.case_id == row["case_id"]).first():
                db.add(Case(
                    case_id=row["case_id"],
                    case_created_at=parse_dt(row["case_created_at"]),
                    camp_location=row["camp_location"],
                    screening_status=row["screening_status"],
                    priority=row["priority"],
                    department=row["department"],
                    assigned_reviewer=row["assigned_reviewer"]
                ))
        db.commit()

        # 2. Imaging Events
        df_imaging = pd.read_csv(DATA_DIR / "imaging_events.csv")
        for _, row in df_imaging.iterrows():
            if not db.query(ImagingEvent).filter(ImagingEvent.imaging_id == row["imaging_id"]).first():
                db.add(ImagingEvent(
                    imaging_id=row["imaging_id"],
                    case_id=row["case_id"],
                    captured_at=parse_dt(row["captured_at"]),
                    modality=row["modality"],
                    quality_score=float(row["quality_score"]),
                    quality_status=row["quality_status"],
                    device_id=row["device_id"],
                    operator_id=row["operator_id"],
                    location=row["location"],
                    review_status=row["review_status"],
                    findings_summary=row.get("findings_summary")
                ))
        db.commit()

        # 3. Specimens
        df_specimens = pd.read_csv(DATA_DIR / "specimens.csv")
        for _, row in df_specimens.iterrows():
            if not db.query(Specimen).filter(Specimen.specimen_id == row["specimen_id"]).first():
                db.add(Specimen(
                    specimen_id=row["specimen_id"],
                    case_id=row["case_id"],
                    collection_time=parse_dt(row["collection_time"]),
                    collection_site=row["collection_site"],
                    transport_time=parse_dt(row["transport_time"]),
                    received_time=parse_dt(row["received_time"]),
                    processing_status=row["processing_status"],
                    linked_pathology_id=row["linked_pathology_id"] if pd.notna(row["linked_pathology_id"]) else None,
                    linked_molecular_id=row["linked_molecular_id"] if pd.notna(row["linked_molecular_id"]) else None
                ))
        db.commit()

        # 4. Pathology Results
        df_pathology = pd.read_csv(DATA_DIR / "pathology_results.csv")
        for _, row in df_pathology.iterrows():
            if not db.query(PathologyResult).filter(PathologyResult.pathology_id == row["pathology_id"]).first():
                db.add(PathologyResult(
                    pathology_id=row["pathology_id"],
                    case_id=row["case_id"],
                    specimen_id=row["specimen_id"] if pd.notna(row["specimen_id"]) else None,
                    result_at=parse_dt(row["result_at"]),
                    finding=row["finding"],
                    severity=row["severity"],
                    status=row["status"]
                ))
        db.commit()

        # 5. Molecular Results
        df_molecular = pd.read_csv(DATA_DIR / "molecular_results.csv")
        for _, row in df_molecular.iterrows():
            if not db.query(MolecularResult).filter(MolecularResult.molecular_id == row["molecular_id"]).first():
                db.add(MolecularResult(
                    molecular_id=row["molecular_id"],
                    case_id=row["case_id"],
                    specimen_id=row["specimen_id"] if pd.notna(row["specimen_id"]) else None,
                    result_at=parse_dt(row["result_at"]),
                    result_status=row["result_status"],
                    confidence=float(row["confidence"]),
                    test_type=row["test_type"],
                    finding=row["finding"]
                ))
        db.commit()

        # 6. Review Decisions
        df_reviews = pd.read_csv(DATA_DIR / "review_decisions.csv")
        for _, row in df_reviews.iterrows():
            if not db.query(ReviewDecision).filter(ReviewDecision.review_id == row["review_id"]).first():
                db.add(ReviewDecision(
                    review_id=row["review_id"],
                    case_id=row["case_id"],
                    reviewer_role=row["reviewer_role"],
                    reviewed_at=parse_dt(row["reviewed_at"]),
                    decision=row["decision"],
                    confidence=float(row["confidence"]),
                    reason=row["reason"],
                    evidence_completeness=float(row["evidence_completeness"])
                ))
        db.commit()

        # 7. Audit Logs
        df_audit = pd.read_csv(DATA_DIR / "audit_logs.csv")
        for _, row in df_audit.iterrows():
            db.add(AuditLog(
                timestamp=parse_dt(row["timestamp"]),
                user_role=row["user_role"],
                case_id=row["case_id"] if pd.notna(row["case_id"]) else None,
                action=row["action"],
                resource_type=row["resource_type"],
                result=row["result"],
                details=row.get("details")
            ))
        db.commit()

        print(f"Database seeding completed successfully! Populated {db.query(Case).count()} cases.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
