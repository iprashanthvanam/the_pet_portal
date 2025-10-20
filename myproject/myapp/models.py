from django.db import models
from django.urls import reverse

class Pet(models.Model):
    name = models.CharField(max_length=100)
    species = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    date_added = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='pets/', blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.species})"

    def get_absolute_url(self):
        return reverse('pets')  # Redirect to pets page