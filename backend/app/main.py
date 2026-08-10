from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import FRONTEND_DIST_DIR, LEGACY_HTML_PATH
from app.db.database import Base, engine
import app.models

app = FastAPI(title='EduMate API')

# Register database tables if they do not already exists
Base.metadata.create_all(bind=engine)

# Add all auth, assessments, PDF, generation endpoints
app.include_router(api_router)

# Serve the built React Frontend in production
if (FRONTEND_DIST_DIR / "index.html").is_file():
    app.mount(
        "/",
        StaticFiles(directory=str(FRONTEND_DIST_DIR), html=True),
        name="frontend",
    )
else:
    @app.get("/")
    def serve():
        if LEGACY_HTML_PATH.is_file():
            return FileResponse(LEGACY_HTML_PATH)

        return {
            "status": "Server is running",
            "frontend": "not built (run: cd frontend && npm run build)",
        }