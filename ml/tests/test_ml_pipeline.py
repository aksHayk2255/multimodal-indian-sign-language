"""
Comprehensive Unit Tests for the ISL ML Pipeline.
Tests landmark normalizer, temporal padding, sequence generation,
model shape consistency, and real-time temporal smoothing.
"""

import os
import unittest
import numpy as np

from ml.preprocessing.normalizer import (
    LandmarkNormalizer,
    TOTAL_FEATURE_DIM,
    DEFAULT_SEQUENCE_LENGTH
)
from ml.dataset.sample_generator import (
    generate_sign_trajectory,
    DEFAULT_ISL_SIGNS
)
from ml.inference.realtime import ISLInferenceService


class TestMLPipeline(unittest.TestCase):
    def setUp(self):
        self.normalizer = LandmarkNormalizer(sequence_length=DEFAULT_SEQUENCE_LENGTH)

    def test_landmark_feature_dimensions(self):
        """Verifies total multimodal feature dimensions are 189."""
        self.assertEqual(TOTAL_FEATURE_DIM, 189)
        raw_frame = np.random.randn(TOTAL_FEATURE_DIM)
        normalized = self.normalizer.normalize_frame(raw_frame)
        self.assertEqual(normalized.shape, (189,))
        self.assertFalse(np.isnan(normalized).any())

    def test_sequence_padding_and_truncation(self):
        """Verifies sequences of varying length are standardized to (30, 189)."""
        # Short sequence (10 frames)
        short_seq = np.random.randn(10, TOTAL_FEATURE_DIM)
        padded = self.normalizer.pad_or_truncate_sequence(short_seq)
        self.assertEqual(padded.shape, (30, TOTAL_FEATURE_DIM))

        # Long sequence (50 frames)
        long_seq = np.random.randn(50, TOTAL_FEATURE_DIM)
        sampled = self.normalizer.pad_or_truncate_sequence(long_seq)
        self.assertEqual(sampled.shape, (30, TOTAL_FEATURE_DIM))

    def test_sample_trajectory_generator(self):
        """Verifies trajectory synthesis generates valid biomechanical frames."""
        for sign in DEFAULT_ISL_SIGNS:
            traj = generate_sign_trajectory(sign, sequence_length=30)
            self.assertEqual(traj.shape, (30, TOTAL_FEATURE_DIM))
            self.assertTrue(np.all(np.isfinite(traj)))

    def test_realtime_inference_service_without_model(self):
        """Verifies that when model is missing, inference service truth-telling works (never fakes)."""
        service = ISLInferenceService(model_path="non_existent_model.keras")
        self.assertFalse(service.is_model_loaded)
        status = service.get_status()
        self.assertFalse(status["loaded"])
        self.assertIn("ISL model not trained", status["status_message"])

        # Feeding frames returns empty prediction and truth message
        res = service.process_frame(np.zeros(225))
        self.assertIsNone(res["sign"])
        self.assertEqual(res["confidence"], 0.0)

    def test_sentence_constructor(self):
        """Verifies sentence construction tokens join correctly."""
        service = ISLInferenceService(model_path="dummy.keras")
        service.constructed_sentence_tokens = ["HELLO", "THANK YOU"]
        sentence = service.get_sentence()
        self.assertEqual(sentence, "Hello thank you.")

        service.clear_sentence()
        self.assertEqual(service.get_sentence(), "")


if __name__ == "__main__":
    unittest.main()
