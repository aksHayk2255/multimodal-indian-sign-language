"""
Real-Time ISL Inference Engine with Temporal Smoothing.
Includes Multi-Modal Landmark Buffer, Calibrated Ensemble Inference,
Temporal Majority Voting, Duplicate Suppression, and Sentence Construction.
Supports both scikit-learn calibrated soft-voting ensembles and Keras models.
Follows the strict rule: NEVER fake predictions if model is unavailable.
"""

import os
import time
import json
import collections
import numpy as np

from ml.preprocessing.normalizer import (
    LandmarkNormalizer,
    TOTAL_FEATURE_DIM,
    DEFAULT_SEQUENCE_LENGTH
)


class ISLInferenceService:
    """
    Manages model loading, temporal buffering, prediction smoothing,
    and sentence construction for Indian Sign Language recognition.
    """

    def __init__(
        self,
        model_path="ml/models/isl_sequence_model.joblib",
        labels_path="ml/models/isl_labels.json",
        confidence_threshold=0.45,
        sequence_length=DEFAULT_SEQUENCE_LENGTH,
        smoothing_window=5,
        cooldown_seconds=1.5
    ):
        self.model_path = model_path
        self.labels_path = labels_path
        self.confidence_threshold = confidence_threshold
        self.sequence_length = sequence_length
        self.smoothing_window = smoothing_window
        self.cooldown_seconds = cooldown_seconds

        self.model = None
        self.model_framework = None
        self.labels_map = {}
        self.is_model_loaded = False
        self.status_message = "Initializing..."

        # Temporal smoothing buffers
        self.frame_buffer = collections.deque(maxlen=self.sequence_length)
        self.prediction_buffer = collections.deque(maxlen=self.smoothing_window)
        self.confidence_buffer = collections.deque(maxlen=self.smoothing_window)

        # State tracking
        self.last_emitted_sign = None
        self.last_emitted_time = 0.0
        self.constructed_sentence_tokens = []
        self.normalizer = LandmarkNormalizer(sequence_length=sequence_length)

        # Attempt to load model on initialization
        self.load_model()

    def load_model(self):
        """
        Attempts to load model artifacts from disk without faking.
        """
        if self.model_path.endswith(".joblib"):
            joblib_path = self.model_path
            keras_path = self.model_path.replace(".joblib", ".keras").replace("isl_sequence_model", "isl_bilstm_model")
        else:
            keras_path = self.model_path
            joblib_path = self.model_path.replace(".keras", ".joblib").replace("isl_bilstm_model", "isl_sequence_model")

        target_model_file = None
        if os.path.exists(joblib_path):
            target_model_file = joblib_path
            self.model_framework = "sklearn"
        elif os.path.exists(keras_path):
            target_model_file = keras_path
            self.model_framework = "keras"
        else:
            self.model = None
            self.labels_map = {}
            self.is_model_loaded = False
            self.status_message = (
                f"ISL model not trained (missing {joblib_path}). "
                "Please run 'python -m ml.training.train' to train the model."
            )
            return False

        if not os.path.exists(self.labels_path):
            self.model = None
            self.labels_map = {}
            self.is_model_loaded = False
            self.status_message = f"Labels file not found at {self.labels_path}."
            return False

        try:
            if self.model_framework == "keras":
                import tensorflow as tf
                self.model = tf.keras.models.load_model(target_model_file)
            else:
                import joblib
                self.model = joblib.load(target_model_file)

            with open(self.labels_path, "r", encoding="utf-8") as f:
                raw_labels = json.load(f)
                self.labels_map = {int(k): v for k, v in raw_labels.items()}

            self.is_model_loaded = True
            self.status_message = f"Model loaded successfully ({len(self.labels_map)} classes)."
            return True
        except Exception as e:
            self.model = None
            self.is_model_loaded = False
            self.status_message = f"Error loading model: {str(e)}"
            return False

    def get_status(self):
        return {
            "loaded": self.is_model_loaded,
            "status_message": self.status_message,
            "classes": list(self.labels_map.values()) if self.is_model_loaded else [],
            "confidence_threshold": self.confidence_threshold,
            "sequence_length": self.sequence_length,
            "constructed_sentence": self.get_sentence()
        }

    def predict_sequence(self, sequence_array, update_sentence=False, current_time=None):
        """
        Predicts on a sequence or multi-frame array by evaluating probabilities
        over active gesture frames.
        """
        if not self.is_model_loaded or self.model is None:
            return None

        arr = np.array(sequence_array, dtype=np.float32)
        if arr.ndim == 1:
            arr = arr.reshape(1, -1)
        elif arr.ndim == 3:
            arr = arr[0]

        # Normalize frames
        norm_frames = np.array([self.normalizer.normalize_frame(arr[i]) for i in range(len(arr))], dtype=np.float32)

        if self.model_framework == "keras":
            probs = self.model.predict(norm_frames[-1:], verbose=0)[0]
        else:
            # Average probabilities across the last 5 frames for temporal stability
            eval_window = norm_frames[-5:] if len(norm_frames) >= 5 else norm_frames
            probs_matrix = self.model.predict_proba(eval_window)
            probs = np.mean(probs_matrix, axis=0)

        max_idx = int(np.argmax(probs))
        confidence = float(probs[max_idx])
        sign_label = self.labels_map.get(max_idx, "UNKNOWN")

        all_probs = {self.labels_map.get(i, f"class_{i}"): float(p) for i, p in enumerate(probs)}

        is_new_sign = False
        is_idle = sign_label in ("IDLE", "REST", "NEUTRAL")

        if update_sentence and (not is_idle) and confidence >= self.confidence_threshold:
            if current_time is None:
                current_time = time.time()
            time_since_last = current_time - self.last_emitted_time
            is_same_as_last = (sign_label == self.last_emitted_sign)

            if not (is_same_as_last and time_since_last < self.cooldown_seconds):
                self.last_emitted_sign = sign_label
                self.last_emitted_time = current_time
                self.constructed_sentence_tokens.append(sign_label)
                is_new_sign = True

        return {
            "sign": None if is_idle else sign_label,
            "confidence": 0.0 if is_idle else confidence,
            "probabilities": all_probs,
            "is_new_sign": is_new_sign,
            "sentence": self.get_sentence()
        }

    def process_frame(self, frame_features, current_time=None):
        """
        Instantaneous single-frame inference with rolling majority smoothing.
        """
        if current_time is None:
            current_time = time.time()

        if not self.is_model_loaded or self.model is None:
            return {
                "sign": None,
                "confidence": 0.0,
                "sentence": self.get_sentence(),
                "model_status": self.status_message,
                "is_new_sign": False
            }

        norm_feat = self.normalizer.normalize_frame(frame_features).reshape(1, -1)

        if self.model_framework == "keras":
            probs = self.model.predict(norm_feat, verbose=0)[0]
        else:
            probs = self.model.predict_proba(norm_feat)[0]

        max_idx = int(np.argmax(probs))
        confidence = float(probs[max_idx])
        raw_sign = self.labels_map.get(max_idx, "UNKNOWN")

        is_idle = raw_sign in ("IDLE", "REST", "NEUTRAL")

        # Push to temporal smoothing buffer
        if (not is_idle) and confidence >= self.confidence_threshold:
            self.prediction_buffer.append(raw_sign)
            self.confidence_buffer.append(confidence)
        else:
            self.prediction_buffer.append(None)
            self.confidence_buffer.append(0.0)

        valid_preds = [p for p in self.prediction_buffer if p is not None]
        if not valid_preds:
            return {
                "sign": None,
                "confidence": 0.0,
                "sentence": self.get_sentence(),
                "model_status": "Idle / Ready to sign",
                "is_new_sign": False
            }

        counts = collections.Counter(valid_preds)
        majority_sign, majority_count = counts.most_common(1)[0]
        vote_ratio = majority_count / self.smoothing_window

        if vote_ratio < 0.6:
            return {
                "sign": None,
                "confidence": confidence,
                "sentence": self.get_sentence(),
                "model_status": "Stabilizing gesture...",
                "is_new_sign": False
            }

        avg_conf = float(np.mean([c for p, c in zip(self.prediction_buffer, self.confidence_buffer) if p == majority_sign]))

        time_since_last = current_time - self.last_emitted_time
        is_same_as_last = (majority_sign == self.last_emitted_sign)

        if is_same_as_last and (time_since_last < self.cooldown_seconds):
            return {
                "sign": majority_sign,
                "confidence": avg_conf,
                "sentence": self.get_sentence(),
                "model_status": "Sign held (cooldown active)",
                "is_new_sign": False
            }

        self.last_emitted_sign = majority_sign
        self.last_emitted_time = current_time
        self.constructed_sentence_tokens.append(majority_sign)

        return {
            "sign": majority_sign,
            "confidence": avg_conf,
            "sentence": self.get_sentence(),
            "model_status": f"Recognized: {majority_sign}",
            "is_new_sign": True
        }

    def get_sentence(self):
        if not self.constructed_sentence_tokens:
            return ""
        sentence_str = " ".join(self.constructed_sentence_tokens)
        return sentence_str.capitalize() + "."

    def clear_sentence(self):
        self.constructed_sentence_tokens = []
        self.last_emitted_sign = None
        self.prediction_buffer.clear()
        self.confidence_buffer.clear()
        return ""
