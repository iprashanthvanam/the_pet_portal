

from django.apps import AppConfig
from django.db.models.signals import post_migrate

def update_site(sender, **kwargs):
    try:
        from django.contrib.sites.models import Site
        Site.objects.filter(id=1).update(domain='127.0.0.1:8000', name='Pet Portal')
    except Exception:
        pass

class MyappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'myapp'

    def ready(self):
        import myapp.signals
        post_migrate.connect(update_site, sender=self)
