import os
from typing import Optional
from django.contrib.auth.models import User
from common.tests_utils import create_user_file
from differential_expression.models import (
    DifferentialExpressionSource,
    DifferentialExpressionClinicalSource,
    DifferentialExpressionExperiment,
    DifferentialExpressionExperimentState,
    DifferentialExpressionTool
)
from user_files.models import UserFile
from user_files.models_choices import FileType


def get_test_file_path(filename: str) -> str:
    """
    Gets the absolute file's path in test folder
    @param filename: File's name
    @return: Absolute path to the file in test folder
    """
    dir_name = os.path.dirname(__file__)
    file_path = os.path.join(dir_name, f'tests_files/{filename}')
    return file_path


def create_differential_expression_source(user_file: UserFile) -> DifferentialExpressionSource:
    """
    Creates a new instance of DifferentialExpressionSource saved in DB
    @param user_file: UserFile to create the DifferentialExpressionSource
    @return: DifferentialExpressionSource saved instance
    """
    source = DifferentialExpressionSource.objects.create(user_file=user_file)
    return source


def create_differential_expression_clinical_source(user_file: UserFile) -> DifferentialExpressionClinicalSource:
    """
    Creates a new instance of DifferentialExpressionClinicalSource saved in DB
    @param user_file: UserFile to create the DifferentialExpressionClinicalSource
    @return: DifferentialExpressionClinicalSource saved instance
    """
    source = DifferentialExpressionClinicalSource.objects.create(user_file=user_file)
    return source


def create_test_differential_expression_experiment(
        name: str,
        clinical_source: DifferentialExpressionClinicalSource,
        mrna_source: DifferentialExpressionSource,
        user: User,
        state: DifferentialExpressionExperimentState = DifferentialExpressionExperimentState.WAITING_FOR_QUEUE,
        description: str = 'Test experiment',
        clinical_attribute: str = 'STATUS',
        tool: DifferentialExpressionTool = DifferentialExpressionTool.DESEQ,
        threshold_percentile: float = 0.15,
        threshold: float = 0.0001,
        top: int = 100,
        task_id: Optional[str] = None
) -> DifferentialExpressionExperiment:
    """
    Create a test DifferentialExpressionExperiment object
    @param name: Experiment name
    @param clinical_source: Clinical data source
    @param mrna_source: mRNA data source
    @param user: User who owns the experiment
    @param state: Initial experiment state
    @param description: Experiment description
    @param clinical_attribute: Clinical attribute to use for analysis
    @param tool: Tool to use for differential expression analysis
    @param threshold_percentile: Threshold percentile for filtering
    @param threshold: Threshold for filtering
    @param top: Number of top results to keep
    @param task_id: Optional Celery task ID
    @return: Saved DifferentialExpressionExperiment instance
    """
    experiment = DifferentialExpressionExperiment.objects.create(
        name=name,
        description=description,
        clinical_source=clinical_source,
        mrna_source=mrna_source,
        clinical_attribute=clinical_attribute,
        tool=tool,
        threshold_percentile=threshold_percentile,
        threshold=threshold,
        top=top,
        state=state,
        user=user,
        task_id=task_id
    )
    return experiment
