from fastapi import FastAPI, Query
from .client.rq_client import queue
from .queue.chat import search_and_ask
app = FastAPI()

@app.get('/')
def root():
    return { "status" : "Server is running" }

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