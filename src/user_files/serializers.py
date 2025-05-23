import json
from typing import List
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db import transaction
from rest_framework import serializers
from common.functions import get_enum_from_value, create_survival_columns_from_json
from datasets_synchronization.models import SurvivalColumnsTupleUserFile
from user_files.models_choices import FileType
from user_files.utils import has_uploaded_file_valid_format, get_invalid_format_response
from users.serializers import UserSimpleSerializer
from institutions.serializers import InstitutionSimpleSerializer
from tags.serializers import TagSerializer
from user_files.models import UserFile


class SurvivalColumnsTupleUserFileSimpleSerializer(serializers.ModelSerializer):
    """SurvivalColumnsTupleUserFile without 'dataset' field to CREATE/UPDATE action"""

    class Meta:
        model = SurvivalColumnsTupleUserFile
        fields = ['id', 'time_column', 'event_column']


class SimpleUserFileSerializer(serializers.ModelSerializer):
    """Serialize a few fields for all experiment list"""
    class Meta:
        model = UserFile
        fields = [
            'id',
            'name',
            'description',
            'file_type'
        ]


class UserFileSerializer(serializers.ModelSerializer):
    user = UserSimpleSerializer(many=False, read_only=True)
    survival_columns = SurvivalColumnsTupleUserFileSimpleSerializer(many=True, read_only=True)

    class Meta:
        model = UserFile
        fields = ['id', 'name', 'description', 'file_obj', 'file_type', 'tag', 'tag_id', 'upload_date', 'institutions',
                  'number_of_rows', 'number_of_samples', 'user', 'contains_nan_values', 'column_used_as_index',
                  'is_cpg_site_id', 'platform', 'survival_columns', 'is_public']

    def validate_file_obj(self, value: InMemoryUploadedFile):
        """
        Checks that the file has numerical values, also considering different types of decimal delimiters
        @param value: Received value from the frontend
        """
        file_type_enum = get_enum_from_value(int(self.initial_data['file_type']), FileType)
        if file_type_enum != FileType.CLINICAL and not has_uploaded_file_valid_format(value):
            raise serializers.ValidationError(get_invalid_format_response())
        return value

    def to_representation(self, instance):
        """
        IMPORTANT: makes a nested representation of the UserFile's Tag object only
        when it gets the object (representation), but we can still sending only the Tag's id when creating
        """
        data = super(UserFileSerializer, self).to_representation(instance)

        data['file_obj'] = instance.file_obj.url  # NOTE: needed as it was rendering a wrong url

        if instance.tag:
            data['tag'] = TagSerializer(instance.tag).data

        data['institutions'] = InstitutionSimpleSerializer(instance.institutions, many=True, read_only=True).data
        data['survival_columns'] = SurvivalColumnsTupleUserFileSimpleSerializer(
            instance.survival_columns,
            many=True,
            read_only=True
        ).data

        # Check if user can delete this instance (is owner or admin of one of the Dataset's institutions)
        request = self.context.get('request')
        if request is not None:
            user = request.user
            is_private = instance.user == user
            is_institution_admin = instance.institutions.filter(
                institutionadministration__user=user,
                institutionadministration__is_institution_admin=True
            ).exists()
            data['is_private_or_institution_admin'] = is_private or is_institution_admin
        else:
            data['is_private_or_institution_admin'] = False
        return data

    def create(self, validated_data):
        """
        Create method to add support for FormData (most of the fields) and JSON (clinical_columns) request type
        See: https://medium.com/@ahm3d.hisham/drf-nested-params-and-multipart-488c86d89191
        @param validated_data: Validated data by Django REST Framework serializer
        @return: Object created
        """
        with transaction.atomic():
            institutions_ids = validated_data.pop('institutions', [])

            # User file and institutions
            user_file = UserFile.objects.create(user=self.context['request'].user, **validated_data)
            user_file.institutions.set(institutions_ids)
            user_file.save()

            # Survival columns
            survival_columns_str = self.context['request'].POST.get('survival_columns', '[]')
            create_survival_columns_from_json(survival_columns_str, user_file)

            # Other fields
            user_file.compute_post_saved_field()
        return user_file

    def update(self, instance: UserFile, validated_data):
        """
        Update method for remove Tag in case that field is not specified in the FormData
        @param instance: Current UserFile instance to be updated
        @param validated_data: Request validated data
        @return: Updated UserFile instance
        """
        # Updates the UserFile instance
        with transaction.atomic():
            instance.name = validated_data.get('name', instance.name)
            instance.file_type = validated_data.get('file_type', instance.file_type)
            instance.description = validated_data.get('description', instance.description)
            instance.tag = validated_data.get('tag')
            instance.institutions.set(validated_data.get('institutions', []))
            instance.is_cpg_site_id = validated_data.get('is_cpg_site_id')
            instance.platform = validated_data.get('platform')

            # Updates survival columns
            survival_columns_str = self.context['request'].POST.get('survival_columns', '[]')
            survival_columns = json.loads(survival_columns_str)
            if not survival_columns:
                instance.survival_columns.all().delete()
            else:
                ids_to_keep: List[int] = []
                for survival_column in survival_columns:
                    survival_column = dict(survival_column)

                    # If there's an existing id, updates the element
                    if 'id' in survival_column:
                        try:
                            survival_column_obj: SurvivalColumnsTupleUserFile = SurvivalColumnsTupleUserFile. \
                                objects.get(pk=survival_column['id'])
                            survival_column_obj.time_column = survival_column['time_column']
                            survival_column_obj.event_column = survival_column['event_column']
                            survival_column_obj.save()
                        except SurvivalColumnsTupleUserFile.DoesNotExist:
                            survival_column_obj = SurvivalColumnsTupleUserFile.objects.create(
                                clinical_dataset=instance,
                                **survival_column
                            )
                    else:
                        # Creates new one
                        survival_column_obj = SurvivalColumnsTupleUserFile.objects.create(
                            clinical_dataset=instance,
                            **survival_column
                        )
                    ids_to_keep.append(survival_column_obj.pk)

                # Removes the ones which were non edited nor created
                instance.survival_columns.exclude(pk__in=ids_to_keep).delete()

            # Saves new changes and returns instance
            # NOTE: it's not necessary to compute post saved field as File object has not changed
            instance.save()
        return instance


class UserFileWithoutFileObjSerializer(UserFileSerializer):
    """Same serializer as UserFileSerializer but without the file_obj field"""

    def to_representation(self, instance):
        """Removes the file_obj to prevent exposure of the media URL"""
        data = super(UserFileWithoutFileObjSerializer, self).to_representation(instance)
        data['file_obj'] = ''
        return data
