[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$dataDirectory = Join-Path $projectRoot "backend\data"
$sourceFile = Join-Path $dataDirectory "india-latest.osm.pbf"

Write-Host "SmartTrip AI: preparing OSRM India routing data..." -ForegroundColor Cyan
if (-not (Test-Path -LiteralPath $sourceFile -PathType Leaf)) {
    Write-Error "Missing $sourceFile. Download the India PBF, name it india-latest.osm.pbf, and place it in backend/data. See docs/OSRM_SETUP.md."
    exit 1
}

$resolvedDataDirectory = (Resolve-Path -LiteralPath $dataDirectory).Path
Write-Host "1/3 Extracting road graph (this can take a while)..." -ForegroundColor Yellow
docker run --rm -t --mount "type=bind,src=$resolvedDataDirectory,dst=/data" osrm/osrm-backend:latest osrm-extract -p /opt/car.lua /data/india-latest.osm.pbf
Write-Host "2/3 Partitioning graph for MLD..." -ForegroundColor Yellow
docker run --rm -t --mount "type=bind,src=$resolvedDataDirectory,dst=/data" osrm/osrm-backend:latest osrm-partition /data/india-latest.osrm
Write-Host "3/3 Customizing routing data..." -ForegroundColor Yellow
docker run --rm -t --mount "type=bind,src=$resolvedDataDirectory,dst=/data" osrm/osrm-backend:latest osrm-customize /data/india-latest.osrm
Write-Host "OSRM data is ready. Start it with: docker compose up -d osrm" -ForegroundColor Green
