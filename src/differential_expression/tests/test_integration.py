"""
Integration tests for differential expression analysis.
These tests execute the full pipeline including the Celery task and R/limma analysis.
"""
from unittest.mock import patch
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from common.tests_utils import create_user_file
from differential_expression.models import (
    DifferentialExpressionExperiment,
    DifferentialExpressionExperimentState,
    DifferentialExpressionExperimentResult
)
from differential_expression.tests.test_utils import (
    get_test_file_path,
    create_differential_expression_source,
    create_differential_expression_clinical_source,
    create_test_differential_expression_experiment
)
from differential_expression.tasks import eval_differential_expression_experiment
from user_files.models_choices import FileType


def mock_is_aborted():
    """Mock is_aborted to always return False for testing."""
    return False


@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
    CELERY_TASK_EAGER_PROPAGATES=True
)
@patch.object(eval_differential_expression_experiment, 'is_aborted', mock_is_aborted)
class DifferentialExpressionIntegrationTestCase(TestCase):
    """
    Integration tests that execute the full differential expression pipeline.
    Uses CELERY_TASK_ALWAYS_EAGER to run Celery tasks synchronously.
    """

    def setUp(self):
        """Test setup"""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )

        # Create test files with real TCGA data
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

    def test_full_differential_expression_analysis_by_sex(self):
        """
        Test the complete differential expression analysis pipeline.
        Analyzes gene expression differences between Male and Female samples.
        """
        # Create experiment with SEX as the clinical attribute
        experiment = create_test_differential_expression_experiment(
            name='Integration Test - Sex Analysis',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.user,
            clinical_attribute='SEX',
            state=DifferentialExpressionExperimentState.WAITING_FOR_QUEUE
        )

        # Verify initial state
        self.assertEqual(experiment.state, DifferentialExpressionExperimentState.WAITING_FOR_QUEUE)
        self.assertEqual(experiment.attempt, 0)

        # Execute the Celery task synchronously
        eval_differential_expression_experiment(experiment.pk)

        # Refresh from database
        experiment.refresh_from_db()

        # Verify the experiment completed successfully
        self.assertEqual(
            experiment.state,
            DifferentialExpressionExperimentState.COMPLETED,
            f"Experiment should be COMPLETED but is {experiment.get_state_display()}"
        )
        self.assertEqual(experiment.attempt, 1)
        self.assertGreater(experiment.execution_time, 0)

        # Verify results were saved
        results_count = experiment.results.count()
        self.assertGreater(results_count, 0, "Should have differential expression results")

        # Verify result structure
        first_result = experiment.results.first()
        self.assertIsNotNone(first_result.gene)
        self.assertIsNotNone(first_result.p_value)
        self.assertIsNotNone(first_result.adj_p_val)
        self.assertIsNotNone(first_result.log_fc)

    def test_differential_expression_results_dataframe(self):
        """
        Test that results can be retrieved as a pandas DataFrame.
        """
        # Create and run experiment
        experiment = create_test_differential_expression_experiment(
            name='Integration Test - DataFrame Results',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.user,
            clinical_attribute='SEX',
            state=DifferentialExpressionExperimentState.WAITING_FOR_QUEUE
        )

        # Execute the task
        eval_differential_expression_experiment(experiment.pk)

        # Refresh and get results as DataFrame
        experiment.refresh_from_db()
        results_df = experiment.get_results_dataframe()

        # Verify DataFrame structure
        self.assertIsNotNone(results_df)
        self.assertGreater(len(results_df), 0)

        # Check expected columns
        expected_columns = ['AveExpr', 'P.Value', 'adj.P.Val', 'logFC', 't', 'B']
        for col in expected_columns:
            self.assertIn(col, results_df.columns, f"Missing column: {col}")

        # Verify genes are in the index
        self.assertTrue(len(results_df.index) > 0, "DataFrame should have genes as index")

    def test_differential_expression_significant_genes(self):
        """
        Test filtering for significant differentially expressed genes.
        """
        # Create and run experiment
        experiment = create_test_differential_expression_experiment(
            name='Integration Test - Significant Genes',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.user,
            clinical_attribute='SEX',
            state=DifferentialExpressionExperimentState.WAITING_FOR_QUEUE
        )

        # Execute the task
        eval_differential_expression_experiment(experiment.pk)

        # Refresh from database
        experiment.refresh_from_db()
        self.assertEqual(experiment.state, DifferentialExpressionExperimentState.COMPLETED)

        # Test get_significant_genes with relaxed thresholds for test data
        significant_genes = experiment.get_significant_genes(
            p_value_threshold=1.0,  # Relaxed for small test dataset
            log_fc_threshold=0.0
        )

        # Should return some results (we use relaxed thresholds)
        self.assertIsNotNone(significant_genes)

    def test_experiment_state_transitions(self):
        """
        Test that experiment goes through correct state transitions.
        """
        # Create experiment
        experiment = create_test_differential_expression_experiment(
            name='Integration Test - State Transitions',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.user,
            clinical_attribute='SEX',
            state=DifferentialExpressionExperimentState.WAITING_FOR_QUEUE
        )

        # Initial state
        self.assertEqual(experiment.state, DifferentialExpressionExperimentState.WAITING_FOR_QUEUE)

        # Execute task
        eval_differential_expression_experiment(experiment.pk)

        # Final state should be COMPLETED
        experiment.refresh_from_db()
        self.assertEqual(experiment.state, DifferentialExpressionExperimentState.COMPLETED)

        # Attempt should be incremented
        self.assertEqual(experiment.attempt, 1)

    def test_experiment_execution_time_recorded(self):
        """
        Test that execution time is recorded after analysis.
        """
        # Create experiment
        experiment = create_test_differential_expression_experiment(
            name='Integration Test - Execution Time',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.user,
            clinical_attribute='SEX',
            state=DifferentialExpressionExperimentState.WAITING_FOR_QUEUE
        )

        # Initial execution time should be 0
        self.assertEqual(experiment.execution_time, 0.0)

        # Execute task
        eval_differential_expression_experiment(experiment.pk)

        # Execution time should be recorded
        experiment.refresh_from_db()
        self.assertGreater(experiment.execution_time, 0)