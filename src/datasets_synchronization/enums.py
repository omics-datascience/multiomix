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


class SyncStrategy(Enum):
    """CGDSStudies sync strategies."""
    # Creates a new version of the CGDS Study and syncs it
    NEW_VERSION = 1
    # Updates the current version synchronizing all the datasets
    SYNC_ALL = 2
    # Updates the current version synchronizing only the datasets with a no successful state
    SYNC_ONLY_FAILED = 3
