# Multiomix AI Assistant

Documentación técnica del asistente de IA integrado en la plataforma Multiomix.

---

## Tabla de contenidos

1. [Visión general](#1-visión-general)
2. [Arquitectura](#2-arquitectura)
3. [Backend — Django app `assistant`](#3-backend--django-app-assistant)
   - [Modelos](#modelos)
   - [API REST](#api-rest)
   - [Servicio de embeddings](#servicio-de-embeddings)
   - [Servicio LLM y agente](#servicio-llm-y-agente)
   - [Memoria semántica cross-chat](#memoria-semántica-cross-chat)
4. [Tools disponibles](#4-tools-disponibles)
   - [Datos del usuario (Multiomix)](#datos-del-usuario-multiomix)
   - [Información biológica (BioAPI / Modulector)](#información-biológica-bioapi--modulector)
   - [STRING database](#string-database)
   - [Base de conocimiento curada](#base-de-conocimiento-curada)
5. [Frontend — React widget](#5-frontend--react-widget)
6. [Flujo completo de una consulta](#6-flujo-completo-de-una-consulta)
7. [Variables de entorno y configuración](#7-variables-de-entorno-y-configuración)
8. [Cómo cambiar el modelo LLM](#8-cómo-cambiar-el-modelo-llm)
9. [Cómo agregar una nueva tool](#9-cómo-agregar-una-nueva-tool)
10. [Cómo agregar documentación curada](#10-cómo-agregar-documentación-curada)
11. [Dependencias](#11-dependencias)

---

## 1. Visión general

El asistente es un **agente LLM con tool-calling** embebido en Multiomix como widget flotante visible en todas las páginas de la plataforma (solo para usuarios autenticados). Permite a los usuarios consultar en lenguaje natural:

- Sus propios experimentos, resultados y biomarkers
- Información biológica de genes, miRNAs, drogas
- Redes de interacción proteica y enriquecimiento funcional (STRING)
- Documentación y conceptos generales de la plataforma

El asistente **nunca inventa datos**. Siempre recupera información real vía tools conectadas a la base de datos de Multiomix y a APIs externas.

---

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND (React)                                                    │
│                                                                      │
│  ChatWidget (FAB)  →  ChatPanel  →  ConversationList + MessageThread│
│       ↕ localStorage (open state, active conv ID)                   │
└────────────────────────┬────────────────────────────────────────────┘
                         │ HTTP (ky, 3 min timeout)
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DJANGO — app: assistant                                            │
│                                                                      │
│  POST /assistant/api/chat/          → ChatView (sync, DRF)          │
│  GET  /assistant/api/conversations/ → ConversationListView          │
│  GET/DELETE /assistant/api/conversations/<id>/ → ConversationDetailView│
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  llm_service.run_chat()                                             │
│                                                                      │
│  1. EmbeddingService.embed(user_message)  ← HuggingFace local      │
│  2. build_chat_history()                  ← PostgreSQL + pgvector   │
│     ├─ 15 mensajes recientes (conversación actual)                  │
│     └─ 5 mensajes semánticamente similares (TODAS las conversaciones│
│         del usuario — memoria cross-chat)                           │
│  3. AgentExecutor.invoke()                ← LangChain + OpenAI      │
│     └─ create_tool_calling_agent(llm, tools, prompt)               │
│  4. Persistir user msg + assistant reply con embeddings             │
└──────────┬──────────────────────────────────────────────────────────┘
           │ tool calls
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TOOLS (18 tools)                                                   │
│                                                                      │
│  ├─ PostgreSQL (Django ORM)  → experimentos, biomarkers, archivos   │
│  ├─ MongoDB                  → resultados de experimentos           │
│  ├─ Modulector API           → interacciones miRNA-gen              │
│  ├─ BioAPI                   → anotaciones génicas, drogas          │
│  └─ STRING REST API          → interacciones proteicas, enrichment  │
└─────────────────────────────────────────────────────────────────────┘
           │ embeddings
           ▼
┌────────────────────────────┐
│  PostgreSQL + pgvector      │
│  Conversation, Message,     │
│  CuratedDocument            │
│  (VectorField 384 dims)     │
└────────────────────────────┘
```

---

## 3. Backend — Django app `assistant`

### Modelos

Ubicación: `src/assistant/models.py`

#### `Conversation`
Agrupa los mensajes de una sesión de chat.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user` | FK → User | Propietario de la conversación |
| `title` | CharField | Primeros 100 caracteres del primer mensaje (se genera automáticamente) |
| `created_at` | DateTimeField | Fecha de creación |
| `updated_at` | DateTimeField | Se actualiza en cada turno |

#### `Message`
Un mensaje individual (usuario o asistente) dentro de una conversación.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `conversation` | FK → Conversation | Conversación a la que pertenece |
| `role` | CharField | `user` o `assistant` |
| `content` | TextField | Contenido del mensaje |
| `embedding` | VectorField(384) | Embedding semántico para búsqueda |
| `created_at` | DateTimeField | Timestamp |

#### `CuratedDocument`
Documentación manual sobre Multiomix que el agente puede consultar vía búsqueda semántica.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `title` | CharField | Título del documento |
| `content` | TextField | Contenido (texto libre / markdown) |
| `category` | CharField | Categoría (e.g. `"platform"`, `"biology"`) |
| `embedding` | VectorField(384) | Generado automáticamente al guardar desde el admin |
| `is_active` | BooleanField | Si está activo para búsqueda |

> Los documentos curados se gestionan desde el **Django Admin** en `/admin/`. Al guardar, el embedding se genera automáticamente.

---

### API REST

Todos los endpoints requieren autenticación (`IsAuthenticated`).

| Método | URL | Descripción |
|--------|-----|-------------|
| `POST` | `/assistant/api/chat/` | Enviar un mensaje y recibir respuesta |
| `GET` | `/assistant/api/conversations/` | Listar conversaciones del usuario |
| `GET` | `/assistant/api/conversations/<id>/` | Detalle de conversación con todos sus mensajes |
| `DELETE` | `/assistant/api/conversations/<id>/` | Eliminar una conversación |

**POST `/assistant/api/chat/`**

Request:
```json
{
  "message": "¿Cuáles son mis experimentos de correlación?",
  "conversation_id": 42  // opcional; si se omite, se crea una nueva conversación
}
```

Response:
```json
{
  "conversation_id": 42,
  "reply": "Tenés **3 experimentos** de correlación..."
}
```

---

### Servicio de embeddings

Ubicación: `src/assistant/services/embedding_service.py`

- Modelo: `sentence-transformers/all-MiniLM-L6-v2` (384 dimensiones)
- **Inferencia 100% local** — no se envía texto a ningún servidor externo
- Implementado como **singleton lazy-loader**: el modelo se carga en memoria la primera vez que se necesita y se reutiliza
- Configurable via `ASSISTANT_EMBEDDING_MODEL` y `ASSISTANT_EMBEDDING_DIMENSIONS`

```python
from assistant.services.embedding_service import embedding_service

vector = embedding_service.embed("TP53 expression in breast cancer")
# → List[float] con 384 valores
```

> Si el modelo no está en caché local (`~/.cache/huggingface/`), se descarga automáticamente al primer inicio.

---

### Servicio LLM y agente

Ubicación: `src/assistant/services/llm_service.py`

El agente usa el patrón estándar de LangChain **ReAct con tool-calling**:

```python
agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, max_iterations=5)
```

El prompt tiene 4 secciones:
1. **System prompt** — scope, restricciones, instrucciones de formato markdown
2. **Chat history** — mensajes anteriores (recientes + semánticos)
3. **Human message** — consulta actual del usuario
4. **Agent scratchpad** — espacio interno del agente para razonar y ejecutar tools

**Restricciones del system prompt**: el agente solo responde preguntas sobre bioinformática, la plataforma Multiomix, y los datos del usuario. Si la pregunta está fuera de scope, responde con un mensaje fijo de rechazo.

**Función `get_llm()`**: punto de intercambio del modelo. Ver sección [8](#8-cómo-cambiar-el-modelo-llm).

---

### Memoria semántica cross-chat

El historial de contexto que recibe el agente en cada turno se construye así:

```
build_chat_history(conversation, user_id, query_embedding)
```

| Fuente | Cantidad | Filtro |
|--------|----------|--------|
| Mensajes recientes | Últimos 15 | Solo conversación actual |
| Mensajes semánticos | Top 5 por similitud coseno | **Todas las conversaciones del usuario** |

La búsqueda semántica cross-chat permite que el asistente recuerde información mencionada en chats anteriores (ej. nombre del usuario, contexto de un experimento) sin necesidad de repetirla.

Configurables con `ASSISTANT_RECENT_MESSAGES_COUNT` y `ASSISTANT_SEMANTIC_MESSAGES_COUNT`.

---

## 4. Tools disponibles

Ubicación: `src/assistant/services/tools.py`

Las tools se construyen en `make_tools(user_id)`. El `user_id` se inyecta server-side vía closure — **el LLM nunca controla qué usuario se consulta**.

### Datos del usuario (Multiomix)

| Tool | Descripción |
|------|-------------|
| `get_user_experiments` | Lista experimentos de correlación (nombre, estado, tipo, fecha) |
| `get_experiment_top_results` | Top resultados de un experimento de correlación (gen, GEM, correlación, p-valor) |
| `get_user_biomarkers` | Biomarkers propios y públicos del usuario |
| `get_statistical_validations` | Validaciones estadísticas de biomarkers (c-index, MSE) |
| `get_inference_experiments` | Experimentos de inferencia de ML |
| `get_feature_selection_experiments` | Experimentos de selección de features |
| `get_user_files` | Archivos subidos por el usuario (nombre, tipo, muestras, fecha) |
| `get_differential_expression_experiments` | Lista experimentos DE (herramienta, estado, fecha) |
| `get_differential_expression_results` | Top genes DE de un experimento (logFC, FDR, p-valor) |
| `search_cgds_studies` | Búsqueda de estudios públicos de cBioPortal por nombre |

### Información biológica (BioAPI / Modulector)

| Tool | Fuente | Descripción |
|------|--------|-------------|
| `get_gene_info` | PostgreSQL local | Info básica del gen (tipo, cromosoma, posición) |
| `get_gene_annotations` | BioAPI | Anotaciones detalladas (alias, biotype, Ensembl, NCBI, HGNC) |
| `get_mirna_modulators` | Modulector | miRNAs que regulan la expresión de un gen |
| `get_drugs_regulating_gene` | BioAPI | Link a DrugBank con drogas que modulan la expresión del gen |

### STRING database

Integración con la [STRING REST API](https://string-db.org/help/api/) pública (sin API key, `species=9606` — humano).

| Tool | Descripción |
|------|-------------|
| `get_string_interaction_partners(gene_name, limit=10)` | Top interactores proteicos con scores (combined, experimental, textmining, databases, coexpresión) |
| `get_string_functional_enrichment(gene_names)` | Enriquecimiento funcional: GO BP/MF/CC, KEGG, Reactome. `gene_names` es comma-separated. Devuelve top 15 términos por FDR |
| `get_string_network_url(gene_names)` | URL de imagen PNG de la red de interacciones. El agente la embebe en su respuesta como `![STRING Network](url)`, que se renderiza directamente en el chat |

**Ejemplo de uso en el chat:**

> *"Mostrá la red de interacciones de TP53, BRCA1 y MYC"*
>
> → El agente llama `get_string_network_url("TP53,BRCA1,MYC")` y responde con la imagen embebida en markdown.

> *"¿Qué pathways están enriquecidos en los genes de mi experimento #5?"*
>
> → El agente llama `get_experiment_top_results(5)` para obtener los genes, luego `get_string_functional_enrichment("GEN1,GEN2,...")` para el enriquecimiento.

### Base de conocimiento curada

| Tool | Descripción |
|------|-------------|
| `search_curated_knowledge(query)` | Búsqueda semántica en `CuratedDocument`. Devuelve top 5 documentos por similitud coseno. Útil para responder preguntas sobre cómo funciona la plataforma |

---

## 5. Frontend — React widget

Ubicación: `src/frontend/static/frontend/src/components/assistant/`

### Componentes

```
ChatWidget.tsx          — FAB (botón flotante) + controla visibilidad del panel
ChatPanel.tsx           — Panel principal: header, lista de conversaciones, thread
ConversationList.tsx    — Sidebar izquierdo con historial de conversaciones
MessageThread.tsx       — Área de mensajes + input
types.ts                — Interfaces TypeScript
```

### Estilos

`src/frontend/static/frontend/src/css/chat-widget.css`

### Persistencia en localStorage

| Clave | Valor | Descripción |
|-------|-------|-------------|
| `multiomix_chat_open` | `"1"` / `"0"` | Si el panel está abierto |
| `multiomix_chat_conv_id` | ID numérico | Conversación activa al navegar entre páginas |

Al montar `ChatPanel`, se verifica que la conversación almacenada todavía exista en el servidor. Si fue eliminada, se limpia el storage y se inicia una nueva.

### Rendering de markdown

Los mensajes del asistente se renderizan con `react-markdown` + `remark-gfm`:
- Tablas (resultados de enriquecimiento, listas de genes)
- Código inline y bloques de código
- Listas y negritas
- **Imágenes** (`![alt](url)`) — usado para redes de STRING

Los mensajes del usuario se muestran como texto plano con `white-space: pre-wrap`.

### Integración en el layout

En `Base.tsx`, el widget se renderiza solo para usuarios autenticados no anónimos:

```tsx
{currentUser && !currentUser.is_anonymous && <ChatWidget />}
```

Las URLs de la API se pasan como variables JS globales desde `base.html`:
```html
<script>
  var urlAssistantChat = "{% url 'assistant_chat' %}";
  var urlAssistantConversations = "{% url 'assistant_conversations' %}";
</script>
```

---

## 6. Flujo completo de una consulta

```
Usuario escribe → Enter
        │
        ▼
ChatPanel.sendMessage()
  ├─ Agrega mensaje optimista a la UI (rol: user)
  └─ POST /assistant/api/chat/ { message, conversation_id }
              │ (timeout: 3 min)
              ▼
         ChatView.post()
           ├─ Obtiene/crea Conversation
           └─ llm_service.run_chat(conversation, message, user_id)
                    │
                    ├─ 1. EmbeddingService.embed(message)  → vector 384D
                    │
                    ├─ 2. build_chat_history()
                    │     ├─ 15 msgs recientes (conv actual)
                    │     └─ 5 msgs semánticos (todas las convs del user)
                    │
                    ├─ 3. Message.objects.create(role=user, embedding=...)
                    │
                    ├─ 4. AgentExecutor.invoke(input, chat_history)
                    │     ├─ LLM decide qué tools llamar
                    │     ├─ Ejecuta tools (DB, APIs externas)
                    │     └─ LLM genera respuesta final en markdown
                    │
                    └─ 5. Message.objects.create(role=assistant, embedding=...)
              │
              ▼
         Response { conversation_id, reply }
              │
              ▼
ChatPanel recibe respuesta
  ├─ Agrega mensaje del asistente (renderizado con ReactMarkdown)
  ├─ Guarda conversation_id en localStorage
  └─ Recarga lista de conversaciones
```

---

## 7. Variables de entorno y configuración

En `settings.py`:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `OPENAI_API_KEY` | `""` | API key de OpenAI (requerida con el LLM por defecto) |
| `ASSISTANT_LLM_MODEL` | `"gpt-4o-mini"` | Modelo LLM a usar |
| `ASSISTANT_LLM_TEMPERATURE` | `0.0` | Temperatura (0 = determinista) |
| `ASSISTANT_EMBEDDING_MODEL` | `"sentence-transformers/all-MiniLM-L6-v2"` | Modelo de embeddings (HuggingFace) |
| `ASSISTANT_EMBEDDING_DIMENSIONS` | `384` | Dimensiones del vector (debe coincidir con el modelo) |
| `ASSISTANT_RECENT_MESSAGES_COUNT` | `15` | Mensajes recientes en el contexto |
| `ASSISTANT_SEMANTIC_MESSAGES_COUNT` | `5` | Mensajes semánticos cross-chat en el contexto |

Variables opcionales:

| Variable | Descripción |
|----------|-------------|
| `HF_TOKEN` | Token de HuggingFace (solo necesario si el modelo requiere autenticación) |
| `HF_CACHE_DIR` | Directorio de caché para modelos HuggingFace |

---

## 8. Cómo cambiar el modelo LLM

La función `get_llm()` en `src/assistant/services/llm_service.py` es el único punto a modificar:

### OpenAI (default)
```python
def get_llm():
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(
        model=settings.ASSISTANT_LLM_MODEL,  # "gpt-4o-mini", "gpt-4o", etc.
        temperature=settings.ASSISTANT_LLM_TEMPERATURE,
        api_key=settings.OPENAI_API_KEY,
    )
```

### Anthropic Claude
```python
def get_llm():
    from langchain_anthropic import ChatAnthropic
    return ChatAnthropic(
        model=settings.ASSISTANT_LLM_MODEL,  # "claude-sonnet-4-6"
        temperature=settings.ASSISTANT_LLM_TEMPERATURE,
        api_key=settings.ANTHROPIC_API_KEY,
    )
```
Dep: `pip install langchain-anthropic`

### Ollama (local, sin costo)
```python
def get_llm():
    from langchain_ollama import ChatOllama
    return ChatOllama(
        model=settings.ASSISTANT_LLM_MODEL,  # "llama3.1:8b", "qwen2.5:7b"
        temperature=settings.ASSISTANT_LLM_TEMPERATURE,
    )
```
Dep: `pip install langchain-ollama` + Ollama corriendo localmente.

> **Nota**: el modelo debe soportar **tool/function calling** para que el agente funcione correctamente.

---

## 9. Cómo agregar una nueva tool

1. Abrir `src/assistant/services/tools.py`
2. Agregar la función decorada con `@tool` dentro de `make_tools(user_id)`
3. Incluirla en el `return [...]` al final de la función

```python
@tool
def get_my_new_tool(param: str) -> str:
    """
    Descripción clara de qué hace y CUÁNDO debe ser usada por el LLM.
    Esto es el docstring que el LLM lee para decidir si usar la tool.
    """
    # Seguridad: user_id siempre viene del closure, nunca del LLM
    from myapp.models import MyModel
    qs = MyModel.objects.filter(user_id=user_id, name__icontains=param)
    return json.dumps(list(qs.values(...)), default=str)
```

**Reglas importantes:**
- El `user_id` siempre debe venir del closure — nunca como parámetro de la tool
- El docstring es crítico: el LLM lo usa para decidir cuándo llamar la tool
- Devolver siempre un string JSON serializable
- Manejar excepciones y devolver `{'error': '...'}` en caso de fallo

---

## 10. Cómo agregar documentación curada

Los `CuratedDocument` permiten agregar conocimiento específico sobre Multiomix que el agente puede consultar semánticamente.

1. Ir al Django Admin: `/admin/assistant/curateddocument/add/`
2. Completar título, contenido y categoría
3. Guardar — el embedding se genera automáticamente

**Ejemplos de documentos útiles:**
- "Cómo interpretar el C-index en validaciones estadísticas"
- "Diferencias entre DESeq2 y limma en análisis de expresión diferencial"
- "Cómo cargar archivos de metilación con IDs de sitios CpG"

---

## 11. Dependencias

### Backend (`config/requirements.txt`)

```
langchain>=0.3.0
langchain-openai>=0.2.0
langchain-community>=0.3.0
langchain-huggingface>=0.1.0
pgvector>=0.3.6
sentence-transformers>=3.0.0
openai>=1.50.0
```

### Frontend (`package.json`)

```
react-markdown
remark-gfm
```

### Base de datos

Requiere **PostgreSQL con extensión pgvector**. En desarrollo, usar la imagen Docker:

```yaml
# docker-compose.dev.yml
image: pgvector/pgvector:pg16
```

La extensión se crea automáticamente en la migración inicial del app `assistant`:

```python
# src/assistant/migrations/0001_initial.py
migrations.RunSQL("CREATE EXTENSION IF NOT EXISTS vector;")
```
