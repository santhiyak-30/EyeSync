import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import Case, ReviewDecision, AuditLog


class TestEyeSyncAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_endpoint(self):
        """Verify API health and database connectivity."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("SQLite connected", data["database"])
        self.assertGreaterEqual(data["total_cases"], 500)

    def test_02_cases_list_and_search(self):
        """Verify case retrieval, search filtering, and pagination."""
        response = self.client.get("/api/cases?skip=0&limit=10")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total"], 500)
        self.assertEqual(len(data["cases"]), 10)
        
        # Test search by case_id
        search_resp = self.client.get("/api/cases?search=CASE-0001")
        self.assertEqual(search_resp.status_code, 200)
        self.assertEqual(len(search_resp.json()["cases"]), 1)
        self.assertEqual(search_resp.json()["cases"][0]["case_id"], "CASE-0001")

    def test_03_golden_case_0001(self):
        """Verify Case 1 has 100% completeness and zero uncertainty alerts."""
        response = self.client.get("/api/cases/CASE-0001")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["case_id"], "CASE-0001")
        self.assertEqual(data["completeness"]["score"], 100.0)
        self.assertEqual(len(data["uncertainties"]), 0)
        self.assertGreater(len(data["timeline"]), 3)
        self.assertFalse(any(step["is_broken"] for step in data["lineage"]))

    def test_04_missing_molecular_case_0002(self):
        """Verify Case 2 detects missing molecular evidence without false negative."""
        response = self.client.get("/api/cases/CASE-0002")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["case_id"], "CASE-0002")
        self.assertEqual(len(data["molecular"]), 0)
        
        # Verify uncertainty alert
        alert_types = [a["type"] for a in data["uncertainties"]]
        self.assertIn("MISSING_MOLECULAR", alert_types)
        
        # Completeness should reflect missing 20 pts (80.0 score)
        self.assertEqual(data["completeness"]["score"], 80.0)
        self.assertIn("Molecular Testing", data["completeness"]["missing_items"])

    def test_05_low_quality_imaging_case_0003(self):
        """Verify Case 3 detects sub-threshold image quality."""
        response = self.client.get("/api/cases/CASE-0003")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["case_id"], "CASE-0003")
        
        alert_types = [a["type"] for a in data["uncertainties"]]
        self.assertIn("LOW_QUALITY_IMAGING", alert_types)
        self.assertLess(data["imaging"][0]["quality_score"], 60.0)

    def test_06_stale_molecular_case_0004(self):
        """Verify Case 4 detects stale molecular evidence (>30 days)."""
        response = self.client.get("/api/cases/CASE-0004")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["case_id"], "CASE-0004")
        
        alert_types = [a["type"] for a in data["uncertainties"]]
        self.assertIn("STALE_MOLECULAR", alert_types)
        self.assertEqual(data["molecular"][0]["freshness"], "STALE")

    def test_07_conflicting_evidence_case_0005(self):
        """Verify Case 5 detects conflict between pathology and imaging."""
        response = self.client.get("/api/cases/CASE-0005")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["case_id"], "CASE-0005")
        
        alert_types = [a["type"] for a in data["uncertainties"]]
        self.assertIn("CONFLICT", alert_types)
        self.assertEqual(data["pathology"][0]["status"], "ABNORMAL")
        self.assertEqual(data["imaging"][0]["review_status"], "NORMAL")

    def test_08_broken_specimen_lineage_case_0006(self):
        """Verify Case 6 detects interrupted chain-of-custody."""
        response = self.client.get("/api/cases/CASE-0006")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["case_id"], "CASE-0006")
        
        alert_types = [a["type"] for a in data["uncertainties"]]
        self.assertIn("BROKEN_LINEAGE", alert_types)
        
        # Verify lineage step has broken flag
        has_broken_step = any(step["is_broken"] for step in data["lineage"])
        self.assertTrue(has_broken_step)

    def test_09_review_submission_and_audit(self):
        """Verify submitting a review decision updates the case and appends an audit log."""
        test_case_id = "CASE-0010"
        payload = {
            "case_id": test_case_id,
            "reviewer_role": "Case Reviewer",
            "decision": "REFER",
            "confidence": 0.92,
            "reason": "Referral to tertiary corneal specialty center due to persistent marginal infiltrates."
        }
        response = self.client.post("/api/reviews", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["review"]["decision"], "REFER")

        # Verify case status updated
        case_resp = self.client.get(f"/api/cases/{test_case_id}")
        self.assertEqual(case_resp.status_code, 200)
        self.assertEqual(case_resp.json()["screening_status"], "Referred to Specialist")

        # Verify audit log recorded
        audit_resp = self.client.get(f"/api/audit-logs?case_id={test_case_id}&action=REVIEW_SUBMITTED")
        self.assertEqual(audit_resp.status_code, 200)
        self.assertGreaterEqual(audit_resp.json()["total"], 1)

    def test_10_dashboard_metrics(self):
        """Verify dashboard KPIs and chart data."""
        response = self.client.get("/api/dashboard/metrics")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["total_cases"], 500)
        self.assertGreater(len(data["cases_by_status"]), 0)
        self.assertGreater(len(data["completeness_distribution"]), 0)
        self.assertEqual(len(data["recommended_demo_cases"]), 6)

    def test_11_experiments_results(self):
        """Verify benchmark experiment results."""
        response = self.client.get("/api/experiments/results")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_test_cases"], 50)
        self.assertGreater(data["baseline_avg_seconds"], 200.0)
        self.assertLess(data["eyesync_avg_seconds"], 100.0)
        self.assertGreater(data["average_time_saved_percentage"], 70.0)

    def test_12_failure_modes_fmea(self):
        """Verify Failure Mode & Effects Analysis matrix endpoint."""
        response = self.client.get("/api/failures")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 6)
        modes = [item["failure_mode"] for item in data]
        self.assertIn("Missing Molecular Evidence", modes)
        self.assertIn("Low-Quality Imaging", modes)
        self.assertIn("Stale Molecular Result", modes)
        self.assertIn("Conflicting Evidence", modes)
        self.assertIn("Broken Specimen Lineage", modes)

    def test_13_data_quality(self):
        """Verify data quality endpoint returns metrics and calculated score."""
        response = self.client.get("/api/data-quality")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["total_records"], 3000)
        self.assertGreaterEqual(data["data_quality_score"], 70.0)

    def test_14_stakeholder_validation(self):
        """Verify stakeholder validation feedback metrics."""
        response = self.client.get("/api/validation")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 4)


if __name__ == "__main__":
    unittest.main()
