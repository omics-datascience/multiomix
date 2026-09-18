import os
from typing import List, Optional
from django.conf import settings


class EmbeddingService:
    """Singleton lazy-loader for HuggingFace sentence-transformers embeddings."""

    _instance: Optional['EmbeddingService'] = None
    _model = None

    def __new__(cls) -> 'EmbeddingService':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _get_model(self):
        if self._model is None:
            from langchain_huggingface import HuggingFaceEmbeddings

            # Use HF_TOKEN if provided, otherwise run fully offline (model cached locally).
            # Inference always runs locally — no text data is ever sent to HuggingFace.
            hf_token = settings.ASSISTANT_HF_TOKEN
            local_only = not hf_token and self._is_cached(settings.ASSISTANT_EMBEDDING_MODEL)

            self._model = HuggingFaceEmbeddings(
                model_name=settings.ASSISTANT_EMBEDDING_MODEL,
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True},
                cache_folder=settings.ASSISTANT_HF_CACHE_DIR,
                **({"huggingface_api_token": hf_token} if hf_token else {}),
            )
        return self._model

    @staticmethod
    def _is_cached(model_name: str) -> bool:
        """Check if the model weights are already in the local HuggingFace cache."""
        cache_dir = settings.ASSISTANT_HF_HOME
        model_slug = model_name.replace('/', '--')
        hub_path = os.path.join(cache_dir, 'hub', f'models--{model_slug}')
        return os.path.isdir(hub_path)

    def embed(self, text: str) -> List[float]:
        return self._get_model().embed_query(text)

    def embed_many(self, texts: List[str]) -> List[List[float]]:
        return self._get_model().embed_documents(texts)


embedding_service = EmbeddingService()
