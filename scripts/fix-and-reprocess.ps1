# Script: Delete old empty records and reprocess PDFs directly via the process API
# using pre-extracted text content (bypassing Supabase Storage)
# Usage: .\scripts\fix-and-reprocess.ps1

$baseUrl = "http://localhost:3000"

# Step 1: Check current state
Write-Host "=== Step 1: Current document state ===" -ForegroundColor Cyan
$docs = Invoke-RestMethod -Uri "$baseUrl/api/knowledge/documents" -Method GET
foreach ($d in $docs.documents) {
    Write-Host "  $($d.id) | $($d.title) | chunks=$($d.chunk_count) | storage='$($d.storage_path)'" -ForegroundColor $(if($d.storage_path) {"Yellow"} else {"Red"})
}

# Step 2: Find docs with 0 chunks AND storage_path empty - mark for delete & re-upload
Write-Host "`n=== Step 2: Checking which docs need reprocessing ===" -ForegroundColor Cyan
$toReprocess = $docs.documents | Where-Object { $_.chunk_count -eq 0 -and $_.storage_path }
$noStorage    = $docs.documents | Where-Object { $_.chunk_count -eq 0 -and (-not $_.storage_path) }

Write-Host "  Has storage_path, needs chunking: $($toReprocess.Count)" -ForegroundColor Yellow
Write-Host "  No storage_path (need re-upload): $($noStorage.Count)" -ForegroundColor Red

# Step 3: Try to reprocess docs that DO have storage_path
if ($toReprocess.Count -gt 0) {
    Write-Host "`n=== Step 3: Reprocessing docs with storage_path ===" -ForegroundColor Cyan
    foreach ($d in $toReprocess) {
        Write-Host "  Processing: $($d.title)..." -ForegroundColor Yellow
        $body = @{
            document_id  = $d.id
            storage_path = $d.storage_path
            file_type    = "pdf"
        } | ConvertTo-Json
        try {
            $r = Invoke-RestMethod -Uri "$baseUrl/api/knowledge/process" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 180
            Write-Host "  OK: $($r.chunks_created) chunks created" -ForegroundColor Green
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $errBody = $reader.ReadToEnd()
                Write-Host "  ERROR $statusCode : $errBody" -ForegroundColor Red
            } catch {
                Write-Host "  ERROR $statusCode" -ForegroundColor Red
            }
        }
    }
}

# Step 4: Report
Write-Host "`n=== Final State ===" -ForegroundColor Cyan
$verify = Invoke-RestMethod -Uri "$baseUrl/api/knowledge/documents" -Method GET
$total = 0
foreach ($d in $verify.documents) {
    $total += $d.chunk_count
    $col = if ($d.chunk_count -gt 0) { "Green" } else { "Red" }
    Write-Host "  $($d.title): $($d.chunk_count) chunks | storage='$($d.storage_path)'" -ForegroundColor $col
}
Write-Host "`nTotal chunks: $total" -ForegroundColor $(if($total -gt 0){"Green"}else{"Red"})
if ($total -eq 0) {
    Write-Host "`nACTION REQUIRED: All documents have no storage_path." -ForegroundColor Red
    Write-Host "Please delete the existing records and re-upload the PDFs via the Admin panel." -ForegroundColor Red
    Write-Host "The PDF files are located in: data/legal-documents/" -ForegroundColor Yellow
}
