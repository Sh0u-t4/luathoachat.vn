# Script: Re-trigger PDF processing for all knowledge documents with 0 chunks
# Usage: .\scripts\reprocess-all.ps1

$baseUrl = "http://localhost:3000"

Write-Host "=== Fetching all documents ===" -ForegroundColor Cyan

$response = Invoke-RestMethod -Uri "$baseUrl/api/knowledge/documents" -Method GET
$docs = $response.documents

Write-Host "Found $($docs.Count) documents" -ForegroundColor Yellow

foreach ($doc in $docs) {
    $id = $doc.id
    $title = $doc.title
    $chunks = $doc.chunk_count
    $storagePath = $doc.storage_path
    $fileType = $doc.file_type

    Write-Host "`n--- Processing: $title ---" -ForegroundColor White
    Write-Host "  ID: $id"
    Write-Host "  Chunks: $chunks"
    Write-Host "  Storage: $storagePath"
    Write-Host "  Type: $fileType"

    if ($chunks -gt 0) {
        Write-Host "  [SKIP] Already has $chunks chunks" -ForegroundColor Green
        continue
    }

    if ([string]::IsNullOrEmpty($storagePath) -and $fileType -eq "pdf") {
        Write-Host "  [SKIP] No storage_path found" -ForegroundColor Red
        continue
    }

    Write-Host "  [PROCESSING] Triggering embedding..." -ForegroundColor Yellow

    $body = @{
        document_id  = $id
        storage_path = $storagePath
        file_type    = $fileType
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/api/knowledge/process" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 120

        Write-Host "  [OK] Created $($result.chunks_created) chunks" -ForegroundColor Green
    }
    catch {
        Write-Host "  [ERROR] $($_.Exception.Message)" -ForegroundColor Red
        # Try to get more details
        try {
            $errResponse = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "  Detail: $($errResponse.error)" -ForegroundColor Red
        } catch {}
    }
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan

# Verify
Write-Host "`n=== Verifying results ===" -ForegroundColor Cyan
$verify = Invoke-RestMethod -Uri "$baseUrl/api/knowledge/documents" -Method GET
$totalChunks = 0
foreach ($doc in $verify.documents) {
    $totalChunks += $doc.chunk_count
    $status = if ($doc.chunk_count -gt 0) { "[OK]" } else { "[EMPTY]" }
    Write-Host "  $status $($doc.title): $($doc.chunk_count) chunks" -ForegroundColor $(if ($doc.chunk_count -gt 0) { "Green" } else { "Red" })
}
Write-Host "`nTotal chunks in DB: $totalChunks" -ForegroundColor $(if ($totalChunks -gt 0) { "Green" } else { "Red" })
