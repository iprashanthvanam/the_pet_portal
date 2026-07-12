from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth.models import User
from myapp.models import UserProfile

class MySocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        # If the user already exists in sociallogin, let it proceed
        if sociallogin.is_existing:
            return

        # Check if email is associated with a social account
        if not sociallogin.email_addresses:
            return

        for email_address in sociallogin.email_addresses:
            try:
                # Search for an existing user with the same email
                existing_user = User.objects.get(email__iexact=email_address.email)
                # Link the social login to this existing user
                sociallogin.connect(request, existing_user)
                
                # Make sure the user has a profile
                profile, created = UserProfile.objects.get_or_create(user=existing_user)
                break
            except User.DoesNotExist:
                continue
