from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
import websockets.routing

application = ProtocolTypeRouter({
    # IMPORTANT: http->django views is added by default
    'websocket': AuthMiddlewareStack(
        URLRouter(
            websockets.routing.websocket_urlpatterns
        )
    ),
})
