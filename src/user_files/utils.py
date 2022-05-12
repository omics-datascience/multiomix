from _csv import Error
from io import BytesIO, TextIOWrapper
from typing import Dict, Optional, Union
from django.core.files.uploadedfile import InMemoryUploadedFile
from pandas import read_csv
from common.enums import ResponseCode
from common.response import ResponseStatus
from user_files.enums import UserFileUploadErrorCode
from user_files.models_choices import FileDecimalSeparator


def get_decimal_separator(
        file: Union[str, BytesIO],
        seek_beginning: bool,
        all_rows: bool
) -> Optional[FileDecimalSeparator]:
    """
    Tries different decimal separators to check if one of them is the correct to parse as numerical data
    @param file: File path or StringIO to read in CSV format
    @param seek_beginning: If True seeks to 0 the content to prevent reading errors with TextIOWrapper
    @param all_rows: If True reads all the DataFrame to check if they are float. False to try only one (faster)
    @return: decimal separator if DataFrame is valid, None otherwise
    """
    nrows = None if all_rows else 1
    for name, decimal_separator in zip(FileDecimalSeparator.names, FileDecimalSeparator.values):
        try:
            # If no exception is thrown then the decimal separator is correct
            for chunk in read_csv(file, sep=None, engine='python', index_col=0, nrows=nrows, decimal=decimal_separator,
                                  chunksize=20_000):
                chunk.astype(float)
            # TODO: implement parameter of file size to handle the DataFrame entirely
            # _ = read_csv(file, sep=None, engine='python', index_col=0, nrows=nrows, decimal=decimal_separator)\
            #     .astype(float)
            return FileDecimalSeparator[name]
        except (ValueError, Error):
            if seek_beginning:
                file.seek(0)

    return None


def has_uploaded_file_valid_format(uploaded_file: InMemoryUploadedFile) -> bool:
    """
    Detect if all the columns in a DataFrame are float trying different decimal separators
    @param uploaded_file: Uploaded file in memory to check
    @return: True if format is correct, False otherwise
    """
    content = TextIOWrapper(uploaded_file, encoding='utf-8')  # Need to make Pandas work
    return get_decimal_separator(content, seek_beginning=True, all_rows=True) is not None


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
