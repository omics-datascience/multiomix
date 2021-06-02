from typing import Optional, List, OrderedDict
from django.db import transaction
from rest_framework import serializers
from api_service.models import Experiment
from api_service.mongo_service import global_mongo_service
from api_service.utils import create_clinical_dataset_from_cgds_study
from common.enums import ResponseCode
from common.response import ResponseStatus
from .enums import CreateCGDSStudyResponseCode
from .models import CGDSStudy, CGDSDataset, SurvivalColumnsTupleCGDSDataset
from django.db.models import Q


class CGDSDatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = CGDSDataset
        fields = '__all__'


class SurvivalColumnsTupleCGDSSimpleSerializer(serializers.ModelSerializer):
    """SurvivalColumnsTuple without 'dataset' field to CREATE action"""
    # This need to be explicitly defined due to implicit removal on update...
    # See https://stackoverflow.com/q/58123315/7058363 or https://github.com/encode/django-rest-framework/issues/2320
    id = serializers.IntegerField()

    class Meta:
        model = SurvivalColumnsTupleCGDSDataset
        fields = ['id', 'time_column', 'event_column']

    def get_fields(self, *args, **kwargs):
        fields = super(SurvivalColumnsTupleCGDSSimpleSerializer, self).get_fields(*args, **kwargs)
        request = self.context.get('request', None)
        if request and getattr(request, 'method', None) == "POST":
            fields['id'].required = False
        return fields


class CGDSDatasetWithSurvivalDataSerializer(serializers.ModelSerializer):
    survival_columns = SurvivalColumnsTupleCGDSSimpleSerializer(many=True)

    class Meta:
        model = CGDSDataset
        fields = '__all__'


class CGDSStudySerializer(serializers.ModelSerializer):
    # Generate a Nested relationships.
    # See https://www.django-rest-framework.org/api-guide/relations/#nested-relationships)
    mrna_dataset = CGDSDatasetSerializer(required=False, allow_null=True)
    mirna_dataset = CGDSDatasetSerializer(required=False, allow_null=True)
    cna_dataset = CGDSDatasetSerializer(required=False, allow_null=True)
    methylation_dataset = CGDSDatasetSerializer(required=False, allow_null=True)
    clinical_patient_dataset = CGDSDatasetWithSurvivalDataSerializer(required=False, allow_null=True)
    clinical_sample_dataset = CGDSDatasetSerializer(required=False, allow_null=True)

    class Meta:
        model = CGDSStudy
        fields = '__all__'

    def __create_cgds_dataset(self, validated_data_pop: OrderedDict) -> Optional[CGDSDataset]:
        """
        Creates a CGDSDataset instance from a request data
        @param validated_data_pop: Data extracted from request
        @return: A CGDSDataset instance if validated_data_pop is not None. None otherwise
        """
        if not validated_data_pop:
            return None

        # Checks if mongo collection exists to raise an error
        mongo_collection_name = validated_data_pop.get('mongo_collection_name')
        self.__check_collection_name(mongo_collection_name, editing_cgds_dataset_id=None)

        # Creates CGDSDataset
        cgds_dataset = CGDSDataset.objects.create(
            file_path=validated_data_pop.get('file_path'),
            observation=validated_data_pop.get('observation'),
            separator=validated_data_pop.get('separator'),
            header_row_index=validated_data_pop.get('header_row_index'),
            mongo_collection_name=mongo_collection_name,
            is_cpg_site_id=validated_data_pop.get('is_cpg_site_id'),
            platform=validated_data_pop.get('platform')
        )

        # Creates CGDSDataset's survival columns
        self.__update_survival_columns(cgds_dataset, validated_data_pop)
        cgds_dataset.save()

        return cgds_dataset

    @staticmethod
    def __check_collection_name(mongo_collection_name: str, editing_cgds_dataset_id: Optional[int]):
        """
        Checks if a collection name is valid. I.e. is not duplicated in another CGDSDataset
        @param mongo_collection_name: Mongo collection name
        @param editing_cgds_dataset_id: CGDSDataset ID which is being edited to check that the existing name is
        not present in same CGDSDataset to prevent false positives
        @raise ValidationError is the name is duplicated
        """
        condition = Q(mongo_collection_name=mongo_collection_name)
        if editing_cgds_dataset_id is not None:
            condition &= ~Q(id=editing_cgds_dataset_id)

        cgds_dataset_with_original_name: Optional[CGDSDataset]
        try:
            cgds_dataset_with_original_name = CGDSDataset.objects.get(condition)
        except CGDSDataset.DoesNotExist:
            cgds_dataset_with_original_name = None
        if cgds_dataset_with_original_name is not None:
            raise serializers.ValidationError({
                'status': ResponseStatus(
                    ResponseCode.ERROR,
                    message=f'The collection \'{mongo_collection_name}\' already exists in '
                            f'\'{cgds_dataset_with_original_name.study.name}\' study',
                    internal_code=CreateCGDSStudyResponseCode.CGDS_WITH_DUPLICATED_COLLECTION_NAME
                ).to_json(),
            })

    def __update_cgds_dataset(
        self,
        cgds_dataset_instance: CGDSDataset,
        validated_data_pop
    ) -> Optional[CGDSDataset]:
        """
        Updates a CGDSDataset instance from a request data
        @param cgds_dataset_instance: Current CGDSDataset instance of the CGDSStudy being updated
        @param validated_data_pop: Data extracted from request
        @return: A CGDSDataset instance if validated_data_pop is not None. None otherwise
        """
        if validated_data_pop is None:
            # If there's an old CGDSDataset instance removes the instance to trigger the MongoDB collection deletion
            if cgds_dataset_instance is not None:
                cgds_dataset_instance.delete()
            return None

        # If there's new data and there wasn't a CGDSDataset instance, creates a new one
        if cgds_dataset_instance is None:
            return self.__create_cgds_dataset(validated_data_pop)

        # Checks if mongo collection exists in another CGDSDataset to raise an error
        new_mongo_collection_name = validated_data_pop.get('mongo_collection_name')
        self.__check_collection_name(new_mongo_collection_name, editing_cgds_dataset_id=cgds_dataset_instance.pk)

        # Updates current CGDSDataset instance
        cgds_dataset_instance.file_path = validated_data_pop.get('file_path', cgds_dataset_instance.file_path)
        cgds_dataset_instance.header_row_index = validated_data_pop.get(
            'header_row_index',
            cgds_dataset_instance.header_row_index
        )
        cgds_dataset_instance.separator = validated_data_pop.get('separator', cgds_dataset_instance.separator)
        cgds_dataset_instance.observation = validated_data_pop.get('observation', cgds_dataset_instance.observation)

        # Updates SurvivalColumnsTuples
        self.__update_survival_columns(cgds_dataset_instance, validated_data_pop)

        # If It's different for current value drops the old collection
        if cgds_dataset_instance.mongo_collection_name != new_mongo_collection_name:
            global_mongo_service.drop_collection(new_mongo_collection_name)
            cgds_dataset_instance.mongo_collection_name = new_mongo_collection_name

        # Saves new changes and returns instance
        cgds_dataset_instance.save()
        return cgds_dataset_instance

    @staticmethod
    def __update_survival_columns(cgds_dataset_instance: CGDSDataset, validated_data_pop: OrderedDict):
        """
        Adds, edits or removes SurvivalColumnsTuples of the CGDSDataset instance which is being edited
        @param cgds_dataset_instance: CGDSDataset instance to update
        @param validated_data_pop: Request validated data to extract fields
        """
        survival_columns_dicts = validated_data_pop.get('survival_columns')
        if not survival_columns_dicts:
            cgds_dataset_instance.survival_columns.all().delete()
        else:
            ids_to_keep: List[int] = []
            for survival_column in survival_columns_dicts:
                survival_column = dict(survival_column)

                # If there's an existing id, updates the element
                if 'id' in survival_column:
                    try:
                        survival_column_obj: SurvivalColumnsTupleCGDSDataset = SurvivalColumnsTupleCGDSDataset. \
                            objects.get(
                                pk=survival_column['id']
                            )
                        survival_column_obj.time_column = survival_column['time_column']
                        survival_column_obj.event_column = survival_column['event_column']
                        survival_column_obj.save()
                    except SurvivalColumnsTupleCGDSDataset.DoesNotExist:
                        survival_column_obj = SurvivalColumnsTupleCGDSDataset.objects.create(
                            clinical_dataset=cgds_dataset_instance,
                            **survival_column
                        )
                else:
                    # Creates new one
                    survival_column_obj = SurvivalColumnsTupleCGDSDataset.objects.create(
                        clinical_dataset=cgds_dataset_instance,
                        **survival_column
                    )
                ids_to_keep.append(survival_column_obj.pk)

            # Removes the ones which were non edited nor created
            cgds_dataset_instance.survival_columns.exclude(pk__in=ids_to_keep).delete()

    # Writable nested serializers
    # See https://www.django-rest-framework.org/api-guide/relations/#writable-nested-serializers
    def create(self, validated_data) -> Optional[CGDSStudy]:
        """
        Create method for writable nested relationship
        @param validated_data: Request validated data
        @return: Created CGDSStudy instance
        """
        # Creates CGDSDatasets from request data
        with transaction.atomic():
            mrna_dataset = self.__create_cgds_dataset(validated_data.pop('mrna_dataset'))
            mirna_dataset = self.__create_cgds_dataset(validated_data.pop('mirna_dataset'))
            cna_dataset = self.__create_cgds_dataset(validated_data.pop('cna_dataset'))
            methylation_dataset = self.__create_cgds_dataset(validated_data.pop('methylation_dataset'))
            clinical_patient_dataset = self.__create_cgds_dataset(validated_data.pop('clinical_patient_dataset'))
            clinical_sample_dataset = self.__create_cgds_dataset(validated_data.pop('clinical_sample_dataset'))

            # Creates the CGDSStudy
            return CGDSStudy.objects.create(
                mrna_dataset=mrna_dataset,
                mirna_dataset=mirna_dataset,
                cna_dataset=cna_dataset,
                methylation_dataset=methylation_dataset,
                clinical_patient_dataset=clinical_patient_dataset,
                clinical_sample_dataset=clinical_sample_dataset,
                **validated_data
            )

    @staticmethod
    def __set_clinical_datasets_to_existing_experiments(cgds_study: CGDSStudy):
        """
        Gets the experiment that uses a specific CGDSStudy to set the corresponding clinical data
        @param cgds_study: CGDSStudy to obtain experiments from its CGDSDatasets
        """
        experiments = Experiment.objects.filter(
            Q(mRNA_source__cgds_dataset=cgds_study.mrna_dataset) |
            Q(gem_source__cgds_dataset=cgds_study.mirna_dataset) |
            Q(gem_source__cgds_dataset=cgds_study.cna_dataset) |
            Q(gem_source__cgds_dataset=cgds_study.methylation_dataset)
        )

        for i in range(len(experiments)):
            experiments[i].clinical_source = create_clinical_dataset_from_cgds_study(cgds_study)
        Experiment.objects.bulk_update(experiments, ['clinical_source'])

    def update(self, instance: CGDSStudy, validated_data):
        """
        Update method for writable nested relationship
        @param instance: Current CGDSStudy instance to be updated
        @param validated_data: Request validated data
        @return: Updated CGDSStudy instance
        """
        # Updates CGDSDatasets from request data
        with transaction.atomic():
            mrna_dataset = self.__update_cgds_dataset(instance.mrna_dataset, validated_data.pop('mrna_dataset'))
            mirna_dataset = self.__update_cgds_dataset(instance.mirna_dataset, validated_data.pop('mirna_dataset'))
            cna_dataset = self.__update_cgds_dataset(instance.cna_dataset, validated_data.pop('cna_dataset'))
            methylation_dataset = self.__update_cgds_dataset(
                instance.methylation_dataset,
                validated_data.pop('methylation_dataset')
            )

            old_clinical_patient_dataset = instance.clinical_patient_dataset
            old_clinical_sample_dataset = instance.clinical_sample_dataset

            clinical_patient_dataset = self.__update_cgds_dataset(
                instance.clinical_patient_dataset,
                validated_data.pop('clinical_patient_dataset')
            )
            clinical_sample_dataset = self.__update_cgds_dataset(
                instance.clinical_sample_dataset,
                validated_data.pop('clinical_sample_dataset')
            )

            # If it has been created clinical data, it's needed to link to existing experiments referencing to this
            # CGDSStudy
            if (old_clinical_patient_dataset is None and old_clinical_sample_dataset is None) and \
                    (clinical_patient_dataset is not None and clinical_sample_dataset is not None):
                self.__set_clinical_datasets_to_existing_experiments(instance)

            # Updates the CGDSStudy instance
            instance.name = validated_data.get('name', instance.name)
            instance.description = validated_data.get('description', instance.description)
            instance.url = validated_data.get('url', instance.url)
            instance.url_study_info = validated_data.get('url_study_info', instance.url_study_info)

            # Updates datasets
            instance.mrna_dataset = mrna_dataset
            instance.mirna_dataset = mirna_dataset
            instance.cna_dataset = cna_dataset
            instance.methylation_dataset = methylation_dataset
            instance.clinical_patient_dataset = clinical_patient_dataset
            instance.clinical_sample_dataset = clinical_sample_dataset

            # Saves new changes and returns instance
            instance.save()
            return instance


class SimpleCGDSDatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = CGDSDataset
        fields = []

    def to_representation(self, instance):
        # Gets the file content for user_file
        data = super(SimpleCGDSDatasetSerializer, self).to_representation(instance)

        # Serialize the study
        study = instance.study
        data['name'] = study.name
        data['description'] = study.description
        data['file_type'] = instance.file_type
        data['file_obj'] = None

        return data
