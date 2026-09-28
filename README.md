# EyeSync - Multidisciplinary Evidence Timeline for Temporary Eye-Care Screening Camps

## 1. Project Overview

EyeSync is a multidisciplinary evidence timeline system designed for temporary eye-care screening camps.

The system connects and tracks:

- Patient cases
- Imaging records
- Specimen collection
- Pathology results
- Molecular results
- Clinical review decisions
- Audit history

The main goal is to help reviewers understand the complete evidence history of a case while identifying missing, stale, conflicting, duplicate, or broken evidence.

All project data is synthetic and de-identified.

---

## 2. Review 2 Progress

Review 1 was completed with a score of 98% (34.3/35).

Review 1 feedback focused on:

1. Strict API schema validation
2. Token-based JWT authentication and RBAC
3. Live demo or containerized deployment
4. Additional integration testing and security hardening

Review 2 addresses these requirements through:

- Strict Pydantic v2 validation
- JWT authentication
- Role-Based Access Control
- Protected API endpoints
- Secure password hashing
- Docker and Docker Compose configuration
- Frontend authentication handling
- Additional automated tests
- Regression testing for critical evidence failure scenarios

---

## 3. System Architecture

```text
                    +----------------------+
                    |      EyeSync UI      |
                    |   React + Vite       |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |     FastAPI API      |
                    |  Authentication      |
                    |  Validation + RBAC   |
                    +----------+-----------+
                               |
             +-----------------+-----------------+
             |                 |                 |
             v                 v                 v
       Case Evidence      Specimen Data      Review Data
       Imaging            Pathology          Decisions
       Molecular          Lineage            Audit Logs

The backend validates incoming data before it reaches the application logic.

Authentication and authorization are handled using JWT tokens and role-based permissions.

4. Strict API Validation

EyeSync uses Pydantic v2 models for request validation.

Specimen Validation

Specimen identifiers follow strict patterns:

SPEC-0001
CASE-0001
PATH-0001
MOL-0001

Validation includes:

Identifier format validation
Allowed collection sites
Allowed processing statuses
Collection and transport chronology
Transport and received chronology
Lineage consistency
Required timestamps for processed specimens
Restrictions on invalid downstream links
Rejection of unexpected fields

Example chronology:

collection_time
       |
       v
transport_time
       |
       v
received_time

Invalid chronology is rejected by the API.

Review Validation

Review requests validate:

Confidence between 0 and 1
Valid review decisions
Minimum rationale length
Valid reviewer information

Unexpected fields are rejected using strict Pydantic configuration.

5. JWT Authentication and RBAC

EyeSync implements token-based authentication using JWT.

Authentication Flow
User Login
    |
    v
Username + Password
    |
    v
Authentication
    |
    v
JWT Access Token
    |
    v
Protected API Request
    |
    v
Role Validation
    |
    v
Authorized Response

Passwords are protected using PBKDF2-HMAC-SHA256 with per-user salts.

JWT secret and expiry configuration are controlled through environment variables.

Supported Roles
Camp Coordinator
Imaging Reviewer
Pathology Reviewer
Molecular Reviewer
Case Reviewer
Administrator
Role Access
Role	Cases	Imaging	Pathology	Molecular	Reviews	Audit
Camp Coordinator	Read	Read	Limited	Limited	No	No
Imaging Reviewer	Read	Read/Review	Read	Read	Yes	No
Pathology Reviewer	Read	Read	Read/Review	Read	Yes	No
Molecular Reviewer	Read	Read	Read	Read/Review	Yes	No
Case Reviewer	Read	Read	Read	Read	Yes	Yes
Administrator	Full	Full	Full	Full	Full	Full

Clinical findings are masked for Camp Coordinator access where required.

6. Backend Security and API Improvements

The backend includes:

JWT token generation
JWT token verification
Current-user dependency
Role-based authorization
Protected case endpoints
Protected review endpoints
Protected audit endpoints
Protected data-quality endpoints
Secure specimen ingestion
Centralized validation error handling
FastAPI lifespan management

The previous insecure client-supplied role query parameter was removed from protected case-detail access.

7. Frontend Authentication

The React frontend includes:

JWT token storage
Bearer token injection
Authentication state management
Role synchronization
401 handling
403 handling
Protected API requests

Relevant frontend components include:

frontend/src/services/api.js
frontend/src/context/RoleContext.jsx
8. Docker Deployment

EyeSync includes containerization files for deployment.

Backend
backend/Dockerfile
Frontend
frontend/Dockerfile
frontend/nginx.conf
Compose
docker-compose.yml

Additional Docker ignore files are included to avoid unnecessary files in container builds.

Dockerfiles and Docker Compose configuration were implemented and structurally validated.

Runtime container execution was not performed locally because Docker was not installed in the development environment.

9. Environment Configuration

An example environment file is provided:

.env.example

Sensitive environment files are excluded from Git using .gitignore.

Important configuration includes:

JWT secret
JWT expiration
Application settings
Database configuration where applicable

No real secrets are committed to the repository.

10. Project Structure
EyeSync/
|
+-- backend/
|   +-- auth.py
|   +-- main.py
|   +-- models/
|   +-- routes/
|   +-- services/
|   +-- tests/
|   +-- Dockerfile
|
+-- frontend/
|   +-- src/
|   |   +-- services/
|   |   +-- context/
|   |   +-- components/
|   |   +-- pages/
|   +-- Dockerfile
|   +-- nginx.conf
|
+-- data/
|
+-- tests/
|
+-- docker-compose.yml
+-- .dockerignore
+-- .env.example
+-- .gitignore
+-- README.md
11. Running Locally
Backend

From the project root:

python -m uvicorn backend.main:app --reload --port 8001
Frontend

Install dependencies and start the frontend using the configured package scripts.

The application can then be accessed through the frontend development server.

Authentication

The API provides:

POST /api/auth/login
POST /api/auth/token-for-role
GET  /api/auth/me

Protected endpoints require a valid JWT bearer token.

12. Evidence Failure Modes

EyeSync includes regression scenarios covering important evidence problems.

CASE-0002 - Missing Molecular Evidence

The case contains required clinical evidence but the expected molecular result is missing.

CASE-0003 - Low-Quality Imaging

The imaging record contains a low-quality score that requires reviewer attention.

CASE-0004 - Stale Molecular Evidence

The molecular evidence is older than the accepted freshness threshold.

CASE-0005 - Conflicting Evidence

Different evidence sources contain findings that require reviewer reconciliation.

CASE-0006 - Broken Specimen Lineage

The specimen chain contains an invalid or incomplete relationship.

CASE-0007 - Duplicate Imaging

Duplicate imaging evidence is detected for the same case.

These scenarios are included in regression testing to ensure that Review 2 security and validation changes do not break the existing evidence workflow.

13. Testing

Review 2 testing includes:

Existing Tests
14 existing tests passed
Validation Tests
8 validation tests passed

These cover:

Invalid identifiers
Invalid chronology
Invalid lineage
Invalid processing status
Invalid review confidence
Invalid review decisions
Invalid rationale
Unexpected fields
Authentication and RBAC Tests
9 authentication/RBAC tests passed

These cover:

Login
JWT generation
JWT verification
Invalid authentication
Protected endpoints
Role permissions
Unauthorized access
Forbidden access
Integration Test
1 integration test passed
Total Automated Tests
32 tests passed
14. Live API Verification

The FastAPI application was tested locally on port 8008.

Verified:

GET /api/health
Status: 200

Login:

POST /api/auth/login
Status: 200
JWT token returned

Protected endpoint with token:

Status: 200

Protected endpoint without token:

Status: 401

This confirms that protected API access requires authentication.

15. Frontend Build Verification

The frontend production build was executed successfully.

The build completed without compilation errors.

16. Privacy and Security

EyeSync uses synthetic and de-identified project data.

The system is designed to avoid exposing unnecessary patient-identifying information.

Security improvements in Review 2 include:

JWT authentication
Role-based authorization
Password hashing
Environment-based secrets
Strict request validation
Rejection of unexpected fields
Protected API endpoints
Audit access control
17. Review 2 Outcome

Review 2 focuses on moving EyeSync from a functional prototype toward a more secure and deployment-ready application.

The major improvements are:

Strict API validation
JWT authentication
RBAC
Secure password handling
Protected endpoints
Frontend authentication integration
Docker deployment configuration
Expanded automated testing
Regression coverage for evidence failure modes
Security and privacy hardening