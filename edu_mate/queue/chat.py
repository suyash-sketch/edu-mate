import os
from openai import OpenAI
from langchain_qdrant import QdrantVectorStore
from langchain_ollama import OllamaEmbeddings
from ollama import Client
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

def prompt_modelling(context):
    SYSTEM_PROMPT = f"""
    You are a helpful AI assistant who answers user query based on available context retrieved from a PDF file along with page_contents and page number.

    You should only answer the user based on the following context and navigate the user to open the right page number to know more

    Context:
    {context}
    """
    return SYSTEM_PROMPT

def search_and_ask(user_query:str, top_k = 5):
    print("Searching chunks", user_query)
    search_results = vector_db.similarity_search(query=user_query, k=top_k)

    if not search_results:
        print("No search result from vector DB.")
        return

    context = "\n\n\n".join([f"Page Content: {result.page_content}\nPage Number: {result.metadata['page_label']}\nFile Location: {result.metadata['page_label']}\nFile Location: {result.metadata['source']}" 
                        for result in search_results])
    

    SYSTEM_PROMPT = prompt_modelling(context)

    # response = ollama_client.chat(
    #     model='llama3.2:3b',
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
    

    # print(f'🤖 {response.message.content}')
    # return response.message.content

    response = open_ai_client.chat.completions.create(
        model='gemini-2.5-flash-lite',
        messages=[
        {"role":"system", "content" : SYSTEM_PROMPT},
        {"role":"user", "content":user_query}
    ]
    )

    print(f'🤖 : {response.choices[0].message.content}')
    return response.choices[0].message.content

# if __name__ == "__main__":
#     q = input("👉 Ask something... ")
#     search_and_ask(q, top_k=5)