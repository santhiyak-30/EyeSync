# EyeSync - Multidisciplinary Evidence Timeline for Temporary Eye-Care Screening Camps

[![API Tests](https://img.shields.io/badge/API%20Tests-32%2F32%20Passed-brightgreen)](backend/tests/test_api.py)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20v2.0-009688)](backend/main.py)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB)](frontend/)
[![Validation](https://img.shields.io/badge/Validation-Pydantic%20v2%20Strict-blue)](backend/schemas.py)
[![Security](https://img.shields.io/badge/Auth-JWT%20%2B%20PBKDF2%20RBAC-red)](backend/auth.py)
[![Database](https://img.shields.io/badge/Database-SQLAlchemy%20%2B%20SQLite-lightgrey)](backend/models.py)

---

## 1. Project Overview

**EyeSync** is a clinical decision-support and evidence-synthesis platform specifically designed for temporary eye-care screening camps in rural and underserved regions. In mobile ophthalmic outreach camps, diagnostic data arrives from disparate sources over varying timelines - including mobile fundus cameras, optical coherence tomography (OCT) devices, physical biopsy specimens transported via cold-chain couriers, off-site pathology labs, and central molecular genetics facilities.

EyeSync unifies these disjointed data streams into a single, cohesive, chronological timeline. It automatically synthesizes multimodal evidence, calculates an objective **Evidence Completeness Score (0-100%)**, detects temporal and biological discordances across diagnostic modalities, tracks physical specimen custody, and enforces strict **Role-Based Access Control (RBAC)** to ensure that clinicians and camp coordinators view data appropriate to their governance clearance.

All patient cases, imaging metadata, laboratory results, and clinical notes in this repository are **100% synthetic, de-identified records** created for benchmarking and algorithmic validation.

---

## 2. Problem Statement

Temporary eye-screening camps face severe logistical and diagnostic challenges:
1. **Asynchronous Modality Arrival**: Digital fundus photographs are available immediately on-site, whereas cytologic pathology and PCR/molecular assays may take 7 to 21 days to return from central laboratories.
2. **Severed Chain of Custody**: Physical specimens (corneal scrapings, vitreous aspirates, conjunctival swabs) transported over long distances can suffer mislabeling, lost linkage, or sample degradation.
3. **Diagnostic Discordance**: Discrepancies between visual imaging (e.g., clear retina read) and histological pathology (e.g., severe intraepithelial dysplasia) can lead to premature patient discharge or missed malignant ocular tumors (such as retinoblastoma).
4. **Information Overload**: Camp reviewers must manually cross-reference paper logs, digital DICOM viewers, and PDF laboratory reports, increasing cognitive fatigue and decision turnaround time.
5. **Governance & Privacy Risks**: Field volunteers and administrative camp coordinators must not have unrestricted access to sensitive molecular genetic markers or preliminary pathology diagnoses without clinical oversight.

---

## 3. Solution

EyeSync resolves these challenges through five core capabilities:
- **Unified Chronological Timeline**: Merges intake registration, digital imaging captures, specimen transit logs, lab results, and review decisions into a single interactive visual timeline.
- **Evidence Completeness Scoring**: Quantifies evidence readiness using an itemized 0-100 scoring model: Imaging (30%), Pathology (30%), Molecular (20%), Specimen Lineage (10%), and Review Decision (10%).
- **Automated Anomaly & Conflict Detection**: Identifies six distinct evidence failure modes in real time, alerting reviewers to missing tests, low-quality imaging, stale samples, broken chain of custody, and conflicting diagnoses.
- **Specimen Lineage Tracker**: Models the 6-stage physical transit of samples from field harvest to central lab intake, highlighting any interrupted custody or lost barcode linkages.
- **Zero-Trust Security & RBAC**: Enforces PBKDF2-HMAC-SHA256 password hashing (100,000 iterations with per-user salt), signed JSON Web Tokens (JWT), role-scoped API access, and audit trail logging.

---

## 4. System Architecture

EyeSync follows a decoupled client-server architecture built with modern, production-ready web technologies:

```text
+-------------------------------------------------------------------------------+
|                             CLIENT / PRESENTATION                             |
|                                                                               |
|   React 18 + Vite SPA                                                         |
|   +-- Component Views: Dashboard, Case Detail, Timeline, Lineage, Audit Log    |
|   +-- Centralized API Service (services/api.js)                               |
|   |   +-- JWT Bearer Token Injection                                          |
|   |   +-- Promise Interception for HTTP 401 (evict) & HTTP 403 (forbid alert) |
|   |   +-- Network Connection Error Interception                               |
|   +-- RoleContext (context/RoleContext.jsx) for dynamic RBAC state            |
+---------------------------------------+---------------------------------------+
                                        |  HTTPS / JSON (REST API)
                                        |  Authorization: Bearer <JWT>
+---------------------------------------v---------------------------------------+
|                               BACKEND / API                                   |
|                                                                               |
|   FastAPI Application (backend/main.py)                                       |
|   +-- CORS Middleware (Cross-Origin Resource Sharing)                         |
|   +-- Exception Handlers: RequestValidationError (422), HTTPException (4xx/5xx)|
|   +-- Authentication Engine (backend/auth.py)                                 |
|   |   +-- PBKDF2-HMAC-SHA256 Password Hashing (100k iterations)               |
|   |   +-- Constant-time signature verification (hmac.compare_digest)          |
|   |   +-- Role-Based Access Control (require_role dependency)                 |
|   +-- Validation Layer (backend/schemas.py)                                   |
|   |   +-- Pydantic v2 Strict Models (extra="forbid")                          |
|   |   +-- Temporal Causality & Specimen Lineage State Validators              |
|   +-- Clinical Services Engine (backend/services.py)                          |
|       +-- Completeness Scoring (0-100 pts)                                    |
|       +-- Specimen Lineage Construction (6-Step Chain of Custody)             |
|       +-- Conflict & Anomaly Detection Heuristics                             |
+---------------------------------------+---------------------------------------+
                                        |  SQLAlchemy 2.0 ORM
                                        |  Connection Pooling / Transactions
+---------------------------------------v---------------------------------------+
|                           PERSISTENCE & STORAGE                               |
|                                                                               |
|   SQLite Relational Database (backend/eyesync.db)                             |
|   +-- 7 Structured Relational Tables:                                         |
|   |   cases, imaging_events, specimens, pathology_results,                     |
|   |   molecular_results, review_decisions, audit_logs                         |
|   +-- Seed Engine (backend/seed_database.py): 500 Synthetic Patient Cases      |
+-------------------------------------------------------------------------------+
```

---

## 5. Core Components

1. **Dashboard & Case Directory**: Provides macro-level surveillance of camp operations, filtering by triage priority (Critical, High, Medium, Low), screening status, camp location, and evidence anomalies.
2. **Unified Case Detail & Timeline**: Displays patient demographic metadata alongside an interactive, color-coded chronological stream of all clinical interactions and diagnostic milestones.
3. **Specimen Lineage Tracker**: Visualizes the 6-stage chain of custody for biological samples, explicitly identifying points where specimen transit or labeling failed.
4. **Clinical Review & Triage Panel**: Enables credentialed clinicians to record clinical triage decisions (`CLEAR`, `REFER`, `REVIEW_REQUIRED`, `INSUFFICIENT_EVIDENCE`) with confidence metrics and clinical rationales.
5. **Data Quality & FMEA Engine**: Evaluates population-level data integrity across all 500 cases and provides Failure Mode and Effects Analysis (FMEA) risk priority ratings.
6. **Immutable Audit Logger**: Automatically records administrative and clinical access events, capturing timestamps, user roles, accessed case IDs, actions, and execution outcomes.

---

## 6. Evidence Lifecycle

Every clinical case in EyeSync follows a rigorous 6-stage evidence lifecycle from patient enrollment to clinical disposition:

```text
[ Stage 1: Case Intake ]
  |  Registration at mobile screening camp; assignment of unique Case ID (e.g. CASE-0001).
  v
[ Stage 2: Imaging Acquisition ]
  |  Capture of Fundus, OCT, Slit Lamp, or Retinal photographs; automated image quality scoring.
  v
[ Stage 3: Specimen Harvesting ]
  |  Collection of tissue/cytology/swab; initial accession ID created (e.g. SPEC-0001).
  v
[ Stage 4: Chain-of-Custody Transit & Lab Receipt ]
  |  Cold-chain courier transit logged; intake receipt verified at central reference laboratory.
  v
[ Stage 5: Multidisciplinary Diagnostic Synthesis ]
  |  Pathology histology reports & molecular PCR assays linked to specimen; anomaly detection runs.
  v
[ Stage 6: Clinical Triage Review & Audit Finalization ]
     Credentialed specialist submits formal triage decision; immutable audit log entry committed.
```

---

## 7. Evidence Failure Scenarios

To ensure robustness in unpredictable field conditions, EyeSync implements automated detection and regression testing for six critical evidence failure modes (benchmarked against the baseline golden case):

| Case ID | Scenario Title | Description | System Detection & Mitigation |
| :--- | :--- | :--- | :--- |
| **CASE-0001** | **Golden Standard Baseline** | Complete evidence record: fundus image (quality 92%), verified specimen lineage, normal pathology, confirmed molecular assay. | Completeness: 100%. Anomalies: 0. Unbroken specimen lineage. |
| **CASE-0002** | **Missing Molecular Evidence** | Clinical findings indicate high risk, but required molecular genetics test was never completed or linked. | Flags missing molecular component; reduces completeness score by 20 points; warns reviewer. |
| **CASE-0003** | **Low-Quality Imaging** | Fundus photograph degraded by lens smudge, cataract glare, or patient movement (quality score < 70). | Flags `LOW_QUALITY` imaging anomaly; recommends re-imaging before clinical clearance. |
| **CASE-0004** | **Stale Molecular Evidence** | Molecular genetics panel was performed > 30 days prior to current camp evaluation. | Flags `STALE_EVIDENCE` anomaly; prompts clinician to verify if disease status has progressed. |
| **CASE-0005** | **Conflicting Evidence** | Histological pathology reveals severe dysplastic changes, whereas visual fundus read was marked normal. | Flags `CONFLICTING_EVIDENCE`; forces mandatory multi-reviewer case conference. |
| **CASE-0006** | **Broken Specimen Lineage** | Sample tube barcode damaged in transit; laboratory intake recorded status as `LOST_LINKAGE`. | Identifies severed chain of custody; marks downstream pathology/molecular steps invalid. |
| **CASE-0007** | **Duplicate Imaging Event** | Multiple imaging events captured within identical timeframes with contradictory quality ratings. | Flags duplicate event anomaly; presents comparison view to reviewer. |

---

## 8. Authentication & RBAC

EyeSync enforces a zero-trust, role-based security model.

### 8.1 Password Hashing & Secret Management
- **PBKDF2-HMAC-SHA256 Hashing**: User passwords are encrypted using `PBKDF2-HMAC-SHA256` with 100,000 hashing rounds and cryptographically secure 16-byte per-user random salts.
- **Timing Attack Defense**: Password validation utilizes constant-time string comparison (`hmac.compare_digest`) to prevent side-channel timing analysis attacks.
- **Environment Isolation**: The JWT secret key (`EYESYNC_JWT_SECRET`) and token expiration window (`ACCESS_TOKEN_EXPIRE_MINUTES`) are configured via environment variables, defaulting to secure demonstration keys if unconfigured.

### 8.2 Role Permissions Matrix
The system implements six distinct operational roles:

| Operational Role | Case Directory | Case Detail | Raw Evidence | Specimen Ingest | Triage Review | Audit Logs | Data Quality |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Camp Coordinator** | Read | Masked (Non-Clinical) | Denied (403) | Write | Denied (403) | Denied (403) | Denied (403) |
| **Imaging Reviewer** | Read | Full Read | Read | Denied (403) | Denied (403) | Denied (403) | Denied (403) |
| **Pathology Reviewer** | Read | Full Read | Read | Write | Denied (403) | Denied (403) | Denied (403) |
| **Molecular Reviewer** | Read | Full Read | Read | Write | Denied (403) | Denied (403) | Denied (403) |
| **Case Reviewer** | Read | Full Read | Read | Write | Submit (200) | Read | Read |
| **Administrator** | Full | Full Read | Read | Write | Submit (200) | Full Read | Full Read |

*Note: For the `Camp Coordinator` role, the backend automatically sanitizes and masks sensitive clinical findings in `/api/cases/{case_id}` to prevent unauthorized exposure of diagnostic hypotheses.*

---

## 9. API Validation

Request payloads are validated at the API boundary using **Pydantic v2** models configured with `extra="forbid"` to reject unmapped or malicious injection fields.

### 9.1 Specimen Ingestion Validation (`SpecimenIngestPayload`)
- **Regex Identifier Enforcements**:
  - `specimen_id`: `^SPEC-\d{4}$` (e.g., `SPEC-0042`)
  - `case_id`: `^CASE-\d{4}$` (e.g., `CASE-0012`)
  - `linked_pathology_id`: `^PATH-\d{4}$` (Optional)
  - `linked_molecular_id`: `^MOL-\d{4}$` (Optional)
- **Temporal Causality Constraints**:
  - Validates physical time sequence: `collection_time <= transport_time <= received_time`.
  - Rejects payloads where transport precedes collection or intake precedes transport.
- **Lineage State Invariants**:
  - A specimen marked `IN_TRANSIT` cannot possess a recorded `received_time`.
  - A specimen marked `LOST_LINKAGE` cannot claim valid downstream diagnostic linkages (`linked_pathology_id` and `linked_molecular_id` must be null).
  - A specimen marked `PROCESSED` must have a recorded `received_time`.

### 9.2 Clinical Review Validation (`ReviewCreateRequest`)
- **Confidence Range**: Must be a floating-point value strictly within `[0.0, 1.0]`.
- **Decision Enumeration**: Restricted to `["CLEAR", "REFER", "REVIEW_REQUIRED", "INSUFFICIENT_EVIDENCE"]`.
- **Rationale Depth**: Clinical justification string must contain a minimum of 10 characters.
- **Strict Payload Enforcement**: Any unrecognized extraneous JSON keys immediately trigger an `HTTP 422 Unprocessable Entity` response.

---

## 10. API Endpoints

The EyeSync backend provides 17 distinct REST endpoints (plus 1 canonical alias) implemented in `backend/main.py`:

| HTTP Method | Endpoint URI | Purpose & Action | Auth Required | Authorized Roles | Error Status Codes |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/health` | System health probe and SQLite connection check | No (Public) | All / Anonymous | `500` |
| `POST` | `/api/auth/login` | Authenticate user credentials and return signed JWT | No (Public) | All / Anonymous | `401`, `422` |
| `POST` | `/api/auth/token-for-role` | Demo helper: Generate signed JWT for specified role | No (Public) | All / Anonymous | `422` |
| `GET` | `/api/auth/me` | Fetch active user identity, username, and assigned role | Yes (Bearer JWT) | All authenticated roles | `401` |
| `GET` | `/api/cases` | Paginated case directory with search & anomaly filters | Yes (Bearer JWT) | All authenticated roles | `401`, `422` |
| `GET` | `/api/cases/{case_id}` | Case detail, completeness score, timeline & anomalies | Yes (Bearer JWT) | All roles (Masked for Coordinator) | `401`, `404` |
| `GET` | `/api/cases/{case_id}/timeline` | Unified chronological stream of all clinical events | Yes (Bearer JWT) | All authenticated roles | `401`, `404` |
| `GET` | `/api/cases/{case_id}/evidence` | Raw multimodal evidence (imaging, path, molecular) | Yes (Bearer JWT) | Imaging, Path, Mol, Reviewer, Admin | `401`, `403`, `404` |
| `GET` | `/api/cases/{case_id}/lineage` | 6-stage physical specimen chain-of-custody tracking | Yes (Bearer JWT) | All authenticated roles | `401`, `404` |
| `POST` | `/api/specimens` | Ingest new specimen with strict Pydantic validation | Yes (Bearer JWT) | Coordinator, Path, Mol, Reviewer, Admin | `201`, `401`, `403`, `404`, `422` |
| `POST` | `/api/specimens/ingest` | Canonical alias for specimen ingestion endpoint | Yes (Bearer JWT) | Coordinator, Path, Mol, Reviewer, Admin | `201`, `401`, `403`, `404`, `422` |
| `GET` | `/api/dashboard/metrics` | Macro triage metrics, completeness & anomaly counts | Yes (Bearer JWT) | All authenticated roles | `200`, `401`, `404` |
| `GET` | `/api/audit-logs` | Query chronological audit trail of system access | Yes (Bearer JWT) | Case Reviewer, Administrator | `401`, `403`, `422` |
| `POST` | `/api/reviews` | Submit formal clinical triage decision & rationale | Yes (Bearer JWT) | Case Reviewer, Administrator | `200`, `401`, `403`, `404`, `422` |
| `GET` | `/api/experiments/results` | Empirical benchmark results (time-to-decision, etc.) | Yes (Bearer JWT) | All authenticated roles | `401` |
| `GET` | `/api/failures` | Complete Failure Mode and Effects Analysis (FMEA) dataset| Yes (Bearer JWT) | All authenticated roles | `401` |
| `GET` | `/api/data-quality` | Population-wide data completeness and quality audit | Yes (Bearer JWT) | Case Reviewer, Administrator | `401`, `403` |
| `GET` | `/api/validation` | Stakeholder prototype acceptance survey feedback | Yes (Bearer JWT) | All authenticated roles | `401` |

---

## 11. Data / Schema

EyeSync utilizes a relational **SQLite** database (`backend/eyesync.db`) managed via **SQLAlchemy 2.0 ORM**.

### 11.1 Relational Entity-Relationship Model
The schema defines 7 core tables linked by primary and foreign keys:

```text
  +------------------+
  |      cases       |
  |------------------|
  | PK  case_id      |<-------+----------------+----------------+----------------+
  |     created_at   |        |                |                |                |
  |     location     |        | 1:N            | 1:N            | 1:N            | 1:N
  |     status       |        |                |                |                |
  |     priority     |        v                v                v                v
  |     department   |  +------------+  +------------+  +-------------+  +-------------+
  |     reviewer     |  |  imaging_  |  | specimens  |  | pathology_  |  | molecular_  |
  +--------+---------+  |   events   |  |            |  |   results   |  |   results   |
           |            +------------+  +-----+------+  +-------------+  +-------------+
           | 1:N                              |                ^                ^
           +----------------+                 |                |                |
           |                |                 +----------------+----------------+
           v                v                 (optional specimen_id linkage)
    +-------------+  +--------------+
    |   review_   |  |  audit_logs  |
    |  decisions  |  |              |
    +-------------+  +--------------+
```

### 11.2 Table Specifications

#### 1. `cases`
- `case_id` (String[32], Primary Key, Indexed): Unique identifier (e.g., `CASE-0001`).
- `case_created_at` (DateTime, Default UTC): Patient enrollment timestamp.
- `camp_location` (String[128]): Screening venue (e.g., `Sector 4 Mobile Health Post`).
- `screening_status` (String[64]): Triage status (`Under Review`, `Ready for Review`, `Review Completed`, `Pending Evidence`).
- `priority` (String[32]): Clinical urgency rating (`Critical`, `High`, `Medium`, `Low`).
- `department` (String[64]): Assigned subspecialty (`Ophthalmology`, `Retinal Care`, `Glaucoma Clinic`).
- `assigned_reviewer` (String[64]): Designated clinical lead.

#### 2. `imaging_events`
- `imaging_id` (String[32], Primary Key, Indexed): Unique identifier (e.g., `IMG-0001`).
- `case_id` (String[32], Foreign Key -> `cases.case_id`, Indexed): Associated case.
- `captured_at` (DateTime): Capture timestamp.
- `modality` (String[64]): Diagnostic device (`Fundus`, `OCT`, `Slit Lamp`, `Retinal Image`).
- `quality_score` (Float, 0-100): Algorithmic clarity metric.
- `quality_status` (String[32]): Quality categorization (`GOOD`, `ACCEPTABLE`, `LOW_QUALITY`, `MISSING`).
- `device_id` / `operator_id` / `location` (String): Acquisition metadata.
- `review_status` (String[64]): Radiologist read (`NORMAL`, `ABNORMAL`, `PENDING_READ`, `INCONCLUSIVE`).
- `findings_summary` (Text, Nullable): Diagnostic impression notes.

#### 3. `specimens`
- `specimen_id` (String[32], Primary Key, Indexed): Physical accession barcode (e.g., `SPEC-0001`).
- `case_id` (String[32], Foreign Key -> `cases.case_id`, Indexed): Associated case.
- `collection_time` (DateTime): Field harvesting timestamp.
- `collection_site` (String[128]): Biological site (e.g., `Right Cornea`, `Vitreous Humor`).
- `transport_time` (DateTime, Nullable): Courier dispatch timestamp.
- `received_time` (DateTime, Nullable): Central laboratory intake timestamp.
- `processing_status` (String[64]): Custody state (`RECEIVED`, `IN_TRANSIT`, `PROCESSED`, `LOST_LINKAGE`).
- `linked_pathology_id` / `linked_molecular_id` (String[32], Nullable): Downstream assay keys.

#### 4. `pathology_results`
- `pathology_id` (String[32], Primary Key, Indexed): Unique lab identifier (e.g., `PATH-0001`).
- `case_id` (String[32], Foreign Key -> `cases.case_id`, Indexed): Associated case.
- `specimen_id` (String[32], Nullable): Biological source accession.
- `result_at` (DateTime): Verification timestamp.
- `finding` (Text): Microscopic/cytologic diagnostic findings.
- `severity` (String[32]): Severity rating (`NONE`, `MILD`, `MODERATE`, `SEVERE`).
- `status` (String[32]): Outcome (`NORMAL`, `ABNORMAL`, `PENDING`, `INCONCLUSIVE`).

#### 5. `molecular_results`
- `molecular_id` (String[32], Primary Key, Indexed): Unique test identifier (e.g., `MOL-0001`).
- `case_id` (String[32], Foreign Key -> `cases.case_id`, Indexed): Associated case.
- `specimen_id` (String[32], Nullable): Biological source accession.
- `result_at` (DateTime): Assay completion timestamp.
- `result_status` (String[32]): Validity state (`AVAILABLE`, `STALE`, `MISSING`, `LOW_CONFIDENCE`).
- `confidence` (Float, 0.0-1.0): Analytical confidence score.
- `test_type` (String[128]): Assay panel (e.g., `Viral DNA PCR Panel`, `RB1 Gene Mutation Screen`).
- `finding` (Text): Target amplification result and interpretation.

#### 6. `review_decisions`
- `review_id` (String[32], Primary Key, Indexed): Unique review record identifier.
- `case_id` (String[32], Foreign Key -> `cases.case_id`, Indexed): Associated case.
- `reviewer_role` (String[64]): Role of signing clinician.
- `reviewed_at` (DateTime, Default UTC): Review timestamp.
- `decision` (String[64]): Triage disposition (`CLEAR`, `REFER`, `REVIEW_REQUIRED`, `INSUFFICIENT_EVIDENCE`).
- `confidence` (Float, 0.0-1.0): Reviewer certainty metric.
- `reason` (Text): Clinical justification.
- `evidence_completeness` (Float, 0-100): Completeness score at time of review.

#### 7. `audit_logs`
- `id` (Integer, Primary Key, Autoincrement): Monotonic sequential event ID.
- `timestamp` (DateTime, Default UTC): Exact access timestamp.
- `user_role` (String[64]): Identity / role of acting entity.
- `case_id` (String[32], Foreign Key -> `cases.case_id`, Nullable, Indexed): Associated case.
- `action` (String[64]): Operation executed (`CASE_VIEWED`, `REVIEW_SUBMITTED`, etc.).
- `resource_type` (String[64]): Affected domain resource (`CASE`, `SPECIMEN`, `REVIEW`).
- `result` (String[32]): Execution outcome (`SUCCESS`, `WARNING`, `FAILED`).
- `details` (Text, Nullable): Structured event context.

---

## 12. Error Handling & Error Boundaries

EyeSync implements a defense-in-depth error handling architecture across both backend and frontend layers:

```text
[ Incoming Request ]
        |
        +--> Pydantic Validation Error ------> HTTP 422 JSON (Field-level diagnostics)
        |
        +--> Bad / Expired Credentials ------> HTTP 401 JSON (WWW-Authenticate: Bearer)
        |
        +--> Role Lacks Permissions    ------> HTTP 403 JSON (Access Denied for Role)
        |
        +--> Entity Not Found          ------> HTTP 404 JSON (Resource Missing)
        |
        +--> Unhandled Runtime Fault   ------> HTTP 500 JSON (Safe Generic Error)
```

### 12.1 Backend Error Handling
- **Validation Errors (`HTTP 422`)**: The `validation_exception_handler` intercepts `fastapi.exceptions.RequestValidationError`, converting nested Pydantic errors into a normalized JSON payload:
  ```json
  {
    "error": true,
    "message": "Validation Error: Corrupted or invalid payload rejected.",
    "details": ["body -> collection_time: Invalid date format", "body -> confidence: Input should be <= 1.0"],
    "errors": [...]
  }
  ```
- **Authentication Failures (`HTTP 401`)**: Raised when Bearer tokens are absent, forged, or expired, responding with `{"error": true, "message": "Could not validate authentication token."}` and `WWW-Authenticate: Bearer` headers.
- **Authorization Rejections (`HTTP 403`)**: Raised by the `require_role` dependency whenever an authenticated user attempts an operation outside their clearance (e.g., `Camp Coordinator` attempting review submission):
  ```json
  {
    "error": true,
    "message": "Access denied for role 'Camp Coordinator'. Required role(s): Case Reviewer, Administrator"
  }
  ```
- **Resource Not Found (`HTTP 404`)**: Returned when querying non-existent case identifiers (e.g., `/api/cases/CASE-9999`).
- **Safe Server Responses (`HTTP 500`)**: Prevents raw stack traces from leaking to clients, masking database internals while recording detailed diagnostic logs server-side.

### 12.2 Frontend Error Architecture & Boundary Clarification
- **Centralized Interceptor**: `frontend/src/services/api.js` intercepts all asynchronous fetch promises:
  - Automatically captures `HTTP 401`, purges invalid tokens from `localStorage`, and triggers re-authentication.
  - Automatically captures `HTTP 403`, generating descriptive permission alerts without crashing the application.
  - Intercepts connection failures (`Failed to fetch`, `NetworkError`), surfacing actionable recovery guidance to the user.
- **Component-Level Error States**: Rather than relying on a global React class Error Boundary (`componentDidCatch`), EyeSync deliberately implements **declarative component-level error states** (`const [error, setError] = useState(null)`). Each page view (`CaseDetailPage`, `DashboardPage`, `AuditLogsPage`, `FieldWorkflowPage`) contains localized error alert containers and retry actions, allowing one view to fail gracefully without unmounting the entire application.

---

## 13. Testing & Quality Assurance

EyeSync maintains a comprehensive automated testing suite implemented in [`backend/tests/test_api.py`](backend/tests/test_api.py), containing **32 verified automated test cases** across 4 dedicated test classes.

All 32 tests execute with zero failures:
```bash
python -m pytest backend/tests/test_api.py -v
# ========================= 32 passed in 8.94s =========================
```

### 13.1 Test Suite Breakdown

#### Class 1: `TestEyeSyncAPI` (14 Review 1 Baseline & Regression Tests)
*Implemented in `backend/tests/test_api.py` (`TestEyeSyncAPI`)*

| Test Method | Category | What is Tested | Why it is Tested | Expected Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `test_01_health_endpoint` | Smoke / Probe | Health probe & DB connectivity | Verify SQLite connectivity on startup | Status 200, status `healthy`, >= 500 cases |
| `test_02_cases_list_and_search` | Functional | Case pagination & search query | Ensure clinicians can locate specific records | Status 200, matches query string |
| `test_03_golden_case_0001` | Baseline | Case 1 complete evidence profile | Verify Golden Case benchmark | 100% completeness score, 0 anomalies |
| `test_04_missing_molecular_case_0002` | Failure Mode | Case 2 missing molecular assay | Ensure absence of lab result is surfaced | Score reduced by 20 pts, flagged in UI |
| `test_05_low_quality_imaging_case_0003` | Failure Mode | Case 3 low image clarity (< 70) | Prevent clinical decisions on blurred images | Flagged as `LOW_QUALITY` anomaly |
| `test_06_stale_molecular_case_0004` | Failure Mode | Case 4 aging molecular test (> 30d) | Prevent reliance on outdated genetic tests | Flagged as `STALE_EVIDENCE` anomaly |
| `test_07_conflicting_evidence_case_0005` | Failure Mode | Case 5 histology vs imaging conflict | Catch diagnostic discrepancies | Flagged as `CONFLICTING_EVIDENCE` |
| `test_08_broken_specimen_lineage_case_0006`| Failure Mode | Case 6 severed sample barcode | Detect compromised specimen chain of custody| Flagged as `LOST_LINKAGE` step failure |
| `test_09_review_submission_and_audit` | Workflow | Review submission & audit log | Ensure review generates immutable log entry | Review stored, audit log count increments |
| `test_10_dashboard_metrics` | Analytical | Population statistics calculation | Verify aggregate camp KPI accuracy | Accurate counts for total, reviewed, anomalies|
| `test_11_experiments_results` | Benchmark | Decision turnaround benchmark | Verify quantitative platform impact | Demonstrates turnaround time reduction |
| `test_12_failure_modes_fmea` | Governance | FMEA risk priority index dataset | Confirm risk priority numbers (RPN) | Returns all 6 documented failure modes |
| `test_13_data_quality` | Data Integrity| Quality scoring across 500 cases | Ensure complete synthetic data compliance | Quality metrics computed across all records |
| `test_14_stakeholder_validation` | Validation | Prototype acceptance feedback | Verify clinician satisfaction ratings | Positive acceptance metrics across roles |

#### Class 2: `TestReview2PydanticValidation` (8 Strict Schema Tests)
*Implemented in `backend/tests/test_api.py` (`TestReview2PydanticValidation`)*

| Test Method | Category | What is Tested | Why it is Tested | Expected Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `test_v01_valid_specimen_payload_accepted` | Validation | Compliant specimen ingestion payload | Ensure valid lab accessions are recorded | HTTP 200 / 201 Created |
| `test_v02_missing_required_specimen_fields_rejected` | Validation | Ingestion payload with missing fields | Block incomplete accession entries | HTTP 422 Unprocessable Entity |
| `test_v03_invalid_specimen_field_types_rejected` | Validation | Malformed datetime strings | Prevent database corruption from bad formats | HTTP 422 Unprocessable Entity |
| `test_v04_invalid_date_temporal_sequence_rejected` | Validation | `collection_time > transport_time` | Enforce physical chronological causality | HTTP 422 rejecting reversed timestamps |
| `test_v05_invalid_lineage_state_rejected` | Validation | `IN_TRANSIT` with `received_time` | Enforce logical consistency in sample state | HTTP 422 rejecting contradictory states |
| `test_v06_invalid_lineage_identifier_format_rejected` | Validation | Lowercase / non-standard ID strings | Ensure standard barcode pattern matching | HTTP 422 on regex pattern failure |
| `test_v07_invalid_review_payload_rejected` | Validation | Confidence > 1.0 or short rationale | Guarantee thorough clinical reviews | HTTP 422 on boundary violations |
| `test_v08_valid_review_payload_accepted` | Validation | Compliant clinical triage review | Allow verified clinicians to sign reviews | HTTP 200 with review confirmation |

#### Class 3: `TestReview2AuthenticationAndRBAC` (9 Security & Authorization Tests)
*Implemented in `backend/tests/test_api.py` (`TestReview2AuthenticationAndRBAC`)*

| Test Method | Category | What is Tested | Why it is Tested | Expected Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `test_auth_01_valid_login` | Authentication | Valid username & password login | Issue signed JWT for authenticated user | HTTP 200 returning valid access token |
| `test_auth_02_invalid_credentials` | Authentication | Non-existent user or bad password | Prevent brute-force credential stuffing | HTTP 401 Unauthorized |
| `test_auth_03_missing_token_rejected` | Security | Accessing protected routes without JWT | Prevent unauthenticated API access | HTTP 401 Unauthorized |
| `test_auth_04_invalid_token_rejected` | Security | Forged or tampered Bearer token | Guard against token manipulation | HTTP 401 Unauthorized |
| `test_auth_05_expired_token_rejected` | Security | Expired Bearer token | Enforce session expiration windows | HTTP 401 Unauthorized |
| `test_auth_06_authorized_role_review_submission` | Authorization | `Case Reviewer` submitting review | Allow credentialed triage clinicians | HTTP 200 with review recorded |
| `test_auth_07_unauthorized_role_review_submission_rejected` | Authorization | `Camp Coordinator` submitting review | Block non-clinicians from medical reviews | HTTP 403 Forbidden |
| `test_auth_08_audit_logs_rbac_enforcement` | Authorization | Non-admin querying audit logs | Protect surveillance logs from tampering | HTTP 403 Forbidden |
| `test_auth_09_evidence_access_rbac` | Authorization | `Camp Coordinator` accessing raw data | Prevent unauthorized clinical disclosure | HTTP 403 Forbidden |

#### Class 4: `TestReview2IntegrationFlow` (1 End-to-End Lifecycle Test)
*Implemented in `backend/tests/test_api.py` (`TestReview2IntegrationFlow`)*

| Test Method | Category | What is Tested | Why it is Tested | Expected Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `test_full_authentication_and_api_lifecycle` | Integration | Full end-to-end user workflow: Login -> Token Acquisition -> `/api/auth/me` -> Case Exploration -> Triage Review -> Audit Trail | Verify cross-component cohesion across entire application lifecycle | HTTP 200 across all chained operations with verified audit record |

### 13.2 Frontend Build Verification
The React + Vite frontend was verified using the production bundling pipeline:
```bash
cd frontend && npm run build
# vite v5.4.14 building for production...
# transforming...
# Passed 35 modules transformed.
# dist/index.html                   0.75 kB | gzip:  0.42 kB
# dist/assets/index-D7h_9E1r.css   20.52 kB | gzip:  4.11 kB
# dist/assets/index-BqWzJp2A.js   218.44 kB | gzip: 64.98 kB
# Passed built in 7.28s
```

---

## 14. Docker & Deployment

EyeSync provides complete multi-stage containerization configurations for production deployment:

### 14.1 Container Components
- **Backend Container** ([`backend/Dockerfile`](backend/Dockerfile)): Lightweight Python 3.11-slim image with compiled dependencies and non-root execution.
- **Frontend Container** ([`frontend/Dockerfile`](frontend/Dockerfile)): Multi-stage build (Node 18 Alpine compile -> Nginx Alpine serving static bundle and proxying API traffic).
- **Reverse Proxy** ([`frontend/nginx.conf`](frontend/nginx.conf)): Routes `/api/*` requests to the FastAPI backend service while serving SPA routes directly with client-side fallback.
- **Orchestration** ([`docker-compose.yml`](docker-compose.yml)): Multi-service compose file linking backend, frontend, and persistent volume storage.

*Note: Container configuration files were authored and structurally verified. Local runtime container verification was not executed directly due to the absence of the Docker engine on the current Windows host.*

---

## 15. Security & Privacy

1. **Synthetic Data Policy**: All 500 patient records are synthetically generated. No Protected Health Information (PHI) or Personally Identifiable Information (PII) exists in this codebase.
2. **HIPAA Safe Harbor Alignment**: All patient identifiers adhere to synthetic formats (`CASE-0001` through `CASE-0500`), with zero references to real patient names, social security numbers, or biometric assets.
3. **Defense Against Secret Sprawl**: Demonstrations use configurable environment variables with fallbacks; production secrets are excluded from Git via `.gitignore`.
4. **Least-Privilege Principle**: Endpoints enforce role-scoped data delivery; sensitive clinical fields are masked at the API layer for administrative roles.

---

## 16. Review Milestones & Contribution Breakdown

EyeSync development is structured into three distinct milestone reviews:

### Review 1 (Original 35% - Core Architecture & Clinical Prototype)
- **Multimodal Evidence Synthesis**: Implemented unified chronological timeline aggregating imaging captures, specimen accessions, lab reports, and reviews.
- **Completeness Scoring Engine**: Developed 0-100 evidence readiness scoring model (Imaging 30%, Pathology 30%, Molecular 20%, Lineage 10%, Review 10%).
- **Automated Anomaly Detection**: Built real-time heuristic algorithms detecting 6 screening camp failure modes.
- **Relational Data Foundation**: Generated 500 deterministic synthetic cases across 7 SQLite relational tables.
- **Clinical Frontend**: Developed responsive React + Vite single-page dashboard with interactive Recharts operational graphs.
- **Baseline Test Suite**: Delivered initial 14 automated API tests verifying health, data integrity, and failure mode flagging.

### Review 2 (Previous 35% - Security, Validation & Containerization)
- **Strict Pydantic v2 Request Validation**: Hardened ingestion payloads (`SpecimenIngestPayload`, `ReviewCreatePayload`) with field bounds, regex patterns, and `extra="forbid"`.
- **Token-Based Authentication**: Implemented JWT issue and verification workflows with PBKDF2-HMAC-SHA256 password hashing.
- **Role-Based Access Control (RBAC)**: Enforced endpoint-level authorization across 6 clinical/administrative roles with field masking.
- **Expanded Automated Regression Suite**: Created 18 additional automated tests across validation, RBAC, and integration (total 32 tests).
- **Production Containerization**: Authored multi-stage Dockerfile (frontend Nginx + backend Uvicorn) and `docker-compose.yml`.

### Review 3 (Final 30% - Documentation & Code Comment Quality)
- **Granular Unit Testing Catalog**: Exhaustive documentation of all 32 automated tests in `backend/tests/test_api.py`, detailing test names, categories, test objectives, clinical rationale, and expected behaviors.
- **Error Handling Architecture**: Complete documentation of HTTP exception handling (401, 403, 404, 422, 500) and frontend component error state patterns.
- **Comprehensive API Reference Table**: 17-endpoint REST catalog specifying HTTP methods, URIs, authentication requirements, authorized roles, and status codes.
- **Relational Database Model**: Architectural ER diagram, primary/foreign key specifications, column data types, and nullability constraints for all 7 tables.
- **Targeted Code Comments**: Precision explanatory comments in `backend/auth.py` (PBKDF2 parameters and timing-attack defense), `backend/schemas.py` (temporal causality and custody invariants), and `backend/services.py` (scoring weights, custody cascading, and biological discordance heuristics).

---

## 18. Project Structure

```text
EyeSync/
+-- .dockerignore
+-- .env.example
+-- .gitignore
+-- docker-compose.yml
+-- README.md
+-- requirements.txt
|
+-- backend/
|   +-- auth.py                  # JWT creation, PBKDF2 hashing & RBAC dependencies
|   +-- database.py              # SQLite engine & SQLAlchemy session factory
|   +-- Dockerfile               # Backend container configuration
|   +-- experiment.py            # Decision benchmark simulation engine
|   +-- eyesync.db               # SQLite database (500 synthetic cases)
|   +-- main.py                  # FastAPI application & 17 REST endpoints
|   +-- models.py                # SQLAlchemy 2.0 ORM database models (7 tables)
|   +-- schemas.py               # Pydantic v2 strict request/response schemas
|   +-- seed_database.py         # Synthetic case generator & seeder
|   +-- services.py              # Completeness, timeline & conflict algorithms
|   +-- tests/
|       +-- __init__.py
|       +-- test_api.py          # Complete 32-test automated test suite
|
+-- frontend/
    +-- Dockerfile               # Multi-stage production container build
    +-- index.html               # SPA entrypoint
    +-- nginx.conf               # Nginx reverse proxy configuration
    +-- package.json             # NPM dependencies & scripts
    +-- vite.config.js           # Vite configuration
    +-- src/
        +-- App.jsx              # Main routing & layout shell
        +-- main.jsx             # React DOM root initialization
        +-- styles.css           # Modern clinical UI stylesheet
        +-- components/          # Reusable UI components (Navbar, AnomalyCard, etc.)
        +-- context/
        |   +-- RoleContext.jsx  # Active role state & token synchronization
        +-- pages/
        |   +-- AuditLogsPage.jsx
        |   +-- CaseDetailPage.jsx
        |   +-- CaseListPage.jsx
        |   +-- DashboardPage.jsx
        |   +-- DataQualityPage.jsx
        |   +-- DocumentationPage.jsx
        |   +-- ExperimentsPage.jsx
        |   +-- FailureAnalysisPage.jsx
        |   +-- FieldWorkflowPage.jsx
        |   +-- ValidationPage.jsx
        +-- services/
            +-- api.js           # Centralized API service with JWT injection & error handling
```

---

## 19. How to Run

### Option 1: Local Development (Recommended)

#### Step 1: Start the Backend Service
```bash
# Navigate to project root
cd EyeSync

# Install dependencies
pip install -r requirements.txt

# Run FastAPI with Uvicorn (port 8000)
python -m uvicorn backend.main:app --reload --port 8000
```
*The interactive Swagger API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).*

#### Step 2: Start the Frontend Application
```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
*The EyeSync web portal will be accessible at [http://localhost:5173](http://localhost:5173).*

#### Step 3: Run the Automated Test Suite
```bash
# Run all 32 automated tests
python -m pytest backend/tests/test_api.py -v
```

---

### Option 2: Docker Containerized Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build -d

# Verify running services
docker-compose ps
```
*The containerized application will be accessible at [http://localhost](http://localhost).*

---

## 20. Known Limitations

1. **Synthetic Dataset**: While the 500 patient cases simulate realistic clinical scenarios, they are synthetically generated and do not represent a clinical trial cohort.
2. **SQLite Concurrency**: SQLite is used for local zero-configuration execution. In an enterprise hospital cluster, this would be transitioned to PostgreSQL.
3. **No Class-Level React Error Boundary**: The frontend utilizes declarative component error states (`useState`) and API interceptors rather than a React class `componentDidCatch` Error Boundary.
4. **Mocked Notifications**: Notification dispatches for anomalous cases are logged to the audit trail rather than dispatched via external SMS/SMTP gateways.