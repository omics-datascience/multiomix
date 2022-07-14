from rest_framework import serializers
from django.contrib.auth import get_user_model
from institutions.models import Institution


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'is_superuser']

    def to_representation(self, instance):
        # Adds custom fields
        data = super(UserSerializer, self).to_representation(instance)

        # Check if current user has any institutions where he's admin
        data['is_institution_admin'] = Institution.objects.filter(
            institutionadministration__user=instance,
            institutionadministration__is_institution_admin=True
        ).exists()

        # User at this point is not anonymous
        data['is_anonymous'] = False

        return data


class UserSimpleSerializer(serializers.ModelSerializer):
    """User serializer with fewer data"""
    class Meta:
        model = get_user_model()
        fields = ['id', 'username']
