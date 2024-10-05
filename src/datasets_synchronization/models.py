import logging
from typing import List, Iterable, cast, Optional
from django.conf import settings
from django.db import models, transaction
import numpy as np
from django.db.models import Max, QuerySet
from api_service.exceptions import CouldNotDeleteInMongo
from api_service.mongo_service import global_mongo_service
from api_service.websocket_functions import send_update_cgds_studies_command
from common.methylation import MethylationPlatform
from feature_selection.models import TrainedModel
from statistical_properties.models import StatisticalValidation
from user_files.models import UserFile
from user_files.models_choices import FileType
from pandas import DataFrame


class DatasetSeparator(models.TextChoices):
    """Possible separators for downloaded datasets"""
    COMMA = ',', 'Comma'
    SEMICOLON = ';', 'Semicolon'
    TAB = '\t', 'Tab'
    COLON = ':', 'Colon'
    WHITE_SPACE = ' ', 'White space'


class CGDSStudySynchronizationState(models.IntegerChoices):
    """Possible states for CGDS Study synchronization"""
    NOT_SYNCHRONIZED = 0
    WAITING_FOR_QUEUE = 1
    IN_PROCESS = 2
    COMPLETED = 3
    FINISHED_WITH_ERROR = 4
    URL_ERROR = 5
    CONNECTION_TIMEOUT_ERROR = 6
    READ_TIMEOUT_ERROR = 7
    TIMEOUT_EXCEEDED = 9
    STOPPED = 10


class CGDSDatasetSynchronizationState(models.IntegerChoices):
    """Possible states for CGDS Dataset synchronization"""
    NOT_SYNCHRONIZED = 0
    SUCCESS = 1
    FINISHED_WITH_ERROR = 2
    FILE_DOES_NOT_EXIST = 3
    COULD_NOT_SAVE_IN_MONGO = 4
    NO_PATIENT_ID_COLUMN_FOUND = 5


class CGDSDataset(models.Model):
    """A CGDS Study dataset (mRNA, miRNA, CNA, Methylation, Follow-up/Survival)"""
    clinical_sample_dataset: 'ExperimentSource'
    clinical_patient_dataset: 'ExperimentSource'
    methylation_dataset: 'ExperimentSource'
    cna_dataset: 'ExperimentSource'
    mirna_dataset: 'ExperimentSource'
    mrna_dataset: 'ExperimentSource'
    survival_columns: QuerySet['ExperimentSource']
    cgds_dataset: QuerySet['ExperimentSource']

    file_path: str = models.CharField(max_length=150)  # File name inside extracted study folder
    observation: Optional[str] = models.CharField(max_length=300, blank=True, null=True)
    separator: str = models.CharField(max_length=1, choices=DatasetSeparator.choices, default=DatasetSeparator.TAB)
    header_row_index: int = models.PositiveSmallIntegerField(default=0)
    date_last_synchronization: Optional[models.DateTimeField] = models.DateTimeField(blank=True, null=True)
    state: int = models.IntegerField(
        choices=CGDSDatasetSynchronizationState.choices,
        default=CGDSDatasetSynchronizationState.NOT_SYNCHRONIZED
    )
    number_of_rows: int = models.PositiveIntegerField(blank=True, null=False, default=0)
    number_of_samples: int = models.PositiveIntegerField(blank=True, null=False, default=0)
    mongo_collection_name: Optional[str] = models.CharField(max_length=100, blank=True, null=True)  # Collection
    # where will be saved

    # TODO: move both fields to a general structure in the future in Methylation type entity
    # TODO: Don't forget to set the corresponding nullity in the new schema
    is_cpg_site_id: bool = models.BooleanField(blank=False, null=False, default=True)
    platform: Optional[int] = models.IntegerField(choices=MethylationPlatform.choices, blank=True, null=True)

    @property
    def file_type(self) -> FileType:
        if hasattr(self, 'mrna_dataset'):
            return FileType.MRNA
        elif hasattr(self, 'mirna_dataset'):
            return FileType.MIRNA
        elif hasattr(self, 'cna_dataset'):
            return FileType.CNA
        elif hasattr(self, 'methylation_dataset'):
            return FileType.METHYLATION
        return FileType.CLINICAL

    def __get_reverse_study(self) -> Optional['CGDSDataset']:
        """Gets the related study model's name"""
        if hasattr(self, 'mrna_dataset'):
            return cast(Optional['CGDSDataset'], self.mrna_dataset)
        elif hasattr(self, 'mirna_dataset'):
            return cast(Optional['CGDSDataset'], self.mirna_dataset)
        elif hasattr(self, 'cna_dataset'):
            return cast(Optional['CGDSDataset'], self.cna_dataset)
        elif hasattr(self, 'methylation_dataset'):
            return cast(Optional['CGDSDataset'], self.methylation_dataset)
        elif hasattr(self, 'clinical_patient_dataset'):
            return cast(Optional['CGDSDataset'], self.clinical_patient_dataset)
        elif hasattr(self, 'clinical_sample_dataset'):
            return cast(Optional['CGDSDataset'], self.clinical_sample_dataset)

    @property
    def study(self) -> Optional['CGDSDataset']:
        return self.__get_reverse_study()

    def __str__(self) -> str:
        study_name = self.study.name if self.study else '-'
        return f'File: {self.file_path} | Col: {self.mongo_collection_name} | Assigned to study: {study_name}'

    def __compute_number_of_row_and_samples_and_save(self) -> None:
        """
        Computes the number of rows and samples and makes the update
        """
        self.number_of_rows = self.__get_row_count()
        self.number_of_samples = len(self.get_column_names())

    def get_df(self, use_standard_column: bool = True, only_matching: bool = False) -> DataFrame:
        """
        Generates a DataFrame from a CGDSDataset's MongoDB collection
        @param use_standard_column: If True uses 'Standard_Symbol' as index of the DataFrame. False to use the first
        column (useful for clinical datasets).
        @param only_matching: If True only returns the molecules that are equal in both columns MOLECULE_SYMBOL and
        STANDARD_SYMBOL.
        @return: A DataFrame with the data to work
        """
        return global_mongo_service.get_collection_as_df(self.mongo_collection_name, use_standard_column, only_matching)

    def get_df_in_chunks(self, only_matching: bool = False) -> Iterable[DataFrame]:
        """
        Returns an Iterator of a DataFrame in divided in chunks from a CGDSDataset's MongoDB collection
        @param only_matching: If True only returns the molecules that are equal in both columns MOLECULE_SYMBOL and
        STANDARD_SYMBOL.
        @return: A DataFrame Iterator with the data to work
        """
        return global_mongo_service.get_collection_as_df_in_chunks(
            self.mongo_collection_name,
            chunk_size=settings.EXPERIMENT_CHUNK_SIZE,
            only_matching=only_matching
        )

    def get_row_indexes(self) -> List[str]:
        """
        Get all the rows indexes (useful, for example, when you need the samples in a clinical dataset)
        @return:
        """
        rows_indexes: List[str] = []
        for chunk in self.get_df_in_chunks():
            rows_indexes += chunk[''].values.tolist()
        return rows_indexes

    def compute_post_saved_field(self) -> None:
        """Computes fields that need the instance to be saved in the DB before be computed, such as number of
        row, columns etc"""
        # Computed number of rows and samples
        self.__compute_number_of_row_and_samples_and_save()

        # Saves again with the new computed fields
        super().save(update_fields=['number_of_rows', 'number_of_samples'])

    def get_column_names(self) -> List[str]:
        """
        Gets a specific MongoDB collection's columns' names
        @return: List of columns' names
        """
        return global_mongo_service.get_only_columns_names(self.mongo_collection_name)

    def get_specific_row(self, row: str) -> np.ndarray:
        """
        Gets a specific row from the DataFrame
        @param row: Row's identifier to retrieve it
        @return: Numpy array with the values. The Ndarray will be empty if key is invalid
        """
        res_row = global_mongo_service.get_specific_row(self.mongo_collection_name, row)
        return np.array(res_row, dtype=float)

    def __get_row_count(self) -> int:
        """
        Computes the number of rows of the MongoDB collection
        @return: Number of rows
        """
        return global_mongo_service.get_collection_row_count(self.mongo_collection_name)

    def delete(self, *args, **kwargs) -> None:
        """Deletes the instance and its related MongoDB result (if exists)"""
        try:
            with transaction.atomic():
                # Call the "real" delete() method.
                super().delete(*args, **kwargs)

                # The next line will raise CouldNotDeleteInMongo exception if something gone wrong
                # preventing DB commit
                global_mongo_service.drop_collection(self.mongo_collection_name)

                # Sends a websocket message to update the state in the frontend
                send_update_cgds_studies_command()
        except CouldNotDeleteInMongo as e:
            logging.error(f'Could not delete Dataset = {self}. Exception -> {e}')


class SurvivalColumnsTuple(models.Model):
    """Represents a tuple of survival time and event"""
    time_column: str = models.CharField(max_length=30)
    event_column: str = models.CharField(max_length=30)

    class Meta:
        abstract = True

    def __str__(self) -> str:
        return f'Time column: "{self.time_column}" | Event column: "{self.event_column}"'


class SurvivalColumnsTupleCGDSDataset(SurvivalColumnsTuple):
    """Survival tuple for a CGDSDataset"""
    statistical_validations: QuerySet['StatisticalValidation']
    trained_models: QuerySet['TrainedModel']
    DoesNotExist = None
    clinical_dataset = models.ForeignKey(CGDSDataset, on_delete=models.CASCADE, related_name='survival_columns')


class SurvivalColumnsTupleUserFile(SurvivalColumnsTuple):
    """Survival tuple for a UserFile"""
    statistical_validations: QuerySet['StatisticalValidation']
    trained_models: QuerySet['TrainedModel']
    DoesNotExist = None
    clinical_dataset = models.ForeignKey(UserFile, on_delete=models.CASCADE, related_name='survival_columns')


class CGDSStudy(models.Model):
    """A CGDS Study with its datasets synchronized from https://www.cbioportal.org/datasets"""
    objects = None
    name: str = models.CharField(max_length=150)
    description: Optional[str] = models.TextField(blank=True, null=True)
    date_last_synchronization: Optional[str] = models.DateTimeField(blank=True, null=True)  # General last sync date
    url: str = models.CharField(max_length=300)
    version: int = models.PositiveSmallIntegerField(default=1)
    url_study_info: Optional[str] = models.CharField(max_length=300, blank=True, null=True)  # Link to the paper of
    # the study/site/etc
    state: int = models.IntegerField(
        choices=CGDSStudySynchronizationState.choices,
        default=CGDSStudySynchronizationState.NOT_SYNCHRONIZED
    )
    mrna_dataset = models.OneToOneField(
        CGDSDataset,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='mrna_dataset'
    )
    mirna_dataset = models.OneToOneField(
        CGDSDataset,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='mirna_dataset'
    )
    cna_dataset = models.OneToOneField(
        CGDSDataset,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='cna_dataset'
    )
    methylation_dataset = models.OneToOneField(
        CGDSDataset,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='methylation_dataset'
    )
    clinical_patient_dataset = models.OneToOneField(
        CGDSDataset,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='clinical_patient_dataset'
    )
    clinical_sample_dataset = models.OneToOneField(
        CGDSDataset,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='clinical_sample_dataset'
    )
    task_id: Optional[str] = models.CharField(max_length=100, blank=True, null=True)  # Celery Task ID

    def __str__(self) -> str:
        return self.name

    def has_at_least_one_dataset_synchronized(self) -> bool:
        """Checks if at least one dataset is synchronized"""
        for dataset in self.get_all_valid_datasets():
            if dataset.state == CGDSDatasetSynchronizationState.SUCCESS:
                return True
        return False

    def get_all_valid_datasets(self) -> List[CGDSDataset]:
        """Returns a list of all the associated CGDSDataset (excluding None)"""
        datasets = [self.mrna_dataset, self.mirna_dataset, self.cna_dataset, self.methylation_dataset,
                    self.clinical_sample_dataset, self.clinical_patient_dataset]
        return [cast(CGDSDataset, dataset) for dataset in datasets if dataset is not None]

    def get_last_version(self) -> int:
        """Gets the maximum version of this CGDSStudy with the same URL."""
        return CGDSStudy.objects.filter(url=self.url).aggregate(Max('version'))['version__max']

    def save(self, *args, **kwargs) -> None:
        """Everytime the CGDSStudy status changes, uses websocket to update state in the frontend"""
        super().save(*args, **kwargs)

        # Sends a websocket message to update the state in the frontend
        send_update_cgds_studies_command()

    def delete(self, *args, **kwargs) -> None:
        """Deletes the instance and its related MongoDB result (if exists)"""
        with transaction.atomic():
            super().delete(*args, **kwargs)

            # On delete removes all the datasets
            for dataset in self.get_all_valid_datasets():
                dataset.delete()

            # Sends a websocket message to update the state in the frontend
            send_update_cgds_studies_command()
