# Multiomix AI Assistant

Technical documentation for the AI assistant integrated into the Multiomix platform.

---

## Table of contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Backend — Django app `assistant`](#3-backend--django-app-assistant)
   - [Models](#models)
   - [REST API](#rest-api)
   - [Embedding service](#embedding-service)
   - [LLM service and agent](#llm-service-and-agent)
   - [Cross-chat semantic memory](#cross-chat-semantic-memory)
4. [Available tools](#4-available-tools)
   - [User data (Multiomix)](#user-data-multiomix)
   - [Biological information (BioAPI / Modulector)](#biological-information-bioapi--modulector)
   - [STRING database](#string-database)
   - [Curated knowledge base](#curated-knowledge-base)
   - [External MCP tools (BioMCP)](#external-mcp-tools-biomcp)
5. [Frontend — React widget](#5-frontend--react-widget)
6. [Full query flow](#6-full-query-flow)
7. [Environment variables and configuration](#7-environment-variables-and-configuration)
8. [How to change the LLM model](#8-how-to-change-the-llm-model)
9. [How to add a new tool](#9-how-to-add-a-new-tool)
10. [How to add an MCP server](#10-how-to-add-an-mcp-server)
11. [How to add curated documentation](#11-how-to-add-curated-documentation)
12. [Dependencies](#12-dependencies)

---

## 1. Overview

The assistant is an **LLM agent with tool-calling** embedded in Multiomix as a floating widget visible on every page of the platform (authenticated users only). It allows users to query in natural language:

- Their own experiments, results, and biomarkers
- Biological information about genes, miRNAs, and drugs
- Protein interaction networks and functional enrichment (STRING)
- Biomedical literature: PubMed papers, preprints (bioRxiv/medRxiv), clinical trials (ClinicalTrials.gov)
- Genomic variants and gene/drug/disease annotations from curated databases
- Platform documentation and general concepts

The assistant **never fabricates data**. It always retrieves real information via tools connected to the Multiomix database and external APIs.

---

## 2. Architecture

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
│  llm_service.run_chat()  [sync]                                     │
│                                                                      │
│  1. EmbeddingService.embed(user_message)  ← HuggingFace local      │
│  2. build_chat_history()                  ← PostgreSQL + pgvector   │
│     ├─ 15 most recent messages (current conversation)               │
│     └─ 5 semantically similar messages (ALL user conversations —    │
│         cross-chat memory)                                          │
│  3. load_mcp_config()                     ← config/mcp_servers.json│
│  4. asyncio.run(_async_agent())           ← LangChain 1.x + OpenAI │
│     ├─ MultiServerMCPClient(mcp_config)   ← MCP subprocess (stdio) │
│     │    └─ client.get_tools()            ← BioMCP tools            │
│     ├─ all_tools = internal (23) + mcp                              │
│     └─ create_agent(llm, all_tools, prompt=SYSTEM_PROMPT)          │
│  5. Persist user msg + assistant reply with embeddings              │
└──────────┬──────────────────────────────────────────────────────────┘
           │ tool calls
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TOOLS                                                              │
│                                                                      │
│  Internal (23):                                                     │
│  ├─ PostgreSQL (Django ORM)  → experiments, biomarkers, files       │
│  ├─ MongoDB                  → experiment results                   │
│  ├─ Modulector API           → miRNA-gene interactions              │
│  ├─ BioAPI                   → gene annotations, drugs              │
│  └─ STRING REST API          → protein interactions, enrichment     │
│                                                                      │
│  External MCP (BioMCP, optional):                                   │
│  ├─ PubMed / bioRxiv / medRxiv → biomedical papers                 │
│  ├─ ClinicalTrials.gov         → clinical trials                    │
│  ├─ NCI / OncoKB               → variants, oncology annotations     │
│  └─ cBioPortal                 → genomic studies                    │
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

### Models

Location: `src/assistant/models.py`

#### `Conversation`
Groups the messages of a chat session.

| Field | Type | Description |
|-------|------|-------------|
| `user` | FK → User | Conversation owner |
| `title` | CharField | First 100 characters of the first message (auto-generated) |
| `created_at` | DateTimeField | Creation date |
| `updated_at` | DateTimeField | Updated on every turn |

#### `Message`
An individual message (user or assistant) within a conversation.

| Field | Type | Description |
|-------|------|-------------|
| `conversation` | FK → Conversation | Conversation this message belongs to |
| `role` | CharField | `user` or `assistant` |
| `content` | TextField | Message content |
| `embedding` | VectorField(384) | Semantic embedding for similarity search |
| `created_at` | DateTimeField | Timestamp |

#### `CuratedDocument`
Manual documentation about Multiomix that the agent can query via semantic search.

| Field | Type | Description |
|-------|------|-------------|
| `title` | CharField | Document title |
| `content` | TextField | Content (free text / markdown) |
| `category` | CharField | Category (e.g. `"platform"`, `"biology"`) |
| `embedding` | VectorField(384) | Auto-generated on save from the admin |
| `is_active` | BooleanField | Whether the document is active for search |

> Curated documents are managed from the **Django Admin** at `/admin/`. The embedding is generated automatically on save.

---

### REST API

All endpoints require authentication (`IsAuthenticated`).

| Method | URL | Description |
|--------|-----|-------------|
| `POST` | `/assistant/api/chat/` | Send a message and receive a response |
| `GET` | `/assistant/api/conversations/` | List the user's conversations |
| `GET` | `/assistant/api/conversations/<id>/` | Conversation detail with all its messages |
| `DELETE` | `/assistant/api/conversations/<id>/` | Delete a conversation |

**POST `/assistant/api/chat/`**

Request:
```json
{
  "message": "What are my correlation experiments?",
  "conversation_id": 42  // optional; omit to start a new conversation
}
```

Response:
```json
{
  "conversation_id": 42,
  "reply": "You have **3 correlation experiments**..."
}
```

---

### Embedding service

Location: `src/assistant/services/embedding_service.py`

- Model: `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions)
- **100% local inference** — no text is sent to any external server
- Implemented as a **lazy-loading singleton**: the model is loaded into memory the first time it is needed and then reused
- Configurable via `ASSISTANT_EMBEDDING_MODEL` and `ASSISTANT_EMBEDDING_DIMENSIONS`

```python
from assistant.services.embedding_service import embedding_service

vector = embedding_service.embed("TP53 expression in breast cancer")
# → List[float] with 384 values
```

> If the model is not in the local cache (`~/.cache/huggingface/`), it is downloaded automatically on first startup.

---

### LLM service and agent

Location: `src/assistant/services/llm_service.py`

The agent uses the **langchain 1.x** API backed by LangGraph:

```python
agent = create_agent(llm, all_tools, prompt=SYSTEM_PROMPT)
result = await agent.ainvoke({"messages": messages})
```

`run_chat()` is a **sync** function (called from a standard WSGI/DRF view). Because `MultiServerMCPClient` requires an async context, the agent execution is isolated in `_async_agent()` and run via `asyncio.run()`. Sync DB operations (embed, save messages) stay outside the event loop.

```
run_chat()  [sync]
  ├─ DB ops (embed, build history, save user message)
  ├─ load_mcp_config()
  └─ asyncio.run(_async_agent(...))
       ├─ MultiServerMCPClient  ← spawns MCP subprocesses
       ├─ all_tools = internal + mcp
       ├─ create_agent(llm, all_tools, prompt=SYSTEM_PROMPT)
       └─ agent.ainvoke({"messages": [*history, HumanMessage]})
  └─ DB ops (embed, save assistant reply)
```

**Graceful fallback**: if any MCP server fails to start or crashes, a `WARNING` is logged and the agent continues with the 23 internal tools only — the assistant remains fully functional.

**System prompt restrictions**: the agent only answers questions about bioinformatics, the Multiomix platform, the user's own data, and biomedical literature. Out-of-scope questions receive a fixed rejection message.

**`get_llm()` function**: the model swap point. See section [8](#8-how-to-change-the-llm-model).

---

### Cross-chat semantic memory

The context history the agent receives on each turn is built as follows:

```
build_chat_history(conversation, user_id, query_embedding)
```

| Source | Count | Filter |
|--------|-------|--------|
| Recent messages | Last 15 | Current conversation only |
| Semantic messages | Top 5 by cosine similarity | **All user conversations** |

Cross-chat semantic search allows the assistant to recall information mentioned in previous chats (e.g. the user's name, context from an experiment) without having to repeat it.

Configurable via `ASSISTANT_RECENT_MESSAGES_COUNT` and `ASSISTANT_SEMANTIC_MESSAGES_COUNT`.

---

## 4. Available tools

Location: `src/assistant/services/tools.py`

Tools are built in `make_tools(user_id)`. The `user_id` is injected server-side via closure — **the LLM never controls which user is queried**.

### User data (Multiomix)

| Tool | Description |
|------|-------------|
| `get_user_experiments` | Lists correlation experiments (name, status, type, date) |
| `get_experiment_top_results` | Top results of a correlation experiment (gene, GEM, correlation, p-value) |
| `get_experiment_detail` | Full configuration of an experiment: datasets used, correlation method, thresholds, and execution statistics |
| `get_user_biomarkers` | The user's own and public biomarkers |
| `get_genes_in_biomarker` | All identifiers in a biomarker grouped by type: mRNAs, miRNAs, CNAs, and methylations |
| `get_statistical_validations` | Statistical validations of biomarkers (c-index, MSE) |
| `get_survival_experiments` | Lists statistical survival validation experiments with metrics (c_index, cox_c_index, cox_log_likelihood, r2_score, MSE) |
| `get_survival_results` | Validation detail: full survival metrics + molecules with Cox coefficients (positive coefficient = higher risk, negative = protective) |
| `get_inference_experiments` | ML inference experiments |
| `get_feature_selection_experiments` | Feature selection experiments |
| `get_user_files` | Files uploaded by the user (name, type, samples, date) |
| `get_differential_expression_experiments` | Lists DE experiments (tool, status, date) |
| `get_differential_expression_results` | Top DE genes from an experiment (logFC, FDR, p-value) |
| `find_gene_across_experiments` | Searches for a gene across all the user's correlation results (miRNA, CNA, Methylation) and returns which experiments it appears in along with its paired GEM and statistics |
| `search_cgds_studies` | Search public cBioPortal studies by name |

### Biological information (BioAPI / Modulector)

| Tool | Source | Description |
|------|--------|-------------|
| `get_gene_info` | Local PostgreSQL | Basic gene info (type, chromosome, position) |
| `get_gene_annotations` | BioAPI | Detailed annotations (aliases, biotype, Ensembl, NCBI, HGNC) |
| `get_mirna_modulators` | Modulector | miRNAs that regulate the expression of a gene |
| `get_drugs_regulating_gene` | BioAPI | Link to DrugBank with drugs that modulate gene expression |

### STRING database

Integration with the public [STRING REST API](https://string-db.org/help/api/) (no API key required, `species=9606` — human).

| Tool | Description |
|------|-------------|
| `get_string_interaction_partners(gene_name, limit=10)` | Top protein interactors with scores (combined, experimental, textmining, databases, coexpression) |
| `get_string_functional_enrichment(gene_names)` | Functional enrichment: GO BP/MF/CC, KEGG, Reactome. `gene_names` is comma-separated. Returns top 15 terms by FDR |
| `get_string_network_url(gene_names)` | URL of a PNG image of the interaction network. The agent embeds it in its response as `![STRING Network](url)`, which renders directly in the chat |

**Example usage in the chat:**

> *"Show the interaction network for TP53, BRCA1, and MYC"*
>
> → The agent calls `get_string_network_url("TP53,BRCA1,MYC")` and responds with the image embedded in markdown.

> *"Which pathways are enriched in the genes from my experiment #5?"*
>
> → The agent calls `get_experiment_top_results(5)` to retrieve the genes, then `get_string_functional_enrichment("GENE1,GENE2,...")` for enrichment.

### Curated knowledge base

| Tool | Description |
|------|-------------|
| `search_curated_knowledge(query)` | Semantic search over `CuratedDocument`. Returns the top 5 documents by cosine similarity. Useful for answering questions about how the platform works |

### External MCP tools (BioMCP)

Provided by the `biomcp-python` package via the MCP protocol (stdio subprocess). Available when `ASSISTANT_MCP_CONFIG_PATH` is set and `biomcp` is installed.

| Category | Examples |
|----------|---------|
| PubMed / bioRxiv / medRxiv | Search papers by gene, disease, method, author |
| ClinicalTrials.gov | Search clinical trials by condition or intervention |
| NCI / OncoKB | Variant annotations, oncogenicity classifications |
| cBioPortal | Studies, mutations, copy number alterations |

**Example usage in the chat:**

> *"Find recent PubMed papers about DESeq2 differential expression in breast cancer"*

> *"Are there clinical trials for BRCA1 mutations in ovarian cancer?"*

The tools are discovered automatically from the running MCP server — no code changes are needed when BioMCP adds new tools in a future release.

---

## 5. Frontend — React widget

Location: `src/frontend/static/frontend/src/components/assistant/`

### Components

```
ChatWidget.tsx          — FAB (floating action button) + controls panel visibility
ChatPanel.tsx           — Main panel: header, conversation list, message thread
ConversationList.tsx    — Left sidebar with conversation history
MessageThread.tsx       — Message area + input
types.ts                — TypeScript interfaces
```

### Styles

`src/frontend/static/frontend/src/css/chat-widget.css`

### localStorage persistence

| Key | Value | Description |
|-----|-------|-------------|
| `multiomix_chat_open` | `"1"` / `"0"` | Whether the panel is open |
| `multiomix_chat_conv_id` | Numeric ID | Active conversation when navigating between pages |

When `ChatPanel` mounts, it verifies that the stored conversation still exists on the server. If it has been deleted, the storage is cleared and a new conversation is started.

### Markdown rendering

Assistant messages are rendered with `react-markdown` + `remark-gfm`:
- Tables (enrichment results, gene lists)
- Inline code and code blocks
- Lists and bold text
- **Images** (`![alt](url)`) — used for STRING networks

User messages are displayed as plain text with `white-space: pre-wrap`.

### Layout integration

In `Base.tsx`, the widget is rendered only for authenticated non-anonymous users:

```tsx
{currentUser && !currentUser.is_anonymous && <ChatWidget />}
```

The API URLs are passed as global JS variables from `base.html`:
```html
<script>
  var urlAssistantChat = "{% url 'assistant_chat' %}";
  var urlAssistantConversations = "{% url 'assistant_conversations' %}";
</script>
```

---

## 6. Full query flow

```
User types → Enter
        │
        ▼
ChatPanel.sendMessage()
  ├─ Optimistically adds message to the UI (role: user)
  └─ POST /assistant/api/chat/ { message, conversation_id }
              │ (timeout: 3 min)
              ▼
         ChatView.post()
           ├─ Gets/creates Conversation
           └─ llm_service.run_chat(conversation, message, user_id)
                    │
                    ├─ 1. EmbeddingService.embed(message)  → 384D vector
                    │
                    ├─ 2. build_chat_history()
                    │     ├─ 15 recent msgs (current conv)
                    │     └─ 5 semantic msgs (all user convs)
                    │
                    ├─ 3. Message.objects.create(role=user, embedding=...)
                    │
                    ├─ 4. load_mcp_config()  ← reads mcp_servers.json
                    │
                    ├─ 5. asyncio.run(_async_agent(...))
                    │     ├─ MultiServerMCPClient  → spawns BioMCP subprocess
                    │     ├─ all_tools = 23 internal + MCP tools
                    │     ├─ create_agent(llm, all_tools, system_prompt)
                    │     ├─ agent.ainvoke({messages: [history + user_msg]})
                    │     │    ├─ LLM decides which tools to call
                    │     │    ├─ Executes tools (DB, external APIs, MCP)
                    │     │    └─ LLM generates final response in markdown
                    │     └─ [fallback to 23 internal tools if MCP fails]
                    │
                    └─ 6. Message.objects.create(role=assistant, embedding=...)
              │
              ▼
         Response { conversation_id, reply }
              │
              ▼
ChatPanel receives response
  ├─ Appends assistant message (rendered with ReactMarkdown)
  ├─ Saves conversation_id to localStorage
  └─ Reloads conversation list
```

---

## 7. Environment variables and configuration

In `settings.py`:

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | `""` | OpenAI API key (required with the default LLM) |
| `ASSISTANT_LLM_MODEL` | `"gpt-4o-mini"` | LLM model to use |
| `ASSISTANT_LLM_TEMPERATURE` | `0.0` | Temperature (0 = deterministic) |
| `ASSISTANT_EMBEDDING_MODEL` | `"sentence-transformers/all-MiniLM-L6-v2"` | Embedding model (HuggingFace) |
| `ASSISTANT_EMBEDDING_DIMENSIONS` | `384` | Vector dimensions (must match the model) |
| `ASSISTANT_RECENT_MESSAGES_COUNT` | `15` | Recent messages in context |
| `ASSISTANT_SEMANTIC_MESSAGES_COUNT` | `5` | Cross-chat semantic messages in context |

Optional variables:

| Variable | Description |
|----------|-------------|
| `HF_TOKEN` | HuggingFace token (only required if the model needs authentication) |
| `HF_CACHE_DIR` | Cache directory for HuggingFace models |
| `ASSISTANT_MCP_CONFIG_PATH` | Absolute path to `mcp_servers.json`. If not set or the file is missing, MCP tools are disabled and the assistant uses only the 23 internal tools |

---

## 8. How to change the LLM model

The `get_llm()` function in `src/assistant/services/llm_service.py` is the only point to modify:

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

### Ollama (local, no cost)
```python
def get_llm():
    from langchain_ollama import ChatOllama
    return ChatOllama(
        model=settings.ASSISTANT_LLM_MODEL,  # "llama3.1:8b", "qwen2.5:7b"
        temperature=settings.ASSISTANT_LLM_TEMPERATURE,
    )
```
Dep: `pip install langchain-ollama` + Ollama running locally.

> **Note**: the model must support **tool/function calling** for the agent to work correctly.

---

## 9. How to add a new tool

1. Open `src/assistant/services/tools.py`
2. Add the function decorated with `@tool` inside `make_tools(user_id)`
3. Include it in the `return [...]` at the end of the function

```python
@tool
def get_my_new_tool(param: str) -> str:
    """
    Clear description of what this tool does and WHEN the LLM should use it.
    This docstring is what the LLM reads to decide whether to call the tool.
    """
    # Security: user_id always comes from the closure, never from the LLM
    from myapp.models import MyModel
    qs = MyModel.objects.filter(user_id=user_id, name__icontains=param)
    return json.dumps(list(qs.values(...)), default=str)
```

**Important rules:**
- `user_id` must always come from the closure — never as a tool parameter
- The docstring is critical: the LLM uses it to decide when to call the tool
- Always return a JSON-serializable string
- Handle exceptions and return `{'error': '...'}` on failure

---

## 10. How to add an MCP server

Adding a new MCP server requires **only editing `config/mcp_servers.json`** — no code changes needed.

```json
{
  "version": "1.0",
  "servers": {
    "biomcp": {
      "enabled": true,
      "transport": "stdio",
      "command": "biomcp",
      "args": ["run"]
    },
    "my-new-server": {
      "enabled": true,
      "description": "Optional description for humans",
      "transport": "stdio",
      "command": "my-mcp-command",
      "args": ["--flag", "value"],
      "env": {
        "MY_API_KEY": "secret"
      }
    }
  }
}
```

**Schema reference:**

| Field | Required | Description |
|-------|----------|-------------|
| `enabled` | No (default `true`) | Set to `false` to disable without removing the entry |
| `transport` | Yes | `"stdio"`, `"http"`, or `"sse"` |
| `command` | Yes (stdio) | Executable name or path. Must be in `PATH` |
| `args` | No | List of arguments passed to the command |
| `env` | No | Extra environment variables injected into the subprocess |
| `url` | Yes (http/sse) | Server URL for HTTP or SSE transports |

**The new server's tools are discovered automatically** at every request — the LLM receives their descriptions and decides when to call them.

**When to also update the system prompt:** if the new server covers a domain not listed in `## Your scope` (e.g. pharmacogenomics), add a bullet point to `SYSTEM_PROMPT` in `llm_service.py` so the agent knows it is allowed to answer questions in that domain.

**Validation rules** (applied by `mcp_loader.py` at load time):
- File missing or invalid JSON → warning logged, MCP disabled (internal tools still work)
- `enabled: false` → silently skipped
- Unknown transport → warning + skip
- `command` not found in PATH (stdio) → warning + skip

---

## 11. How to add curated documentation

`CuratedDocument` entries allow adding platform-specific knowledge that the agent can query semantically.

1. Go to Django Admin: `/admin/assistant/curateddocument/add/`
2. Fill in the title, content, and category
3. Save — the embedding is generated automatically

**Examples of useful documents:**
- "How to interpret the C-index in statistical validations"
- "Differences between DESeq2 and limma in differential expression analysis"
- "How to upload methylation files with CpG site IDs"

---

## 12. Dependencies

### Backend (`config/requirements.txt`)

```
langchain==1.3.2
langchain-openai==1.2.2
langchain-community==0.4.2
langchain-huggingface==1.2.2
langchain-mcp-adapters==0.2.2
pgvector==0.4.2
sentence-transformers==3.0.0
openai==2.38.0
biomcp-python==0.7.3
```

**Note on langchain 1.x:** the entire langchain stack was upgraded from `0.3.x` to `1.x` because `langchain-mcp-adapters 0.2.x` requires `langchain-core>=1.4.0`, which is incompatible with the `0.3.x` series. As part of this upgrade, the agent API changed: `AgentExecutor` + `create_tool_calling_agent` were replaced by the single `create_agent()` function backed by LangGraph.

### Frontend (`package.json`)

```
react-markdown
remark-gfm
```

### Database

Requires **PostgreSQL with the pgvector extension**. In development, use the Docker image:

```yaml
# docker-compose.dev.yml
image: pgvector/pgvector:pg16
```

The extension is created automatically in the `assistant` app's initial migration:

```python
# src/assistant/migrations/0001_initial.py
migrations.RunSQL("CREATE EXTENSION IF NOT EXISTS vector;")
```
