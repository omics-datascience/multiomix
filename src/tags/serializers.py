from drf_writable_nested import WritableNestedModelSerializer
from rest_framework import serializers
from tags.models import Tag


class TagSerializer(WritableNestedModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'description', 'parent_tag', 'type']
