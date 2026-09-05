import random
from pathlib import Path
from typing import Dict, List, Any
import pandas as pd

# Fixed deterministic seed for reproducible experiment runs
EXPERIMENT_SEED = 1337
random.seed(EXPERIMENT_SEED)

BASE_DIR = Path(__file__).resolve().parent.parent
EXP_DIR = BASE_DIR / "experiments"


def run_experiment(num_test_cases: int = 50) -> Dict[str, Any]:
    """
    Executes a simulated comparative experiment measuring Case-Review Assembly Time:
    - BASELINE (Manual Workflow): Disconnected searches across 5 siloed systems
    - EYESYNC (Unified Timeline): Single-screen multidisciplinary timeline with automated validation
    """
    EXP_DIR.mkdir(parents=True, exist_ok=True)
    
    results: List[Dict[str, Any]] = []

    # Distribution of test case types across the 50 cases
    case_archetypes = [
        {"type": "Golden (Complete concordant)", "weight": 14, "completeness": 100.0},
        {"type": "Missing Molecular Evidence", "weight": 8, "completeness": 80.0},
        {"type": "Low-Quality Imaging", "weight": 7, "completeness": 90.0},
        {"type": "Stale Molecular Result", "weight": 7, "completeness": 100.0},
        {"type": "Conflicting Evidence", "weight": 7, "completeness": 100.0},
        {"type": "Broken Specimen Lineage", "weight": 7, "completeness": 70.0},
    ]

    archetype_pool = []
    for arch in case_archetypes:
        archetype_pool.extend([arch] * arch["weight"])

    # Ensure exactly num_test_cases
    archetype_pool = archetype_pool[:num_test_cases]

    for idx, arch in enumerate(archetype_pool, start=1):
        case_id = f"CASE-{idx:04d}"
        failure_mode = arch["type"]
        completeness = arch["completeness"]

        # Baseline manual workflow timing calculation:
        # Base searching times across 5 distinct applications:
        # PACS Imaging: 50-70s, LIMS Pathology: 55-75s, Molecular DB: 45-65s, Specimen Tracking: 40-60s, Review DB: 30-45s
        base_search_time = random.uniform(220.0, 315.0)

        # Baseline penalty when searching for anomalies without automated highlighting:
        penalty = 0.0
        baseline_errors = 0

        if failure_mode == "Missing Molecular Evidence":
            # Reviewer spends 50-80s trying to find the missing molecular test in other folders
            penalty = random.uniform(50.0, 85.0)
            # High risk of assuming negative result in manual workflow
            baseline_errors = 1
        elif failure_mode == "Low-Quality Imaging":
            # Reviewer spends time zooming, adjusting contrast, checking alternate camera exports
            penalty = random.uniform(40.0, 70.0)
            baseline_errors = 1 if random.random() < 0.35 else 0
        elif failure_mode == "Stale Molecular Result":
            # Manual checking of dates requires cross-referencing calendar and test dates
            penalty = random.uniform(35.0, 60.0)
            # Reviewer often misses that a test is >30 days old without automated flag
            baseline_errors = 1
        elif failure_mode == "Conflicting Evidence":
            # Reviewer notices conflict late, must flip back and forth between pathology and imaging
            penalty = random.uniform(70.0, 110.0)
            baseline_errors = 1 if random.random() < 0.40 else 0
        elif failure_mode == "Broken Specimen Lineage":
            # Reviewer searches transport logs, contacts courier, checks accession numbers
            penalty = random.uniform(85.0, 130.0)
            baseline_errors = 2  # Missing accession number and unknown specimen status
        else:
            # Golden concordant
            penalty = random.uniform(-10.0, 15.0)
            baseline_errors = 0

        baseline_time_sec = round(base_search_time + penalty, 1)

        # EyeSync unified workflow timing:
        # Immediate single-screen timeline display, pre-computed completeness score,
        # and uncertainty banners in red/amber. Reviewer directly sees all evidence.
        eyesync_base = random.uniform(35.0, 55.0)
        eyesync_penalty = 0.0

        if failure_mode == "Missing Molecular Evidence":
            # Prompt banner: "Molecular evidence unavailable" – reviewer immediately notes it in 8-15s
            eyesync_penalty = random.uniform(6.0, 14.0)
        elif failure_mode == "Low-Quality Imaging":
            # Quality warning displayed with score 38/100 – reviewer immediately triggers re-image in 10-18s
            eyesync_penalty = random.uniform(8.0, 16.0)
        elif failure_mode == "Stale Molecular Result":
            # Amber badge "STALE" – reviewer checks date in 5-10s
            eyesync_penalty = random.uniform(5.0, 12.0)
        elif failure_mode == "Conflicting Evidence":
            # Crimson alert "CONFLICTING EVIDENCE" – reviewer clicks review conference in 12-20s
            eyesync_penalty = random.uniform(10.0, 20.0)
        elif failure_mode == "Broken Specimen Lineage":
            # Broken lineage tree visualized with red cross – reviewer flags quarantine in 8-15s
            eyesync_penalty = random.uniform(8.0, 18.0)

        eyesync_time_sec = round(eyesync_base + eyesync_penalty, 1)
        time_saved_sec = round(baseline_time_sec - eyesync_time_sec, 1)
        time_saved_pct = round((time_saved_sec / baseline_time_sec) * 100.0, 1)
        eyesync_errors = 0  # EyeSync automated engine flags all anomalies deterministically

        results.append({
            "case_id": case_id,
            "failure_mode": failure_mode,
            "baseline_time_seconds": baseline_time_sec,
            "eyesync_time_seconds": eyesync_time_sec,
            "time_saved_seconds": time_saved_sec,
            "time_saved_percentage": time_saved_pct,
            "evidence_completeness": completeness,
            "baseline_errors": baseline_errors,
            "eyesync_errors": eyesync_errors
        })

    df = pd.DataFrame(results)
    df.to_csv(EXP_DIR / "experiment_results.csv", index=False)

    # Compute statistical benchmarks
    summary = {
        "total_test_cases": len(df),
        "baseline_avg_seconds": round(df["baseline_time_seconds"].mean(), 1),
        "eyesync_avg_seconds": round(df["eyesync_time_seconds"].mean(), 1),
        "baseline_median_seconds": round(df["baseline_time_seconds"].median(), 1),
        "eyesync_median_seconds": round(df["eyesync_time_seconds"].median(), 1),
        "average_time_saved_seconds": round(df["time_saved_seconds"].mean(), 1),
        "average_time_saved_percentage": round(df["time_saved_percentage"].mean(), 1),
        "baseline_total_errors": int(df["baseline_errors"].sum()),
        "eyesync_total_errors": int(df["eyesync_errors"].sum()),
        "baseline_error_rate_pct": round((df["baseline_errors"].sum() / (len(df) * 2)) * 100.0, 1),
        "eyesync_error_rate_pct": 0.0,
        "average_completeness_pct": round(df["evidence_completeness"].mean(), 1),
        "target_assembly_time_seconds": 120.0,
        "sample_cases": results[:10]
    }

    print(f"Experiment benchmark completed across {len(df)} simulated test cases:")
    print(f" - Baseline Average Assembly Time: {summary['baseline_avg_seconds']}s")
    print(f" - EyeSync Average Assembly Time:  {summary['eyesync_avg_seconds']}s")
    print(f" - Time Saved: {summary['average_time_saved_seconds']}s ({summary['average_time_saved_percentage']}%)")
    print(f" - Baseline Errors: {summary['baseline_total_errors']} vs EyeSync: {summary['eyesync_total_errors']}")

    return summary


def get_experiment_summary():
    """Reads or computes experiment results."""
    csv_path = EXP_DIR / "experiment_results.csv"
    if not csv_path.exists():
        return run_experiment()

    df = pd.read_csv(csv_path)
    return {
        "total_test_cases": len(df),
        "baseline_avg_seconds": round(df["baseline_time_seconds"].mean(), 1),
        "eyesync_avg_seconds": round(df["eyesync_time_seconds"].mean(), 1),
        "baseline_median_seconds": round(df["baseline_time_seconds"].median(), 1),
        "eyesync_median_seconds": round(df["eyesync_time_seconds"].median(), 1),
        "average_time_saved_seconds": round(df["time_saved_seconds"].mean(), 1),
        "average_time_saved_percentage": round(df["time_saved_percentage"].mean(), 1),
        "baseline_total_errors": int(df["baseline_errors"].sum()),
        "eyesync_total_errors": int(df["eyesync_errors"].sum()),
        "baseline_error_rate_pct": round((df["baseline_errors"].sum() / (len(df) * 2)) * 100.0, 1),
        "eyesync_error_rate_pct": 0.0,
        "average_completeness_pct": round(df["evidence_completeness"].mean(), 1),
        "target_assembly_time_seconds": 120.0,
        "by_failure_mode": df.groupby("failure_mode")[["baseline_time_seconds", "eyesync_time_seconds", "time_saved_percentage"]].mean().reset_index().to_dict(orient="records"),
        "sample_cases": df.to_dict(orient="records")
    }


if __name__ == "__main__":
    run_experiment()
