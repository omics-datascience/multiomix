from enum import Enum


class AddRemoveUserToInstitutionStatusErrorCode(Enum):
    """Addition/Removal of a User to an Institution result status to check in frontend some errors"""
    USER_DOES_NOT_EXIST = 1
    INSTITUTION_DOES_NOT_EXIST = 2
    INVALID_PARAMS = 3
    CANNOT_REMOVE_YOURSELF = 4
