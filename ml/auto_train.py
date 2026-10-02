"""
Master Automated Dataset Builder & End-to-End Model Trainer.
Executes the full automated workflow:
1. Generates expanded 15-class ISL dataset with multi-signer variations & raw videos
2. Trains the temporal sequence deep learning model
3. Evaluates held-out performance metrics (Accuracy, F1, Confusion Matrix)
4. Exports updated model artifacts (labels, weights, config)
"""

import os
import sys
import time

from ml.dataset.auto_dataset_builder import generate_expanded_dataset, EXPANDED_ISL_SIGNS
from ml.training.train import train_model
from ml.evaluation.evaluate import evaluate_isl_model
from ml.inference.realtime import ISLInferenceService


def run_automated_pipeline(samples_per_class=50, epochs=30, generate_videos=True):
    print("=" * 65)
    print("AI-POWERED MULTIMODAL ISL ASSISTANT: AUTOMATED PIPELINE")
    print("=" * 65)
    start_time = time.time()

    # Step 1: Automated Dataset Generation
    print("\n>>> STEP 1: Building Expanded 15-Class Multimodal Dataset...")
    generate_expanded_dataset(
        processed_dir="ml/dataset/processed",
        raw_dir="ml/dataset/raw",
        samples_per_class=samples_per_class,
        generate_videos=generate_videos,
        signs=EXPANDED_ISL_SIGNS
    )

    # Step 2: Model Training
    print("\n>>> STEP 2: Training Temporal Deep Learning Sequence Model...")
    model, config = train_model(
        data_dir="ml/dataset/processed",
        output_dir="ml/models",
        epochs=epochs
    )

    # Step 3: Model Evaluation
    print("\n>>> STEP 3: Evaluating Held-Out Performance Metrics...")
    results = evaluate_isl_model(
        model_path="ml/models/isl_bilstm_model.keras",
        labels_path="ml/models/isl_labels.json",
        results_dir="ml/evaluation/results"
    )

    # Step 4: Verify Live Real-Time Inference Engine
    print("\n>>> STEP 4: Validating Real-Time Inference Service...")
    service = ISLInferenceService()
    service.load_model()
    status = service.get_status()

    elapsed = time.time() - start_time
    print("\n" + "=" * 65)
    print("PIPELINE EXECUTION SUMMARY")
    print("=" * 65)
    print(f"Elapsed Time:         {elapsed:.2f} seconds")
    print(f"Total Signs Trained:  {len(status['classes'])} classes")
    print(f"Vocabulary:           {', '.join(status['classes'])}")
    print(f"Model Status:         {status['status_message']}")
    if results and "overall" in results:
        print(f"Test Accuracy:        {results['overall']['accuracy'] * 100:.2f}%")
        print(f"Macro F1-Score:       {results['overall']['f1_macro']:.4f}")
    print("=" * 65)
    print("[Success] Model is fully trained, evaluated, and ready for live inference!\n")


if __name__ == "__main__":
    run_automated_pipeline()
