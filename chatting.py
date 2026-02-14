import os
from openai import OpenAI
from langchain_qdrant import QdrantVectorStore
from langchain_ollama import OllamaEmbeddings
from ollama import Client
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')


open_ai_client = OpenAI(
    api_key=GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai",
)

ollama_client = Client(
    host='http://localhost:11434'
)

#vector embeddings
embedding_model = OllamaEmbeddings(
    model='qwen3-embedding:0.6b',
    base_url='http://localhost:11434',
)

vector_db = QdrantVectorStore.from_existing_collection(
    url='http://localhost:6333',
    collection_name='chemistry',
    embedding=embedding_model
)

class SingleMCQ(BaseModel):
    question_no : str
    question : str
    answer_options : List[str]
    correct_answer : str
    explaination : Optional[str]
    
class OutputFormat(BaseModel):
    mcqs : List[SingleMCQ]

requirements = """3 remember, 3 understand, 1 apply, 1 analyze, 1 evaluate, 1 create"""

def prompt_modelling(context):
    SYSTEM_PROMPT = f"""
        You are a Subject Matter Expert designing a professional, standalone exam. 
        You have been provided with "Educational Content" and "Admin Metadata" for verification.

        ### THE RULES FOR YOUR OUTPUT:
        1. **STRICT BLIND EXAM MODE**: Write the questions as if the student has NO access to any documents. 
           - DO NOT mention "Page Numbers," "Lessons," "Sections," or "the PDF."
           - BAD: "According to the provided text on page 4, what is..."
           - GOOD: "What is the primary characteristic of..."
        2. **INTERNAL VERIFICATION ONLY**: Use the "Admin Metadata" only to ensure your answer is grounded in the correct chapter. DO NOT repeat this metadata in the question, the options, or the explanation.
        3. **EXPLANATION FORMAT**: Write the explanation as a factual teaching note. 
           - BAD: "This is found on page 10 of nodejs.pdf."
           - GOOD: "Promises are used to handle asynchronous operations more cleanly than callbacks."
        4. **BLOOM'S TAXONOMY**: {requirements}

        ### PROVIDED DATA (FOR YOUR EYES ONLY):
        {context}
    """
    return SYSTEM_PROMPT  

def search_and_ask(user_query, top_k = 5):

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
        
    # 2. Get the system prompt from the helper function
    SYSTEM_PROMPT = prompt_modelling(context)
    
    print(f'\n\n{context}\n\n')
    SYSTEM_PROMPT = prompt_modelling(context)

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
        response_format= OutputFormat,
        messages=[
        {"role":"system", "content" : SYSTEM_PROMPT},
        {"role":"user", "content":user_query},
    ],
    )

    # print(f'🤖 : {response.choices[0].message.content}')
    # return response.choices[0].message.content
     
    print(f'🤖 : {response.choices[0].message.parsed}')
    # return response.choices[0].message.parsed

if __name__ == "__main__":
    q = input("👉 Ask something... ")
    search_and_ask(q, top_k=5)