from rest_framework import serializers
from .models import Tissue


class TissueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tissue
        fields = ['id', 'name']
