# This file contains multiple functions used in different Django apps
import json
from enum import Enum
from typing import Optional, Dict, Type, Union, Iterable, cast
from django.db import models, connection
from django.http import JsonResponse
from common.response import ResponseStatus
import numpy as np
from common.typing import AbortEvent
from datasets_synchronization.models import SurvivalColumnsTupleUserFile
from user_files.models import UserFile


def get_enum_from_value(value, enum_class: Type[Enum], default_value: Optional[Enum] = None) -> Optional[Enum]:
    """Parses a value to a Enum"""
    for option in enum_class:
        if option.value == value:
            return option
    return default_value


def get_integer_enum_from_value(
        value: Optional[str],
        int_enum_class: Type[models.IntegerChoices],
        default_value: Optional[models.IntegerChoices] = None
) -> Optional[models.IntegerChoices]:
    """Parses a value to a IntegerField"""
    # First, cast to int if there is a valid value
    if value is None:
        return default_value
    value = int(value)
    for name, int_value in zip(int_enum_class.names, int_enum_class.values):
        if value == int_value:
            return int_enum_class[name]
    return default_value


def encode_json_response_status(response: Dict) -> JsonResponse:
    """
    Encodes the field 'status' of a response dict in JSON format and returns a JsonResponse
    @param response: Response dict to encode
    @return: JsonResponse object ready for being returned in view
    """
    response_status: ResponseStatus = response['status']
    response['status'] = response_status.to_json()

    return JsonResponse(response, safe=False)


def request_bool_to_python_bool(value: str) -> bool:
    """Cast a 'true'/'false' request field to a Python valid boolean"""
    return value == 'true'


# get_intersection() params type
IntersectionArrayType = Union[np.ndarray, Iterable, int, float]

def get_intersection(array_1: IntersectionArrayType, array_2: IntersectionArrayType) -> np.ndarray:
    """
    Gets the intersection between two arrays and cast the type to prevent Mypy warnings
    @param array_1: Array 1
    @param array_2: Array 2
    @return: Numpy Ndarray with the intersecting elements
    """
    return cast(np.ndarray, np.intersect1d(array_1, array_2))
def get_intersection_clinical(array_1: IntersectionArrayType, array_2: IntersectionArrayType, array_3: IntersectionArrayType) -> np.ndarray:
    """
    Gets the intersection between two arrays and cast the type to prevent Mypy warnings
    @param array_1: Array 1
    @param array_2: Array 2
    @param array_2: Array 3
    @return: Numpy Ndarray with the intersecting elements
    """
    intersection_array = cast(np.ndarray, np.intersect1d(array_1, array_2))
    return cast(np.ndarray, np.intersect1d(intersection_array, array_3))

def create_survival_columns_from_json(survival_columns_json: str, user_file: UserFile):
    """
    Create instances of SurvivalColumnsTupleUserFile and assign them to a specific UserFile instance
    @param survival_columns_json: String array of SurvivalColumnsTupleUserFile in JSON format
    @param user_file: UserFile instance to attach to
    """
    survival_columns = json.loads(survival_columns_json)
    for survival_column in survival_columns:
        SurvivalColumnsTupleUserFile.objects.create(clinical_dataset=user_file, **survival_column)


def close_db_connection():
    """
    Closes connections as a ThreadPoolExecutor in Django does not close them automatically
    See: https://stackoverflow.com/questions/57211476/django-orm-leaks-connections-when-using-threadpoolexecutor
    """
    connection.close()


def check_if_stopped(is_aborted: AbortEvent, exception: Type[Exception]):
    """
    Check if the event is set raising the corresponding exception.
    @param is_aborted: Stop event to check if It's set.
    @param exception: Exception to raise if the event is set.
    @raise Specified exception If the stop event is set.
    """
    if is_aborted():
        raise exception
