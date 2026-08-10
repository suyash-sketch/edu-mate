import os
import uuid

from fastapi import APIRouter, File, Query, UploadFile

from app.core.config import UPLOADS_DIR
from app.core.rq_client import queue
from app.services.document_indexing import chunk
from app.services.question_generation.mcq import search_and_ask

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter()

@router.post('/chunking')
def chunking(
        doc_path: str | None = Query(None, description="(Legacy) Path to local PDF or folder"),
        file: UploadFile | None = File(None, description="Upload a PDF to be chunked/indexed"),
):
    collection_name = f"edu_mate_{uuid.uuid4().hex}"

    if file is not None:
        filename = (file.filename or "upload.pdf").replace("\\", "_").replace("/", "_")
        if not filename.lower().endswith(".pdf"):
            filename = f"{filename}.pdf"
        save_path = os.path.join(UPLOADS_DIR, f"{uuid.uuid4().hex}_{filename}")

        with open(save_path, "wb") as f:
            f.write(file.file.read())

        job = queue.enqueue(chunk, [save_path], collection_name, job_timeout = 600)
        return {"status": "queued", "job_id": job.id, "collection_name": collection_name}

    if doc_path:
        job = queue.enqueue(chunk, doc_path, collection_name)
        return {"status": "queued", "job_id": job.id, "collection_name": collection_name}

    return {"status": "failed", "error": "Provide either 'file' (upload) or 'doc_path' (legacy)."}


@router.get('/chunking/status')
def chunking_status(job_id : str):
    job = queue.fetch_job(job_id=job_id)

    if job is None:
        return {"status" : None}
    
    if job.is_failed:
        return {"status" : "failed", "error": str(job.exc_info)}
    
    if job.is_finished and job.result.get('stored'):
        return {"status" : "chunked", "result": job.result}
    
    return { "status" : job.get_status()}

@router.post('/chat')
def chat(
    query : str = Query(..., description="The chat query of user"),
    collection_name: str = Query(..., description="Qdrant collection name to search"),
    blooms_requirements: str = Query(
        "5 remember, 3 understand, 4 apply, 3 analyze, 2 evaluate, 3 create",
        description="Bloom's taxonomy requirements string"
    ),
):
    job = queue.enqueue(search_and_ask, query, collection_name, blooms_requirements, job_timeout = 600)
    return { "status" : "queued", "job_id" : job.id }


@router.get('/job_status')
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