import os
from typing import Optional, List, cast, Set
from django.test import TestCase, Client
import numpy as np
from api_service.enums import CorrelationGraphStatusErrorCode
from api_service.models import ExperimentSource, Experiment
from api_service.models_choices import ExperimentState
from api_service.pipelines import global_pipeline_manager
from api_service.task_queue import global_task_queue
from common.constants import GEM_INDEX_NAME, GENE_INDEX_NAME
from common.enums import ResponseCode
from common.methylation import MethylationPlatform, map_cpg_to_genes_df, get_cpg_from_cpg_format_gem
from common.tests_utils import create_experiment_source, create_user_file, create_toy_experiment
from user_files.models import UserFile
from user_files.models_choices import FileType
from django.contrib.auth.models import User
import pandas as pd

# Some useful constants
SAMPLES_IN_COMMON_MRNA_METHYLATION_GENES = 5
SAMPLES_IN_COMMON_MRNA_MIRNA = 3
USER_PASSWORD = 'test'


class ExperimentTestCase(TestCase):
    # UserFiles
    mrna_normal: UserFile
    mirna_normal: UserFile
    mirna_no_samples_in_common: UserFile
    some_nans: UserFile
    methylation_genes: UserFile
    methylation_450: UserFile

    # ExperimentSources
    mrna_normal_source: ExperimentSource
    mirna_normal_source: ExperimentSource
    mirna_no_samples_in_common_source: ExperimentSource
    some_nans_source: ExperimentSource
    methylation_genes_source: ExperimentSource
    methylation_450_source: ExperimentSource

    # Experiment
    mrna_mirna_experiment: Experiment
    mrna_methylation_genes_experiment: Experiment
    mrna_methylation_450_experiment: Experiment

    # DTypes
    cor_dtype: np.dtype
    p_value_dtype: np.dtype

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
        # DTypes
        self.cor_dtype = global_pipeline_manager.get_common_dtype(np.float16)
        self.p_value_dtype = global_pipeline_manager.get_common_dtype(np.float64)

        # Creates a test user
        self.user = User.objects.create_user(username='test_user', email='test@test.com', password=USER_PASSWORD)

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
        self.mirna_no_samples_in_common = create_user_file(
            self.__get_file_path('miRNA_no_samples_in_common.csv'),
            'miRNA normal',
            FileType.MIRNA,
            self.user
        )
        self.some_nans = create_user_file(
            self.__get_file_path('Some NaNs.csv'),
            'Some NaNs',
            FileType.MRNA,
            self.user
        )
        self.methylation_genes = create_user_file(
            self.__get_file_path('Methylation_genes.csv'),
            'Methylation with genes',
            FileType.METHYLATION,
            self.user
        )
        self.methylation_450 = create_user_file(
            self.__get_file_path('Methylation_450_platform.csv'),
            'Methylation 450 platform',
            FileType.METHYLATION, self.user,
            is_cpg_site_id=True,
            platform=MethylationPlatform.PLATFORM_450
        )

        # ExperimentSources
        self.mrna_normal_source = create_experiment_source(user_file=self.mrna_normal)
        self.mirna_normal_source = create_experiment_source(user_file=self.mirna_normal)
        self.mirna_no_samples_in_common_source = create_experiment_source(
            user_file=self.mirna_no_samples_in_common
        )
        self.some_nans_source = create_experiment_source(user_file=self.some_nans)
        self.methylation_450_source = create_experiment_source(user_file=self.methylation_450)
        self.methylation_genes_source = create_experiment_source(user_file=self.methylation_genes)

        # Experiment
        self.mrna_mirna_experiment = create_toy_experiment(self.mrna_normal_source, self.mirna_normal_source, self.user)
        self.mrna_methylation_genes_experiment = create_toy_experiment(
            self.mrna_normal_source,
            self.methylation_genes_source,
            self.user
        )
        self.mrna_methylation_450_experiment = create_toy_experiment(
            self.mrna_normal_source,
            self.methylation_450_source,
            self.user
        )

    def test_number_of_rows_and_samples(self):
        """Checks the correct functionality of number of rows and samples computing"""
        self.assertEqual(self.mrna_normal.number_of_rows, 15)
        self.assertEqual(self.mrna_normal.number_of_samples, 14)

        self.assertEqual(self.mirna_normal.number_of_rows, 30)
        self.assertEqual(self.mirna_normal.number_of_samples, 6)

        self.assertEqual(self.some_nans.number_of_rows, 13)
        self.assertEqual(self.some_nans.number_of_samples, 7)

        self.assertEqual(self.methylation_450.number_of_rows, 50)
        self.assertEqual(self.methylation_450.number_of_samples, 25)

    def test_contains_nan_values(self):
        """Checks the correct functionality of NaNs values detection"""
        self.assertFalse(self.mrna_normal.contains_nan_values)
        self.assertFalse(self.mirna_normal.contains_nan_values)
        self.assertTrue(self.some_nans.contains_nan_values)
        self.assertFalse(self.methylation_450.contains_nan_values)

    def __test_samples_in_common(
            self,
            source_1: ExperimentSource,
            source_2: ExperimentSource,
            expected_number_samples_in_common: int,
            expected_samples_in_common: Optional[Set[str]] = None
    ):
        samples_in_common: List[str] = cast(
            List,
            global_pipeline_manager.get_common_samples(source_1, source_2).tolist()
        )

        self.assertEqual(len(samples_in_common), expected_number_samples_in_common)

        if expected_samples_in_common is not None:
            self.assertEqual(set(samples_in_common), expected_samples_in_common)

    def test_samples_in_common(self):
        """Tests the computing of samples in common between two datasets"""
        # Two different datasets
        self.__test_samples_in_common(
            self.mrna_normal_source,
            self.mirna_normal_source,
            SAMPLES_IN_COMMON_MRNA_MIRNA,
            {'TCGA-A1-A0SF-01', 'TCGA-3C-AALK-01', 'TCGA-5L-AAT0-01'}
        )

        # The same source all samples in common
        self.__test_samples_in_common(
            self.mrna_normal_source,
            self.mrna_normal_source,
            len(self.mrna_normal_source.get_samples())
        )

        # No samples in common
        self.__test_samples_in_common(self.mrna_normal_source, self.some_nans_source, 0)

        # With Methylation genes
        self.__test_samples_in_common(
            self.mrna_normal_source,
            self.methylation_genes_source,
            SAMPLES_IN_COMMON_MRNA_METHYLATION_GENES
        )

    def test_prepare_df_and_correlation(self):
        """Tests correlation and p-values calculation"""
        mrna_normal_df = self.mrna_normal_source.get_df()
        samples_in_common = global_pipeline_manager.get_common_samples(self.mrna_normal_source,
                                                                       self.mirna_normal_source)

        # No results as thresholds is bigger than 1
        # FIXME: remove or edit after analyze if std has to be normalized in [0 - 1] range
        # mrna_normal_prepared_df = global_pipeline_manager.prepare_df(mrna_normal_df, 1.000001, samples_in_common, 'mRNA')
        # self.assertTrue(mrna_normal_prepared_df.empty)

        # No filter applies as thresholds is 0
        mrna_normal_prepared_df = global_pipeline_manager.prepare_df(mrna_normal_df, 0, samples_in_common, 'mRNA')
        mrna_normal_prepared_df_row_count = len(mrna_normal_prepared_df.index)
        self.assertEqual(mrna_normal_prepared_df_row_count, self.mrna_normal_source.number_of_rows)

        # Prepares miRNAs to test correlation
        mirna_normal_df = self.mirna_normal_source.get_df()
        mirna_normal_prepared_df = global_pipeline_manager.prepare_df(mirna_normal_df, 0, samples_in_common, 'miRNA')

        correlation, p_values = global_pipeline_manager.get_correlation_and_p_values(self.cor_dtype, self.p_value_dtype,
                                                                                     'pearson',
                                                                                     mrna_normal_prepared_df,
                                                                                     mirna_normal_prepared_df)

        # Checks NaNs values
        number_of_nans_correlation = np.count_nonzero(~np.isnan(correlation))
        number_of_nans_p_values = np.count_nonzero(~np.isnan(p_values))

        self.assertEqual(number_of_nans_correlation, number_of_nans_p_values)

        # Creates multi-index
        multi_index = np.array(
            pd.MultiIndex.from_product((mirna_normal_prepared_df.index, mrna_normal_prepared_df.index)).values,
            dtype=[(GEM_INDEX_NAME, 'object'), (GENE_INDEX_NAME, 'object')]
        )

        # Drops NaNs values
        valid_rows = ~np.isnan(correlation)
        multi_index = multi_index[valid_rows]
        correlation = correlation[valid_rows]
        p_values = p_values[valid_rows]

        # Creates a DataFrame to sort and compare with R result
        multiomics_result_df = pd.DataFrame(data={
            'Gene': multi_index[GENE_INDEX_NAME],
            'Mature miRNA': multi_index[GEM_INDEX_NAME],
            'correlation': correlation,
            'p-value': p_values,
            'adj-p-value': np.empty(p_values.shape)
        }).sort_values(['Gene', 'Mature miRNA'])  # In R is sorted by 'Gene' and 'Mature miRNA' keys

        # Gets R result
        r_result_file_path = self.__get_file_path('mRNA_normal_miRNA_normal_R_result.csv')
        r_result_df = pd.read_csv(r_result_file_path, sep='\t', index_col=0, dtype={
            'Gene': str, 'Mature miRNA': str, 'correlation': float, 'p-value': float, 'adj-p-value': str
        })

        # Gets Numpy arrays
        multiomics_correlation = multiomics_result_df['correlation'].values
        r_correlation = r_result_df['correlation'].values

        multiomics_p_values = multiomics_result_df['p-value'].values
        r_p_values = r_result_df['p-value'].values

        # Checks that all the values are closer
        correlations_are_all_true = np.isclose(multiomics_correlation, r_correlation, rtol=1e-03).all()
        self.assertTrue(correlations_are_all_true)

        p_values_are_all_true = np.isclose(multiomics_p_values, r_p_values, rtol=1e-02).all()
        self.assertTrue(p_values_are_all_true)

    def test_methylation(self):
        """Tests Methylation experiments with and without CpG site IDs"""
        # No platform (with genes)
        self.assertIsNone(self.methylation_genes_source.get_methylation_platform_df())

        # Tests with genes
        methylation_genes_source_df = self.methylation_genes_source.get_df()
        self.__test_methylation_experiment(
            mrna_source=self.mrna_normal_source,
            methylation_source=self.methylation_genes_source,
            methylation_mapped_df=methylation_genes_source_df,
            cor_dtype=self.cor_dtype,
            p_value_dtype=self.p_value_dtype,
            mapped_genes=methylation_genes_source_df.index.values,  # No CpG, so sends original index
            result_all_vs_all_rows=285,  # 15 rows (mRNA) x 19 rows (Methylation)
            result_after_filter_rows=0  # No matching genes
        )

        # Tests with CpG site IDs
        # Gets platform DataFrame
        platform_df = self.methylation_450_source.get_methylation_platform_df()
        self.assertIsNotNone(platform_df)

        # Maps CpG site IDs to genes
        methylation_450_df = self.methylation_450.get_df()
        methylation_450_df, mapped_genes_450 = map_cpg_to_genes_df(methylation_450_df, platform_df)

        # IMPORTANT: join() does not preserve original index order
        all_equals = np.array_equal(
            mapped_genes_450,
            [
                '105_BMP4', 'ATP2A1', '40975', 'MARCH7', '1/2-SBSRNA4', 'SEC24B', 'LOC90834', 'ALG3', 'ECE2', '40975',
                'MARCH7', '40972', 'ECE1', 'EIF4G3', 'C11orf2', 'MARCH11', '40979', 'ECHDC1', 'ECHDC3', 'C11orf1',
                'FDXACB1', '40976', 'MARCH8', '40970', 'MOSC2', 'C11orf17', 'ST5', 'AKIP1', 'RGS1', '41153', '41164',
                'LOC440335', '37500', '41154', 'HDLBP', 'ECEL1P2', '40974', 'MARCH3', '40971', 'BC020196', 'C11orf10',
                'MARCH1', 'ANP32C', '40977', 'MARCH9', 'C10orf96', 'DEC1', '41244', '1/2-SBSRNA4', 'SEC24B', 'SEPT11',
                '41163', 'NR4A2', 'MARCH11', '40979', 'SEPT13', 'SEPT7P2', 'MARCH10', '40978', 'SEPT14', 'CO9',
                'MARCH1', '40969', 'Mir_584', 'SEPT1', '41153', 'C10orf95', '40978', 'MARCH10', 'MARCH1', '40969',
                'HOXA4', 'ECH1', 'ECD', 'FAM149B1', 'SEPT11', '41163', '40973', 'CPEB3', 'MARCH5', 'C11orf10', 'FEN1',
                'MIR611', '40975', 'MARCH7', 'C10orf99', 'MARCH3', '40971', 'HOXA4'
            ]
        )
        self.assertTrue(all_equals)

        self.__test_methylation_experiment(
            mrna_source=self.mrna_normal_source,
            methylation_source=self.methylation_450_source,
            methylation_mapped_df=methylation_450_df,
            cor_dtype=self.cor_dtype,
            p_value_dtype=self.p_value_dtype,
            mapped_genes=mapped_genes_450,
            result_all_vs_all_rows=15 * mapped_genes_450.shape[0],  # 15 rows (mRNA) x rows (mapped Methylation's genes)
            result_after_filter_rows=1  # Only 1 matching gene
        )

    def __test_methylation_experiment(
            self,
            mrna_source: ExperimentSource,
            methylation_source: ExperimentSource,
            methylation_mapped_df: pd.DataFrame,
            cor_dtype: np.dtype,
            p_value_dtype: np.dtype,
            mapped_genes: np.ndarray,
            result_all_vs_all_rows: int,
            result_after_filter_rows: int
    ):
        """Checks some Methylation experiment's stuff"""
        samples_in_common_methylation = global_pipeline_manager.get_common_samples(
            mrna_source,
            methylation_source
        )

        # Prepares mRNA and Methylation datasets
        mrna_df = mrna_source.get_df()
        mrna_methylation_prepared_df = global_pipeline_manager.prepare_df(
            mrna_df,
            0.0,
            samples_in_common_methylation,
            'mRNA'
        )

        methylation_genes_prepared_df = global_pipeline_manager.prepare_df(
            methylation_mapped_df,
            0.0,
            samples_in_common_methylation,
            'Methylation'
        )

        # Correlates
        correlation_methylation, p_values_methylation = global_pipeline_manager.get_correlation_and_p_values(
            cor_dtype,
            p_value_dtype,
            'pearson',
            mrna_methylation_prepared_df,
            methylation_genes_prepared_df
        )

        # Makes MultiIndex to test filtering
        multi_index_methylation = np.array(
            pd.MultiIndex.from_product(
                (methylation_genes_prepared_df.index, mrna_methylation_prepared_df.index)
            ).values,
            dtype=[(GEM_INDEX_NAME, 'object'), (GENE_INDEX_NAME, 'object')]
        )

        # Case 1: all vs all
        self.assertEqual(correlation_methylation.shape[0], result_all_vs_all_rows)

        # Case 2: matching only
        cor_filtered, multi_idx_filtered, p_value_filtered = global_pipeline_manager.filter_only_matching_genes(
            correlation_methylation,
            mrna_methylation_prepared_df,
            mapped_genes,
            multi_index_methylation,
            p_values_methylation
        )

        # Checks number of rows after filtering. All the three values must be the same
        self.assertEqual(cor_filtered.shape[0], result_after_filter_rows)
        self.assertEqual(multi_idx_filtered.shape[0], result_after_filter_rows)
        self.assertEqual(p_value_filtered.shape[0], result_after_filter_rows)

    def test_run_experiment(self):
        """Tests some experiment errors"""
        # FIXME: normal experiments can't be tested because the issue of flat SQL statements to optimize, we can't test
        # FIXME: that the insertions are right unless we add testing checks that degrade the performance of the system
        no_samples_in_common = create_toy_experiment(
            self.mrna_normal_source,
            self.mirna_no_samples_in_common_source,
            self.user
        )

        global_task_queue.eval_mrna_gem_experiment(no_samples_in_common)

        self.assertEqual(no_samples_in_common.state, ExperimentState.NO_SAMPLES_IN_COMMON)

    def test_cpg_extraction(self):
        """Tests some CpG utils"""
        correct_value = 'cg26841048'
        valid = 'HOXB2 (cg26841048)'
        valid_2 = 'HOXB2 - [cg26841048] Some extra text'
        non_valid = 'HOXB2'
        non_valid_2 = 'Non valid CpG identifier to extract'

        self.assertEqual(get_cpg_from_cpg_format_gem(valid), correct_value)
        self.assertEqual(get_cpg_from_cpg_format_gem(valid_2), correct_value)
        self.assertRaises(KeyError, get_cpg_from_cpg_format_gem, non_valid)
        self.assertRaises(KeyError, get_cpg_from_cpg_format_gem, non_valid_2)

    def __test_correlation_graph_api(
            self,
            client: Client,
            experiment_id: int,
            valid_gene: Optional[str],
            valid_gem: Optional[str],
            must_be_successful: bool,
            expected_number_of_genes_and_gem: Optional[int] = None,
            expected_internal_code: Optional[CorrelationGraphStatusErrorCode] = None
    ):
        url = f'/api-service/correlation-graph?experimentId={experiment_id}'
        if valid_gene is not None:
            url += f'&gene={valid_gene}'

        if valid_gem is not None:
            url += f'&gem={valid_gem}'

        response = client.get(url)

        # 200 as it's not a custom response and not a Django Rest Framework one
        self.assertEqual(response.status_code, 200)

        # Custom response
        json_response = response.json()
        self.assertIn('status', json_response)
        status_response = json_response['status']
        code = int(status_response['code'])
        internal_code = status_response['internal_code']

        # Tests different cases
        if must_be_successful:
            self.assertEqual(code, ResponseCode.SUCCESS.value)
            self.assertIsNone(internal_code)
            self.assertIn('data', json_response)

            # Checks data
            json_data = json_response['data']
            self.assertIn('gene', json_data)
            self.assertIn('gem', json_data)

            # Genes and GEM must be equal!
            self.assertEqual(len(json_data['gene']), expected_number_of_genes_and_gem)
            self.assertEqual(len(json_data['gem']), expected_number_of_genes_and_gem)
        else:
            self.assertEqual(code, ResponseCode.ERROR.value)
            self.assertEqual(int(internal_code), expected_internal_code.value)

    def test_correlation_graph(self):
        """Tests correlation graph functions"""
        client = Client()
        client.login(username=self.user.username, password=USER_PASSWORD)

        # Valid request and response
        self.__test_correlation_graph_api(
            client,
            self.mrna_mirna_experiment.pk,
            'RGS1',
            'hsa-mir-433',
            must_be_successful=True,
            # No NaNs, so it must be equal to samples in common
            expected_number_of_genes_and_gem=SAMPLES_IN_COMMON_MRNA_MIRNA
        )

        # Params not present
        self.__test_correlation_graph_api(
            client,
            self.mrna_mirna_experiment.pk,
            'RGS1',
            None,
            must_be_successful=False,
            expected_internal_code=CorrelationGraphStatusErrorCode.INVALID_PARAMS
        )

        self.__test_correlation_graph_api(
            client,
            self.mrna_mirna_experiment.pk,
            None,
            'hsa-mir-433',
            must_be_successful=False,
            expected_internal_code=CorrelationGraphStatusErrorCode.INVALID_PARAMS
        )

        # Invalid params values
        self.__test_correlation_graph_api(
            client,
            self.mrna_mirna_experiment.pk,
            'non-valid-gene',
            'hsa-mir-433',
            must_be_successful=False,
            expected_internal_code=CorrelationGraphStatusErrorCode.INVALID_GENE_OR_GEM_NAMES
        )

        self.__test_correlation_graph_api(
            client,
            self.mrna_mirna_experiment.pk,
            'RGS1',
            'non-valid-mirna',
            must_be_successful=False,
            expected_internal_code=CorrelationGraphStatusErrorCode.INVALID_GENE_OR_GEM_NAMES
        )

        # Methylation with genes
        self.__test_correlation_graph_api(
            client,
            self.mrna_methylation_genes_experiment.pk,
            'RGS1',
            'JAK1',
            must_be_successful=True,
            expected_number_of_genes_and_gem=SAMPLES_IN_COMMON_MRNA_METHYLATION_GENES,
        )

        # Methylation with CpG site IDs
        self.__test_correlation_graph_api(
            client,
            self.mrna_methylation_450_experiment.pk,
            'RGS1',
            'Gene-Example (cg01427435)',  # Gene-Example must be ignored by the system
            must_be_successful=True,
            expected_number_of_genes_and_gem=13
        )

        self.__test_correlation_graph_api(
            client,
            self.mrna_methylation_450_experiment.pk,
            'RGS1',
            'RGS1',  # Non valid CpG site ID to extract from GEM param
            must_be_successful=False,
            expected_internal_code=CorrelationGraphStatusErrorCode.INVALID_GENE_OR_GEM_NAMES
        )
