import os
from django.test import TestCase
from api_service.models import ExperimentSource, Experiment, GeneMiRNACombination
from api_service.pipelines import global_pipeline_manager
from statistical_properties.statistics_utils import compute_source_statistical_properties, COMMON_DECIMAL_PLACES,\
    P_VALUES_DECIMAL_PLACES
from common.tests_utils import create_experiment_source, create_user_file, create_toy_experiment
from user_files.models import UserFile
from user_files.models_choices import FileType
from django.contrib.auth.models import User
# TODO: put these tests in statistical_properties app with others datasets


class GeneGEMTestCase(TestCase):
    # UserFiles
    mrna_normal: UserFile
    mirna_normal: UserFile

    # ExperimentSources
    mrna_normal_source: ExperimentSource
    mirna_normal_source: ExperimentSource

    # Experiment
    mrna_mirna_experiment: Experiment

    # mRNaxGEM combination
    mrna_mirna_combination: GeneMiRNACombination

    # User
    user: User

    @staticmethod
    def __get_file_path(filename: str) -> str:
        """
        Gets the absolute file's path in test folder
        @param filename: File's name
        @return: Absolute path to the file in test folder
        """
        dir_name = os.path.dirname(__file__)
        file_path = os.path.join(dir_name, f'tests_files/{filename}')
        return file_path

    def setUp(self):
        """Test setup"""
        self.user = User.objects.create_user(username='test_user', email='test@test.com', password='test')

        # UserFiles
        self.mrna_normal = create_user_file(
            self.__get_file_path('mRNA_normal.csv'),
            'mRNA normal',
            FileType.MRNA,
            self.user
        )

        self.mirna_normal = create_user_file(
            self.__get_file_path('miRNA_normal.csv'),
            'miRNA normal',
            FileType.MIRNA,
            self.user
        )

        # ExperimentSources
        self.mrna_normal_source = create_experiment_source(user_file=self.mrna_normal)
        self.mirna_normal_source = create_experiment_source(user_file=self.mirna_normal)

        # Experiment
        self.mrna_mirna_experiment = create_toy_experiment(self.mrna_normal_source, self.mirna_normal_source, self.user)

        self.mrna_mirna_combination = GeneMiRNACombination.objects.create(
            gene='AADAT',
            gem='hsa-mir-676',
            correlation=0.0,  # Not needed
            p_value=0.0,  # Not needed
            adjusted_p_value=0.0,
            experiment=self.mrna_mirna_experiment
        )

    def test_statistical_props(self):
        """Tests statistical properties computing"""
        gene = self.mrna_mirna_combination.gene_name
        gem = self.mrna_mirna_combination.gem
        gene_data, gem_data, gene_samples, gem_samples = global_pipeline_manager.get_valid_data_from_sources(
            self.mrna_mirna_combination.experiment,
            gene,
            gem,
            round_values=False,
            return_samples_identifiers=True
        )
        stats = compute_source_statistical_properties(gene_data, gem_data, gene_samples, gem_samples)

        # Assertions

        # All the statistical props must be computed from samples in common only
        samples_in_common = global_pipeline_manager.get_common_samples(
            self.mrna_normal_source,
            self.mirna_normal_source
        )
        self.assertEqual(gene_data.size, gem_data.size)
        self.assertEqual(stats.number_of_samples_evaluated, samples_in_common.size)

        # NOTE: all the metrics computed from R or Excel functions
        # Mean
        self.assertAlmostEqual(stats.gene_mean, 5.098, places=COMMON_DECIMAL_PLACES)
        self.assertAlmostEqual(stats.gem_mean, 0.602, places=COMMON_DECIMAL_PLACES)

        # Standard deviation
        self.assertAlmostEqual(stats.gene_standard_deviation, 0.79189, places=COMMON_DECIMAL_PLACES)
        self.assertAlmostEqual(stats.gem_standard_deviation, 0.19353, places=COMMON_DECIMAL_PLACES)

        # Shapiro-Wilk test. TODO: p-values need more samples
        self.assertAlmostEqual(stats.gene_normality.statistic, 0.996212, places=COMMON_DECIMAL_PLACES)
        self.assertAlmostEqual(stats.gem_normality.statistic, 0.985240, places=COMMON_DECIMAL_PLACES)

        # Heteroscedasticity (Breusch Pagan)
        bp = stats.heteroscedasticity_breusch_pagan
        self.assertAlmostEqual(bp.lagrange_multiplier, 0.10072, places=COMMON_DECIMAL_PLACES)
        self.assertAlmostEqual(bp.p_value, 0.75095, places=P_VALUES_DECIMAL_PLACES)
        self.assertAlmostEqual(bp.f_value, 0.03474, places=COMMON_DECIMAL_PLACES)
        self.assertAlmostEqual(bp.f_p_value, 0.88268, places=P_VALUES_DECIMAL_PLACES)

        # Homoscedasticity (Goldfeld Quandt). # FIXME: needs more info in source to compute
        # gq = stats.homoscedasticity_goldfeld_quandt
        # self.assertAlmostEqual(gp.statistic,)
        # self.assertAlmostEqual(gp.p_value,)
