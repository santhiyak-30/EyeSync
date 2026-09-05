# EyeSync: Field Screening Camp Operational Workflow

## 1. Context of Temporary Eye Screening Camps
Temporary screening camps operate in rural and semi-urban community centers, primary schools, or mobile outreach vans. They bridge healthcare access gaps for populations distant from tertiary eye hospitals.

However, operating in temporary environments introduces severe vulnerabilities:
- Intermittent or non-existent cellular connectivity.
- Disconnected diagnostic instruments (standalone fundus camera, portable slit lamp).
- Physical specimen transport over long rural distances to central laboratories.
- Disparate reporting systems causing delayed reviews and uncoordinated care.

---

## 2. The 12-Step Operational Lifecycle

```
[1. Camp Registration]
          |
          v
[2. Case Created]
          |
          v
[3. Imaging Capture] ────> (Automated Image Quality Scoring)
          |
          v
[4. Specimen Collection] ──> (2D Barcode Label Affixed)
          |
          v
[5. Cold-Chain Transport] ─> (Refrigerated Courier Dispatch)
          |
          v
[6. Central Lab Receipt] ──> (Chain-of-Custody Verification)
          |
          v
[7. Pathology Analysis] ───> (Histology & Cytology Reading)
          |
          v
[8. Molecular Testing] ────> (Viral PCR / Cytokine Panels)
          |
          v
[9. Evidence Sync] ────────> (EyeSync Chronological Aggregator)
          |
          v
[10. Case Review] ─────────> (Multidisciplinary Decision Console)
          |
          v
[11. Decision Recorded] ───> (CLEAR / REFER / REVIEW / INSUFFICIENT)
          |
          v
[12. Immutable Audit] ─────> (Governance & Regulatory Trail)
```

---

## 3. High-Risk Operational Failure Points & Mitigations

### Failure Point 1: Specimen Loss in Transit
- **Root Cause**: Rough road conditions, cooler barcode label detachment, or courier manifest error.
- **EyeSync Defense**: Lineage engine tracks `transport_time` and `received_time`. If accessioning is missing or mismatched, the system flags `LOST_LINKAGE` and displays a bold red `LINEAGE BROKEN` alert across the timeline, preventing doctors from treating the wrong patient.

### Failure Point 2: Sub-threshold Imaging
- **Root Cause**: Dense cataracts, pupil constriction without dilating drops, or patient head motion.
- **EyeSync Defense**: Automated quality scoring (<60/100) triggers an immediate pod alert so technicians re-take the photo while the patient is still on-site.

### Failure Point 3: Delayed Molecular Batching
- **Root Cause**: PCR kits batched weekly at central labs; reports arrive after patient follow-up.
- **EyeSync Defense**: Freshness engine marks results older than 30 days as `STALE`, prompting clinicians to verify acute symptom evolution before prescribing antivirals.
