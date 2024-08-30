import csv
import os
from typing import List, TextIO, Optional, Iterable, Union, cast

import numpy as np
import pandas as pd
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import QuerySet
from django.db.models.signals import post_delete
from django.dispatch import receiver

from api_service.websocket_functions import send_update_user_file_command
from common.methylation import MethylationPlatform
from institutions.models import Institution
from tags.models import Tag
from user_files.models_choices import FileType, FileDecimalSeparator
from user_files.utils import get_decimal_separator_and_numerical_data, read_excel_in_chunks


def user_directory_path(instance, filename: str):
    """File will be uploaded to MEDIA_ROOT/uploads/user_<id>/<filename>"""
    return f'uploads/user_{instance.user.id}/{filename}'


class UserFile(models.Model):
    """User Files to submit experiments: mRNA and Gene Expression Modulators (GEM) file (miRNA, CNA or Methylation)"""
    survival_columns: QuerySet['SurvivalColumnsTupleUserFile']
    user_file: QuerySet['ExperimentSource']
    name = models.CharField(max_length=200)
    description = models.CharField(max_length=300, blank=True, null=True)
    file_obj = models.FileField(upload_to=user_directory_path)
    file_type = models.IntegerField(choices=FileType.choices)
    tag = models.ForeignKey(Tag, on_delete=models.SET_NULL, blank=True, null=True)
    upload_date = models.DateTimeField(auto_now_add=True, blank=False, null=True)
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    institutions = models.ManyToManyField(Institution, blank=True)
    contains_nan_values = models.BooleanField(blank=False, null=False, default=False)
    column_used_as_index = models.CharField(max_length=100, blank=True, null=True)
    number_of_rows = models.PositiveIntegerField(blank=False, null=False, default=0)
    number_of_samples = models.PositiveIntegerField(blank=False, null=False, default=0)
    decimal_separator = models.CharField(
        max_length=1,
        choices=FileDecimalSeparator.choices,
        default=FileDecimalSeparator.DOT
    )
    is_public = models.BooleanField(blank=False, null=False, default=False)

    # TODO: move both fields to a general structure in the future in Methylation type entity.
    # TODO: Don't forget to set the corresponding nullity in the new schema
    is_cpg_site_id = models.BooleanField(blank=False, null=False, default=False)
    platform = models.IntegerField(choices=MethylationPlatform.choices, blank=True, null=True)

    def __str__(self):
        description = self.description if self.description is not None else '-'
        return f'{self.name}: {description}'

    def __compute_number_of_row_and_samples_and_save(self):
        """
        Computes the number of rows and samples and makes the update
        """
        self.number_of_rows = self.__get_row_count()
        self.number_of_samples = len(self.get_column_names())

    def __check_if_contains_nan_values(self):
        """
        Checks if an UserFile contains NaNs values and saves the instance
        """
        contains_nan_values = False
        for chunk in self.get_df_in_chunks():
            if chunk.isnull().values.any():
                contains_nan_values = True
                break
        self.contains_nan_values = contains_nan_values

    def __compute_row_used_as_index(self):
        """Computes the first column's header, which is used as index of the UserFile"""
        columns_name = self.get_column_names(include_first_column=True)
        self.column_used_as_index = columns_name[0] if len(columns_name) > 0 else None

    def __compute_decimal_separator(self):
        """Computes the UserFile decimal_separator field"""
        # This shouldn't fail as it was checked on upload
        decimal_separator = get_decimal_separator_and_numerical_data(self.file_obj.file, seek_beginning=False,
                                                                     all_rows=False)
        self.decimal_separator = decimal_separator if decimal_separator is not None else FileDecimalSeparator.DOT

    def compute_post_saved_field(self):
        """Computes fields that need the instance to be saved in the DB before be computed, such as number of
        row, columns, NaN values, etc"""
        # Computed number of rows and samples
        self.__compute_number_of_row_and_samples_and_save()

        # Checks if contains NaN values
        self.__check_if_contains_nan_values()

        # Gets column used as index
        self.__compute_row_used_as_index()

        # Gets the decimal separator
        self.__compute_decimal_separator()

        # Saves again with the new computed fields
        super().save(update_fields=['number_of_rows', 'number_of_samples', 'contains_nan_values',
                                    'column_used_as_index', 'decimal_separator'])

    def get_row_indexes(self) -> List[str]:
        """
        Get all the rows indexes (useful, for example, when you need the samples in a clinical dataset)
        @return: List of row indexes
        """
        rows_indexes: List[str] = []
        for chunk in self.get_df_in_chunks():
            rows_indexes += chunk.index.values.tolist()
        return rows_indexes

    @staticmethod
    def __get_csv_reader_dialect(csv_file: TextIO) -> csv.Dialect:
        """
        Gets a dialect to infer file separator. Note that this method seeks file to starting position
        @param csv_file: CSV file to extract the dialect
        @return: CSV dialect
        """
        dialect = csv.Sniffer().sniff(csv_file.readline())
        csv_file.seek(0)
        return cast(csv.Dialect, dialect)

    def __get_dict_reader_from_file(self, csv_file: TextIO) -> csv.DictReader:
        """
        Generate a DictReader inferring the delimiter of a CSV file
        @param csv_file: CSV file to read
        @return: DictReader object
        """
        # We need an entire line as we had cases where reading some bytes wasn't sufficient
        dialect = self.__get_csv_reader_dialect(csv_file)
        return csv.DictReader(csv_file, dialect=dialect)

    def __get_reader_from_file(self, csv_file: TextIO) -> Iterable:
        """
        Generate a reader inferring the delimiter of a CSV file.
        @param csv_file: CSV file to read.
        @return: Reader object.
        """
        # We need an entire line as we had cases where reading some bytes wasn't sufficient
        dialect = self.__get_csv_reader_dialect(csv_file)
        return csv.reader(csv_file, dialect=dialect)

    @property
    def is_xlsx(self) -> bool:
        """Checks if the file is an Excel file."""
        return self.file_obj.name.endswith('.xlsx') or self.file_obj.name.endswith('.xls')

    def __get_dataframe(
            self,
            chunk_size: Optional[int] = None
    ) -> Union[pd.DataFrame, Iterable[pd.DataFrame]]:
        """
        Returns a DataFrame (entirely or in chunks).
        @param chunk_size: Chunk size to split the DataFrame (optional).
        @return: DataFrame or Iterator of DataFrame's chunks in case chunk_size is specified
        """
        if self.is_xlsx:
            return read_excel_in_chunks(self.file_obj.file, self.decimal_separator, chunk_size)

        return pd.read_csv(
            self.file_obj.file.name,
            sep=None,
            engine='python',  # To prevent warning about engine implicitly changed
            index_col=0,
            decimal=self.decimal_separator,
            chunksize=chunk_size
        )

    def get_df(self, _only_matching: bool = False) -> pd.DataFrame:
        """
        Generates a DataFrame from the UserFile
        @param _only_matching: If True, returns only the matching samples. Not used for UserFiles sources (only
        for CGDSDatasets).
        @return: A DataFrame with the data to work
        """
        return self.__get_dataframe()

    def get_df_in_chunks(self, _only_matching: bool = False) -> Iterable[pd.DataFrame]:
        """
        Returns an Iterator of a DataFrame in divided in chunks from an UserFile.
        @param _only_matching: If True, returns only the matching samples. Not used for UserFiles sources (only
        for CGDSDatasets).
        @return: A DataFrame Iterator with the data to work.
        """
        return self.__get_dataframe(chunk_size=settings.EXPERIMENT_CHUNK_SIZE)

    def get_column_names(self, include_first_column: Optional[bool] = False) -> List[str]:
        """
        Gets a specific CSV file's columns' names (headers)
        IMPORTANT: it's not using Pandas as it is extremely slow in comparison with this method (see times below)
        Pandas -> Takes 15.22 sec to finish 100 iterations
        CSV -> Takes 1.61 sec to finish 10000 iterations
        @param include_first_column: If True, includes the first column (the index)
        @return: List of columns' names
        """
        if self.is_xlsx:
            with pd.ExcelFile(self.file_obj.file.name) as xls:
                reader = pd.read_excel(xls, sheet_name=None)
                fieldnames = reader[list(reader.keys())[0]].columns.tolist()
        else:
            with open(self.file_obj.file.name, 'r') as csv_file:
                reader = self.__get_dict_reader_from_file(csv_file)
                fieldnames = reader.fieldnames

        # The reader returns Optional[Sequence[str]]. We need a list
        if fieldnames is None:
            return []

        # If needed, removes the first column as it's the index (gene or gem name)
        return list(fieldnames[1:] if not include_first_column else fieldnames)

    def get_first_column_of_all_rows(self) -> List[str]:
        """
        Gets the first element of each row in the CSV file, excluding the first row.
        @return: List of first elements from each row.
        """
        first_elements = []
        with open(self.file_obj.file.name, 'r') as csv_file:
            reader = self.__get_reader_from_file(csv_file)
            if reader is None:
                return []

            # Skips first line (have titles)
            next(reader)
            for row in reader:
                if row:
                    first_elements.append(row[0])

        return first_elements

    def get_specific_row(self, row: str) -> np.ndarray:
        """
        Gets a specific row from the DataFrame
        @param row: Row's identifier to retrieve it
        @return: Numpy array with the values. It will be empty if key is invalid
        """
        with open(self.file_obj.file.name, 'r') as csv_file:
            for current_row in self.__get_reader_from_file(csv_file):
                if current_row[0] == row:
                    # Removes index column and cast to float
                    return np.array(current_row[1:], dtype=float)
        return np.array([])

    def __get_row_count(self) -> int:
        """
        Computes the number of rows that have the UserFile
        @return: Number of rows
        """
        if self.is_xlsx:
            with pd.ExcelFile(self.file_obj.file.name) as xls:
                row_count = sum(1 for _ in pd.read_excel(xls, sheet_name=None))
        else:
            with open(self.file_obj.file.name, 'r') as infile:
                row_count = sum(1 for _ in infile)

        # Subtracts 1 as it's assumed to have a header row in the file
        return row_count - 1

    def delete(self, *args, **kwargs):
        """Deletes the instance and sends a websockets message to update state in the frontend"""
        super().delete(*args, **kwargs)

        # Sends a websockets message to update the user file state in the frontend
        send_update_user_file_command(self.user.id)

    def save(self, *args, **kwargs):
        """Everytime the user file status changes, uses websocket to update state in the frontend"""
        super().save(*args, **kwargs)

        # Sends a websocket message to update the state in the frontend
        send_update_user_file_command(self.user.id)

    class Meta:
        ordering = ['-id']


@receiver(post_delete, sender=UserFile)
def user_file_post_delete(sender, instance, **kwargs):
    """
    Deletes file from filesystem when corresponding `UserFile` object is deleted.
    """
    if instance.file_obj:
        if os.path.isfile(instance.file_obj.path):
            os.remove(instance.file_obj.path)
