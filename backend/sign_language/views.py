"""
Sign Language Inference and Status Views.
Provides real-time sequence prediction, temporal buffer updates, and model status.
"""

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from backend.config.responses import api_success, api_error
from .serializers import ISLPredictSerializer
from .services import get_inference_service, reload_inference_service


class ISLPredictView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ISLPredictSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(
                code="INVALID_PAYLOAD",
                message="Invalid landmark payload",
                details=serializer.errors,
                status_code=400
            )

        service = get_inference_service()
        data = serializer.validated_data
        mode = data.get('mode', 'frame')

        if not service.is_model_loaded:
            return api_success(
                data={
                    "sign": None,
                    "confidence": 0.0,
                    "sentence": service.get_sentence(),
                    "model_status": service.status_message,
                    "model_loaded": False,
                    "is_new_sign": False
                },
                message=service.status_message
            )

        if mode == 'sequence':
            # Direct sequence inference
            result = service.predict_sequence(data['sequence'], update_sentence=True)
            if result:
                return api_success(
                    data={
                        "sign": result["sign"],
                        "confidence": result["confidence"],
                        "probabilities": result["probabilities"],
                        "sentence": result.get("sentence", service.get_sentence()),
                        "model_loaded": True,
                        "model_status": "Predicted sequence successfully",
                        "is_new_sign": result.get("is_new_sign", False)
                    },
                    message="Sequence prediction completed"
                )
            else:
                return api_error(
                    code="PREDICTION_FAILED",
                    message="Inference failed on given sequence",
                    status_code=500
                )
        else:
            # Single frame pushed into temporal sliding window
            features = data.get('features', [])
            result = service.process_frame(features)
            return api_success(
                data={
                    "sign": result.get("sign"),
                    "confidence": result.get("confidence", 0.0),
                    "sentence": result.get("sentence", ""),
                    "model_status": result.get("model_status", ""),
                    "model_loaded": service.is_model_loaded,
                    "is_new_sign": result.get("is_new_sign", False)
                },
                message="Frame processed successfully"
            )


class ISLStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        reload_flag = request.query_params.get('reload', 'false').lower() == 'true'
        if reload_flag:
            service = reload_inference_service()
        else:
            service = get_inference_service()

        return api_success(
            data=service.get_status(),
            message="ISL Model status retrieved"
        )


class ISLClearSentenceView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        service = get_inference_service()
        service.clear_sentence()
        return api_success(
            data={"sentence": ""},
            message="Sentence cleared successfully"
        )
