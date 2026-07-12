


from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from .models import CartItem

@receiver(user_logged_in)
def merge_cart_on_login(sender, request, user, **kwargs):
    """
    Ensures cart persistence after ANY login:
    - Manual login
    - Google login
    """

    session_cart = request.session.get('cart', {})
    db_cart_items = CartItem.objects.filter(user=user)

    merged_cart = {}

    for item in db_cart_items:
        key = f"{item.item_type}_{item.item_id}"
        merged_cart[key] = {
            'id': item.item_id,
            'type': item.item_type,
            'name': item.name,
            'price': float(item.price),
            'quantity': item.quantity,
        }

    for key, item in session_cart.items():
        if key in merged_cart:
            merged_cart[key]['quantity'] += item['quantity']
        else:
            merged_cart[key] = item

    request.session['cart'] = merged_cart
    request.session.modified = True
