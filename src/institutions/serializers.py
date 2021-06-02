from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Institution
from frontend.serializers import UserSerializer


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


class UserCandidateSerializer(serializers.ModelSerializer):
    """Serializer useful to add a User to an Institution"""
    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'email']
