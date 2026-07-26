# FRKS-VISION-TESSERACT-001 — Tesseract Runtime Assessment

Research date: 23 July 2026  
Programme: Forge Vision  
Confidence: Confirmed for architecture; runtime host acceptance pending  
Status: Canonical Forge research record

## Research question

How should Forge use the supplied `tesseract.zip` as the first OCR engine without making Tesseract a permanent platform dependency?

## Source evidence inspected

### Supplied archive

The supplied archive is a full source checkout of `tesseract-ocr/tesseract` rather than an executable runtime package.

Observed evidence:

- repository identity: `tesseract-ocr/tesseract`;
- inspected source commit: `b34d7a8d7f25cada5f753d9ca68d0c2ed3056850`;
- source version file: `5.5.2`;
- licence: Apache-2.0;
- native build system and Git history present;
- no `.traineddata` language files present.

Conclusion: the archive must remain research/source evidence and must not be copied into the Forge web bundle or treated as a portable worker binary.

### Upstream runtime model

Upstream Tesseract separates the OCR engine from trained language data. Forge therefore needs two governed runtime inputs:

1. a pinned native Tesseract executable;
2. explicitly selected and identified traineddata files.

The initial language-data source is `tesseract-ocr/tessdata_fast` release `4.1.0`. This data line is LSTM-only and requires OCR engine mode `1`.

Confirmed source identities:

| File | Git blob SHA | Forge use |
| --- | --- | --- |
| `eng.traineddata` | `bbef4675053b5b468cdb477053e28b1c698ba08e` | Required initial English OCR |
| `osd.traineddata` | `527457ca8f8fe1fda7c2f88bce3c0e4be12be9d0` | Deferred orientation/script support |

## Architecture decision

Tesseract is implemented as plugin `ocr.tesseract.cli` behind the shared `VisionExtractorPlugin` contract.

The plugin:

- runs only in a local or separately managed worker;
- receives processed image bytes, not screen coordinates;
- is invoked with `execFile`, not a shell;
- accepts only allowlisted OCR settings;
- verifies engine version and required languages;
- requests TSV output;
- returns text, token confidence, token boxes, diagnostics and provenance;
- cannot write Forge data;
- can be replaced or compared without changing mappings or evidence contracts.

## Preprocessing decision

Tesseract does not own crop geometry or image preparation. Forge uses a separate `VisionImageProcessor` contract.

The first processor is `image.imagemagick.cli`, which converts normalised mapping geometry into a bounded crop and applies governed preprocessing. This preserves a future replacement path for another image library or computer-vision processor.

## Cost decision

The first deployment target is a supervised local process using installed open-source native tools. This supports the Forge cost-conscious principle and creates no recurring provider charge.

A managed worker, external OCR API or AI-vision provider remains possible through the same contracts but requires future privacy, retention, reliability and cost review.

## Security findings

Primary risks and controls:

- command injection: native tools use `execFile`; jobs cannot submit paths or arbitrary flags;
- resource exhaustion: hard byte, pixel, token and timeout ceilings;
- decompression/image bombs: dimensions and pixel area are checked before processing; ImageMagick receives native resource limits;
- untrusted output: result size, token count and provenance are validated;
- path disclosure: native paths and unrestricted stderr are not returned;
- screenshot exposure: raw images and OCR text are prohibited from operational logs;
- runtime drift: optional exact-version checks and required-language health gates;
- evidence loss: preprocessing and extractor versions are retained in provenance.

## Validation evidence

A synthetic high-contrast fixture was rendered and passed through the actual ImageMagick and Tesseract execution path on the development validation host.

Host evidence:

- Tesseract `5.5.0`;
- ImageMagick `7.1.2-1`;
- English traineddata available;
- extracted text: `FORGE VISION 12345`;
- TSV word boxes present;
- PNG preprocessing output confirmed.

This confirms the architecture and runtime flow. It does not prove the target Tesseract `5.5.2` deployment, which remains an explicit host-acceptance gate.

## Confidence assessment

Architecture confidence: **Confirmed**.

Rationale:

- supplied source evidence inspected directly;
- upstream engine/language-data separation confirmed;
- native execution path tested;
- provider-neutral contracts and safe process boundary implemented;
- exact production-host versions and supervision remain unverified.

## Rejected alternatives

### Bundle the supplied archive into the web app

Rejected because it is native source, includes Git/build material, contains no language data and cannot run inside the browser or standard Vercel function environment.

### Call Tesseract directly from domain code

Rejected because it would couple product domains to one OCR engine and bypass the extractor, evidence and confidence contracts.

### Allow Admin-authored command options

Rejected because arbitrary flags, paths or shell fragments would create a command-injection and governance boundary failure.

### Store only final OCR text

Rejected because Forge must preserve token boxes, confidence, raw output, runtime versions, preprocessing evidence and validation/conflict history.

## Future research

- controlled comparison between `tessdata_fast`, standard `tessdata` and `tessdata_best` for representative Kingshot typography;
- EasyOCR and PaddleOCR adapter comparisons;
- OpenCV preprocessing and template-matching adapters;
- multilingual language-pack governance;
- ARM64 Windows native-worker packaging;
- supervised worker service and authenticated job delivery;
- privacy/cost assessment for external AI-vision providers.
