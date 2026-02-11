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
    model='nomic-embed-text',
    base_url='http://localhost:11434',
)

vector_db = QdrantVectorStore.from_existing_collection(
    url='http://localhost:6333',
    collection_name='edu-mate1',
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
    You are a helpful AI assistant who gives multiple choice questions with four options based on available context retrieved from a PDF file along with page_contents and page number, The multiple choice questions should be based on the concept of bloom's taxonomy.
    
    The blooms taxonomy is a hierarchical classification of different levels of cognitive skills that educators set for students. The levels are: Remembering, Understanding, Applying, Analyzing, Evaluating, and Creating. Each level represents a different type of thinking skill that students can develop.
    
    Each multiple choice question should have one correct answer and three distractors. The correct answer should be based on the content of the PDF file and the distractors should be plausible but incorrect answers. The question should be clear and concise, and the answer options should be mutually exclusive and collectively exhaustive.
    
    The question should also include an explanation of the correct answer, which should be based on the content of the PDF file.
    
    Questions should be according to the following requirements: {requirements}

    # You should only give the mcqs based on the following context 
    Context:
    {context}
    """
    return SYSTEM_PROMPT

def search_and_ask(user_query, top_k = 5):

    search_results = vector_db.similarity_search(query=user_query, k=top_k)

    if not search_results:
        print("No search result from vector DB.")
        return

    context = "\n\n\n".join([f"Page Content: {result.page_content}\nPage Number: {result.metadata['page_label']}\nFile Location: {result.metadata['page_label']}\nFile Location: {result.metadata['source']}" 
                        for result in search_results])
    

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