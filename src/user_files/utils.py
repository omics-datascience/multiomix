import logging
from _csv import Error
from io import TextIOWrapper
from typing import Dict, Optional

import pandas as pd
import xlrd
from django.core.files.uploadedfile import InMemoryUploadedFile
from openpyxl.workbook import Workbook
from pandas import read_csv

from common.enums import ResponseCode
from common.response import ResponseStatus
from user_files.enums import UserFileUploadErrorCode
from user_files.models_choices import FileDecimalSeparator


def read_excel_in_chunks(file: TextIOWrapper, decimal_separator: FileDecimalSeparator,
                         chunk_size: int = 1000) -> pd.DataFrame:
    """
    Read an Excel file in chunks.
    @param file: Excel file to read.
    @param decimal_separator: Decimal separator.
    @param chunk_size: Chunk size.
    @return: Chunk Pandas DataFrame.
    """
    try:
        # Try to open the Excel file with the specified encoding
        excel_file = pd.ExcelFile(file, engine='openpyxl')
        # Get the number of rows in the sheet
        workbook: Workbook = excel_file.book
        total_rows = workbook.active.max_row
    except (OSError, xlrd.biffh.XLRDError):
        # If openpyxl fails, fall back to xlrd for older .xls files
        excel_file = pd.ExcelFile(file, engine='xlrd')
        total_rows = excel_file.book.sheet_by_index(0).nrows

    # Read the Excel file in chunks
    for start_row in range(1, total_rows, chunk_size):
        chunk = pd.read_excel(
            excel_file,
            header=0,
            index_col=0,
            skiprows=range(1, start_row),
            decimal=decimal_separator,
            nrows=chunk_size
        )

        # Process the chunk
        yield chunk


def get_decimal_separator_and_numerical_data(
        uploaded_file: InMemoryUploadedFile,
        seek_beginning: bool,
        all_rows: bool
) -> Optional[FileDecimalSeparator]:
    """
    Tries different decimal separators to check if one of them is the correct to parse as numerical data
    @param uploaded_file: Uploaded file to read in CSV/Excel format
    @param seek_beginning: If True seeks to 0 the content to prevent reading errors with TextIOWrapper
    @param all_rows: If True reads all the DataFrame to check if they are float. False to try only one (faster)
    @return: decimal separator if DataFrame is valid, None otherwise
    """
    n_rows = None if all_rows else 1
    is_xlsx = uploaded_file.name.endswith('.xlsx') or uploaded_file.name.endswith('.xls')

    # This is needed to make Pandas work with CSV
    if not is_xlsx:
        uploaded_file = TextIOWrapper(uploaded_file, encoding='utf-8')

    for name, decimal_separator in zip(FileDecimalSeparator.names, FileDecimalSeparator.values):
        try:
            # If no exception is thrown then the decimal separator is correct
            if is_xlsx:
                for chunk in read_excel_in_chunks(uploaded_file, decimal_separator, chunk_size=20_000):
                    chunk.astype(float)
            else:
                for chunk in read_csv(uploaded_file, sep=None, engine='python', index_col=0, nrows=n_rows,
                                      decimal=decimal_separator, chunksize=20_000):
                    chunk.astype(float)
            # TODO: implement parameter of file size to handle the DataFrame entirely
            # _ = read_csv(file, sep=None, engine='python', index_col=0, nrows=nrows, decimal=decimal_separator)\
            #     .astype(float)
            return FileDecimalSeparator[name]
        except (ValueError, Error):
            if seek_beginning:
                uploaded_file.seek(0)

    return None


def has_uploaded_file_valid_format(uploaded_file: InMemoryUploadedFile) -> bool:
    """
    Detect if all the columns in a DataFrame are float trying different decimal separators
    @param uploaded_file: Uploaded file in memory to check
    @return: True if format is correct, False otherwise
    """
    return get_decimal_separator_and_numerical_data(uploaded_file, seek_beginning=True, all_rows=True) is not None


def get_invalid_format_response() -> Dict:
    """
    Generate a dictionary with the response indicating that an UserFile has invalid format
    @return: Dictionary with the response
    """
    return {
        'status': ResponseStatus(
            ResponseCode.ERROR,
            message='Invalid file format: all columns apart from index must be numeric',
            internal_code=UserFileUploadErrorCode.INVALID_FORMAT_NON_NUMERIC
        ).to_json(),
    }
