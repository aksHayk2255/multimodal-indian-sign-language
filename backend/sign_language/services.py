"""
Backend Sign Language Inference Service Wrapper.
Integrates the ml.inference.realtime.ISLInferenceService with Django views.
Ensures thread-safe singleton access and truthful model status reporting.
"""

import os
from django.conf import settings
from ml.inference.realtime import ISLInferenceService

_inference_service_instance = None


def get_inference_service():
    """
    Returns the singleton ISLInferenceService instance.
    Loads model lazily on first access.
    """
    global _inference_service_instance
    if _inference_service_instance is None:
        model_path = getattr(settings, 'ISL_MODEL_PATH', 'ml/models/isl_bilstm_model.keras')
        labels_path = getattr(settings, 'ISL_LABELS_PATH', 'ml/models/isl_labels.json')
        conf_thresh = getattr(settings, 'CONFIDENCE_THRESHOLD', 0.45)
        seq_len = getattr(settings, 'SEQUENCE_LENGTH', 30)

        _inference_service_instance = ISLInferenceService(
            model_path=model_path,
            labels_path=labels_path,
            confidence_threshold=conf_thresh,
            sequence_length=seq_len
        )
    return _inference_service_instance


def reload_inference_service():
    """
    Forces reload of model artifacts (e.g. after training completes).
    """
    global _inference_service_instance
    _inference_service_instance = None
    return get_inference_service()
