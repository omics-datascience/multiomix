from typing import Optional, Literal, Tuple, Union
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db import connection
from django.http.request import HttpRequest
from rest_framework.request import Request
from api_service.enums import SourceType
from api_service.models import ExperimentSource, ExperimentClinicalSource
from api_service.models_choices import ExperimentType
from datasets_synchronization.models import CGDSStudy, CGDSDataset
from user_files.models import UserFile
from user_files.models_choices import FileType
from user_files.utils import has_uploaded_file_valid_format
from user_files.views import get_an_user_file


def create_clinical_dataset_from_cgds_study(cgds_study: CGDSStudy) -> Optional[ExperimentClinicalSource]:
    """
    Creates an instance of ExperimentClinicalSource from a CGDSStudy with its Clinical datasets (patients and samples)
    @param cgds_study: CGDSStudy to get clinical data
    @return: ExperimentClinicalSource instance if CGDSStudy had needed data. None otherwise
    """
    if cgds_study.clinical_patient_dataset and cgds_study.clinical_sample_dataset:
        return ExperimentClinicalSource.objects.create(
            user_file=None,
            cgds_dataset=cgds_study.clinical_patient_dataset,
            extra_cgds_dataset=cgds_study.clinical_sample_dataset
        )

    return None


def get_experiment_source(
        source_type: Optional[int],
        request: Union[HttpRequest, Request],
        file_type: Optional[FileType],
        prefix: Literal['mRNA', 'gem', 'miRNA', 'cna', 'methylation', 'clinical']
) -> Tuple[Optional[ExperimentSource], Optional[ExperimentClinicalSource]]:
    """
    Generates a source object to run a pipeline. This method considers the source type
    to create a new file, get an existing (previously uploaded) file or get a CGDS dataset
    @param source_type: Type of the source: new dataset, existing file or a CGDS dataset
    @param request: Request object to get the user and some parameters
    @param file_type: File type to save the UserFile
    @param prefix: Prefix of request param to get its values
    @return: Generated ExperimentSource Object to add to the Experiment and a Clinical source in case the sources has
    that information
    """
    if source_type is None:
        return None, None

    is_clinical = prefix == 'clinical'
    source = ExperimentSource() if not is_clinical else ExperimentClinicalSource()
    clinical_source: Optional[ExperimentClinicalSource] = None
    if source_type == SourceType.NEW_DATASET.value:
        # Adds a new User's file and uses it
        source_file: Optional[InMemoryUploadedFile] = request.FILES.get(f'{prefix}File')

        if source_file is None or (
                source_file is not None and
                not is_clinical and
                not has_uploaded_file_valid_format(source_file)
        ):
            return None, None

        user_file = UserFile(
            name=source_file.name,
            description=None,
            file_obj=source_file,
            file_type=file_type,
            user=request.user
        )

        # Saves in DB and computes the number of rows and samples
        user_file.save()
        user_file.compute_post_saved_field()

        source.user_file = user_file
    elif source_type == SourceType.CGDS.value:
        # Uses a synchronized CGDS dataset from MongoDB

        # Gets the CGDS Study
        cgds_study_pk = int(request.POST.get(f'{prefix}CGDSStudyPk'))
        cgds_study = CGDSStudy.objects.get(pk=cgds_study_pk)

        # Gets the corresponding Study's Dataset
        cgds_dataset = get_cgds_dataset(cgds_study, file_type)

        source.cgds_dataset = cgds_dataset

        clinical_source = create_clinical_dataset_from_cgds_study(cgds_study)
    else:
        # Otherwise, uses an existing User's file
        existing_file_pk = int(request.POST.get(f'{prefix}ExistingFilePk'))
        user_file = get_an_user_file(user=request.user, user_file_pk=existing_file_pk)
        source.user_file = user_file

    # Saves ExperimentSource object
    source.save()

    return source, clinical_source


def file_type_to_experiment_type(file_type: Optional[FileType]) -> ExperimentType:
    """
    Transforms a FileType to an ExperimentType to run a new Experiment
    @param file_type: FileType to transform
    @return: Corresponding ExperimentType
    """
    if file_type == FileType.MIRNA:
        return ExperimentType.MIRNA
    if file_type == FileType.CNA:
        return ExperimentType.CNA
    return ExperimentType.METHYLATION


def get_cgds_dataset(cgds_study: CGDSStudy, file_type: FileType) -> Optional[CGDSDataset]:
    """
    Gets a specific CGDSDataset from a CGDSStudy model. Clinical data is not needed to be retrieved
    @param cgds_study: CGDSStudy to get its Dataset
    @param file_type: FileType to know which Dataset retrieve from CGDSStudy
    @return:
    """
    if file_type == FileType.MRNA:
        return cgds_study.mrna_dataset
    elif file_type == FileType.MIRNA:
        return cgds_study.mirna_dataset
    elif file_type == FileType.CNA:
        return cgds_study.cna_dataset
    elif file_type == FileType.METHYLATION:
        return cgds_study.methylation_dataset
    else:
        return None


def close_db_connection():
    """
    Closes connections as a ThreadPoolExecutor in Django does not close them automatically
    See: https://stackoverflow.com/questions/57211476/django-orm-leaks-connections-when-using-threadpoolexecutor
    """
    connection.close()
