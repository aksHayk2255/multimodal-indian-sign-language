"""
ISL Model Evaluation and Performance Metrics Suite.
Evaluates the trained temporal sequence model on held-out test data,
calculates classification metrics (Precision, Recall, F1, Accuracy, Confusion Matrix),
and exports detailed evaluation summaries to JSON and text reports.
"""

import os
import json
import argparse
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report
)


def evaluate_isl_model(
    model_path="ml/models/isl_bilstm_model.keras",
    labels_path="ml/models/isl_labels.json",
    test_x_path="ml/models/test_X.npy",
    test_y_path="ml/models/test_y.npy",
    results_dir="ml/evaluation/results"
):
    """
    Evaluates the model on the saved test set.
    """
    joblib_path = model_path.replace(".keras", ".joblib").replace("isl_bilstm_model", "isl_sequence_model")

    target_file = None
    framework = None
    if os.path.exists(model_path):
        target_file = model_path
        framework = "keras"
    elif os.path.exists(joblib_path):
        target_file = joblib_path
        framework = "sklearn"
    else:
        print(f"[Error] Neither {model_path} nor {joblib_path} found. Train the model first.")
        return None

    if not os.path.exists(labels_path):
        print(f"[Error] Labels map not found at {labels_path}.")
        return None

    print(f"Loading model ({framework}) from {target_file}...")
    if framework == "keras":
        import tensorflow as tf
        model = tf.keras.models.load_model(target_file)
    else:
        import joblib
        model = joblib.load(target_file)

    with open(labels_path, "r", encoding="utf-8") as f:
        labels_map = json.load(f)
    classes = [labels_map[str(i)] if str(i) in labels_map else labels_map[i] for i in range(len(labels_map))]

    # Load test data
    if not (os.path.exists(test_x_path) and os.path.exists(test_y_path)):
        print(f"[Warning] Test set files ({test_x_path}) not found. Loading from processed dataset...")
        from ml.training.train import load_dataset
        from sklearn.model_selection import train_test_split
        from sklearn.preprocessing import LabelBinarizer

        X, y, _ = load_dataset()
        lb = LabelBinarizer()
        lb.fit(classes)
        y_enc = lb.transform(y)
        _, X_test, _, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42, stratify=y)
    else:
        X_test = np.load(test_x_path)
        y_test = np.load(test_y_path)

    print(f"Evaluating on {len(X_test)} test samples across {len(classes)} classes...")

    # Predict
    if framework == "keras":
        y_pred_probs = model.predict(X_test, verbose=0)
        y_pred_indices = np.argmax(y_pred_probs, axis=1)
    else:
        X_test_flat = X_test.reshape(X_test.shape[0], -1)
        y_pred_indices = model.predict(X_test_flat)

    if y_test.ndim > 1:
        y_true_indices = np.argmax(y_test, axis=1)
    else:
        y_true_indices = y_test

    # Compute metrics
    acc = accuracy_score(y_true_indices, y_pred_indices)
    prec_macro, rec_macro, f1_macro, _ = precision_recall_fscore_support(
        y_true_indices, y_pred_indices, labels=classes, average='macro', zero_division=0
    )
    prec_weighted, rec_weighted, f1_weighted, _ = precision_recall_fscore_support(
        y_true_indices, y_pred_indices, labels=classes, average='weighted', zero_division=0
    )

    per_class_prec, per_class_rec, per_class_f1, per_class_supp = precision_recall_fscore_support(
        y_true_indices, y_pred_indices, labels=classes, average=None, zero_division=0
    )

    cm = confusion_matrix(y_true_indices, y_pred_indices, labels=classes).tolist()
    report_text = classification_report(
        y_true_indices, y_pred_indices, labels=classes, target_names=classes, zero_division=0
    )

    per_class_metrics = {}
    for idx, name in enumerate(classes):
        per_class_metrics[name] = {
            "precision": float(per_class_prec[idx]) if idx < len(per_class_prec) else 0.0,
            "recall": float(per_class_rec[idx]) if idx < len(per_class_rec) else 0.0,
            "f1_score": float(per_class_f1[idx]) if idx < len(per_class_f1) else 0.0,
            "support": int(per_class_supp[idx]) if idx < len(per_class_supp) else 0
        }

    results = {
        "overall": {
            "accuracy": float(acc),
            "precision_macro": float(prec_macro),
            "recall_macro": float(rec_macro),
            "f1_macro": float(f1_macro),
            "precision_weighted": float(prec_weighted),
            "recall_weighted": float(rec_weighted),
            "f1_weighted": float(f1_weighted),
            "total_test_samples": int(len(X_test))
        },
        "per_class": per_class_metrics,
        "confusion_matrix": cm,
        "classes": classes
    }

    # Save results
    os.makedirs(results_dir, exist_ok=True)
    results_path = os.path.join(results_dir, "evaluation_metrics.json")
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    report_path = os.path.join(results_dir, "classification_report.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("=== ISL TEMPORAL SEQUENCE MODEL CLASSIFICATION REPORT ===\n\n")
        f.write(report_text)
        f.write("\n\n=== CONFUSION MATRIX ===\n")
        f.write(np.array2string(np.array(cm)))

    print("\n" + "="*50)
    print("ISL MODEL EVALUATION SUMMARY")
    print("="*50)
    print(f"Overall Accuracy:       {acc * 100:.2f}%")
    print(f"Macro F1-Score:         {f1_macro:.4f}")
    print(f"Weighted F1-Score:      {f1_weighted:.4f}")
    print("\n" + report_text)
    print(f"[Done] Metrics saved to {results_path}")
    return results


def main():
    parser = argparse.ArgumentParser(description="Evaluate trained ISL model")
    parser.add_argument("--model", type=str, default="ml/models/isl_bilstm_model.keras")
    parser.add_argument("--labels", type=str, default="ml/models/isl_labels.json")
    parser.add_argument("--results_dir", type=str, default="ml/evaluation/results")
    args = parser.parse_args()

    evaluate_isl_model(
        model_path=args.model,
        labels_path=args.labels,
        results_dir=args.results_dir
    )


if __name__ == "__main__":
    main()
