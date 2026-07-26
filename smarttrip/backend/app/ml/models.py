"""Small deterministic ML models used by SmartTrip's mock-safe local demo."""

from __future__ import annotations

import pickle
from pathlib import Path
from typing import Iterable

import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
DEMAND_ARTIFACT = "demand_kmeans.pkl"
ETA_ARTIFACT = "eta_xgboost.pkl"
RANKER_ARTIFACT = "journey_ranker.pkl"


def _artifact_path(name: str, artifact_dir: Path | None = None) -> Path:
    directory = artifact_dir or ARTIFACT_DIR
    directory.mkdir(parents=True, exist_ok=True)
    return directory / name


def train_demand_model(artifact_dir: Path | None = None) -> Path:
    """Train a reproducible KMeans model using representative Pune demand areas."""
    generator = np.random.default_rng(42)
    centers = np.array(
        [
            [18.5492, 73.7431],  # Susgaon: highest observed feeder demand
            [18.5987, 73.7628],  # Wakad
            [18.5204, 73.8567],  # Pune centre
        ]
    )
    sample_sizes = [90, 55, 35]
    samples = np.vstack(
        [
            center + generator.normal(0, 0.003, size=(sample_size, 2))
            for center, sample_size in zip(centers, sample_sizes, strict=True)
        ]
    )
    model = KMeans(n_clusters=3, random_state=42, n_init=20)
    labels = model.fit_predict(samples)
    cluster_sizes = np.bincount(labels, minlength=3).tolist()
    path = _artifact_path(DEMAND_ARTIFACT, artifact_dir)
    with path.open("wb") as file:
        pickle.dump({"model": model, "cluster_sizes": cluster_sizes}, file)
    return path


def predict_demand(lat: float, lon: float, artifact_dir: Path | None = None) -> dict[str, int | str | float]:
    path = _artifact_path(DEMAND_ARTIFACT, artifact_dir)
    if not path.exists():
        train_demand_model(artifact_dir)
    with path.open("rb") as file:
        payload = pickle.load(file)
    cluster = int(payload["model"].predict([[lat, lon]])[0])
    cluster_size = int(payload["cluster_sizes"][cluster])
    max_size = max(payload["cluster_sizes"])
    demand_level = "high" if cluster_size == max_size else "medium" if cluster_size >= max_size * 0.55 else "low"
    return {"cluster_id": cluster, "cluster_size": cluster_size, "demand_level": demand_level}


def train_eta_model(artifact_dir: Path | None = None) -> Path:
    """Train an XGBoost ETA regressor on deterministic synthetic route observations."""
    generator = np.random.default_rng(42)
    distance_km = generator.uniform(1, 45, 400)
    hour = generator.integers(0, 24, 400)
    traffic = generator.uniform(0, 1, 400)
    peak_multiplier = np.where(((hour >= 8) & (hour <= 10)) | ((hour >= 17) & (hour <= 20)), 1.35, 1.0)
    eta_minutes = np.maximum(5, distance_km * 2.1 * peak_multiplier * (1 + traffic * 0.45) + generator.normal(0, 2, 400))
    features = np.column_stack([distance_km, hour, traffic])
    model = XGBRegressor(
        n_estimators=80,
        max_depth=4,
        learning_rate=0.08,
        objective="reg:squarederror",
        random_state=42,
        n_jobs=1,
    )
    model.fit(features, eta_minutes)
    path = _artifact_path(ETA_ARTIFACT, artifact_dir)
    with path.open("wb") as file:
        pickle.dump(model, file)
    return path


def predict_eta(
    distance_km: float, hour_of_day: int, traffic_level: float = 0.5, artifact_dir: Path | None = None
) -> float:
    if distance_km <= 0:
        raise ValueError("distance_km must be greater than zero")
    if not 0 <= hour_of_day <= 23:
        raise ValueError("hour_of_day must be between 0 and 23")
    if not 0 <= traffic_level <= 1:
        raise ValueError("traffic_level must be between 0 and 1")
    path = _artifact_path(ETA_ARTIFACT, artifact_dir)
    if not path.exists():
        train_eta_model(artifact_dir)
    with path.open("rb") as file:
        model = pickle.load(file)
    return round(max(5.0, float(model.predict([[distance_km, hour_of_day, traffic_level]])[0])), 1)


def train_option_ranker(artifact_dir: Path | None = None) -> Path:
    """Train a transparent synthetic option ranker for the demo environment."""
    generator = np.random.default_rng(7)
    fare = generator.uniform(400, 5_000, 600)
    duration_hours = generator.uniform(1, 18, 600)
    transfers = generator.integers(0, 4, 600)
    comfort_score = generator.uniform(1, 5, 600)
    target = 100 - fare / 85 - duration_hours * 2.8 - transfers * 9 + comfort_score * 7
    target += generator.normal(0, 1.5, 600)
    features = np.column_stack([fare, duration_hours, transfers, comfort_score])
    model = RandomForestRegressor(n_estimators=120, max_depth=8, random_state=7, n_jobs=1)
    model.fit(features, target)
    path = _artifact_path(RANKER_ARTIFACT, artifact_dir)
    with path.open("wb") as file:
        pickle.dump(model, file)
    return path


def rank_options(options: Iterable[dict[str, float | int]], artifact_dir: Path | None = None) -> list[dict[str, float | int]]:
    option_list = list(options)
    if not option_list:
        return []
    path = _artifact_path(RANKER_ARTIFACT, artifact_dir)
    if not path.exists():
        train_option_ranker(artifact_dir)
    with path.open("rb") as file:
        model = pickle.load(file)
    features = [
        [item["fare"], item["duration_hours"], item["transfers"], item["comfort_score"]]
        for item in option_list
    ]
    scores = model.predict(features)
    ranked = [
        {"option_index": index, "score": round(float(score), 2)}
        for index, score in enumerate(scores)
    ]
    return sorted(ranked, key=lambda item: float(item["score"]), reverse=True)


def train_all(artifact_dir: Path | None = None) -> list[Path]:
    return [
        train_demand_model(artifact_dir),
        train_eta_model(artifact_dir),
        train_option_ranker(artifact_dir),
    ]
