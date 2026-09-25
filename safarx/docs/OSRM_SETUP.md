# Self-hosted OSRM setup

SmartTrip AI uses [OSRM](https://project-osrm.org/) for optional real road routing. It is disabled by default, so the existing local mock distance and ETA calculation keeps working.

## 1. Download the India map extract

Download the current India `.osm.pbf` extract from [Geofabrik's India page](https://download.geofabrik.de/asia/india.html). Place it in `smarttrip/backend/data/` and name it exactly:

```text
india-latest.osm.pbf
```

The repository currently has a dated source file in that folder. Rename or download a copy as `india-latest.osm.pbf` before running the setup script.

## 2. Prepare OSRM artifacts

From the `smarttrip` directory, with Docker Desktop running:

```powershell
.\scripts\setup_osrm.ps1
```

On macOS or Linux:

```sh
chmod +x scripts/setup_osrm.sh
./scripts/setup_osrm.sh
```

The first preparation can require substantial disk space and time because India is a large map extract.

## 3. Start services

```powershell
docker compose up -d --build
```

Verify that OSRM is responding in a browser or terminal:

```text
http://localhost:5000/route/v1/driving/73.7431,18.5492;73.7628,18.5987?overview=false
```

## 4. Enable OSRM in the API

In your untracked `backend/.env`, set:

```env
USE_REAL_OSRM=true
```

Docker Compose already supplies `OSRM_URL=http://osrm:5000` to the API container. For a backend running directly on your computer, use `OSRM_URL=http://localhost:5000`.

## 5. Test the SmartTrip endpoints

After the API is running, open `http://localhost:8000/docs` or run:

```powershell
$body = @{ origin = @{ lat = 18.5492; lon = 73.7431 }; destination = @{ lat = 18.5987; lon = 73.7628 } } | ConvertTo-Json -Depth 3
Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/v1/route -ContentType application/json -Body $body
```

For a matrix, call `POST /api/v1/route/table`; for a snapped road point, call `POST /api/v1/route/nearest` with `{ "location": { "lat": 18.5492, "lon": 73.7431 } }`.
