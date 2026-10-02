from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status


class SignLanguageAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_status_endpoint(self):
        response = self.client.get('/api/sign-language/status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('loaded', response.data['data'])
        self.assertIn('status_message', response.data['data'])

    def test_predict_endpoint_frame_mode(self):
        # 225-dimensional dummy feature array
        features = [0.0] * 225
        response = self.client.post('/api/sign-language/predict/', {
            "mode": "frame",
            "features": features
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('model_status', response.data['data'])
