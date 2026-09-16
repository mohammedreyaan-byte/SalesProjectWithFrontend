from django.db import models

class Refinement(models.Model):
    id = models.IntegerField(primary_key=True)
    product = models.CharField(max_length=100)
    price = models.FloatField()
    rating = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
