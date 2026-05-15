from typing import List
from django.conf import settings

from assistant.models import Message
from assistant.services.embedding_service import embedding_service
from assistant.services.tools import make_tools
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pgvector.django import CosineDistance

SYSTEM_PROMPT = """You are Multiomix Assistant, a specialized AI integrated into the Multiomix platform —
a cloud-based bioinformatics tool for inferring cancer genomic and epigenomic events associated with gene expression modulation.

## Your scope

You ONLY answer questions related to:
- The Multiomix platform (experiments, workflows, features, configuration)
- The user's own data: correlation experiments, biomarkers, feature selection runs, statistical validations, inference experiments
- Bioinformatics and computational biology concepts (gene expression, differential expression, miRNA, CNA, methylation, survival analysis, etc.)
- Cancer genomics and epigenomics
- Available cBioPortal (CGDS) datasets and studies
- Gene and molecule information (genes, miRNAs, CpG sites)
- Statistical methods used in the platform (DESeq2, limma, Cox regression, SVM, Random Forest, etc.)
- Protein-protein interaction networks and functional enrichment from STRING database

## Hard restrictions

If the user asks about anything outside the scope above — including but not limited to:
general programming, current events, creative writing, cooking, travel, math unrelated to bioinformatics,
other software tools unrelated to bioinformatics, or any other off-topic subject —
respond ONLY with:
"I'm a specialized assistant for the Multiomix platform and bioinformatics. I can only help with questions
related to genomics, epigenomics, or your Multiomix experiments and data."

Do NOT attempt to answer off-topic questions even partially.

## Behavioral rules

- Always be concise and scientifically accurate.
- When referencing user data (experiments, biomarkers, etc.), always retrieve it via the available tools — never guess or invent values.
- If you don't know something within your scope, say so clearly.
- Respond in the same language the user writes in.
- The chat interface renders markdown. You may use **bold**, *italic*, tables, bullet lists,
  code blocks, and markdown image syntax `![alt](url)` freely in your responses.
  When a STRING network URL is available, always embed it as `![STRING Network](url)`.
"""


def get_llm():
    """Returns the configured LLM. Swap this function to change provider."""
    return ChatOpenAI(
        model=settings.ASSISTANT_LLM_MODEL,
        temperature=settings.ASSISTANT_LLM_TEMPERATURE,
        api_key=settings.OPENAI_API_KEY,
    )


def build_chat_history(conversation, user_id: int, query_embedding: List[float]) -> List[BaseMessage]:
    """
    Build chat history:
    - Recent messages: last N from the CURRENT conversation (immediate context).
    - Semantic messages: most similar messages from ANY conversation of the user
      (cross-chat long-term memory), excluding messages already in the recent set.
    Returns LangChain message objects. SystemMessage is added separately in the prompt.
    """

    # Recent messages from the current conversation
    recent_qs = Message.objects.filter(conversation=conversation).order_by('-created_at')
    recent = list(recent_qs[:settings.ASSISTANT_RECENT_MESSAGES_COUNT])
    recent_ids = {m.pk for m in recent}

    # Semantic search across ALL user conversations (cross-chat memory)
    semantic: List = []
    if query_embedding:
        semantic_qs = (
            Message.objects
            .filter(conversation__user_id=user_id, embedding__isnull=False)
            .exclude(pk__in=recent_ids)
            .annotate(distance=CosineDistance('embedding', query_embedding))
            .order_by('distance')[:settings.ASSISTANT_SEMANTIC_MESSAGES_COUNT]
        )
        semantic = list(semantic_qs)

    all_messages = sorted(recent + semantic, key=lambda m: m.created_at)

    lc_messages: List[BaseMessage] = []
    for msg in all_messages:
        if msg.role == 'user':
            lc_messages.append(HumanMessage(content=msg.content))
        else:
            lc_messages.append(AIMessage(content=msg.content))
    return lc_messages


def run_chat(conversation, user_message: str, user_id: int) -> str:
    """
    Run one chat turn: embed the user message, build context, invoke agent, return reply.
    Persists user + assistant messages (with embeddings) to the DB.
    """

    # Embed user query
    query_embedding = embedding_service.embed(user_message)

    # Build chat history (messages BEFORE this turn, cross-chat semantic memory)
    chat_history = build_chat_history(conversation, user_id, query_embedding)

    # Save user message to DB
    Message.objects.create(
        conversation=conversation,
        role=Message.Role.USER,
        content=user_message,
        embedding=query_embedding,
    )

    # Update conversation title if this is the first message
    if not conversation.title:
        conversation.title = user_message[:100]
        conversation.save(update_fields=['title'])

    # Build agent prompt — standard LangChain tool-calling pattern
    prompt = ChatPromptTemplate.from_messages([
        ('system', SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name='chat_history'),
        ('human', '{input}'),
        MessagesPlaceholder(variable_name='agent_scratchpad'),
    ])

    tools = make_tools(user_id)
    llm = get_llm()

    agent = create_tool_calling_agent(llm, tools, prompt)
    executor = AgentExecutor(agent=agent, tools=tools, verbose=False, max_iterations=5)

    result = executor.invoke({'input': user_message, 'chat_history': chat_history})
    reply = result.get('output', '')

    # Embed and save assistant reply
    reply_embedding = embedding_service.embed(reply)
    Message.objects.create(
        conversation=conversation,
        role=Message.Role.ASSISTANT,
        content=reply,
        embedding=reply_embedding,
    )

    # Touch conversation updated_at
    conversation.save(update_fields=['updated_at'])

    return reply
