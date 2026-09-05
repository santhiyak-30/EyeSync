# EyeSync: Technical Architecture & System Design

## 1. System Overview
**EyeSync** is a multidisciplinary evidence coordination platform specifically engineered for temporary eye-care screening camps. It bridges the gap between field-level patient acquisition and central laboratory analysis by compiling disparate evidence streams into a single unified chronological timeline.

```
+-------------------------------------------------------------------------+
|                      EyeSync Frontend (React + Vite)                    |
|  +-------------------+  +---------------------+  +--------------------+ |
|  | Evidence Timeline |  |  Specimen Lineage   |  | Uncertainty Banner | |
|  +-------------------+  +---------------------+  +--------------------+ |
|  +-------------------+  +---------------------+  +--------------------+ |
|  |  Evidence Cards   |  |   Review Workflow   |  |  Recharts Analytics| |
|  +-------------------+  +---------------------+  +--------------------+ |
+------------------------------------+------------------------------------+
                                     | HTTP REST (Port 8000)
                                     v
+-------------------------------------------------------------------------+
|                      EyeSync Backend (Python FastAPI)                   |
|  +-------------------+  +---------------------+  +--------------------+ |
|  | Freshness Engine  |  | Completeness Engine |  | Lineage Assembler  | |
|  +-------------------+  +---------------------+  +--------------------+ |
|  +-------------------+  +---------------------+  +--------------------+ |
|  | Conflict Detection|  |  FMEA Risk Engine   |  |  Audit Log Service | |
|  +-------------------+  +---------------------+  +--------------------+ |
+------------------------------------+------------------------------------+
                                     | SQLAlchemy ORM
                                     v
+-------------------------------------------------------------------------+
|                      Local SQLite Database (eyesync.db)                 |
|  [cases]  [imaging_events]  [specimens]  [pathology]  [molecular]       |
|  [review_decisions]  [audit_logs]                                       |
+------------------------------------+------------------------------------+
                                     ^
                                     | Idempotent Seed
+------------------------------------+------------------------------------+
|                      Synthetic CSV Data Pipeline (data/)                |
|  cases.csv, imaging_events.csv, specimens.csv, pathology_results.csv,   |
|  molecular_results.csv, review_decisions.csv, audit_logs.csv             |
+-------------------------------------------------------------------------+
```

---

## 2. Database Entity Relationships (ERD)

- **`Case`** (1) ── (N) **`ImagingEvent`**
  - Linked by `case_id`.
  - Captures retinal fundus, OCT, and slit lamp metadata, quality scores, and review findings.
- **`Case`** (1) ── (1..N) **`Specimen`**
  - Linked by `case_id`.
  - Records tear-film or conjunctival swab collection, cold-chain transport, and central lab accessioning.
- **`Case`** (1) ── (N) **`PathologyResult`**
  - Linked by `case_id` and optionally `specimen_id`.
  - Records cytological findings, epithelial dysplasia, and inflammatory severity.
- **`Case`** (1) ── (N) **`MolecularResult`**
  - Linked by `case_id` and optionally `specimen_id`.
  - Records multiplex PCR assays (HSV, VZV, CMV) and cytokine quantification.
- **`Case`** (1) ── (N) **`ReviewDecision`**
  - Linked by `case_id`.
  - Records multidisciplinary clinical decisions (`CLEAR`, `REFER`, `REVIEW_REQUIRED`, `INSUFFICIENT_EVIDENCE`), rationale, and confidence scores.
- **`Case`** (1) ── (N) **`AuditLog`**
  - Linked by `case_id` (or nullable for system-wide events).
  - Records timestamped user interactions, view events, decision commits, and anomaly detections.

---

## 3. Core Analytical Engines

### A. Freshness Engine
Configurable freshness rules evaluate evidence currency relative to active review timestamps:
- **Imaging**: Fresh < 7 days, Stale ≥ 7 days.
- **Pathology**: Fresh < 14 days, Stale ≥ 14 days.
- **Molecular**: Fresh < 30 days, Stale ≥ 30 days (reflecting acute viral replication cycles).

### B. Completeness Engine
Calculates an objective 0–100 score with explicit point awards:
- Imaging Available: 30 Points
- Pathology Available: 30 Points
- Molecular Available: 20 Points
- Specimen Lineage Complete: 10 Points
- Review Decision Recorded: 10 Points

### C. Uncertainty & Conflict Rules
Automated rules detect high-risk clinical ambiguities:
1. **Missing Molecular**: Molecular result is absent while imaging/pathology is present. Flags: *"UNKNOWN – Evidence unavailable. Do not assume negative finding."*
2. **Low-Quality Imaging**: Quality score < 60/100. Flags: *"LOW QUALITY – Interpretation confidence reduced."*
3. **Stale Molecular**: Age ≥ 30 days. Flags: *"STALE – Verify before clinical review."*
4. **Conflicting Evidence**: Pathology Severe/Abnormal finding paired with Imaging Normal read. Flags: *"CONFLICTING EVIDENCE – REVIEW REQUIRED."*
5. **Broken Lineage**: Specimen marked `LOST_LINKAGE`. Flags: *"SPECIMEN LINEAGE INCOMPLETE."*
