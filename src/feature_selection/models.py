import os
import pickle
from typing import List, Optional, Tuple, Union, Any
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from api_service.websocket_functions import send_update_trained_models_command, send_update_cluster_label_set_command
from biomarkers.models import TrainedModelState
from datasets_synchronization.models import SurvivalColumnsTupleUserFile, SurvivalColumnsTupleCGDSDataset
from user_files.models_choices import FileType


class FeatureSelectionAlgorithm(models.IntegerChoices):
    """Available Feature Selection algorithms."""
    BLIND_SEARCH = 1
    COX_REGRESSION = 2
    BBHA = 3
    PSO = 4
    GA = 5


class FitnessFunction(models.IntegerChoices):
    """Available models to execute as the fitness function."""
    CLUSTERING = 1
    SVM = 2
    RF = 3  # TODO: implement in backend


class ClusteringAlgorithm(models.IntegerChoices):
    """Clustering algorithm."""
    K_MEANS = 1
    SPECTRAL = 2  # TODO: implement in backend
    BK_MEANS = 3


class ClusteringMetric(models.IntegerChoices):
    """Clustering metric to optimize."""
    COX_REGRESSION = 1
    LOG_RANK_TEST = 2


class ClusteringScoringMethod(models.IntegerChoices):
    """Clustering scoring method."""
    C_INDEX = 1
    LOG_LIKELIHOOD = 2


class SVMKernel(models.IntegerChoices):
    """SVM's kernel """
    LINEAR = 1
    POLYNOMIAL = 2
    RBF = 3


class SVMTask(models.IntegerChoices):
    """Task to execute with survival SVM."""
    RANKING = 1
    REGRESSION = 2


class BBHAVersion(models.IntegerChoices):
    """Version of the BBHA algorithm used."""
    ORIGINAL = 1
    IMPROVED = 2


class ClusteringParameters(models.Model):
    """Clustering fitness function parameters."""
    algorithm = models.IntegerField(choices=ClusteringAlgorithm.choices, default=ClusteringAlgorithm.K_MEANS)
    metric = models.IntegerField(choices=ClusteringMetric.choices, default=ClusteringMetric.COX_REGRESSION)
    scoring_method = models.IntegerField(choices=ClusteringScoringMethod.choices,
                                         default=ClusteringScoringMethod.C_INDEX)
    penalizer = models.FloatField(default=0.0)
    random_state = models.SmallIntegerField(null=True, blank=True)
    n_clusters = models.SmallIntegerField(default=2, validators=[MinValueValidator(2), MaxValueValidator(10)])
    trained_model = models.OneToOneField('TrainedModel', on_delete=models.CASCADE, related_name='clustering_parameters')


class SVMParameters(models.Model):
    """SVM fitness function parameters."""
    kernel = models.IntegerField(choices=SVMKernel.choices)
    task = models.IntegerField(choices=SVMTask.choices)
    max_iterations = models.SmallIntegerField(default=1000,
                                              validators=[MinValueValidator(100), MaxValueValidator(2000)])
    random_state = models.SmallIntegerField(null=True, blank=True)
    trained_model = models.OneToOneField('TrainedModel', on_delete=models.CASCADE, related_name='svm_parameters')


class RFParameters(models.Model):
    """RF fitness function parameters."""
    n_estimators = models.SmallIntegerField(default=10, validators=[MinValueValidator(10), MaxValueValidator(20)])
    max_depth = models.SmallIntegerField(null=True, blank=True, validators=[MinValueValidator(3)])
    random_state = models.SmallIntegerField(null=True, blank=True)
    trained_model = models.OneToOneField('TrainedModel', on_delete=models.CASCADE, related_name='rf_parameters')


class FSExperiment(models.Model):
    """Represents a Feature Selection experiment."""
    origin_biomarker = models.ForeignKey('biomarkers.Biomarker', on_delete=models.CASCADE,
                                         related_name='fs_experiments_as_origin')
    algorithm = models.IntegerField(choices=FeatureSelectionAlgorithm.choices)
    execution_time = models.PositiveIntegerField(default=0)  # Execution time in seconds
    created_biomarker = models.OneToOneField('biomarkers.Biomarker', on_delete=models.SET_NULL, null=True, blank=True,
                                             related_name='fs_experiment')
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)

    # Sources
    clinical_source = models.ForeignKey('api_service.ExperimentClinicalSource', on_delete=models.CASCADE, null=True,
                                        blank=True, related_name='fs_experiments_as_clinical')
    mrna_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True, blank=True,
                                    related_name='fs_experiments_as_mrna')
    mirna_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True, blank=True,
                                     related_name='fs_experiments_as_mirna')
    cna_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True, blank=True,
                                   related_name='fs_experiments_as_cna')
    methylation_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True,
                                           blank=True, related_name='fs_experiments_as_methylation')

    task_id = models.CharField(max_length=100, blank=True, null=True)  # Celery Task ID

    # Number of attempts to prevent a buggy experiment running forever
    attempt = models.PositiveSmallIntegerField(default=0)

    # AWS-EMR fields
    app_name = models.CharField(max_length=100, null=True, blank=True)  # Spark app name to get the results
    emr_job_id = models.CharField(max_length=100, null=True, blank=True)  # Job ID in the Spark cluster

    def get_all_sources(self) -> List[Optional['api_service.ExperimentSource']]:
        """Returns a list with all the sources."""
        return [
            self.clinical_source,
            self.mrna_source,
            self.mirna_source,
            self.cna_source,
            self.methylation_source,
        ]

    def get_sources_and_molecules(self) -> List[Tuple[Optional['api_service.ExperimentSource'], List[str], FileType]]:
        """Returns a list with all the sources (except clinical), the selected molecules and type."""
        biomarker = self.origin_biomarker
        return [
            (self.mrna_source, list(biomarker.mrnas.values_list('identifier', flat=True)), FileType.MRNA),
            (self.mirna_source, list(biomarker.mirnas.values_list('identifier', flat=True)), FileType.MIRNA),
            (self.cna_source, list(biomarker.cnas.values_list('identifier', flat=True)), FileType.CNA),
            (
                self.methylation_source,
                list(biomarker.methylations.values_list('identifier', flat=True)),
                FileType.METHYLATION
            )
        ]


class AlgorithmParameters(models.Model):
    """Common fields for FS algorithms (Blind Search, BBHA, PSO, etc) parameters."""
    fs_experiment = models.OneToOneField(FSExperiment, on_delete=models.CASCADE)

    class Meta:
        abstract = True


class BBHAParameters(AlgorithmParameters):
    """Parameters for the Binary Black Hole Algorithm."""
    n_stars = models.PositiveSmallIntegerField()
    n_iterations = models.PositiveSmallIntegerField()
    version_used = models.IntegerField(choices=BBHAVersion.choices)


class CoxRegressionParameters(AlgorithmParameters):
    """Parameters for the CoxRegression FS algorithm."""
    top_n = models.PositiveSmallIntegerField()


class GeneticAlgorithmsParameters(AlgorithmParameters):
    """Parameters for the GA FS algorithm."""
    n_iterations = models.PositiveSmallIntegerField()
    population_size = models.PositiveSmallIntegerField(default=50)
    mutation_rate = models.FloatField(default=0.01)


def user_directory_path_for_trained_models(instance, filename: str):
    """File will be uploaded to MEDIA_ROOT/uploads/user_<id>/trained_models/<filename>"""
    return f'uploads/user_{instance.biomarker.user.id}/trained_models/{filename}'


TrainedModelParameters = Union[SVMParameters, RFParameters, ClusteringParameters]


class TrainedModel(models.Model):
    """Represents a Model to validate or make inference with a Biomarker."""
    name = models.CharField(max_length=300)
    description = models.TextField(blank=True, null=True)
    biomarker = models.ForeignKey('biomarkers.Biomarker', on_delete=models.CASCADE, related_name='trained_models')
    fs_experiment = models.OneToOneField(FSExperiment, on_delete=models.SET_NULL, related_name='best_model',
                                         null=True, blank=True)
    state = models.IntegerField(choices=TrainedModelState.choices)  # Yes, has the same states as a Biomarker
    fitness_function = models.IntegerField(choices=FitnessFunction.choices)
    model_dump = models.FileField(upload_to=user_directory_path_for_trained_models)
    best_fitness_value = models.FloatField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)

    cross_validation_folds = models.PositiveSmallIntegerField(default=10, validators=[MinValueValidator(3),
                                                                                      MaxValueValidator(10)])
    # Indicates if the cross validation folds were modified to be stratified
    cv_folds_modified = models.BooleanField(default=False)

    # Sources
    clinical_source = models.ForeignKey('api_service.ExperimentClinicalSource', on_delete=models.CASCADE, null=True,
                                        blank=True, related_name='trained_models_as_clinical')

    # Clinical source's survival tuple
    survival_column_tuple_user_file = models.ForeignKey(SurvivalColumnsTupleUserFile, on_delete=models.SET_NULL,
                                                        related_name='trained_models', null=True, blank=True)
    survival_column_tuple_cgds = models.ForeignKey(SurvivalColumnsTupleCGDSDataset, on_delete=models.SET_NULL,
                                                   related_name='trained_models', null=True, blank=True)

    # Sources
    mrna_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True, blank=True,
                                    related_name='trained_models_as_mrna')
    mirna_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True, blank=True,
                                     related_name='trained_models_as_mirna')
    cna_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True, blank=True,
                                   related_name='trained_models_as_cna')
    methylation_source = models.ForeignKey('api_service.ExperimentSource', on_delete=models.CASCADE, null=True,
                                           blank=True, related_name='trained_models_as_methylation')

    task_id = models.CharField(max_length=100, blank=True, null=True)  # Celery Task ID

    # Number of attempts to prevent a buggy model training running forever
    attempt = models.PositiveSmallIntegerField(default=0)

    @property
    def survival_column_tuple(self) -> Union[SurvivalColumnsTupleCGDSDataset, SurvivalColumnsTupleUserFile]:
        """Gets valid SurvivalColumnTuple"""
        if self.survival_column_tuple_user_file:
            return self.survival_column_tuple_user_file

        return self.survival_column_tuple_cgds

    def get_all_sources(self) -> List[Optional['api_service.ExperimentSource']]:
        """Returns a list with all the sources."""
        res = [self.clinical_source]
        if self.mrna_source:
            res.append(self.mrna_source)

        if self.mirna_source:
            res.append(self.mirna_source)

        if self.cna_source:
            res.append(self.cna_source)

        if self.methylation_source:
            res.append(self.methylation_source)

        return res

    def get_sources_and_molecules(self) -> List[Tuple[Optional['api_service.ExperimentSource'], List[str], FileType]]:
        """Returns a list with all the sources (except clinical), the selected molecules and type."""
        biomarker = self.biomarker
        res = []
        if self.mrna_source:
            res.append((
                self.mrna_source,
                list(biomarker.mrnas.values_list('identifier', flat=True)),
                FileType.MRNA
            ))

        if self.mirna_source:
            res.append((
                self.mirna_source,
                list(biomarker.mirnas.values_list('identifier', flat=True)),
                FileType.MIRNA
            ))

        if self.cna_source:
            res.append((
                self.cna_source,
                list(biomarker.cnas.values_list('identifier', flat=True)),
                FileType.CNA
            ))

        if self.methylation_source:
            res.append((
                self.methylation_source,
                list(biomarker.methylations.values_list('identifier', flat=True)),
                FileType.METHYLATION
            ))

        return res

    def __str__(self):
        return f'Trained model ({self.pk}) for Biomarker "{self.biomarker.name}"'

    def get_model_instance(self) -> Optional[Any]:
        """Deserializes the model dump and return the model instance (SurvModel)."""
        # Prevents OS error for non-existing file
        if not self.model_dump:
            return None

        model_path = os.path.join(settings.MEDIA_ROOT, self.model_dump.name)
        with open(model_path, "rb") as fp:
            model = pickle.load(fp)
        return model

    def get_model_parameter(self) -> Optional[TrainedModelParameters]:
        """Returns the corresponding related Parameter instance."""
        if hasattr(self, 'svm_parameters'):
            return self.svm_parameters
        elif hasattr(self, 'clustering_parameters'):
            return self.clustering_parameters
        elif hasattr(self, 'rf_parameters'):
            return self.rf_parameters
        return None

    def save(self, *args, **kwargs):
        """Every time the experiment status changes, uses websockets to update state in the frontend"""
        super().save(*args, **kwargs)

        # Sends a websockets message to update the experiment state in the frontend
        send_update_trained_models_command(self.biomarker.user.id)

    def delete(self, *args, **kwargs):
        """Deletes the instance and sends a websockets message to update state in the frontend"""
        super().delete(*args, **kwargs)

        # Sends a websockets message to update the experiment state in the frontend
        send_update_trained_models_command(self.biomarker.user.id)


class ClusterLabelsSet(models.Model):
    """Represents a set of labels for cluster IDs in a trained model."""
    name = models.CharField(max_length=50)
    description = models.TextField(null=True, blank=True)
    trained_model = models.ForeignKey(TrainedModel, on_delete=models.CASCADE, related_name='cluster_labels')

    def save(self, *args, **kwargs):
        """Every time the experiment status changes, uses websockets to update state in the frontend"""
        super().save(*args, **kwargs)

        # Sends a websockets message to update the list of cluster labels sets in the frontend
        user_id = self.trained_model.biomarker.user.id
        send_update_cluster_label_set_command(user_id)


class ClusterLabel(models.Model):
    """Represents a label for a cluster ID."""
    label = models.CharField(max_length=50)
    color = models.CharField(max_length=9, null=True, blank=True)  # 8 digits for color + 1 for '#'
    cluster_id = models.IntegerField()
    cluster_label_set = models.ForeignKey(ClusterLabelsSet, on_delete=models.CASCADE, related_name='labels')

    def __str__(self):
        return f'Label "{self.label}" for cluster {self.cluster_id} in model "{self.cluster_label_set.name}"'


class PredictionRangeLabelsSet(models.Model):
    """Represents a set of labels for cluster IDs in a trained model."""
    name = models.CharField(max_length=50)
    description = models.TextField(null=True, blank=True)
    trained_model = models.ForeignKey(TrainedModel, on_delete=models.CASCADE, related_name='prediction_ranges_labels')


class PredictionRangeLabel(models.Model):
    """Represents a label for a prediction range."""
    label = models.CharField(max_length=50)
    color = models.CharField(max_length=9, null=True, blank=True)  # 8 digits for color + 1 for '#'
    min_value = models.FloatField(validators=[MinValueValidator(0)])
    max_value = models.FloatField(null=True, blank=True)
    prediction_range_labels_set = models.ForeignKey(PredictionRangeLabelsSet, on_delete=models.CASCADE,
                                                    related_name='labels')

    def __str__(self):
        return f'Label "{self.label}" for range {self.min_value}-{self.max_value} in model ' \
               f'"{self.prediction_range_labels_set.name}"'


class SVMOptimizer(models.TextChoices):
    AVL_TREE = "avltree"
    RB_TREE = "rbtree"


class TimesRecord(models.Model):
    """Represents some metrics to train a Spark load-balancer ML model."""
    number_of_features = models.IntegerField()
    number_of_samples = models.IntegerField()
    execution_time = models.FloatField()  # Execution time in seconds
    fitness = models.FloatField(null=True, blank=True)
    train_score = models.FloatField(null=True, blank=True)

    class Meta:
        abstract = True


class SVMTimesRecord(TimesRecord):
    """Time records during Feature Selection using an SVM as classifier."""
    fs_experiment = models.ForeignKey(FSExperiment, on_delete=models.CASCADE, related_name='svm_times_records')
    # 'number_of_iterations' is a float number as it's the mean, but it's stored as int as it's not much important
    # losing precision in this case
    number_of_iterations = models.SmallIntegerField()
    time_by_iteration = models.FloatField()  # Time by every SVM iteration during training
    test_time = models.FloatField()  # Testing time in seconds

    # These parameters are duplicated here to avoid having to load the related SVMParameters instance. Also,
    # they are retrieved from logs in the Spark job, so they are store in the way the job received them.
    max_iterations = models.SmallIntegerField()
    optimizer = models.CharField(max_length=10, choices=SVMOptimizer.choices)
    kernel = models.IntegerField(choices=SVMKernel.choices)


class RFTimesRecord(TimesRecord):
    """Time records during Feature Selection using a Random Forest as classifier."""
    test_time = models.FloatField()  # Testing time in seconds

    # These parameters are duplicated here to avoid having to load the related RFParameters instance. Also,
    # they are retrieved from logs in the Spark job, so they are store in the way the job received them.
    number_of_trees = models.SmallIntegerField()
    fs_experiment = models.ForeignKey(FSExperiment, on_delete=models.CASCADE, related_name='rf_times_records')


class ClusteringTimesRecord(TimesRecord):
    """Time records during Feature Selection using a Clustering model as classifier."""
    # These parameters are duplicated here to avoid having to load the related ClusteringParameters instance. Also,
    # they are retrieved from logs in the Spark job, so they are store in the way the job received them.
    number_of_clusters = models.SmallIntegerField()
    algorithm = models.IntegerField(choices=ClusteringAlgorithm.choices)
    scoring_method = models.IntegerField(choices=ClusteringScoringMethod.choices)
    fs_experiment = models.ForeignKey(FSExperiment, on_delete=models.CASCADE, related_name='clustering_times_records')
