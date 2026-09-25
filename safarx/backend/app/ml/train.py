"""Train every local SmartTrip ML artifact."""

from app.ml.models import train_all


def main() -> None:
    for path in train_all():
        print(f"Created {path}")


if __name__ == "__main__":
    main()
