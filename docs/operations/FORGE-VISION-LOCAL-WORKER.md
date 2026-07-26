# Forge Vision Local Worker Operations

Status: VISION-001B operational baseline  
Owner: Kingshot Forge  
Worker protocol: `forge-vision-worker.v1`  
Working branch: `feature/vision-mapper`

## Purpose

The Forge Vision local worker runs native visual extractors outside the browser and outside the Vercel web deployment. It accepts bounded, versioned jobs, preprocesses authorised image evidence and returns extractor output with confidence, bounding boxes, diagnostics and provenance.

The worker is a platform runtime. It contains no Kingshot screen coordinates, no domain write target and no screen-specific extraction logic.

## Runtime components

The first supported local runtime consists of:

- Node.js using the repository-supported runtime;
- ImageMagick 7.x for governed crop and preprocessing operations;
- Tesseract OCR 5.5.2 as the target pinned OCR engine;
- `tessdata_fast` release `4.1.0` for LSTM language data;
- the Forge extractor plugin `ocr.tesseract.cli`;
- the ImageMagick processor `image.imagemagick.cli`.

The supplied `tesseract.zip` is upstream native source, not a ready runtime bundle. It records Tesseract source version 5.5.2 and Apache-2.0 licensing but includes no `.traineddata` files. Do not copy the full archive into the web application or a Vercel Function.

## Pinned language data

The initial required language is English:

| File | Upstream repository | Release | Git blob SHA |
| --- | --- | --- | --- |
| `eng.traineddata` | `tesseract-ocr/tessdata_fast` | `4.1.0` | `bbef4675053b5b468cdb477053e28b1c698ba08e` |
| `osd.traineddata` | `tesseract-ocr/tessdata_fast` | `4.1.0` | `527457ca8f8fe1fda7c2f88bce3c0e4be12be9d0` |

`eng.traineddata` is mandatory for the first worker. `osd.traineddata` is optional until orientation and script detection is enabled. `tessdata_fast` is an LSTM-only data line, so mappings using this runtime must select OCR engine mode `1`.

The Git blob SHA is a source identity check, not a SHA-256 digest. Verify a downloaded file from a Git worktree with:

```bash
git hash-object eng.traineddata
git hash-object osd.traineddata
```

Do not silently replace traineddata files. A language-data change requires an operations review and new runtime evidence.

## Environment configuration

Configure the worker host, never the browser:

```text
FORGE_VISION_TESSERACT_PATH=/absolute/path/to/tesseract
FORGE_VISION_TESSDATA_DIR=/absolute/path/to/tessdata
FORGE_VISION_TESSERACT_EXPECTED_VERSION=5.5.2
FORGE_VISION_IMAGEMAGICK_PATH=/absolute/path/to/magick
FORGE_VISION_IMAGEMAGICK_EXPECTED_VERSION=<approved ImageMagick 7.x version>
```

The expected ImageMagick version is deployment-specific until Forge approves one cross-platform pinned package. It must be recorded in the deployment evidence rather than authored in a mapping.

Never place executable paths, traineddata paths, secrets or provider credentials in:

- Vision mappings;
- extractor configuration authored through Vision Studio;
- browser payloads;
- evidence records;
- worker job envelopes.

## Installation approach

Use one of these controlled approaches:

1. install an official operating-system package and verify its exact version;
2. build the supplied Tesseract source outside the Forge repository output;
3. use a separately maintained worker image or machine with pinned native packages.

For the source-build route, follow upstream Tesseract build requirements for the target operating system. Install the compiled executable outside the Forge web tree. Install approved traineddata into a dedicated directory referenced by `FORGE_VISION_TESSDATA_DIR`.

Windows installations should use an approved native build and set absolute paths. The worker invokes tools using `execFile`; it does not invoke PowerShell, Command Prompt, Bash or another shell.

## Preflight

Run these checks from the worker host:

```bash
tesseract --version
tesseract --tessdata-dir "$FORGE_VISION_TESSDATA_DIR" --list-langs
magick -version
npm run test:forge-vision
FORGE_VISION_NATIVE_REQUIRED=1 npm run test:forge-vision-native
```

The native acceptance test must return all synthetic tokens:

```text
FORGE VISION 12345
```

The test renders `fixtures/vision/synthetic/forge-vision-ocr.svg`, preprocesses it through the real ImageMagick adapter, runs the real Tesseract plugin and verifies text, token boxes, engine provenance and PNG output.

A worker release is not accepted when the native test skips. Use `FORGE_VISION_NATIVE_REQUIRED=1` for release and deployment gates.

## Starting the worker

The process reads one newline-delimited JSON job from standard input and writes one result per line to standard output:

```bash
npm run vision:worker
```

The transport is intended for a supervised Forge service wrapper. Do not expose the process directly to the public internet.

Each job includes:

- protocol version;
- job and trace identity;
- extractor plugin key;
- bounded base64 image bytes and image evidence metadata;
- optional normalised source region;
- governed preprocessing steps;
- extractor configuration;
- optional limits that cannot exceed platform maxima.

The worker never accepts arbitrary input paths, output paths, executable paths, shell fragments or custom command flags.

## Default resource limits

| Limit | Default | Platform maximum |
| --- | ---: | ---: |
| Total job time | 45 seconds | 120 seconds |
| Preprocessing time | 15 seconds | 60 seconds |
| Extraction time | 30 seconds | 90 seconds |
| Input bytes | 16 MiB | 32 MiB |
| Output bytes | 8 MiB | 16 MiB |
| Source/output pixels | 40 million | 80 million |
| Extracted tokens | 20,000 | 50,000 |

ImageMagick receives additional native limits for memory, mapped memory, disk, thread count, execution time and pixel area. Tesseract receives a bounded process timeout and output buffer. Native processes run without a shell and with hidden windows on Windows hosts.

## Governed preprocessing

The initial allowlist supports:

- grayscale;
- automatic level adjustment;
- contrast, one to three iterations;
- threshold from 0% to 100%;
- sharpen sigma from 0.1 to 3;
- colour negation;
- alpha removal;
- one resize step from 0.5x to 4x;
- a normalised mapping region converted to a bounded pixel crop.

The worker strips metadata and produces PNG output for the OCR plugin. It records the source digest, output digest, crop geometry, preprocessing steps, engine version, output dimensions, output byte length and duration.

## Health model

Worker health requires:

1. ImageMagick responds and its version can be parsed;
2. the configured ImageMagick expected version matches when supplied;
3. Tesseract responds and its version can be parsed;
4. the configured Tesseract expected version matches when supplied;
5. every required language appears in `--list-langs`;
6. at least one registered extractor is available.

Health is cached briefly to avoid launching native version checks for every extraction. A failed health gate prevents work and returns a normalised retryable failure.

## Failure codes

The worker returns structured failures rather than raw native exceptions:

- `invalid_job`;
- `input_too_large`;
- `pixel_limit_exceeded`;
- `unsupported_mime_type`;
- `processor_unavailable`;
- `preprocessing_timeout`;
- `preprocessing_failed`;
- `extractor_not_registered`;
- `extractor_unavailable`;
- `extraction_timeout`;
- `extraction_failed`;
- `output_too_large`;
- `token_limit_exceeded`;
- `worker_timeout`;
- `internal_error`.

Failure payloads identify the stage and whether retry is permitted. They do not return absolute paths, command lines, screenshot bytes or unrestricted stderr.

## Privacy and logging

The local worker must not log:

- raw screenshots or crops;
- base64 payloads;
- OCR text from player screenshots;
- executable or traineddata paths;
- full native stderr;
- secrets or access tokens.

Operational logs may include job ID, trace ID, stage, normalised failure code, duration, byte count, dimensions, plugin key and engine version. Screenshot retention remains governed by Forge evidence policy rather than the worker process.

## Deployment boundary

The Vercel application presents Vision Studio and coordinates authorised workflows. It does not host this native worker. The initial zero-recurring-cost deployment is a supervised local process on an approved machine. A future managed worker, container or external provider must implement the same plugin and worker contracts and undergo privacy, security, cost and operations review.

## Release evidence

Record the following for each worker release:

- Forge commit SHA;
- operating system and architecture;
- Node.js version;
- Tesseract version;
- traineddata release and source identities;
- ImageMagick version;
- environment variable names used, without values or paths;
- focused unit-test result;
- mandatory native fixture result;
- worker health report;
- known warnings and accepted risks.
