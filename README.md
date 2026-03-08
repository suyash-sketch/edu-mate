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

