# EduMate

An AI-powered educational assessment platform that generates question papers from your study material using Bloom's Taxonomy.

### Demo
<video src="edumate_new_demo.mp4" controls width="100%"></video>

[![EduMate Demo](https://img.youtube.com/vi/yZfxlsSSA7Q/0.jpg)](https://www.youtube.com/watch?v=yZfxlsSSA7Q)

## Documentation

For detailed documentation, visit: [EduMate Docs](https://suyash-sketch-edu-mate-68.mintlify.app/introduction)


## Features

- **PDF Upload & Indexing** — Upload study material (PDFs) which are chunked and indexed into a vector database
- **AI-Powered Question Generation** — Generates MCQs aligned to Bloom's Taxonomy levels (Remember, Understand, Apply, Analyze, Evaluate, Create)
- **User Authentication** — Signup, login, and password reset with JWT-based auth
- **Assessment History** — Save and revisit previously generated assessments
- **Export** — Download generated question papers as PDF or DOCX

## Tech Stack

**Backend:** FastAPI · Python · Google Gemini · LangChain · Qdrant (Vector DB) · Redis + RQ (Job Queue) · PostgreSQL · JWT Auth

**Frontend:** React · Vite · Tailwind CSS

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL
- Redis
- Qdrant

### Backend

```bash path=null start=null
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Add your GEMINI_API_KEY and database credentials to .env

# Start the server
python -m backend.main
```

### Frontend

```bash path=null start=null
cd frontend
npm install
npm run dev
```

### Start Containers

```bash
cd ~/postgresdb
docker compose up -d

cd ~/qdrant  
docker compose up -d

cd ~/valkey
docker compose up -d
```

### Start llama cpp servers

```bash

# run the qwen embedding model  

llama serve \
  -hf Qwen/Qwen3-Embedding-0.6B-GGUF:Q8_0 \
  --embeddings \
  --pooling last \
  --device none \
  -ngl 0 \
  -c 4096 \
  -np 1 \
  -t 6 \
  -tb 6 \
  -b 512 \
  -ub 256 \
  --port 8081

# run the gemma-4 reasoning model

cd ~/miniproject/llama-cpp-turboquant

./build/bin/llama-server \
  -m "/run/media/suyashk13/New Volume/gemma-unified/gemma-4-E4B-it-qat-UD-Q4_K_XL.gguf" \
  --device CUDA0 \
  -ngl all \
  -fa on \
  -c 4096 \
  -np 1 \
  --cache-type-k q8_0 \
  --cache-type-v turbo4 \
  --reasoning off \
  --jinja \
  --host 127.0.0.1 \
  --port 8080

```