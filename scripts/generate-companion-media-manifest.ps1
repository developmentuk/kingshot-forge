<#
.SYNOPSIS
Regenerates the governed Companion media manifest from explicitly supplied archives.

.DESCRIPTION
The repository root and all output locations are resolved from this script's
location. Source ZIP archives remain external intake evidence and are never
searched for or copied into the repository.

.PARAMETER ItemsArchive
Path to the verified 59-file full-artwork items.zip archive.

.PARAMETER IconsArchive
Path to the verified 7-file compact-icon icons.zip archive.

.EXAMPLE
pwsh ./scripts/generate-companion-media-manifest.ps1 `
  -ItemsArchive /secure/intake/items.zip `
  -IconsArchive /secure/intake/icons.zip
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
  [string]$ItemsArchive,

  [Parameter(Mandatory = $true)]
  [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
  [string]$IconsArchive
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

$ScriptDirectory = Split-Path -Parent $PSCommandPath
$RepositoryRoot = (Resolve-Path (Join-Path $ScriptDirectory '..')).Path
$PublishedRoot = Join-Path $RepositoryRoot 'public/media/companion'
$JsonOutput = Join-Path $RepositoryRoot 'docs/companion/assets/ITEM-MEDIA-MANIFEST-2026-08-03.json'
$TsOutput = Join-Path $RepositoryRoot 'shared/companion/generatedMediaManifest.ts'

function Convert-ToSlug([string]$value) {
  $slug = $value.ToLowerInvariant() -replace '[^a-z0-9]+', '-'
  $slug = $slug.Trim('-')
  if ($slug -eq 'mythril') { return 'mithril' }
  if ($slug -eq 'promototion-medallion') { return 'promotion-medallion' }
  if ($slug -eq 'weapons-scraps') { return 'weapon-scraps' }
  return $slug
}

function Convert-ToName([string]$slug) {
  $special = @{
    'mithril' = 'Mithril'; 'ceasers-aid-chest' = "Cesare's Aid Chest";
    'promotion-medallion' = 'Promotion Medallion'; 'pans-emblem' = "Pan's Emblem";
    'romans-emblem' = "Roman's Emblem"; 'valoras-emblem' = "Valora's Emblem";
    'wilsons-emblem' = "Wilson's Emblem"; 'cassia-emblem' = "Cassia's Emblem";
    'soldiers-medallion' = "Soldier's Medallion"; 'league-token' = 'League Token';
    'gen-4-custom-hero-widget-chest' = 'Gen 4 Custom Hero Widget Chest';
    'gen-5-custom-hero-widget-chest' = 'Gen 5 Custom Hero Widget Chest';
    'masters-manuscript' = "Master's Manuscript"; 'truegold-dust' = 'Truegold Dust';
    'pet-advancement-materials-custom-chest' = 'Pet Advancement Materials Custom Chest';
    'governor-gear-materials-chest' = 'Governor Gear Materials Chest';
    'mythic-general-decoration-component' = 'Mythic General Decoration Component';
  }
  if ($special.ContainsKey($slug)) { return $special[$slug] }
  return (($slug -split '-') | ForEach-Object { if ($_.Length) { $_.Substring(0,1).ToUpperInvariant() + $_.Substring(1) } }) -join ' '
}

function Read-ManifestEntry($entry, [string]$archive, [string]$role, [string]$root) {
  $sourceStream = $entry.Open()
  $memory = New-Object IO.MemoryStream
  $sourceStream.CopyTo($memory)
  $sourceStream.Dispose()
  $bytes = $memory.ToArray()
  $memory.Dispose()
  $hash = [BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($bytes)).Replace('-', '').ToLowerInvariant()
  $sourceName = [IO.Path]::GetFileNameWithoutExtension($entry.FullName)
  $slug = Convert-ToSlug $sourceName
  $relative = if ($role -eq 'full_artwork') { "items/$slug.webp" } else { "icons/$slug.webp" }
  $published = Join-Path $root $relative.Replace('/', '\')
  if (-not (Test-Path -LiteralPath $published)) { throw "Published media missing: $published" }
  $publishedBytes = [IO.File]::ReadAllBytes($published)
  $riff = [Text.Encoding]::ASCII.GetString($bytes, 0, [Math]::Min(4, $bytes.Length))
  $webp = if ($bytes.Length -ge 12) { [Text.Encoding]::ASCII.GetString($bytes, 8, 4) } else { '' }
  if ($riff -ne 'RIFF' -or $webp -ne 'WEBP') { throw "Invalid WebP container: $($entry.FullName)" }
  $width = 0; $height = 0; $alpha = $false
  for ($offset = 12; $offset + 8 -le $bytes.Length; $offset += 1) {
    $chunk = [Text.Encoding]::ASCII.GetString($bytes, $offset, 4)
    if ($chunk -eq 'VP8X' -and $offset + 18 -le $bytes.Length) {
      $alpha = (($bytes[$offset + 8] -band 0x10) -ne 0)
      $width = 1 + $bytes[$offset + 12] + ($bytes[$offset + 13] -shl 8) + ($bytes[$offset + 14] -shl 16)
      $height = 1 + $bytes[$offset + 15] + ($bytes[$offset + 16] -shl 8) + ($bytes[$offset + 17] -shl 16)
      break
    }
  }
  if ($width -le 0 -or $height -le 0) { throw "WebP dimensions unavailable: $($entry.FullName)" }
  [ordered]@{
    source_archive = [IO.Path]::GetFileName($archive)
    original_archive_entry = $entry.FullName
    source_sha256 = $hash
    decoded_format = 'webp'
    width = $width; height = $height; has_alpha = $alpha
    byte_length = $bytes.Length
    media_role = $role
    canonical_item_key = $slug
    canonical_forge_id = "item.$slug"
    canonical_name = Convert-ToName $slug
    canonical_filename = "$slug.webp"
    immutable_media_path = "/media/companion/$relative"
    alt_text = "$(Convert-ToName $slug) item artwork"
    rights_status = 'owner_declared_creative_commons'
    owner_declaration = 'Project owner declared the supplied artwork Creative Commons and approved publication.'
    provenance_limitations = 'Forge has not independently verified the exact licence variant, original artist, original website, source URL, official ownership or endorsement.'
    publication_state = 'published_preview_candidate'
    published_sha256 = ([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($publishedBytes)).Replace('-', '').ToLowerInvariant())
  }
}

$records = New-Object Collections.Generic.List[object]
foreach ($definition in @(@{ Path = $ItemsArchive; Role = 'full_artwork' }, @{ Path = $IconsArchive; Role = 'compact_icon' })) {
  $zip = [IO.Compression.ZipFile]::OpenRead($definition.Path)
  foreach ($entry in $zip.Entries | Where-Object { $_.Length -gt 0 }) {
    $records.Add((Read-ManifestEntry $entry $definition.Path $definition.Role $PublishedRoot))
  }
  $zip.Dispose()
}
$records = @($records | Sort-Object media_role, canonical_item_key)
$duplicates = @($records | ForEach-Object { $_.source_sha256 } | Group-Object | Where-Object Count -gt 1)
if ($duplicates.Count -gt 0) { throw 'Duplicate binary SHA-256 values detected.' }
$document = [ordered]@{
  schema_version = '1.0.0'; manifest_id = 'COMPANION-MEDIA-2026-08-03'; generated_at = '2026-08-03'
  rights_basis = 'owner_declared_creative_commons'; full_artwork_count = @($records | Where-Object media_role -eq 'full_artwork').Count
  compact_icon_count = @($records | Where-Object media_role -eq 'compact_icon').Count; total_asset_count = $records.Count
  assets = $records
}
$jsonText = $document | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText($JsonOutput, $jsonText, (New-Object Text.UTF8Encoding($false)))
$ts = "// Generated by scripts/generate-companion-media-manifest.ps1. Do not hand-edit.`nexport const COMPANION_MEDIA_MANIFEST = " + (($records | ConvertTo-Json -Depth 8 -Compress) -replace '\\r?\\n','') + " as const`n"
[IO.File]::WriteAllText($TsOutput, $ts, (New-Object Text.UTF8Encoding($false)))
Write-Output "Generated $($records.Count) media records ($($document.full_artwork_count) full, $($document.compact_icon_count) compact)."
