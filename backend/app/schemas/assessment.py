from pydantic import BaseModel
from datetime import datetime
from typing import Any

class AssessmentHistoryItem(BaseModel):
    id: int
    chapter_name: str
    questions: int
    created_at: datetime
    status: str = "completed"

    class Config:
        from_attributes = True

class AssessmentDetail(BaseModel):
    id: int
    chapter_name: str
    content: Any

    class Config:
        from_attributes = True

class SaveAssessmentRequest(BaseModel):
    chapter_name: str
    bloom_factors: dict
    content_json: Any