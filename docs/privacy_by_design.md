# EyeSync: Privacy by Design Specification

## Overview
EyeSync is designed from the ground up under the strict philosophy of **Privacy by Design**, adhering to HIPAA Safe Harbor de-identification standards, GDPR Article 25 (Data Protection by Design and by Default), and healthcare information security frameworks.

---

## 1. Zero Real Patient Data Policy
In temporary healthcare screening operations, sensitive patient disclosures present immense legal and ethical liability. EyeSync strictly prohibits real medical data in demonstration environments:
- **No Real Names**: Names are replaced with deterministic synthetic case identifiers (`CASE-0001` through `CASE-0500`).
- **No Real Addresses / Phone Numbers**: Location tags reflect general field screening stations (e.g., `Camp-A (North Valley Health Center)`).
- **No Real Hospital MRNs**: All internal record IDs are synthetic (`IMG-0001`, `SPEC-0001`, `PATH-0001`, `MOL-0001`, `REV-0001`).
- **No Real Retinal Photography or Biometric Files**: Imaging quality scores and parametric findings represent synthetic clinical profiles.
- **No Real Genomic Sequences**: Molecular findings are simulated parametric panel results.

---

## 2. Persistent Visual Disclosure Banner
Across every viewport in the user interface, a persistent, top-level banner is rendered:
> **"DE-IDENTIFIED SYNTHETIC DATA – DEMONSTRATION ONLY"**

This ensures that evaluators, clinicians, and auditors immediately recognize the synthetic nature of the dataset.

---

## 3. Data Minimisation
The EyeSync schema implements strict data minimization:
1. **No Superfluous Demographics**: Age, gender, ethnicity, marital status, billing details, insurance numbers, and residential zip codes are omitted entirely from the database.
2. **Clinical Utility Focus**: Only parameters strictly necessary for clinical triage and risk classification are stored (modality, acquisition timestamp, quality index, pathological severity, molecular status, and clinical decision).

---

## 4. Role-Based Access Control (RBAC) & Least Privilege
EyeSync implements granular role-based views to enforce the principle of least privilege:

| Role | Permitted Views | Masked / Restricted Views |
| :--- | :--- | :--- |
| **Camp Coordinator** | Case priority, evidence completeness %, specimen transport tracking, operational bottlenecks | Detailed cytology histology text, genomic annotations |
| **Imaging Reviewer** | Imaging modalities, quality scores, capture timestamps, operator and device metadata | Unrelated molecular assays, detailed billing/referral decisions |
| **Pathology Reviewer**| Specimen accession ID, tissue collection site, microscopic severity, cell morphology | Raw fundus photography camera calibrations |
| **Molecular Reviewer**| PCR assay targets, Ct confidence values, molecular test freshness | Unrelated clinical nursing notes |
| **Case Reviewer** | Full unified chronological evidence timeline, cross-modality conflict alerts, review submission | System configuration internals |
| **Administrator** | System health, data quality metrics, benchmark experiment logs, regulatory audit trail | Direct clinical editing |

---

## 5. Immutable Governance Audit Trail
Every critical system transaction automatically writes an append-only audit record to the `audit_logs` table:
- **Actions Logged**: `CASE_CREATED`, `CASE_VIEWED`, `EVIDENCE_VIEWED`, `REVIEW_SUBMITTED`, `CONFLICT_DETECTED`, `LINEAGE_ERROR_DETECTED`, `LOW_QUALITY_DETECTED`.
- **Recorded Attributes**: UTC Timestamp, Acting User Role, Case ID, Resource Type, Success/Failure Result, and Action Description.
- **Tamper Resistance**: Audit records cannot be altered or overwritten through standard API routes.

---

## 6. Local Offline Containment
EyeSync does not rely on third-party cloud analytics, remote storage buckets, external AI APIs, or external authentication providers. The complete application runs locally within the host machine using SQLite and local Python/Vite servers, preventing accidental cross-border or third-party data transmission.
