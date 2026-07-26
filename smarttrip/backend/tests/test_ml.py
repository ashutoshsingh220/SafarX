from pathlib import Path

from app.ml.models import predict_demand, predict_eta, rank_options, train_all


def test_training_creates_all_artifacts(tmp_path: Path) -> None:
    artifacts = train_all(tmp_path)

    assert len(artifacts) == 3
    assert all(path.exists() for path in artifacts)


def test_eta_prediction_is_positive_and_uses_xgboost_artifact(tmp_path: Path) -> None:
    eta = predict_eta(distance_km=12, hour_of_day=18, traffic_level=0.8, artifact_dir=tmp_path)

    assert eta >= 5
    assert (tmp_path / "eta_xgboost.pkl").exists()


def test_demand_prediction_returns_a_valid_level(tmp_path: Path) -> None:
    result = predict_demand(18.5492, 73.7431, artifact_dir=tmp_path)

    assert result["demand_level"] in {"low", "medium", "high"}
    assert int(result["cluster_size"]) > 0


def test_ranker_prefers_cheaper_faster_and_more_comfortable_option(tmp_path: Path) -> None:
    rankings = rank_options(
        [
            {"fare": 2_000.0, "duration_hours": 13.0, "transfers": 2, "comfort_score": 2.0},
            {"fare": 1_500.0, "duration_hours": 11.0, "transfers": 0, "comfort_score": 4.5},
        ],
        artifact_dir=tmp_path,
    )

    assert rankings[0]["option_index"] == 1
