import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas

# These must match server.py exactly
SECRET_KEY = "super_secret_edumate_key"
ALGORITHM = "HS256"

router = APIRouter(prefix="/api/assessments", tags=["assessments"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ─── Helper: count MCQs safely ────────────────────────────────────────────────
def _count_questions(content_json) -> int:
    try:
        return len(content_json.get("mcqs", []))
    except Exception:
        return 0


# ─── GET /api/assessments/history ─────────────────────────────────────────────
@router.get("/history", response_model=List[schemas.AssessmentHistoryItem])
def get_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assessments = (
        db.query(models.Assessment)
        .filter(models.Assessment.user_id == current_user.id)
        .order_by(models.Assessment.created_at.desc())
        .all()
    )

    return [
        schemas.AssessmentHistoryItem(
            id=a.id,
            chapter_name=a.chapter_name,
            questions=_count_questions(a.content_json),
            created_at=a.created_at,
            status="completed",
        )
        for a in assessments
    ]


# ─── GET /api/assessments/{assessment_id} ─────────────────────────────────────
@router.get("/{assessment_id}", response_model=schemas.AssessmentDetail)
def get_assessment(
    assessment_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assessment = (
        db.query(models.Assessment)
        .filter(
            models.Assessment.id == assessment_id,
            models.Assessment.user_id == current_user.id,
        )
        .first()
    )

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    return schemas.AssessmentDetail(
        id=assessment.id,
        chapter_name=assessment.chapter_name,
        content=assessment.content_json,
    )
