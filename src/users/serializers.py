from django.forms import ValidationError
from rest_framework import serializers
from django.contrib.auth import get_user_model
from institutions.models import Institution
from django.db import transaction
from django.contrib.auth.hashers import make_password

from multiomics_intermediate import settings



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'is_superuser', 'first_name', 'last_name']

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

class UserUpdateSerializer(serializers.ModelSerializer):
    """"fields that are received to update the user"""
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = get_user_model()
        fields = ['first_name', 'last_name', 'password']
    
    def update(self, instance, validated_data):
        """Updates the users first_name, last_name, and password fields."""
        with transaction.atomic():
            instance.first_name = validated_data.get('first_name', instance.first_name)
            instance.last_name = validated_data.get('last_name', instance.last_name)

            password = validated_data.pop('password', '')
            
            minimum_password_len = settings.MIN_PASSWORD_LEN
            password_length = len(password)
            if password_length != 0:
                if password_length < minimum_password_len:
                    raise ValidationError(f'Password must be at least {minimum_password_len} chars long')

            instance.set_password(password)
            
            instance.save()
        return instance
        