import tempfile
from typing import Optional
from django.contrib.auth.models import User
from django.core.files import File
from api_service.models import ExperimentSource, Experiment
from api_service.models_choices import ExperimentState, PValuesAdjustmentMethod, ExperimentType, CorrelationMethod
from common.methylation import MethylationPlatform
from user_files.models import UserFile
from user_files.models_choices import FileType


def create_experiment_source(user_file: UserFile) -> ExperimentSource:
    """
    Creates a new instance of ExperimentSource saved in DB
    @param user_file: UserFile to create the ExperimentSource
    @return: ExperimentSource saved instance
    """
    return ExperimentSource.objects.create(user_file=user_file)


def create_user_file(
        file_path: str,
        name: str,
        file_type: FileType,
        user: User,
        is_cpg_site_id: Optional[bool] = False,
        platform: Optional[MethylationPlatform] = None
) -> UserFile:
    """
    Creates a UserFile to test
    @param file_path: File path to get
    @param name: Name of the UserFile object
    @param file_type: FileType of the UserFile object
    @param user: Current user who the UserFile belongs to
    @param is_cpg_site_id: Model's is_cpg_site_id field for Methylation stuff
    @param platform: Model's platform field for Methylation stuff
    @return: Saved UserFile object
    """
    # Uses temporary file to avoid SuspiciousFileOperation exception
    with tempfile.NamedTemporaryFile() as temp_file:
        with open(file_path, 'rb') as file_obj:
            temp_file.write(file_obj.read())
        user_file = UserFile(
            name=name,
            description='',
            file_obj=File(temp_file),
            file_type=file_type,
            user=user,
            is_cpg_site_id=is_cpg_site_id,
            platform=platform
        )

        user_file.save(force_insert=True)

    # This method is called in production when a UserFile is saved
    user_file.compute_post_saved_field()
    return user_file


def create_toy_experiment(mrna_source: ExperimentSource, gem_source: ExperimentSource, user: User) -> Experiment:
    """
    Create an unuseful Experiment object just to test some trivial things
    @param mrna_source: mRNA source
    @param gem_source: GEM source
    @param user: User who the Experiment belongs to
    @return: Saved in DB Experiment instance
    """
    return Experiment.objects.create(
        name='No samples in common experiment',
        description='',
        mRNA_source=mrna_source,
        gem_source=gem_source,
        minimum_coefficient_threshold=0.0,
        minimum_std_gene=0.0,
        minimum_std_gem=0.0,
        state=ExperimentState.IN_PROCESS,
        correlation_method=CorrelationMethod.PEARSON,
        p_values_adjustment_method=PValuesAdjustmentMethod.BENJAMINI_HOCHBERG,
        user=user,
        type=ExperimentType.MIRNA
    )
