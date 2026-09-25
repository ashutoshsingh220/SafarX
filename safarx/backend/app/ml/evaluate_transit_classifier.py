"""Run and print comprehensive Machine Learning evaluation for the Transit Classifier."""

import json
from app.ml.transit_route_classifier import train_transit_classifier, CLASS_NAMES


def main():
    print("=" * 65)
    print("TRAINING & EVALUATING SMARTTRIP ML TRANSIT CLASSIFIER")
    print("=" * 65)

    metrics = train_transit_classifier()

    print(f"\nEVALUATION METRICS OVERVIEW (Test Split = {metrics['test_size']} samples):")
    print(f"  * Overall Accuracy : {metrics['accuracy'] * 100:.2f}%")
    print(f"  * Macro F1-Score   : {metrics['macro_f1']:.4f}")
    print(f"  * Weighted F1-Score: {metrics['weighted_f1']:.4f}")
    print(f"  * Macro Precision  : {metrics['macro_precision']:.4f}")
    print(f"  * Macro Recall     : {metrics['macro_recall']:.4f}")

    print("\nPER-CLASS CLASSIFICATION REPORT:")
    rep = metrics["class_report"]
    for cname in CLASS_NAMES:
        cdata = rep[cname]
        print(f"  [{cname}] -> Precision: {cdata['precision']:.3f} | Recall: {cdata['recall']:.3f} | F1: {cdata['f1-score']:.3f} (Support: {cdata['support']})")

    print("\nCONFUSION MATRIX:")
    cm = metrics["confusion_matrix"]
    print("        Pred: Direct   Gateway   Feeder")
    for idx, row in enumerate(cm):
        print(f"  Act {CLASS_NAMES[idx][:6]:<6}: {row[0]:<8} {row[1]:<9} {row[2]:<8}")

    print("\nTOP FEATURE IMPORTANCES:")
    feat_names = [
        "feeder_dist_origin", "feeder_dist_dest", "hub_pair_distance",
        "origin_hub_tier", "dest_hub_tier", "direct_connectivity",
        "circuitous_detour", "feeder_dominance", "mountain_terrain", "intra_metro"
    ]
    ranked = sorted(zip(feat_names, metrics["feature_importances"]), key=lambda x: x[1], reverse=True)
    for name, imp in ranked:
        bar = "#" * int(imp * 40)
        print(f"  * {name:<20}: {imp:.4f} {bar}")

    print("\n[SUCCESS] Model serialized to app/ml/artifacts/transit_route_classifier.pkl")
    print("[SUCCESS] Metrics saved to app/ml/artifacts/transit_classifier_metrics.json")
    print("=" * 65)


if __name__ == "__main__":
    main()
