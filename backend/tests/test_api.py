import unittest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import Case, ReviewDecision, AuditLog
from backend.auth import create_access_token, DEMO_PASSWORD


class TestEyeSyncAPI(unittest.TestCase):
    """
    Original 14 Review 1 regression test suite.
    Preserved in full to guarantee zero regression of existing functionality.
    """
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Authenticate test client as Case Reviewer to preserve all 14 baseline tests
        login_resp = cls.client.post("/api/auth/login", json={"username": "reviewer", "password": DEMO_PASSWORD})
        assert login_resp.status_code == 200, f"Setup authentication failed: {login_resp.text}"
        token = login_resp.json()["access_token"]
        cls.client.headers["Authorization"] = f"Bearer {token}"

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


class TestReview2PydanticValidation(unittest.TestCase):
    """
    Strict API schema validation test suite (Qbee Review 1 Key Improvement #1).
    Validates field constraints, custom validators, and corrupt payload rejection.
    """
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        login_resp = cls.client.post("/api/auth/login", json={"username": "coordinator", "password": DEMO_PASSWORD})
        cls.token = login_resp.json()["access_token"]
        cls.headers = {"Authorization": f"Bearer {cls.token}"}

    def test_v01_valid_specimen_payload_accepted(self):
        """Verify a well-formed specimen ingestion payload is accepted with 201 Created."""
        payload = {
            "specimen_id": "SPEC-9901",
            "case_id": "CASE-0001",
            "collection_time": "2026-09-01T10:00:00",
            "collection_site": "Right Tear Film",
            "transport_time": "2026-09-01T12:00:00",
            "received_time": "2026-09-01T15:00:00",
            "processing_status": "PROCESSED",
            "linked_pathology_id": "PATH-0001",
            "linked_molecular_id": "MOL-0001"
        }
        response = self.client.post("/api/specimens", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["specimen_id"], "SPEC-9901")
        self.assertEqual(data["processing_status"], "PROCESSED")

    def test_v02_missing_required_specimen_fields_rejected(self):
        """Verify payload missing required fields (specimen_id, case_id) is rejected with 422."""
        # Missing specimen_id
        payload_no_id = {
            "case_id": "CASE-0001",
            "collection_time": "2026-09-01T10:00:00",
            "collection_site": "Right Tear Film",
            "processing_status": "PROCESSED"
        }
        res = self.client.post("/api/specimens", json=payload_no_id, headers=self.headers)
        self.assertEqual(res.status_code, 422)
        self.assertTrue(res.json()["error"])

        # Missing collection_site
        payload_no_site = {
            "specimen_id": "SPEC-9902",
            "case_id": "CASE-0001",
            "collection_time": "2026-09-01T10:00:00",
            "processing_status": "PROCESSED"
        }
        res2 = self.client.post("/api/specimens", json=payload_no_site, headers=self.headers)
        self.assertEqual(res2.status_code, 422)

    def test_v03_invalid_specimen_field_types_rejected(self):
        """Verify invalid field types (e.g., integer for site, malformed date string) are rejected with 422."""
        payload_bad_type = {
            "specimen_id": "SPEC-9903",
            "case_id": "CASE-0001",
            "collection_time": "NOT-A-DATE",
            "collection_site": "Right Tear Film",
            "processing_status": "PROCESSED"
        }
        res = self.client.post("/api/specimens", json=payload_bad_type, headers=self.headers)
        self.assertEqual(res.status_code, 422)

    def test_v04_invalid_date_temporal_sequence_rejected(self):
        """Verify temporal consistency: transport_time prior to collection_time is rejected with 422."""
        payload_inverted_dates = {
            "specimen_id": "SPEC-9904",
            "case_id": "CASE-0001",
            "collection_time": "2026-09-01T14:00:00",
            "collection_site": "Right Tear Film",
            "transport_time": "2026-09-01T10:00:00",  # Inverted: 4 hours BEFORE collection
            "processing_status": "IN_TRANSIT"
        }
        res = self.client.post("/api/specimens", json=payload_inverted_dates, headers=self.headers)
        self.assertEqual(res.status_code, 422)
        self.assertIn("cannot be prior to collection_time", str(res.json()))

    def test_v05_invalid_lineage_state_rejected(self):
        """Verify custody incoherence: specimen marked IN_TRANSIT with received_time is rejected with 422."""
        payload_incoherent_lineage = {
            "specimen_id": "SPEC-9905",
            "case_id": "CASE-0001",
            "collection_time": "2026-09-01T10:00:00",
            "collection_site": "Left Epithelial Scraping",
            "transport_time": "2026-09-01T11:00:00",
            "received_time": "2026-09-01T16:00:00",  # Received time present...
            "processing_status": "IN_TRANSIT"          # ...yet marked still IN_TRANSIT
        }
        res = self.client.post("/api/specimens", json=payload_incoherent_lineage, headers=self.headers)
        self.assertEqual(res.status_code, 422)
        self.assertIn("IN_TRANSIT", str(res.json()))

    def test_v06_invalid_lineage_identifier_format_rejected(self):
        """Verify malformed linked diagnostic IDs (e.g., 'BAD-LINK-1') are rejected with 422."""
        payload_bad_link = {
            "specimen_id": "SPEC-9906",
            "case_id": "CASE-0001",
            "collection_time": "2026-09-01T10:00:00",
            "collection_site": "Bilateral Conjunctival Swab",
            "received_time": "2026-09-01T16:00:00",
            "processing_status": "PROCESSED",
            "linked_pathology_id": "INVALID_PATH_FORMAT"
        }
        res = self.client.post("/api/specimens", json=payload_bad_link, headers=self.headers)
        self.assertEqual(res.status_code, 422)

    def test_v07_invalid_review_payload_rejected(self):
        """Verify out-of-range confidence (>1.0), invalid decision category, and empty reason are rejected with 422."""
        # 1. Out of range confidence (>1.0)
        res_conf = self.client.post("/api/reviews", json={
            "case_id": "CASE-0001",
            "decision": "REFER",
            "confidence": 1.75,  # Invalid: max 1.0
            "reason": "Valid clinical justification"
        }, headers={"Authorization": f"Bearer {create_access_token({'sub': 'reviewer', 'role': 'Case Reviewer'})}"})
        self.assertEqual(res_conf.status_code, 422)

        # 2. Invalid categorical decision
        res_dec = self.client.post("/api/reviews", json={
            "case_id": "CASE-0001",
            "decision": "DISCHARGE_UNVERIFIED",  # Invalid decision
            "confidence": 0.85,
            "reason": "Valid clinical rationale"
        }, headers={"Authorization": f"Bearer {create_access_token({'sub': 'reviewer', 'role': 'Case Reviewer'})}"})
        self.assertEqual(res_dec.status_code, 422)

        # 3. Empty rationale
        res_reason = self.client.post("/api/reviews", json={
            "case_id": "CASE-0001",
            "decision": "CLEAR",
            "confidence": 0.90,
            "reason": "   "  # Blank/whitespace
        }, headers={"Authorization": f"Bearer {create_access_token({'sub': 'reviewer', 'role': 'Case Reviewer'})}"})
        self.assertEqual(res_reason.status_code, 422)

    def test_v08_valid_review_payload_accepted(self):
        """Verify well-formed review payload is accepted with 200 OK."""
        res = self.client.post("/api/reviews", json={
            "case_id": "CASE-0001",
            "decision": "CLEAR",
            "confidence": 0.95,
            "reason": "All evidence complete and within physiological limits; schedule routine 12-month outreach screening."
        }, headers={"Authorization": f"Bearer {create_access_token({'sub': 'reviewer', 'role': 'Case Reviewer'})}"})
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])


class TestReview2AuthenticationAndRBAC(unittest.TestCase):
    """
    Token-based Authentication & Role-Based Access Control (RBAC) test suite
    (Qbee Review 1 Key Improvement #2).
    """
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_auth_01_valid_login(self):
        """Verify successful user authentication returns signed JWT with correct role claim."""
        resp = self.client.post("/api/auth/login", json={"username": "reviewer", "password": DEMO_PASSWORD})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["role"], "Case Reviewer")
        self.assertEqual(data["username"], "reviewer")
        self.assertTrue(len(data["access_token"]) > 20)

    def test_auth_02_invalid_credentials(self):
        """Verify login with incorrect password returns HTTP 401 Unauthorized."""
        resp = self.client.post("/api/auth/login", json={"username": "reviewer", "password": "WrongPassword!999"})
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Invalid username or password", resp.json()["message"])

    def test_auth_03_missing_token_rejected(self):
        """Verify accessing protected endpoint (/api/cases) without Authorization header returns 401."""
        client_no_auth = TestClient(app)
        resp = client_no_auth.get("/api/cases")
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Missing Authorization header", resp.json()["message"])

    def test_auth_04_invalid_token_rejected(self):
        """Verify malformed or forged JWT returns HTTP 401 Unauthorized."""
        resp = self.client.get("/api/cases", headers={"Authorization": "Bearer malformed.bogus.token"})
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Invalid authentication token", resp.json()["message"])

    def test_auth_05_expired_token_rejected(self):
        """Verify expired JWT is rejected with HTTP 401."""
        expired_token = create_access_token(
            {"sub": "reviewer", "role": "Case Reviewer"},
            expires_delta=timedelta(seconds=-60)  # Expired 60s ago
        )
        resp = self.client.get("/api/cases", headers={"Authorization": f"Bearer {expired_token}"})
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Token has expired", resp.json()["message"])

    def test_auth_06_authorized_role_review_submission(self):
        """Verify Case Reviewer role is authorized to submit clinical decisions (HTTP 200)."""
        reviewer_token = create_access_token({"sub": "reviewer", "role": "Case Reviewer"})
        resp = self.client.post("/api/reviews", json={
            "case_id": "CASE-0002",
            "decision": "INSUFFICIENT_EVIDENCE",
            "confidence": 0.88,
            "reason": "Missing molecular PCR confirms diagnostic gap; patient requires repeat screening."
        }, headers={"Authorization": f"Bearer {reviewer_token}"})
        self.assertEqual(resp.status_code, 200)

    def test_auth_07_unauthorized_role_review_submission_rejected(self):
        """Verify Camp Coordinator role is FORBIDDEN from submitting clinical decisions (HTTP 403)."""
        coordinator_token = create_access_token({"sub": "coordinator", "role": "Camp Coordinator"})
        resp = self.client.post("/api/reviews", json={
            "case_id": "CASE-0002",
            "decision": "CLEAR",
            "confidence": 0.90,
            "reason": "Unauthorized coordinator attempt"
        }, headers={"Authorization": f"Bearer {coordinator_token}"})
        self.assertEqual(resp.status_code, 403)
        self.assertIn("Access denied", resp.json()["message"])

    def test_auth_08_audit_logs_rbac_enforcement(self):
        """Verify audit trail endpoint permits Administrator/Case Reviewer and forbids Imaging Reviewer."""
        # 1. Imaging Reviewer -> 403 Forbidden
        imaging_token = create_access_token({"sub": "imaging_tech", "role": "Imaging Reviewer"})
        res_unauthorized = self.client.get("/api/audit-logs", headers={"Authorization": f"Bearer {imaging_token}"})
        self.assertEqual(res_unauthorized.status_code, 403)

        # 2. Administrator -> 200 OK
        admin_token = create_access_token({"sub": "admin", "role": "Administrator"})
        res_authorized = self.client.get("/api/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
        self.assertEqual(res_authorized.status_code, 200)

    def test_auth_09_evidence_access_rbac(self):
        """Verify raw clinical evidence endpoint restricts operational roles and permits clinical roles."""
        # Camp Coordinator lacks permission to view raw clinical findings -> 403
        coord_token = create_access_token({"sub": "coordinator", "role": "Camp Coordinator"})
        res_coord = self.client.get("/api/cases/CASE-0001/evidence", headers={"Authorization": f"Bearer {coord_token}"})
        self.assertEqual(res_coord.status_code, 403)

        # Imaging Reviewer has clinical permission -> 200
        img_token = create_access_token({"sub": "imaging_tech", "role": "Imaging Reviewer"})
        res_img = self.client.get("/api/cases/CASE-0001/evidence", headers={"Authorization": f"Bearer {img_token}"})
        self.assertEqual(res_img.status_code, 200)


class TestReview2IntegrationFlow(unittest.TestCase):
    """
    End-to-End Frontend/Backend Integration Test.
    Verifies full lifecycle: Login -> JWT Issuance -> Protected API Call -> Audit Trace.
    """
    def test_full_authentication_and_api_lifecycle(self):
        client = TestClient(app)

        # Step 1: Authenticate with credentials
        login_resp = client.post("/api/auth/login", json={
            "username": "reviewer",
            "password": DEMO_PASSWORD
        })
        self.assertEqual(login_resp.status_code, 200)
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Step 2: Query authenticated user profile
        me_resp = client.get("/api/auth/me", headers=headers)
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.json()["role"], "Case Reviewer")

        # Step 3: Fetch protected case list and detail
        cases_resp = client.get("/api/cases?limit=5", headers=headers)
        self.assertEqual(cases_resp.status_code, 200)
        self.assertEqual(len(cases_resp.json()["cases"]), 5)

        detail_resp = client.get("/api/cases/CASE-0001", headers=headers)
        self.assertEqual(detail_resp.status_code, 200)
        self.assertEqual(detail_resp.json()["case_id"], "CASE-0001")

        # Step 4: Submit clinical review with verified token
        review_resp = client.post("/api/reviews", json={
            "case_id": "CASE-0003",
            "decision": "REVIEW_REQUIRED",
            "confidence": 0.75,
            "reason": "Low-quality fundus capture requires slit-lamp re-examination in mobile screening pod."
        }, headers=headers)
        self.assertEqual(review_resp.status_code, 200)

        # Step 5: Verify audit ledger recorded the authenticated transaction
        audit_resp = client.get("/api/audit-logs?case_id=CASE-0003&action=REVIEW_SUBMITTED", headers=headers)
        self.assertEqual(audit_resp.status_code, 200)
        self.assertGreaterEqual(audit_resp.json()["total"], 1)


if __name__ == "__main__":
    unittest.main()
