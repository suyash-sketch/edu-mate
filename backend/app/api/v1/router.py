from fastapi import APIRouter
from app.api.v1.endpoints import assessments, auth, generation

api_router = APIRouter()

api_router.include_router(auth.router, prefix='/api', tags=['auth'])

api_router.include_router(assessments.router, prefix='/api/assessments', tags=['assessments'])

api_router.include_router(generation.router, tags=["generation"])