from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, UserFriend

class UserAuthTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
            'first_name': 'Test',
            'last_name': 'User',
            'country': 'US',
        }
        self.register_url = reverse('user-register')
        self.login_url = reverse('user-login')

    def test_user_registration(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_user_login(self):
        self.client.post(self.register_url, self.user_data, format='json')
        login_data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        print('LOGIN RESPONSE:', response.data)  # Debug
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data['tokens'])

class UserProfileTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='profileuser',
            email='profile@example.com',
            password='ProfilePass123!'
        )
        self.client.force_authenticate(user=self.user)
        self.profile_url = reverse('user-profile')

    def test_get_profile(self):
        response = self.client.get(self.profile_url)
        print('PROFILE RESPONSE:', response.data)  # Debug
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'profileuser')

class UserFriendTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='user1', email='user1@example.com', password='pass1234')
        self.user2 = User.objects.create_user(username='user2', email='user2@example.com', password='pass1234')
        self.client.force_authenticate(user=self.user1)
        self.friend_add_url = reverse('friend-add')
        self.friend_list_url = reverse('friend-list')

    def test_send_friend_request(self):
        response = self.client.post(self.friend_add_url, {'friend_id': self.user2.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserFriend.objects.filter(user=self.user1, friend=self.user2).exists())

    def test_list_friends(self):
        UserFriend.objects.create(user=self.user1, friend=self.user2, status='accepted')
        response = self.client.get(self.friend_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user2', str(response.data)) 