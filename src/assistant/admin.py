from django.contrib import admin
from .models import Conversation, Message, CuratedDocument


@admin.register(CuratedDocument)
class CuratedDocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'is_active', 'updated_at']
    list_filter = ['is_active', 'category']
    search_fields = ['title', 'content']

    def save_model(self, request, obj, form, change):
        """Auto-generate embedding when saving a CuratedDocument."""
        super().save_model(request, obj, form, change)
        try:
            from assistant.services.embedding_service import embedding_service
            text = f'{obj.title}\n{obj.content}'
            obj.embedding = embedding_service.embed(text)
            CuratedDocument.objects.filter(pk=obj.pk).update(embedding=obj.embedding)
        except Exception as e:
            self.message_user(request, f'Warning: could not generate embedding: {e}', level='warning')


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'created_at', 'updated_at']
    list_filter = ['user']
    search_fields = ['title', 'user__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'role', 'content_preview', 'created_at']
    list_filter = ['role']
    readonly_fields = ['created_at', 'embedding']

    def content_preview(self, obj):
        return obj.content[:80]
    content_preview.short_description = 'Content'
