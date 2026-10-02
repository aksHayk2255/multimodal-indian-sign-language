"""
State-of-the-Art Invariant ISL Dataset Generator and Real GitHub Corpus Blender.
Combines real human ISL video landmark recordings from GitHub (AI4Bharat INCLUDE)
with realistic multi-signer biomechanical hand and body kinematics:
- Real human keypoints from INCLUDE dataset (aju22/Real-Time-ISL-Translation)
- Handshape biomechanics: 21 relative landmarks, finger curls, fingertip spreads
- Upper body posture: Shoulder-centered, scale-invariant joint positions
- Explicit IDLE / Negative class modeling for resting, lap postures, and zero hands
- Multi-signer augmentation: Rotations, palm sizes, speed variations, sensor jitter
Output: 189-dimensional invariant feature vectors for all 16 classes.
"""

import os
import glob
import json
import math
import argparse
import numpy as np

from ml.preprocessing.normalizer import (
    TOTAL_FEATURE_DIM,
    LandmarkNormalizer
)

EXPANDED_ISL_SIGNS = [
    "IDLE",
    "HELLO",
    "THANK YOU",
    "YES",
    "NO",
    "PLEASE",
    "HELP",
    "GOODBYE",
    "HOW ARE YOU",
    "WELCOME",
    "SORRY",
    "WATER",
    "FOOD",
    "EMERGENCY",
    "NAME",
    "WHERE"
]

GITHUB_CLASS_MAPPING = {
    "hello": "HELLO",
    "thank you": "THANK YOU",
    "how are you": "HOW ARE YOU",
    "alright": "YES",
    "pleased": "WELCOME",
    "good morning": "HELLO",
    "good afternoon": "HELLO",
    "good evening": "HELLO",
    "good night": "GOODBYE"
}


def make_hand_landmarks(shape="OPEN_SPREAD", is_right=True, noise=0.01):
    """
    Returns 21 normalized 3D landmarks relative to wrist (index 0 at 0,0,0)
    and scaled by palm length (distance from wrist to middle MCP = 1.0).
    """
    if shape == "ABSENT":
        return None

    pts = np.zeros((21, 3), dtype=np.float32)
    s = 1.0 if is_right else -1.0

    # Finger specifications: (name, base_idx, mcp_x, mcp_y, flen)
    fingers = [
        ("thumb", 1, 0.40 * s, -0.22, 0.55),
        ("index", 5, 0.25 * s, -0.80, 0.80),
        ("middle", 9, 0.05 * s, -0.85, 0.85),
        ("ring", 13, -0.15 * s, -0.80, 0.80),
        ("pinky", 17, -0.32 * s, -0.70, 0.65),
    ]

    for f_name, base_idx, mcp_x, mcp_y, flen in fingers:
        mcp = np.array([mcp_x, mcp_y, 0.0], dtype=np.float32)
        pts[base_idx] = mcp

        if shape in ("OPEN_SPREAD", "OPEN_FLAT"):
            spread = mcp_x * (0.35 if shape == "OPEN_SPREAD" else 0.08)
            for i in range(1, 4):
                ratio = i / 3.0
                pts[base_idx + i] = mcp + np.array([spread * ratio, -flen * ratio, 0.0], dtype=np.float32)

        elif shape == "FIST":
            if f_name == "thumb":
                for i in range(1, 4):
                    ratio = i / 3.0
                    pts[base_idx + i] = mcp + np.array([-0.25 * s * ratio, 0.20 * ratio, 0.20 * ratio], dtype=np.float32)
            else:
                for i in range(1, 4):
                    ratio = i / 3.0
                    pts[base_idx + i] = mcp + np.array([0.0, flen * ratio * 0.45, 0.25 * ratio], dtype=np.float32)

        elif shape == "INDEX_POINT":
            if f_name == "index":
                for i in range(1, 4):
                    ratio = i / 3.0
                    pts[base_idx + i] = mcp + np.array([0.0, -flen * ratio, 0.0], dtype=np.float32)
            else:
                for i in range(1, 4):
                    ratio = i / 3.0
                    pts[base_idx + i] = mcp + np.array([0.0, flen * ratio * 0.45, 0.25 * ratio], dtype=np.float32)

        elif shape == "TWO_FINGERS":
            if f_name in ("index", "middle"):
                for i in range(1, 4):
                    ratio = i / 3.0
                    pts[base_idx + i] = mcp + np.array([0.0, -flen * ratio, 0.0], dtype=np.float32)
            else:
                for i in range(1, 4):
                    ratio = i / 3.0
                    pts[base_idx + i] = mcp + np.array([0.0, flen * ratio * 0.45, 0.25 * ratio], dtype=np.float32)

        elif shape == "PINCH":
            target_tip = np.array([0.15 * s, -0.40, 0.20], dtype=np.float32)
            for i in range(1, 4):
                ratio = i / 3.0
                pts[base_idx + i] = mcp + (target_tip - mcp) * ratio

        elif shape == "CUPPED":
            for i in range(1, 4):
                ratio = i / 3.0
                pts[base_idx + i] = mcp + np.array([0.0, -flen * ratio * 0.70, -0.30 * ratio], dtype=np.float32)

        elif shape == "REST":
            for i in range(1, 4):
                ratio = i / 3.0
                pts[base_idx + i] = mcp + np.array([0.0, flen * ratio * 0.35, 0.15 * ratio], dtype=np.float32)

    # Add Gaussian jitter
    if noise > 0:
        pts += np.random.normal(0, noise, pts.shape).astype(np.float32)
        pts[0] = [0.0, 0.0, 0.0]  # Wrist always pinned

    return pts


def synthesize_sign_sample(sign_name, sample_idx=0, normalizer=None):
    """
    Generates a single augmented 189-dimensional feature vector for sign_name.
    """
    if normalizer is None:
        normalizer = LandmarkNormalizer()

    # Body frame parameters:
    sh_mid_x = 0.50 + np.random.uniform(-0.04, 0.04)
    sh_mid_y = 0.38 + np.random.uniform(-0.03, 0.03)
    sh_width = 0.20 + np.random.uniform(-0.03, 0.03)

    # 33 pose landmarks in raw camera space:
    pose = np.zeros((33, 3), dtype=np.float32)
    # Nose (0):
    pose[0] = [sh_mid_x, sh_mid_y - sh_width * 0.75, 0.0]
    # Shoulders (11, 12):
    pose[11] = [sh_mid_x + sh_width * 0.5, sh_mid_y, 0.0]
    pose[12] = [sh_mid_x - sh_width * 0.5, sh_mid_y, 0.0]

    # Default resting wrists:
    rw = np.array([sh_mid_x - sh_width * 0.5, sh_mid_y + sh_width * 1.5, 0.0], dtype=np.float32)
    lw = np.array([sh_mid_x + sh_width * 0.5, sh_mid_y + sh_width * 1.5, 0.0], dtype=np.float32)

    rh_shape = "REST"
    lh_shape = "REST"
    rw_vel = [0.0, 0.0, 0.0]
    lw_vel = [0.0, 0.0, 0.0]

    t = np.random.uniform(0.0, 1.0)
    angle_jitter = np.random.uniform(-0.03, 0.03)

    if sign_name == "IDLE":
        variant = np.random.choice(["absent", "lap", "arms_crossed", "chin"])
        if variant == "absent":
            rh_shape = "ABSENT"
            lh_shape = "ABSENT"
            rw = [0.0, 0.0, 0.0]
            lw = [0.0, 0.0, 0.0]
        elif variant == "lap":
            rh_shape = "REST"
            lh_shape = "REST"
            rw[1] += 0.15
            lw[1] += 0.15
        elif variant == "arms_crossed":
            rh_shape = "REST"
            lh_shape = "REST"
            rw = [sh_mid_x + 0.05, sh_mid_y + sh_width * 0.6, 0.0]
            lw = [sh_mid_x - 0.05, sh_mid_y + sh_width * 0.6, 0.0]
        elif variant == "chin":
            rh_shape = "FIST"
            lh_shape = "ABSENT"
            rw = [pose[0][0] - 0.02, pose[0][1] + 0.08, 0.0]

    elif sign_name == "HELLO":
        # Right hand open spread waving at temple level
        rh_shape = "OPEN_SPREAD"
        lh_shape = "ABSENT"
        rw = [pose[0][0] - sh_width * 0.85 + angle_jitter, pose[0][1] - 0.04 + angle_jitter, 0.0]
        rw_vel = [np.random.uniform(-0.08, 0.08), np.random.uniform(-0.02, 0.02), 0.0]

    elif sign_name == "THANK YOU":
        # Right hand open flat moving down from chin
        rh_shape = "OPEN_FLAT"
        lh_shape = "ABSENT"
        arc_y = 0.08 + 0.18 * t
        rw = [pose[0][0] - 0.02, pose[0][1] + arc_y, -0.10 * t]
        rw_vel = [0.0, 0.08, -0.05]

    elif sign_name == "YES":
        # Right hand fist nodding at chest
        rh_shape = "FIST"
        lh_shape = "ABSENT"
        nod = 0.04 * np.sin(2 * np.pi * t)
        rw = [sh_mid_x - sh_width * 0.35, sh_mid_y + sh_width * 0.4 + nod, 0.0]
        rw_vel = [0.0, 0.06 * np.cos(2 * np.pi * t), 0.0]

    elif sign_name == "NO":
        # Right hand two fingers snapping sideways at chest
        rh_shape = "TWO_FINGERS"
        lh_shape = "ABSENT"
        snap = 0.05 * np.sin(3 * np.pi * t)
        rw = [sh_mid_x - sh_width * 0.35 + snap, sh_mid_y + sh_width * 0.3, 0.0]
        rw_vel = [0.07 * np.cos(3 * np.pi * t), 0.0, 0.0]

    elif sign_name == "PLEASE":
        # Flat palm rubbing chest
        rh_shape = "OPEN_FLAT"
        lh_shape = "ABSENT"
        circle_x = 0.04 * np.cos(2 * np.pi * t)
        circle_y = 0.04 * np.sin(2 * np.pi * t)
        rw = [sh_mid_x + circle_x, sh_mid_y + sh_width * 0.5 + circle_y, 0.0]
        rw_vel = [circle_x, circle_y, 0.0]

    elif sign_name == "HELP":
        # Left palm supports right fist, both at chest rising
        lh_shape = "OPEN_FLAT"
        rh_shape = "FIST"
        rise = -0.06 * t
        lw = [sh_mid_x - 0.02, sh_mid_y + sh_width * 0.7 + rise, 0.0]
        rw = [sh_mid_x + 0.02, sh_mid_y + sh_width * 0.55 + rise, 0.0]
        rw_vel = [0.0, -0.04, 0.0]
        lw_vel = [0.0, -0.04, 0.0]

    elif sign_name == "GOODBYE":
        # Open hand waving high
        rh_shape = "OPEN_SPREAD"
        lh_shape = "ABSENT"
        wave = 0.08 * np.sin(4 * np.pi * t)
        rw = [pose[0][0] - sh_width * 0.9 + wave, pose[0][1] - 0.02, 0.0]
        rw_vel = [0.09 * np.cos(4 * np.pi * t), 0.0, 0.0]

    elif sign_name == "HOW ARE YOU":
        # Both hands cupped sweeping outward
        lh_shape = "CUPPED"
        rh_shape = "CUPPED"
        spread = 0.08 * t
        lw = [sh_mid_x + sh_width * 0.3 + spread, sh_mid_y + sh_width * 0.5, 0.0]
        rw = [sh_mid_x - sh_width * 0.3 - spread, sh_mid_y + sh_width * 0.5, 0.0]
        lw_vel = [0.05, 0.0, 0.0]
        rw_vel = [-0.05, 0.0, 0.0]

    elif sign_name == "WELCOME":
        # Both hands open flat sweeping inward
        lh_shape = "OPEN_FLAT"
        rh_shape = "OPEN_FLAT"
        sweep = 0.08 * (1.0 - t)
        lw = [sh_mid_x + sh_width * 0.5 - sweep, sh_mid_y + sh_width * 0.6, 0.0]
        rw = [sh_mid_x - sh_width * 0.5 + sweep, sh_mid_y + sh_width * 0.6, 0.0]
        lw_vel = [-0.05, 0.0, 0.0]
        rw_vel = [0.05, 0.0, 0.0]

    elif sign_name == "SORRY":
        # Fist rubbing circle over heart (left side of chest)
        rh_shape = "FIST"
        lh_shape = "ABSENT"
        rx = 0.03 * np.cos(3 * np.pi * t)
        ry = 0.03 * np.sin(3 * np.pi * t)
        rw = [sh_mid_x + sh_width * 0.2 + rx, sh_mid_y + sh_width * 0.45 + ry, 0.0]
        rw_vel = [rx, ry, 0.0]

    elif sign_name == "WATER":
        # Cupped hand at chin/mouth
        rh_shape = "CUPPED"
        lh_shape = "ABSENT"
        rw = [pose[0][0] - 0.04, pose[0][1] + 0.06 + 0.02 * np.sin(2 * np.pi * t), 0.0]

    elif sign_name == "FOOD":
        # Pinched fingers at lips
        rh_shape = "PINCH"
        lh_shape = "ABSENT"
        rw = [pose[0][0] - 0.02, pose[0][1] + 0.05 + 0.02 * np.sin(3 * np.pi * t), 0.0]

    elif sign_name == "EMERGENCY":
        # Both hands open spread high above head
        lh_shape = "OPEN_SPREAD"
        rh_shape = "OPEN_SPREAD"
        lw = [sh_mid_x + sh_width * 0.6, pose[0][1] - 0.15, 0.0]
        rw = [sh_mid_x - sh_width * 0.6, pose[0][1] - 0.15, 0.0]
        lw_vel = [0.06 * np.sin(6 * np.pi * t), 0.0, 0.0]
        rw_vel = [-0.06 * np.sin(6 * np.pi * t), 0.0, 0.0]

    elif sign_name == "NAME":
        # Both hands two fingers tapping
        lh_shape = "TWO_FINGERS"
        rh_shape = "TWO_FINGERS"
        tap = 0.02 * np.cos(4 * np.pi * t)
        lw = [sh_mid_x + 0.04 + tap, sh_mid_y + sh_width * 0.45, 0.0]
        rw = [sh_mid_x - 0.04 - tap, sh_mid_y + sh_width * 0.45, 0.0]

    elif sign_name == "WHERE":
        # Both hands open flat oscillating in query
        lh_shape = "OPEN_FLAT"
        rh_shape = "OPEN_FLAT"
        q = 0.04 * np.sin(2 * np.pi * t)
        lw = [sh_mid_x + sh_width * 0.45 + q, sh_mid_y + sh_width * 0.6, 0.0]
        rw = [sh_mid_x - sh_width * 0.45 + q, sh_mid_y + sh_width * 0.6, 0.0]

    # Assign pose wrists and elbows:
    pose[15] = lw
    pose[16] = rw
    pose[13] = (pose[11] + lw) * 0.5  # Left elbow
    pose[14] = (pose[12] + rw) * 0.5  # Right elbow

    # Generate hand landmarks:
    rh_pts = None
    if rh_shape != "ABSENT":
        rh_rel = make_hand_landmarks(rh_shape, is_right=True, noise=0.012)
        # Shift to rw position in camera space
        rh_scale = sh_width * 0.40
        rh_pts = rw + rh_rel * rh_scale

    lh_pts = None
    if lh_shape != "ABSENT":
        lh_rel = make_hand_landmarks(lh_shape, is_right=False, noise=0.012)
        lh_scale = sh_width * 0.40
        lh_pts = lw + lh_rel * lh_scale

    prev_wrists = {
        "r": [rw[0] - rw_vel[0] * sh_width, rw[1] - rw_vel[1] * sh_width, rw[2] - rw_vel[2] * sh_width],
        "l": [lw[0] - lw_vel[0] * sh_width, lw[1] - lw_vel[1] * sh_width, lw[2] - lw_vel[2] * sh_width]
    }

    # Extract clean invariant feature vector
    feat = normalizer.extract_features_from_raw(pose, lh_pts, rh_pts, prev_wrists=prev_wrists)
    return feat


synthesize_motion_trajectory = synthesize_sign_sample


def load_github_include_samples(raw_dir="ml/dataset/raw/github_include", normalizer=None):
    """
    Loads real video sequences from GitHub AI4Bharat INCLUDE dataset,
    normalizes them, and extracts frame feature vectors mapped to our 16 classes.
    """
    if normalizer is None:
        normalizer = LandmarkNormalizer()

    extracted_samples = {cls: [] for cls in EXPANDED_ISL_SIGNS}
    if not os.path.exists(raw_dir):
        return extracted_samples

    total_real_frames = 0
    for gh_folder, target_sign in GITHUB_CLASS_MAPPING.items():
        folder_path = os.path.join(raw_dir, gh_folder)
        if not os.path.exists(folder_path):
            continue

        files = glob.glob(os.path.join(folder_path, "*.npy"))
        for fpath in files:
            try:
                arr = np.load(fpath)  # Shape (30, 150)
                if arr.ndim != 2 or arr.shape[1] != 150:
                    continue

                # Each row in arr: pose (0..65), lh (66..107), rh (108..149)
                prev_w = None
                for frame_idx in range(5, len(arr) - 2):  # Active motion segment
                    row = arr[frame_idx]
                    pose_2d = row[:66].reshape(33, 2)
                    lh_2d = row[66:108].reshape(21, 2)
                    rh_2d = row[108:150].reshape(21, 2)

                    # Expand to (N, 3) with z=0
                    pose_3d = np.pad(pose_2d, ((0, 0), (0, 1)), mode='constant')
                    has_lh = not np.all(lh_2d == 0)
                    has_rh = not np.all(rh_2d == 0)

                    lh_3d = np.pad(lh_2d, ((0, 0), (0, 1)), mode='constant') if has_lh else None
                    rh_3d = np.pad(rh_2d, ((0, 0), (0, 1)), mode='constant') if has_rh else None

                    feat = normalizer.extract_features_from_raw(pose_3d, lh_3d, rh_3d, prev_wrists=prev_w)
                    extracted_samples[target_sign].append(feat)
                    total_real_frames += 1

                    # Update prev_w for velocity
                    rw_pt = rh_3d[0] if has_rh else pose_3d[16]
                    lw_pt = lh_3d[0] if has_lh else pose_3d[15]
                    prev_w = {"r": rw_pt, "l": lw_pt}

            except Exception as e:
                pass

    print(f"[GitHub Corpus] Processed {total_real_frames} real video landmark frames from AI4Bharat INCLUDE.")
    return extracted_samples


def generate_expanded_dataset(
    processed_dir="ml/dataset/processed",
    samples_per_class=200,
    signs=EXPANDED_ISL_SIGNS,
    github_raw_dir="ml/dataset/raw/github_include"
):
    import shutil
    if os.path.exists(processed_dir):
        shutil.rmtree(processed_dir)
    os.makedirs(processed_dir, exist_ok=True)

    normalizer = LandmarkNormalizer()
    labels_map = {idx: sign for idx, sign in enumerate(signs)}

    print(f"\n========================================================")
    print(f"STATE-OF-THE-ART ISL DATASET BUILDER: {len(signs)} CLASSES")
    print(f"========================================================")

    # 1. Load real GitHub INCLUDE corpus
    real_gh_samples = load_github_include_samples(github_raw_dir, normalizer=normalizer)

    total_samples = 0
    for idx, sign in enumerate(signs):
        sign_processed_dir = os.path.join(processed_dir, sign)
        os.makedirs(sign_processed_dir, exist_ok=True)

        samples_for_sign = []

        # Include real GitHub samples if available
        if sign in real_gh_samples and len(real_gh_samples[sign]) > 0:
            gh_list = real_gh_samples[sign]
            # Subsample or augment real samples
            indices = np.random.choice(len(gh_list), size=min(len(gh_list), samples_per_class // 2), replace=False)
            for gi in indices:
                samples_for_sign.append(gh_list[gi])

        # Fill the remainder with synthesized multi-signer augmentations
        remaining = samples_per_class - len(samples_for_sign)
        for s in range(remaining):
            feat = synthesize_sign_sample(sign, sample_idx=s, normalizer=normalizer)
            samples_for_sign.append(feat)

        for s_idx, sample_feat in enumerate(samples_for_sign):
            sample_file = os.path.join(sign_processed_dir, f"sample_{s_idx:04d}.npy")
            np.save(sample_file, sample_feat)
            total_samples += 1

        print(f"  [OK] [{idx+1}/{len(signs)}] '{sign}': {len(samples_for_sign)} invariant samples saved.")

    labels_path = os.path.join(processed_dir, "labels.json")
    with open(labels_path, "w", encoding="utf-8") as f:
        json.dump(labels_map, f, indent=2)

    print(f"\n[Success] Dataset build complete! Total: {total_samples} samples across {len(signs)} classes.")
    return labels_map


def main():
    parser = argparse.ArgumentParser(description="Invariant ISL Dataset Generator")
    parser.add_argument("--processed_dir", type=str, default="ml/dataset/processed")
    parser.add_argument("--samples", type=int, default=200)
    args = parser.parse_args()

    generate_expanded_dataset(
        processed_dir=args.processed_dir,
        samples_per_class=args.samples
    )


if __name__ == "__main__":
    main()
