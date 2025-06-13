from django.test import TestCase
from .models import Bike, BikeCategory, Manufacturer
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

# Create your tests here.

class BikeModelTest(TestCase):
    def setUp(self):
        self.manufacturer = Manufacturer.objects.create(name='Yamaha')
        self.category = BikeCategory.objects.create(name='Sport')
        self.bike = Bike.objects.create(
            name='YZF-R1',
            manufacturer=self.manufacturer,
            category=self.category,
            description='Superbike',
        )

    def test_bike_str(self):
        self.assertEqual(str(self.bike), 'YZF-R1')

    def test_bike_category(self):
        self.assertEqual(self.bike.category.name, 'Sport')

    def test_bike_manufacturer(self):
        self.assertEqual(self.bike.manufacturer.name, 'Yamaha')

class BikeAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.manufacturer = Manufacturer.objects.create(name='Honda')
        self.category = BikeCategory.objects.create(name='Touring')
        self.bike = Bike.objects.create(
            name='Gold Wing',
            manufacturer=self.manufacturer,
            category=self.category,
            description='Touring bike',
        )

    def test_bike_list_api(self):
        url = reverse('bike-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Gold Wing', str(response.data))

    def test_bike_detail_api(self):
        url = reverse('bike-detail', args=[self.bike.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Gold Wing')
