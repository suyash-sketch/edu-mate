import os
from openai import OpenAI
from langchain_qdrant import QdrantVectorStore
from langchain_ollama import OllamaEmbeddings
from ollama import Client
from app.schemas.question_generation.mcq import MCQOutput
from app.services.prompts import build_mcq_prompt
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

open_ai_client = OpenAI(
    api_key=GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai",
)

# open_ai_client = OpenAI(
#     base_url="http://localhost:11434/v1",
#     api_key="ollama"
# )

ollama_client = Client(
    host='http://localhost:11434'
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

def search_and_ask(user_query, collection_name: str, blooms_requirements: str = "5 remember, 3 understand, 4 apply, 3 analyze, 2 evaluate, 3 create", top_k = 5):

    vector_db = _vector_db(collection_name=collection_name)
    search_results = vector_db.similarity_search(query=user_query, k=top_k)

    if not search_results:
        print("No search result from vector DB.")
        return

    context_blocks = []
    for result in search_results:
        block = (
            f"--- ADMIN METADATA (DO NOT MENTION IN OUTPUT) ---\n"
            f"Source: {result.metadata['source']}\n"
            f"Page: {result.metadata['page_label']}\n"
            f"--- EDUCATIONAL CONTENT ---\n"
            f"{result.page_content}\n"
        )
        context_blocks.append(block)
        
    context = "\n\n".join(context_blocks)
        
    
    print(f'\n\n{context}\n\n')
    SYSTEM_PROMPT = build_mcq_prompt(context, blooms_requirements)

    # response = ollama_client.chat(
    #     model='llama3.2:1b',
    #     messages=[
    #         {
    #             'role':'system',
    #             'content' : SYSTEM_PROMPT,
    #         },
    #         {
    #             "role":"user", 
    #             "content":user_query
    #         }
    #     ]
    # )
    

    # print(response.message.content)

    response = open_ai_client.chat.completions.parse(
        model='gemini-2.5-flash-lite',
        response_format= MCQOutput,
        messages=[
        {"role":"system", "content" : SYSTEM_PROMPT},
        {"role":"user", "content":user_query},
    ],
    )

    # print(f'🤖 : {response.choices[0].message.content}')
    # return response.choices[0].message.content
     
    # print(f'🤖 : {response.choices[0].message.parsed}')
    parsed = response.choices[0].message.parsed
    # Ensure RQ/FastAPI can JSON-serialize result
    return parsed.model_dump() if hasattr(parsed, "model_dump") else parsed

# if __name__ == "__main__":
#     q = input("👉 Ask something... ")
#     search_and_ask(q, top_k=5)