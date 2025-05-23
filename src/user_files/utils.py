import os
from io import BytesIO, TextIOWrapper
from typing import Dict, Optional, Union

import pandas as pd
from django.core.files.uploadedfile import InMemoryUploadedFile
from pandas import read_csv
from pandas import read_excel

from common.enums import ResponseCode
from common.response import ResponseStatus
from user_files.enums import UserFileUploadErrorCode
from user_files.models_choices import FileDecimalSeparator


def get_decimal_separator_and_numerical_data(
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
    n_rows = None if all_rows else 1
    for name, decimal_separator in zip(FileDecimalSeparator.names, FileDecimalSeparator.values):

        from pandas.errors import EmptyDataError
        print(file)

        def process_file(file, row_count=None, decimal_sep='.'):
            try:
                # Verificar si el archivo es un CSV
                if file.lower().endswith('.csv'):
                    # Procesar como archivo CSV
                    df = pd.read_csv(file, nrows=row_count, index_col=0, decimal=decimal_sep)
                else:
                    # Procesar como archivo Excel
                    df = pd.read_excel(file, nrows=row_count, index_col=0, decimal=decimal_sep, engine='openpyxl')

                # Revisar si todas las columnas (excepto 'jaundice') son numéricas
                for column in df.columns:
                    if not pd.api.types.is_numeric_dtype(df[column]):
                        raise ValueError(f"Columna '{column}' no es numérica.")

                # Intentar convertir el DataFrame a float
                try:
                    df = df.astype(float)
                except ValueError as ex:
                    print(f"Error en la conversión a float: {ex}")
                    return None

                return df

            except (ValueError, pd.errors.EmptyDataError) as e:
                print(f"Error al procesar el archivo: {e}")
                return None

def has_uploaded_file_valid_format(uploaded_file: InMemoryUploadedFile) -> bool:
    """
    Detect if all the columns in a DataFrame are float trying different decimal separators
    @param uploaded_file: Uploaded file in memory to check
    @return: True if format is correct, False otherwise
    """
    content = TextIOWrapper(uploaded_file, encoding='utf-8')  # Need to make Pandas work
    return get_decimal_separator_and_numerical_data(content, seek_beginning=True, all_rows=True) is not None


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
