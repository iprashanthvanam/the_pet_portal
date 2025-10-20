# # myapp/admin.py
# from django.contrib import admin
# from .models import Pet

# # Define the admin class
# class PetAdmin(admin.ModelAdmin):
#     list_display = ('name', 'species', 'date_added')
#     fields = ('name', 'species', 'description', 'image', 'date_added')

# # Only unregister if the model is registered
# try:
#     admin.site.unregister(Pet)
# except admin.sites.NotRegistered:
#     pass

# # Register the model with the custom admin class
# admin.site.register(Pet, PetAdmin)

# # Customize the "View site" link to point to /pets/
# admin.site.site_url = '/pets/'



# myapp/admin.py
from django.contrib import admin
from .models import Pet

# Define the admin class
class PetAdmin(admin.ModelAdmin):
    list_display = ('name', 'species', 'date_added')
    fields = ('name', 'species', 'description', 'image')  # Removed 'date_added' to fix the error

# Only unregister if the model is registered
try:
    admin.site.unregister(Pet)
except admin.sites.NotRegistered:
    pass

# Register the model with the custom admin class
admin.site.register(Pet, PetAdmin)

# Customize the "View site" link to point to /pets/
admin.site.site_url = '/pets/'