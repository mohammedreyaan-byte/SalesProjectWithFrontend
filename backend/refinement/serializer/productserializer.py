from rest_framework import serializers
from ..models import Refinement

#Product Serializer
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model=Refinement
        fields='__all__'
