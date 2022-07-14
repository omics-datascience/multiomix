from typing import Optional
from django.test import TestCase
from datasets_synchronization.models import CGDSStudy, CGDSDataset, CGDSDatasetSynchronizationState,\
    CGDSStudySynchronizationState
from datasets_synchronization.synchronization_service import global_synchronization_service
import os
import logging

# Disables to prevent correct errors logging
logging.disable(logging.CRITICAL)


class ExperimentCommonsTestCase(TestCase):
    # CGDS studies
    study_url_error: CGDSStudy
    normal_study: CGDSStudy

    # CGDS datasets
    mrna_dataset: CGDSDataset
    mirna_dataset: CGDSDataset
    cna_dataset: CGDSDataset
    methylation_dataset: CGDSDataset
    clinical_dataset: CGDSDataset

    @staticmethod
    def __get_filepath_in_tests_files_dir(filename: str) -> str:
        """
        Gets a File's path from a filename in the "test_files" directory
        @param filename: Filename to append
        @return: Absolute file's path
        """
        dir_name = os.path.dirname(__file__)
        return os.path.join(dir_name, f'tests_files/{filename}')

    @staticmethod
    def __create_cgds_dataset(
            file_path: str,
            mongo_collection_name: str,
            header_row_index: Optional[int] = 0
    ) -> CGDSDataset:
        """
        Creates a new saved in DB CGDSDataset instance
        @param file_path: Model's file_path field
        @param mongo_collection_name: Model's mongo_collection_name field
        @return: Saved CGDSDataset instance
        """
        return CGDSDataset.objects.create(
            file_path=file_path,
            observation=None,
            separator='\t',
            header_row_index=header_row_index,
            date_last_synchronization=None,
            state=CGDSDatasetSynchronizationState.NOT_SYNCHRONIZED,
            mongo_collection_name=mongo_collection_name
        )

    def setUp(self):
        # CGDS datasets
        self.mrna_dataset = self.__create_cgds_dataset(
            'data_RNA_Seq_v2_mRNA_median_Zscores.txt',
            '1/#$mrna_dataset='
        )  # mRNA: invalid MongoDB collection's name's pattern
        self.mirna_dataset = self.__create_cgds_dataset('not-exists.txt', 'mirna_dataset')
        self.cna_dataset = self.__create_cgds_dataset('data_CNA.txt', 'cna_dataset')
        self.methylation_dataset = self.__create_cgds_dataset(
            'data_methylation_hm27.txt',
            'methylation_dataset'
        )
        self.clinical_dataset = self.__create_cgds_dataset('data_clinical_patient.txt', 'clinical_dataset', 4)

        # CGDS studies
        self.study_url_error = CGDSStudy.objects.create(
            name='Url error',
            description='CGDS Study with a wrong URL',
            date_last_synchronization=None,
            url='http://not.exists.multiomix.org',
            state=CGDSStudySynchronizationState.IN_PROCESS,
            mrna_dataset=None,
            mirna_dataset=None,
            cna_dataset=None,
            methylation_dataset=None,
            clinical_patient_dataset=None,
            clinical_sample_dataset=None
        )

        # NOTE: this object is only to prevent DB integrity errors in CGDSDataset entity
        self.normal_study = CGDSStudy.objects.create(
            name='Normal study',
            description='Just a normal study',
            date_last_synchronization=None,
            # Don't care about the invalid URL, the download is not tested because performance issues, but we need
            # the file name
            url='http://not.exists.org/test_laml_tcga_pub.tar.gz',
            state=CGDSStudySynchronizationState.IN_PROCESS,
            mrna_dataset=self.mrna_dataset,
            mirna_dataset=self.mirna_dataset,
            cna_dataset=self.cna_dataset,
            methylation_dataset=self.methylation_dataset,
            clinical_patient_dataset=self.clinical_dataset,
            clinical_sample_dataset=None
        )

    def test_cgds_studies_states(self):
        """Test correct CGDSStudy sync states"""
        global_synchronization_service.sync_study(self.study_url_error)
        self.assertEqual(self.study_url_error.state, CGDSStudySynchronizationState.URL_ERROR)

    def test_cgds_datasets_states(self):
        """Test correct CGDSDataset sync states"""
        # Syncs study
        tar_file_path = self.__get_filepath_in_tests_files_dir('test_laml_tcga_pub.tar.gz')
        global_synchronization_service.extract_file_and_sync_datasets(self.normal_study, tar_file_path)

        # Asserts
        self.assertEqual(self.mrna_dataset.state, CGDSDatasetSynchronizationState.COULD_NOT_SAVE_IN_MONGO)
        self.assertEqual(self.mirna_dataset.state, CGDSDatasetSynchronizationState.FILE_DOES_NOT_EXIST)
        self.assertEqual(self.cna_dataset.state, CGDSDatasetSynchronizationState.SUCCESS)
        self.assertEqual(self.methylation_dataset.state, CGDSDatasetSynchronizationState.SUCCESS)
        self.assertEqual(self.clinical_dataset.state, CGDSDatasetSynchronizationState.SUCCESS)
