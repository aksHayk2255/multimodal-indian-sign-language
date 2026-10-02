# ISL Machine Learning Pipeline & Temporal Deep Learning Architecture

## 1. The Temporal Video vs. Image Classifier Rationale
Sign languages are fundamentally **temporal, dynamic gestures**. 
A single static image cannot disambiguate:
- Motion direction (e.g. waving hello vs holding an open palm)
- Repetitive motion frequency (e.g. nodding vs static fist)
- Relative limb trajectories across frames (e.g. hand sweeping outwards for "How are you?")

Therefore, this project strictly employs **temporal sequence modeling** over 30 continuous video frames rather than static frame-by-frame 2D CNN classification.

---

## 2. Landmark Kinematics Vector Design
For each sampled video frame:
1. **Pose Landmarks**: 33 keypoints $\times$ 3 coordinates $(x, y, z) = 99$ features.
2. **Left Hand**: 21 articulation points $\times$ 3 coordinates $(x, y, z) = 63$ features.
3. **Right Hand**: 21 articulation points $\times$ 3 coordinates $(x, y, z) = 63$ features.
4. **Total Frame Feature Vector**:
   $$\text{dim} = 99 + 63 + 63 = 225 \text{ features/frame}$$

### Invariance Normalization
In `ml/preprocessing/normalizer.py`:
- Pose and hand landmarks are translated relative to the midpoint of left shoulder (idx 11) and right shoulder (idx 12).
- Scaled by the Euclidean inter-shoulder distance.
- Ensures sign recognition is invariant to distance from camera, user height, or horizontal drift.

---

## 3. Sequence Modeling Architectures

### Primary Model: BiLSTM Sequence Network
```
Input: (batch, 30, 225)
  ↓
Dense(128, activation='relu') + BatchNormalization
  ↓
Bidirectional(LSTM(128, return_sequences=True))
  ↓
Dropout(0.3)
  ↓
LSTM(64, return_sequences=False)
  ↓
Dropout(0.3)
  ↓
Dense(64, activation='relu')
  ↓
Dense(num_classes, activation='softmax')
```

### Hyperparameters
- `SEQUENCE_LENGTH`: 30 frames (equivalent to 1 second at 30 fps)
- `FEATURE_DIM`: 225
- `LEARNING_RATE`: 0.001 (Adam optimizer)
- `BATCH_SIZE`: 32
- `LOSS`: Categorical Crossentropy

---

## 4. Real-Time Inference & Temporal Smoothing Engine
Located in `ml/inference/realtime.py`:

```
Webcam Frame
  ↓
Landmark Extraction & Normalization
  ↓
Sliding Frame Queue (Size 30)
  ↓ (When buffer reaches 30 frames)
Model Inference (Probabilities over 8 classes)
  ↓
Confidence Gating (Threshold ≥ 75%)
  ↓
Sliding Prediction Window (Size 5)
  ↓
Majority Voting (Requires ≥ 60% agreement)
  ↓
Duplicate Suppression & Cooldown Period (1.8s)
  ↓
Emitted Sign Token
  ↓
Sentence Constructor
```

### Prevention of Repeated Tokens
When a signer holds a hand sign for 3 seconds, a naive classifier fires `HELLO` 90 times.
Our duplicate suppression ensures:
- A recognized token is only emitted if it differs from the last sign or if a 1.8-second deliberate pause has occurred.
- Emits clean natural language sentences: `Hello, how are you.` instead of `Hello hello hello hello`.
