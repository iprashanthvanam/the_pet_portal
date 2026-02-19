









from django import forms
from .models import Order


class OrderCreateForm(forms.ModelForm):
    payment_method = forms.ChoiceField(
        choices=Order.PAYMENT_METHODS,
        widget=forms.RadioSelect
    )

    class Meta:
        model = Order
        fields = [
            'full_name',
            'email',
            'mobile_number',
            'address',
            'city',
            'postal_code',
            'payment_method',
        ]
