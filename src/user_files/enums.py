from enum import Enum


class UserFileUploadErrorCode(Enum):
    """UserFile upload response status to check in frontend some errors"""
    INVALID_FORMAT_NON_NUMERIC = 1
