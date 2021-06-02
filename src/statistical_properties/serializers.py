from rest_framework import serializers
from statistical_properties.models import NormalityTest, GoldfeldQuandtTest, LinearityTest, MonotonicTest, \
    BreuschPaganTest, SourceDataStatisticalProperties, SourceDataOutliers


class NormalityTestSerializer(serializers.ModelSerializer):
    """NormalityTest serializer"""
    class Meta:
        model = NormalityTest
        exclude = ['id']


class BreuschPaganTestSerializer(serializers.ModelSerializer):
    """BreuschPaganTest serializer"""
    class Meta:
        model = BreuschPaganTest
        exclude = ['id']


class GoldfeldQuandtTestSerializer(serializers.ModelSerializer):
    """GoldfeldQuandtTest serializer"""
    class Meta:
        model = GoldfeldQuandtTest
        exclude = ['id']


class LinearityTestSerializer(serializers.ModelSerializer):
    """LinearityTest serializer"""
    class Meta:
        model = LinearityTest
        exclude = ['id']


class MonotonicTestSerializer(serializers.ModelSerializer):
    """LinearityTest serializer"""
    class Meta:
        model = MonotonicTest
        exclude = ['id']


class SourceDataOutliersSerializer(serializers.ModelSerializer):
    """SourceDataOutliers serializer"""
    class Meta:
        model = SourceDataOutliers
        fields = ['sample_identifier', 'expression']


class SourceDataStatisticalPropertiesSerializer(serializers.ModelSerializer):
    """SourceDataStatisticalProperties serializer"""
    gene_normality = NormalityTestSerializer(read_only=True)
    gem_normality = NormalityTestSerializer(read_only=True)
    heteroscedasticity_breusch_pagan = BreuschPaganTestSerializer(read_only=True)
    homoscedasticity_goldfeld_quandt = GoldfeldQuandtTestSerializer(read_only=True)
    linearity = LinearityTestSerializer(read_only=True)
    monotonicity = MonotonicTestSerializer(read_only=True)

    class Meta:
        model = SourceDataStatisticalProperties
        fields = '__all__'

    def to_representation(self, instance):
        data = super(SourceDataStatisticalPropertiesSerializer, self).to_representation(instance)

        # Adds gene/GEM outliers
        data['gene_outliers'] = SourceDataOutliersSerializer(instance.gene_outliers, read_only=True, many=True).data
        data['gem_outliers'] = SourceDataOutliersSerializer(instance.gem_outliers, read_only=True, many=True).data

        return data