# Forge Vision worker extraction — deferred scope

Worker extraction is not part of VISION-001D1. Storage preparation must not start OCR, image processing or worker execution.

VISION-001D2 should separately govern the worker boundary: authenticated job submission, private evidence retrieval, bounded preprocessing, extractor health, Tesseract runtime pinning, provenance capture, retry/timeout policy, failure isolation, result validation, evidence retention and zero implicit canonical writes. The existing `forge-vision-worker.v1` contracts remain the starting point; no managed worker deployment is approved by D1A.
