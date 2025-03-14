from rest_framework import serializers
from .models import Institution, InstitutionAdministration
from users.serializers import UserSerializer
from django.contrib.auth import get_user_model


class InstitutionSerializer(serializers.ModelSerializer):
    """Institution model serializer"""
    users = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Institution
        fields = '__all__'


class InstitutionSimpleSerializer(serializers.ModelSerializer):
    """A simple serializer for get only some fields for representation"""
    class Meta:
        model = Institution
        fields = ['id', 'name']

class InstitutionListSerializer(serializers.ModelSerializer):
    """A simple serializer for get only the Institution fields"""
    is_user_admin = serializers.SerializerMethodField(method_name='get_is_user_admin')
    class Meta:
        model = Institution
        fields = ['id', 'name', 'location', 'email', 'telephone_number', 'is_user_admin']
    def get_is_user_admin(self, obj: Institution) -> bool:
        user =  self.context['request'].user
        return obj.institutionadministration_set.filter(user=user, is_institution_admin=True).exists()

class LimitedUserSerializer(serializers.ModelSerializer):
    """A lightweight serializer for User model"""
    class Meta:
        model = get_user_model()
        fields = ['id', 'username']

class UserCandidateSerializer(serializers.ModelSerializer):
    """Serializer useful to add a User to an Institution"""
    user = LimitedUserSerializer()
    class Meta:
        model = InstitutionAdministration
        fields = ['id', 'user', 'is_institution_admin']

class InstitutionAdminUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating 'is_institution_admin' in InstitutionAdministration
    """
    class Meta:
        model = InstitutionAdministration
        fields = ['id', 'is_institution_admin']

class UserCandidateLimitedSerializer(serializers.ModelSerializer):
    """Serializer useful to add a User to an Institution"""
    user = LimitedUserSerializer()
    class Meta:
        model = InstitutionAdministration
        fields = ['user']
