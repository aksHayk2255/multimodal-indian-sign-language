"""
Dataset Generator and Reference Sequence Synthesizer for ISL.
Provides structured biomechanical trajectory generators for standard ISL vocabulary:
['HELLO', 'THANK YOU', 'YES', 'NO', 'PLEASE', 'HELP', 'GOODBYE', 'HOW ARE YOU']
Generates reproducible, realistic temporal landmark sequences (225 features x 30 frames)
with physiological noise, scale jitter, and temporal shifts.
"""

import os
import json
import argparse
import numpy as np

from ml.preprocessing.normalizer import (
    TOTAL_FEATURE_DIM,
    POSE_FEATURE_DIM,
    HAND_FEATURE_DIM,
    DEFAULT_SEQUENCE_LENGTH
)

DEFAULT_ISL_SIGNS = [
    "HELLO",
    "THANK YOU",
    "YES",
    "NO",
    "PLEASE",
    "HELP",
    "GOODBYE",
    "HOW ARE YOU"
]


def generate_sign_trajectory(sign_name, sequence_length=30, noise_level=0.03):
    """
    Synthesizes a realistic 30-frame temporal landmark trajectory
    based on the physical kinematics of the corresponding ISL sign.
    Returns: array of shape (sequence_length, 189)
    """
    from ml.dataset.auto_dataset_builder import synthesize_sign_sample
    frames = [synthesize_sign_sample(sign_name, sample_idx=i) for i in range(sequence_length)]
    return np.array(frames, dtype=np.float32)

    # Base pose: Shoulders at (-0.2, 0.5) and (0.2, 0.5)
    left_shoulder_idx = 11 * 3
    right_shoulder_idx = 12 * 3
    left_elbow_idx = 13 * 3
    right_elbow_idx = 14 * 3
    left_wrist_idx = 15 * 3
    right_wrist_idx = 16 * 3

    features[:, left_shoulder_idx] = -0.2
    features[:, left_shoulder_idx + 1] = 0.5
    features[:, right_shoulder_idx] = 0.2
    features[:, right_shoulder_idx + 1] = 0.5

    # Head / Nose at (0, 0.8)
    features[:, 0] = 0.0
    features[:, 1] = 0.8

    # Kinematics for each sign:
    rh_offset = POSE_FEATURE_DIM + HAND_FEATURE_DIM  # index 162
    lh_offset = POSE_FEATURE_DIM  # index 99

    if sign_name == "HELLO":
        # Right hand waves near temple: raises up to (0.35, 0.8), oscillates horizontally
        wave = 0.08 * np.sin(4 * np.pi * t)
        features[:, right_wrist_idx] = 0.35 + wave
        features[:, right_wrist_idx + 1] = 0.75 + 0.1 * np.sin(np.pi * t)
        # Right hand active
        features[:, rh_offset:rh_offset + HAND_FEATURE_DIM] = 0.4 + wave[:, None] * 0.5

    elif sign_name == "THANK YOU":
        # Hand moves from chin/mouth forward towards camera
        forward_arc = np.sin(np.pi * t)
        features[:, right_wrist_idx] = 0.05
        features[:, right_wrist_idx + 1] = 0.7 - 0.35 * t
        features[:, right_wrist_idx + 2] = -0.2 * forward_arc
        features[:, rh_offset:rh_offset + HAND_FEATURE_DIM] = 0.2 + forward_arc[:, None] * 0.3

    elif sign_name == "YES":
        # Fist nodding up and down like a head nod
        nod = 0.12 * np.cos(3 * np.pi * t)
        features[:, right_wrist_idx] = 0.25
        features[:, right_wrist_idx + 1] = 0.4 + nod
        features[:, rh_offset:rh_offset + HAND_FEATURE_DIM] = 0.1 + nod[:, None]

    elif sign_name == "NO":
        # Index and middle finger tap thumb sideways (horizontal oscillation)
        tap = 0.1 * np.sin(5 * np.pi * t)
        features[:, right_wrist_idx] = 0.2 + tap
        features[:, right_wrist_idx + 1] = 0.45
        features[:, rh_offset:rh_offset + HAND_FEATURE_DIM] = 0.3 + tap[:, None]

    elif sign_name == "PLEASE":
        # Open right hand rubs circular motion over the chest
        circle_x = 0.12 * np.cos(2 * np.pi * t)
        circle_y = 0.12 * np.sin(2 * np.pi * t)
        features[:, right_wrist_idx] = circle_x
        features[:, right_wrist_idx + 1] = 0.45 + circle_y
        features[:, rh_offset:rh_offset + HAND_FEATURE_DIM] = 0.25 + circle_x[:, None]

    elif sign_name == "HELP":
        # Left palm flat facing up, Right fist placed on top moving upwards together
        rise = 0.25 * t
        features[:, left_wrist_idx] = -0.05
        features[:, left_wrist_idx + 1] = 0.3 + rise
        features[:, right_wrist_idx] = 0.05
        features[:, right_wrist_idx + 1] = 0.35 + rise
        features[:, lh_offset:lh_offset + HAND_FEATURE_DIM] = 0.2 + rise[:, None]
        features[:, rh_offset:rh_offset + HAND_FEATURE_DIM] = 0.3 + rise[:, None]

    elif sign_name == "GOODBYE":
        # Open hand waving side to side while retracting
        wave = 0.15 * np.sin(6 * np.pi * t)
        features[:, right_wrist_idx] = 0.3 + wave
        features[:, right_wrist_idx + 1] = 0.65 - 0.2 * t
        features[:, rh_offset:rh_offset + HAND_FEATURE_DIM] = 0.35 + wave[:, None]

    elif sign_name == "HOW ARE YOU":
        # Both hands move outward from chest with open palms facing upward
        spread = 0.2 * t
        features[:, left_wrist_idx] = -0.15 - spread
        features[:, left_wrist_idx + 1] = 0.4
        features[:, right_wrist_idx] = 0.15 + spread
        features[:, right_wrist_idx + 1] = 0.4
        features[:, lh_offset:lh_offset + HAND_FEATURE_DIM] = 0.3 + spread[:, None]
        features[:, rh_offset:rh_offset + HAND_FEATURE_DIM] = 0.3 + spread[:, None]

    else:
        # Generic motion
        features[:, right_wrist_idx] = 0.2 + 0.1 * np.sin(2 * np.pi * t)
        features[:, right_wrist_idx + 1] = 0.5 + 0.1 * np.cos(2 * np.pi * t)

    # Add realistic Gaussian noise and scale variations
    jitter = np.random.normal(0, noise_level, features.shape).astype(np.float32)
    features += jitter

    return features


def generate_sample_dataset(
    output_dir="ml/dataset/processed",
    samples_per_class=60,
    signs=DEFAULT_ISL_SIGNS,
    sequence_length=DEFAULT_SEQUENCE_LENGTH
):
    """
    Generates a full synthesized dataset for initial training and validation.
    Outputs .npy files per sign class and saves labels.json.
    """
    os.makedirs(output_dir, exist_ok=True)
    labels_map = {idx: sign for idx, sign in enumerate(signs)}

    total_samples = 0
    print(f"Generating dataset for {len(signs)} signs ({samples_per_class} samples each)...")

    for idx, sign in enumerate(signs):
        sign_dir = os.path.join(output_dir, sign)
        os.makedirs(sign_dir, exist_ok=True)

        for s in range(samples_per_class):
            # Vary noise and timing speed
            noise = np.random.uniform(0.015, 0.045)
            seq = generate_sign_trajectory(sign, sequence_length=sequence_length, noise_level=noise)
            sample_path = os.path.join(sign_dir, f"sample_{s:04d}.npy")
            np.save(sample_path, seq)
            total_samples += 1

    labels_path = os.path.join(output_dir, "labels.json")
    with open(labels_path, "w", encoding="utf-8") as f:
        json.dump(labels_map, f, indent=2)

    print(f"[Done] Generated {total_samples} samples across {len(signs)} classes in {output_dir}")
    print(f"Saved labels map to {labels_path}")
    return labels_map


def main():
    parser = argparse.ArgumentParser(description="Generate ISL benchmark sample dataset")
    parser.add_argument("--output_dir", type=str, default="ml/dataset/processed", help="Path to save processed sequences")
    parser.add_argument("--samples", type=int, default=60, help="Number of samples per class")
    parser.add_argument("--seq_len", type=int, default=DEFAULT_SEQUENCE_LENGTH, help="Sequence length")
    args = parser.parse_args()

    generate_sample_dataset(
        output_dir=args.output_dir,
        samples_per_class=args.samples,
        sequence_length=args.seq_len
    )


if __name__ == "__main__":
    main()
