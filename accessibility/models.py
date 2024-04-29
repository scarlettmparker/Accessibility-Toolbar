from django.db import models

class ClassifyForm(models.Model):
    image = models.ImageField(max_length=None, allow_empty_file=False, allow_null=False, use_url=True)