from enum import Enum


class ResponseStatus:
    """Represents a Response to check its status in frontend"""

    def __init__(self, code: Enum, message: str = '', internal_code: Enum = None):
        self.code = code.value  # Main status code
        self.message = message  # Optional message to show
        # Specific code to define messages in frontend
        self.internal_code = internal_code.value if internal_code is not None else None

    def to_json(self):
        return self.__dict__
