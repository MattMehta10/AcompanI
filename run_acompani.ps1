Write-Host "Starting AcompanI — Hierarchical Multi-Agent Organization Studio..." -ForegroundColor Cyan
Set-Location $PSScriptRoot

if (-Not (Test-Path ".\.venv\Scripts\uvicorn.exe")) {
    Write-Host "Virtual environment not found. Run: uv venv --python 3.12 .venv && uv pip install -r requirements.txt" -ForegroundColor Red
    exit 1
}

Write-Host "Opening http://127.0.0.1:8000 (Swagger docs at /docs)" -ForegroundColor Green
Start-Process "http://127.0.0.1:8000"
.\.venv\Scripts\uvicorn.exe api.main:app --host 127.0.0.1 --port 8000 --reload

