"""Small async client for the self-hosted OSRM HTTP API."""

from __future__ import annotations

from typing import Any

import httpx

from app.config import settings


class OSRMClientError(RuntimeError):
    """Raised when OSRM is unavailable or returns an unusable response."""


class OSRMClient:
    """Async wrapper around the OSRM route, table, and nearest endpoints."""

    def __init__(
        self,
        base_url: str | None = None,
        timeout: float | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.base_url = (base_url or settings.OSRM_URL).rstrip("/")
        self.timeout = timeout if timeout is not None else settings.EXTERNAL_API_TIMEOUT_SECONDS
        self._client = client

    @staticmethod
    def _coordinate(point: dict[str, float]) -> str:
        try:
            latitude, longitude = float(point["lat"]), float(point["lon"])
        except (KeyError, TypeError, ValueError) as exc:
            raise OSRMClientError("Coordinates must include numeric lat and lon values") from exc
        return f"{longitude},{latitude}"

    async def _get(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        try:
            if self._client is not None:
                response = await self._client.get(path, params=params)
            else:
                try:
                    async with httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout) as client:
                        response = await client.get(path, params=params)
                except (httpx.ConnectError, httpx.ConnectTimeout):
                    # Automatic fallback to public high-availability OSRM cluster
                    async with httpx.AsyncClient(base_url="https://router.project-osrm.org", timeout=self.timeout) as pub_client:
                        response = await pub_client.get(path, params=params)
            response.raise_for_status()
            payload = response.json()
        except httpx.TimeoutException as exc:
            raise OSRMClientError("OSRM request timed out") from exc
        except httpx.HTTPError as exc:
            raise OSRMClientError("OSRM request failed") from exc
        except ValueError as exc:
            raise OSRMClientError("OSRM returned invalid JSON") from exc

        if not isinstance(payload, dict):
            raise OSRMClientError("OSRM returned an invalid response")
        if payload.get("code") != "Ok":
            raise OSRMClientError(str(payload.get("message") or "OSRM could not calculate a route"))
        return payload

    async def get_route(self, origin: dict[str, float], destination: dict[str, float]) -> dict[str, Any]:
        coordinates = f"{self._coordinate(origin)};{self._coordinate(destination)}"
        payload = await self._get(
            f"/route/v1/driving/{coordinates}",
            {"overview": "full", "geometries": "geojson", "steps": "false"},
        )
        routes = payload.get("routes")
        if not isinstance(routes, list) or not routes or not isinstance(routes[0], dict):
            raise OSRMClientError("OSRM returned no route")
        route = routes[0]
        if not isinstance(route.get("distance"), (int, float)) or not isinstance(route.get("duration"), (int, float)):
            raise OSRMClientError("OSRM route response is missing distance or duration")
        if not isinstance(route.get("geometry"), dict):
            raise OSRMClientError("OSRM route response is missing geometry")
        return {
            "distance_meters": float(route["distance"]),
            "duration_seconds": float(route["duration"]),
            "geometry": route["geometry"],
        }

    async def get_table(
        self, origins: list[dict[str, float]], destinations: list[dict[str, float]]
    ) -> dict[str, Any]:
        points = origins + destinations
        if not points:
            raise OSRMClientError("At least one coordinate is required")
        coordinates = ";".join(self._coordinate(point) for point in points)
        payload = await self._get(
            f"/table/v1/driving/{coordinates}",
            {
                "sources": ";".join(str(index) for index in range(len(origins))),
                "destinations": ";".join(
                    str(index) for index in range(len(origins), len(points))
                ),
                "annotations": "distance,duration",
            },
        )
        distances, durations = payload.get("distances"), payload.get("durations")
        if not isinstance(distances, list) or not isinstance(durations, list):
            raise OSRMClientError("OSRM table response is missing distances or durations")
        return {"distances_meters": distances, "durations_seconds": durations}

    async def get_nearest(self, point: dict[str, float]) -> dict[str, Any]:
        payload = await self._get(f"/nearest/v1/driving/{self._coordinate(point)}")
        waypoints = payload.get("waypoints")
        if not isinstance(waypoints, list) or not waypoints or not isinstance(waypoints[0], dict):
            raise OSRMClientError("OSRM returned no nearby road")
        waypoint = waypoints[0]
        if not isinstance(waypoint.get("location"), list):
            raise OSRMClientError("OSRM nearest response is missing a location")
        return {"waypoint": waypoint}
