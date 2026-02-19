from django import template

register = template.Library()

@register.filter
def get_item(dictionary, key):
    """
    Safe dictionary lookup for templates
    """
    if not dictionary:
        return 0
    return dictionary.get(key, 0)
