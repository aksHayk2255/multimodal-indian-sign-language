from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from history.models import Conversation, ConversationMessage


class HistoryAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_create_and_fetch_conversation(self):
        # Create
        create_res = self.client.post('/api/history/', {
            "title": "Test Chat",
            "mode": "two_way",
            "source_language": "en",
            "target_language": "hi",
            "messages": [
                {
                    "sender": "sign_user",
                    "message_type": "isl_sign",
                    "original_text": "Hello",
                    "translated_text": "नमस्ते"
                }
            ]
        }, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        conv_id = create_res.data['data']['id']

        # Fetch detail
        detail_res = self.client.get(f'/api/history/{conv_id}/')
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_res.data['data']['title'], "Test Chat")
        self.assertEqual(len(detail_res.data['data']['messages']), 1)

    def test_communication_send_endpoint(self):
        send_res = self.client.post('/api/communication/send/', {
            "sender": "sign_user",
            "original_text": "Thank you",
            "source_language": "en",
            "target_language": "hi"
        }, format='json')
        self.assertEqual(send_res.status_code, status.HTTP_200_OK)
        self.assertTrue(send_res.data['success'])
        self.assertIn("conversation_id", send_res.data['data'])
