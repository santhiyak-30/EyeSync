import random
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd

# Set fixed deterministic random seed
SEED = 42
random.seed(SEED)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

CAMP_LOCATIONS = [
    "Camp-A (North Valley Health Center)",
    "Camp-B (Eastern Rural Mobile Clinic)",
    "Camp-C (Hillside Community Outpost)",
    "Camp-D (Riverdale Outreach Hub)",
    "Camp-E (Highland Primary Screening)"
]

DEPARTMENTS = [
    "Ophthalmology",
    "Retinal Care",
    "Corneal Services",
    "Glaucoma Screening",
    "Pediatric Eye Health"
]

PRIORITIES = ["Low", "Medium", "High", "Critical"]
MODALITIES = ["Fundus", "OCT", "Slit Lamp", "Retinal Image"]
OPERATORS = [f"TECH-{i:02d}" for i in range(1, 15)]
DEVICES = ["DEV-FUNDUS-01", "DEV-OCT-02", "DEV-SLIT-03", "DEV-RETINA-04"]
REVIEWERS = [f"Reviewer-{i:02d}" for i in range(1, 12)]

COLLECTION_SITES = [
    "Right Tear Film",
    "Left Tear Film",
    "Bilateral Conjunctival Swab",
    "Right Anterior Chamber Micro-aspirate",
    "Left Epithelial Scraping"
]

PATHOLOGY_FINDINGS_NORMAL = [
    "Normal cellular morphology with intact corneal epithelium.",
    "Normal tear-film cytology; no pathogenic bacterial or fungal elements.",
    "Acellular conjunctival stroma with physiological goblet cell distribution.",
    "Unremarkable cellular yield; physiological ocular surface cytology."
]

PATHOLOGY_FINDINGS_ABNORMAL = [
    "Epithelial hyperplasia with marked mononuclear inflammatory infiltrate.",
    "Corneal stromal disorganization with focal acanthamoeba-like cysts.",
    "Severe conjunctival dysplasia with marked goblet cell depletion.",
    "Microvascular neovascularization consistent with proliferative diabetic changes."
]

MOLECULAR_TEST_TYPES = [
    "Ocular Multiplex Viral PCR (HSV-1, HSV-2, VZV, CMV)",
    "Tear-Film Cytokine Biomarker Panel (IL-6, TNF-alpha, VEGF)",
    "Targeted Retinal Dystrophy Genetic Screen (25-gene panel)",
    "Bacterial 16S rRNA Broad-Range Microbial PCR"
]

MOLECULAR_FINDINGS_NEGATIVE = [
    "Target pathogen DNA not detected below limit of quantification; cytokine markers normal.",
    "Negative for viral genomic DNA; baseline inflammatory cytokine profile.",
    "Pathogenic sequence variants absent across targeted loci."
]

MOLECULAR_FINDINGS_POSITIVE = [
    "Positive for HSV-1 viral DNA (Ct value 22.4); marked elevation of IL-6 and TNF-alpha.",
    "High copy-number CMV DNA detected; prominent elevation of pro-inflammatory cytokines.",
    "Heterozygous pathogenic missense variant detected in ABCA4 (c.5882G>A, p.G1961E)."
]


def generate_synthetic_data():
    """Generates 500+ cases, specimens, pathology, imaging, molecular, review, and audit records."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    # Anchor date for realistic relative timestamps
    now = datetime(2026, 9, 3, 10, 0, 0)

    cases_data = []
    imaging_data = []
    specimens_data = []
    pathology_data = []
    molecular_data = []
    reviews_data = []
    audit_data = []

    audit_id_counter = 1

    total_cases = 500

    for i in range(1, total_cases + 1):
        case_id = f"CASE-{i:04d}"
        
        # Case creation timestamp (between 1 and 60 days ago)
        if i == 1:
            days_ago = 2  # Complete fresh golden case
        elif i == 4:
            days_ago = 45 # Intentionally stale molecular case
        elif i in (2, 3, 5, 6):
            days_ago = 3  # Recent screening cases for active review
        else:
            days_ago = random.randint(2, 50)
        case_created_at = now - timedelta(days=days_ago, hours=random.randint(1, 10), minutes=random.randint(1, 59))
        
        camp = random.choice(CAMP_LOCATIONS)
        dept = random.choice(DEPARTMENTS)
        priority = random.choice(PRIORITIES)
        assigned_reviewer = random.choice(REVIEWERS)

        # Baseline flags
        is_demo_case = i <= 6
        is_normal_case = (i == 1)
        is_missing_molecular = (i == 2)
        is_low_quality_img = (i == 3)
        is_stale_molecular = (i == 4)
        is_conflicting = (i == 5)
        is_broken_lineage = (i == 6)

        # Random failure conditions for remaining cases
        if not is_demo_case:
            rand_val = random.random()
            if rand_val < 0.15:
                is_missing_molecular = True
            elif rand_val < 0.25:
                is_low_quality_img = True
            elif rand_val < 0.35:
                is_stale_molecular = True
            elif rand_val < 0.42:
                is_conflicting = True
            elif rand_val < 0.48:
                is_broken_lineage = True

        screening_status = "Under Review"
        if is_normal_case or (not is_demo_case and random.random() < 0.45):
            screening_status = "Review Completed"
        elif is_missing_molecular or is_broken_lineage:
            screening_status = "Pending Evidence"
        elif is_low_quality_img or is_conflicting or is_stale_molecular:
            screening_status = "Ready for Review"

        cases_data.append({
            "case_id": case_id,
            "case_created_at": case_created_at.isoformat(),
            "camp_location": camp,
            "screening_status": screening_status,
            "priority": priority,
            "department": dept,
            "assigned_reviewer": assigned_reviewer
        })

        # Audit: Case Created
        audit_data.append({
            "id": audit_id_counter,
            "timestamp": case_created_at.isoformat(),
            "user_role": "Camp Coordinator",
            "case_id": case_id,
            "action": "CASE_CREATED",
            "resource_type": "CASE",
            "result": "SUCCESS",
            "details": f"Screening registration opened at {camp}."
        })
        audit_id_counter += 1

        # ----------------------------------------------------
        # 1. IMAGING EVENT
        # ----------------------------------------------------
        img_time = case_created_at + timedelta(hours=random.randint(1, 4), minutes=random.randint(5, 45))
        imaging_id = f"IMG-{i:04d}"
        modality = random.choice(MODALITIES)
        
        if is_low_quality_img:
            quality_score = round(random.uniform(25.0, 48.0), 1)
            quality_status = "LOW_QUALITY"
            review_status = "INCONCLUSIVE"
            findings = "Poor contrast due to dense cataract / media opacity; foveal reflex unidentifiable."
        elif is_conflicting:
            quality_score = 92.0
            quality_status = "GOOD"
            review_status = "NORMAL"
            findings = "Fundus examination shows sharp optic disc margins, clear macula, and normal vascular caliber."
        else:
            quality_score = round(random.uniform(75.0, 98.0), 1)
            quality_status = "GOOD" if quality_score > 85 else "ACCEPTABLE"
            review_status = "NORMAL" if random.random() < 0.65 else "ABNORMAL"
            findings = "Normal retinal vascular architecture." if review_status == "NORMAL" else "Focal microaneurysms and cotton wool spots observed in superior arcade."

        imaging_data.append({
            "imaging_id": imaging_id,
            "case_id": case_id,
            "captured_at": img_time.isoformat(),
            "modality": modality,
            "quality_score": quality_score,
            "quality_status": quality_status,
            "device_id": random.choice(DEVICES),
            "operator_id": random.choice(OPERATORS),
            "location": f"Pod {random.randint(1, 4)}",
            "review_status": review_status,
            "findings_summary": findings
        })

        # Inject duplicate imaging for CASE-0007 and occasional cases
        if i == 7 or (i > 10 and random.random() < 0.08):
            dup_img_time = img_time + timedelta(minutes=15)
            imaging_data.append({
                "imaging_id": f"IMG-{i:04d}-DUP",
                "case_id": case_id,
                "captured_at": dup_img_time.isoformat(),
                "modality": modality,
                "quality_score": round(quality_score + random.uniform(-5.0, 5.0), 1),
                "quality_status": quality_status,
                "device_id": random.choice(DEVICES),
                "operator_id": random.choice(OPERATORS),
                "location": f"Pod {random.randint(1, 4)}",
                "review_status": review_status,
                "findings_summary": f"Repeat acquisition for {modality} confirmation."
            })

        # ----------------------------------------------------
        # 2. SPECIMEN & LINEAGE
        # ----------------------------------------------------
        spec_time = case_created_at + timedelta(hours=random.randint(2, 6))
        transport_time = spec_time + timedelta(hours=random.randint(1, 3))
        received_time = transport_time + timedelta(hours=random.randint(4, 12))
        
        specimen_id = f"SPEC-{i:04d}"
        pathology_id = f"PATH-{i:04d}"
        molecular_id = f"MOL-{i:04d}"

        if is_broken_lineage:
            processing_status = "LOST_LINKAGE"
            linked_path = None
            linked_mol = None
            received_time = transport_time + timedelta(hours=8)
        else:
            processing_status = "PROCESSED"
            linked_path = pathology_id
            linked_mol = None if is_missing_molecular else molecular_id

        specimens_data.append({
            "specimen_id": specimen_id,
            "case_id": case_id,
            "collection_time": spec_time.isoformat(),
            "collection_site": random.choice(COLLECTION_SITES),
            "transport_time": transport_time.isoformat(),
            "received_time": received_time.isoformat() if received_time else None,
            "processing_status": processing_status,
            "linked_pathology_id": linked_path,
            "linked_molecular_id": linked_mol
        })

        # ----------------------------------------------------
        # 3. PATHOLOGY RESULT
        # ----------------------------------------------------
        path_time = received_time + timedelta(days=random.randint(1, 3))
        
        if is_conflicting:
            path_finding = "Prominent stromal necrosis and marked eosinophilic infiltration indicating aggressive keratitis."
            severity = "SEVERE"
            path_status = "ABNORMAL"
        elif is_broken_lineage:
            path_finding = "Specimen tube bar-code unreadable; aliquoted without confirmed chain of custody."
            severity = "MILD"
            path_status = "INCONCLUSIVE"
        else:
            is_abnormal = (review_status == "ABNORMAL") or (random.random() < 0.25)
            if is_abnormal:
                path_finding = random.choice(PATHOLOGY_FINDINGS_ABNORMAL)
                severity = random.choice(["MODERATE", "SEVERE"])
                path_status = "ABNORMAL"
            else:
                path_finding = random.choice(PATHOLOGY_FINDINGS_NORMAL)
                severity = "NONE"
                path_status = "NORMAL"

        pathology_data.append({
            "pathology_id": pathology_id,
            "case_id": case_id,
            "specimen_id": specimen_id,
            "result_at": path_time.isoformat(),
            "finding": path_finding,
            "severity": severity,
            "status": path_status
        })

        # ----------------------------------------------------
        # 4. MOLECULAR RESULT (omitted if is_missing_molecular)
        # ----------------------------------------------------
        if not is_missing_molecular:
            if is_stale_molecular:
                # 45 days prior to anchor date
                mol_time = now - timedelta(days=random.randint(35, 55))
                result_status = "STALE"
            else:
                mol_time = path_time + timedelta(days=random.randint(1, 4))
                # Check freshness
                age_days = (now - mol_time).total_seconds() / 86400.0
                result_status = "STALE" if age_days >= 30 else "AVAILABLE"

            confidence = round(random.uniform(0.85, 0.99), 2)
            test_type = random.choice(MOLECULAR_TEST_TYPES)
            mol_finding = random.choice(MOLECULAR_FINDINGS_NEGATIVE) if path_status == "NORMAL" else random.choice(MOLECULAR_FINDINGS_POSITIVE)

            molecular_data.append({
                "molecular_id": molecular_id,
                "case_id": case_id,
                "specimen_id": specimen_id,
                "result_at": mol_time.isoformat(),
                "result_status": result_status,
                "confidence": confidence,
                "test_type": test_type,
                "finding": mol_finding
            })

        # ----------------------------------------------------
        # 5. REVIEW DECISION
        # ----------------------------------------------------
        rev_time = path_time + timedelta(days=1, hours=random.randint(2, 6))
        review_id = f"REV-{i:04d}"
        
        if is_normal_case:
            decision = "CLEAR"
            confidence = 0.95
            reason = "Complete concordant evidence across imaging, cytology, and negative viral PCR. Routine follow-up in 12 months."
            completeness = 100.0
        elif is_missing_molecular:
            decision = "INSUFFICIENT_EVIDENCE"
            confidence = 0.60
            reason = "Molecular PCR result unavailable. Awaiting reflex viral biomarker testing before finalizing referral decision."
            completeness = 80.0
        elif is_low_quality_img:
            decision = "REVIEW_REQUIRED"
            confidence = 0.55
            reason = "Fundus imaging quality is sub-threshold (38/100). Patient scheduled for repeat in-person slit-lamp exam."
            completeness = 90.0
        elif is_stale_molecular:
            decision = "REVIEW_REQUIRED"
            confidence = 0.65
            reason = "Molecular test result is over 30 days old. Current clinical symptoms need re-evaluation against active pathology."
            completeness = 100.0
        elif is_conflicting:
            decision = "REVIEW_REQUIRED"
            confidence = 0.50
            reason = "High discrepancy: Severe pathology finding vs Normal imaging read. Multidisciplinary review conference required."
            completeness = 100.0
        elif is_broken_lineage:
            decision = "INSUFFICIENT_EVIDENCE"
            confidence = 0.40
            reason = "Specimen accession chain-of-custody broken. Laboratory results cannot be authenticated to this patient."
            completeness = 70.0
        else:
            decision = random.choice(["CLEAR", "REFER", "REVIEW_REQUIRED", "INSUFFICIENT_EVIDENCE"])
            confidence = round(random.uniform(0.70, 0.98), 2)
            reason = "Multidisciplinary evidence reviewed. Follow-up plan established based on risk stratification."
            completeness = 100.0 if not is_missing_molecular else 80.0

        reviews_data.append({
            "review_id": review_id,
            "case_id": case_id,
            "reviewer_role": "Case Reviewer",
            "reviewed_at": rev_time.isoformat(),
            "decision": decision,
            "confidence": confidence,
            "reason": reason,
            "evidence_completeness": completeness
        })

        # ----------------------------------------------------
        # 6. AUDIT LOG EVENTS
        # ----------------------------------------------------
        audit_data.append({
            "id": audit_id_counter,
            "timestamp": img_time.isoformat(),
            "user_role": "Imaging Reviewer",
            "case_id": case_id,
            "action": "EVIDENCE_VIEWED",
            "resource_type": "IMAGING",
            "result": "SUCCESS",
            "details": f"Reviewed {modality} capture ({quality_status})."
        })
        audit_id_counter += 1

        if is_low_quality_img:
            audit_data.append({
                "id": audit_id_counter,
                "timestamp": img_time.isoformat(),
                "user_role": "Imaging Reviewer",
                "case_id": case_id,
                "action": "LOW_QUALITY_DETECTED",
                "resource_type": "IMAGING",
                "result": "WARNING",
                "details": f"Sub-threshold quality score ({quality_score:.1f}/100) triggered automated flag."
            })
            audit_id_counter += 1

        if is_conflicting:
            audit_data.append({
                "id": audit_id_counter,
                "timestamp": rev_time.isoformat(),
                "user_role": "Case Reviewer",
                "case_id": case_id,
                "action": "CONFLICT_DETECTED",
                "resource_type": "CASE",
                "result": "WARNING",
                "details": "Pathology Severe Abnormality vs Imaging Normal detected by clinical rule engine."
            })
            audit_id_counter += 1

        if is_broken_lineage:
            audit_data.append({
                "id": audit_id_counter,
                "timestamp": received_time.isoformat(),
                "user_role": "Administrator",
                "case_id": case_id,
                "action": "LINEAGE_ERROR_DETECTED",
                "resource_type": "SPECIMEN",
                "result": "FAILED",
                "details": f"Lost specimen accession tag for {specimen_id} during central lab transport."
            })
            audit_id_counter += 1

        audit_data.append({
            "id": audit_id_counter,
            "timestamp": rev_time.isoformat(),
            "user_role": "Case Reviewer",
            "case_id": case_id,
            "action": "REVIEW_SUBMITTED",
            "resource_type": "REVIEW",
            "result": "SUCCESS",
            "details": f"Clinical decision recorded: {decision}."
        })
        audit_id_counter += 1

    # Convert to DataFrames and save to CSV
    df_cases = pd.DataFrame(cases_data)
    df_imaging = pd.DataFrame(imaging_data)
    df_specimens = pd.DataFrame(specimens_data)
    df_pathology = pd.DataFrame(pathology_data)
    df_molecular = pd.DataFrame(molecular_data)
    df_reviews = pd.DataFrame(reviews_data)
    df_audit = pd.DataFrame(audit_data)

    df_cases.to_csv(DATA_DIR / "cases.csv", index=False)
    df_imaging.to_csv(DATA_DIR / "imaging_events.csv", index=False)
    df_specimens.to_csv(DATA_DIR / "specimens.csv", index=False)
    df_pathology.to_csv(DATA_DIR / "pathology_results.csv", index=False)
    df_molecular.to_csv(DATA_DIR / "molecular_results.csv", index=False)
    df_reviews.to_csv(DATA_DIR / "review_decisions.csv", index=False)
    df_audit.to_csv(DATA_DIR / "audit_logs.csv", index=False)

    print(f"Successfully generated synthetic dataset:")
    print(f" - Cases: {len(df_cases)}")
    print(f" - Imaging events: {len(df_imaging)}")
    print(f" - Specimens: {len(df_specimens)}")
    print(f" - Pathology results: {len(df_pathology)}")
    print(f" - Molecular results: {len(df_molecular)}")
    print(f" - Review decisions: {len(df_reviews)}")
    print(f" - Audit logs: {len(df_audit)}")


if __name__ == "__main__":
    generate_synthetic_data()
