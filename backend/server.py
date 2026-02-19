import os
import uuid
import hashlib
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt
from fastapi import FastAPI, File, Query, UploadFile, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .client.rq_client import queue
from .queue.chat import search_and_ask
from .queue.doc_chunking import chunk

# --- DATABASE IMPORTS ---
from .database import engine, get_db
from . import models, schemas

app = FastAPI()

# Create Postgres tables if they don't exist
models.Base.metadata.create_all(bind=engine)

# --- SECURITY & JWT CONFIGURATION ---
SECRET_KEY = "super_secret_edumate_key"  # Keep this safe!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours for normal login
RESET_TOKEN_EXPIRE_MINUTES = 15     # 15 minutes to reset password

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    Bcrypt has a 72-byte limit, so we hash longer passwords first using SHA256.
    """
    # Convert password to bytes
    password_bytes = password.encode('utf-8')
    
    # Bcrypt has a 72-byte limit, so if password is longer, hash it first
    if len(password_bytes) > 72:
        password_bytes = hashlib.sha256(password_bytes).digest()
    
    # Generate salt and hash password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a bcrypt hash.
    """
    # Convert password to bytes
    password_bytes = plain_password.encode('utf-8')
    
    # If password is longer than 72 bytes, hash it first (same as in get_password_hash)
    if len(password_bytes) > 72:
        password_bytes = hashlib.sha256(password_bytes).digest()
    
    # Verify password
    return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))

def create_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- AUTHENTICATION ROUTES ---

@app.post("/api/signup", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(name=user.name, email=user.email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Generate the JWT Token granting access
    access_token = create_token(
        data={"sub": user.email}, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/me", response_model=schemas.UserResponse)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/api/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    # Security Best Practice: Never reveal if an email exists in your DB to prevent scraping
    if not user:
        return {"message": "If the email exists, a reset link has been sent."}
    
    # Generate a temporary reset token
    reset_token = create_token(
        data={"sub": user.email, "type": "reset"}, 
        expires_delta=timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    )
    
    # Because we don't have an email server yet, we will print the link to the terminal!
    reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
    print(f"\n\n*** PASSWORD RESET LINK FOR {user.email} ***\n{reset_link}\n\n")
    
    return {"message": "If the email exists, a reset link has been sent."}

@app.post("/api/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        # Verify the token hasn't expired and wasn't tampered with
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if email is None or token_type != "reset":
            raise HTTPException(status_code=400, detail="Invalid token")
            
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid token")
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Update the password
    user.password_hash = get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password has been reset successfully"}


# --- EXISTING AI ROUTES ---

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")
FRONTEND_DIST_DIR = os.path.join(FRONTEND_DIR, "dist")
LEGACY_HTML_PATH = os.path.join(BASE_DIR, "..", "index2.html")
UPLOADS_DIR = os.path.join(BASE_DIR, "..", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

def _has_react_build() -> bool:
    return os.path.isdir(FRONTEND_DIST_DIR) and os.path.isfile(os.path.join(FRONTEND_DIST_DIR, "index.html"))

@app.post('/chunking')
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


@app.get('/chunking/status')
def chunking_status(job_id : str):
    job = queue.fetch_job(job_id=job_id)

    if job is None:
        return {"status" : None}
    
    if job.is_failed:
        return {"status" : "failed", "error": str(job.exc_info)}
    
    if job.is_finished and job.result.get('stored'):
        return {"status" : "chunked", "result": job.result}
    
    return { "status" : job.get_status()}

@app.post('/chat')
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


# Serve frontend (built React preferred; fallback to legacy HTML)
if _has_react_build():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST_DIR, html=True), name="frontend")
else:
    @app.get("/")
    def serve():
        if os.path.isfile(LEGACY_HTML_PATH):
            return FileResponse(LEGACY_HTML_PATH)
        return { "status" : "Server is running", "frontend" : "not built (run: cd frontend && npm run build)" }