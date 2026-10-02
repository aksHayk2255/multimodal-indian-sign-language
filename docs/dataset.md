# ISL Dataset Setup & Landmark Data Format

## 1. Directory Structure

The repository organizes sign datasets into raw video recordings and structured numpy sequence arrays:

```
ml/dataset/
├── raw/                      # Video recordings (.mp4, .avi, .webm)
│   ├── HELLO/
│   │   ├── signer1_take1.mp4
│   │   └── signer2_take1.mp4
│   ├── THANK_YOU/
│   ├── YES/
│   ├── NO/
│   ├── PLEASE/
│   ├── HELP/
│   ├── GOODBYE/
│   └── HOW_ARE_YOU/
│
└── processed/                # Normalized NumPy arrays (T=30, Dim=225)
    ├── labels.json
    ├── HELLO/
    │   ├── sample_0001.npy
    │   └── sample_0002.npy
    └── ...
```

---

## 2. Processed Sequence Array Schema

Each `.npy` file represents a single gesture performance:
- **Shape**: `(30, 225)` (Float32)
- **Time steps ($T$)**: 30 frames
- **Feature vector ($D$)**:
  - `[0:99]`: 33 Pose landmarks $\times (x, y, z)$
  - `[99:162]`: 21 Left Hand landmarks $\times (x, y, z)$
  - `[162:225]`: 21 Right Hand landmarks $\times (x, y, z)$

---

## 3. Extracting Landmarks from Custom Video Datasets

To extract 3D landmarks from raw videos organized into class folders:
```bash
python -m ml.landmark_extraction.extract_landmarks --raw_dir ml/dataset/raw --output_dir ml/dataset/processed --sequence_length 30
```

---

## 4. Benchmark Synthetic Generator

For offline validation and initial local college demonstration, a dedicated biomechanical kinematic trajectory synthesizer is included:
```bash
python -m ml.dataset.sample_generator --output_dir ml/dataset/processed --samples 60
```
This generates 480 valid 30-frame temporal trajectories across all 8 standard ISL vocabulary words with Gaussian noise and kinematic jitter.
