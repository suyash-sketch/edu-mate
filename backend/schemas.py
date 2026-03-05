from pydantic import BaseModel
from datetime import datetime
from typing import Any

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# ── Assessment schemas ────────────────────────────────────────────────────────

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
