# Forge Vision worker extraction — deferred scope

Worker extraction is not part of VISION-001D1. Storage preparation must not start OCR, image processing or worker execution.

The concrete evidence adapters and API boundary do not submit jobs, invoke OCR,
write canonical game data or create worker records. Verified evidence is only a
storage lifecycle fact; extraction remains a separate owner-approved stage.

VISION-001D2 should separately govern the worker boundary: authenticated job submission, private evidence retrieval, bounded preprocessing, extractor health, Tesseract runtime pinning, provenance capture, retry/timeout policy, failure isolation, result validation, evidence retention and zero implicit canonical writes. The existing `forge-vision-worker.v1` contracts remain the starting point; no managed worker deployment is approved by D1A.
