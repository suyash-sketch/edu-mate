import os
from openai import OpenAI
from langchain_qdrant import QdrantVectorStore
from langchain_ollama import OllamaEmbeddings
from dotenv import load_dotenv
from pydantic import BaseModel
from app.schemas.question_generation.mcq import MCQOutput
from app.schemas.question_generation.subjective import SubjectiveOutput
from app.services.prompts import build_mcq_prompt, build_subjective_prompt

load_dotenv()

BLOOM_LEVELS = (
    "remember",
    "understand",
    "apply",
    "analyze",
    "evaluate",
    "create",
)

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

def allocate_bloom_counts(
    blooms: dict[str, int],
    mcq_count: int,
    subjective_count: int,
) -> tuple[dict[str, int], dict[str, int]]:
    total_questions = mcq_count + subjective_count
    bloom_total = sum(blooms.get(level, 0) for level in BLOOM_LEVELS)

    if total_questions == 0:
        raise ValueError("At least one question must be requested.")

    if bloom_total != total_questions:
        raise ValueError(
            "Bloom's taxonomy total must match the requested question total."
        )

    empty_counts = {level: 0 for level in BLOOM_LEVELS}

    if mcq_count == 0:
        return empty_counts, {
            level: blooms.get(level, 0)
            for level in BLOOM_LEVELS
        }

    if subjective_count == 0:
        return {
            level: blooms.get(level, 0)
            for level in BLOOM_LEVELS
        }, empty_counts

    raw_mcq_counts = {
        level: blooms.get(level, 0) * mcq_count / total_questions
        for level in BLOOM_LEVELS
    }

    mcq_blooms = {
        level: int(raw_mcq_counts[level])
        for level in BLOOM_LEVELS
    }

    remaining_mcq_questions = mcq_count - sum(mcq_blooms.values())

    levels_by_remainder = sorted(
        BLOOM_LEVELS,
        key=lambda level: raw_mcq_counts[level] - mcq_blooms[level],
        reverse=True,
    )

    for level in levels_by_remainder[:remaining_mcq_questions]:
        mcq_blooms[level] += 1

    subjective_blooms = {
        level: blooms.get(level, 0) - mcq_blooms[level]
        for level in BLOOM_LEVELS
    }

    return mcq_blooms, subjective_blooms

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

def format_bloom_requirements(bloom_counts: dict[str, int]) -> str:
    return ", ".join(
        f"{count} {level}"
        for level, count in bloom_counts.items()
        if count > 0
    )


def generate_assessment(
    user_query: str,
    collection_name: str,
    mcq_count: int,
    subjective_count: int,
    blooms: dict[str, int],
    top_k: int = 5,
):
    mcq_blooms, subjective_blooms = allocate_bloom_counts(
        blooms=blooms,
        mcq_count=mcq_count,
        subjective_count=subjective_count,
    )

    context = retrieve_context(
        user_query=user_query,
        collection_name=collection_name,
        top_k=top_k,
    )

    if context is None:
        return None

    result = {
        "mcqs": [],
        "subjective_questions": [],
    }

    if mcq_count > 0:
        mcq_prompt = build_mcq_prompt(
            context=context,
            blooms_requirements=format_bloom_requirements(mcq_blooms),
        )

        mcq_result = generate_structured_response(
            user_query=user_query,
            system_prompt=mcq_prompt,
            response_schema=MCQOutput,
        )

        result["mcqs"] = mcq_result.get("mcqs", [])

        if len(result["mcqs"]) != mcq_count:
            raise ValueError(
                f"Expected {mcq_count} MCQs, but Gemini returned "
                f"{len(result['mcqs'])}."
            )

    if subjective_count > 0:
        subjective_prompt = build_subjective_prompt(
            context=context,
            blooms_requirements=format_bloom_requirements(subjective_blooms),
        )

        subjective_result = generate_structured_response(
            user_query=user_query,
            system_prompt=subjective_prompt,
            response_schema=SubjectiveOutput,
        )

        result["subjective_questions"] = subjective_result.get(
            "subjective_questions",
            [],
        )

        if len(result["subjective_questions"]) != subjective_count:
            raise ValueError(
                f"Expected {subjective_count} subjective questions, "
                f"but Gemini returned "
                f"{len(result['subjective_questions'])}."
            )

    return result