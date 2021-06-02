from enum import Enum


class SyncCGDSStudyResponseCode(Enum):
    """Response status to check in frontend if it failed CGDS Study synchronization"""
    SUCCESS = 1
    ERROR = 2
    NOT_ID_IN_REQUEST = 3
    CGDS_STUDY_DOES_NOT_EXIST = 4


class CreateCGDSStudyResponseCode(Enum):
    """Response status to check in frontend if it failed CGDS Study creation"""
    # Uses string value due to https://github.com/encode/django-rest-framework/issues/7532#issue-698456113
    CGDS_WITH_DUPLICATED_COLLECTION_NAME = "1"
