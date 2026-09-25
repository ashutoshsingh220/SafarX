#!/usr/bin/env sh
set -eu

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
DATA_DIRECTORY="$PROJECT_ROOT/backend/data"
SOURCE_FILE="$DATA_DIRECTORY/india-latest.osm.pbf"

echo "SmartTrip AI: preparing OSRM India routing data..."
if [ ! -f "$SOURCE_FILE" ]; then
  echo "Missing $SOURCE_FILE. Download the India PBF, name it india-latest.osm.pbf, and place it in backend/data. See docs/OSRM_SETUP.md." >&2
  exit 1
fi

echo "1/3 Extracting road graph (this can take a while)..."
docker run --rm -t -v "$DATA_DIRECTORY:/data" osrm/osrm-backend:latest osrm-extract -p /opt/car.lua /data/india-latest.osm.pbf
echo "2/3 Partitioning graph for MLD..."
docker run --rm -t -v "$DATA_DIRECTORY:/data" osrm/osrm-backend:latest osrm-partition /data/india-latest.osrm
echo "3/3 Customizing routing data..."
docker run --rm -t -v "$DATA_DIRECTORY:/data" osrm/osrm-backend:latest osrm-customize /data/india-latest.osrm
echo "OSRM data is ready. Start it with: docker compose up -d osrm"
