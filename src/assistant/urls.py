from django.urls import path
from .views import ChatView, ConversationListView, ConversationDetailView

urlpatterns = [
    path('api/chat/', ChatView.as_view(), name='assistant_chat'),
    path('api/conversations/', ConversationListView.as_view(), name='assistant_conversations'),
    path('api/conversations/<int:pk>/', ConversationDetailView.as_view(), name='assistant_conversation_detail'),
]
