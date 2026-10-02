from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status


class TranslationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_translate_english_to_hindi(self):
        response = self.client.post('/api/translate/', {
            "text": "Hello",
            "source_language": "en",
            "target_language": "hi"
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn("नमस्ते", response.data['data']['translated_text'])

    def test_translate_english_to_malayalam(self):
        response = self.client.post('/api/translate/', {
            "text": "Thank you",
            "source_language": "en",
            "target_language": "ml"
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn("നന്ദി", response.data['data']['translated_text'])

    def test_supported_languages_list(self):
        response = self.client.get('/api/translate/languages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        langs = response.data['data']['languages']
        codes = [l['code'] for l in langs]
        self.assertIn('en', codes)
        self.assertIn('hi', codes)
        self.assertIn('ml', codes)
        self.assertIn('ta', codes)
        self.assertIn('te', codes)
        self.assertIn('kn', codes)
