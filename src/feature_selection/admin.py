import csv
from typing import Optional
from django.contrib import admin
from django.db.models import QuerySet
from django.http import StreamingHttpResponse
from django.utils import timezone
from django_object_actions import DjangoObjectActions
from biomarkers.models import BiomarkerState
from feature_selection.models import FSExperiment, SVMParameters, ClusteringParameters, TrainedModel, \
    ClusterLabelsSet, ClusterLabel, SVMTimesRecord, RFTimesRecord, ClusteringTimesRecord, RFParameters, \
    CoxRegressionParameters, BBHAParameters, GeneticAlgorithmsParameters


class Echo:
    """
    An object that implements just the write method of the file-like interface.
    Taken from https://docs.djangoproject.com/en/4.2/howto/outputting-csv/#streaming-csv-files
    """

    @staticmethod
    def write(value):
        """Write the value by returning it, instead of storing in a buffer."""
        return value


class FSExperimentAdmin(admin.ModelAdmin):
    @staticmethod
    @admin.display(description='Origin Biomarker')
    def origin_biomarker(obj: FSExperiment) -> Optional[str]:
        return obj.created_biomarker.name if obj.created_biomarker else None

    @staticmethod
    @admin.display(description='Target Biomarker')
    def target_biomarker(obj: FSExperiment) -> Optional[str]:
        return obj.created_biomarker.name if obj.created_biomarker else None

    @staticmethod
    @admin.display(description='Target Biomarker State')
    def target_biomarker_state(obj: FSExperiment) -> Optional[BiomarkerState]:
        return obj.created_biomarker.get_state_display() if obj.created_biomarker else None

    list_display = ('pk', 'origin_biomarker', 'target_biomarker', 'target_biomarker_state', 'algorithm', 'app_name',
                    'emr_job_id')
    list_filter = ('algorithm',)
    search_fields = ('origin_biomarker__name', 'created_biomarker__name')


class TrainedModelAdmin(admin.ModelAdmin):
    @staticmethod
    @admin.display(description='Biomarker')
    def biomarker(obj: TrainedModel) -> Optional[str]:
        return obj.biomarker.name if obj.biomarker else None

    list_display = ('name', 'description', 'biomarker', 'state', 'fitness_function', 'best_fitness_value')
    list_filter = ('state', 'fitness_function')
    search_fields = ('name', 'description', 'biomarker__name')


common_time_record_fields = ('pk', 'number_of_features', 'number_of_samples', 'execution_time', 'fitness')


class SVMTimesRecordAdmin(DjangoObjectActions, admin.ModelAdmin):
    list_display = common_time_record_fields + ('test_time', 'number_of_iterations', 'time_by_iteration',
                                                'max_iterations', 'optimizer', 'kernel')

    @staticmethod
    def export(_request, queryset: QuerySet[SVMTimesRecord]):
        """
        Returns the QuerySet data as a CSV in a StreamingResponse.
        Taken from https://docs.djangoproject.com/en/4.2/howto/outputting-csv/#streaming-csv-files
        """
        data = queryset.values_list('number_of_features', 'number_of_samples', 'execution_time', 'fitness',
                                    'train_score', 'test_time', 'number_of_iterations', 'time_by_iteration',
                                    'max_iterations', 'optimizer', 'kernel')
        rows = (elem for elem in data)
        pseudo_buffer = Echo()
        writer = csv.writer(pseudo_buffer)

        # Sets CSV header
        header = writer.writerow(('Number of features', 'Number of samples', 'Execution time', 'Fitness',
                                  'Train score', 'Test time', 'Number of iterations', 'Time by iteration',
                                  'Max iterations', 'Optimizer', 'Kernel'))

        # Returns the CSV as a StreamingResponse with the current date (only) in the filename
        today = timezone.now().strftime("%Y-%m-%d")
        return StreamingHttpResponse(
            [header] + [writer.writerow(row) for row in rows],
            content_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="SVMTimesRecord-{today}.csv"'}
        )

    changelist_actions = ('export',)


class RFTimesRecordAdmin(DjangoObjectActions, admin.ModelAdmin):
    list_display = common_time_record_fields + ('test_time', 'number_of_trees')

    @staticmethod
    def export(_request, queryset: QuerySet[RFTimesRecord]):
        """
        Returns the QuerySet data as a CSV in a StreamingResponse.
        Taken from https://docs.djangoproject.com/en/4.2/howto/outputting-csv/#streaming-csv-files
        """
        data = queryset.values_list('number_of_features', 'number_of_samples', 'execution_time', 'fitness',
                                    'train_score', 'test_time', 'number_of_trees')
        rows = (elem for elem in data)
        pseudo_buffer = Echo()
        writer = csv.writer(pseudo_buffer)

        # Sets CSV header
        header = writer.writerow(('Number of features', 'Number of samples', 'Execution time', 'Fitness',
                                  'Train score', 'Test time', 'Number of trees'))

        # Returns the CSV as a StreamingResponse with the current date (only) in the filename
        today = timezone.now().strftime("%Y-%m-%d")
        return StreamingHttpResponse(
            [header] + [writer.writerow(row) for row in rows],
            content_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="RFTimesRecord-{today}.csv"'}
        )

    changelist_actions = ('export',)


class ClusteringTimesRecordAdmin(DjangoObjectActions, admin.ModelAdmin):
    list_display = common_time_record_fields + ('number_of_clusters', 'algorithm', 'scoring_method', 'fs_experiment')

    @staticmethod
    def export(_request, queryset: QuerySet[ClusteringTimesRecord]):
        """
        Returns the QuerySet data as a CSV in a StreamingResponse.
        Taken from https://docs.djangoproject.com/en/4.2/howto/outputting-csv/#streaming-csv-files
        """
        data = queryset.values_list('number_of_features', 'number_of_samples', 'execution_time', 'fitness',
                                    'train_score', 'number_of_clusters', 'algorithm', 'scoring_method')

        rows = (elem for elem in data)
        pseudo_buffer = Echo()
        writer = csv.writer(pseudo_buffer)

        # Sets CSV header
        header = writer.writerow(('Number of features', 'Number of samples', 'Execution time', 'Fitness',
                                  'Train score', 'Number of clusters', 'Algorithm', 'Scoring method'))

        # Returns the CSV as a StreamingResponse with the current date (only) in the filename
        today = timezone.now().strftime("%Y-%m-%d")
        return StreamingHttpResponse(
            [header] + [writer.writerow(row) for row in rows],
            content_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="ClusteringTimesRecord-{today}.csv"'}
        )

    changelist_actions = ('export',)


class BBHAParametersAdmin(admin.ModelAdmin):
    list_display = ('n_stars', 'n_iterations', 'version_used', 'fs_experiment')
    list_filter = ('version_used',)


class CoxRegressionParametersAdmin(admin.ModelAdmin):
    list_display = ('top_n',)


admin.site.register(FSExperiment, FSExperimentAdmin)
admin.site.register(SVMParameters)
admin.site.register(RFParameters)
admin.site.register(ClusteringParameters)
admin.site.register(GeneticAlgorithmsParameters)
admin.site.register(TrainedModel, TrainedModelAdmin)
admin.site.register(ClusterLabelsSet)
admin.site.register(ClusterLabel)
admin.site.register(SVMTimesRecord, SVMTimesRecordAdmin)
admin.site.register(RFTimesRecord, RFTimesRecordAdmin)
admin.site.register(ClusteringTimesRecord, ClusteringTimesRecordAdmin)
admin.site.register(BBHAParameters, BBHAParametersAdmin)
admin.site.register(CoxRegressionParameters, CoxRegressionParametersAdmin)
