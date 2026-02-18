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
        base_url='http://localhost:11434',
    )

def _vector_db(collection_name: str):
    return QdrantVectorStore.from_existing_collection(
        url='http://localhost:6333',
        collection_name=collection_name,
        embedding=_embedding_model(),
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
    
# def prompt_modelling(context):
    
#     SYSTEM_PROMPT = f"""
#     You are a helpful AI assistant who gives multiple choice questions with four options based on available context retrieved from a PDF file along with page_contents and page number, The multiple choice questions should be based on the concept of bloom's taxonomy.
    
#     The blooms taxonomy is a hierarchical classification of different levels of cognitive skills that educators set for students. The levels are: Remembering, Understanding, Applying, Analyzing, Evaluating, and Creating. Each level represents a different type of thinking skill that students can develop.
    
#     Each multiple choice question should have one correct answer and three distractors. The correct answer should be based on the content of the PDF file and the distractors should be plausible but incorrect answers. The question should be clear and concise, and the answer options should be mutually exclusive and collectively exhaustive.
    
#     The question should also include an explanation of the correct answer, which should be based on the content of the PDF file.
    
#     Questions should be according to the following requirements: {requirements}

#     # You should only give the mcqs based on the following context 
#     Context:
#     {context}
#     """

#     return SYSTEM_PROMPT

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

def search_and_ask(user_query, collection_name: str, top_k = 5):

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
     
    # print(f'🤖 : {response.choices[0].message.parsed}')
    parsed = response.choices[0].message.parsed
    # Ensure RQ/FastAPI can JSON-serialize result
    return parsed.model_dump() if hasattr(parsed, "model_dump") else parsed

# if __name__ == "__main__":
#     q = input("👉 Ask something... ")
#     search_and_ask(q, top_k=5)