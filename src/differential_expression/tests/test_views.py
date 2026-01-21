from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from common.tests_utils import create_user_file
from differential_expression.models import (
    DifferentialExpressionExperiment,
    DifferentialExpressionExperimentState
)
from differential_expression.tests.test_utils import (
    get_test_file_path,
    create_differential_expression_source,
    create_differential_expression_clinical_source,
    create_test_differential_expression_experiment
)
from user_files.models_choices import FileType


class DifferentialExpressionDeleteTestCase(TestCase):
    """Tests for DifferentialExpressionDelete endpoint"""

    def setUp(self):
        """Test setup"""
        # Create test users
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@test.com',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            username='other',
            email='other@test.com',
            password='testpass123'
        )

        # Create test files
        self.mrna_file = create_user_file(
            get_test_file_path('mrna_test.csv'),
            'mRNA Test',
            FileType.MRNA,
            self.owner
        )
        self.clinical_file = create_user_file(
            get_test_file_path('clinical_test.csv'),
            'Clinical Test',
            FileType.CLINICAL,
            self.owner
        )

        # Create sources
        self.mrna_source = create_differential_expression_source(self.mrna_file)
        self.clinical_source = create_differential_expression_clinical_source(self.clinical_file)

        # Create API client
        self.client = APIClient()

    def test_delete_experiment_success(self):
        """Test successfully deleting a completed experiment"""
        # Create a completed experiment
        experiment = create_test_differential_expression_experiment(
            name='Test Experiment',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.COMPLETED
        )

        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Delete the experiment
        url = f'/differential-expression/delete/{experiment.pk}/'
        response = self.client.delete(url)

        # Assert response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['ok'])

        # Assert experiment was deleted
        self.assertFalse(
            DifferentialExpressionExperiment.objects.filter(pk=experiment.pk).exists()
        )

    def test_delete_experiment_not_owner(self):
        """Test that non-owner cannot delete experiment"""
        # Create experiment owned by owner
        experiment = create_test_differential_expression_experiment(
            name='Test Experiment',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.COMPLETED
        )

        # Authenticate as other user
        self.client.force_authenticate(user=self.other_user)

        # Try to delete the experiment
        url = f'/differential-expression/delete/{experiment.pk}/'
        response = self.client.delete(url)

        # Assert forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(response.data['ok'])

        # Assert experiment still exists
        self.assertTrue(
            DifferentialExpressionExperiment.objects.filter(pk=experiment.pk).exists()
        )

    def test_delete_experiment_running_in_process(self):
        """Test that running experiment cannot be deleted"""
        # Create a running experiment
        experiment = create_test_differential_expression_experiment(
            name='Running Experiment',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.IN_PROCESS,
            task_id='test-task-id'
        )

        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Try to delete the experiment
        url = f'/differential-expression/delete/{experiment.pk}/'
        response = self.client.delete(url)

        # Assert bad request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['ok'])
        self.assertIn('running', response.data['detail'].lower())

        # Assert experiment still exists
        self.assertTrue(
            DifferentialExpressionExperiment.objects.filter(pk=experiment.pk).exists()
        )

    def test_delete_experiment_waiting_for_queue(self):
        """Test that experiment waiting for queue cannot be deleted"""
        # Create experiment waiting for queue
        experiment = create_test_differential_expression_experiment(
            name='Waiting Experiment',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.WAITING_FOR_QUEUE,
            task_id='test-task-id'
        )

        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Try to delete the experiment
        url = f'/differential-expression/delete/{experiment.pk}/'
        response = self.client.delete(url)

        # Assert bad request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['ok'])

        # Assert experiment still exists
        self.assertTrue(
            DifferentialExpressionExperiment.objects.filter(pk=experiment.pk).exists()
        )

    def test_delete_experiment_stopping(self):
        """Test that experiment being stopped cannot be deleted"""
        # Create experiment being stopped
        experiment = create_test_differential_expression_experiment(
            name='Stopping Experiment',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.STOPPING,
            task_id='test-task-id'
        )

        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Try to delete the experiment
        url = f'/differential-expression/delete/{experiment.pk}/'
        response = self.client.delete(url)

        # Assert bad request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['ok'])

        # Assert experiment still exists
        self.assertTrue(
            DifferentialExpressionExperiment.objects.filter(pk=experiment.pk).exists()
        )

    def test_delete_experiment_stopped_success(self):
        """Test that stopped experiment can be deleted"""
        # Create stopped experiment
        experiment = create_test_differential_expression_experiment(
            name='Stopped Experiment',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.STOPPED
        )

        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Delete the experiment
        url = f'/differential-expression/delete/{experiment.pk}/'
        response = self.client.delete(url)

        # Assert success
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['ok'])

        # Assert experiment was deleted
        self.assertFalse(
            DifferentialExpressionExperiment.objects.filter(pk=experiment.pk).exists()
        )

    def test_delete_experiment_with_error_success(self):
        """Test that experiment with error can be deleted"""
        # Create experiment with error
        experiment = create_test_differential_expression_experiment(
            name='Error Experiment',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.FINISHED_WITH_ERROR
        )

        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Delete the experiment
        url = f'/differential-expression/delete/{experiment.pk}/'
        response = self.client.delete(url)

        # Assert success
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['ok'])

        # Assert experiment was deleted
        self.assertFalse(
            DifferentialExpressionExperiment.objects.filter(pk=experiment.pk).exists()
        )

    def test_delete_experiment_not_authenticated(self):
        """Test that unauthenticated user cannot delete experiment"""
        # Create experiment
        experiment = create_test_differential_expression_experiment(
            name='Test Experiment',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.COMPLETED
        )

        # Don't authenticate

        # Try to delete the experiment
        url = f'/differential-expression/delete/{experiment.pk}/'
        response = self.client.delete(url)

        # Assert unauthorized
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Assert experiment still exists
        self.assertTrue(
            DifferentialExpressionExperiment.objects.filter(pk=experiment.pk).exists()
        )

    def test_delete_experiment_not_found(self):
        """Test deleting non-existent experiment returns 404"""
        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Try to delete non-existent experiment
        url = '/differential-expression/delete/99999/'
        response = self.client.delete(url)

        # Assert not found
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch('differential_expression.views.AbortableAsyncResult')
    def test_delete_experiment_with_active_task(self, mock_async_result):
        """Test that experiment with active Celery task gets aborted before deletion"""
        # Mock the AbortableAsyncResult
        mock_result = MagicMock()
        mock_result.state = 'STARTED'
        mock_result.abort.return_value = True
        mock_async_result.return_value = mock_result

        # Create completed experiment with task_id
        experiment = create_test_differential_expression_experiment(
            name='Test Experiment with Task',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.COMPLETED,
            task_id='active-task-id'
        )

        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Delete the experiment
        url = f'/differential-expression/delete/{experiment.pk}/'
        response = self.client.delete(url)

        # Assert success
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['ok'])

        # Assert AbortableAsyncResult was called
        mock_async_result.assert_called_once_with('active-task-id')
        mock_result.abort.assert_called_once()

        # Assert experiment was deleted
        self.assertFalse(
            DifferentialExpressionExperiment.objects.filter(pk=experiment.pk).exists()
        )


class DifferentialExpressionListTestCase(TestCase):
    """Tests for DifferentialExpressionList endpoint"""

    def setUp(self):
        """Test setup"""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )

        # Create test files
        self.mrna_file = create_user_file(
            get_test_file_path('mrna_test.csv'),
            'mRNA Test',
            FileType.MRNA,
            self.user
        )
        self.clinical_file = create_user_file(
            get_test_file_path('clinical_test.csv'),
            'Clinical Test',
            FileType.CLINICAL,
            self.user
        )

        # Create sources
        self.mrna_source = create_differential_expression_source(self.mrna_file)
        self.clinical_source = create_differential_expression_clinical_source(self.clinical_file)

        # Create API client
        self.client = APIClient()

    def test_list_experiments_authenticated(self):
        """Test listing experiments when authenticated"""
        # Create some experiments
        create_test_differential_expression_experiment(
            name='Experiment 1',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.user,
            state=DifferentialExpressionExperimentState.COMPLETED
        )
        create_test_differential_expression_experiment(
            name='Experiment 2',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.user,
            state=DifferentialExpressionExperimentState.IN_PROCESS
        )

        # Authenticate
        self.client.force_authenticate(user=self.user)

        # Get list
        response = self.client.get('/differential-expression/')

        # Assert success
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_list_experiments_not_authenticated(self):
        """Test that unauthenticated users cannot list experiments"""
        # Don't authenticate
        response = self.client.get('/differential-expression/')

        # Assert forbidden (DRF returns 403 for unauthenticated requests)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class DifferentialExpressionUpdateTestCase(TestCase):
    """Tests for DifferentialExpressionUpdate endpoint"""

    def setUp(self):
        """Test setup"""
        # Create test users
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@test.com',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            username='other',
            email='other@test.com',
            password='testpass123'
        )

        # Create test files
        self.mrna_file = create_user_file(
            get_test_file_path('mrna_test.csv'),
            'mRNA Test',
            FileType.MRNA,
            self.owner
        )
        self.clinical_file = create_user_file(
            get_test_file_path('clinical_test.csv'),
            'Clinical Test',
            FileType.CLINICAL,
            self.owner
        )

        # Create sources
        self.mrna_source = create_differential_expression_source(self.mrna_file)
        self.clinical_source = create_differential_expression_clinical_source(self.clinical_file)

        # Create API client
        self.client = APIClient()

    def test_update_experiment_name_and_description_success(self):
        """Test successfully updating both name and description"""
        # Create experiment
        experiment = create_test_differential_expression_experiment(
            name='Original Name',
            description='Original Description',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.COMPLETED
        )

        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Update the experiment
        url = f'/differential-expression/update/{experiment.pk}/'
        data = {
            'name': 'Updated Name',
            'description': 'Updated Description'
        }
        response = self.client.patch(url, data, format='json')

        # Assert response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['ok'])
        self.assertEqual(response.data['data']['name'], 'Updated Name')
        self.assertEqual(response.data['data']['description'], 'Updated Description')

        # Assert experiment was updated in database
        experiment.refresh_from_db()
        self.assertEqual(experiment.name, 'Updated Name')
        self.assertEqual(experiment.description, 'Updated Description')

    def test_update_experiment_name_only_success(self):
        """Test successfully updating only the name"""
        # Create experiment
        experiment = create_test_differential_expression_experiment(
            name='Original Name',
            description='Original Description',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.COMPLETED
        )

        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Update only the name
        url = f'/differential-expression/update/{experiment.pk}/'
        data = {'name': 'New Name Only'}
        response = self.client.patch(url, data, format='json')

        # Assert response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['ok'])
        self.assertEqual(response.data['data']['name'], 'New Name Only')
        self.assertEqual(response.data['data']['description'], 'Original Description')

        # Assert experiment was updated in database
        experiment.refresh_from_db()
        self.assertEqual(experiment.name, 'New Name Only')
        self.assertEqual(experiment.description, 'Original Description')

    def test_update_experiment_description_only_success(self):
        """Test successfully updating only the description"""
        # Create experiment
        experiment = create_test_differential_expression_experiment(
            name='Original Name',
            description='Original Description',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.COMPLETED
        )

        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Update only the description
        url = f'/differential-expression/update/{experiment.pk}/'
        data = {'description': 'New Description Only'}
        response = self.client.patch(url, data, format='json')

        # Assert response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['ok'])
        self.assertEqual(response.data['data']['name'], 'Original Name')
        self.assertEqual(response.data['data']['description'], 'New Description Only')

        # Assert experiment was updated in database
        experiment.refresh_from_db()
        self.assertEqual(experiment.name, 'Original Name')
        self.assertEqual(experiment.description, 'New Description Only')

    def test_update_experiment_not_owner(self):
        """Test that non-owner cannot update experiment"""
        # Create experiment owned by owner
        experiment = create_test_differential_expression_experiment(
            name='Original Name',
            description='Original Description',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.COMPLETED
        )

        # Authenticate as other user
        self.client.force_authenticate(user=self.other_user)

        # Try to update the experiment
        url = f'/differential-expression/update/{experiment.pk}/'
        data = {'name': 'Hacked Name'}
        response = self.client.patch(url, data, format='json')

        # Assert forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(response.data['ok'])

        # Assert experiment was not updated
        experiment.refresh_from_db()
        self.assertEqual(experiment.name, 'Original Name')

    def test_update_experiment_no_fields_provided(self):
        """Test that update fails when no fields are provided"""
        # Create experiment
        experiment = create_test_differential_expression_experiment(
            name='Original Name',
            description='Original Description',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.COMPLETED
        )

        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Try to update with no fields
        url = f'/differential-expression/update/{experiment.pk}/'
        data = {}
        response = self.client.patch(url, data, format='json')

        # Assert bad request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['ok'])
        self.assertIn('at least one field', response.data['detail'].lower())

        # Assert experiment was not updated
        experiment.refresh_from_db()
        self.assertEqual(experiment.name, 'Original Name')
        self.assertEqual(experiment.description, 'Original Description')

    def test_update_experiment_not_authenticated(self):
        """Test that unauthenticated user cannot update experiment"""
        # Create experiment
        experiment = create_test_differential_expression_experiment(
            name='Original Name',
            description='Original Description',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.COMPLETED
        )

        # Don't authenticate

        # Try to update the experiment
        url = f'/differential-expression/update/{experiment.pk}/'
        data = {'name': 'Hacked Name'}
        response = self.client.patch(url, data, format='json')

        # Assert unauthorized
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Assert experiment was not updated
        experiment.refresh_from_db()
        self.assertEqual(experiment.name, 'Original Name')

    def test_update_experiment_not_found(self):
        """Test updating non-existent experiment returns 404"""
        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Try to update non-existent experiment
        url = '/differential-expression/update/99999/'
        data = {'name': 'New Name'}
        response = self.client.patch(url, data, format='json')

        # Assert not found
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_experiment_empty_name(self):
        """Test that updating experiment with empty name fails"""
        # Create experiment
        experiment = create_test_differential_expression_experiment(
            name='Original Name',
            description='Original Description',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.COMPLETED
        )

        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Try to update with empty name
        url = f'/differential-expression/update/{experiment.pk}/'
        data = {'name': ''}
        response = self.client.patch(url, data, format='json')

        # Assert bad request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['ok'])
        self.assertIn('cannot be empty', response.data['detail'].lower())

        # Assert experiment was not updated
        experiment.refresh_from_db()
        self.assertEqual(experiment.name, 'Original Name')

    def test_update_experiment_empty_description(self):
        """Test that updating experiment with empty description succeeds"""
        # Create experiment
        experiment = create_test_differential_expression_experiment(
            name='Original Name',
            description='Original Description',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.COMPLETED
        )

        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Update with empty description (should be allowed)
        url = f'/differential-expression/update/{experiment.pk}/'
        data = {'description': ''}
        response = self.client.patch(url, data, format='json')

        # Assert success (empty description is valid)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['ok'])
        self.assertEqual(response.data['data']['name'], 'Original Name')
        self.assertEqual(response.data['data']['description'], '')

        # Assert experiment was updated in database
        experiment.refresh_from_db()
        self.assertEqual(experiment.name, 'Original Name')
        self.assertEqual(experiment.description, '')

    def test_update_running_experiment(self):
        """Test that running experiment can be updated (only name/description, not execution)"""
        # Create a running experiment
        experiment = create_test_differential_expression_experiment(
            name='Running Experiment',
            description='Running Description',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.owner,
            state=DifferentialExpressionExperimentState.IN_PROCESS,
            task_id='test-task-id'
        )

        # Authenticate as owner
        self.client.force_authenticate(user=self.owner)

        # Update the experiment
        url = f'/differential-expression/update/{experiment.pk}/'
        data = {'name': 'Updated Name While Running'}
        response = self.client.patch(url, data, format='json')

        # Assert success (name/description can be updated even while running)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['ok'])
        self.assertEqual(response.data['data']['name'], 'Updated Name While Running')

        # Assert experiment was updated in database but state is still IN_PROCESS
        experiment.refresh_from_db()
        self.assertEqual(experiment.name, 'Updated Name While Running')
        self.assertEqual(experiment.state, DifferentialExpressionExperimentState.IN_PROCESS)
