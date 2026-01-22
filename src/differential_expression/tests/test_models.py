from django.test import TestCase
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
from user_files.models_choices import FileType
import pandas as pd


class DifferentialExpressionExperimentModelTestCase(TestCase):
    """Tests for DifferentialExpressionExperiment model"""

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

    def test_create_experiment(self):
        """Test creating a differential expression experiment"""
        experiment = create_test_differential_expression_experiment(
            name='Test Experiment',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.user
        )

        self.assertIsNotNone(experiment.id)
        self.assertEqual(experiment.name, 'Test Experiment')
        self.assertEqual(experiment.state, DifferentialExpressionExperimentState.WAITING_FOR_QUEUE)
        self.assertEqual(experiment.user, self.user)

    def test_experiment_str_representation(self):
        """Test string representation of experiment"""
        experiment = create_test_differential_expression_experiment(
            name='Test Experiment',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.user
        )

        self.assertEqual(
            str(experiment),
            'Differential Expression Experiment: Test Experiment'
        )

    def test_experiment_default_values(self):
        """Test experiment default values"""
        experiment = create_test_differential_expression_experiment(
            name='Test Experiment',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.user
        )

        self.assertEqual(experiment.threshold_percentile, 0.15)
        self.assertEqual(experiment.threshold, 0.0001)
        self.assertEqual(experiment.top, 100)
        self.assertEqual(experiment.attempt, 0)
        self.assertEqual(experiment.execution_time, 0.0)
        self.assertFalse(experiment.is_public)

    def test_save_and_retrieve_results(self):
        """Test saving and retrieving differential expression results"""
        experiment = create_test_differential_expression_experiment(
            name='Test Experiment',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.user,
            state=DifferentialExpressionExperimentState.COMPLETED
        )

        # Create test results dataframe
        results_data = {
            'AveExpr': [5.2, 6.1, 7.3],
            'P.Value': [0.001, 0.05, 0.0001],
            'adj.P.Val': [0.01, 0.1, 0.001],
            'logFC': [2.5, -1.8, 3.2],
            't': [4.5, -3.2, 5.1],
            'B': [2.1, 1.5, 3.2]
        }
        results_df = pd.DataFrame(results_data, index=['GENE_1', 'GENE_2', 'GENE_3'])

        # Save results
        experiment.save_results(results_df)

        # Retrieve results
        retrieved_df = experiment.get_results_dataframe()

        # Assert results were saved correctly
        self.assertIsNotNone(retrieved_df)
        self.assertEqual(len(retrieved_df), 3)
        self.assertEqual(set(retrieved_df.index), {'GENE_1', 'GENE_2', 'GENE_3'})

        # Check specific values
        self.assertAlmostEqual(retrieved_df.loc['GENE_1', 'AveExpr'], 5.2, places=1)
        self.assertAlmostEqual(retrieved_df.loc['GENE_1', 'logFC'], 2.5, places=1)

    def test_get_significant_genes(self):
        """Test getting significant genes"""
        experiment = create_test_differential_expression_experiment(
            name='Test Experiment',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.user,
            state=DifferentialExpressionExperimentState.COMPLETED
        )

        # Create test results
        DifferentialExpressionExperimentResult.objects.create(
            experiment=experiment,
            gene='GENE_1',
            ave_expr=5.2,
            p_value=0.001,
            adj_p_val=0.01,
            log_fc=2.5,
            t_statistic=4.5,
            b_statistic=2.1
        )
        DifferentialExpressionExperimentResult.objects.create(
            experiment=experiment,
            gene='GENE_2',
            ave_expr=6.1,
            p_value=0.05,
            adj_p_val=0.1,
            log_fc=-0.5,
            t_statistic=-1.2,
            b_statistic=1.5
        )
        DifferentialExpressionExperimentResult.objects.create(
            experiment=experiment,
            gene='GENE_3',
            ave_expr=7.3,
            p_value=0.0001,
            adj_p_val=0.001,
            log_fc=3.2,
            t_statistic=5.1,
            b_statistic=3.2
        )

        # Get significant genes with default thresholds (p_value <= 0.05, |log_fc| >= 1.0)
        significant_genes = experiment.get_significant_genes(
            p_value_threshold=0.05,
            log_fc_threshold=1.0
        )

        # Should return GENE_1 and GENE_3 (both have adj_p_val <= 0.05 and |log_fc| >= 1.0)
        self.assertEqual(significant_genes.count(), 2)
        gene_names = [result.gene for result in significant_genes]
        self.assertIn('GENE_1', gene_names)
        self.assertIn('GENE_3', gene_names)

    def test_delete_experiment_cascades(self):
        """Test that deleting experiment cascades to results"""
        experiment = create_test_differential_expression_experiment(
            name='Test Experiment',
            clinical_source=self.clinical_source,
            mrna_source=self.mrna_source,
            user=self.user,
            state=DifferentialExpressionExperimentState.COMPLETED
        )

        # Create test results
        DifferentialExpressionExperimentResult.objects.create(
            experiment=experiment,
            gene='GENE_1',
            ave_expr=5.2,
            p_value=0.001,
            adj_p_val=0.01,
            log_fc=2.5,
            t_statistic=4.5,
            b_statistic=2.1
        )

        experiment_id = experiment.id

        # Delete experiment
        experiment.delete()

        # Assert experiment and results were deleted
        self.assertFalse(
            DifferentialExpressionExperiment.objects.filter(pk=experiment_id).exists()
        )
        self.assertFalse(
            DifferentialExpressionExperimentResult.objects.filter(
                experiment_id=experiment_id
            ).exists()
        )


class DifferentialExpressionSourceModelTestCase(TestCase):
    """Tests for DifferentialExpressionSource models"""

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

    def test_create_mrna_source(self):
        """Test creating an mRNA source"""
        source = create_differential_expression_source(self.mrna_file)

        self.assertIsNotNone(source.id)
        self.assertEqual(source.user_file, self.mrna_file)

    def test_create_clinical_source(self):
        """Test creating a clinical source"""
        source = create_differential_expression_clinical_source(self.clinical_file)

        self.assertIsNotNone(source.id)
        self.assertEqual(source.user_file, self.clinical_file)

    def test_get_samples_from_mrna_source(self):
        """Test getting samples from mRNA source"""
        source = create_differential_expression_source(self.mrna_file)

        samples = source.get_samples()

        # Based on mrna_test.csv (6 TCGA samples as columns)
        self.assertEqual(len(samples), 6)
        self.assertIn('TCGA-OR-A5J1-01', samples)
        self.assertIn('TCGA-OR-A5J8-01', samples)

    def test_get_samples_from_clinical_source(self):
        """Test getting samples from clinical source"""
        source = create_differential_expression_clinical_source(self.clinical_file)

        samples = source.get_samples()

        # Based on clinical_test.csv (6 TCGA samples as row indices - PATIENT_ID)
        self.assertEqual(len(samples), 6)
        self.assertIn('TCGA-OR-A5J1', samples)
        self.assertIn('TCGA-OR-A5J8', samples)

    def test_get_clinical_attributes(self):
        """Test getting clinical attributes"""
        source = create_differential_expression_clinical_source(self.clinical_file)

        attributes = source.get_attributes()

        # Based on clinical_test.csv (OTHER_PATIENT_ID, SEX, OS_STATUS, OS_MONTHS, SAMPLE_ID, OTHER_SAMPLE_ID)
        self.assertEqual(len(attributes), 6)
        self.assertIn('SEX', attributes)
        self.assertIn('OS_STATUS', attributes)
        self.assertIn('OS_MONTHS', attributes)
        self.assertIn('SAMPLE_ID', attributes)
