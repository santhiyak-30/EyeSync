# EyeSync: Technical API & Engine Documentation

## 1. REST API Endpoints Catalog

All endpoints return standard JSON payloads and appropriate HTTP status codes. Automatic Swagger UI documentation is available at `http://localhost:8000/docs`.

### Core Endpoints

| Method | Path | Summary | Query Parameters / Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | System Health & DB Connectivity | None |
| `GET` | `/api/cases` | Search, filter, and paginate cases | `search`, `priority`, `status`, `camp`, `has_anomaly`, `skip`, `limit` |
| `GET` | `/api/cases/{case_id}` | Full case detail, timeline, and lineage | `user_role` |
| `GET` | `/api/cases/{case_id}/timeline`| Unified chronological timeline | None |
| `GET` | `/api/cases/{case_id}/evidence`| Raw multidisciplinary evidence arrays| None |
| `GET` | `/api/cases/{case_id}/lineage` | 6-step specimen lineage tree | None |
| `GET` | `/api/dashboard/metrics` | Operational KPIs and Recharts data | None |
| `GET` | `/api/audit-logs` | Immutable audit transaction logs | `case_id`, `role`, `action`, `skip`, `limit` |
| `POST`| `/api/reviews` | Submit case review decision | JSON: `case_id`, `reviewer_role`, `decision`, `confidence`, `reason` |
| `GET` | `/api/experiments/results` | Benchmark timing & error metrics | None |
| `GET` | `/api/failures` | FMEA failure modes catalog | None |
| `GET` | `/api/data-quality` | Dataset hygiene and integrity score | None |
| `GET` | `/api/validation` | Stakeholder usability rubric feedback| None |

---

## 2. Pydantic Request & Response Schemas

### Review Creation Request (`ReviewCreateRequest`)
```json
{
  "case_id": "CASE-0001",
  "reviewer_role": "Case Reviewer",
  "decision": "CLEAR",
  "confidence": 0.95,
  "reason": "Complete concordant evidence across fundus imaging, negative tear cytology, and viral PCR."
}
```

### Review Response (`ReviewResponse`)
```json
{
  "success": true,
  "message": "Review decision 'CLEAR' recorded successfully for CASE-0001.",
  "review": {
    "review_id": "REV-0501",
    "case_id": "CASE-0001",
    "reviewer_role": "Case Reviewer",
    "reviewed_at": "2026-09-03T11:00:00Z",
    "decision": "CLEAR",
    "confidence": 0.95,
    "reason": "Complete concordant evidence...",
    "evidence_completeness": 100.0
  }
}
```

---

## 3. Freshness Configuration Matrix

The freshness engine evaluates temporal decay of diagnostic evidence:
```python
FRESHNESS_CONFIG = {
    "imaging": 7,      # Maximum 7 days before retinal changes require re-imaging
    "pathology": 14,   # Maximum 14 days for biopsy / cytology validity
    "molecular": 30    # Maximum 30 days for viral PCR and cytokine kinetics
}
```
Formula:
$$\text{Age in Days} = \frac{\text{Current Time} - \text{Event Timestamp}}{86400}$$
$$\text{Status} = \begin{cases} \text{FRESH} & \text{if Age} < \text{Threshold} \\ \text{STALE} & \text{if Age} \geq \text{Threshold} \end{cases}$$
