from channels.generic.websocket import AsyncWebsocketConsumer
import json


class UserConsumer(AsyncWebsocketConsumer):
    """
    A Consumer to handle Asyncronic websocket connections to send real time
    commands to the frontend. Was developed using 'Channels' library, following
    the tutorial: https://channels.readthedocs.io/en/latest/tutorial/
    This consumer is for a specific user channel
    """
    user_group_name: str

    async def connect(self):
        """Handles new Websocket connections"""
        user_id = self.scope['url_route']['kwargs']['id']

        self.user_group_name = f'notifications_{user_id}'

        # Join user group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        """Handles new Websocket disconnections"""
        # Leave user group
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )

    # To send a custom message from Django
    async def send_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps(message))


class AdminConsumer(AsyncWebsocketConsumer):
    """
    A Consumer to handle Asyncronic websocket connections to send real time
    commands to the frontend. Was developed using 'Channels' library, following
    the tutorial: https://channels.readthedocs.io/en/latest/tutorial/.
    This consumer is for all admins channel
    """
    admin_group_name: str

    async def connect(self):
        """Handles new Websocket connections"""
        self.admin_group_name = 'admin_notifications'

        # Join user group
        await self.channel_layer.group_add(
            self.admin_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        """Handles new Websocket disconnections"""
        # Leave user group
        await self.channel_layer.group_discard(
            self.admin_group_name,
            self.channel_name
        )

    # To send a custom message from Django
    async def send_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps(message))
