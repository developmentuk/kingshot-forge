# VISION-001B — Extractor Host and Tesseract Local Worker

Date: 23 July 2026  
Branch: `feature/vision-mapper`  
Programme: Forge Vision Platform  
Status: Implemented foundation; native deployment acceptance pending

## Objective

Deliver the first executable Forge Vision extractor host without coupling the platform to Tesseract, a Kingshot screen layout or a domain write target.

## Delivered

### Versioned worker boundary

Forge now defines `forge-vision-worker.v1` with:

- job, trace and submission identity;
- extractor plugin selection;
- bounded image evidence transport;
- optional normalised source region;
- governed preprocessing steps;
- extractor configuration;
- bounded resource-limit overrides;
- normalised success, timing and failure output.

The NDJSON process transport encodes image bytes as canonical base64. Jobs cannot supply executable paths, traineddata directories, input/output filesystem paths, shell fragments or arbitrary command flags.

### Local worker host

`VisionWorkerHost`:

- resolves only registered extractor plugins;
- health-gates the preprocessor and selected extractor;
- converts the governed region into a processed crop before extraction;
- applies default limits and rejects overrides above platform maxima;
- enforces preprocessing, extraction and total timeouts;
- validates result byte size, token count and provenance;
- returns structured failures instead of raw native exceptions;
- caches native health briefly to avoid repeated process launches.

### Image preprocessing adapter

`image.imagemagick.cli` provides an interchangeable preprocessing boundary using `execFile` rather than a shell.

Supported operations are restricted to:

- crop from normalised mapping geometry;
- grayscale;
- automatic level adjustment;
- bounded contrast;
- bounded threshold;
- bounded sharpening;
- negation;
- alpha removal;
- one bounded resize.

ImageMagick receives explicit limits for memory, mapped memory, disk, thread count, execution time and pixel area. Output metadata is stripped and the OCR input is normalised to PNG. The processing record preserves source/output digests, crop geometry, steps, engine version, dimensions, byte length and duration.

### Tesseract plugin hardening

`ocr.tesseract.cli` now:

- verifies its runtime version;
- optionally enforces an exact expected version;
- verifies required language data with `--list-langs`;
- validates input digest, bytes, dimensions and pixel count;
- bounds runtime, output and token count;
- maps native timeout/process errors into governed Forge failure codes;
- preserves TSV token confidence and bounding boxes;
- records engine and plugin provenance;
- keeps executable and traineddata paths outside job and mapping data.

The plugin remains replaceable through the provider-neutral extractor interface.

### Synthetic runtime evidence

The repository now includes:

- `fixtures/vision/synthetic/forge-vision-ocr.svg`;
- `fixtures/vision/synthetic/forge-vision-ocr.fixture.json`;
- a deterministic worker-contract suite;
- an optional native acceptance test that becomes mandatory when `FORGE_VISION_NATIVE_REQUIRED=1`.

The native fixture expects:

```text
FORGE VISION 12345
```

## Validation completed

A reconstructed VISION-001B subset was validated with:

- strict TypeScript compilation;
- worker transport and canonical-base64 checks;
- normalised crop-to-pixel conversion;
- preprocessing allowlist and command construction;
- worker health gates;
- extraction isolation after preprocessing;
- input, output, pixel, token and timeout controls;
- missing-extractor and input-limit failures;
- native ImageMagick preprocessing;
- native Tesseract TSV extraction.

The native fixture passed on the validation host using:

- Tesseract `5.5.0`;
- ImageMagick `7.1.2-1`;
- English traineddata available on the host.

Observed extraction:

```text
FORGE VISION 12345
```

This validates the worker design and native toolchain path. It does not satisfy the production pin because the approved target is Tesseract `5.5.2`.

## Operational pin

The worker operations runbook records:

- Tesseract target `5.5.2`;
- `tessdata_fast` release `4.1.0`;
- required `eng.traineddata` Git blob SHA `bbef4675053b5b468cdb477053e28b1c698ba08e`;
- optional `osd.traineddata` Git blob SHA `527457ca8f8fe1fda7c2f88bce3c0e4be12be9d0`;
- the environment variables, preflight, privacy and release-evidence requirements.

See `docs/operations/FORGE-VISION-LOCAL-WORKER.md`.

## Security and privacy boundary

- Native tools are invoked with `execFile`, never shell execution.
- The worker is not publicly exposed.
- Vercel does not run the native worker.
- Screenshots, crops and OCR text must not be written to operational logs.
- Native paths and unrestricted stderr are not returned to clients.
- The worker cannot mutate Forge data.
- All extraction remains a proposal and evidence operation.

## Persistence state

No Supabase write was made.

The checked-in VISION-001 migration remains unapplied to project `hrvdhjscwitqpwjhnjkm`. There are no live Vision tables, mappings, screenshot records or worker jobs in Supabase.

## Acceptance still required

VISION-001B is not a production worker release until all of the following pass on the approved host:

1. Tesseract `5.5.2` is installed and the exact-version health gate passes.
2. Approved `eng.traineddata` is installed and source identity is recorded.
3. The deployment-specific ImageMagick version is approved and pinned.
4. `FORGE_VISION_NATIVE_REQUIRED=1 npm run test:forge-vision-native` passes.
5. The worker process is supervised and inaccessible from the public internet.
6. Runtime logs are reviewed for privacy compliance.
7. Worker health and failure recovery are exercised on the actual host.
8. The exact Forge commit is recorded in release evidence.

## Deferred

The following remain outside VISION-001B:

- applying the Vision migration;
- private screenshot upload and storage;
- Vision Studio mapping authoring;
- any Kingshot screen mapping;
- test-result persistence;
- extractor comparison orchestration;
- confirmation and domain proposal execution;
- a managed or cloud native-worker deployment;
- EasyOCR, PaddleOCR, OpenCV or AI-vision plugins.

## Next milestone

VISION-001C — Vision Studio authoring:

- screen and version administration;
- private reference-evidence upload boundary;
- region and anchor authoring canvas;
- Field Registry selection;
- extractor, transform and validation configuration;
- draft persistence and immutable successor creation.

Database work remains gated on migration preflight and explicit approval.
