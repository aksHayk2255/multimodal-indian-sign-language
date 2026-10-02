from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status


class AccountsAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.profile_url = '/api/auth/profile/'
        self.settings_url = '/api/settings/'

    def test_registration_and_profile_creation(self):
        payload = {
            "username": "signer_test",
            "email": "signer@example.com",
            "password": "Password123",
            "confirm_password": "Password123",
            "first_name": "Test Signer",
            "preferred_language": "hi"
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('token', response.data['data'])

        # Verify User and UserProfile exist
        user = User.objects.get(username="signer_test")
        self.assertEqual(user.profile.preferred_language, "hi")

    def test_login_flow(self):
        User.objects.create_user(username="valid_user", password="MyPassword123")
        response = self.client.post(self.login_url, {"username": "valid_user", "password": "MyPassword123"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('token', response.data['data'])

    def test_settings_retrieval_and_update(self):
        user = User.objects.create_user(username="settings_user", password="Password123")
        self.client.force_authenticate(user=user)

        # GET settings
        get_res = self.client.get(self.settings_url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)

        # PUT settings
        put_res = self.client.put(self.settings_url, {
            "preferred_language": "ml",
            "target_language": "ta",
            "auto_speak": False,
            "confidence_threshold": 0.85
        }, format='json')
        self.assertEqual(put_res.status_code, status.HTTP_200_OK)
        self.assertEqual(put_res.data['data']['preferred_language'], 'ml')
        self.assertEqual(put_res.data['data']['confidence_threshold'], 0.85)
