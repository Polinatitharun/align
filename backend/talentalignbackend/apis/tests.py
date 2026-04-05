
# tests.py - FIXED with correct HTTP methods

from django.test import TestCase

from django.contrib.auth import get_user_model

from django.urls import reverse

from rest_framework.test import APITestCase

from rest_framework import status

from .models import Job



User = get_user_model()





# ================== 1. USER TESTS ==================



class UserAPITests(APITestCase):


def test_add_user(self):

"""POST /api/users/add/ - Add new user"""

url = reverse('add-user')

response = self.client.post(url, {

'username': 'john_doe',

'email': 'john@example.com',

'password': 'password123',

'role': 'trainee'

})

self.assertEqual(response.status_code, 201)

self.assertTrue(User.objects.filter(username='john_doe').exists())



def test_list_users(self):

"""GET /api/users/ - List all users"""

User.objects.create_user(username='user1', password='pass', role='admin')

url = reverse('list-users')

response = self.client.get(url)

self.assertEqual(response.status_code, 200)

self.assertGreater(len(response.data), 0)



def test_edit_user(self):

"""PUT /api/users/<id>/edit/ - Edit user"""

user = User.objects.create_user(username='test', password='pass', role='ta')

url = reverse('edit-user', kwargs={'user_id': user.id})

response = self.client.put(url, {'email': 'updated@example.com'})

self.assertEqual(response.status_code, 200)

user.refresh_from_db()

self.assertEqual(user.email, 'updated@example.com')



def test_delete_user(self):

"""DELETE /api/users/<id>/delete/ - Delete user"""

user = User.objects.create_user(username='delete_me', password='pass', role='hr')

url = reverse('delete-user', kwargs={'user_id': user.id})

response = self.client.delete(url)

self.assertEqual(response.status_code, 200)

self.assertFalse(User.objects.filter(username='delete_me').exists())





# ================== 2. JOB TESTS ==================



class JobAPITests(APITestCase):


def setUp(self):

self.user = User.objects.create_user(username='admin', password='pass', role='admin')

self.client.force_authenticate(user=self.user)



def test_create_job(self):

"""POST /api/jobs/ - Create job"""

url = reverse('job-list')

response = self.client.post(url, {

'title': 'Software Engineer',

'department': 'Technology',

'location': ['Bangalore', 'Hyderabad'],

'openings': 5,

'requirements': '3+ years experience',

'description': 'Backend developer role',

'status': 'active'

}, format='json')

self.assertEqual(response.status_code, 201)

self.assertEqual(Job.objects.count(), 1)



def test_get_jobs(self):

"""GET /api/jobs/ - List all jobs"""

Job.objects.create(

title='Job 1',

department='Tech',

location=['Mumbai'],

openings=3,

requirements='Exp',

description='Desc',

created_by=self.user

)

url = reverse('job-list')

response = self.client.get(url)

self.assertEqual(response.status_code, 200)

self.assertEqual(len(response.data), 1)



def test_update_job(self):

"""PUT /api/jobs/<id>/ - Update job"""

job = Job.objects.create(

title='Old Title',

department='Tech',

location=['Delhi'],

openings=2,

requirements='Exp',

description='Desc',

created_by=self.user

)

url = reverse('job-detail', kwargs={'pk': job.id})


# Your view uses PUT method, not PATCH

# Send complete data for PUT request

response = self.client.put(url, {

'title': 'Updated Title',

'department': 'Tech', # Keep existing

'location': ['Delhi'], # Keep existing

'openings': 2, # Keep existing

'requirements': 'Exp', # Keep existing

'description': 'Desc', # Keep existing

'status': 'active' # Keep existing

}, format='json')

self.assertEqual(response.status_code, 200)

job.refresh_from_db()

self.assertEqual(job.title, 'Updated Title')



def test_delete_job(self):

"""DELETE /api/jobs/<id>/ - Delete job"""

job = Job.objects.create(

title='Delete Me',

department='Tech',

location=['Mumbai'],

openings=1,

requirements='Exp',

description='Desc',

created_by=self.user

)

url = reverse('job-detail', kwargs={'pk': job.id})

response = self.client.delete(url)

self.assertEqual(response.status_code, 204)

self.assertFalse(Job.objects.filter(id=job.id).exists())





# ================== 3. LOGIN TEST ==================



class AuthTest(APITestCase):


def test_login(self):

"""POST /api/login/ - User login"""

User.objects.create_user(username='testuser', password='testpass', role='admin')

url = reverse('login')

response = self.client.post(url, {

'username': 'testuser',

'password': 'testpass'

})

self.assertEqual(response.status_code, 200)

self.assertIn('access', response.data)





# ================== 4. ERROR CASES ==================



class ErrorTests(APITestCase):


def test_404_not_found(self):

"""GET non-existent endpoint"""

response = self.client.get('/api/nonexistent/')

self.assertEqual(response.status_code, 404)



def test_invalid_data(self):

"""POST invalid data to add user"""

url = reverse('add-user')

response = self.client.post(url, {'username': 'test'})

self.assertEqual(response.status_code, 400)