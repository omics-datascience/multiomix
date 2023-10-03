from enum import Enum
from typing import Optional, Dict, Union, List
from django.http import JsonResponse, Http404


class ResponseStatus:
    """Represents a Response to check its status in frontend"""
    code: Enum
    message: str
    internal_code: Enum

    def __init__(self, code: Enum, message: str = '', internal_code: Enum = None):
        self.code = code.value  # Main status code
        self.message = message  # Optional message to show
        # Specific code to define messages in frontend
        self.internal_code = internal_code.value if internal_code is not None else None

    def to_json(self):
        """This is useful to return in a JsonResponse."""
        return self.__dict__


def generate_json_response_or_404(data: Optional[Union[Dict, List]]) -> Union[JsonResponse, Http404]:
    """
    Checks if the data is None, if not return a JsonResponse with its content, otherwise raises a 404 error
    @param data: JSON data to return
    @raise Http404 if data is None
    @return: A JsonResponse if data is valid
    """
    if data is not None:
        return JsonResponse(data, safe=False)
    raise Http404('Element not found')
