import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import FastAPI, Query
from .client.rq_client import queue
from .queue.chat import search_and_ask
from .queue.doc_chunking import chunk
app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")

app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")

# @app.get('/')
# def root():
#     return { "status" : "Server is running" }

@app.get("/")
def serve():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.post('/chunking')
def chunking(
        doc_path : str = Query(..., description="Enter the document")
):
    job = queue.enqueue(chunk, doc_path)

    return {"status" : "queued", "job_id" : job.id}


@app.get('/chunking/status')
def chunking_status(job_id : str):
    job = queue.fetch_job(job_id=job_id)

    if job is None:
        return {"status" : None}
    
    if job.is_failed:
        return {"status" : "failed"}
    
    if job.is_finished and job.result.get('stored'):
        return {"status" : "chunked"}
    
    return { "status" : job.get_status()}

@app.post('/chat')
def chat(
    query : str = Query(..., description="The chat query of user")
):
    job = queue.enqueue(search_and_ask, query)

    return { "status" : "queued", "job_id" : job.id }


@app.get('/job_status')
def get_result(
    job_id : str = Query(..., description='JOB_ID')
):
    job = queue.fetch_job(job_id=job_id)

    if job is None:
        return {"status" : None}
    
    if job.is_finished:
        return { "status" : "finished", "result" : job.result }

    if job.is_failed:
        return { "status" : "failed", "error" : str(job.exc_info) }
    
    return { "status" : job.get_status() }