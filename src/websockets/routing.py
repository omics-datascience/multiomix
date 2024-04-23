from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/users/(?P<id>\w+)/$', consumers.UserConsumer.as_asgi()),
    re_path(r'ws/admins/$', consumers.AdminConsumer.as_asgi())
]
