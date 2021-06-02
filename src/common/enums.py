from enum import Enum


class ResponseCode(Enum):
    """General response status to check in frontend if it failed"""
    SUCCESS = 1
    ERROR = 2
