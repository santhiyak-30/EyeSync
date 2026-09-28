# EyeSync â€“ Multidisciplinary Evidence Timeline for Temporary Eye-Care Screening Camps

> **DE-IDENTIFIED SYNTHETIC DATA â€“ DEMONSTRATION & REVIEW PLATFORM**
> *Review 1 Score: 98% (34.3 / 35 marks)*
> *Upgraded for Review 2: Strict Pydantic API Schemas, Backend JWT Authentication & Role-Based Access Control (RBAC), and Containerized Docker Deployment.*

---

## 1. Project Overview & Clinical Problem Statement

Temporary eye-care screening camps operate in remote, rural, or mobile community settings where multidisciplinary clinical teams gather critical diagnostic evidence:
- **Retinal Imaging**: Fundus photography, OCT, slit-lamp biomicroscopy.
- **Specimen Tracking**: Tear-film micro-fluidic assays, conjunctival swabs, cold-chain courier transport.
- **Pathology / Cytology**: Microscopic cellular findings and dysplasia severity.
- **Molecular Testing**: Multiplex viral PCR (HSV-1, HSV-2, VZV, CMV) and inflammatory cytokine quantification.
- **Clinical Review Decisions**: Triage outcomes (`CLEAR`, `REFER`, `REVIEW_REQUIRED`, `INSUFFICIENT_EVIDENCE`).
- **Audit Logs**: Chain-of-custody and regulatory governance trails.

### The Core Healthcare Bottleneck
Historically, this evidence is fragmented across separate software files, physical paper transport logs, and isolated laboratory folders. This creates severe clinical operational risks:
1. **Delayed Case Review**: Clinicians spend an average of **327 seconds (over 5 minutes)** manually locating files across 5 siloed systems.
2. **Missing Evidence & False Negatives**: When a molecular PCR test is missing, clinicians often mistakenly assume it represents a negative finding.
3. **Stale Information**: Test results older than 30 days are reviewed without recognizing active disease progression.
4. **Conflicting Evidence**: Contradictions between imaging (e.g., normal retina) and pathology (e.g., severe necrosis) go unnoticed until premature discharge.
5. **Broken Specimen Lineage**: Disconnected courier tracking risks medical interventions on the wrong patient.

---

## 2. Review 2 Upgrades (Qbee Evaluation Enhancements)

Following Review 1 feedback, EyeSync has been upgraded with enterprise security, validation, and containerization:

```
+---------------------------------------------------------------------------------------+
|                                    EyeSync Architecture                               |
|                                                                                       |
|   [ Client / Evaluator ]                                                              |
|            â”‚                                                                          |
|            â–¼  (Authorization: Bearer <JWT>)                                           |
|   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   |
|   â”‚ FastAPI Backend (Uvicorn)                                                     â”‚   |
|   â”‚  â”œâ”€â”€ Lifespan & SQLite Engine (eyesync.db)                                    â”‚   |
|   â”‚  â”œâ”€â”€ Strict Pydantic v2 Ingestion Schemas (Temporal & Lineage Validation)     â”‚   |
|   â”‚  â”œâ”€â”€ JWT Authenticator (HS256, Configurable Expiry & Secrets)                 â”‚   |
|   â”‚  â””â”€â”€ RBAC Authorization Engine (Enforces 6 Roles across Protected Endpoints)  â”‚   |
|   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   |
|                                          â”‚                                            |
|   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   |
|   â”‚ React 18 + Vite Frontend (Dockerized NGINX / Local Vite)                      â”‚   |
|   â”‚  â”œâ”€â”€ Unified Chronological Multidisciplinary Timeline                         â”‚   |
|   â”‚  â”œâ”€â”€ 6-Step Visual Specimen Lineage Diagram                                   â”‚   |
|   â”‚  â”œâ”€â”€ Dynamic Role Switcher with Synchronized Token Acquisition                â”‚   |
|   â”‚  â””â”€â”€ Least-Privilege Clinical View Masking                                    â”‚   |
|   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   |
+---------------------------------------------------------------------------------------+
```

### 1. Strict API Schema Validation (Pydantic v2)
- **Specimen Ingest Validation (`SpecimenIngestPayload`)**:
  - Validates required fields, non-empty stripped strings, and regex identifiers (`SPEC-\d{4,}`, `CASE-\d{4,}`, `PATH-\d{4,}`, `MOL-\d{4,}`).
  - Validates anatomical collection site against allowed clinical categories (`Right Tear Film`, `Left Tear Film`, `Bilateral Conjunctival Swab`, `Right Anterior Chamber Micro-aspirate`, `Left Epithelial Scraping`).
  - Validates custody status categories (`RECEIVED`, `IN_TRANSIT`, `PROCESSED`, `LOST_LINKAGE`).
  - **Temporal Sequence Validation**: Prohibits impossible timestamps (`collection_time <= transport_time <= received_time`).
  - **Lineage Integrity Validation**: Prohibits laboratory `received_time` when specimen is marked `IN_TRANSIT`; prohibits dual downstream pathology/molecular links when specimen is marked `LOST_LINKAGE`.
  - Rejects unknown attributes (`extra="forbid"`) to prevent malformed or injection payloads.
- **Clinical Review Validation (`ReviewCreateRequest`)**:
  - Enforces valid clinical decisions (`CLEAR`, `REFER`, `REVIEW_REQUIRED`, `INSUFFICIENT_EVIDENCE`).
  - Enforces numeric confidence range: `0.0 <= confidence <= 1.0`.
  - Enforces mandatory clinical rationale (minimum 5 non-whitespace characters).

### 2. Backend JWT Authentication & Role-Based Access Control (RBAC)
- **Token-Based Authentication**:
  - Issues cryptographically signed JSON Web Tokens (HMAC-SHA256).
  - Configurable expiration (default: 8 hours) and configurable secret via environment variables.
  - Endpoints: `POST /api/auth/login`, `POST /api/auth/token-for-role`, `GET /api/auth/me`.
  - Secure credential storage: Passwords hashed with PBKDF2-HMAC-SHA256 and unique per-user salts. No plaintext passwords stored.
- **API-Level RBAC Enforcement**:
  - Access control is strictly enforced on the server via FastAPI dependencies (`get_current_user`, `require_role`).
  - Client-supplied `user_role` parameters are disregarded; authorization is determined solely from verified JWT claims.
  - **Protected Endpoints**:
    - `POST /api/reviews`: Restricted to `Case Reviewer` and `Administrator`. Unauthorized roles receive **HTTP 403 Forbidden**.
    - `GET /api/audit-logs`: Restricted to `Administrator` and `Case Reviewer`.
    - `POST /api/specimens`: Restricted to field specimen ingest roles (`Camp Coordinator`, `Administrator`, `Pathology Reviewer`, `Molecular Reviewer`, `Case Reviewer`).
    - `GET /api/cases/{case_id}/evidence`: Restricted to clinical reviewer roles.
    - `GET /api/cases`, `GET /api/cases/{case_id}`, `GET /api/dashboard/metrics`: Require authenticated Bearer token (returns **HTTP 401 Unauthorized** if token is missing, expired, or invalid).
  - **Least-Privilege Role Masking**: When authenticated as `Camp Coordinator`, clinical histology and molecular findings are masked at the API level to respect operational boundaries.

---

## 3. EyeSync Role Matrix & Permissions

| Role Name | Demo Username | Intended Operational / Clinical Scope | Allowed Operations |
| :--- | :--- | :--- | :--- |
| **`Camp Coordinator`** | `coordinator` | Remote outreach logistics, camp patient flow, specimen dispatch | Ingest specimens, view case metadata & completeness, track delays. Clinical findings masked. Cannot submit clinical reviews. |
| **`Imaging Reviewer`** | `imaging_tech` | Mobile screening pod photography (Fundus, OCT, Slit-Lamp) | View cases, inspect raw images & quality scores. Cannot submit reviews or access audit trail. |
| **`Pathology Reviewer`**| `pathologist` | Laboratory cytopathology and epithelial dysplasia examination | View cases, verify specimen custody, inspect histology. Cannot submit final case disposition. |
| **`Molecular Reviewer`**| `molecular_tech`| Multiplex viral PCR assays and tear cytokine quantification | View cases, inspect molecular markers and freshness. |
| **`Case Reviewer`** | `reviewer` | Tele-ophthalmologist / Surgeon conducting multidisciplinary review | Full evidence access, review decision submission (`POST /api/reviews`), access audit trail. |
| **`Administrator`** | `admin` | Quality assurance, data governance, regulatory compliance | Full administrative access, review submission, audit log inspection, data hygiene evaluation. |

*Default Demo Password for all accounts:* `EyeSync@2026!` (configurable via `EYESYNC_DEMO_PASSWORD` in `.env`).

---

## 4. Technology Stack

- **Frontend**: React 18, Vite 5, Vanilla CSS (Clinical Enterprise Theme), Recharts, Lucide React.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy 2.0 ORM, Pydantic v2.13, PyJWT 2.15, Pandas.
- **Database**: Local SQLite (`backend/eyesync.db`) â€” auto-seeded with 500+ cases and 3,000+ relational records.
- **Containerization**: Dockerfile (Backend Python slim), Dockerfile (Frontend multi-stage Node/NGINX), `docker-compose.yml`.

---

## 5. Project Folder Structure

```
EyeSync/
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ components/          # Timeline, Specimen Lineage, Evidence Cards, Review Modal
â”‚   â”‚   â”œâ”€â”€ context/
â”‚   â”‚   â”‚   â””â”€â”€ RoleContext.jsx  # Syncs active role with JWT token acquisition
â”‚   â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”‚   â””â”€â”€ api.js           # Centralized API service with Bearer token injection
â”‚   â”‚   â”œâ”€â”€ pages/               # Dashboard, Case Explorer, Detail, FMEA, Audit, Quality
â”‚   â”‚   â”œâ”€â”€ styles.css           # Healthcare design tokens & responsive styling
â”‚   â”‚   â”œâ”€â”€ App.jsx
â”‚   â”‚   â””â”€â”€ main.jsx
â”‚   â”œâ”€â”€ Dockerfile               # Multi-stage Node 20 builder + NGINX alpine runtime
â”‚   â”œâ”€â”€ nginx.conf               # SPA routing & API reverse proxy configuration
â”‚   â”œâ”€â”€ package.json
â”‚   â””â”€â”€ vite.config.js
â”‚
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ main.py                  # FastAPI application with Lifespan, JWT, and RBAC routes
â”‚   â”œâ”€â”€ auth.py                  # JWT encoding/decoding, PBKDF2 hashing, RBAC dependencies
â”‚   â”œâ”€â”€ schemas.py               # Strict Pydantic v2 models (SpecimenIngestPayload, ReviewCreateRequest)
â”‚   â”œâ”€â”€ models.py                # SQLAlchemy ORM models (Case, Specimen, Imaging, Review, Audit)
â”‚   â”œâ”€â”€ database.py              # SQLite engine & session management
â”‚   â”œâ”€â”€ services.py              # Completeness calculation, freshness engine, lineage builder
â”‚   â”œâ”€â”€ data_generator.py        # Deterministic 500-case synthetic dataset generator
â”‚   â”œâ”€â”€ seed_database.py         # Database initialization script
â”‚   â”œâ”€â”€ experiment.py            # Clinical assembly time benchmark engine
â”‚   â”œâ”€â”€ Dockerfile               # Python 3.11 slim backend container
â”‚   â””â”€â”€ tests/
â”‚       â””â”€â”€ test_api.py          # Complete 32-test regression & validation test suite
â”‚
â”œâ”€â”€ data/                        # Generated synthetic CSV datasets (500+ records)
â”œâ”€â”€ experiments/                 # Benchmark results CSV & FMEA reports
â”œâ”€â”€ docker-compose.yml           # Unified orchestration for backend and frontend
â”œâ”€â”€ .env.example                 # Safe environment configuration template
â”œâ”€â”€ .dockerignore
â”œâ”€â”€ .gitignore
â”œâ”€â”€ requirements.txt
â””â”€â”€ README.md
```

---

## 6. How to Run Locally

### Prerequisites
- Python 3.10+ installed and on PATH
- Node.js LTS installed and on PATH

### Step 1: Backend API Setup
In PowerShell / Command Prompt:

```powershell
cd EyeSync

# Optional: Set environment configuration
copy .env.example .env

# Install backend dependencies
pip install -r requirements.txt

# Run backend test suite (32 tests)
python -m pytest backend/tests/test_api.py -v

# Start FastAPI backend server
uvicorn backend.main:app --reload --port 8000
```
- API Health probe: `http://localhost:8000/api/health`
- Interactive Swagger OpenAPI Documentation: `http://localhost:8000/docs`

### Step 2: Frontend Setup
In a second terminal:

```powershell
cd EyeSync\frontend

# Install dependencies (if not already installed)
npm install

# Start local Vite development server
npm run dev
```
- Open application in browser: `http://localhost:5173`

---

## 7. How to Run with Docker (Containerized Deployment)

EyeSync provides a self-contained containerized setup for external stakeholders and evaluators.

### Launch with Docker Compose
From the project root:

```bash
docker compose up --build
```

- **Frontend Application**: `http://localhost:3000` (served via NGINX reverse-proxying API calls)
- **Backend REST API**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`

To stop the containers:
```bash
docker compose down
```

---

## 8. Environment Variables & Secret Safety

Never commit `.env` files or hardcoded credentials to Git. The project includes `.env.example` with placeholder configuration:

```bash
# Security Keys
EYESYNC_JWT_SECRET=change-this-in-local-development-secret-key-2026
EYESYNC_JWT_ALGORITHM=HS256
EYESYNC_TOKEN_EXPIRE_MINUTES=480

# Demo Credentials
EYESYNC_DEMO_PASSWORD=EyeSync@2026!

# Server Ports
PORT=8000
VITE_API_URL=http://localhost:8000
```

---

## 9. Six Core Screening Camp Failure Modes

EyeSync includes deterministic test cases demonstrating each clinical failure mode:

| Case ID | Demonstrated Failure Mode | Clinical Detection Mechanism | System Defense & UI Feedback |
| :--- | :--- | :--- | :--- |
| **`CASE-0001`** | **Golden Case (Baseline)** | 100% complete evidence, verified cold chain | All green badges, 100% completeness, zero uncertainty warnings. |
| **`CASE-0002`** | **Missing Molecular Evidence** | Molecular record missing while case is open | Amber alert: *"Molecular evidence unavailable. Do NOT assume negative result."* Completeness capped at 80%. |
| **`CASE-0003`** | **Low-Quality Imaging** | Fundus quality analyzer score < 60/100 (33.7/100) | Red warning: *"Low-quality imaging â€“ interpretation confidence reduced."* Case flagged as `REVIEW_REQUIRED`. |
| **`CASE-0004`** | **Stale Molecular Result** | PCR result completed > 30 days prior | Amber tag: *"STALE â€“ verify before clinical reliance."* Prevents reliance on obsolete viral markers. |
| **`CASE-0005`** | **Conflicting Evidence** | Pathology Severe/Abnormal vs Imaging Normal | Crimson banner: *"CONFLICTING EVIDENCE â€“ REVIEW REQUIRED."* Blocks automatic clearance; mandates conference. |
| **`CASE-0006`** | **Broken Specimen Lineage** | Accession custody link severed in transit | Specimen node turns red: *"SPECIMEN LINEAGE INCOMPLETE / LINEAGE BROKEN."* Quarantines unverified sample. |

---

## 10. Automated Testing Results

The test suite runs with pytest and verifies all 32 tests across 4 test suites:

```powershell
python -m pytest backend/tests/test_api.py -v
```

### Verified Test Summary (32/32 Passing)
- **Original Review 1 Regression Suite (14/14 Passed)**:
  - `test_01_health_endpoint`: PASS
  - `test_02_cases_list_and_search`: PASS
  - `test_03_golden_case_0001`: PASS
  - `test_04_missing_molecular_case_0002`: PASS
  - `test_05_low_quality_imaging_case_0003`: PASS
  - `test_06_stale_molecular_case_0004`: PASS
  - `test_07_conflicting_evidence_case_0005`: PASS
  - `test_08_broken_specimen_lineage_case_0006`: PASS
  - `test_09_review_submission_and_audit`: PASS
  - `test_10_dashboard_metrics`: PASS
  - `test_11_experiments_results`: PASS
  - `test_12_failure_modes_fmea`: PASS
  - `test_13_data_quality`: PASS
  - `test_14_stakeholder_validation`: PASS

- **Strict Pydantic v2 Schema Validation Suite (8/8 Passed)**:
  - `test_v01_valid_specimen_payload_accepted` (HTTP 201): PASS
  - `test_v02_missing_required_specimen_fields_rejected` (HTTP 422): PASS
  - `test_v03_invalid_specimen_field_types_rejected` (HTTP 422): PASS
  - `test_v04_invalid_date_temporal_sequence_rejected` (HTTP 422): PASS
  - `test_v05_invalid_lineage_state_rejected` (HTTP 422): PASS
  - `test_v06_invalid_lineage_identifier_format_rejected` (HTTP 422): PASS
  - `test_v07_invalid_review_payload_rejected` (HTTP 422): PASS
  - `test_v08_valid_review_payload_accepted` (HTTP 200): PASS

- **JWT Authentication & RBAC Authorization Suite (9/9 Passed)**:
  - `test_auth_01_valid_login` (JWT token issuance): PASS
  - `test_auth_02_invalid_credentials` (HTTP 401): PASS
  - `test_auth_03_missing_token_rejected` (HTTP 401): PASS
  - `test_auth_04_invalid_token_rejected` (HTTP 401): PASS
  - `test_auth_05_expired_token_rejected` (HTTP 401): PASS
  - `test_auth_06_authorized_role_review_submission` (Case Reviewer -> 200): PASS
  - `test_auth_07_unauthorized_role_review_submission_rejected` (Camp Coordinator -> 403): PASS
  - `test_auth_08_audit_logs_rbac_enforcement` (Imaging Reviewer -> 403, Admin -> 200): PASS
  - `test_auth_09_evidence_access_rbac` (Coordinator -> 403, Imaging Reviewer -> 200): PASS

- **Frontend/Backend Integration Lifecycle Suite (1/1 Passed)**:
  - `test_full_authentication_and_api_lifecycle` (Login -> JWT -> Identity -> Cases -> Review -> Audit): PASS

---

## 11. Privacy & Ethical Safeguards

- **100% De-Identified Synthetic Data**: All 500 patient records use synthetic identifiers (`CASE-XXXX`) generated with deterministic pseudorandom algorithms.
- **Zero Real Patient Data (PHI/PII)**: Zero real names, addresses, phone numbers, or clinical scans.
- **Offline First**: Runs completely offline within local SQLite. Zero external cloud API calls or patient data leakage.
