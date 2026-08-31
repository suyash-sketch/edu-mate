import os
from openai import OpenAI
from langchain_qdrant import QdrantVectorStore
from langchain_ollama import OllamaEmbeddings
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

open_ai_client = OpenAI(
    api_key=GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai",
)

# vector embeddings (must match the model used during chunking/indexing)
def _embedding_model():
    return OllamaEmbeddings(
        model='nomic-embed-text',
        # model='qwen3-embedding:0.6b',
        base_url='http://localhost:11434',
    )

def _vector_db(collection_name: str):
    return QdrantVectorStore.from_existing_collection(
        url='http://localhost:6333',
        collection_name=collection_name,
        embedding=_embedding_model(),
    )

def retrieve_context(
    user_query: str,
    collection_name: str,
    top_k: int = 5,
) -> str | None:
    vector_db = _vector_db(collection_name)
    search_results = vector_db.similarity_search(
        query=user_query,
        k=top_k,
    )

    if not search_results:
        print("No search result from vector DB.")
        return None

    context_blocks = []

    for result in search_results:
        block = (
            "--- ADMIN METADATA (DO NOT MENTION IN OUTPUT) ---\n"
            f"Source: {result.metadata.get('source', 'Unknown')}\n"
            f"Page: {result.metadata.get('page_label', 'Unknown')}\n"
            "--- EDUCATIONAL CONTENT ---\n"
            f"{result.page_content}\n"
        )
        context_blocks.append(block)

    return "\n\n".join(context_blocks)


def generate_structured_response(
    user_query: str,
    system_prompt: str,
    response_schema: type[BaseModel],
):
    response = open_ai_client.chat.completions.parse(
        model="gemini-2.5-flash-lite",
        response_format=response_schema,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query},
        ],
    )

    parsed = response.choices[0].message.parsed
    return parsed.model_dump() if hasattr(parsed, "model_dump") else parsed