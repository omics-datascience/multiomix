from enum import Enum


class CorrelationType(Enum):
    """To filter by Positive, Negative or Both correlation. Has to be the same as defined Typescript Enum"""
    POSITIVE = 1
    NEGATIVE = 2
    BOTH = 3


class CorrelationGraphStatusErrorCode(Enum):
    """Correlation graph response status to check in frontend some errors"""
    INVALID_GENE_OR_GEM_NAMES = 1
    EXPERIMENT_DOES_NOT_EXISTS = 2
    INVALID_PARAMS = 3


class CommonSamplesStatusErrorCode(Enum):
    """Correlation graph response status to check in frontend some errors"""
    DATASET_DOES_NOT_EXISTS = 1
    SOURCE_TYPE_DOES_NOT_EXISTS = 2
    INVALID_PARAMS = 3


class SourceType(Enum):
    """Enum to check if user want to select source from a file that he uploaded, or from CGDS DB"""
    UPLOADED_DATASETS = 1
    CGDS = 2
    NEW_DATASET = 3
